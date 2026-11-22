"""
INTENTLOCK Backend – Database Session Management.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

logger = logging.getLogger("sictack.db")

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
        Ensures the connection remains in an IDLE state without open transactions.
        """
        if dbapi_connection is None:
            return

        # Check dialect: only PostgreSQL connections support and require RESET ALL session cleanup.
        dialect_name = getattr(getattr(engine, "dialect", None), "name", "")
        if dialect_name != "postgresql" and not getattr(dbapi_connection, "_force_pg_test", False):
            return

        if getattr(dbapi_connection, "closed", False):
            return

        def _fail_closed(exc: BaseException, reason: str):
            logger.error(
                f"Security checkin failure ({reason}); invalidating and closing connection: {exc}",
                exc_info=True,
            )
            if connection_record is not None and hasattr(connection_record, "invalidate"):
                try:
                    connection_record.invalidate(exc)
                except Exception:
                    pass
            try:
                dbapi_connection.close()
            except Exception:
                pass
            raise exc

        # 1. Rollback any open or dangling transaction to guarantee no uncommitted
        # application state survives, and to transition the connection to IDLE status.
        # Never commit an application transaction during pool checkin.
        # Fail-closed: do not silently suppress rollback failures.
        if hasattr(dbapi_connection, "rollback"):
            try:
                dbapi_connection.rollback()
            except Exception as rb_exc:
                _fail_closed(rb_exc, "rollback failed")

        # 2. Execute RESET ALL in autocommit mode so that session configuration
        # parameters are cleared without starting a new transaction block (INTRANS).
        before_autocommit = getattr(dbapi_connection, "autocommit", False)
        autocommit_modified = False
        try:
            if not before_autocommit:
                dbapi_connection.autocommit = True
                autocommit_modified = True

            cursor = dbapi_connection.cursor()
            try:
                cursor.execute("RESET ALL;")
            finally:
                try:
                    cursor.close()
                except Exception:
                    pass
        except Exception as reset_exc:
            _fail_closed(reset_exc, "RESET ALL execution failed")
        finally:
            # 3. Guarantee safe restoration of autocommit state across all paths
            if autocommit_modified and not getattr(dbapi_connection, "closed", False):
                try:
                    dbapi_connection.autocommit = before_autocommit
                except Exception as ac_exc:
                    _fail_closed(ac_exc, "autocommit restoration failed")

except Exception as _ev_err:
    logger.critical(
        f"CRITICAL: Failed to register PostgreSQL connection pool security listener: {_ev_err}",
        exc_info=True,
    )
    raise RuntimeError(
        f"CRITICAL: Failed to register PostgreSQL connection pool security listener: {_ev_err}"
    ) from _ev_err


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
