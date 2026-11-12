"""
INTENTLOCK Backend – Policy Management Endpoints.
"""

from __future__ import annotations

import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import PolicyModel
from app.schemas.schemas import PolicyCreate, PolicyUpdate, PolicyResponse

router = APIRouter(prefix="/policies", tags=["Policies"])


@router.get("", response_model=List[PolicyResponse])
def list_policies(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all configured security policies."""
    policies = db.query(PolicyModel).offset(skip).limit(limit).all()
    return policies


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(policy_in: PolicyCreate, db: Session = Depends(get_db)):
    """Create a new security policy."""
    policy_id = str(uuid.uuid4())
    db_policy = PolicyModel(
        id=policy_id,
        name=policy_in.name,
        description=policy_in.description,
        allowed_permissions=policy_in.allowed_permissions,
        denied_permissions=policy_in.denied_permissions,
        require_approval_permissions=policy_in.require_approval_permissions,
        allowed_resources=policy_in.allowed_resources,
        allowed_recipients=policy_in.allowed_recipients,
        max_risk_level=policy_in.max_risk_level.value,
        max_sensitivity=policy_in.max_sensitivity,
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.get("/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific policy by ID."""
    policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(policy_id: str, policy_in: PolicyUpdate, db: Session = Depends(get_db)):
    """Update an existing security policy."""
    db_policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not db_policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )

    update_data = policy_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "max_risk_level" and value is not None:
            setattr(db_policy, field, value.value)
        else:
            setattr(db_policy, field, value)

    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    """Delete a policy by ID."""
    db_policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not db_policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    db.delete(db_policy)
    db.commit()
    return None

