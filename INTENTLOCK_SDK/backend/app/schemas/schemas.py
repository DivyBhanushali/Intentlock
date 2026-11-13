"""
INTENTLOCK Backend – Pydantic Schemas for API Requests and Responses.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from pydantic import BaseModel, ConfigDict, Field
from intentlock.models import RiskLevel, DecisionVerdict, ApprovalStatus


# -----------------------------------------------------------------------------
# Policy Schemas
# -----------------------------------------------------------------------------

class PolicyBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="")
    allowed_permissions: list[str] = Field(default_factory=list)
    denied_permissions: list[str] = Field(default_factory=list)
    require_approval_permissions: list[str] = Field(default_factory=list)
    allowed_resources: list[str] = Field(default_factory=list)
    allowed_recipients: list[str] = Field(default_factory=list)
    max_risk_level: RiskLevel = Field(default=RiskLevel.MEDIUM)
    max_sensitivity: int = Field(default=5, ge=0, le=10)


class PolicyCreate(PolicyBase):
    pass


class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    allowed_permissions: Optional[list[str]] = None
    denied_permissions: Optional[list[str]] = None
    require_approval_permissions: Optional[list[str]] = None
    allowed_resources: Optional[list[str]] = None
    allowed_recipients: Optional[list[str]] = None
    max_risk_level: Optional[RiskLevel] = None
    max_sensitivity: Optional[int] = None


class PolicyResponse(PolicyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Approval Schemas
# -----------------------------------------------------------------------------

class ApprovalActionRequest(BaseModel):
    approver_id: str = Field(default="admin@company.com", min_length=1)
    notes: Optional[str] = None


class ApprovalResponse(BaseModel):
    id: str
    action_hash: str
    tool_name: str
    agent_id: str
    status: ApprovalStatus
    created_at: datetime
    expires_at: datetime
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = ""
    consumed: bool
    arguments_json: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Audit Event Schemas
# -----------------------------------------------------------------------------

class AuditEventResponse(BaseModel):
    id: str
    timestamp: datetime
    agent_id: Optional[str] = None
    tool_name: Optional[str] = None
    verdict: DecisionVerdict
    reason: str
    policy_id: Optional[str] = None
    action_hash: Optional[str] = None
    approval_id: Optional[str] = None
    risk_score: float
    execution_success: Optional[bool] = None
    execution_error: Optional[str] = ""
    metadata_json: dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class AuditStatsResponse(BaseModel):
    total_events: int
    allowed_count: int
    denied_count: int
    require_approval_count: int
    active_agents_count: int


# -----------------------------------------------------------------------------
# Agent Schemas
# -----------------------------------------------------------------------------

class AgentCreate(BaseModel):
    id: str = Field(..., min_length=1, max_length=128)
    name: str = Field(..., min_length=1, max_length=128)
    description: str = Field(default="")
    policy_id: Optional[str] = None


class AgentResponse(BaseModel):
    id: str
    name: str
    description: str
    policy_id: Optional[str] = None
    created_at: datetime
    last_active_at: datetime

    model_config = ConfigDict(from_attributes=True)


# -----------------------------------------------------------------------------
# Intent Authorization Context Schemas
# -----------------------------------------------------------------------------

class IntentContextCreate(BaseModel):
    agent_id: str = Field(..., min_length=1)
    authorized_objective: str = Field(..., min_length=3)
    allowed_actions: list[str] = Field(default_factory=list)
    denied_actions: list[str] = Field(default_factory=list)
    allowed_permissions: list[str] = Field(default_factory=list)
    allowed_resources: list[str] = Field(default_factory=list)
    allowed_recipients: list[str] = Field(default_factory=list)
    sensitivity_ceiling: int = Field(default=5, ge=0, le=10)
    execution_scope: str = Field(default="default")
    ttl_seconds: int = Field(default=3600, ge=60, le=86400 * 7)


class IntentContextRevoke(BaseModel):
    reason: str = Field(default="Revoked by administrator")


class IntentContextResponse(BaseModel):
    id: str
    org_id: str
    user_id: str
    agent_id: str
    authorized_objective: str
    allowed_actions: list[str] = Field(default_factory=list)
    denied_actions: list[str] = Field(default_factory=list)
    allowed_permissions: list[str] = Field(default_factory=list)
    allowed_resources: list[str] = Field(default_factory=list)
    allowed_recipients: list[str] = Field(default_factory=list)
    sensitivity_ceiling: int
    execution_scope: str
    expiration_timestamp: datetime
    context_status: str
    authorization_version: int
    revoked_at: Optional[datetime] = None
    revoked_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)



# -----------------------------------------------------------------------------
# Intercept (Remote Gateway) Schemas
# -----------------------------------------------------------------------------

class InterceptRequest(BaseModel):
    agent_id: str = Field(default="default-agent")
    tool_name: str = Field(..., min_length=1)
    arguments: dict[str, Any] = Field(default_factory=dict)
    user_request: str = Field(default="")
    sensitivity: int = Field(default=0, ge=0, le=10)
    resource_id: str = Field(default="")
    recipient: str = Field(default="")
    approval_id: Optional[str] = None
    intent_id: Optional[str] = None
    trace_id: Optional[str] = None


class InterceptResponse(BaseModel):
    verdict: DecisionVerdict
    allowed: bool
    reason: str
    decision_id: str
    action_hash: str
    risk_score: float
    risk_level: RiskLevel
    approval_id: Optional[str] = None
    intent_id: Optional[str] = None
    trace_id: Optional[str] = None
    policy_version: int = 1
    execution_result: Optional[Any] = None


# -----------------------------------------------------------------------------
# Security Threat Intelligence & Containment Schemas
# -----------------------------------------------------------------------------

class SecurityThreatResponse(BaseModel):
    id: str
    org_id: str
    agent_id: str
    threat_category: str
    severity: str
    description: str
    detection_rule: str
    related_trace_id: Optional[str] = None
    recommended_response: str
    mitigation_status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ThreatMitigateRequest(BaseModel):
    status: str = Field(..., pattern="^(MITIGATED|DISMISSED)$")
    note: Optional[str] = None


class ThreatStatsResponse(BaseModel):
    total_threats: int
    active_threats: int
    critical_threats: int
    high_threats: int
    categories: dict[str, int]


# -----------------------------------------------------------------------------
# Cryptographic Audit Verification Schemas
# -----------------------------------------------------------------------------

class AuditVerifyResponse(BaseModel):
    verified: bool
    total_records: int
    valid_records: int
    corrupted_records: int
    first_corrupted_id: Optional[str] = None
    details: str


# -----------------------------------------------------------------------------
# Adversarial Security Benchmark Schemas
# -----------------------------------------------------------------------------

class BenchmarkScenarioResult(BaseModel):
    vector_id: str
    name: str
    category: str
    attack_payload: str
    expected_verdict: str
    actual_verdict: str
    status: str
    latency_ms: float
    mitigation_layer: str


class BenchmarkRunResponse(BaseModel):
    id: str
    org_id: str
    total_scenarios: int
    passed_scenarios: int
    failed_scenarios: int
    block_rate: float
    average_latency_ms: float
    report_json: dict[str, Any]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)




