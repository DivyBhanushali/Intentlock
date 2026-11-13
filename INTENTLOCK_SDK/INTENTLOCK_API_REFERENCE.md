# INTENTLOCK 2.0 — REST API Specification & Reference Guide

## 1. Overview & Authentication

The INTENTLOCK 2.0 Backend exposes a RESTful API over HTTPS with OpenAPI 3.1 documentation available at `/docs`.

### Authentication Schemes
- **Bearer Token**: Standard JWT header: `Authorization: Bearer <jwt_access_token>`.
- **API Key**: Direct agent or SDK header: `X-API-Key: ilk_live_<key_secret>`.
- **Tenant Context**: Automatically resolved per request. Multi-tenant isolation guarantees that all operations are scoped to the authenticated organization (`org_id`).

---

## 2. Intent Authorization Context (`/api/v1/intents`)

### `POST /api/v1/intents`
Issues an immutable, scoped Intent Authorization Context before agent runtime.
- **Request Body**:
  ```json
  {
    "agent_id": "agent-support",
    "authorized_objective": "Resolve ticket #402 by reading FAQ and drafting email",
    "allowed_actions": ["kb:read", "email:draft"],
    "denied_actions": ["email:send_external", "db:drop"],
    "allowed_permissions": ["kb:read", "email:draft"],
    "allowed_resources": ["/knowledge_base/*"],
    "allowed_recipients": ["*@internal.corp"],
    "sensitivity_ceiling": 5,
    "execution_scope": "customer-support",
    "duration_seconds": 3600
  }
  ```
- **Response** (`201 Created`):
  ```json
  {
    "id": "int_a1b2c3d4e5f6",
    "org_id": "org_enterprise_01",
    "agent_id": "agent-support",
    "user_id": "usr_admin_01",
    "authorized_objective": "Resolve ticket #402 by reading FAQ and drafting email",
    "allowed_actions": ["kb:read", "email:draft"],
    "denied_actions": ["email:send_external", "db:drop"],
    "allowed_permissions": ["kb:read", "email:draft"],
    "allowed_resources": ["/knowledge_base/*"],
    "allowed_recipients": ["*@internal.corp"],
    "sensitivity_ceiling": 5,
    "execution_scope": "customer-support",
    "expiration_timestamp": "2026-11-13T15:30:00Z",
    "context_status": "ACTIVE",
    "authorization_version": 1,
    "created_at": "2026-11-13T14:30:00Z"
  }
  ```

### `GET /api/v1/intents`
Lists intent authorization contexts for the tenant.
- **Query Parameters**:
  - `status`: Optional filter (`ACTIVE`, `EXPIRED`, `REVOKED`).
  - `agent_id`: Optional agent filter.
  - `limit`: Default `50`, max `200`.
  - `offset`: Default `0`.

### `POST /api/v1/intents/{id}/revoke`
Revokes an active IntentContext.
- **Request Body**: `{"reason": "Task completed or operator abort"}`.
- **Response**: Updated `IntentContext` with `context_status = "REVOKED"`.

---

## 3. Remote Tool Interception Gateway (`/api/v1/intercept`)

### `POST /api/v1/intercept`
Authoritative 8-stage interception endpoint.
- **Request Body**:
  ```json
  {
    "agent_id": "agent-support",
    "tool_name": "kb:read",
    "arguments": {"article_id": "faq-102"},
    "user_request": "How do I reset my password?",
    "sensitivity": 2,
    "resource_id": "/knowledge_base/auth",
    "recipient": "",
    "intent_id": "int_a1b2c3d4e5f6",
    "trace_id": "tr_998877665544",
    "approval_id": null
  }
  ```
- **Response** (`200 OK`):
  ```json
  {
    "verdict": "ALLOW",
    "allowed": true,
    "reason": "POLICY_PERMITTED",
    "decision_id": "dec_uuid_001",
    "action_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "risk_score": 0.2,
    "risk_level": "LOW",
    "approval_id": null,
    "intent_id": "int_a1b2c3d4e5f6",
    "trace_id": "tr_998877665544",
    "policy_version": 1
  }
  ```
- **Approval Required Response**:
  ```json
  {
    "verdict": "REQUIRE_APPROVAL",
    "allowed": false,
    "reason": "REQUIRES_HUMAN_APPROVAL",
    "decision_id": "dec_uuid_002",
    "action_hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "risk_score": 0.8,
    "risk_level": "HIGH",
    "approval_id": "appr_uuid_999",
    "intent_id": "int_a1b2c3d4e5f6",
    "trace_id": "tr_998877665544"
  }
  ```

---

## 4. Execution Provenance & Evidence Graph (`/api/v1/provenance`)

### `GET /api/v1/provenance`
Returns grouped trace summaries across the organization.
- **Query Parameters**: `limit` (default 50).
- **Response**: Array of `TraceSummary` (`trace_id`, `event_count`, `tools_called`, `verdicts`, `start_time`, `last_time`).

### `GET /api/v1/provenance/{trace_id}`
Returns complete reconstructed causal evidence graph.
- **Response**:
  - `trace_id`: Unique trace identifier.
  - `causal_explanation`: High-level summary of authorized objective, intercepted actions, and decisions.
  - `intent_context`: Associated IntentContext object or `null`.
  - `nodes`: Array of evidence nodes (`USER_TASK`, `INTENT_CONTEXT`, `AGENT`, `TOOL_CALL`, `POLICY_EVALUATION`, `DECISION`).
  - `edges`: Array of directional causal relationships (`AUTHORIZED_BY`, `EMITTED_BY`, `EVALUATED_AGAINST`, `RESULTED_IN`).
  - `raw_events`: Audit trail entries with secret redaction applied.

---

## 5. Advanced Policy Governance (`/api/v1/policies`)

- `GET /api/v1/policies`: List policies.
- `POST /api/v1/policies`: Create policy.
- `GET /api/v1/policies/{id}/versions`: Retrieve full version snapshot history.
- `POST /api/v1/policies/{id}/rollback/{version}`: Instantaneous atomic rollback to past version.
- `POST /api/v1/policies/simulate`: Dry-run simulation of hypothetical tool call against active policy and intent context.
- `GET /api/v1/policies/{id}/conflicts`: Identifies logical rule contradictions.
- `GET /api/v1/policies/templates`: Lists reusable enterprise policy templates.
- `POST /api/v1/policies/from-template/{key}`: Instantiates an enterprise template for the tenant.

---

## 6. Threat Intelligence & Anomaly Response (`/api/v1/threats`)

- `GET /api/v1/threats`: List detected anomalies (`status`, `severity`, `agent_id`).
- `GET /api/v1/threats/stats`: Aggregated metrics (total, active, critical, categories).
- `POST /api/v1/threats/{id}/mitigate`: Update threat state (`MITIGATED`, `DISMISSED`) with operator audit note.

---

## 7. Adversarial Benchmark & Penetration Suite (`/api/v1/benchmarks`)

- `POST /api/v1/benchmarks/run`: Executes full 25-vector adversarial attack suite and logs `BenchmarkRunModel`.
- `GET /api/v1/benchmarks`: List historical benchmark runs.
- `GET /api/v1/benchmarks/latest`: Returns most recent benchmark run (executing on-demand if none exists).
- `GET /api/v1/benchmarks/{run_id}`: Retrieve detailed scenario breakdown.

---

## 8. Cryptographic Audit Trail (`/api/v1/audit`)

- `GET /api/v1/audit/events`: Paginated query across immutable security events.
- `GET /api/v1/audit/stats`: Aggregated event metrics for dashboard.
- `GET /api/v1/audit/verify`: Traverses sequential SHA-256 hash chain and returns cryptographic integrity certificate (`verified: true/false`, valid count, corrupted count).
