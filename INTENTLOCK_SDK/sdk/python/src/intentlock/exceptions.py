"""
INTENTLOCK – Exception hierarchy.

Every exception carries structured context attributes so that callers
can programmatically inspect what went wrong without parsing messages.
All exceptions inherit from :class:`IntentLockError`.
"""

from __future__ import annotations

from typing import Any


class IntentLockError(Exception):
    """Base exception for all INTENTLOCK errors."""

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
# Replay detection
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
