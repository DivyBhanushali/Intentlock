-- =============================================================================
-- SICTACK (INTENTLOCK) PostgreSQL Role Separation & Least-Privilege Architecture
-- Product: SICTACK — Global AI Agent Runtime Security Infrastructure
-- Tagline: "Secure the action. Protect the intention."
-- Phase: 5C Enterprise Security Verification & Target CI Harness
-- =============================================================================
--
-- This script provisions two strictly separated database roles to enforce
-- PostgreSQL Row-Level Security (RLS) invariants in production:
--
-- 1. sictack_admin (Migration & Schema Owner Role):
--    - Owns database tables, sequences, functions, and views.
--    - Possesses BYPASSRLS or superuser privilege to execute DDL and migrations.
--    - NEVER used by the application runtime / web requests.
--
-- 2. sictack_app (Application Runtime Role):
--    - Role used by the web service connection pool (DATABASE_URL).
--    - Has NOBYPASSRLS, NOSUPERUSER, NOCREATEDB, NOCREATEROLE.
--    - Granted SELECT, INSERT, UPDATE, DELETE on application tables.
--    - Prohibited from creating new tables or functions (REVOKE CREATE ON SCHEMA public).
--    - Subject to FORCE ROW LEVEL SECURITY on all tenant tables.
--    - Granted EXECUTE strictly on sictack_resolve_api_key(VARCHAR).
-- =============================================================================

-- Step 1: Provision Roles (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sictack_admin') THEN
        CREATE ROLE sictack_admin WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION_ADMIN_PWD' BYPASSRLS;
        COMMENT ON ROLE sictack_admin IS 'SICTACK DDL & Schema Migration Administrator with BYPASSRLS';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sictack_app') THEN
        CREATE ROLE sictack_app WITH LOGIN PASSWORD 'CHANGE_IN_PRODUCTION_APP_PWD' NOBYPASSRLS NOSUPERUSER NOCREATEDB NOCREATEROLE;
        COMMENT ON ROLE sictack_app IS 'SICTACK Web Runtime Connection Role strictly subject to RLS';
    END IF;
END $$;

-- Step 2: Grant Database & Schema Access (Least Privilege)
DO $$
BEGIN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO sictack_app', current_database());
END $$;

GRANT USAGE ON SCHEMA public TO sictack_app;
REVOKE CREATE ON SCHEMA public FROM sictack_app;
REVOKE ALL ON SCHEMA public FROM PUBLIC;

-- Step 3: Grant Least-Privilege DML on Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sictack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sictack_app;

-- Step 4: Grant Sequence Usage
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sictack_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO sictack_app;

-- Step 5: Enforce FORCE ROW LEVEL SECURITY on all Multi-Tenant Tables
ALTER TABLE IF EXISTS api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS policies FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS policy_versions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS intent_contexts FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS approvals FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS audit_events FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_threat_events FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS benchmark_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_delegations FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_incidents FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS agent_messages FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS data_provenance FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS execution_integrity_records FORCE ROW LEVEL SECURITY;

-- Step 6: Secure Function Permissions (Idempotent)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = 'sictack_resolve_api_key'
    ) THEN
        REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM PUBLIC;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
            EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM authenticated';
        END IF;
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
            EXECUTE 'REVOKE ALL ON FUNCTION sictack_resolve_api_key(VARCHAR) FROM anon';
        END IF;
        GRANT EXECUTE ON FUNCTION sictack_resolve_api_key(VARCHAR) TO sictack_app;
    END IF;
END $$;
