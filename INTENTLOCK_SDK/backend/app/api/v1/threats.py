"""
INTENTLOCK 2.0 — Threat Intelligence & Anomaly Response API
Provides threat queries, risk statistics, and mitigation status updates for tenant security teams.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_tenant, get_db, TenantContext
from app.db.models import SecurityThreatEventModel
from app.schemas.schemas import (
    SecurityThreatResponse,
    ThreatMitigateRequest,
    ThreatStatsResponse,
)

router = APIRouter(prefix="/threats", tags=["Threat Intelligence"])


@router.get("", response_model=List[SecurityThreatResponse])
def list_threats(
    status_filter: Optional[str] = Query(None, alias="status"),
    severity: Optional[str] = Query(None),
    agent_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """List detected security threat events within the tenant's organization."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    query = db.query(SecurityThreatEventModel).filter(SecurityThreatEventModel.org_id == tenant.org_id)

    if status_filter and isinstance(status_filter, str):
        query = query.filter(SecurityThreatEventModel.mitigation_status == status_filter.upper())
    if severity and isinstance(severity, str):
        query = query.filter(SecurityThreatEventModel.severity == severity.upper())
    if agent_id and isinstance(agent_id, str):
        query = query.filter(SecurityThreatEventModel.agent_id == agent_id)

    threats = (
        query.order_by(desc(SecurityThreatEventModel.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return threats


@router.get("/stats", response_model=ThreatStatsResponse)
def get_threat_stats(
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Aggregates threat statistics across the organization for SecOps visibility."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    all_threats = (
        db.query(SecurityThreatEventModel)
        .filter(SecurityThreatEventModel.org_id == tenant.org_id)
        .all()
    )

    total = len(all_threats)
    active = sum(1 for t in all_threats if t.mitigation_status == "ACTIVE")
    critical = sum(1 for t in all_threats if t.severity == "CRITICAL" and t.mitigation_status == "ACTIVE")
    high = sum(1 for t in all_threats if t.severity == "HIGH" and t.mitigation_status == "ACTIVE")

    categories: dict[str, int] = {}
    for t in all_threats:
        categories[t.threat_category] = categories.get(t.threat_category, 0) + 1

    return ThreatStatsResponse(
        total_threats=total,
        active_threats=active,
        critical_threats=critical,
        high_threats=high,
        categories=categories,
    )


@router.post("/{threat_id}/mitigate", response_model=SecurityThreatResponse)
def mitigate_threat(
    threat_id: str,
    payload: ThreatMitigateRequest,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Updates mitigation status for a detected threat (e.g. MITIGATED or DISMISSED)."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    threat = (
        db.query(SecurityThreatEventModel)
        .filter(
            SecurityThreatEventModel.id == threat_id,
            SecurityThreatEventModel.org_id == tenant.org_id,
        )
        .first()
    )

    if not threat:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Security threat '{threat_id}' not found for tenant",
        )

    threat.mitigation_status = payload.status.upper()
    if payload.note:
        threat.description = f"{threat.description}\n[Mitigation Note]: {payload.note}"

    db.commit()
    db.refresh(threat)
    return threat
