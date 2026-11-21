"""
SICTACK Multi-Tenant Isolation & Context Management (Phase 4G / BLK-001).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Enforces strict tenant boundary checks across backend queries, API requests, and database sessions.
Sets PostgreSQL session configuration parameter `app.current_tenant_id` for Row-Level Security.
"""

from __future__ import annotations

import contextvars
from contextlib import contextmanager
import logging
from typing import Generator, Optional
import sqlalchemy as sa
from sqlalchemy.orm import Session

try:
    from sictack.exceptions import SictackError, IntentLockError
except ImportError:
    class SictackError(Exception):
        pass
    IntentLockError = SictackError

logger = logging.getLogger("sictack.tenant")

_current_tenant_cv: contextvars.ContextVar[Optional[str]] = contextvars.ContextVar(
    "current_tenant_id", default=None
)


class TenantAccessDeniedError(IntentLockError):
    """Raised when an operation attempts cross-tenant data access or unauthorized tenant scoping."""
    def __init__(self, message: str = "Cross-tenant access violation: operation not permitted"):
        super().__init__(message)


def get_current_tenant_id() -> Optional[str]:
    """Retrieves current execution tenant ID from context."""
    return _current_tenant_cv.get()


def set_current_tenant_id(tenant_id: Optional[str], db: Optional[Session] = None) -> None:
    """
    Sets current tenant ID in execution context and, if database session is provided
    and dialect is PostgreSQL, executes `SET LOCAL app.current_tenant_id = :tenant_id`.
    """
    _current_tenant_cv.set(tenant_id)

    if db is not None and tenant_id:
        try:
            bind = db.get_bind()
            if bind and bind.dialect.name == "postgresql":
                db.execute(
                    sa.text("SET LOCAL app.current_tenant_id = :tid"),
                    {"tid": tenant_id},
                )
        except Exception as e:
            logger.debug(f"Could not set PostgreSQL tenant setting: {e}")


@contextmanager
def tenant_context(tenant_id: str, db: Optional[Session] = None) -> Generator[str, None, None]:
    """
    Context manager scoping execution to a specific tenant ID.
    Guarantees restoration of previous tenant context upon exit.
    """
    prev_tenant = _current_tenant_cv.get()
    try:
        set_current_tenant_id(tenant_id, db=db)
        yield tenant_id
    finally:
        set_current_tenant_id(prev_tenant, db=db)


def verify_tenant_access(requester_tenant_id: str, resource_tenant_id: str) -> None:
    """
    Enforces that the requesting tenant strictly matches the target resource tenant.
    Prevents cross-tenant information leakage and privilege elevation.
    """
    if not requester_tenant_id or not resource_tenant_id:
        raise TenantAccessDeniedError("Missing tenant identification for resource access")

    if requester_tenant_id != resource_tenant_id:
        logger.error(
            f"Tenant boundary violation: requester '{requester_tenant_id}' attempted to access "
            f"resource belonging to tenant '{resource_tenant_id}'"
        )
        raise TenantAccessDeniedError(
            f"Access denied: Resource does not belong to tenant '{requester_tenant_id}'"
        )
