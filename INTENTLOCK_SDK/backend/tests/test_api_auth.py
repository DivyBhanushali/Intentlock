"""
INTENTLOCK Backend – Authentication & Multi-Tenancy Tests.
Tests user registration, login JWT generation, profile lookup,
and Stripe-style API key generation/revocation.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.api.v1.auth import (
    ApiKeyCreateRequest,
    LoginRequest,
    MemberInviteRequest,
    MemberUpdateRequest,
    RegisterRequest,
    create_new_api_key,
    get_current_user_profile,
    invite_team_member,
    list_api_keys,
    list_team_members,
    login,
    register,
    remove_team_member,
    revoke_api_key,
    update_team_member,
)
from app.api.deps import TenantContext, require_admin_user

from app.db.session import Base
from app.db.models import OrganizationModel, UserModel, ApiKeyModel
from app.core.security import verify_password, hash_api_key


@pytest.fixture
def auth_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()


def test_register_creates_org_user_and_api_key(auth_db):
    req = RegisterRequest(
        email="founder@acme-ai.com",
        password="securePassword123!",
        full_name="Alice Founder",
        company_name="Acme AI Technologies",
    )
    res = register(req, db=auth_db)

    assert bool(res.access_token)
    assert res.user.email == "founder@acme-ai.com"
    assert res.user.role == "ADMIN"
    assert res.user.org_name == "Acme AI Technologies"
    assert res.initial_api_key.startswith("ilk_live_")

    # Verify stored in DB
    user = auth_db.query(UserModel).filter(UserModel.email == "founder@acme-ai.com").first()
    assert user is not None
    assert verify_password("securePassword123!", user.password_hash)


def test_login_success_and_failure(auth_db):
    # 1. Register
    reg_req = RegisterRequest(
        email="bob@cybersec.io",
        password="MySecretPassword#1",
        full_name="Bob Security",
        company_name="CyberSec Corp",
    )
    register(reg_req, db=auth_db)

    # 2. Login with correct password
    login_req = LoginRequest(email="bob@cybersec.io", password="MySecretPassword#1")
    login_res = login(login_req, db=auth_db)
    assert bool(login_res.access_token)
    assert login_res.user.email == "bob@cybersec.io"

    # 3. Login with wrong password
    with pytest.raises(Exception):
        bad_req = LoginRequest(email="bob@cybersec.io", password="WrongPassword!")
        login(bad_req, db=auth_db)


def test_api_key_lifecycle(auth_db):
    # 1. Setup tenant & user
    reg = register(
        RegisterRequest(
            email="dev@botfarm.io",
            password="password123",
            full_name="Bot Farmer",
            company_name="BotFarm Ltd",
        ),
        db=auth_db,
    )
    user = auth_db.query(UserModel).filter(UserModel.id == reg.user.id).first()
    tenant = TenantContext(
        org_id=reg.user.org_id,
        org_name=reg.user.org_name,
        plan="GROWTH",
        user=user,
    )

    # 2. Create second API key
    new_key_res = create_new_api_key(
        ApiKeyCreateRequest(name="Staging Bot Key"),
        tenant=tenant,
        user=user,
        db=auth_db,
    )
    assert new_key_res.raw_key.startswith("ilk_live_")
    assert new_key_res.name == "Staging Bot Key"

    # 3. List keys
    keys = list_api_keys(tenant=tenant, user=user, db=auth_db)
    assert len(keys) == 2  # initial key + new key

    # 4. Revoke key
    revoke_api_key(new_key_res.id, tenant=tenant, user=user, db=auth_db)
    active_keys = list_api_keys(tenant=tenant, user=user, db=auth_db)
    assert len(active_keys) == 1


def test_team_members_lifecycle(auth_db):
    # 1. Register admin
    reg = register(
        RegisterRequest(
            email="ceo@enterprise.ai",
            password="enterprisePass123",
            full_name="CEO Boss",
            company_name="Enterprise AI Systems",
        ),
        db=auth_db,
    )
    admin_user = auth_db.query(UserModel).filter(UserModel.id == reg.user.id).first()
    tenant = TenantContext(
        org_id=reg.user.org_id,
        org_name=reg.user.org_name,
        plan="GROWTH",
        user=admin_user,
    )

    # 2. List members - initially just the admin
    members = list_team_members(user=admin_user, tenant=tenant, db=auth_db)
    assert len(members) == 1
    assert members[0].email == "ceo@enterprise.ai"
    assert members[0].role == "ADMIN"

    # 3. Invite APPROVER
    approver = invite_team_member(
        MemberInviteRequest(
            email="secops@enterprise.ai",
            password="secopsPassword456",
            full_name="SecOps Engineer",
            role="APPROVER",
        ),
        current_admin=admin_user,
        tenant=tenant,
        db=auth_db,
    )
    assert approver.email == "secops@enterprise.ai"
    assert approver.role == "APPROVER"

    # 4. Invite VIEWER
    viewer = invite_team_member(
        MemberInviteRequest(
            email="auditor@enterprise.ai",
            password="auditorPassword789",
            full_name="Compliance Auditor",
            role="VIEWER",
        ),
        current_admin=admin_user,
        tenant=tenant,
        db=auth_db,
    )
    assert viewer.email == "auditor@enterprise.ai"
    assert viewer.role == "VIEWER"

    # 5. List members now returns 3
    members_updated = list_team_members(user=admin_user, tenant=tenant, db=auth_db)
    assert len(members_updated) == 3

    # 6. Update viewer's name
    updated_viewer = update_team_member(
        user_id=viewer.id,
        req=MemberUpdateRequest(full_name="Lead Compliance Auditor"),
        current_admin=admin_user,
        tenant=tenant,
        db=auth_db,
    )
    assert updated_viewer.full_name == "Lead Compliance Auditor"

    # 7. Self-deletion guard
    with pytest.raises(Exception) as excinfo:
        remove_team_member(
            user_id=admin_user.id,
            current_admin=admin_user,
            tenant=tenant,
            db=auth_db,
        )
    assert "cannot remove your own account" in str(excinfo.value)

    # 8. Remove viewer
    remove_team_member(
        user_id=viewer.id,
        current_admin=admin_user,
        tenant=tenant,
        db=auth_db,
    )
    members_after_delete = list_team_members(user=admin_user, tenant=tenant, db=auth_db)
    assert len(members_after_delete) == 2
    assert all(m.id != viewer.id for m in members_after_delete)


def test_team_members_rbac_and_duplicate_prevention(auth_db):
    from fastapi import HTTPException

    # 1. Register admin & approver
    reg = register(
        RegisterRequest(
            email="founder@shield.ai",
            password="founderPass123",
            full_name="Founder",
            company_name="Shield AI",
        ),
        db=auth_db,
    )
    admin_user = auth_db.query(UserModel).filter(UserModel.id == reg.user.id).first()
    tenant = TenantContext(
        org_id=reg.user.org_id,
        org_name=reg.user.org_name,
        plan="GROWTH",
        user=admin_user,
    )

    approver_user = invite_team_member(
        MemberInviteRequest(
            email="engineer@shield.ai",
            password="engPassword123",
            full_name="Lead Engineer",
            role="APPROVER",
        ),
        current_admin=admin_user,
        tenant=tenant,
        db=auth_db,
    )

    # 2. Duplicate email should fail with 409
    with pytest.raises(HTTPException) as excinfo:
        invite_team_member(
            MemberInviteRequest(
                email="engineer@shield.ai",
                password="anotherPassword",
                full_name="Duplicate",
                role="VIEWER",
            ),
            current_admin=admin_user,
            tenant=tenant,
            db=auth_db,
        )
    assert excinfo.value.status_code == 409

    # 3. Non-admin attempting to invite should fail via require_admin_user
    with pytest.raises(HTTPException) as rbac_exc:
        require_admin_user(approver_user)
    assert rbac_exc.value.status_code == 403


