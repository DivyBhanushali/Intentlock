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
    "agent_delegations",
    "schema_migrations",
]

PHASE4C_TABLES: list[str] = [
    "security_incidents",
    "agent_messages",
]

PHASE4D_TABLES: list[str] = [
    "data_provenance",
    "execution_integrity_records",
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
                    if "version" not in policy_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE policies ADD COLUMN version INTEGER DEFAULT 1"
                        ))
                    if "parameter_constraints" not in policy_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE policies ADD COLUMN parameter_constraints JSON DEFAULT '{}'"
                        ))
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
                    if "parent_agent_id" not in agent_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE agents ADD COLUMN parent_agent_id VARCHAR(128) NULL"
                        ))
                    if "role" not in agent_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE agents ADD COLUMN role VARCHAR(64) DEFAULT 'worker'"
                        ))
                    if "max_delegation_depth" not in agent_cols:
                        conn.execute(sa.text(
                            "ALTER TABLE agents ADD COLUMN max_delegation_depth INTEGER DEFAULT 3"
                        ))
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

        # ─── Migration 3: Multi-Agent Security Incidents & Authenticated Messaging ───
        m3_version = 3
        m3_name = "003_multi_agent_security_incidents_and_messages"

        if not _is_migration_applied(conn, m3_version):
            logger.info(f"Applying migration {m3_version}: {m3_name} on {dialect}")
            try:
                # 1. Create security_incidents table if not exists
                if not sa.inspect(conn).has_table("security_incidents"):
                    if dialect == "sqlite":
                        conn.execute(sa.text("""
                            CREATE TABLE IF NOT EXISTS security_incidents (
                                id VARCHAR(64) PRIMARY KEY,
                                org_id VARCHAR(64) NOT NULL,
                                title VARCHAR(256) NOT NULL,
                                severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
                                status VARCHAR(32) NOT NULL DEFAULT 'DETECTED',
                                trigger_rule_id VARCHAR(64) NOT NULL,
                                affected_agent_ids_json JSON DEFAULT '[]',
                                session_ids_json JSON DEFAULT '[]',
                                summary TEXT DEFAULT '',
                                evidence_trail_json JSON DEFAULT '[]',
                                containment_action_taken VARCHAR(128) NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                resolved_at TIMESTAMP NULL,
                                resolved_by VARCHAR(128) NULL,
                                resolution_notes TEXT NULL
                            )
                        """))
                    elif dialect == "postgresql":
                        conn.execute(sa.text("""
                            CREATE TABLE IF NOT EXISTS security_incidents (
                                id VARCHAR(64) PRIMARY KEY,
                                org_id VARCHAR(64) NOT NULL,
                                title VARCHAR(256) NOT NULL,
                                severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
                                status VARCHAR(32) NOT NULL DEFAULT 'DETECTED',
                                trigger_rule_id VARCHAR(64) NOT NULL,
                                affected_agent_ids_json JSONB DEFAULT '[]'::jsonb,
                                session_ids_json JSONB DEFAULT '[]'::jsonb,
                                summary TEXT DEFAULT '',
                                evidence_trail_json JSONB DEFAULT '[]'::jsonb,
                                containment_action_taken VARCHAR(128) NULL,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                                resolved_at TIMESTAMP WITH TIME ZONE NULL,
                                resolved_by VARCHAR(128) NULL,
                                resolution_notes TEXT NULL
                            )
                        """))
                _ensure_index(conn, "security_incidents", "ix_security_incidents_org_id", "org_id")
                _ensure_index(conn, "security_incidents", "ix_security_incidents_severity", "severity")
                _ensure_index(conn, "security_incidents", "ix_security_incidents_status", "status")

                # 2. Create agent_messages table if not exists
                if not sa.inspect(conn).has_table("agent_messages"):
                    if dialect == "sqlite":
                        conn.execute(sa.text("""
                            CREATE TABLE IF NOT EXISTS agent_messages (
                                id VARCHAR(64) PRIMARY KEY,
                                org_id VARCHAR(64) NOT NULL,
                                sender_id VARCHAR(128) NOT NULL,
                                recipient_id VARCHAR(128) NOT NULL,
                                message_type VARCHAR(64) NOT NULL DEFAULT 'TASK_DELEGATION',
                                payload_json JSON DEFAULT '{}',
                                signature VARCHAR(256) NOT NULL,
                                nonce VARCHAR(64) NOT NULL UNIQUE,
                                status VARCHAR(32) DEFAULT 'PENDING',
                                expires_at TIMESTAMP NOT NULL,
                                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                            )
                        """))
                    elif dialect == "postgresql":
                        conn.execute(sa.text("""
                            CREATE TABLE IF NOT EXISTS agent_messages (
                                id VARCHAR(64) PRIMARY KEY,
                                org_id VARCHAR(64) NOT NULL,
                                sender_id VARCHAR(128) NOT NULL,
                                recipient_id VARCHAR(128) NOT NULL,
                                message_type VARCHAR(64) NOT NULL DEFAULT 'TASK_DELEGATION',
                                payload_json JSONB DEFAULT '{}'::jsonb,
                                signature VARCHAR(256) NOT NULL,
                                nonce VARCHAR(64) NOT NULL UNIQUE,
                                status VARCHAR(32) DEFAULT 'PENDING',
                                expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                            )
                        """))
                _ensure_index(conn, "agent_messages", "ix_agent_messages_org_id", "org_id")
                _ensure_index(conn, "agent_messages", "ix_agent_messages_recipient_id", "recipient_id")

                # 3. PostgreSQL RLS hardening
                if dialect == "postgresql":
                    for tbl in ["security_incidents", "agent_messages"]:
                        conn.execute(sa.text(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;"))
                        conn.execute(sa.text(f"ALTER TABLE {tbl} FORCE ROW LEVEL SECURITY;"))
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

                _record_migration(conn, m3_version, m3_name)
                applied.append(m3_name)
                logger.info(f"Successfully applied migration {m3_version}: {m3_name}")
            except Exception as exc:
                logger.error(f"Failed to apply migration {m3_version} ({m3_name}): {exc}", exc_info=True)
                raise MigrationError(f"Migration {m3_name} failed: {exc}") from exc

            # ─────────────────────────────────────────────────────────────
            # MIGRATION 004: Data Provenance & Execution Integrity (Phase 4D)
            # ─────────────────────────────────────────────────────────────
            m4_version = 4
            m4_name = "004_provenance_and_execution_integrity"
            if not _is_migration_applied(conn, m4_version):
                logger.info(f"Applying migration {m4_version}: {m4_name} on {dialect}")
                try:
                    # 1. Create data_provenance table if not exists
                    if not sa.inspect(conn).has_table("data_provenance"):
                        if dialect == "sqlite":
                            conn.execute(sa.text("""
                                CREATE TABLE IF NOT EXISTS data_provenance (
                                    id VARCHAR(64) PRIMARY KEY,
                                    org_id VARCHAR(64) NOT NULL,
                                    session_id VARCHAR(64) DEFAULT '',
                                    agent_id VARCHAR(128) NOT NULL,
                                    source_type VARCHAR(64) NOT NULL,
                                    source_identifier VARCHAR(512) NOT NULL,
                                    input_hash VARCHAR(64) NOT NULL,
                                    output_hash VARCHAR(64) NOT NULL,
                                    data_classification VARCHAR(32) DEFAULT 'CONFIDENTIAL',
                                    trust_level VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN_OR_UNVERIFIED',
                                    parent_provenance_ids_json JSON DEFAULT '[]',
                                    transformation_type VARCHAR(64) NULL,
                                    decision_id VARCHAR(64) NULL,
                                    incident_id VARCHAR(64) NULL,
                                    signature VARCHAR(256) NOT NULL,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                )
                            """))
                        elif dialect == "postgresql":
                            conn.execute(sa.text("""
                                CREATE TABLE IF NOT EXISTS data_provenance (
                                    id VARCHAR(64) PRIMARY KEY,
                                    org_id VARCHAR(64) NOT NULL,
                                    session_id VARCHAR(64) DEFAULT '',
                                    agent_id VARCHAR(128) NOT NULL,
                                    source_type VARCHAR(64) NOT NULL,
                                    source_identifier VARCHAR(512) NOT NULL,
                                    input_hash VARCHAR(64) NOT NULL,
                                    output_hash VARCHAR(64) NOT NULL,
                                    data_classification VARCHAR(32) DEFAULT 'CONFIDENTIAL',
                                    trust_level VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN_OR_UNVERIFIED',
                                    parent_provenance_ids_json JSONB DEFAULT '[]'::jsonb,
                                    transformation_type VARCHAR(64) NULL,
                                    decision_id VARCHAR(64) NULL,
                                    incident_id VARCHAR(64) NULL,
                                    signature VARCHAR(256) NOT NULL,
                                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                )
                            """))
                    _ensure_index(conn, "data_provenance", "ix_data_provenance_org_id", "org_id")
                    _ensure_index(conn, "data_provenance", "ix_data_provenance_agent_id", "agent_id")
                    _ensure_index(conn, "data_provenance", "ix_data_provenance_source_type", "source_type")
                    _ensure_index(conn, "data_provenance", "ix_data_provenance_trust_level", "trust_level")

                    # 2. Create execution_integrity_records table if not exists
                    if not sa.inspect(conn).has_table("execution_integrity_records"):
                        if dialect == "sqlite":
                            conn.execute(sa.text("""
                                CREATE TABLE IF NOT EXISTS execution_integrity_records (
                                    id VARCHAR(64) PRIMARY KEY,
                                    org_id VARCHAR(64) NOT NULL,
                                    agent_id VARCHAR(128) NOT NULL,
                                    session_id VARCHAR(64) DEFAULT '',
                                    tool_name VARCHAR(128) NOT NULL,
                                    request_digest VARCHAR(64) NOT NULL,
                                    policy_version INTEGER DEFAULT 1,
                                    status VARCHAR(32) DEFAULT 'VALID',
                                    rejection_reason VARCHAR(256) NULL,
                                    nonce VARCHAR(64) NOT NULL UNIQUE,
                                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                                )
                            """))
                        elif dialect == "postgresql":
                            conn.execute(sa.text("""
                                CREATE TABLE IF NOT EXISTS execution_integrity_records (
                                    id VARCHAR(64) PRIMARY KEY,
                                    org_id VARCHAR(64) NOT NULL,
                                    agent_id VARCHAR(128) NOT NULL,
                                    session_id VARCHAR(64) DEFAULT '',
                                    tool_name VARCHAR(128) NOT NULL,
                                    request_digest VARCHAR(64) NOT NULL,
                                    policy_version INTEGER DEFAULT 1,
                                    status VARCHAR(32) DEFAULT 'VALID',
                                    rejection_reason VARCHAR(256) NULL,
                                    nonce VARCHAR(64) NOT NULL UNIQUE,
                                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                                )
                            """))
                    _ensure_index(conn, "execution_integrity_records", "ix_execution_integrity_records_org_id", "org_id")
                    _ensure_index(conn, "execution_integrity_records", "ix_execution_integrity_records_agent_id", "agent_id")
                    _ensure_index(conn, "execution_integrity_records", "ix_execution_integrity_records_tool_name", "tool_name")
                    _ensure_index(conn, "execution_integrity_records", "ix_execution_integrity_records_nonce", "nonce")

                    # 3. PostgreSQL RLS hardening
                    if dialect == "postgresql":
                        for tbl in ["data_provenance", "execution_integrity_records"]:
                            conn.execute(sa.text(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;"))
                            conn.execute(sa.text(f"ALTER TABLE {tbl} FORCE ROW LEVEL SECURITY;"))
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

                    _record_migration(conn, m4_version, m4_name)
                    applied.append(m4_name)
                    logger.info(f"Successfully applied migration {m4_version}: {m4_name}")
                except Exception as exc:
                    logger.error(f"Failed to apply migration {m4_version} ({m4_name}): {exc}", exc_info=True)
                    raise MigrationError(f"Migration {m4_name} failed: {exc}") from exc

            # ─────────────────────────────────────────────────────────────
            # MIGRATION 005: Multi-Tenant RLS & Hardened Isolation (Phase 4G / BLK-001)
            # ─────────────────────────────────────────────────────────────
            m5_version = 5
            m5_name = "005_tenant_isolation_and_rls_hardening"
            if not _is_migration_applied(conn, m5_version):
                logger.info(f"Applying migration {m5_version}: {m5_name} on {dialect}")
                try:
                    tenant_tables = [
                        "api_keys", "policies", "policy_versions", "intent_contexts",
                        "approvals", "audit_events", "security_threat_events", "benchmark_runs",
                        "agents", "agent_delegations", "security_incidents", "agent_messages",
                        "data_provenance", "execution_integrity_records"
                    ]

                    # Ensure org_id index on all tenant tables for fast lookup and scoping
                    for tbl in tenant_tables:
                        if sa.inspect(conn).has_table(tbl):
                            cols = _get_existing_columns(conn, tbl)
                            if "org_id" in cols:
                                _ensure_index(conn, tbl, f"ix_{tbl}_org_id_phase4g", "org_id")

                    if dialect == "postgresql":
                        # 1. Create narrow, hardened SECURITY DEFINER function for API-key authentication bootstrap
                        conn.execute(sa.text("""
                            CREATE OR REPLACE FUNCTION sictack_resolve_api_key(p_key_hash VARCHAR)
                            RETURNS TABLE (
                                id VARCHAR,
                                org_id VARCHAR,
                                name VARCHAR,
                                key_prefix VARCHAR,
                                key_hash VARCHAR,
                                is_active BOOLEAN,
                                created_at TIMESTAMPTZ,
                                expires_at TIMESTAMPTZ,
                                last_used_at TIMESTAMPTZ
                            )
                            SECURITY DEFINER
                            STRICT
                            SET search_path = pg_catalog, public
                            LANGUAGE plpgsql
                            AS $$
                            BEGIN
                                -- Guard against malformed or short probe inputs
                                IF p_key_hash IS NULL OR length(trim(p_key_hash)) < 32 THEN
                                    RETURN;
                                END IF;

                                RETURN QUERY
                                SELECT a.id, a.org_id, a.name, a.key_prefix, a.key_hash, a.is_active,
                                       a.created_at, a.expires_at, a.last_used_at
                                FROM public.api_keys a
                                WHERE a.key_hash = p_key_hash;
                            END;
                            $$;
                        """))

                        # Revoke default PUBLIC, authenticated, and anon execute privileges;
                        # grant strictly and exclusively to authorized application runtime role (sictack_app).
                        conn.execute(sa.text("""
                            REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM PUBLIC;
                            DO $$
                            BEGIN
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                                    EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM authenticated';
                                END IF;
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                                    EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM anon';
                                END IF;
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sictack_app') THEN
                                    EXECUTE 'GRANT EXECUTE ON FUNCTION sictack_resolve_api_key(VARCHAR) TO sictack_app';
                                END IF;
                            END $$;
                        """))
                        logger.info("Created and secured narrow SECURITY DEFINER function 'sictack_resolve_api_key'")

                        # 2. Enforce strict, uncompromised RLS policies on all tenant tables (including api_keys)
                        # Zero NULL context loopholes; zero arbitrary client-settable bypass flags.
                        for tbl in tenant_tables:
                            if sa.inspect(conn).has_table(tbl):
                                conn.execute(sa.text(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY;"))
                                if tbl == "policy_versions":
                                    # policy_versions establishes tenant ownership via parent policy (policy_id -> policies.id)
                                    conn.execute(sa.text(f"""
                                        DO $$
                                        BEGIN
                                            DROP POLICY IF EXISTS tenant_isolation_policy ON {tbl};
                                            CREATE POLICY tenant_isolation_policy ON {tbl}
                                                FOR ALL
                                                USING (policy_id IN (SELECT id FROM public.policies WHERE org_id = NULLIF(current_setting('app.current_tenant_id', true), '')))
                                                WITH CHECK (policy_id IN (SELECT id FROM public.policies WHERE org_id = NULLIF(current_setting('app.current_tenant_id', true), '')));
                                        END $$;
                                    """))
                                else:
                                    conn.execute(sa.text(f"""
                                        DO $$
                                        BEGIN
                                            DROP POLICY IF EXISTS tenant_isolation_policy ON {tbl};
                                            CREATE POLICY tenant_isolation_policy ON {tbl}
                                                FOR ALL
                                                USING (org_id = NULLIF(current_setting('app.current_tenant_id', true), ''))
                                                WITH CHECK (org_id = NULLIF(current_setting('app.current_tenant_id', true), ''));
                                        END $$;
                                    """))
                                logger.info(f"Enforced strict Row-Level Security policy on table '{tbl}'")

                    _record_migration(conn, m5_version, m5_name)
                    applied.append(m5_name)
                    logger.info(f"Successfully applied migration {m5_version}: {m5_name}")
                except Exception as exc:
                    logger.error(f"Failed to apply migration {m5_version} ({m5_name}): {exc}", exc_info=True)
                    raise MigrationError(f"Migration {m5_name} failed: {exc}") from exc

            # ─────────────────────────────────────────────────────────────
            # MIGRATION 006: Enterprise Foundation, RBAC & Entitlements (Phase 5A)
            # ─────────────────────────────────────────────────────────────
            m6_version = 6
            m6_name = "006_enterprise_foundation_and_rbac"
            if not _is_migration_applied(conn, m6_version):
                logger.info(f"Applying migration {m6_version}: {m6_name} on {dialect}")
                try:
                    # 1. Backfill organizations table
                    if sa.inspect(conn).has_table("organizations"):
                        org_cols = _get_existing_columns(conn, "organizations")
                        if "status" not in org_cols:
                            conn.execute(sa.text("ALTER TABLE organizations ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE'"))
                        if "max_agents" not in org_cols:
                            conn.execute(sa.text("ALTER TABLE organizations ADD COLUMN max_agents INTEGER DEFAULT 25"))
                        if "max_monthly_actions" not in org_cols:
                            conn.execute(sa.text("ALTER TABLE organizations ADD COLUMN max_monthly_actions INTEGER DEFAULT 100000"))
                        if "rate_limit_per_minute" not in org_cols:
                            conn.execute(sa.text("ALTER TABLE organizations ADD COLUMN rate_limit_per_minute INTEGER DEFAULT 1200"))
                        if "updated_at" not in org_cols:
                            conn.execute(sa.text("ALTER TABLE organizations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE NULL"))

                    # 2. Backfill users table
                    if sa.inspect(conn).has_table("users"):
                        usr_cols = _get_existing_columns(conn, "users")
                        if "is_active" not in usr_cols:
                            conn.execute(sa.text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1"))

                    # 3. Backfill api_keys table
                    if sa.inspect(conn).has_table("api_keys"):
                        key_cols = _get_existing_columns(conn, "api_keys")
                        if "expires_at" not in key_cols:
                            conn.execute(sa.text("ALTER TABLE api_keys ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE NULL"))
                        if "revoked_at" not in key_cols:
                            conn.execute(sa.text("ALTER TABLE api_keys ADD COLUMN revoked_at TIMESTAMP WITH TIME ZONE NULL"))
                        if "rotated_to_key_id" not in key_cols:
                            conn.execute(sa.text("ALTER TABLE api_keys ADD COLUMN rotated_to_key_id VARCHAR(64) NULL"))
                        if "scopes" not in key_cols:
                            conn.execute(sa.text("ALTER TABLE api_keys ADD COLUMN scopes JSON DEFAULT '[]'"))

                    # 4. Backfill agents table
                    if sa.inspect(conn).has_table("agents"):
                        ag_cols = _get_existing_columns(conn, "agents")
                        if "owner_user_id" not in ag_cols:
                            conn.execute(sa.text("ALTER TABLE agents ADD COLUMN owner_user_id VARCHAR(64) NULL"))
                        if "status" not in ag_cols:
                            conn.execute(sa.text("ALTER TABLE agents ADD COLUMN status VARCHAR(32) DEFAULT 'ACTIVE'"))
                        if "parent_agent_id" not in ag_cols:
                            conn.execute(sa.text("ALTER TABLE agents ADD COLUMN parent_agent_id VARCHAR(128) NULL"))
                        if "role" not in ag_cols:
                            conn.execute(sa.text("ALTER TABLE agents ADD COLUMN role VARCHAR(64) DEFAULT 'worker'"))
                        if "max_delegation_depth" not in ag_cols:
                            conn.execute(sa.text("ALTER TABLE agents ADD COLUMN max_delegation_depth INTEGER DEFAULT 3"))

                    _record_migration(conn, m6_version, m6_name)
                    applied.append(m6_name)
                    logger.info(f"Successfully applied migration {m6_version}: {m6_name}")
                except Exception as exc:
                    logger.error(f"Failed to apply migration {m6_version} ({m6_name}): {exc}", exc_info=True)
                    raise MigrationError(f"Migration {m6_name} failed: {exc}") from exc

            # ─────────────────────────────────────────────────────────────
            # MIGRATION 007: API Key Resolver Least Privilege & Hardening (Phase 5C.7)
            # ─────────────────────────────────────────────────────────────
            m7_version = 7
            m7_name = "007_api_key_resolver_least_privilege"
            if not _is_migration_applied(conn, m7_version):
                logger.info(f"Applying migration {m7_version}: {m7_name} on {dialect}")
                try:
                    if dialect == "postgresql":
                        # Drops historical 9-field function signature cleanly to prevent return-type mismatch
                        conn.execute(sa.text("DROP FUNCTION IF EXISTS sictack_resolve_api_key(VARCHAR);"))
                        
                        # Recreates function returning 11 authorization fields, strictly excluding key_hash
                        # Safely queries fields backfilled by Migration 006 (revoked_at, rotated_to_key_id, scopes)
                        conn.execute(sa.text("""
                            CREATE OR REPLACE FUNCTION sictack_resolve_api_key(p_key_hash VARCHAR)
                            RETURNS TABLE (
                                id VARCHAR,
                                org_id VARCHAR,
                                name VARCHAR,
                                key_prefix VARCHAR,
                                is_active BOOLEAN,
                                created_at TIMESTAMPTZ,
                                expires_at TIMESTAMPTZ,
                                last_used_at TIMESTAMPTZ,
                                revoked_at TIMESTAMPTZ,
                                rotated_to_key_id VARCHAR,
                                scopes JSON
                            )
                            SECURITY DEFINER
                            STRICT
                            SET search_path = pg_catalog, public
                            LANGUAGE plpgsql
                            AS $$
                            BEGIN
                                -- Guard against malformed or short probe inputs
                                IF p_key_hash IS NULL OR length(trim(p_key_hash)) < 32 THEN
                                    RETURN;
                                END IF;

                                RETURN QUERY
                                SELECT a.id, a.org_id, a.name, a.key_prefix, a.is_active,
                                       a.created_at, a.expires_at, a.last_used_at, a.revoked_at,
                                       a.rotated_to_key_id, a.scopes
                                FROM public.api_keys a
                                WHERE a.key_hash = p_key_hash;
                            END;
                            $$;
                        """))

                        # Revoke default PUBLIC, authenticated, and anon execute privileges;
                        # grant strictly and exclusively to authorized application runtime role (sictack_app).
                        conn.execute(sa.text("""
                            REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM PUBLIC;
                            DO $$
                            BEGIN
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
                                    EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM authenticated';
                                END IF;
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
                                    EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM anon';
                                END IF;
                                IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sictack_app') THEN
                                    EXECUTE 'GRANT EXECUTE ON FUNCTION sictack_resolve_api_key(VARCHAR) TO sictack_app';
                                END IF;
                            END $$;
                        """))
                        logger.info("Hardened SECURITY DEFINER function 'sictack_resolve_api_key' with 11 least-privilege fields (Migration 007)")

                    _record_migration(conn, m7_version, m7_name)
                    applied.append(m7_name)
                    logger.info(f"Successfully applied migration {m7_version}: {m7_name}")
                except Exception as exc:
                    logger.error(f"Failed to apply migration {m7_version} ({m7_name}): {exc}", exc_info=True)
                    raise MigrationError(f"Migration {m7_name} failed: {exc}") from exc

            # ─────────────────────────────────────────────────────────────
            # MIGRATION 008: Policy Versions Parent RLS Hardening (Phase 5C.7)
            # ─────────────────────────────────────────────────────────────
            m8_version = 8
            m8_name = "008_policy_versions_rls_hardening"
            if not _is_migration_applied(conn, m8_version):
                logger.info(f"Applying migration {m8_version}: {m8_name} on {dialect}")
                try:
                    if dialect == "postgresql":
                        if sa.inspect(conn).has_table("policy_versions"):
                            conn.execute(sa.text("ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;"))
                            conn.execute(sa.text("""
                                DO $$
                                BEGIN
                                    DROP POLICY IF EXISTS tenant_isolation_policy ON policy_versions;
                                    CREATE POLICY tenant_isolation_policy ON policy_versions
                                        FOR ALL
                                        USING (policy_id IN (SELECT id FROM public.policies WHERE org_id = NULLIF(current_setting('app.current_tenant_id', true), '')))
                                        WITH CHECK (policy_id IN (SELECT id FROM public.policies WHERE org_id = NULLIF(current_setting('app.current_tenant_id', true), '')));
                                END $$;
                            """))
                            logger.info("Enforced parent-policy Row-Level Security policy on 'policy_versions' (Migration 008)")

                    _record_migration(conn, m8_version, m8_name)
                    applied.append(m8_name)
                    logger.info(f"Successfully applied migration {m8_version}: {m8_name}")
                except Exception as exc:
                    logger.error(f"Failed to apply migration {m8_version} ({m8_name}): {exc}", exc_info=True)
                    raise MigrationError(f"Migration {m8_name} failed: {exc}") from exc



    return applied
