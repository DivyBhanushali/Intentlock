"""
INTENTLOCK 2.0 – Intent Authorization Context Management API.
Endpoints for issuing, inspecting, listing, and revoking task-scoped Intent Contexts.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import (
    TenantContext,
    get_current_tenant,
    get_db,
    require_approver_or_admin,
    require_authenticated_user,
)
from app.db.models import IntentContextModel, UserModel
from app.schemas.schemas import (
    IntentContextCreate,
    IntentContextResponse,
    IntentContextRevoke,
)

router = APIRouter(prefix="/intents", tags=["Intent Authorization"])


@router.get("", response_model=List[IntentContextResponse])
def list_intent_contexts(
    agent_id: Optional[str] = None,
    status_filter: Optional[str] = Query(None, alias="status"),
    skip: int = 0,
    limit: int = 50,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """List intent authorization contexts scoped to caller's organization."""
    query = db.query(IntentContextModel).filter(IntentContextModel.org_id == tenant.org_id)

    if agent_id and isinstance(agent_id, str):
        query = query.filter(IntentContextModel.agent_id == agent_id)
    if status_filter and isinstance(status_filter, str):
        query = query.filter(IntentContextModel.context_status == status_filter.upper())


    intents = (
        query.order_by(IntentContextModel.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    # Check expiration on read and update status if needed
    now = datetime.now(timezone.utc)
    for intent in intents:
        if intent.context_status == "ACTIVE":
            exp = intent.expiration_timestamp
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            if now > exp:
                intent.context_status = "EXPIRED"
                db.commit()

    return intents


@router.post("", response_model=IntentContextResponse, status_code=status.HTTP_201_CREATED)
def issue_intent_context(
    req: IntentContextCreate,
    tenant: TenantContext = Depends(get_current_tenant),
    current_user: UserModel = Depends(require_approver_or_admin),
    db: Session = Depends(get_db),
):
    """
    Issue an immutable task-scoped Intent Authorization Context.
    Only authorized principals (ADMIN or APPROVER) can issue intent authorizations.
    """
    now = datetime.now(timezone.utc)
    expiration = now + timedelta(seconds=req.ttl_seconds)

    intent_id = f"itc_{uuid.uuid4().hex[:12]}"
    new_intent = IntentContextModel(
        id=intent_id,
        org_id=tenant.org_id,
        user_id=current_user.id,
        agent_id=req.agent_id,
        authorized_objective=req.authorized_objective,
        allowed_actions=req.allowed_actions,
        denied_actions=req.denied_actions,
        allowed_permissions=req.allowed_permissions,
        allowed_resources=req.allowed_resources,
        allowed_recipients=req.allowed_recipients,
        sensitivity_ceiling=req.sensitivity_ceiling,
        execution_scope=req.execution_scope,
        expiration_timestamp=expiration,
        context_status="ACTIVE",
        authorization_version=1,
        created_at=now,
    )
    db.add(new_intent)
    db.commit()
    db.refresh(new_intent)
    return new_intent


@router.get("/{intent_id}", response_model=IntentContextResponse)
def get_intent_context(
    intent_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details of an authorized intent context."""
    intent = (
        db.query(IntentContextModel)
        .filter(
            IntentContextModel.id == intent_id,
            IntentContextModel.org_id == tenant.org_id,
        )
        .first()
    )
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intent authorization context '{intent_id}' not found.",
        )

    # Check expiry
    now = datetime.now(timezone.utc)
    if intent.context_status == "ACTIVE":
        exp = intent.expiration_timestamp
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if now > exp:
            intent.context_status = "EXPIRED"
            db.commit()

    return intent


@router.post("/{intent_id}/revoke", response_model=IntentContextResponse)
def revoke_intent_context(
    intent_id: str,
    req: IntentContextRevoke,
    tenant: TenantContext = Depends(get_current_tenant),
    current_user: UserModel = Depends(require_approver_or_admin),
    db: Session = Depends(get_db),
):
    """
    Explicitly revoke an active intent authorization context.
    Causes any subsequent tool calls under this intent to immediately fail closed.
    """
    intent = (
        db.query(IntentContextModel)
        .filter(
            IntentContextModel.id == intent_id,
            IntentContextModel.org_id == tenant.org_id,
        )
        .first()
    )
    if not intent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Intent authorization context '{intent_id}' not found.",
        )

    if intent.context_status == "REVOKED":
        return intent

    now = datetime.now(timezone.utc)
    intent.context_status = "REVOKED"
    intent.revoked_at = now
    intent.revoked_reason = req.reason
    db.commit()
    db.refresh(intent)
    return intent
