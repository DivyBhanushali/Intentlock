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

from intentlock.approval import ApprovalService
from intentlock.audit import AuditService
from intentlock.exceptions import (
    ApprovalRequiredError,
    ArgumentValidationError,
    AuditError,
    PermissionDeniedError,
    PolicyError,
    ReplayDetectedError,
)
from intentlock.logger import get_logger
from intentlock.models import (
    AuditEvent,
    Config,
    Decision,
    DecisionVerdict,
    Policy,
    ToolCall,
)
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry
from intentlock.risk_engine import RiskEngine

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

        Returns
        -------
        Any
            The return value of the tool handler.

        Raises
        ------
        PermissionDeniedError
            If the policy denies the action.
        ApprovalRequiredError
            If the policy requires human approval first.
        PolicyError
            On internal errors when ``fail_closed`` is ``True``.
        """
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

        # ---- Policy evaluation -----------------------------------------
        try:
            decision = self._policy_engine.evaluate(
                tool_call, effective_policy, self._registry
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
            approval_req = self._approval_service.create_request(tool_call)
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
    ) -> Any:
        """
        Execute *tool_call* using a pre-approved approval token.

        1. Validate and consume the approval (checks hash, expiry, single-use).
        2. Re-evaluate policy to confirm the tool still requires approval.
        3. Execute handler and record audit.
        """
        effective_policy = policy or self._config.default_policy
        action_hash = tool_call.canonical_hash()

        # ---- Consume approval (validates hash, expiry, single-use) -----
        self._approval_service.consume(approval_id, action_hash)

        # ---- Re-evaluate policy ----------------------------------------
        try:
            decision = self._policy_engine.evaluate(
                tool_call, effective_policy, self._registry
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
