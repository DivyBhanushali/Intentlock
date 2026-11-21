"""
INTENTLOCK SENTINEL – Behavioral Security & Task Session Models (Phase 1B).
Defines task session states, state transition rules, authorized scopes,
and behavioral telemetry events.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from pydantic import BaseModel, ConfigDict, Field, field_validator


class TaskSessionState(str, Enum):
    """Explicit lifecycle states for an autonomous agent task session."""
    CREATED = "CREATED"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    TERMINATED = "TERMINATED"
    TERMINAL = "TERMINATED"



# Strictly defined valid state transitions
VALID_STATE_TRANSITIONS: Dict[TaskSessionState, Set[TaskSessionState]] = {
    TaskSessionState.CREATED: {TaskSessionState.ACTIVE, TaskSessionState.TERMINATED},
    TaskSessionState.ACTIVE: {
        TaskSessionState.SUSPENDED,
        TaskSessionState.COMPLETED,
        TaskSessionState.FAILED,
        TaskSessionState.TERMINATED,
    },
    TaskSessionState.SUSPENDED: {TaskSessionState.ACTIVE, TaskSessionState.TERMINATED},
    TaskSessionState.COMPLETED: set(),  # Terminal state
    TaskSessionState.FAILED: set(),     # Terminal state
    TaskSessionState.TERMINATED: set(), # Terminal state
}


class BehavioralEventType(str, Enum):
    """Categorized behavioral telemetry event types."""
    SESSION_CREATED = "SESSION_CREATED"
    EXECUTION_ATTEMPT = "EXECUTION_ATTEMPT"
    EXECUTION_OUTCOME = "EXECUTION_OUTCOME"
    SCOPE_VIOLATION = "SCOPE_VIOLATION"
    SESSION_SUSPENDED = "SESSION_SUSPENDED"
    SESSION_RESUMED = "SESSION_RESUMED"
    SESSION_COMPLETED = "SESSION_COMPLETED"
    SESSION_FAILED = "SESSION_FAILED"
    SESSION_TERMINATED = "SESSION_TERMINATED"
    DELEGATION_CREATED = "DELEGATION_CREATED"
    DELEGATION_REVOKED = "DELEGATION_REVOKED"
    DELEGATION_VIOLATION = "DELEGATION_VIOLATION"
    CASCADING_CONTAINMENT = "CASCADING_CONTAINMENT"


class TaskScope(BaseModel):
    """Developer-defined authorized scope for a task session."""
    allowed_tools: List[str] = Field(default_factory=list)
    allowed_resources: List[str] = Field(default_factory=list)
    max_executions: int = Field(default=1000, ge=1)
    enforce_strict_scope: bool = Field(default=True)

    model_config = ConfigDict(frozen=True)


class BehavioralEvent(BaseModel):
    """
    Immutable behavioral telemetry event representing an observation
    within a task session.
    """
    event_id: str = Field(default_factory=lambda: f"bev_{uuid.uuid4().hex[:16]}")
    session_id: str
    org_id: str
    agent_id: str
    correlation_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: BehavioralEventType
    step_index: int = Field(default=1, ge=1)
    tool_name: Optional[str] = None
    resource_id: Optional[str] = None
    verdict: Optional[str] = None
    execution_success: Optional[bool] = None
    execution_error: Optional[str] = None
    event_payload: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(frozen=True)


class TaskSession(BaseModel):
    """
    Stateful entity representing a tenant-isolated autonomous agent task session.
    """
    session_id: str = Field(default_factory=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    org_id: str
    agent_id: str
    task_objective: str = Field(..., min_length=3)
    authorized_scope: TaskScope = Field(default_factory=TaskScope)
    state: TaskSessionState = Field(default=TaskSessionState.CREATED)
    total_executions: int = Field(default=0, ge=0)
    blocked_executions: int = Field(default=0, ge=0)
    scope_violations: int = Field(default=0, ge=0)
    suspension_reason: Optional[str] = None
    suspended_at: Optional[datetime] = None
    parent_session_id: Optional[str] = Field(default=None, description="Parent TaskSession ID if child task.")
    parent_agent_id: Optional[str] = Field(default=None, description="Parent agent ID in delegation tree.")
    delegation_id: Optional[str] = Field(default=None, description="Delegation token ID authorizing this session.")
    delegation_depth: int = Field(default=0, ge=0, description="Delegation depth in hierarchy.")
    child_session_ids: List[str] = Field(default_factory=list, description="IDs of spawned child sessions.")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("task_objective")
    @classmethod
    def _validate_objective(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("task_objective cannot be empty or whitespace only")
        return trimmed

    def is_executable(self) -> bool:
        """Determines if the session is currently authorized to execute actions."""
        return self.state == TaskSessionState.ACTIVE

    def is_suspended(self) -> bool:
        """Checks if session is in suspended state."""
        return self.state == TaskSessionState.SUSPENDED

    def is_terminal(self) -> bool:
        """Checks if session has entered a terminal state."""
        return self.state in {
            TaskSessionState.COMPLETED,
            TaskSessionState.FAILED,
            TaskSessionState.TERMINATED,
        }


# ─── SENTINEL Phase 2: Risk, Detection & Containment Models ───

class DetectionSeverity(str, Enum):
    """Severity ratings for behavioral detections."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class RiskTier(str, Enum):
    """Calibrated behavioral risk tiers."""
    TIER_0_NOMINAL = "TIER_0_NOMINAL"       # 0.00 – 0.24
    TIER_1_ELEVATED = "TIER_1_ELEVATED"     # 0.25 – 0.49
    TIER_2_HIGH_RISK = "TIER_2_HIGH_RISK"   # 0.50 – 0.74
    TIER_3_CRITICAL = "TIER_3_CRITICAL"     # 0.75 – 1.00

    @classmethod
    def from_score(cls, score: float) -> RiskTier:
        if score >= 0.75:
            return cls.TIER_3_CRITICAL
        elif score >= 0.50:
            return cls.TIER_2_HIGH_RISK
        elif score >= 0.25:
            return cls.TIER_1_ELEVATED
        return cls.TIER_0_NOMINAL


class ContainmentActionType(str, Enum):
    """Available containment measures applied to offending sessions."""
    ALLOW_NOMINAL = "ALLOW_NOMINAL"
    STEP_UP_MONITORING = "STEP_UP_MONITORING"
    RATE_THROTTLE = "RATE_THROTTLE"
    REQUIRE_APPROVAL = "REQUIRE_APPROVAL"
    QUARANTINE_SUSPEND = "QUARANTINE_SUSPEND"
    TERMINATE = "TERMINATE"


class BehavioralDetectionResult(BaseModel):
    """Structured detection outcome from a SENTINEL behavioral rule."""
    rule_id: str
    rule_name: str
    severity: DetectionSeverity
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    reason_code: str
    evidence: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(frozen=True)


class RiskFactorContribution(BaseModel):
    """Explainable risk attribution component."""
    rule_id: str
    factor_name: str
    severity: DetectionSeverity
    raw_score: float = Field(ge=0.0, le=1.0)
    weighted_contribution: float = Field(ge=0.0, le=1.0)
    description: str


class RiskAssessment(BaseModel):
    """Point-in-time explainable risk assessment for a task session."""
    assessment_id: str = Field(default_factory=lambda: f"ras_{uuid.uuid4().hex[:16]}")
    session_id: str
    org_id: str
    risk_score: float = Field(default=0.0, ge=0.0, le=1.0)
    risk_tier: RiskTier = Field(default=RiskTier.TIER_0_NOMINAL)
    factors: List[RiskFactorContribution] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContainmentAction(BaseModel):
    """Record of an automated or manual containment enforcement."""
    action_id: str = Field(default_factory=lambda: f"cact_{uuid.uuid4().hex[:16]}")
    session_id: str
    org_id: str
    action_type: ContainmentActionType
    trigger_reason: str
    enforced_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = Field(default="ACTIVE")  # ACTIVE, RESOLVED, OVERRIDDEN
    metadata: Dict[str, Any] = Field(default_factory=dict)

