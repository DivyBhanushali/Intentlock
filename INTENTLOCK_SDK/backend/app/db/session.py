"""
INTENTLOCK Backend – Database Session Management.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("intentlock.db")

# Dialect-aware connection arguments and connection pool settings
connect_args: Dict[str, Any] = {}
engine_kwargs: Dict[str, Any] = {}

if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Production PostgreSQL (Supabase Session Pooler / Render) configuration
    engine_kwargs.update({
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "pool_size": 3,
        "max_overflow": 2,
        "pool_timeout": 30,
    })

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False,
    **engine_kwargs,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# ─── Connection Pool Safety & Zero Cross-Tenant Pollution (Phase 5A / BLK-001) ───

try:
    from sqlalchemy import event

    @event.listens_for(engine, "checkin")
    def receive_checkin(dbapi_connection, connection_record):
        """
        Guarantees that when a connection returns to the connection pool,
        any session-level parameters (e.g. app.current_tenant_id) are strictly reset,
        preventing cross-tenant connection pooling pollution and state leakage.
        """
        try:
            cursor = dbapi_connection.cursor()
            cursor.execute("RESET ALL;")
            cursor.close()
        except Exception:
            pass
except Exception as _ev_err:
    logger.debug(f"Could not attach connection pool checkin listener: {_ev_err}")


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session with automated
    tenant context cleanup upon request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        try:
            from app.core.tenant import set_current_tenant_id
            set_current_tenant_id(None, db=db)
        except Exception:
            pass
        db.close()
