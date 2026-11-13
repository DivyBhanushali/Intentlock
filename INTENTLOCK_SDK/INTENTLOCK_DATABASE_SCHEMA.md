# INTENTLOCK 2.0 — Relational Database Schema & Data Dictionary

## 1. Schema Overview & Architecture

INTENTLOCK 2.0 uses a relational schema designed for strict multi-tenant isolation, atomic transaction isolation, and cryptographic auditability.

- **Primary Dialect**: PostgreSQL (production) & SQLite (local development and automated test suites).
- **ORM**: SQLAlchemy with declarative base models defined in `backend/app/db/models.py`.
- **Tenant Scoping**: All operational tables index `org_id` to enforce sub-second partitioned queries and multi-tenant isolation.

---

## 2. Entity-Relationship Model

```
       ┌───────────────────────┐
       │     organizations     │
       └───────────┬───────────┘
                   │ 1:N
   ┌───────────────┼───────────────────────────┬───────────────────────────┐
   │               │                           │                           │
   ▼               ▼                           ▼                           ▼
┌────────┐   ┌────────────┐             ┌─────────────┐             ┌──────────────┐
│ users  │   │  api_keys  │             │  policies   │             │    agents    │
└────────┘   └────────────┘             └──────┬──────┘             └──────┬───────┘
                                               │ 1:N                       │
                                               ▼                           │
                                      ┌─────────────────┐                  │
                                      │ policy_versions │                  │
                                      └─────────────────┘                  │
   ┌───────────────────────────────────────────────────────────────────────┘
   │
   ├───────────────────────────┬───────────────────────────┬───────────────────────────┐
   ▼                           ▼                           ▼                           ▼
┌──────────────────┐   ┌───────────────┐   ┌───────────────────────┐   ┌────────────────┐
│ intent_contexts  │   │   approvals   │   │  security_threat_events│  │ benchmark_runs │
└──────────────────┘   └───────────────┘   └───────────────────────┘   └────────────────┘
   │                           │
   └─────────────┬─────────────┘
                 │
                 ▼
        ┌──────────────────┐
        │   audit_events   │ (SHA-256 Sequential Hash Chained)
        └──────────────────┘
```

---

## 3. Detailed Table Specifications

### 3.1 `organizations`
Tenants within the INTENTLOCK platform.
- `id` (VARCHAR(64), PK): Unique org identifier (`org_uuid`).
- `name` (VARCHAR(128), NOT NULL): Organization display name.
- `plan` (VARCHAR(32), DEFAULT 'FREE'): Plan tier (`FREE`, `PRO`, `ENTERPRISE`).
- `created_at` (TIMESTAMP WITH TIME ZONE).

### 3.2 `users`
Authenticated human principals and operators.
- `id` (VARCHAR(64), PK): User ID (`usr_uuid`).
- `org_id` (VARCHAR(64), FK $\rightarrow$ `organizations.id`, INDEX).
- `email` (VARCHAR(128), UNIQUE, INDEX, NOT NULL).
- `hashed_password` (VARCHAR(256), NOT NULL): PBKDF2-HMAC-SHA256 hash.
- `full_name` (VARCHAR(128)).
- `role` (VARCHAR(32), DEFAULT 'ADMIN'): RBAC role (`ADMIN`, `APPROVER`, `VIEWER`).
- `is_active` (BOOLEAN, DEFAULT TRUE).
- `created_at` / `last_login_at` (TIMESTAMP WITH TIME ZONE).

### 3.3 `api_keys`
Service keys used by SDK clients and agent runtimes.
- `id` (VARCHAR(64), PK): Key ID (`key_uuid`).
- `org_id` (VARCHAR(64), FK $\rightarrow$ `organizations.id`, INDEX).
- `name` (VARCHAR(128)): Key label.
- `hashed_key` (VARCHAR(256), NOT NULL): SHA-256 hash of raw token.
- `key_prefix` (VARCHAR(16)): Redacted prefix for display (`ilk_live_...`).
- `is_active` (BOOLEAN, DEFAULT TRUE).
- `created_at` / `last_used_at` (TIMESTAMP WITH TIME ZONE).

### 3.4 `policies` & `policy_versions`
Authoritative security policies and historical version snapshots.
- **`policies`**:
  - `id` (VARCHAR(64), PK): Policy identifier.
  - `org_id` (VARCHAR(64), INDEX).
  - `name` (VARCHAR(128)).
  - `description` (TEXT).
  - `allowed_permissions` (JSON): List of permitted actions.
  - `denied_permissions` (JSON): Explicit deny list (priority override).
  - `require_approval_permissions` (JSON): Actions routed to HITL queue.
  - `allowed_resources` (JSON): Permitted resource globs.
  - `allowed_recipients` (JSON): Whitelisted email/domain patterns.
  - `max_sensitivity` (INTEGER, 0 to 10).
  - `max_risk_level` (VARCHAR(32)).
  - `version` (INTEGER, DEFAULT 1): Incremented on each update.
  - `created_at` / `updated_at` (TIMESTAMP WITH TIME ZONE).
- **`policy_versions`**:
  - `id` (VARCHAR(64), PK): Snapshot ID (`pver_uuid`).
  - `policy_id` (VARCHAR(64), FK $\rightarrow$ `policies.id`, INDEX).
  - `org_id` (VARCHAR(64), INDEX).
  - `version` (INTEGER, INDEX).
  - `snapshot_json` (JSON): Full frozen policy state.
  - `change_reason` (TEXT).
  - `created_at` (TIMESTAMP WITH TIME ZONE).

### 3.5 `intent_contexts` (NEW IN 2.0)
Cryptographically immutable intent authorizations.
- `id` (VARCHAR(64), PK): Intent identifier (`int_uuid`).
- `org_id` (VARCHAR(64), INDEX, NOT NULL).
- `agent_id` (VARCHAR(128), INDEX, NOT NULL): Bound agent ID.
- `user_id` (VARCHAR(64), INDEX, NOT NULL): Authorizing principal.
- `authorized_objective` (TEXT, NOT NULL): Human/audit task objective.
- `allowed_actions` (JSON): Permitted tool actions.
- `denied_actions` (JSON): Explicitly forbidden tools.
- `allowed_permissions` (JSON): Fine-grained capability scopes.
- `allowed_resources` (JSON): Permitted target resource globs.
- `allowed_recipients` (JSON): Permitted data recipients.
- `sensitivity_ceiling` (INTEGER, DEFAULT 5).
- `execution_scope` (VARCHAR(64), DEFAULT 'default').
- `expiration_timestamp` (TIMESTAMP WITH TIME ZONE, NOT NULL).
- `context_status` (VARCHAR(32), DEFAULT 'ACTIVE', INDEX): `ACTIVE`, `REVOKED`, `EXPIRED`, `CONSUMED`.
- `authorization_version` (INTEGER, DEFAULT 1).
- `created_at` (TIMESTAMP WITH TIME ZONE).
- `revocation_reason` (TEXT, NULLABLE).

### 3.6 `approvals`
Human-in-the-loop authorization tokens.
- `id` (VARCHAR(64), PK): Approval token ID (`appr_uuid`).
- `org_id` (VARCHAR(64), INDEX, NOT NULL).
- `action_hash` (VARCHAR(64), INDEX, NOT NULL): Canonical SHA-256 payload hash.
- `tool_name` (VARCHAR(128), NOT NULL).
- `agent_id` (VARCHAR(128), NOT NULL).
- `intent_id` (VARCHAR(64), INDEX, DEFAULT ''): Bound IntentContext.
- `policy_version` (INTEGER, DEFAULT 1).
- `status` (VARCHAR(32), DEFAULT 'PENDING', INDEX): `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`.
- `created_at` / `expires_at` / `resolved_at` / `consumed_at` (TIMESTAMP WITH TIME ZONE).
- `resolved_by` (VARCHAR(64), NULLABLE): Approving operator ID.
- `consumed` (BOOLEAN, DEFAULT FALSE, INDEX): Single-use atomic flag.
- `arguments_json` (JSON): Action parameters captured at request time.

### 3.7 `audit_events`
Cryptographically hash-chained execution ledger.
- `id` (VARCHAR(64), PK): Event identifier.
- `org_id` (VARCHAR(64), INDEX, NOT NULL).
- `timestamp` (TIMESTAMP WITH TIME ZONE, INDEX, NOT NULL).
- `agent_id` (VARCHAR(128), INDEX).
- `tool_name` (VARCHAR(128), INDEX).
- `verdict` (VARCHAR(32), INDEX, NOT NULL): `ALLOW`, `DENY`, `REQUIRE_APPROVAL`.
- `reason` (VARCHAR(256), NOT NULL).
- `policy_id` (VARCHAR(64)).
- `action_hash` (VARCHAR(64), INDEX).
- `approval_id` (VARCHAR(64), INDEX).
- `intent_id` (VARCHAR(64), INDEX): Bound IntentContext.
- `trace_id` (VARCHAR(64), INDEX): Trace correlation identifier.
- `sequence_number` (INTEGER, INDEX): Monotonically increasing sequence per org.
- `previous_hash` (VARCHAR(64), NOT NULL): Entry hash of preceding record.
- `entry_hash` (VARCHAR(64), NOT NULL): SHA-256 hash of this entry's canonical payload.
- `risk_score` (FLOAT, DEFAULT 0.0).
- `execution_success` (BOOLEAN, NULLABLE).
- `execution_error` (TEXT, DEFAULT '').
- `metadata_json` (JSON, DEFAULT {}).

### 3.8 `security_threat_events` (NEW IN 2.0)
Real-time detected security anomalies and attack attempts.
- `id` (VARCHAR(64), PK): Threat ID (`thr_uuid`).
- `org_id` (VARCHAR(64), INDEX, NOT NULL).
- `agent_id` (VARCHAR(128), INDEX, NOT NULL).
- `threat_category` (VARCHAR(64), INDEX, NOT NULL): `DATA_EXFILTRATION`, `INTENT_VIOLATION`, `PRIVILEGE_ESCALATION`, `ANOMALOUS_BEHAVIOR`.
- `severity` (VARCHAR(32), INDEX, DEFAULT 'HIGH'): `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- `description` (TEXT, NOT NULL).
- `detection_rule` (VARCHAR(128), NOT NULL).
- `related_trace_id` (VARCHAR(64), NULLABLE).
- `recommended_response` (VARCHAR(256)).
- `mitigation_status` (VARCHAR(32), DEFAULT 'ACTIVE', INDEX): `ACTIVE`, `MITIGATED`, `DISMISSED`.
- `created_at` (TIMESTAMP WITH TIME ZONE).

### 3.9 `benchmark_runs` (NEW IN 2.0)
Historical records of the 25-vector adversarial benchmark suite.
- `id` (VARCHAR(64), PK): Run ID (`bmk_uuid`).
- `org_id` (VARCHAR(64), INDEX, NOT NULL).
- `total_scenarios` (INTEGER, DEFAULT 25).
- `passed_scenarios` (INTEGER, DEFAULT 25).
- `failed_scenarios` (INTEGER, DEFAULT 0).
- `block_rate` (FLOAT, DEFAULT 1.0).
- `average_latency_ms` (FLOAT, DEFAULT 0.0).
- `report_json` (JSON, DEFAULT {}): Detailed scenario results.
- `created_at` (TIMESTAMP WITH TIME ZONE).
