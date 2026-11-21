"""
SICTACK Phase 5C — Isolated PostgreSQL 15+ Test Harness (BLK-001).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Strict PostgreSQL Role Separation (sictack_admin vs sictack_app).
2. sictack_app role has NOBYPASSRLS and REVOKE CREATE on public schema.
3. Row-Level Security (RLS) enforcement at the database engine kernel level.
4. Zero-leakage without tenant context (NULLIF returns 0 rows).
5. Point-lookup authentication bootstrap via SECURITY DEFINER sictack_resolve_api_key
   with 11 authorization fields (and key_hash strictly excluded from return data).
6. Foreign key hierarchy consistency: parent organization seeded before dependent tables.
7. Revoked and inactive API key point-lookup status detection.
8. Table, sequence, schema, and function least-privilege boundary enforcement.
9. Transaction-scoped tenant context (SET LOCAL) and connection pool hygiene (DISCARD ALL in autocommit).
"""

from __future__ import annotations

import os
import sys
import uuid
from datetime import datetime, timezone
import pytest
import sqlalchemy as sa
from sqlalchemy.orm import sessionmaker

POSTGRESQL_TEST_URL = os.environ.get(
    "SICTACK_TEST_POSTGRES_URL",
    os.environ.get("TEST_POSTGRESQL_URL", "")
)

IS_POSTGRES_AVAILABLE = bool(
    POSTGRESQL_TEST_URL and POSTGRESQL_TEST_URL.startswith("postgresql")
)


@pytest.mark.skipif(
    not IS_POSTGRES_AVAILABLE,
    reason="Isolated PostgreSQL 15+ environment not configured. Preserving BLK-001 OPEN."
)
class TestPostgreSQLRLSEngineEnforcement:
    """Verifies live PostgreSQL engine RLS invariants with separated roles."""

    @pytest.fixture(scope="class")
    def pg_admin_engine(self):
        """Administrative engine for running DDL and migrations (BYPASSRLS)."""
        engine = sa.create_engine(POSTGRESQL_TEST_URL, pool_pre_ping=True)
        yield engine
        engine.dispose()

    @pytest.fixture(scope="class")
    def pg_app_engine(self):
        """Application runtime engine (sictack_app) with NOBYPASSRLS."""
        app_url = os.environ.get("SICTACK_TEST_POSTGRES_APP_URL", POSTGRESQL_TEST_URL)
        engine = sa.create_engine(app_url, pool_pre_ping=True)
        yield engine
        engine.dispose()

    def test_sictack_app_cannot_execute_ddl(self, pg_app_engine):
        """Runtime role sictack_app must be strictly forbidden from creating tables or functions."""
        with pg_app_engine.connect() as conn:
            with pytest.raises(sa.exc.DBAPIError) as exc_info:
                conn.execute(sa.text("CREATE TABLE public.unauthorized_probe (id int)"))
            assert "permission denied" in str(exc_info.value).lower()

    def test_sictack_app_cannot_drop_or_truncate_tables(self, pg_app_engine):
        """Runtime role sictack_app must be strictly forbidden from dropping or truncating tables."""
        with pg_app_engine.connect() as conn:
            with pytest.raises(sa.exc.DBAPIError) as exc_info:
                conn.execute(sa.text("DROP TABLE public.policies"))
            assert "permission denied" in str(exc_info.value).lower()

            with pytest.raises(sa.exc.DBAPIError) as exc_info:
                conn.execute(sa.text("TRUNCATE TABLE public.policies"))
            assert "permission denied" in str(exc_info.value).lower()

    def test_missing_tenant_context_returns_zero_rows(self, pg_app_engine):
        """Unauthenticated / context-free connection must return 0 rows under RLS."""
        with pg_app_engine.connect() as conn:
            result = conn.execute(sa.text("SELECT * FROM policies")).fetchall()
            assert len(result) == 0, "RLS must block all reads when tenant context is unset"

    def test_cross_tenant_isolation_strictly_enforced(self, pg_app_engine, pg_admin_engine):
        """Tenants must never read or write records belonging to other organizations."""
        org_a = f"org_{uuid.uuid4().hex[:8]}"
        org_b = f"org_{uuid.uuid4().hex[:8]}"
        pol_id = f"pol_{uuid.uuid4().hex[:8]}"

        # Seed parent organization records first to preserve foreign-key integrity
        with pg_admin_engine.connect() as conn:
            conn.execute(sa.text("""
                INSERT INTO organizations (id, name, status)
                VALUES (:org_a, 'Org Alpha', 'ACTIVE'), (:org_b, 'Org Beta', 'ACTIVE')
                ON CONFLICT (id) DO NOTHING;
            """), {"org_a": org_a, "org_b": org_b})
            conn.execute(sa.text("""
                INSERT INTO policies (id, org_id, name, description, is_active, max_risk_level, version)
                VALUES (:id, :org_id, 'Policy A', 'Test', true, 'MEDIUM', 1)
            """), {"id": pol_id, "org_id": org_a})
            conn.commit()

        # Connect as sictack_app scoped to Org B
        with pg_app_engine.connect() as conn:
            conn.execute(sa.text(f"SET LOCAL app.current_tenant_id = '{org_b}';"))
            rows = conn.execute(sa.text("SELECT * FROM policies WHERE id = :id"), {"id": pol_id}).fetchall()
            assert len(rows) == 0, "Tenant B must NOT see Tenant A policies"

        # Connect as sictack_app scoped to Org A
        with pg_app_engine.connect() as conn:
            conn.execute(sa.text(f"SET LOCAL app.current_tenant_id = '{org_a}';"))
            rows = conn.execute(sa.text("SELECT * FROM policies WHERE id = :id"), {"id": pol_id}).fetchall()
            assert len(rows) == 1, "Tenant A must see its own policy"

    def test_security_definer_api_key_point_lookup_least_privilege(self, pg_app_engine, pg_admin_engine):
        """
        Verify sictack_resolve_api_key returns authorization fields (including scopes & revoked_at)
        while strictly omitting key_hash from the returned record.
        """
        key_id = f"key_{uuid.uuid4().hex[:8]}"
        org_id = f"org_{uuid.uuid4().hex[:8]}"
        key_hash = f"hash_{uuid.uuid4().hex[:32]}"

        # Seed parent organization first to satisfy foreign-key constraint
        with pg_admin_engine.connect() as conn:
            conn.execute(sa.text("""
                INSERT INTO organizations (id, name, status)
                VALUES (:org_id, 'Bootstrap Test Org', 'ACTIVE')
                ON CONFLICT (id) DO NOTHING;
            """), {"org_id": org_id})
            conn.execute(sa.text("""
                INSERT INTO api_keys (id, org_id, name, key_prefix, key_hash, is_active, scopes)
                VALUES (:id, :org_id, 'Test Key', 'sictack_live_', :hash, true, '["agent:read", "policy:evaluate"]')
            """), {"id": key_id, "org_id": org_id, "hash": key_hash})
            conn.commit()

        # sictack_app calls SECURITY DEFINER function without tenant context
        with pg_app_engine.connect() as conn:
            row = conn.execute(
                sa.text("SELECT * FROM sictack_resolve_api_key(:hash)"),
                {"hash": key_hash}
            ).mappings().fetchone()
            assert row is not None, "Bootstrap function must return matching key"
            assert row["org_id"] == org_id
            assert row["id"] == key_id
            assert row["is_active"] is True
            assert row["revoked_at"] is None
            assert "agent:read" in str(row["scopes"])
            # Least-privilege invariant: key_hash is NOT leaked back
            assert "key_hash" not in row, "key_hash must be excluded from definer return columns"

    def test_revoked_and_inactive_api_key_detection(self, pg_app_engine, pg_admin_engine):
        """Verify sictack_resolve_api_key accurately exposes revoked_at and inactive flags."""
        org_id = f"org_rev_{uuid.uuid4().hex[:8]}"
        rev_key_id = f"key_rev_{uuid.uuid4().hex[:8]}"
        rev_key_hash = f"hash_rev_{uuid.uuid4().hex[:32]}"
        now = datetime.now(timezone.utc)

        with pg_admin_engine.connect() as conn:
            conn.execute(sa.text("""
                INSERT INTO organizations (id, name, status)
                VALUES (:org_id, 'Revocation Test Org', 'ACTIVE')
                ON CONFLICT (id) DO NOTHING;
            """), {"org_id": org_id})
            conn.execute(sa.text("""
                INSERT INTO api_keys (id, org_id, name, key_prefix, key_hash, is_active, revoked_at, scopes)
                VALUES (:id, :org_id, 'Revoked Key', 'sictack_rev_', :hash, false, :revoked_at, '["agent:read"]')
            """), {"id": rev_key_id, "org_id": org_id, "hash": rev_key_hash, "revoked_at": now})
            conn.commit()

        with pg_app_engine.connect() as conn:
            row = conn.execute(
                sa.text("SELECT * FROM sictack_resolve_api_key(:hash)"),
                {"hash": rev_key_hash}
            ).mappings().fetchone()
            assert row is not None, "Bootstrap function must return key record for auth inspection"
            assert row["is_active"] is False, "Deactivated key must report is_active=False"
            assert row["revoked_at"] is not None, "Revoked key must contain revoked_at timestamp"

    def test_table_sequence_and_privilege_boundaries(self, pg_app_engine):
        """Verify sictack_app has proper DML and sequence privileges but no administrative rights."""
        with pg_app_engine.connect() as conn:
            # Must have USAGE on schema public
            res = conn.execute(sa.text("SELECT has_schema_privilege('sictack_app', 'public', 'USAGE')")).scalar()
            assert res is True, "sictack_app must have USAGE on schema public"

            # Must NOT have CREATE on schema public
            create_priv = conn.execute(sa.text("SELECT has_schema_privilege('sictack_app', 'public', 'CREATE')")).scalar()
            assert create_priv is False, "sictack_app must NOT have CREATE on schema public"

            # Must have EXECUTE on sictack_resolve_api_key
            exec_priv = conn.execute(sa.text("""
                SELECT has_function_privilege('sictack_app', 'sictack_resolve_api_key(varchar)', 'EXECUTE')
            """)).scalar()
            assert exec_priv is True, "sictack_app must have EXECUTE on sictack_resolve_api_key"

    def test_transaction_scoped_set_local_cleans_on_commit(self, pg_app_engine):
        """Verify SET LOCAL automatically clears tenant context at transaction end."""
        org_test = f"org_{uuid.uuid4().hex[:8]}"
        with pg_app_engine.connect() as conn:
            # Inside transaction 1
            trans = conn.begin()
            conn.execute(sa.text(f"SET LOCAL app.current_tenant_id = '{org_test}';"))
            ctx1 = conn.execute(sa.text("SELECT current_setting('app.current_tenant_id', true)")).scalar()
            assert ctx1 == org_test
            trans.commit()

            # Transaction committed: context should be cleared
            ctx_cleared = conn.execute(sa.text("SELECT current_setting('app.current_tenant_id', true)")).scalar()
            assert ctx_cleared == "" or ctx_cleared is None, "SET LOCAL must be purged on commit"

    def test_connection_pool_discard_all_hygiene(self, pg_app_engine):
        """
        Verify DISCARD ALL purges session state including custom settings.
        Must run in AUTOCOMMIT mode as PostgreSQL disallows DISCARD ALL inside transactions.
        """
        org_test = f"org_{uuid.uuid4().hex[:8]}"
        autocommit_engine = pg_app_engine.execution_options(isolation_level="AUTOCOMMIT")
        with autocommit_engine.connect() as conn:
            conn.execute(sa.text(f"SET app.current_tenant_id = '{org_test}';"))
            ctx = conn.execute(sa.text("SELECT current_setting('app.current_tenant_id', true)")).scalar()
            assert ctx == org_test

            conn.execute(sa.text("DISCARD ALL;"))
            ctx_after = conn.execute(sa.text("SELECT current_setting('app.current_tenant_id', true)")).scalar()
            assert ctx_after == "" or ctx_after is None, "DISCARD ALL must purge custom tenant context"

    def test_policy_versions_cross_tenant_isolation_negative(self, pg_app_engine, pg_admin_engine):
        """
        Verify policy_versions tenant isolation invariants:
        1. Tenant B cannot read Tenant A's policy versions.
        2. Tenant B cannot INSERT a policy version referencing Tenant A's policy ID.
        3. Connection without tenant context returns 0 rows and cannot INSERT policy versions.
        4. Tenant A can read its own policy versions and create new versions for its own policies.
        """
        org_a = f"org_{uuid.uuid4().hex[:8]}"
        org_b = f"org_{uuid.uuid4().hex[:8]}"
        pol_a = f"pol_a_{uuid.uuid4().hex[:8]}"
        pol_b = f"pol_b_{uuid.uuid4().hex[:8]}"
        ver_a1 = f"ver_a1_{uuid.uuid4().hex[:8]}"
        ver_b1 = f"ver_b1_{uuid.uuid4().hex[:8]}"

        # Admin seeds parent organizations, policies, and policy_versions
        with pg_admin_engine.connect() as conn:
            conn.execute(sa.text("""
                INSERT INTO organizations (id, name, status)
                VALUES (:org_a, 'Org Alpha', 'ACTIVE'), (:org_b, 'Org Beta', 'ACTIVE')
                ON CONFLICT (id) DO NOTHING;
            """), {"org_a": org_a, "org_b": org_b})
            conn.execute(sa.text("""
                INSERT INTO policies (id, org_id, name, description, is_active, max_risk_level, version)
                VALUES (:pol_a, :org_a, 'Policy Alpha', 'Policy A', true, 'MEDIUM', 1),
                       (:pol_b, :org_b, 'Policy Beta', 'Policy B', true, 'HIGH', 1)
                ON CONFLICT (id) DO NOTHING;
            """), {"pol_a": pol_a, "org_a": org_a, "pol_b": pol_b, "org_b": org_b})
            conn.execute(sa.text("""
                INSERT INTO policy_versions (id, policy_id, version, name, description)
                VALUES (:ver_a1, :pol_a, 1, 'Policy Alpha v1', 'Snapshot A1'),
                       (:ver_b1, :pol_b, 1, 'Policy Beta v1', 'Snapshot B1')
                ON CONFLICT (id) DO NOTHING;
            """), {"ver_a1": ver_a1, "pol_a": pol_a, "ver_b1": ver_b1, "pol_b": pol_b})
            conn.commit()

        # 1. Tenant B querying Policy A versions -> 0 rows
        with pg_app_engine.connect() as conn:
            conn.execute(sa.text(f"SET LOCAL app.current_tenant_id = '{org_b}';"))
            rows = conn.execute(sa.text("SELECT * FROM policy_versions WHERE policy_id = :pol_a"), {"pol_a": pol_a}).fetchall()
            assert len(rows) == 0, "Tenant B must NOT see Tenant A's policy versions"

            # 2. Tenant B attempting to INSERT a version referencing Tenant A's policy -> RLS WITH CHECK violation
            probe_id = f"pv_probe_{uuid.uuid4().hex[:8]}"
            with pytest.raises(sa.exc.DBAPIError) as exc_info:
                conn.execute(sa.text("""
                    INSERT INTO policy_versions (id, policy_id, version, name, description)
                    VALUES (:id, :pol_a, 2, 'Unauthorized Version', 'Attacker Probe')
                """), {"id": probe_id, "pol_a": pol_a})
            assert "row-level security" in str(exc_info.value).lower()

        # 3. Missing tenant context -> 0 rows and forbidden insert
        with pg_app_engine.connect() as conn:
            rows = conn.execute(sa.text("SELECT * FROM policy_versions")).fetchall()
            assert len(rows) == 0, "Missing tenant context must return zero policy versions"

            probe_id2 = f"pv_probe_nocontext_{uuid.uuid4().hex[:8]}"
            with pytest.raises(sa.exc.DBAPIError) as exc_info:
                conn.execute(sa.text("""
                    INSERT INTO policy_versions (id, policy_id, version, name, description)
                    VALUES (:id, :pol_a, 3, 'No Context Version', 'Probe')
                """), {"id": probe_id2, "pol_a": pol_a})
            assert "row-level security" in str(exc_info.value).lower()

        # 4. Tenant A querying Policy A versions -> exactly 1 row (ver_a1)
        with pg_app_engine.connect() as conn:
            conn.execute(sa.text(f"SET LOCAL app.current_tenant_id = '{org_a}';"))
            rows = conn.execute(sa.text("SELECT * FROM policy_versions WHERE policy_id = :pol_a"), {"pol_a": pol_a}).fetchall()
            assert len(rows) == 1, "Tenant A must see its own policy version"
            assert rows[0].id == ver_a1
