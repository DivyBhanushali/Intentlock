"""
Automated unit tests for INTENTLOCK Supabase PostgreSQL database integration.
Verifies URL normalization, credential redaction, fail-closed production checks,
engine configuration, and PostgreSQL DDL compilation for all models.
"""

import os
import pytest
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy.schema import CreateTable, CreateIndex

from app.core.config import normalize_database_url, mask_database_url, _resolve_database_url
from app.db.models import (
    Base,
    OrganizationModel,
    UserModel,
    ApiKeyModel,
    PolicyModel,
    PolicyVersionModel,
    IntentContextModel,
    ApprovalModel,
    AuditEventModel,
    SecurityThreatEventModel,
    BenchmarkRunModel,
    AgentModel,
)


def test_normalize_database_url_replaces_legacy_postgres_scheme():
    """Verify postgres:// is rewritten to postgresql:// for SQLAlchemy 2.0 compatibility."""
    legacy_url = "postgres://postgres.sample_tenant_id:secret_pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    expected = "postgresql://postgres.sample_tenant_id:secret_pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    assert normalize_database_url(legacy_url) == expected


def test_normalize_database_url_preserves_postgresql_and_sqlite():
    """Verify standard postgresql:// and sqlite:/// URIs are preserved unmodified."""
    pg_url = "postgresql://user:pass@host:5432/db?sslmode=require"
    sqlite_url = "sqlite:///./intentlock.db"
    assert normalize_database_url(pg_url) == pg_url
    assert normalize_database_url(sqlite_url) == sqlite_url
    assert normalize_database_url("") == ""
    assert normalize_database_url(None) == ""


def test_mask_database_url_redacts_credentials():
    """Verify password is completely masked for safe telemetry and logging."""
    url = "postgresql://postgres.sample_tenant_id:MySuperSecretP@ssword123!@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require"
    masked = mask_database_url(url)
    assert "MySuperSecretP@ssword123!" not in masked
    assert "postgres.sample_tenant_id:***@aws-1-ap-southeast-1.pooler.supabase.com:5432" in masked
    assert "sslmode=require" in masked


def test_mask_database_url_handles_no_password_or_empty():
    """Verify URLs without passwords or empty strings do not raise errors."""
    assert mask_database_url("sqlite:///./intentlock.db") == "sqlite:///./intentlock.db"
    assert mask_database_url("") == "<empty>"
    assert mask_database_url(None) == "<empty>"


def test_production_environment_prevents_silent_sqlite_fallback(monkeypatch):
    """Verify production fails closed if DATABASE_URL is missing or set to SQLite."""
    # 1. Missing DATABASE_URL in production raises RuntimeError
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    with pytest.raises(RuntimeError, match="CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is required in production"):
        _resolve_database_url()

    # 2. SQLite DATABASE_URL in production raises RuntimeError
    monkeypatch.setenv("ENVIRONMENT", "production")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///./intentlock.db")
    with pytest.raises(RuntimeError, match="CRITICAL CONFIGURATION ERROR: SQLite database URL is prohibited in production"):
        _resolve_database_url()

    # 3. Valid PostgreSQL DATABASE_URL in production succeeds
    monkeypatch.setenv("ENVIRONMENT", "production")
    valid_pg = "postgresql://postgres.user:pass@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
    monkeypatch.setenv("DATABASE_URL", valid_pg)
    assert _resolve_database_url() == valid_pg


def test_development_environment_allows_sqlite_fallback(monkeypatch):
    """Verify development and test environments permit local SQLite fallback."""
    monkeypatch.setenv("ENVIRONMENT", "development")
    monkeypatch.delenv("DATABASE_URL", raising=False)
    assert _resolve_database_url() == "sqlite:///./intentlock.db"


def test_postgresql_ddl_compilation_for_all_models():
    """Verify all 11 application models compile to valid PostgreSQL DDL with correct datatypes."""
    dialect = postgresql.dialect()
    all_tables = Base.metadata.sorted_tables
    assert len(all_tables) == 11

    table_names = {t.name for t in all_tables}
    expected_tables = {
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
    }
    assert table_names == expected_tables

    for table in all_tables:
        ddl = str(CreateTable(table).compile(dialect=dialect))
        assert f"CREATE TABLE {table.name}" in ddl
        # Confirm that timestamp columns compile to TIMESTAMP WITH TIME ZONE
        if "created_at" in table.columns:
            assert "TIMESTAMP WITH TIME ZONE" in ddl
        # Confirm JSON columns compile to JSON in PostgreSQL
        for col in table.columns:
            if isinstance(col.type, sa.JSON):
                assert f"{col.name} JSON" in ddl


def test_supabase_configured_connection_parameters():
    """Verify Supabase session pooler connection string format and parameters."""
    host = "aws-1-ap-southeast-1.pooler.supabase.com"
    port = 5432
    db_name = "postgres"
    username = "postgres.sample_tenant_id"

    sample_url = f"postgresql://{username}:mock_password@{host}:{port}/{db_name}?sslmode=require"
    normalized = normalize_database_url(sample_url)
    assert normalized.startswith("postgresql://")
    assert host in normalized
    assert str(port) in normalized
    assert username in normalized
    assert "sslmode=require" in normalized


def test_postgresql_engine_initializes_with_psycopg3_dialect():
    """Verify SQLAlchemy initializes an engine using the psycopg (Psycopg 3) driver."""
    from sqlalchemy import create_engine
    fake_url = "postgresql://mock_user:mock_pass@localhost:5432/mock_db"
    engine = create_engine(
        fake_url,
        pool_pre_ping=True,
        pool_recycle=300,
        pool_size=3,
        max_overflow=2,
        pool_timeout=30,
    )
    assert engine.dialect.name == "postgresql"
    assert engine.dialect.driver == "psycopg"
