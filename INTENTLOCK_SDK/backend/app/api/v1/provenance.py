"""
INTENTLOCK 2.0 – Execution Provenance & Evidence Graph API.
Provides end-to-end causal trace correlation:
Authorized Task → Intent Context → Agent Identity → Tool Call → Policy Evaluation → Approval → Execution Result.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.api.deps import TenantContext, get_current_tenant, get_db, require_authenticated_user
from app.db.models import ApprovalModel, AuditEventModel, IntentContextModel, PolicyModel, UserModel

router = APIRouter(prefix="/provenance", tags=["Execution Provenance & Evidence"])


# ─── Schemas ───

class ProvenanceTraceSummary(BaseModel):
    trace_id: str
    org_id: str
    agent_id: Optional[str] = None
    intent_id: Optional[str] = None
    authorized_objective: Optional[str] = None
    total_actions: int
    allowed_count: int
    denied_count: int
    require_approval_count: int
    started_at: datetime
    latest_at: datetime
    final_verdict: str


class EvidenceNode(BaseModel):
    event_id: str
    timestamp: datetime
    tool_name: Optional[str] = None
    verdict: str
    reason: str
    risk_score: float
    action_hash: str
    execution_success: Optional[bool] = None
    policy_id: Optional[str] = None
    approval_id: Optional[str] = None
    approval_status: Optional[str] = None
    sanitized_metadata: Dict[str, Any] = {}


class ProvenanceDetail(BaseModel):
    trace_id: str
    org_id: str
    agent_id: Optional[str] = None
    intent_context: Optional[Dict[str, Any]] = None
    policy_snapshot: Optional[Dict[str, Any]] = None
    timeline: List[EvidenceNode]
    causal_summary: str


# ─── Helper for Redacting Secrets in Metadata ───

def _sanitize_data(data: Any) -> Any:
    """Recursively redact secrets and bearer tokens from metadata."""
    if isinstance(data, dict):
        sanitized = {}
        for k, v in data.items():
            if re.search(r"(password|token|secret|key|authorization|bearer)", k, re.IGNORECASE):
                sanitized[k] = "••••••• [REDACTED]"
            else:
                sanitized[k] = _sanitize_data(v)
        return sanitized
    elif isinstance(data, list):
        return [_sanitize_data(item) for item in data]
    elif isinstance(data, str) and (data.startswith("Bearer ") or data.startswith("ilk_")):
        return f"{data[:8]}••••••••"
    return data


# ─── Endpoints ───

@router.get("", response_model=List[ProvenanceTraceSummary])
def list_provenance_traces(
    agent_id: Optional[str] = None,
    limit: int = 50,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """List grouped execution traces with intent context correlation."""
    query = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.org_id == tenant.org_id)
        .order_by(AuditEventModel.timestamp.desc())
    )
    if agent_id:
        query = query.filter(AuditEventModel.agent_id == agent_id)

    events = query.limit(limit * 10).all()

    # Group by trace_id (fallback to event id if trace_id is empty)
    traces_map: Dict[str, List[AuditEventModel]] = {}
    for ev in events:
        tid = ev.trace_id or f"trace_{ev.id[:12]}"
        if tid not in traces_map:
            traces_map[tid] = []
        traces_map[tid].append(ev)

    results: List[ProvenanceTraceSummary] = []
    for tid, ev_list in list(traces_map.items())[:limit]:
        # Sort ascending by timestamp
        ev_list.sort(key=lambda x: x.timestamp)
        first_ev = ev_list[0]
        last_ev = ev_list[-1]

        allowed_c = sum(1 for e in ev_list if e.verdict == "ALLOW")
        denied_c = sum(1 for e in ev_list if e.verdict == "DENY")
        req_c = sum(1 for e in ev_list if e.verdict == "REQUIRE_APPROVAL")

        # Resolve intent objective if available
        obj_text = None
        if first_ev.intent_id:
            itc = db.query(IntentContextModel).filter(IntentContextModel.id == first_ev.intent_id).first()
            if itc:
                obj_text = itc.authorized_objective

        results.append(
            ProvenanceTraceSummary(
                trace_id=tid,
                org_id=tenant.org_id,
                agent_id=first_ev.agent_id,
                intent_id=first_ev.intent_id or None,
                authorized_objective=obj_text,
                total_actions=len(ev_list),
                allowed_count=allowed_c,
                denied_count=denied_c,
                require_approval_count=req_c,
                started_at=first_ev.timestamp,
                latest_at=last_ev.timestamp,
                final_verdict=last_ev.verdict,
            )
        )

    return results


@router.get("/{trace_id}", response_model=ProvenanceDetail)
def get_trace_provenance_detail(
    trace_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Get full end-to-end evidence graph and causal explanation for a specific trace.
    Connects Authorized Objective → Intent Context → Policy Rules → Approvals → Execution Outcomes.
    """
    events = (
        db.query(AuditEventModel)
        .filter(
            AuditEventModel.org_id == tenant.org_id,
            (AuditEventModel.trace_id == trace_id) | (AuditEventModel.id.like(f"%{trace_id.replace('trace_', '')}%")),
        )
        .order_by(AuditEventModel.timestamp.asc())
        .all()
    )

    if not events:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution trace '{trace_id}' not found.",
        )

    first_ev = events[0]
    last_ev = events[-1]

    # Resolve intent context
    intent_data = None
    if first_ev.intent_id:
        itc = (
            db.query(IntentContextModel)
            .filter(
                IntentContextModel.id == first_ev.intent_id,
                IntentContextModel.org_id == tenant.org_id,
            )
            .first()
        )
        if itc:
            intent_data = {
                "intent_id": itc.id,
                "user_id": itc.user_id,
                "authorized_objective": itc.authorized_objective,
                "allowed_actions": itc.allowed_actions,
                "denied_actions": itc.denied_actions,
                "allowed_resources": itc.allowed_resources,
                "allowed_recipients": itc.allowed_recipients,
                "sensitivity_ceiling": itc.sensitivity_ceiling,
                "context_status": itc.context_status,
                "expiration_timestamp": itc.expiration_timestamp.isoformat(),
            }

    # Resolve policy
    policy_data = None
    if first_ev.policy_id:
        pol = db.query(PolicyModel).filter(PolicyModel.id == first_ev.policy_id).first()
        if pol:
            policy_data = {
                "policy_id": pol.id,
                "name": pol.name,
                "allowed_permissions": pol.allowed_permissions,
                "denied_permissions": pol.denied_permissions,
                "require_approval_permissions": pol.require_approval_permissions,
                "allowed_resources": pol.allowed_resources,
                "allowed_recipients": pol.allowed_recipients,
                "max_sensitivity": pol.max_sensitivity,
            }

    # Build timeline nodes with approval enrichment
    timeline: List[EvidenceNode] = []
    for ev in events:
        app_status = None
        if ev.approval_id:
            app = db.query(ApprovalModel).filter(ApprovalModel.id == ev.approval_id).first()
            if app:
                app_status = app.status

        timeline.append(
            EvidenceNode(
                event_id=ev.id,
                timestamp=ev.timestamp,
                tool_name=ev.tool_name,
                verdict=ev.verdict,
                reason=ev.reason,
                risk_score=ev.risk_score,
                action_hash=ev.action_hash,
                execution_success=ev.execution_success,
                policy_id=ev.policy_id,
                approval_id=ev.approval_id or None,
                approval_status=app_status,
                sanitized_metadata=_sanitize_data(ev.metadata_json or {}),
            )
        )

    # Generate human-readable causal explanation
    summary_parts = []
    if intent_data:
        summary_parts.append(f"Task Objective: \"{intent_data['authorized_objective']}\".")
    summary_parts.append(f"Agent '{first_ev.agent_id}' executed {len(events)} action(s).")
    if any(e.verdict == "DENY" for e in events):
        denied_reasons = set(e.reason for e in events if e.verdict == "DENY")
        summary_parts.append(f"Security violations detected: {', '.join(denied_reasons)}.")
    else:
        summary_parts.append("All actions satisfied zero-trust policy constraints.")

    return ProvenanceDetail(
        trace_id=trace_id,
        org_id=tenant.org_id,
        agent_id=first_ev.agent_id,
        intent_context=intent_data,
        policy_snapshot=policy_data,
        timeline=timeline,
        causal_summary=" ".join(summary_parts),
    )

