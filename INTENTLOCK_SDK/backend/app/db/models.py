"""
INTENTLOCK Backend – SQLAlchemy ORM Models.
Multi-Tenant Architecture supporting Organizations, Users, API Keys,
Policies, Approvals, Audit Events, and Agents.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from app.db.session import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


# ─── Multi-Tenancy Core: Organizations, Users & API Keys ───────────────────

class OrganizationModel(Base):
    """Customer Organization / Workspace tenant."""
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, default=lambda: f"org_{uuid.uuid4().hex[:12]}")
    name = Column(String(128), nullable=False)
    slug = Column(String(64), unique=True, index=True, nullable=False)
    plan = Column(String(32), default="GROWTH")  # DEVELOPER, GROWTH, SCALE, ENTERPRISE
    status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, SUSPENDED, TERMINATED
    max_agents = Column(Integer, default=25)
    max_monthly_actions = Column(Integer, default=100000)
    rate_limit_per_minute = Column(Integer, default=1200)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    users = relationship("UserModel", back_populates="organization", cascade="all, delete-orphan")
    api_keys = relationship("ApiKeyModel", back_populates="organization", cascade="all, delete-orphan")


class UserModel(Base):
    """Registered dashboard users belonging to an organization."""
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=lambda: f"usr_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    email = Column(String(256), unique=True, index=True, nullable=False)
    full_name = Column(String(128), default="")
    password_hash = Column(String(256), nullable=False)
    role = Column(String(32), default="OPERATOR")  # OWNER, SECURITY_ADMIN, AUDITOR, OPERATOR, READ_ONLY
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_login_at = Column(DateTime(timezone=True), default=utc_now)

    organization = relationship("OrganizationModel", back_populates="users")


class ApiKeyModel(Base):
    """Machine-to-machine API keys for AI agent SDK tool interception."""
    __tablename__ = "api_keys"

    id = Column(String(64), primary_key=True, default=lambda: f"key_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(128), nullable=False)
    key_prefix = Column(String(16), nullable=False)
    key_hash = Column(String(128), nullable=False, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    last_used_at = Column(DateTime(timezone=True), nullable=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    rotated_to_key_id = Column(String(64), nullable=True)
    scopes = Column(JSON, default=list)

    organization = relationship("OrganizationModel", back_populates="api_keys")


# ─── Tenant Resources: Policies, Approvals, Audit & Agents ─────────────────

class PolicyModel(Base):
    """Stores declarative security policies."""
    __tablename__ = "policies"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(64), nullable=True, index=True, default="default-org")
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    allowed_permissions = Column(JSON, default=list)
    denied_permissions = Column(JSON, default=list)
    require_approval_permissions = Column(JSON, default=list)
    allowed_resources = Column(JSON, default=list)
    allowed_recipients = Column(JSON, default=list)
    max_risk_level = Column(String(32), default="MEDIUM")
    max_sensitivity = Column(Integer, default=5)
    version = Column(Integer, default=1, nullable=False)
    parameter_constraints = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    agents = relationship("AgentModel", back_populates="policy")
    versions = relationship("PolicyVersionModel", back_populates="policy", cascade="all, delete-orphan")


class PolicyVersionModel(Base):
    """Immutable snapshot of a policy version for audit and replay verification."""
    __tablename__ = "policy_versions"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False, default=1)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    allowed_permissions = Column(JSON, default=list)
    denied_permissions = Column(JSON, default=list)
    require_approval_permissions = Column(JSON, default=list)
    allowed_resources = Column(JSON, default=list)
    allowed_recipients = Column(JSON, default=list)
    max_risk_level = Column(String(32), default="MEDIUM")
    max_sensitivity = Column(Integer, default=5)
    modified_by = Column(String(128), default="system")
    change_reason = Column(String(256), default="Policy revision")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    policy = relationship("PolicyModel", back_populates="versions")


class IntentContextModel(Base):
    """
    Cryptographically verifiable task-scoped Intent Authorization Context.
    Created by a trusted principal/application BEFORE agent execution.
    Immutable once issued.
    """
    __tablename__ = "intent_contexts"

    id = Column(String(64), primary_key=True, default=lambda: f"itc_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(String(64), nullable=False, index=True)  # Trusted principal who authorized the task
    agent_id = Column(String(128), nullable=False, index=True)
    authorized_objective = Column(Text, nullable=False)
    allowed_actions = Column(JSON, default=list)
    denied_actions = Column(JSON, default=list)
    allowed_permissions = Column(JSON, default=list)
    allowed_resources = Column(JSON, default=list)
    allowed_recipients = Column(JSON, default=list)
    sensitivity_ceiling = Column(Integer, default=5)
    execution_scope = Column(String(128), default="default")
    expiration_timestamp = Column(DateTime(timezone=True), nullable=False, index=True)
    context_status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, REVOKED, EXPIRED, CONSUMED
    authorization_version = Column(Integer, default=1)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_reason = Column(String(256), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)


class ApprovalModel(Base):
    """Stores human-in-the-loop approval requests."""
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(64), nullable=True, index=True, default="default-org")
    action_hash = Column(String(64), nullable=False, index=True)
    tool_name = Column(String(128), nullable=False)
    agent_id = Column(String(128), default="default-agent")
    intent_id = Column(String(64), nullable=True, index=True)
    policy_version = Column(Integer, default=1)
    status = Column(String(32), default="PENDING", index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(128), default="")
    consumed = Column(Boolean, default=False)
    consumed_at = Column(DateTime(timezone=True), nullable=True)
    arguments_json = Column(JSON, default=dict)


class AuditEventModel(Base):
    """Immutable audit trail of all policy evaluations and tool executions with hash-chaining."""
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    org_id = Column(String(64), nullable=True, index=True, default="default-org")
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)
    agent_id = Column(String(128), index=True)
    tool_name = Column(String(128), index=True)
    verdict = Column(String(32), nullable=False, index=True)
    reason = Column(String(256), default="")
    policy_id = Column(String(64), index=True)
    action_hash = Column(String(64), default="")
    approval_id = Column(String(64), default="")
    intent_id = Column(String(64), nullable=True, index=True)
    trace_id = Column(String(64), nullable=True, index=True)
    sequence_number = Column(Integer, nullable=True, index=True)
    previous_hash = Column(String(64), default="")
    entry_hash = Column(String(64), default="")
    risk_score = Column(Float, default=0.0)
    execution_success = Column(Boolean, nullable=True)
    execution_error = Column(Text, default="")
    metadata_json = Column(JSON, default=dict)


class SecurityThreatEventModel(Base):
    """Stores security anomalies, policy bypass attempts, and agent behavioral threats."""
    __tablename__ = "security_threat_events"

    id = Column(String(64), primary_key=True, default=lambda: f"thr_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), nullable=False, index=True)
    agent_id = Column(String(128), nullable=False, index=True)
    threat_category = Column(String(64), nullable=False, index=True)
    severity = Column(String(32), default="HIGH", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    description = Column(Text, nullable=False)
    detection_rule = Column(String(128), nullable=False)
    related_trace_id = Column(String(64), nullable=True)
    recommended_response = Column(String(256), default="Log and alert administrator")
    mitigation_status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, MITIGATED, DISMISSED
    created_at = Column(DateTime(timezone=True), default=utc_now)


class BenchmarkRunModel(Base):
    """Stores automated 25-vector adversarial penetration and security benchmark runs."""
    __tablename__ = "benchmark_runs"

    id = Column(String(64), primary_key=True, default=lambda: f"bmk_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), nullable=False, index=True)
    total_scenarios = Column(Integer, default=25)
    passed_scenarios = Column(Integer, default=0)
    failed_scenarios = Column(Integer, default=0)
    block_rate = Column(Float, default=1.0)
    average_latency_ms = Column(Float, default=0.0)
    report_json = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), default=utc_now)



class AgentModel(Base):
    """Stores registered agents, their assigned policies, and hierarchical relationships."""
    __tablename__ = "agents"

    id = Column(String(128), primary_key=True)
    org_id = Column(String(64), nullable=True, index=True, default="default-org")
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=True)
    parent_agent_id = Column(String(128), nullable=True, index=True)
    owner_user_id = Column(String(64), nullable=True, index=True)
    role = Column(String(64), default="worker")
    status = Column(String(32), default="ACTIVE", index=True)  # ACTIVE, SUSPENDED, DECOMMISSIONED
    max_delegation_depth = Column(Integer, default=3)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_active_at = Column(DateTime(timezone=True), default=utc_now)

    policy = relationship("PolicyModel", back_populates="agents")


class AgentDelegationModel(Base):
    """Stores cryptographically signed delegation tokens across multi-agent hierarchies."""
    __tablename__ = "agent_delegations"

    id = Column(String(64), primary_key=True)
    org_id = Column(String(64), nullable=False, index=True)
    parent_agent_id = Column(String(128), nullable=False, index=True)
    child_agent_id = Column(String(128), nullable=False, index=True)
    parent_session_id = Column(String(64), nullable=True)
    delegated_permissions = Column(JSON, default=list)
    delegated_tools = Column(JSON, default=list)
    delegated_resources = Column(JSON, default=list)
    allocated_budget = Column(Integer, default=50)
    executions_count = Column(Integer, default=0)
    depth = Column(Integer, default=1)
    issued_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    revoked = Column(Boolean, default=False)
    revocation_reason = Column(Text, nullable=True)
    signature = Column(String(128), default="")
    delegation_metadata = Column(JSON, default=dict)


# ─── SENTINEL Phase 1 Models: Task Sessions & Behavioral Events ───

class SentinelTaskSessionModel(Base):
    """
    Tenant-isolated task session tracking agent identity, declared objective,
    authorized scope, execution counters, and suspension state.
    """
    __tablename__ = "sentinel_task_sessions"

    id = Column(String(64), primary_key=True, default=lambda: f"sess_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    agent_id = Column(String(128), nullable=False, index=True)
    task_objective = Column(Text, nullable=False)
    authorized_scope = Column(JSON, default=dict)
    session_state = Column(String(32), default="ACTIVE", index=True)  # CREATED, ACTIVE, SUSPENDED, COMPLETED, FAILED, TERMINATED
    total_executions = Column(Integer, default=0)
    blocked_executions = Column(Integer, default=0)
    scope_violations = Column(Integer, default=0)
    suspension_reason = Column(String(256), nullable=True)
    suspended_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    events = relationship("SentinelBehavioralEventModel", back_populates="session", cascade="all, delete-orphan")
    risk_assessments = relationship("SentinelRiskAssessmentModel", back_populates="session", cascade="all, delete-orphan")
    containment_actions = relationship("SentinelContainmentActionModel", back_populates="session", cascade="all, delete-orphan")
    objective_assessments = relationship("SentinelObjectiveAssessmentModel", back_populates="session", cascade="all, delete-orphan")


class SentinelBehavioralEventModel(Base):
    """
    Behavioral events recording tool execution attempts, outcomes, scope violations,
    and state transitions within a task session.
    """
    __tablename__ = "sentinel_behavioral_events"

    id = Column(String(64), primary_key=True, default=lambda: f"bev_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sentinel_task_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    correlation_id = Column(String(64), nullable=False, index=True)
    event_type = Column(String(64), nullable=False, index=True)  # EXECUTION_ATTEMPT, EXECUTION_OUTCOME, SCOPE_VIOLATION, SESSION_SUSPENDED, SESSION_RESUMED, SESSION_TERMINATED
    tool_name = Column(String(128), nullable=True)
    resource_id = Column(String(256), nullable=True)
    verdict = Column(String(32), nullable=True)
    execution_success = Column(Boolean, nullable=True)
    execution_error = Column(Text, nullable=True)
    step_index = Column(Integer, nullable=False, default=1)
    event_payload = Column(JSON, default=dict)
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)

    session = relationship("SentinelTaskSessionModel", back_populates="events")


# ─── SENTINEL Phase 2 Models: Risk Assessments & Containment Actions ───

class SentinelRiskAssessmentModel(Base):
    """
    Persisted point-in-time explainable risk assessment for a task session.
    Tracks risk scores, calibrated risk tier, and component factor breakdowns.
    """
    __tablename__ = "sentinel_risk_assessments"

    id = Column(String(64), primary_key=True, default=lambda: f"ras_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sentinel_task_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    risk_score = Column(Float, nullable=False, default=0.0)
    risk_tier = Column(String(32), nullable=False, default="TIER_0_NOMINAL", index=True)
    factors_json = Column(JSON, default=list)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    session = relationship("SentinelTaskSessionModel", back_populates="risk_assessments")


class SentinelContainmentActionModel(Base):
    """
    Immutable audit record of automated or administrative containment enforcement.
    Tracks containment tier action (STEP_UP, RATE_THROTTLE, REQUIRE_APPROVAL, QUARANTINE, TERMINATE).
    """
    __tablename__ = "sentinel_containment_actions"

    id = Column(String(64), primary_key=True, default=lambda: f"cact_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sentinel_task_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    action_type = Column(String(64), nullable=False, index=True)
    trigger_reason = Column(String(256), nullable=False)
    status = Column(String(32), nullable=False, default="ACTIVE", index=True)
    action_payload = Column(JSON, default=dict)
    enforced_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    session = relationship("SentinelTaskSessionModel", back_populates="containment_actions")


# ─── SENTINEL Phase 3 Models: Semantic Objective Assessments ───

class SentinelObjectiveAssessmentModel(Base):
    """
    Persisted semantic objective alignment assessments from the Semantic Objective Guardian.
    """
    __tablename__ = "sentinel_objective_assessments"

    id = Column(String(64), primary_key=True, default=lambda: f"sem_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), ForeignKey("sentinel_task_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    tool_name = Column(String(128), nullable=False)
    alignment_status = Column(String(64), nullable=False, index=True)
    alignment_score = Column(Float, nullable=False, default=1.0)
    severity = Column(String(32), nullable=False, default="LOW")
    reason_codes_json = Column(JSON, default=list)
    evidence_json = Column(JSON, default=dict)
    limitations = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    session = relationship("SentinelTaskSessionModel", back_populates="objective_assessments")


# ─── Multi-Agent Security Incidents & Messages (Phase 4C) ───

class SecurityIncidentModel(Base):
    """
    Tenant-isolated security incident tracking the lifecycle, correlated telemetry,
    and remediation actions taken across instrumented agent fleets.
    """
    __tablename__ = "security_incidents"

    id = Column(String(64), primary_key=True, default=lambda: f"inc_{uuid.uuid4().hex[:12]}")
    org_id = Column(String(64), nullable=False, index=True)
    title = Column(String(256), nullable=False)
    severity = Column(String(32), nullable=False, default="HIGH", index=True)
    status = Column(String(32), nullable=False, default="DETECTED", index=True)
    trigger_rule_id = Column(String(64), nullable=False, index=True)
    affected_agent_ids_json = Column(JSON, default=list)
    session_ids_json = Column(JSON, default=list)
    summary = Column(Text, default="")
    evidence_trail_json = Column(JSON, default=list)
    containment_action_taken = Column(String(128), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=utc_now)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(128), nullable=True)
    resolution_notes = Column(Text, nullable=True)


class AgentMessageModel(Base):
    """
    Authenticated inter-agent communication messages buffered or audited in backend.
    """
    __tablename__ = "agent_messages"

    id = Column(String(64), primary_key=True, default=lambda: f"msg_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    sender_id = Column(String(128), nullable=False, index=True)
    recipient_id = Column(String(128), nullable=False, index=True)
    message_type = Column(String(64), nullable=False, default="TASK_DELEGATION")
    payload_json = Column(JSON, default=dict)
    signature = Column(String(256), nullable=False)
    nonce = Column(String(64), nullable=False, unique=True, index=True)
    status = Column(String(32), default="PENDING", index=True)  # PENDING, DELIVERED, EXPIRED
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


# ─── Data Provenance & Execution Integrity (Phase 4D) ──────────────────────

class DataProvenanceModel(Base):
    """
    Tenant-isolated cryptographically signed record of data origin, trust level,
    and causal ancestry DAG within agent workflows.
    """
    __tablename__ = "data_provenance"

    id = Column(String(64), primary_key=True, default=lambda: f"prov_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    session_id = Column(String(64), default="", index=True)
    agent_id = Column(String(128), nullable=False, index=True)
    source_type = Column(String(64), nullable=False, index=True)
    source_identifier = Column(String(512), nullable=False)
    input_hash = Column(String(64), nullable=False)
    output_hash = Column(String(64), nullable=False)
    data_classification = Column(String(32), default="CONFIDENTIAL")
    trust_level = Column(String(32), nullable=False, default="UNKNOWN_OR_UNVERIFIED", index=True)
    parent_provenance_ids_json = Column(JSON, default=list)
    transformation_type = Column(String(64), nullable=True)
    decision_id = Column(String(64), nullable=True, index=True)
    incident_id = Column(String(64), nullable=True, index=True)
    signature = Column(String(256), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)


class ExecutionIntegrityRecordModel(Base):
    """
    Immutable log of tool execution authorization validations, digest bindings,
    and anti-replay nonces preventing TOCTOU exploitation.
    """
    __tablename__ = "execution_integrity_records"

    id = Column(String(64), primary_key=True, default=lambda: f"eir_{uuid.uuid4().hex[:16]}")
    org_id = Column(String(64), nullable=False, index=True)
    agent_id = Column(String(128), nullable=False, index=True)
    session_id = Column(String(64), default="", index=True)
    tool_name = Column(String(128), nullable=False, index=True)
    request_digest = Column(String(64), nullable=False)
    policy_version = Column(Integer, default=1)
    status = Column(String(32), default="VALID", index=True)  # VALID, REJECTED, REPLAYED
    rejection_reason = Column(String(256), nullable=True)
    nonce = Column(String(64), nullable=False, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, index=True)




