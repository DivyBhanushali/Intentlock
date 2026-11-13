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
    RegisterRequest,
    create_new_api_key,
    get_current_user_profile,
    list_api_keys,
    login,
    register,
    revoke_api_key,
)
from app.api.deps import TenantContext
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
