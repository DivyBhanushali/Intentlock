"""
INTENTLOCK – Exception hierarchy.

Every exception carries structured context attributes so that callers
can programmatically inspect what went wrong without parsing messages.
All exceptions inherit from :class:`IntentLockError`.
"""

from __future__ import annotations

from typing import Any


class SictackError(Exception):
    """Base exception for all SICTACK errors."""

    def __init__(self, message: str = "", **ctx: Any) -> None:
        super().__init__(message)
        self.message: str = message
        # Store every keyword argument as an instance attribute for inspection.
        for attr_name, attr_value in ctx.items():
            setattr(self, attr_name, attr_value)

    def __repr__(self) -> str:  # pragma: no cover
        extras = {
            k: v
            for k, v in self.__dict__.items()
            if k != "message" and not k.startswith("_")
        }
        if extras:
            pairs = ", ".join(f"{k}={v!r}" for k, v in extras.items())
            return f"{self.__class__.__name__}({self.message!r}, {pairs})"
        return f"{self.__class__.__name__}({self.message!r})"


# Backward compatibility alias
IntentLockError = SictackError


# ---------------------------------------------------------------------------
# Policy errors
# ---------------------------------------------------------------------------

class PolicyError(IntentLockError):
    """Raised when no valid policy is available or the policy itself is invalid."""

    def __init__(
        self,
        message: str = "Policy evaluation failed",
        *,
        policy_id: str = "",
        tool_name: str = "",
    ) -> None:
        super().__init__(message, policy_id=policy_id, tool_name=tool_name)
        self.policy_id: str = policy_id
        self.tool_name: str = tool_name


# ---------------------------------------------------------------------------
# Tool registry errors
# ---------------------------------------------------------------------------

class ToolNotRegisteredError(IntentLockError):
    """Raised when the requested tool is not in the registry."""

    def __init__(
        self,
        message: str = "Tool not registered",
        *,
        tool_name: str = "",
    ) -> None:
        super().__init__(message, tool_name=tool_name)
        self.tool_name: str = tool_name


# ---------------------------------------------------------------------------
# Permission errors
# ---------------------------------------------------------------------------

class PermissionDeniedError(IntentLockError):
    """Raised when a policy explicitly denies the requested action."""

    def __init__(
        self,
        message: str = "Permission denied",
        *,
        tool_name: str = "",
        policy_id: str = "",
        action_hash: str = "",
        reason: str = "",
    ) -> None:
        super().__init__(
            message,
            tool_name=tool_name,
            policy_id=policy_id,
            action_hash=action_hash,
            reason=reason,
        )
        self.tool_name: str = tool_name
        self.policy_id: str = policy_id
        self.action_hash: str = action_hash
        self.reason: str = reason


# ---------------------------------------------------------------------------
# Approval errors
# ---------------------------------------------------------------------------

class ApprovalRequiredError(IntentLockError):
    """
    Raised when the action requires human approval before execution.

    The caller should present ``approval_id`` to a human reviewer.
    After approval, re-submit via :meth:`ActionGateway.execute_with_approval`.
    """

    def __init__(
        self,
        message: str = "Approval required",
        *,
        approval_id: str = "",
        action_hash: str = "",
        tool_name: str = "",
    ) -> None:
        super().__init__(
            message,
            approval_id=approval_id,
            action_hash=action_hash,
            tool_name=tool_name,
        )
        self.approval_id: str = approval_id
        self.action_hash: str = action_hash
        self.tool_name: str = tool_name


class ApprovalArgumentMismatchError(IntentLockError):
    """Raised when the arguments passed to execute() do not match the approved ones."""

    def __init__(
        self,
        message: str = "Arguments do not match approved action",
        *,
        approval_id: str = "",
        expected_hash: str = "",
        actual_hash: str = "",
    ) -> None:
        super().__init__(
            message,
            approval_id=approval_id,
            expected_hash=expected_hash,
            actual_hash=actual_hash,
        )
        self.approval_id = approval_id
        self.expected_hash = expected_hash
        self.actual_hash = actual_hash


class PolicyVersionMismatchError(IntentLockError):
    """Raised when an approval token was created under a different policy version."""

    def __init__(
        self,
        message: str = "Policy version mismatch",
        *,
        approval_id: str = "",
        approval_policy_version: int = 1,
        current_policy_version: int = 1,
    ) -> None:
        super().__init__(
            message,
            approval_id=approval_id,
            approval_policy_version=approval_policy_version,
            current_policy_version=current_policy_version,
        )
        self.approval_id = approval_id
        self.approval_policy_version = approval_policy_version
        self.current_policy_version = current_policy_version


class ApprovalExpiredError(IntentLockError):
    """Raised when the approval token has passed its expiry time."""

    def __init__(
        self,
        message: str = "Approval expired",
        *,
        approval_id: str = "",
    ) -> None:
        super().__init__(message, approval_id=approval_id)
        self.approval_id: str = approval_id


class ApprovalReplayError(IntentLockError):
    """Raised when the approval token has already been consumed (single-use)."""

    def __init__(
        self,
        message: str = "Approval already consumed",
        *,
        approval_id: str = "",
    ) -> None:
        super().__init__(message, approval_id=approval_id)
        self.approval_id: str = approval_id


class ApprovalMismatchError(IntentLockError):
    """Raised when the approval token's action hash does not match the submitted action."""

    def __init__(
        self,
        message: str = "Approval action hash mismatch",
        *,
        approval_id: str = "",
        expected_hash: str = "",
        actual_hash: str = "",
    ) -> None:
        super().__init__(
            message,
            approval_id=approval_id,
            expected_hash=expected_hash,
            actual_hash=actual_hash,
        )
        self.approval_id: str = approval_id
        self.expected_hash: str = expected_hash
        self.actual_hash: str = actual_hash


# ---------------------------------------------------------------------------
# Audit errors
# ---------------------------------------------------------------------------

class AuditError(IntentLockError):
    """Raised when audit persistence fails."""

    def __init__(
        self,
        message: str = "Audit recording failed",
        *,
        event_id: str = "",
    ) -> None:
        super().__init__(message, event_id=event_id)
        self.event_id: str = event_id


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------

class ArgumentValidationError(IntentLockError):
    """Raised when tool arguments fail JSON-schema validation."""

    def __init__(
        self,
        message: str = "Argument validation failed",
        *,
        tool_name: str = "",
        errors: list[str] | None = None,
    ) -> None:
        super().__init__(message, tool_name=tool_name, errors=errors or [])
        self.tool_name: str = tool_name
        self.errors: list[str] = errors or []


# ---------------------------------------------------------------------------
# Replay detection & Authorization Expiry
# ---------------------------------------------------------------------------

class ReplayDetectedError(IntentLockError):
    """Raised when the same action hash has already been executed."""

    def __init__(
        self,
        message: str = "Replay detected: action already executed",
        *,
        action_hash: str = "",
        tool_name: str = "",
    ) -> None:
        super().__init__(message, action_hash=action_hash, tool_name=tool_name)
        self.action_hash: str = action_hash
        self.tool_name: str = tool_name


class AuthorizationExpiredError(IntentLockError):
    """Raised when an authorization decision permit has expired prior to execution."""

    def __init__(
        self,
        message: str = "Authorization permit has expired",
        *,
        decision_id: str = "",
        tool_name: str = "",
        expires_at: str = "",
    ) -> None:
        super().__init__(message, decision_id=decision_id, tool_name=tool_name, expires_at=expires_at)
        self.decision_id: str = decision_id
        self.tool_name: str = tool_name
        self.expires_at: str = expires_at


class ParameterAuthorizationError(PermissionDeniedError):
    """Raised when tool arguments violate parameter-level authorization rules."""

    def __init__(
        self,
        message: str = "Action denied: parameter authorization constraint violated",
        *,
        tool_name: str = "",
        parameter: str = "",
        constraint: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(message, tool_name=tool_name, reason="PARAMETER_AUTHORIZATION_VIOLATION", **kwargs)
        self.parameter = parameter
        self.constraint = constraint


class PolicyVersionMismatchError(PolicyError):
    """Raised when the policy version changed between authorization and execution."""

    def __init__(
        self,
        message: str = "Policy version mismatch between authorization and execution",
        *,
        expected_version: int = 1,
        actual_version: int = 1,
        approval_id: str = "",
        approval_policy_version: Optional[int] = None,
        current_policy_version: Optional[int] = None,
        stale_policy_version: Optional[int] = None,
        tool_name: str = "",
        policy_id: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(message, policy_id=policy_id, tool_name=tool_name)
        self.expected_version = expected_version or approval_policy_version or 1
        self.actual_version = actual_version or current_policy_version or 1
        self.approval_id = approval_id
        self.approval_policy_version = approval_policy_version or expected_version
        self.current_policy_version = current_policy_version or actual_version
        self.stale_policy_version = stale_policy_version or self.expected_version


class SessionSuspendedError(IntentLockError):
    """Raised when an action is dispatched to a suspended, quarantined, or terminated session."""

    def __init__(
        self,
        message: str = "Action halted: session is suspended or quarantined",
        *,
        session_id: str = "",
        state: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(message, session_id=session_id, state=state, **kwargs)
        self.session_id = session_id
        self.state = state


class SessionTerminalError(IntentLockError):
    """Raised when an action is dispatched to a permanently terminated session."""

    def __init__(
        self,
        message: str = "Action halted: session is in permanent terminal state",
        *,
        session_id: str = "",
        state: str = "TERMINAL",
        **kwargs: Any,
    ) -> None:
        super().__init__(message, session_id=session_id, state=state, **kwargs)
        self.session_id = session_id
        self.state = state


class ExecutionBudgetExceededError(PermissionDeniedError):
    """Raised when an execution exceeds the allotted budget for the task or parent context."""

    def __init__(
        self,
        message: str = "Task execution budget exceeded",
        *,
        tool_name: str = "",
        policy_id: str = "",
        action_hash: str = "",
        reason: str = "EXECUTION_BUDGET_EXCEEDED",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            tool_name=tool_name,
            policy_id=policy_id,
            action_hash=action_hash,
            reason=reason,
            **kwargs,
        )


PolicyViolationError = PermissionDeniedError


# ---------------------------------------------------------------------------
# Multi-Agent Delegation & Hierarchy Errors (Phase 4B)
# ---------------------------------------------------------------------------

class DelegationError(IntentLockError):
    """Base exception for all multi-agent delegation errors."""

    def __init__(
        self,
        message: str = "Multi-agent delegation authorization failed",
        *,
        delegation_id: str = "",
        parent_agent_id: str = "",
        child_agent_id: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            delegation_id=delegation_id,
            parent_agent_id=parent_agent_id,
            child_agent_id=child_agent_id,
            **kwargs,
        )
        self.delegation_id = delegation_id
        self.parent_agent_id = parent_agent_id
        self.child_agent_id = child_agent_id


class DelegationPrivilegeEscalationError(PermissionDeniedError):
    """Raised when an agent attempts to delegate permissions it does not hold or when a child attempts escalation."""

    def __init__(
        self,
        message: str = "Privilege escalation: child cannot receive or execute permissions exceeding parent authority",
        *,
        delegation_id: str = "",
        parent_agent_id: str = "",
        child_agent_id: str = "",
        unauthorized_permissions: list[str] | None = None,
        tool_name: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            reason="DELEGATION_PRIVILEGE_ESCALATION",
            tool_name=tool_name,
        )
        self.delegation_id = delegation_id
        self.parent_agent_id = parent_agent_id
        self.child_agent_id = child_agent_id
        self.unauthorized_permissions = unauthorized_permissions or []


class ConfusedDeputyError(PermissionDeniedError):
    """Raised when an agent is invoked as an unauthorized or confused deputy."""

    def __init__(
        self,
        message: str = "Confused deputy prevented: calling principal lacks authority over the deputy agent or task",
        *,
        caller_agent_id: str = "",
        deputy_agent_id: str = "",
        delegation_id: str = "",
        tool_name: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            reason="CONFUSED_DEPUTY_DETECTED",
            tool_name=tool_name,
        )
        self.caller_agent_id = caller_agent_id
        self.deputy_agent_id = deputy_agent_id
        self.delegation_id = delegation_id


class DelegationExpiredError(PermissionDeniedError):
    """Raised when attempting to execute with an expired delegation token."""

    def __init__(
        self,
        message: str = "Delegated authority has expired",
        *,
        delegation_id: str = "",
        expired_at: str = "",
        tool_name: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            reason="DELEGATION_EXPIRED",
            tool_name=tool_name,
        )
        self.delegation_id = delegation_id
        self.expired_at = expired_at


class DelegationRevokedError(PermissionDeniedError):
    """Raised when attempting to execute with a revoked delegation token."""

    def __init__(
        self,
        message: str = "Delegated authority has been revoked",
        *,
        delegation_id: str = "",
        revocation_reason: str = "",
        tool_name: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            reason="DELEGATION_REVOKED",
            tool_name=tool_name,
        )
        self.delegation_id = delegation_id
        self.revocation_reason = revocation_reason


class MaxDelegationDepthExceededError(PermissionDeniedError):
    """Raised when the delegation hierarchy exceeds the configured maximum depth."""

    def __init__(
        self,
        message: str = "Maximum delegation depth exceeded in multi-agent hierarchy",
        *,
        current_depth: int = 0,
        max_depth: int = 3,
        tool_name: str = "",
        **kwargs: Any,
    ) -> None:
        super().__init__(
            message,
            reason="MAX_DELEGATION_DEPTH_EXCEEDED",
            tool_name=tool_name,
        )
        self.current_depth = current_depth
        self.max_depth = max_depth


# ---------------------------------------------------------------------------
# Inter-agent communication errors (Phase 4C)
# ---------------------------------------------------------------------------

class MessageError(SictackError):
    """Base exception for all inter-agent communication failures."""
    def __init__(self, message: str, message_id: str = "", sender: str = "", recipient: str = ""):
        super().__init__(message)
        self.message_id = message_id
        self.sender = sender
        self.recipient = recipient


class MessageAuthenticationError(MessageError):
    """Raised when an inter-agent message fails cryptographic signature verification."""
    pass


class MessageReplayError(MessageError):
    """Raised when an inter-agent message reuses an already-observed nonce."""
    pass


class ExpiredMessageError(MessageError):
    """Raised when an inter-agent message has passed its temporal validity expiration."""
    pass


class UnauthorizedCommunicationError(MessageError):
    """Raised when inter-agent communication violates tenant isolation or channel policies."""
    pass

