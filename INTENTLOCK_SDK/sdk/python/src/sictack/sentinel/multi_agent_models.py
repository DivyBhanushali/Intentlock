"""
SICTACK SENTINEL — Multi-Agent Behavioral Security & Incident Models (Phase 4C).

Defines data models for cross-agent telemetry correlation, multi-agent threat
detections (MAD-001 through MAD-010), hierarchical objective alignment,
and security incident management.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from pydantic import BaseModel, ConfigDict, Field

from sictack.sentinel.models import DetectionSeverity


# ─── Incident Lifecycle & Classification ─────────────────────────────────────

class IncidentStatus(str, Enum):
    """Lifecycle phases for managed security incidents."""
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    CONTAINED = "CONTAINED"
    RESOLVED = "RESOLVED"


class IncidentSeverity(str, Enum):
    """Categorized severity levels for security incidents."""
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


# ─── Multi-Agent Detection Result ────────────────────────────────────────────

class MultiAgentDetectionResult(BaseModel):
    """
    Structured forensic detection result emitted by multi-agent threat detectors
    (MAD-001 through MAD-010).
    """
    detection_id: str = Field(default_factory=lambda: f"mad_{uuid.uuid4().hex[:14]}")
    rule_id: str
    rule_name: str
    severity: DetectionSeverity
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    primary_agent_id: str
    correlated_agent_ids: List[str] = Field(default_factory=list)
    session_id: str = ""
    reason_code: str
    explanation: str
    evidence: Dict[str, Any] = Field(default_factory=dict)
    recommended_action: str = "CONTAIN_SESSION"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(frozen=True)


# ─── Security Incident Model ─────────────────────────────────────────────────

class SecurityIncident(BaseModel):
    """
    Tenant-isolated security incident tracking the lifecycle, correlated telemetry,
    and remediation actions taken across instrumented agent fleets.
    """
    incident_id: str = Field(default_factory=lambda: f"inc_{uuid.uuid4().hex[:12]}")
    org_id: str
    title: str
    severity: IncidentSeverity = IncidentSeverity.HIGH
    status: IncidentStatus = IncidentStatus.DETECTED
    trigger_rule_id: str
    affected_agent_ids: List[str] = Field(default_factory=list)
    session_ids: List[str] = Field(default_factory=list)
    summary: str
    evidence_trail: List[Dict[str, Any]] = Field(default_factory=list)
    containment_action_taken: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None


# ─── Hierarchical Objective Alignment ────────────────────────────────────────

class ObjectiveAlignmentAssessment(BaseModel):
    """
    Forensic assessment of semantic and policy alignment across the
    User -> Supervisor -> Worker task hierarchy.
    """
    assessment_id: str = Field(default_factory=lambda: f"hoa_{uuid.uuid4().hex[:12]}")
    user_objective: str
    supervisor_objective: str
    worker_objective: str
    is_aligned: bool
    deviation_score: float = Field(default=0.0, ge=0.0, le=1.0)
    severity: DetectionSeverity = DetectionSeverity.LOW
    detected_anomalies: List[str] = Field(default_factory=list)
    explanation: str = ""
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─── Fleet Risk Aggregation ──────────────────────────────────────────────────

class AgentRiskScore(BaseModel):
    """Point-in-time risk posture for a specific agent in the fleet."""
    agent_id: str
    direct_risk: float = Field(default=0.0, ge=0.0, le=100.0)
    propagated_risk: float = Field(default=0.0, ge=0.0, le=100.0)
    effective_risk: float = Field(default=0.0, ge=0.0, le=100.0)
    active_incidents_count: int = 0
    subordinate_agent_ids: List[str] = Field(default_factory=list)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
