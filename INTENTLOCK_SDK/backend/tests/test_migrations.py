"""
Automated tests for versioned database schema migration framework.
Verifies fresh database creation, legacy database migration, index generation,
data preservation, failure containment, and dialect safety.
"""

import pytest
import sqlalchemy as sa
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.migrations import (
    apply_migrations,
    MigrationError,
    _get_existing_columns,
    _get_existing_indexes,
    _validate_dialect,
)
from app.db.models import PolicyModel, AgentModel, ApprovalModel, AuditEventModel, Base


def test_migration_fresh_database():
    """Verify migrations apply cleanly and idempotently on a fresh database."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    # First run applies migration
    applied = apply_migrations(engine)
    assert "001_v2_enterprise_multitenancy_schema" in applied

    # Verify all newly required indexes exist on fresh database
    with engine.connect() as conn:
        policy_idxs = _get_existing_indexes(conn, "policies")
        assert "ix_policies_org_id" in policy_idxs

        agent_idxs = _get_existing_indexes(conn, "agents")
        assert "ix_agents_org_id" in agent_idxs

        approval_idxs = _get_existing_indexes(conn, "approvals")
        assert "ix_approvals_org_id" in approval_idxs
        assert "ix_approvals_intent_id" in approval_idxs

        audit_idxs = _get_existing_indexes(conn, "audit_events")
        assert "ix_audit_events_org_id" in audit_idxs
        assert "ix_audit_events_intent_id" in audit_idxs
        assert "ix_audit_events_trace_id" in audit_idxs
        assert "ix_audit_events_sequence_number" in audit_idxs

    # Second run is idempotent and does not create duplicate indexes
    applied_again = apply_migrations(engine)
    assert len(applied_again) == 0

    # Query with SQLAlchemy works
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        count = session.query(PolicyModel).count()
        assert count == 0
    finally:
        session.close()


def test_migration_legacy_database_with_data_preservation():
    """
    Verify legacy database schema without org_id or v2.0 governance columns
    is upgraded without data loss, with all required columns and indexes created.
    """
    engine = create_engine("sqlite:///:memory:")

    # 1. Create legacy v1.0 tables manually
    with engine.begin() as conn:
        conn.execute(sa.text("""
            CREATE TABLE policies (
                id VARCHAR(64) PRIMARY KEY,
                name VARCHAR(128) NOT NULL,
                description TEXT,
                allowed_permissions JSON,
                denied_permissions JSON,
                require_approval_permissions JSON,
                allowed_resources JSON,
                allowed_recipients JSON,
                max_risk_level VARCHAR(32),
                max_sensitivity INTEGER,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
        """))
        conn.execute(sa.text("""
            CREATE TABLE agents (
                id VARCHAR(128) PRIMARY KEY,
                name VARCHAR(128) NOT NULL,
                description TEXT,
                policy_id VARCHAR(64),
                created_at TIMESTAMP,
                last_active_at TIMESTAMP
            )
        """))
        conn.execute(sa.text("""
            CREATE TABLE approvals (
                id VARCHAR(64) PRIMARY KEY,
                action_hash VARCHAR(64) NOT NULL,
                tool_name VARCHAR(128) NOT NULL,
                agent_id VARCHAR(128),
                status VARCHAR(32),
                created_at TIMESTAMP,
                expires_at TIMESTAMP,
                resolved_at TIMESTAMP,
                resolved_by VARCHAR(128),
                consumed BOOLEAN,
                arguments_json JSON
            )
        """))
        conn.execute(sa.text("""
            CREATE TABLE audit_events (
                id VARCHAR(64) PRIMARY KEY,
                timestamp TIMESTAMP,
                agent_id VARCHAR(128),
                tool_name VARCHAR(128),
                verdict VARCHAR(32),
                reason VARCHAR(256),
                policy_id VARCHAR(64),
                action_hash VARCHAR(64),
                approval_id VARCHAR(64),
                risk_score FLOAT,
                execution_success BOOLEAN,
                execution_error TEXT,
                metadata_json JSON
            )
        """))

        # Seed legacy v1.0 data
        conn.execute(sa.text("""
            INSERT INTO policies (id, name, description)
            VALUES ('legacy-pol-1', 'Legacy Policy 1', 'Created in v1.0')
        """))
        conn.execute(sa.text("""
            INSERT INTO agents (id, name, policy_id)
            VALUES ('legacy-agent-1', 'Legacy Agent 1', 'legacy-pol-1')
        """))
        conn.execute(sa.text("""
            INSERT INTO approvals (id, action_hash, tool_name, expires_at)
            VALUES ('legacy-app-1', 'hash123', 'send_email', '2026-12-31 00:00:00')
        """))
        conn.execute(sa.text("""
            INSERT INTO audit_events (id, tool_name, verdict)
            VALUES ('legacy-aud-1', 'send_email', 'ALLOW')
        """))

    # 2. Run versioned migrations
    applied = apply_migrations(engine)
    assert "001_v2_enterprise_multitenancy_schema" in applied

    # 3. Verify columns exist, indexes exist, and data was preserved & backfilled
    with engine.connect() as conn:
        # Check columns
        assert "org_id" in _get_existing_columns(conn, "policies")
        assert "org_id" in _get_existing_columns(conn, "agents")
        assert "org_id" in _get_existing_columns(conn, "approvals")
        assert "intent_id" in _get_existing_columns(conn, "approvals")
        assert "consumed_at" in _get_existing_columns(conn, "approvals")
        assert "org_id" in _get_existing_columns(conn, "audit_events")
        assert "trace_id" in _get_existing_columns(conn, "audit_events")
        assert "previous_hash" in _get_existing_columns(conn, "audit_events")
        assert "entry_hash" in _get_existing_columns(conn, "audit_events")

        # Check indexes
        assert "ix_policies_org_id" in _get_existing_indexes(conn, "policies")
        assert "ix_agents_org_id" in _get_existing_indexes(conn, "agents")
        assert "ix_approvals_org_id" in _get_existing_indexes(conn, "approvals")
        assert "ix_approvals_intent_id" in _get_existing_indexes(conn, "approvals")
        assert "ix_audit_events_org_id" in _get_existing_indexes(conn, "audit_events")
        assert "ix_audit_events_intent_id" in _get_existing_indexes(conn, "audit_events")
        assert "ix_audit_events_trace_id" in _get_existing_indexes(conn, "audit_events")
        assert "ix_audit_events_sequence_number" in _get_existing_indexes(conn, "audit_events")

    # 4. Verify data preservation via ORM models
    Session = sessionmaker(bind=engine)
    session = Session()
    try:
        pol = session.query(PolicyModel).filter_by(id="legacy-pol-1").first()
        assert pol is not None
        assert pol.name == "Legacy Policy 1"
        assert pol.org_id == "default-org"

        agent = session.query(AgentModel).filter_by(id="legacy-agent-1").first()
        assert agent is not None
        assert agent.name == "Legacy Agent 1"
        assert agent.org_id == "default-org"

        appr = session.query(ApprovalModel).filter_by(id="legacy-app-1").first()
        assert appr is not None
        assert appr.tool_name == "send_email"
        assert appr.org_id == "default-org"
        assert appr.policy_version == 1

        aud = session.query(AuditEventModel).filter_by(id="legacy-aud-1").first()
        assert aud is not None
        assert aud.verdict == "ALLOW"
        assert aud.org_id == "default-org"
        assert aud.previous_hash == ""
        assert aud.entry_hash == ""
    finally:
        session.close()

    # 5. Verify idempotent second run
    applied_2 = apply_migrations(engine)
    assert len(applied_2) == 0


def test_migration_inspection_failure_stops_migration(monkeypatch):
    """Verify that an inspection failure raises MigrationError and stops migration cleanly."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)

    def _failing_inspector(conn, table_name):
        raise RuntimeError("Simulated inspection failure")

    monkeypatch.setattr("app.db.migrations._get_existing_columns", _failing_inspector)

    with pytest.raises(MigrationError, match="Migration 001_v2_enterprise_multitenancy_schema failed"):
        apply_migrations(engine)


def test_migration_unsupported_dialect_fails_clearly():
    """Verify that unsupported database dialects raise a clear MigrationError."""
    class FakeDialect:
        name = "oracle"

    class FakeConnection:
        dialect = FakeDialect()

    with pytest.raises(MigrationError, match="Unsupported database dialect 'oracle'"):
        _validate_dialect(FakeConnection())
