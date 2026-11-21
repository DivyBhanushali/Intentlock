"""
INTENTLOCK – Core Pydantic models.

These models define the data structures used throughout the SDK:
policies, actions, decisions, approval requests and configuration.
Every field is typed, validated, and documented.
"""

from __future__ import annotations

import hashlib
import json
import types
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Optional

from pydantic import BaseModel, Field, field_validator


def deep_freeze(obj: Any) -> Any:
    """
    Recursively freezes nested mutable structures into immutable types:
    - dict / Mapping -> types.MappingProxyType with deep-frozen values
    - list / tuple -> tuple with deep-frozen items
    - set / frozenset -> frozenset with deep-frozen items
    Primitive scalar types remain unaltered.
    """
    if isinstance(obj, (dict, types.MappingProxyType)) or (hasattr(obj, "items") and callable(obj.items)):
        return types.MappingProxyType({k: deep_freeze(v) for k, v in obj.items()})
    elif isinstance(obj, (list, tuple)):
        return tuple(deep_freeze(v) for v in obj)
    elif isinstance(obj, (set, frozenset)):
        return frozenset(deep_freeze(v) for v in obj)
    return obj


def to_canonical_dict(obj: Any) -> Any:
    """Recursively converts mappingproxy, tuples, sets, and custom structures into canonical JSON-serializable primitives."""
    if isinstance(obj, (dict, types.MappingProxyType)) or (hasattr(obj, "items") and callable(obj.items)):
        return {k: to_canonical_dict(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple, set, frozenset)):
        return [to_canonical_dict(v) for v in obj]
    return obj


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class DecisionVerdict(str, Enum):
    """Possible outcomes of a policy evaluation."""
    ALLOW = "ALLOW"
    DENY = "DENY"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"


class SecurityMode(str, Enum):
    """Operational security enforcement modes."""
    MONITOR = "MONITOR"
    ENFORCE = "ENFORCE"
    STRICT = "STRICT"


class EnvironmentClassification(str, Enum):
    """Execution environment tiers."""
    DEVELOPMENT = "DEVELOPMENT"
    STAGING = "STAGING"
    PRODUCTION = "PRODUCTION"


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
    version: int = Field(
        default=1,
        ge=1,
        description="Policy version number (used for policy binding and rollback prevention).",
    )
    parameter_constraints: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameter-level authorization constraints per tool or global.",
    )
    allowed_environments: list[str] = Field(
        default_factory=list,
        description="Environments where this policy/tools can execute (e.g. DEVELOPMENT, STAGING, PRODUCTION). Empty means all.",
    )
    denied_environments: list[str] = Field(
        default_factory=list,
        description="Explicitly forbidden environments (takes precedence over allowed_environments).",
    )
    max_invocations_per_task: int = Field(
        default=0,
        ge=0,
        description="Max tool invocations permitted under this policy per task/session. 0 means unlimited.",
    )
    sensitive_admin_actions: list[str] = Field(
        default_factory=list,
        description="Actions classified as sensitive admin requiring elevated handling or approval.",
    )
    network_destinations: list[str] = Field(
        default_factory=list,
        description="Permitted network endpoints / hosts.",
    )
    denied_network_destinations: list[str] = Field(
        default_factory=list,
        description="Explicitly forbidden network endpoints / hosts.",
    )
    security_mode: SecurityMode = Field(
        default=SecurityMode.ENFORCE,
        description="Operational security enforcement mode (MONITOR, ENFORCE, STRICT).",
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
    arguments: Any = Field(
        default_factory=dict,
        description="Deep-frozen immutable arguments the agent wants to pass to the tool.",
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
    intent_id: str = Field(
        default="",
        description="Optional task-scoped Intent Authorization Context ID.",
    )
    trace_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Distributed execution trace identifier.",
    )
    session_id: str = Field(
        default="",
        description="Runtime session identifier.",
    )
    environment: str = Field(
        default="PRODUCTION",
        description="Execution environment classification (DEVELOPMENT, STAGING, PRODUCTION).",
    )
    security_mode: SecurityMode = Field(
        default=SecurityMode.ENFORCE,
        description="Target security enforcement mode.",
    )
    operation_type: str = Field(
        default="execute",
        description="Semantic operation type (e.g. read, write, execute, admin).",
    )
    network_destination: str = Field(
        default="",
        description="Target network destination host/IP if applicable.",
    )
    parent_agent_id: str = Field(
        default="",
        description="ID of delegating parent agent if running under delegation.",
    )
    delegation_id: str = Field(
        default="",
        description="Bound delegation token ID authorizing child invocation.",
    )
    delegation_depth: int = Field(
        default=0,
        ge=0,
        description="Depth in multi-agent delegation hierarchy (0 = root agent).",
    )

    @field_validator("arguments", mode="after")
    @classmethod
    def _freeze_tool_arguments(cls, v: Any) -> Any:
        return deep_freeze(dict(v)) if v else deep_freeze({})

    @field_validator("tool_name")
    @classmethod
    def _tool_name_no_whitespace(cls, v: str) -> str:
        if " " in v:
            raise ValueError("tool_name must not contain spaces")
        return v

    @property
    def frozen_arguments(self) -> Any:
        """Returns deep-frozen, immutable representation of tool arguments."""
        return deep_freeze(self.arguments)

    def arguments_dict(self) -> dict[str, Any]:
        """Returns arguments converted to a standard mutable or canonical dictionary."""
        return to_canonical_dict(self.arguments) if self.arguments else {}

    def canonical_hash(self) -> str:
        """
        Deterministic SHA-256 hash of the action payload.
        Used for approval binding and replay protection.
        """
        payload = json.dumps(
            {
                "tool_name": self.tool_name,
                "arguments": to_canonical_dict(self.arguments),
                "agent_id": self.agent_id,
                "sensitivity": self.sensitivity,
                "resource_id": self.resource_id,
                "recipient": self.recipient,
                "intent_id": self.intent_id,
                "session_id": self.session_id,
                "environment": self.environment,
                "operation_type": self.operation_type,
                "network_destination": self.network_destination,
                "parent_agent_id": self.parent_agent_id,
                "delegation_id": self.delegation_id,
                "delegation_depth": self.delegation_depth,
            },
            sort_keys=True,
            default=str,
        )
        return hashlib.sha256(payload.encode()).hexdigest()


class IntentContext(BaseModel):
    """
    Cryptographically verifiable task-scoped Intent Authorization Context.
    Created by a trusted user/principal BEFORE autonomous agent execution.
    Immutable once authorized.
    """
    intent_id: str = Field(
        default_factory=lambda: f"itc_{uuid.uuid4().hex[:12]}",
        description="Unique identifier for this intent authorization context.",
    )
    org_id: str = Field(
        default="default-org",
        description="Organization / workspace tenant scope.",
    )
    user_id: str = Field(
        default="system",
        description="Trusted principal who authorized the task.",
    )
    agent_id: str = Field(
        default="default-agent",
        description="AI agent assigned to execute within this context.",
    )
    authorized_objective: str = Field(
        ...,
        description="Human-readable authorized task/objective statement.",
    )
    allowed_actions: list[str] = Field(
        default_factory=list,
        description="Explicitly authorized tool actions for this specific task.",
    )
    denied_actions: list[str] = Field(
        default_factory=list,
        description="Explicitly forbidden actions for this task (overrides all).",
    )
    allowed_permissions: list[str] = Field(
        default_factory=list,
        description="Permissions granted for this specific task.",
    )
    allowed_resources: list[str] = Field(
        default_factory=list,
        description="Target resource glob patterns permitted for this task.",
    )
    allowed_recipients: list[str] = Field(
        default_factory=list,
        description="Allowed target recipients (emails, domains, endpoints).",
    )
    sensitivity_ceiling: int = Field(
        default=5,
        ge=0,
        le=10,
        description="Maximum data sensitivity permitted under this task.",
    )
    execution_scope: str = Field(
        default="default",
        description="Execution boundary tag (e.g. read-only, staging, production).",
    )
    expiration_timestamp: datetime = Field(
        ...,
        description="UTC timestamp after which this intent context expires.",
    )
    context_status: str = Field(
        default="ACTIVE",
        description="Status: ACTIVE, REVOKED, EXPIRED, CONSUMED.",
    )
    authorization_version: int = Field(
        default=1,
        description="Schema and authorization specification version.",
    )
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when authorization was issued.",
    )

    def is_expired(self, now: Optional[datetime] = None) -> bool:
        """Check if this intent context has passed its expiration timestamp."""
        check_time = now or datetime.now(timezone.utc)
        exp = self.expiration_timestamp
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return check_time > exp

    def is_valid(self, now: Optional[datetime] = None) -> bool:
        """True only if status is ACTIVE and not expired."""
        return self.context_status == "ACTIVE" and not self.is_expired(now)



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
    intent_id: str = Field(default="", description="Bound intent authorization context.")
    trace_id: str = Field(default="", description="Trace correlation identifier.")
    policy_version: int = Field(default=1, description="Exact version of policy evaluated.")
    expires_at: Optional[datetime] = Field(default=None, description="UTC timestamp when this authorization decision expires.")
    security_mode: SecurityMode = Field(
        default=SecurityMode.ENFORCE,
        description="Operational security mode in effect during evaluation (MONITOR, ENFORCE, STRICT).",
    )
    context_metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Detailed contextual evaluation attributes and metadata.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Additional context (never secrets).",
    )

    def is_expired(self, now: Optional[datetime] = None) -> bool:
        """Check if this authorization decision has expired."""
        if self.expires_at is None:
            return False
        check_time = now or datetime.now(timezone.utc)
        exp = self.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return check_time > exp


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
    task_id: str = Field(
        default="",
        description="Optional bound task / session identifier.",
    )
    arguments_canonical: dict[str, Any] = Field(
        default_factory=dict,
        description="Canonical tool arguments bound to this approval.",
    )
    agent_id: str = Field(
        default="",
        description="Requesting agent.",
    )
    intent_id: str = Field(
        default="",
        description="Intent context this approval is bound to.",
    )
    policy_version: int = Field(
        default=1,
        description="Policy version under which approval was requested.",
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

    def __init__(self, **data: Any):
        if "policy" in data and "default_policy" not in data:
            data["default_policy"] = data.pop("policy")
        super().__init__(**data)

    @property
    def policy(self) -> Optional[Policy]:
        return self.default_policy

    @policy.setter
    def policy(self, value: Optional[Policy]) -> None:
        self.default_policy = value
    fail_closed: bool = Field(
        default=True,
        description="If True, any internal error during policy evaluation results in DENY.",
    )
    approval_timeout_seconds: int = Field(
        default=300,
        ge=30,
        description="How long an approval token is valid (seconds).",
    )
    decision_ttl_seconds: int = Field(
        default=300,
        ge=1,
        description="How long an authorization decision verdict remains valid (seconds).",
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


# ---------------------------------------------------------------------------
# Multi-Agent Delegation Models (Phase 4B)
# ---------------------------------------------------------------------------

class AgentIdentity(BaseModel):
    """
    Cryptographic and organizational identity of an autonomous AI agent in a multi-agent system.
    """
    agent_id: str = Field(..., min_length=1, description="Unique agent identifier.")
    org_id: str = Field(default="default-org", description="Tenant organization scope.")
    parent_agent_id: Optional[str] = Field(default=None, description="Parent agent ID in delegation tree.")
    name: str = Field(default="", description="Human-readable agent name.")
    role: str = Field(default="worker", description="Operational role (e.g. supervisor, planner, worker, evaluator).")
    max_delegation_depth: int = Field(default=3, ge=0, le=10, description="Maximum permitted delegation depth.")
    is_active: bool = Field(default=True, description="Whether the agent identity is active.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DelegationToken(BaseModel):
    """
    Cryptographically verifiable capability delegation token issued by a parent agent
    to authorize a child agent under least-privilege constraints.
    """
    delegation_id: str = Field(
        default_factory=lambda: f"delg_{uuid.uuid4().hex[:12]}",
        description="Unique delegation token identifier.",
    )
    org_id: str = Field(default="default-org", description="Tenant organization scope.")
    parent_agent_id: str = Field(..., description="Issuing parent agent ID.")
    child_agent_id: str = Field(..., description="Target delegated child agent ID.")
    parent_session_id: str = Field(default="", description="Bound parent TaskSession ID.")
    delegated_permissions: list[str] = Field(
        default_factory=list,
        description="Explicit subset of permissions granted to the child agent.",
    )
    delegated_tools: list[str] = Field(
        default_factory=list,
        description="Explicit subset of tools authorized for the child agent.",
    )
    delegated_resources: list[str] = Field(
        default_factory=list,
        description="Resource glob patterns permitted for child execution.",
    )
    allocated_budget: int = Field(
        default=50,
        ge=1,
        description="Execution budget allocated from the parent task.",
    )
    executions_count: int = Field(
        default=0,
        ge=0,
        description="Number of executions consumed under this delegation token.",
    )
    depth: int = Field(
        default=1,
        ge=1,
        description="Current delegation depth in the agent hierarchy.",
    )
    issued_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC issuance timestamp.",
    )
    expires_at: Optional[datetime] = Field(
        default=None,
        description="Optional expiration timestamp (fail-closed if expired).",
    )
    revoked: bool = Field(
        default=False,
        description="Whether this delegation token has been revoked.",
    )
    revocation_reason: Optional[str] = Field(
        default=None,
        description="Reason for delegation revocation if applicable.",
    )
    signature: str = Field(
        default="",
        description="HMAC-SHA256 signature validating token authenticity and integrity.",
    )
    metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Contextual delegation metadata.",
    )

    @property
    def consumed_budget(self) -> int:
        """Alias for executions_count for backward compatibility and intuitive API access."""
        return self.executions_count

    def canonical_payload(self) -> str:
        """Deterministic serialization for HMAC signature generation and verification."""
        data = {
            "delegation_id": self.delegation_id,
            "org_id": self.org_id,
            "parent_agent_id": self.parent_agent_id,
            "child_agent_id": self.child_agent_id,
            "parent_session_id": self.parent_session_id,
            "delegated_permissions": sorted(self.delegated_permissions),
            "delegated_tools": sorted(self.delegated_tools),
            "delegated_resources": sorted(self.delegated_resources),
            "allocated_budget": self.allocated_budget,
            "depth": self.depth,
            "issued_at": self.issued_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }
        return json.dumps(data, sort_keys=True)

    def sign(self, secret_key: str) -> str:
        """Compute HMAC-SHA256 signature for this delegation token."""
        import hmac
        sig = hmac.new(secret_key.encode(), self.canonical_payload().encode(), hashlib.sha256).hexdigest()
        self.signature = sig
        return sig

    def verify_signature(self, secret_key: str) -> bool:
        """Verify HMAC-SHA256 signature."""
        import hmac
        if not self.signature:
            return False
        expected = hmac.new(secret_key.encode(), self.canonical_payload().encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(self.signature, expected)

    def is_expired(self, now: Optional[datetime] = None) -> bool:
        """Check if delegation token has expired."""
        if self.expires_at is None:
            return False
        check_time = now or datetime.now(timezone.utc)
        exp = self.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        return check_time > exp

    def is_valid(self, now: Optional[datetime] = None) -> bool:
        """Check if delegation token is active and valid (not revoked and not expired)."""
        return not self.revoked and not self.is_expired(now)
