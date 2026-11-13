"""
INTENTLOCK API Dependencies.
Authentication, Multi-Tenant Resolution, and Database Session Management.
"""

from __future__ import annotations

import re
from typing import Generator, Optional
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token, hash_api_key
from app.db.models import ApiKeyModel, OrganizationModel, UserModel
from app.db.session import SessionLocal


def get_db() -> Generator[Session, None, None]:
    """Provide scoped database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class TenantContext:
    """Encapsulates authenticated tenant information for multi-tenancy."""

    def __init__(
        self,
        org_id: str,
        org_name: str,
        plan: str,
        user: Optional[UserModel] = None,
        api_key: Optional[ApiKeyModel] = None,
    ):
        self.org_id = org_id
        self.org_name = org_name
        self.plan = plan
        self.user = user
        self.api_key = api_key


def get_current_tenant(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: Session = Depends(get_db),
) -> TenantContext:
    """
    Resolve tenant from:
    1. User Bearer JWT Token
    2. Agent API Key (X-API-Key or Bearer ilk_live_...)
    3. Fallback to default organization (for public demo / backwards compatibility)
    """
    token_candidate: Optional[str] = None

    if authorization:
        match = re.match(r"^Bearer\s+(.+)$", authorization, re.IGNORECASE)
        if match:
            token_candidate = match.group(1).strip()

    # Case A: Machine API Key (ilk_live_...)
    key_candidate = x_api_key or (token_candidate if token_candidate and token_candidate.startswith("ilk_") else None)
    if key_candidate:
        key_hash = hash_api_key(key_candidate)
        api_key_record = db.query(ApiKeyModel).filter(
            ApiKeyModel.key_hash == key_hash,
            ApiKeyModel.is_active == True,
        ).first()

        if api_key_record:
            org = db.query(OrganizationModel).filter(OrganizationModel.id == api_key_record.org_id).first()
            if org:
                return TenantContext(
                    org_id=org.id,
                    org_name=org.name,
                    plan=org.plan,
                    api_key=api_key_record,
                )

    # Case B: User JWT Session Token
    if token_candidate and not token_candidate.startswith("ilk_"):
        claims = decode_access_token(token_candidate)
        if claims and "sub" in claims:
            user = db.query(UserModel).filter(UserModel.id == claims["sub"]).first()
            if user:
                org = db.query(OrganizationModel).filter(OrganizationModel.id == user.org_id).first()
                if org:
                    return TenantContext(
                        org_id=org.id,
                        org_name=org.name,
                        plan=org.plan,
                        user=user,
                    )

    # Case C: Backward-compatible Default Tenant (e.g. for existing unauthenticated tests/demo)
    default_org = db.query(OrganizationModel).filter(OrganizationModel.id == "default-org").first()
    if not default_org:
        default_org = OrganizationModel(
            id="default-org",
            name="Default Organization",
            slug="default-org",
            plan="ENTERPRISE",
        )
        db.add(default_org)
        db.commit()
        db.refresh(default_org)

    return TenantContext(
        org_id=default_org.id,
        org_name=default_org.name,
        plan=default_org.plan,
    )


def require_authenticated_user(
    tenant: TenantContext = Depends(get_current_tenant),
) -> UserModel:
    """Enforce that the request is authenticated by a dashboard user."""
    if not tenant.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer JWT session token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return tenant.user
