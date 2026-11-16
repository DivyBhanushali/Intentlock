"""
INTENTLOCK Database Schema Migration Framework.

Provides deterministic, versioned, idempotent schema migrations for relational
databases (SQLite and PostgreSQL) to prevent schema drift across releases.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Set
import sqlalchemy as sa
from sqlalchemy.engine import Engine

logger = logging.getLogger("intentlock.migrations")

SUPPORTED_DIALECTS: Set[str] = {"sqlite", "postgresql"}

# Application tables governed by RLS and access hardening
APPLICATION_TABLES: list[str] = [
    "organizations",
    "users",
    "api_keys",
    "policies",
    "policy_versions",
    "intent_contexts",
    "approvals",
    "audit_events",
    "security_threat_events",
    "benchmark_runs",
    "agents",
    "schema_migrations",
]


class MigrationError(RuntimeError):
    """Raised when a schema migration cannot complete safely."""
    pass


def _validate_dialect(conn: sa.Connection) -> str:
    """Validate that the database dialect is supported; raise MigrationError otherwise."""
    dialect = conn.dialect.name
    if dialect not in SUPPORTED_DIALECTS:
        raise MigrationError(
            f"Unsupported database dialect '{dialect}'. "
            f"INTENTLOCK migrations currently support: {', '.join(sorted(SUPPORTED_DIALECTS))}."
        )
    return dialect


def _get_existing_columns(conn: sa.Connection, table_name: str) -> set[str]:
    """
    Inspect and return existing column names for a given table using SQLAlchemy inspection.
    Raises MigrationError if inspection fails or if dialect is unsupported.
    """
    _validate_dialect(conn)
    try:
        insp = sa.inspect(conn)
        if not insp.has_table(table_name):
            return set()
        columns = insp.get_columns(table_name)
        return {col["name"] for col in columns}
    except Exception as exc:
        logger.error(f"Failed to inspect columns for table '{table_name}': {exc}", exc_info=True)
        raise MigrationError(f"Database column inspection failed for table '{table_name}': {exc}") from exc


def _get_existing_indexes(conn: sa.Connection, table_name: str) -> set[str]:
    """
    Inspect and return existing index names for a given table.
    Raises MigrationError if inspection fails or if dialect is unsupported.
    """
    _validate_dialect(conn)
    try:
        insp = sa.inspect(conn)
        if not insp.has_table(table_name):
            return set()
        indexes = insp.get_indexes(table_name)
        return {idx["name"] for idx in indexes if idx.get("name")}
    except Exception as exc:
        logger.error(f"Failed to inspect indexes for table '{table_name}': {exc}", exc_info=True)
        raise MigrationError(f"Database index inspection failed for table '{table_name}': {exc}") from exc


def _ensure_index(conn: sa.Connection, table_name: str, index_name: str, column_name: str) -> None:
    """Idempotently create an index on table_name(column_name) if it does not already exist."""
    existing_indexes = _get_existing_indexes(conn, table_name)
    if index_name not in existing_indexes:
        conn.execute(sa.text(f"CREATE INDEX IF NOT EXISTS {index_name} ON {table_name} ({column_name})"))
        logger.info(f"Created index '{index_name}' on {table_name}({column_name}).")


def _ensure_migration_table(conn: sa.Connection) -> None:
    """Create the schema_migrations tracking table if it does not exist."""
    _validate_dialect(conn)
    try:
        conn.execute(sa.text("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(128) NOT NULL,
                applied_at TIMESTAMP NOT NULL
            )
        """))
    except Exception as exc:
        raise MigrationError(f"Failed to initialize schema_migrations tracking table: {exc}") from exc


def _is_migration_applied(conn: sa.Connection, version: int) -> bool:
    """Check if a migration version has already been recorded."""
    try:
        cursor = conn.execute(
            sa.text("SELECT version FROM schema_migrations WHERE version = :ver"),
            {"ver": version}
        )
        return cursor.fetchone() is not None
    except Exception as exc:
        raise MigrationError(f"Failed to query schema_migrations for version {version}: {exc}") from exc


def _record_migration(conn: sa.Connection, version: int, name: str) -> None:
    """Record an applied migration version."""
    try:
        conn.execute(
            sa.text("""
                INSERT INTO schema_migrations (version, name, applied_at)
                VALUES (:ver, :name, :applied_at)
            """),
            {
                "ver": version,
                "name": name,
                "applied_at": datetime.now(timezone.utc).isoformat()
            }
        )
    except Exception as exc:
        raise MigrationError(f"Failed to record migration version {version}: {exc}") from exc


def apply_migrations(engine: Engine) -> list[str]:
    """
    Apply all pending versioned migrations in order.
    Returns the list of newly applied migration names.
    Raises MigrationError if any migration fails.
    """
    applied = []
    with engine.begin() as conn:
        dialect = _validate_dialect(conn)
        _ensure_migration_table(conn)

        # ─── Migration 1: v2.0 Enterprise Multi-Tenancy & Intent Governance ───
        m1_version = 1
        m1_name = "001_v2_enterprise_multitenancy_schema"

        if not _is_migration_applied(conn, m1_version):
            logger.info(f"Applying migration {m1_version}: {m1_name} on {dialect}")
            try:
                # 1. Backfill 'policies' table
                policy_cols = _get_existing_columns(conn, "policies")
                if policy_cols:
                    if "org_id" not in policy_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE policies ADD COLUMN org_id VARCHAR(64) DEFAULT 'default-org'"
                        ))
                        conn.execute(sa.text(
                            "UPDATE policies SET org_id = 'default-org' WHERE org_id IS NULL"
                        ))
                        logger.info("Migrated 'policies' table: added 'org_id'.")
                    _ensure_index(conn, "policies", "ix_policies_org_id", "org_id")

                # 2. Backfill 'agents' table
                agent_cols = _get_existing_columns(conn, "agents")
                if agent_cols:
                    if "org_id" not in agent_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE agents ADD COLUMN org_id VARCHAR(64) DEFAULT 'default-org'"
                        ))
                        conn.execute(sa.text(
                            "UPDATE agents SET org_id = 'default-org' WHERE org_id IS NULL"
                        ))
                        logger.info("Migrated 'agents' table: added 'org_id'.")
                    _ensure_index(conn, "agents", "ix_agents_org_id", "org_id")

                # 3. Backfill 'approvals' table
                approval_cols = _get_existing_columns(conn, "approvals")
                if approval_cols:
                    if "org_id" not in approval_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE approvals ADD COLUMN org_id VARCHAR(64) DEFAULT 'default-org'"
                        ))
                    if "intent_id" not in approval_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE approvals ADD COLUMN intent_id VARCHAR(64) NULL"
                        ))
                    if "policy_version" not in approval_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE approvals ADD COLUMN policy_version INTEGER DEFAULT 1"
                        ))
                    if "consumed_at" not in approval_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE approvals ADD COLUMN consumed_at TIMESTAMP WITH TIME ZONE NULL"
                        ))
                    _ensure_index(conn, "approvals", "ix_approvals_org_id", "org_id")
                    _ensure_index(conn, "approvals", "ix_approvals_intent_id", "intent_id")
                    logger.info("Migrated 'approvals' table with v2.0 governance columns & indexes.")

                # 4. Backfill 'audit_events' table
                audit_cols = _get_existing_columns(conn, "audit_events")
                if audit_cols:
                    if "org_id" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN org_id VARCHAR(64) DEFAULT 'default-org'"
                        ))
                    if "intent_id" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN intent_id VARCHAR(64) NULL"
                        ))
                    if "trace_id" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN trace_id VARCHAR(64) NULL"
                        ))
                    if "sequence_number" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN sequence_number INTEGER NULL"
                        ))
                    if "previous_hash" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN previous_hash VARCHAR(64) DEFAULT ''"
                        ))
                    if "entry_hash" not in audit_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE audit_events ADD COLUMN entry_hash VARCHAR(64) DEFAULT ''"
                        ))
                    _ensure_index(conn, "audit_events", "ix_audit_events_org_id", "org_id")
                    _ensure_index(conn, "audit_events", "ix_audit_events_intent_id", "intent_id")
                    _ensure_index(conn, "audit_events", "ix_audit_events_trace_id", "trace_id")
                    _ensure_index(conn, "audit_events", "ix_audit_events_sequence_number", "sequence_number")
                    logger.info("Migrated 'audit_events' table with v2.0 hash-chaining columns & indexes.")

                # 5. Ensure default organization exists if organizations table exists
                org_cols = _get_existing_columns(conn, "organizations")
                if org_cols:
                    conn.execute(sa.text("""
                        UPDATE organizations SET id = 'default-org' WHERE slug = 'default-org' AND id != 'default-org'
                    """))
                    if dialect == "sqlite":
                        conn.execute(sa.text("""
                            INSERT OR IGNORE INTO organizations (id, name, slug, plan, created_at)
                            VALUES ('default-org', 'Default Organization', 'default-org', 'ENTERPRISE', CURRENT_TIMESTAMP)
                        """))
                    elif dialect == "postgresql":
                        conn.execute(sa.text("""
                            INSERT INTO organizations (id, name, slug, plan, created_at)
                            VALUES ('default-org', 'Default Organization', 'default-org', 'ENTERPRISE', CURRENT_TIMESTAMP)
                            ON CONFLICT (id) DO NOTHING
                        """))

                _record_migration(conn, m1_version, m1_name)
                applied.append(m1_name)
                logger.info(f"Successfully applied migration {m1_version}: {m1_name}")
            except Exception as exc:
                logger.error(f"Failed to apply migration {m1_version} ({m1_name}): {exc}", exc_info=True)
                raise MigrationError(f"Migration {m1_name} failed: {exc}") from exc

        # ─── Migration 2: Supabase PostgreSQL RLS & Public API Access Hardening ───
        m2_version = 2
        m2_name = "002_enable_supabase_rls_and_revoke_public_api_grants"

        if not _is_migration_applied(conn, m2_version):
            logger.info(f"Applying migration {m2_version}: {m2_name} on {dialect}")
            try:
                if dialect == "postgresql":
                    insp = sa.inspect(conn)
                    for tbl in APPLICATION_TABLES:
                        if insp.has_table(tbl):
                            # 1. Enable RLS (standard non-forced RLS; owner/BYPASSRLS remains unaffected)
                            conn.execute(sa.text(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;"))
                            # 2. Revoke table-level access from PostgREST roles and PUBLIC
                            conn.execute(sa.text(f"""
                                DO $$
                                BEGIN
                                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                                        EXECUTE 'REVOKE ALL ON TABLE {tbl} FROM anon';
                                    END IF;
                                    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                                        EXECUTE 'REVOKE ALL ON TABLE {tbl} FROM authenticated';
                                    END IF;
                                    EXECUTE 'REVOKE ALL ON TABLE {tbl} FROM PUBLIC';
                                END $$;
                            """))
                            logger.info(f"Enabled RLS and revoked anon/authenticated/PUBLIC grants on '{tbl}'.")

                    # ─── Service Role Privilege Preservation & PUBLIC Revocation Notice ───
                    # Supabase provisions direct table and sequence grants to `service_role` upon
                    # table creation. This migration never revokes privileges from `service_role`
                    # and never restricts `service_role` access.
                    #
                    # Revoking privileges from the `PUBLIC` pseudo-role removes permissions that would
                    # otherwise be inherited implicitly by all database roles through `PUBLIC`.
                    # Any role (such as `service_role` or table owner `postgres`) holding explicit direct
                    # GRANTs or role-level bypass attributes (e.g. rolbypassrls) retains full operational
                    # access. No new grants are added to `service_role` here to maintain least-privilege hygiene.

                    # 3. Revoke sequence privileges ONLY for sequences owned by or associated
                    # with the 12 INTENTLOCK application tables via catalog dependencies (pg_depend).
                    # Validates column attachment via pg_attribute (attnum = refobjsubid, not dropped).
                    # Filters strictly by deptype IN ('a', 'i') (auto/serial and internal/identity).
                    # Leaves unrelated Supabase / extension sequences in 'public' untouched.
                    # Does not revoke from service_role or postgres.
                    tables_list_sql = ", ".join(f"'{tbl}'" for tbl in APPLICATION_TABLES)
                    conn.execute(sa.text(f"""
                        DO $$
                        DECLARE
                            seq_record record;
                        BEGIN
                            FOR seq_record IN
                                SELECT DISTINCT s.relname AS sequence_name
                                FROM pg_class s
                                JOIN pg_namespace sn ON sn.oid = s.relnamespace
                                JOIN pg_depend d ON d.objid = s.oid
                                                 AND d.classid = 'pg_class'::regclass
                                                 AND d.refclassid = 'pg_class'::regclass
                                JOIN pg_class t ON t.oid = d.refobjid
                                JOIN pg_namespace tn ON tn.oid = t.relnamespace
                                JOIN pg_attribute a ON a.attrelid = t.oid
                                                   AND a.attnum = d.refobjsubid
                                                   AND NOT a.attisdropped
                                WHERE s.relkind = 'S'
                                  AND d.deptype IN ('a', 'i')
                                  AND sn.nspname = 'public'
                                  AND tn.nspname = 'public'
                                  AND t.relname = ANY(ARRAY[{tables_list_sql}])
                            LOOP
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                                    EXECUTE 'REVOKE ALL ON SEQUENCE public.' || quote_ident(seq_record.sequence_name) || ' FROM anon';
                                END IF;
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                                    EXECUTE 'REVOKE ALL ON SEQUENCE public.' || quote_ident(seq_record.sequence_name) || ' FROM authenticated';
                                END IF;
                                EXECUTE 'REVOKE ALL ON SEQUENCE public.' || quote_ident(seq_record.sequence_name) || ' FROM PUBLIC';
                            END LOOP;
                        END $$;
                    """))
                    logger.info("Revoked anon/authenticated/PUBLIC access on INTENTLOCK table-associated sequences.")

                    # Note: Broad ALTER DEFAULT PRIVILEGES in public is intentionally omitted to avoid
                    # altering global Supabase schema defaults. Future INTENTLOCK tables and their sequences
                    # must receive explicit RLS and privilege hardening in their respective migrations.

                _record_migration(conn, m2_version, m2_name)
                applied.append(m2_name)
                logger.info(f"Successfully applied migration {m2_version}: {m2_name}")
            except Exception as exc:
                logger.error(f"Failed to apply migration {m2_version} ({m2_name}): {exc}", exc_info=True)
                raise MigrationError(f"Migration {m2_name} failed: {exc}") from exc


    return applied
