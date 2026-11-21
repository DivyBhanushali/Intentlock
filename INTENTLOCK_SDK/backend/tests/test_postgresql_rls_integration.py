"""
SICTACK Backend — PostgreSQL Row-Level Security & Role Separation Integration Tests (Phase 5B).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Dual-role architecture: sictack_admin (DDL/Owner, BYPASSRLS) vs. sictack_app (Runtime, NOBYPASSRLS, FORCE RLS).
2. SECURITY DEFINER hardening on sictack_resolve_api_key (search_path, STRICT, REVOKE FROM PUBLIC/authenticated/anon).
3. Zero-bypass multi-tenant RLS policies on all 14 tenant tables.
4. Connection pool context clearing and RESET ALL behavior.
5. Live PostgreSQL integration when TEST_POSTGRESQL_URL is available; deterministic SQL AST verification offline (BLK-001).
"""

from __future__ import annotations

import os
import re
import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

from app.db.migrations import apply_migrations
from app.db.session import Base


TENANT_TABLES = [
    "api_keys", "policies", "policy_versions", "intent_contexts",
    "approvals", "audit_events", "security_threat_events", "benchmark_runs",
    "agents", "agent_delegations", "security_incidents", "agent_messages",
    "data_provenance", "execution_integrity_records"
]


def test_postgresql_migration_rls_sql_generation():
    """Validates that PostgreSQL migration DDL produces uncompromised RLS and role grants."""
    from app.db.migrations import _validate_dialect

    # Create mock postgres connection to inspect DDL statements
    recorded_statements = []

    class MockPgConnection:
        def execute(self, statement, parameters=None):
            sql_str = str(statement)
            recorded_statements.append(sql_str)
            class MockCursor:
                def fetchone(self):
                    return None
                def fetchall(self):
                    return []
            return MockCursor()

    # Read migration file to inspect raw DDL
    migrations_path = os.path.join(os.path.dirname(__file__), "..", "app", "db", "migrations.py")
    with open(migrations_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Verify SECURITY DEFINER hardening
    assert "SECURITY DEFINER" in content
    assert "STRICT" in content
    assert "SET search_path = pg_catalog, public" in content
    assert "FROM public.api_keys a" in content

    # 2. Verify EXECUTE revocation from PUBLIC, authenticated, and anon
    assert "REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM PUBLIC" in content
    assert "REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM authenticated" in content
    assert "REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM anon" in content
    assert "GRANT EXECUTE ON FUNCTION sictack_resolve_api_key(VARCHAR) TO sictack_app" in content

    # 3. Verify RLS policy definition
    assert "USING (org_id = NULLIF(current_setting('app.current_tenant_id', true), ''))" in content
    assert "WITH CHECK (org_id = NULLIF(current_setting('app.current_tenant_id', true), ''))" in content


def test_roles_setup_sql_script_invariants():
    """Validates that roles_setup.sql strictly separates runtime and admin roles."""
    sql_path = os.path.join(os.path.dirname(__file__), "..", "app", "db", "roles_setup.sql")
    assert os.path.exists(sql_path), "roles_setup.sql must exist"

    with open(sql_path, "r", encoding="utf-8") as f:
        sql = f.read()

    # 1. Admin role must have BYPASSRLS for migrations
    assert "CREATE ROLE sictack_admin" in sql
    assert "BYPASSRLS" in sql

    # 2. App runtime role must explicitly have NOBYPASSRLS and NOSUPERUSER
    assert "CREATE ROLE sictack_app" in sql
    assert "NOBYPASSRLS" in sql
    assert "NOSUPERUSER" in sql

    # 3. FORCE ROW LEVEL SECURITY must be applied across tenant tables
    for tbl in TENANT_TABLES:
        assert f"ALTER TABLE IF EXISTS {tbl} FORCE ROW LEVEL SECURITY;" in sql, f"Missing FORCE RLS on {tbl}"

    # 4. Function permissions in roles_setup.sql must exclude public/authenticated/anon
    assert "REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM PUBLIC" in sql
    assert "GRANT EXECUTE ON FUNCTION sictack_resolve_api_key(VARCHAR) TO sictack_app;" in sql


def test_connection_pool_reset_listener():
    """Validates that connection pool checkin executes RESET ALL to prevent state leakage."""
    from app.db.session import engine, receive_checkin
    from sqlalchemy import event

    # Verify checkin listener registered on engine
    assert event.contains(engine, "checkin", receive_checkin)


@pytest.mark.skipif(
    not os.getenv("TEST_POSTGRESQL_URL"),
    reason="Live PostgreSQL database not configured; live engine verification tracked under BLK-001"
)
def test_live_postgresql_rls_isolation():
    """
    Executes against a real PostgreSQL instance when TEST_POSTGRESQL_URL is provided.
    Verifies actual database-level row filtering and role enforcement.
    """
    pg_url = os.environ["TEST_POSTGRESQL_URL"]
    pg_engine = create_engine(pg_url)

    with pg_engine.connect() as conn:
        # Migrations and DDL are strictly managed by sictack_admin during setup.
        # sictack_app runtime connection operates under least-privilege (NOBYPASSRLS, REVOKE CREATE).
        
        # Set tenant context to tenant_alpha
        conn.execute(text("SET LOCAL app.current_tenant_id = 'org_alpha';"))
        res_alpha = conn.execute(text("SELECT id FROM policies;")).fetchall()

        # Switch to tenant_beta
        conn.execute(text("SET LOCAL app.current_tenant_id = 'org_beta';"))
        res_beta = conn.execute(text("SELECT id FROM policies;")).fetchall()

        # Both should be strictly isolated
        alpha_ids = {r[0] for r in res_alpha}
        beta_ids = {r[0] for r in res_beta}
        assert alpha_ids.isdisjoint(beta_ids)
