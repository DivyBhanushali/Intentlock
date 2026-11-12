"""
INTENTLOCK Backend – Human-in-the-Loop Approval Endpoints.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import ApprovalModel, AuditEventModel
from app.schemas.schemas import ApprovalResponse, ApprovalActionRequest
from intentlock.models import ApprovalStatus

router = APIRouter(prefix="/approvals", tags=["Approvals"])


@router.get("", response_model=List[ApprovalResponse])
def list_approvals(
    status_filter: Optional[ApprovalStatus] = Query(None, alias="status"),
    agent_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List approval requests with optional status filtering."""
    query = db.query(ApprovalModel)
    if status_filter:
        query = query.filter(ApprovalModel.status == status_filter.value)
    if agent_id:
        query = query.filter(ApprovalModel.agent_id == agent_id)

    approvals = (
        query.order_by(ApprovalModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return approvals


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval(approval_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific approval request."""
    approval = db.query(ApprovalModel).filter(ApprovalModel.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found",
        )
    return approval


@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
def approve_request(
    approval_id: str,
    action: ApprovalActionRequest,
    db: Session = Depends(get_db),
):
    """Grant human approval for a pending tool action."""
    approval = db.query(ApprovalModel).filter(ApprovalModel.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found",
        )

    if approval.status != ApprovalStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request is already in status '{approval.status}'",
        )

    now = datetime.now(timezone.utc)
    expires_at = approval.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < now:
        approval.status = ApprovalStatus.EXPIRED.value
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Approval request has expired",
        )

    approval.status = ApprovalStatus.APPROVED.value
    approval.resolved_at = now
    approval.resolved_by = action.approver_id
    db.commit()
    db.refresh(approval)
    return approval


@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
def reject_request(
    approval_id: str,
    action: ApprovalActionRequest,
    db: Session = Depends(get_db),
):
    """Reject a pending tool action."""
    approval = db.query(ApprovalModel).filter(ApprovalModel.id == approval_id).first()
    if not approval:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Approval request '{approval_id}' not found",
        )

    if approval.status != ApprovalStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval request is already in status '{approval.status}'",
        )

    now = datetime.now(timezone.utc)
    approval.status = ApprovalStatus.REJECTED.value
    approval.resolved_at = now
    approval.resolved_by = action.approver_id
    db.commit()
    db.refresh(approval)
    return approval

