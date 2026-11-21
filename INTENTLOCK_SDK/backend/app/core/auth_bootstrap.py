"""
SICTACK Authentication Bootstrap & Narrow Key Resolution (Phase 5A / BLK-001).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Resolves API key identities during pre-authentication bootstrap without weakening
PostgreSQL Row-Level Security policies or opening arbitrary table scans.
"""

from __future__ import annotations

import logging
from typing import Optional
import sqlalchemy as sa
from sqlalchemy.orm import Session

from app.db.models import ApiKeyModel

logger = logging.getLogger("sictack.auth.bootstrap")


def resolve_api_key_record(db: Session, key_hash: str) -> Optional[ApiKeyModel]:
    """
    Narrowly privileged API-key authentication lookup.
    
    1. On PostgreSQL: invokes the SECURITY DEFINER function `sictack_resolve_api_key(p_key_hash)`.
       This executes with definer privileges, retrieving strictly the single record matching
       the cryptographically high-entropy hash without exposing other tenant keys or requiring
       tenant context beforehand.
    2. On SQLite / Test environments: performs direct exact-hash lookup on ApiKeyModel.
    """
    if not key_hash:
        return None

    try:
        bind = db.get_bind()
        if bind and bind.dialect.name == "postgresql":
            stmt = sa.text("""
                SELECT id, org_id, name, key_prefix, is_active,
                       created_at, expires_at, last_used_at, revoked_at,
                       rotated_to_key_id, scopes
                FROM sictack_resolve_api_key(:kh)
            """)
            result = db.execute(stmt, {"kh": key_hash}).mappings().first()
            if not result:
                return None

            return ApiKeyModel(
                id=result["id"],
                org_id=result["org_id"],
                name=result["name"],
                key_prefix=result["key_prefix"],
                key_hash=key_hash,
                is_active=result["is_active"],
                created_at=result["created_at"],
                expires_at=result["expires_at"],
                last_used_at=result["last_used_at"],
                revoked_at=result.get("revoked_at"),
                rotated_to_key_id=result.get("rotated_to_key_id"),
                scopes=result.get("scopes") or [],
            )

        # SQLite or fallback environment: exact cryptographic hash lookup
        return db.query(ApiKeyModel).filter(ApiKeyModel.key_hash == key_hash).first()

    except Exception as e:
        logger.error(f"Error during API key bootstrap resolution: {e}", exc_info=True)
        return None
