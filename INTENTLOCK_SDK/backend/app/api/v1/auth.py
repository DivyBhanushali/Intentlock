"""
INTENTLOCK Authentication & Multi-Tenant Organization Management API.
Endpoints for user registration, login, session tokens, and agent API keys.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import TenantContext, get_current_tenant, get_db, require_authenticated_user
from app.core.security import (
    create_access_token,
    generate_api_key,
    hash_password,
    verify_password,
)
from app.db.models import ApiKeyModel, OrganizationModel, UserModel

router = APIRouter()


# ─── Schemas ────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=256)
    password: str = Field(min_length=6)
    full_name: str = "Admin User"
    company_name: str = "My AI Company"


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=256)
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    org_id: str
    org_name: str
    plan: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    initial_api_key: Optional[str] = None


class ApiKeyCreateRequest(BaseModel):
    name: str = "Production Agent Key"


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    created_at: datetime
    last_used_at: Optional[datetime] = None
    raw_key: Optional[str] = None  # Only returned on creation


# ─── Endpoints ──────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new customer organization and its primary administrator account."""
    existing_user = db.query(UserModel).filter(UserModel.email == req.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists.",
        )

    # 1. Create Organization
    slug_base = re.sub(r"[^a-zA-Z0-9]+", "-", req.company_name.lower()).strip("-")
    slug = f"{slug_base}-{uuid.uuid4().hex[:6]}"
    org = OrganizationModel(
        id=f"org_{uuid.uuid4().hex[:12]}",
        name=req.company_name,
        slug=slug,
        plan="GROWTH",
    )
    db.add(org)
    db.flush()

    # 2. Create User
    pwd_hash = hash_password(req.password)
    user = UserModel(
        id=f"usr_{uuid.uuid4().hex[:12]}",
        org_id=org.id,
        email=req.email.lower(),
        full_name=req.full_name,
        password_hash=pwd_hash,
        role="ADMIN",
    )
    db.add(user)
    db.flush()

    # 3. Generate Initial Agent API Key
    raw_key, prefix, key_hash = generate_api_key()
    api_key_obj = ApiKeyModel(
        id=f"key_{uuid.uuid4().hex[:12]}",
        org_id=org.id,
        name="Default Agent Key",
        key_prefix=prefix,
        key_hash=key_hash,
    )
    db.add(api_key_obj)
    db.commit()

    # 4. Generate JWT
    access_token = create_access_token({"sub": user.id, "org_id": org.id, "role": user.role})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            org_id=org.id,
            org_name=org.name,
            plan=org.plan,
        ),
        initial_api_key=raw_key,
    )


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password to receive a JWT session token."""
    user = db.query(UserModel).filter(UserModel.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    org = db.query(OrganizationModel).filter(OrganizationModel.id == user.org_id).first()
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")

    user.last_login_at = datetime.now(timezone.utc)
    db.commit()

    access_token = create_access_token({"sub": user.id, "org_id": org.id, "role": user.role})

    return AuthResponse(
        access_token=access_token,
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            org_id=org.id,
            org_name=org.name,
            plan=org.plan,
        ),
    )


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    user: UserModel = Depends(require_authenticated_user),
    tenant: TenantContext = Depends(get_current_tenant),
):
    """Get the currently logged in user profile and active workspace."""
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        org_id=tenant.org_id,
        org_name=tenant.org_name,
        plan=tenant.plan,
    )


# ─── API Keys Management ────────────────────────────────────────────────────

@router.get("/api-keys", response_model=List[ApiKeyResponse])
def list_api_keys(
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """List all API keys for the current organization."""
    keys = db.query(ApiKeyModel).filter(
        ApiKeyModel.org_id == tenant.org_id,
        ApiKeyModel.is_active == True,
    ).order_by(ApiKeyModel.created_at.desc()).all()
    return keys


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
def create_new_api_key(
    req: ApiKeyCreateRequest,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """Generate a new Stripe-style API key for connecting an AI agent."""
    raw_key, prefix, key_hash = generate_api_key()
    api_key_obj = ApiKeyModel(
        id=f"key_{uuid.uuid4().hex[:12]}",
        org_id=tenant.org_id,
        name=req.name,
        key_prefix=prefix,
        key_hash=key_hash,
    )
    db.add(api_key_obj)
    db.commit()
    db.refresh(api_key_obj)

    return ApiKeyResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key_prefix=api_key_obj.key_prefix,
        is_active=api_key_obj.is_active,
        created_at=api_key_obj.created_at,
        last_used_at=api_key_obj.last_used_at,
        raw_key=raw_key,
    )


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    key_id: str,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """Revoke an active API key."""
    key = db.query(ApiKeyModel).filter(
        ApiKeyModel.id == key_id,
        ApiKeyModel.org_id == tenant.org_id,
    ).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="API Key not found.")

    key.is_active = False
    db.commit()
