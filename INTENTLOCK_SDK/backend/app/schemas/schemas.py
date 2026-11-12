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


class InterceptResponse(BaseModel):
    verdict: DecisionVerdict
    allowed: bool
    reason: str
    decision_id: str
    action_hash: str
    risk_score: float
    risk_level: RiskLevel
    approval_id: Optional[str] = None
    execution_result: Optional[Any] = None

