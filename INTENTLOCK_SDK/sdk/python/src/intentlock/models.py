"""
INTENTLOCK – Core Pydantic models.

These models define the data structures used throughout the SDK:
policies, actions, decisions, approval requests and configuration.
Every field is typed, validated, and documented.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional

from pydantic import BaseModel, Field, field_validator


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class DecisionVerdict(str, Enum):
    """Possible outcomes of a policy evaluation."""
    ALLOW = "ALLOW"
    DENY = "DENY"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


class RiskLevel(str, Enum):
    """Human‑readable risk buckets."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class ApprovalStatus(str, Enum):
    """Lifecycle states of an approval request."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class Policy(BaseModel):
    """
    A single authorization policy that the policy engine evaluates.
    """
    policy_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier for this policy.",
    )
    allowed_permissions: list[str] = Field(
        default_factory=list,
        description="Permissions explicitly granted.",
    )
    denied_permissions: list[str] = Field(
        default_factory=list,
        description="Permissions explicitly denied (takes precedence over allowed).",
    )
    require_approval_permissions: list[str] = Field(
        default_factory=list,
        description="Permissions that require human approval before execution.",
    )
    max_risk_level: RiskLevel = Field(
        default=RiskLevel.MEDIUM,
        description="Maximum tolerated risk level before auto-deny.",
    )
    allowed_resources: list[str] = Field(
        default_factory=list,
        description="Glob patterns for resources this policy can access.",
    )
    allowed_recipients: list[str] = Field(
        default_factory=list,
        description="Allowed target identifiers (emails, user IDs).",
    )
    max_sensitivity: int = Field(
        default=5,
        ge=0,
        le=10,
        description="Sensitivity ceiling (0 = public, 10 = top secret).",
    )
    description: str = Field(
        default="",
        description="Human-readable policy description.",
    )


class ToolCall(BaseModel):
    """
    Represents a single proposed tool invocation by an AI agent.
    This is the *request* that the policy engine evaluates.
    """
    tool_name: str = Field(
        ...,
        min_length=1,
        description="Name of the registered tool to invoke.",
    )
    arguments: dict[str, Any] = Field(
        default_factory=dict,
        description="Arguments the agent wants to pass to the tool.",
    )
    agent_id: str = Field(
        default="default-agent",
        description="Identifier of the calling agent.",
    )
    user_request: str = Field(
        default="",
        description="The original natural-language request from the user (context only, not authorisation).",
    )
    sensitivity: int = Field(
        default=0,
        ge=0,
        le=10,
        description="Declared sensitivity of this action.",
    )
    resource_id: str = Field(
        default="",
        description="Target resource identifier (file, API endpoint, etc.).",
    )
    recipient: str = Field(
        default="",
        description="Target recipient (email, user ID), if applicable.",
    )

    @field_validator("tool_name")
    @classmethod
    def _tool_name_no_whitespace(cls, v: str) -> str:
        if " " in v:
            raise ValueError("tool_name must not contain spaces")
        return v

    def canonical_hash(self) -> str:
        """
        Deterministic SHA-256 hash of the action payload.
        Used for approval binding and replay protection.
        """
        payload = json.dumps(
            {
                "tool_name": self.tool_name,
                "arguments": self.arguments,
                "agent_id": self.agent_id,
                "sensitivity": self.sensitivity,
                "resource_id": self.resource_id,
                "recipient": self.recipient,
            },
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(payload.encode()).hexdigest()


class Decision(BaseModel):
    """
    The result of a policy evaluation for a given ToolCall.
    """
    decision_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique identifier of this decision.",
    )
    verdict: DecisionVerdict = Field(
        ...,
        description="ALLOW, DENY, or REQUIRE_APPROVAL.",
    )
    tool_name: str = Field(
        ...,
        description="Tool that was evaluated.",
    )
    reason: str = Field(
        default="",
        description="Human-readable explanation for this decision.",
    )
    policy_id: str = Field(
        default="",
        description="Policy that produced this decision.",
    )
    risk_score: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Normalised risk score (0.0 = safe, 1.0 = critical).",
    )
    risk_level: RiskLevel = Field(
        default=RiskLevel.LOW,
        description="Human-readable risk classification.",
    )
    action_hash: str = Field(
        default="",
        description="SHA-256 hash of the canonical action payload.",
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the decision.",
    )
    agent_id: str = Field(default="", description="Agent that requested the action.")
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context (never secrets).",
    )


class ApprovalRequest(BaseModel):
    """
    A pending human-approval request bound to a specific action.
    """
    approval_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique approval token.",
    )
    action_hash: str = Field(
        ...,
        description="SHA-256 hash of the canonical action this approval covers.",
    )
    tool_name: str = Field(
        ...,
        description="Tool requiring approval.",
    )
    agent_id: str = Field(
        default="",
        description="Requesting agent.",
    )
    status: ApprovalStatus = Field(
        default=ApprovalStatus.PENDING,
        description="Current lifecycle state.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    expires_at: datetime = Field(
        ...,
        description="UTC expiry time; approval is invalid after this.",
    )
    resolved_at: Optional[datetime] = Field(
        default=None,
        description="When approval was granted or rejected.",
    )
    resolved_by: str = Field(
        default="",
        description="Identifier of the human who resolved the request.",
    )
    consumed: bool = Field(
        default=False,
        description="True after the approval has been used once (single-use).",
    )


class AuditEvent(BaseModel):
    """
    Immutable record of a security-relevant event.
    """
    event_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
    )
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )
    agent_id: str = Field(default="")
    tool_name: str = Field(default="")
    verdict: DecisionVerdict = Field(default=DecisionVerdict.DENY)
    reason: str = Field(default="")
    policy_id: str = Field(default="")
    action_hash: str = Field(default="")
    approval_id: str = Field(default="")
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    execution_success: Optional[bool] = Field(default=None)
    execution_error: str = Field(default="")
    metadata: dict[str, Any] = Field(default_factory=dict)


class Config(BaseModel):
    """
    SDK-level configuration.
    """
    default_policy: Optional[Policy] = Field(
        default=None,
        description="Fall-back policy used when no specific policy is supplied.",
    )
    fail_closed: bool = Field(
        default=True,
        description="If True, any internal error during policy evaluation results in DENY.",
    )
    approval_timeout_seconds: int = Field(
        default=300,
        ge=30,
        description="How long an approval token is valid (seconds).",
    )
    audit_enabled: bool = Field(
        default=True,
        description="Whether to persist audit events.",
    )
    log_redact_keys: list[str] = Field(
        default_factory=lambda: ["secret", "token", "key", "password", "credential"],
        description="Substrings of field names whose values should be redacted in logs.",
    )


class RegisteredTool(BaseModel):
    """
    Internal descriptor for a tool that has been registered with the SDK.
    The handler callable is stored separately (not serialisable by Pydantic).
    """
    name: str = Field(..., min_length=1)
    permission: str = Field(
        ...,
        min_length=1,
        description="Permission string required to invoke this tool.",
    )
    description: str = Field(default="")
    sensitivity: int = Field(default=0, ge=0, le=10)
    parameters_schema: Optional[dict[str, Any]] = Field(
        default=None,
        alias="schema",
        description="Optional JSON-schema for argument validation.",
    )
    model_config = {"populate_by_name": True}
