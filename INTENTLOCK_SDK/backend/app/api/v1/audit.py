"""
INTENTLOCK Backend – Security Audit Trail Endpoints.
"""

from __future__ import annotations

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db.models import AuditEventModel, AgentModel
from app.schemas.schemas import AuditEventResponse, AuditStatsResponse, AuditVerifyResponse
from app.api.deps import get_current_tenant, TenantContext
from app.core.audit_chain import verify_audit_chain
from intentlock.models import DecisionVerdict

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("/verify", response_model=AuditVerifyResponse)
def verify_audit_log_chain(
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """
    Cryptographically verify the SHA-256 sequential hash chain of the audit trail.
    Detects any tampering, deletion, modification, or sequence corruption.
    """
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    report = verify_audit_chain(db, org_id=tenant.org_id)
    return AuditVerifyResponse(**report)



@router.get("/events", response_model=List[AuditEventResponse])
def list_audit_events(
    agent_id: Optional[str] = None,
    tool_name: Optional[str] = None,
    verdict: Optional[DecisionVerdict] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Query the security audit trail with multi-field filtering."""
    query = db.query(AuditEventModel)

    if agent_id:
        query = query.filter(AuditEventModel.agent_id == agent_id)
    if tool_name:
        query = query.filter(AuditEventModel.tool_name == tool_name)
    if verdict:
        query = query.filter(AuditEventModel.verdict == verdict.value)

    events = (
        query.order_by(AuditEventModel.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return events


@router.get("/events/{event_id}", response_model=AuditEventResponse)
def get_audit_event(event_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a single immutable audit event."""
    event = db.query(AuditEventModel).filter(AuditEventModel.id == event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Audit event '{event_id}' not found",
        )
    return event


@router.get("/stats", response_model=AuditStatsResponse)
def get_audit_stats(db: Session = Depends(get_db)):
    """Get aggregated metrics and counts for the security dashboard."""
    total = db.query(func.count(AuditEventModel.id)).scalar() or 0
    allowed = (
        db.query(func.count(AuditEventModel.id))
        .filter(AuditEventModel.verdict == DecisionVerdict.ALLOW.value)
        .scalar()
        or 0
    )
    denied = (
        db.query(func.count(AuditEventModel.id))
        .filter(AuditEventModel.verdict == DecisionVerdict.DENY.value)
        .scalar()
        or 0
    )
    approval_req = (
        db.query(func.count(AuditEventModel.id))
        .filter(AuditEventModel.verdict == DecisionVerdict.REQUIRE_APPROVAL.value)
        .scalar()
        or 0
    )
    agents = db.query(func.count(AgentModel.id)).scalar() or 0

    return AuditStatsResponse(
        total_events=total,
        allowed_count=allowed,
        denied_count=denied,
        require_approval_count=approval_req,
        active_agents_count=agents,
    )

