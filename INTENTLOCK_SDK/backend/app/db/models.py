"""
INTENTLOCK Backend – SQLAlchemy ORM Models.
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


class PolicyModel(Base):
    """Stores declarative security policies."""
    __tablename__ = "policies"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
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


class ApprovalModel(Base):
    """Stores human-in-the-loop approval requests."""
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    action_hash = Column(String(64), nullable=False, index=True)
    tool_name = Column(String(128), nullable=False)
    agent_id = Column(String(128), default="default-agent")
    status = Column(String(32), default="PENDING", index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    resolved_by = Column(String(128), default="")
    consumed = Column(Boolean, default=False)
    arguments_json = Column(JSON, default=dict)


class AuditEventModel(Base):
    """Immutable audit trail of all policy evaluations and tool executions."""
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, default=lambda: str(uuid.uuid4()))
    timestamp = Column(DateTime(timezone=True), default=utc_now, index=True)
    agent_id = Column(String(128), index=True)
    tool_name = Column(String(128), index=True)
    verdict = Column(String(32), nullable=False, index=True)
    reason = Column(String(256), default="")
    policy_id = Column(String(64), index=True)
    action_hash = Column(String(64), default="")
    approval_id = Column(String(64), default="")
    risk_score = Column(Float, default=0.0)
    execution_success = Column(Boolean, nullable=True)
    execution_error = Column(Text, default="")
    metadata_json = Column(JSON, default=dict)


class AgentModel(Base):
    """Stores registered agents and their assigned policies."""
    __tablename__ = "agents"

    id = Column(String(128), primary_key=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, default="")
    policy_id = Column(String(64), ForeignKey("policies.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    last_active_at = Column(DateTime(timezone=True), default=utc_now)

    policy = relationship("PolicyModel", back_populates="agents")

