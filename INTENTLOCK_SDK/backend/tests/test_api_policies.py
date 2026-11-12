"""
Tests for Policy API route handlers.
"""

from app.api.v1.policies import (
    list_policies,
    create_policy,
    get_policy,
    update_policy,
    delete_policy,
)
from app.schemas.schemas import PolicyCreate, PolicyUpdate
from intentlock.models import RiskLevel
import pytest
from fastapi import HTTPException


def test_create_and_get_policy(db):
    policy_in = PolicyCreate(
        name="Strict Financial Policy",
        description="Controls financial tools",
        allowed_permissions=["check_balance", "view_transactions"],
        denied_permissions=["transfer_funds"],
        require_approval_permissions=["wire_transfer"],
        allowed_resources=["accounts/*"],
        allowed_recipients=["treasury@company.com"],
        max_risk_level=RiskLevel.HIGH,
        max_sensitivity=7,
    )

    created = create_policy(policy_in=policy_in, db=db)
    assert created.id is not None
    assert created.name == "Strict Financial Policy"
    assert "check_balance" in created.allowed_permissions

    fetched = get_policy(policy_id=created.id, db=db)
    assert fetched.id == created.id
    assert fetched.name == "Strict Financial Policy"


def test_list_policies(db):
    p1 = PolicyCreate(name="Policy 1")
    p2 = PolicyCreate(name="Policy 2")
    create_policy(p1, db)
    create_policy(p2, db)

    policies = list_policies(skip=0, limit=10, db=db)
    assert len(policies) == 2
    names = {p.name for p in policies}
    assert names == {"Policy 1", "Policy 2"}


def test_update_policy(db):
    created = create_policy(PolicyCreate(name="Old Name"), db)
    updated = update_policy(
        policy_id=created.id,
        policy_in=PolicyUpdate(name="New Name", max_sensitivity=9),
        db=db,
    )
    assert updated.name == "New Name"
    assert updated.max_sensitivity == 9


def test_delete_policy(db):
    created = create_policy(PolicyCreate(name="To Delete"), db)
    delete_policy(policy_id=created.id, db=db)

    with pytest.raises(HTTPException) as exc_info:
        get_policy(policy_id=created.id, db=db)
    assert exc_info.value.status_code == 404
