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
    created_at = Column(DateTime(timezone=True), default=utc_now)

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
    role = Column(String(32), default="ADMIN")  # ADMIN, APPROVER, VIEWER
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
    last_used_at = Column(DateTime(timezone=True), nullable=True)

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
    """Stores registered agents and their assigned policies."""
    __tablename__ = "agents"

    id = Column(String(128), primary_key=True)
    org_id = Column(String(64), nullable=True, index=True, default="default-org")
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_active_at = Column(DateTime(timezone=True), default=utc_now)

    policy = relationship("PolicyModel", back_populates="agents")
