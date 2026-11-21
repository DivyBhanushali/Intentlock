"""
INTENTLOCK – Action Gateway (Runtime Interceptor).

The :class:`ActionGateway` is the **heart** of the security enforcement
layer.  Every tool invocation flows through it:

1. Risk assessment  (informational)
2. Policy evaluation (authoritative – ALLOW / DENY / REQUIRE_APPROVAL)
3. Approval validation (when executing with a pre-approved token)
4. Tool handler execution (only after all checks pass)
5. Audit recording (always, regardless of outcome)

The gateway **never** exposes the raw handler callable.
"""

from __future__ import annotations

import threading
from typing import Any

from sictack.approval import ApprovalService
from sictack.audit import AuditService
from sictack.exceptions import (
    ApprovalRequiredError,
    ArgumentValidationError,
    AuditError,
    AuthorizationExpiredError,
    PermissionDeniedError,
    PolicyError,
    PolicyVersionMismatchError,
    ReplayDetectedError,
)
from sictack.logger import get_logger
from sictack.models import (
    AuditEvent,
    Config,
    Decision,
    DecisionVerdict,
    Policy,
    ToolCall,
)
from sictack.policy_engine import PolicyEngine
from sictack.registry import ToolRegistry
from sictack.risk_engine import RiskEngine
from sictack.sentinel.models import TaskSession, TaskSessionState
from sictack.sentinel.session import (
    TaskSessionManager,
    TaskSessionSuspendedError,
    TaskSessionTerminalError,
)

_log = get_logger(__name__)


class ActionGateway:
    """
    Central runtime interceptor.

    All tool calls **must** pass through :meth:`execute` (or
    :meth:`execute_with_approval` for pre-approved actions).
    """

    def __init__(
        self,
        registry: ToolRegistry,
        policy_engine: PolicyEngine,
        risk_engine: RiskEngine,
        approval_service: ApprovalService,
        audit_service: AuditService,
        config: Config,
    ) -> None:
        self._registry = registry
        self._policy_engine = policy_engine
        self._risk_engine = risk_engine
        self._approval_service = approval_service
        self._audit_service = audit_service
        self._config = config

        self._lock = threading.Lock()
        self._executed_hashes: set[str] = set()

    @property
    def approval_service(self) -> ApprovalService:
        return self._approval_service

    @property
    def audit_service(self) -> AuditService:
        return self._audit_service

    @property
    def registry(self) -> ToolRegistry:
        return self._registry

    @property
    def policy_engine(self) -> PolicyEngine:
        return self._policy_engine

    @property
    def risk_engine(self) -> RiskEngine:
        return self._risk_engine

    # ------------------------------------------------------------------
    # Primary execution path
    # ------------------------------------------------------------------

    def execute(
        self,
        tool_call: ToolCall,
        policy: Policy | None = None,
        session: TaskSession | None = None,
    ) -> Any:
        """
        Evaluate and (if allowed) execute *tool_call*.

        Parameters
        ----------
        tool_call:
            The proposed tool invocation.
        policy:
            Explicit policy to evaluate against.  Falls back to
            ``config.default_policy`` if ``None``.
        session:
            Optional SENTINEL TaskSession enforcing behavioral runtime boundaries.

        Returns
        -------
        Any
            The return value of the tool handler.

        Raises
        ------
        PermissionDeniedError
            If the policy denies the action or session scope is violated.
        ApprovalRequiredError
            If the policy requires human approval first.
        PolicyError
            On internal errors when ``fail_closed`` is ``True``.
        """
        if session is not None:
            if session.is_suspended():
                raise PermissionDeniedError(
                    f"Session is suspended: execution blocked at boundary ({session.suspension_reason or 'Policy suspension'})",
                    tool_name=tool_call.tool_name,
                    reason="SESSION_SUSPENDED",
                )
            if session.is_terminal():
                raise PermissionDeniedError(
                    f"Session is in terminal state: {session.state.value}",
                    tool_name=tool_call.tool_name,
                    reason="SESSION_TERMINAL",
                )
            if session.authorized_scope.enforce_strict_scope and session.authorized_scope.allowed_tools:
                if tool_call.tool_name not in session.authorized_scope.allowed_tools:
                    raise PermissionDeniedError(
                        f"Tool '{tool_call.tool_name}' not permitted in session authorized scope",
                        tool_name=tool_call.tool_name,
                        reason="SCOPE_VIOLATION",
                    )

        effective_policy = policy or self._config.default_policy

        # ---- Risk assessment (informational) ---------------------------
        risk_score = 0.0
        risk_level = None
        try:
            if self._registry.has(tool_call.tool_name):
                tool_desc, _ = self._registry.get(tool_call.tool_name)
                risk_score, risk_level = self._risk_engine.assess(tool_call, tool_desc)
        except Exception:  # noqa: BLE001
            # Risk is advisory; failure is not fatal.
            pass

        decision_ttl = getattr(self._config, "decision_ttl_seconds", 300)

        # ---- Policy evaluation -----------------------------------------
        try:
            decision = self._policy_engine.evaluate(
                tool_call, effective_policy, self._registry, ttl_seconds=decision_ttl
            )
        except Exception as exc:
            if self._config.fail_closed:
                decision = Decision(
                    verdict=DecisionVerdict.DENY,
                    tool_name=tool_call.tool_name,
                    reason=f"INTERNAL_ERROR: {exc}",
                    action_hash=tool_call.canonical_hash(),
                    agent_id=tool_call.agent_id,
                )
            else:
                raise

        # Enrich decision with risk info.
        decision.risk_score = risk_score
        if risk_level is not None:
            decision.risk_level = risk_level

        # ---- Branch on verdict -----------------------------------------
        if decision.verdict == DecisionVerdict.DENY:
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=None,
                execution_error="",
                approval_id="",
            )
            raise PermissionDeniedError(
                f"Action denied: {decision.reason}",
                tool_name=tool_call.tool_name,
                policy_id=decision.policy_id,
                action_hash=decision.action_hash,
                reason=decision.reason,
            )

        if decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
            approval_req = self._approval_service.create_request(
                tool_call,
                policy_version=getattr(effective_policy, "version", 1) if effective_policy else 1,
                task_id=getattr(tool_call, "intent_id", ""),
            )
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=None,
                execution_error="",
                approval_id=approval_req.approval_id,
            )
            raise ApprovalRequiredError(
                "Action requires human approval",
                approval_id=approval_req.approval_id,
                action_hash=decision.action_hash,
                tool_name=tool_call.tool_name,
            )

        # ---- ALLOW: execute the handler --------------------------------
        return self._execute_handler(
            tool_call=tool_call,
            decision=decision,
            approval_id="",
        )

    # ------------------------------------------------------------------
    # Approval-based execution path
    # ------------------------------------------------------------------

    def execute_with_approval(
        self,
        tool_call: ToolCall,
        approval_id: str,
        policy: Policy | None = None,
        session: TaskSession | None = None,
    ) -> Any:
        """
        Execute *tool_call* using a pre-approved approval token.

        1. Check SENTINEL session constraints (fail closed if suspended).
        2. Validate and consume the approval (checks hash, expiry, single-use).
        3. Re-evaluate policy to confirm the tool still requires approval.
        4. Execute handler and record audit.
        """
        if session is not None:
            if session.is_suspended():
                raise PermissionDeniedError(
                    f"Session is suspended: execution blocked at boundary ({session.suspension_reason or 'Policy suspension'})",
                    tool_name=tool_call.tool_name,
                    reason="SESSION_SUSPENDED",
                )
            if session.is_terminal():
                raise PermissionDeniedError(
                    f"Session is in terminal state: {session.state.value}",
                    tool_name=tool_call.tool_name,
                    reason="SESSION_TERMINAL",
                )
            if session.authorized_scope.enforce_strict_scope and session.authorized_scope.allowed_tools:
                if tool_call.tool_name not in session.authorized_scope.allowed_tools:
                    raise PermissionDeniedError(
                        f"Tool '{tool_call.tool_name}' not permitted in session authorized scope",
                        tool_name=tool_call.tool_name,
                        reason="SCOPE_VIOLATION",
                    )

        effective_policy = policy or self._config.default_policy
        action_hash = tool_call.canonical_hash()
        decision_ttl = getattr(self._config, "decision_ttl_seconds", 300)

        # ---- Validate policy version binding before consumption --------
        req = self._approval_service.get(approval_id)
        current_policy_version = getattr(effective_policy, "version", 1) if effective_policy else 1
        if req.policy_version != current_policy_version:
            raise PolicyVersionMismatchError(
                f"Approval was issued under policy version {req.policy_version}, but current active policy version is {current_policy_version}",
                expected_version=req.policy_version,
                actual_version=current_policy_version,
            )

        # ---- Consume approval (validates hash, expiry, single-use) -----
        self._approval_service.consume(approval_id, action_hash)

        # ---- Re-evaluate policy ----------------------------------------
        try:
            decision = self._policy_engine.evaluate(
                tool_call, effective_policy, self._registry, ttl_seconds=decision_ttl
            )
        except Exception as exc:
            if self._config.fail_closed:
                decision = Decision(
                    verdict=DecisionVerdict.DENY,
                    tool_name=tool_call.tool_name,
                    reason=f"INTERNAL_ERROR: {exc}",
                    action_hash=action_hash,
                    agent_id=tool_call.agent_id,
                )
            else:
                raise

        # For approval-path, both ALLOW and REQUIRE_APPROVAL are acceptable
        # (the approval already authorises REQUIRE_APPROVAL tools).
        if decision.verdict == DecisionVerdict.DENY:
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=None,
                execution_error="",
                approval_id=approval_id,
            )
            raise PermissionDeniedError(
                f"Action denied even with approval: {decision.reason}",
                tool_name=tool_call.tool_name,
                policy_id=decision.policy_id,
                action_hash=action_hash,
                reason=decision.reason,
            )

        # Enrich with risk info.
        try:
            if self._registry.has(tool_call.tool_name):
                tool_desc, _ = self._registry.get(tool_call.tool_name)
                risk_score, risk_level = self._risk_engine.assess(tool_call, tool_desc)
                decision.risk_score = risk_score
                decision.risk_level = risk_level
        except Exception:  # noqa: BLE001
            pass

        # Override verdict to ALLOW for execution.
        decision.verdict = DecisionVerdict.ALLOW

        return self._execute_handler(
            tool_call=tool_call,
            decision=decision,
            approval_id=approval_id,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _execute_handler(
        self,
        *,
        tool_call: ToolCall,
        decision: Decision,
        approval_id: str,
    ) -> Any:
        """Look up the handler, execute it, and record the audit trail."""
        action_hash = tool_call.canonical_hash()

        # Decision expiry check
        if decision.is_expired():
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=False,
                execution_error="AUTHORIZATION_EXPIRED",
                approval_id=approval_id,
            )
            raise AuthorizationExpiredError(
                f"Authorization decision for tool '{tool_call.tool_name}' has expired.",
                decision_id=decision.decision_id,
                tool_name=tool_call.tool_name,
                expires_at=str(decision.expires_at),
            )

        # Replay detection.
        with self._lock:
            if action_hash in self._executed_hashes:
                self._record_audit(
                    tool_call=tool_call,
                    decision=decision,
                    execution_success=False,
                    execution_error="REPLAY_DETECTED",
                    approval_id=approval_id,
                )
                raise ReplayDetectedError(
                    "This exact action has already been executed",
                    action_hash=action_hash,
                    tool_name=tool_call.tool_name,
                )

        # Retrieve the handler from the registry.
        descriptor, handler = self._registry.get(tool_call.tool_name)

        # TOCTOU Protection: Verify argument integrity against authorization binding
        if decision.action_hash and action_hash != decision.action_hash:
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=False,
                execution_error="ARGUMENT_TAMPERING_DETECTED",
                approval_id=approval_id,
            )
            raise PermissionDeniedError(
                "Execution arguments tampered post-authorization: action hash mismatch",
                tool_name=tool_call.tool_name,
                policy_id=decision.policy_id,
                action_hash=action_hash,
                reason="ARGUMENT_TAMPERING_DETECTED",
            )

        # Validate schema if present
        if descriptor.parameters_schema:
            self._validate_schema(
                arguments=tool_call.arguments,
                schema=descriptor.parameters_schema,
                tool_name=tool_call.tool_name,
                decision=decision,
                tool_call=tool_call,
                approval_id=approval_id,
            )

        # Execute.
        execution_error = ""
        execution_success: bool | None = None
        result: Any = None
        try:
            result = handler(**tool_call.arguments)
            execution_success = True
        except Exception as exc:
            execution_success = False
            execution_error = f"{type(exc).__name__}: {exc}"
            # Record audit before re-raising.
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=False,
                execution_error=execution_error,
                approval_id=approval_id,
            )
            raise

        # Mark the action hash as executed (replay protection).
        with self._lock:
            self._executed_hashes.add(action_hash)

        # Record success audit.
        self._record_audit(
            tool_call=tool_call,
            decision=decision,
            execution_success=True,
            execution_error="",
            approval_id=approval_id,
        )

        return result

    def _record_audit(
        self,
        *,
        tool_call: ToolCall,
        decision: Decision,
        execution_success: bool | None,
        execution_error: str,
        approval_id: str,
    ) -> None:
        """Build and persist an :class:`AuditEvent`."""
        event = AuditEvent(
            agent_id=tool_call.agent_id,
            tool_name=tool_call.tool_name,
            verdict=decision.verdict,
            reason=decision.reason,
            policy_id=decision.policy_id,
            action_hash=decision.action_hash or tool_call.canonical_hash(),
            approval_id=approval_id,
            risk_score=decision.risk_score,
            execution_success=execution_success,
            execution_error=execution_error,
        )

        try:
            self._audit_service.record(event)
        except AuditError:
            if self._config.fail_closed:
                _log.error(
                    "Audit recording failed with fail_closed=True; "
                    "suppressing any execution result",
                    extra={
                        "tool_name": tool_call.tool_name,
                        "agent_id": tool_call.agent_id,
                    },
                )
                raise PermissionDeniedError(
                    "Action blocked: audit recording failed (fail-closed)",
                    tool_name=tool_call.tool_name,
                    reason="AUDIT_FAILURE",
                ) from None
            # If not fail-closed, log and continue.
            _log.warning(
                "Audit recording failed but fail_closed is False; continuing",
                extra={"tool_name": tool_call.tool_name},
            )

    def _validate_schema(
        self,
        *,
        arguments: dict[str, Any],
        schema: dict[str, Any],
        tool_name: str,
        decision: Decision,
        tool_call: ToolCall,
        approval_id: str,
    ) -> None:
        """Validate arguments against schema if configured."""
        errors: list[str] = []
        required = schema.get("required", [])
        for req in required:
            if req not in arguments:
                errors.append(f"Missing required parameter '{req}'")

        properties = schema.get("properties", {})
        type_map = {
            "string": str,
            "integer": int,
            "number": (int, float),
            "boolean": bool,
            "array": list,
            "object": dict,
        }
        for param, spec in properties.items():
            if param in arguments:
                val = arguments[param]
                expected_type_str = spec.get("type")
                if expected_type_str in type_map:
                    expected_type = type_map[expected_type_str]
                    if expected_type_str == "integer" and isinstance(val, bool):
                        errors.append(f"Parameter '{param}' must be an integer, got bool")
                    elif not isinstance(val, expected_type):
                        errors.append(f"Parameter '{param}' must be of type {expected_type_str}")

        if errors:
            err_msg = f"Arguments for '{tool_name}' failed schema validation: {', '.join(errors)}"
            self._record_audit(
                tool_call=tool_call,
                decision=decision,
                execution_success=False,
                execution_error=err_msg,
                approval_id=approval_id,
            )
            raise ArgumentValidationError(
                err_msg,
                tool_name=tool_name,
                errors=errors,
            )
