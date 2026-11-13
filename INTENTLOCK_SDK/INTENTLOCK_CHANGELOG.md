# INTENTLOCK — Official Changelog

## [2.0.0] — 2026-11-13

### Major Evolution Release: Enterprise Intent-Aware Security & Governance Platform

INTENTLOCK 2.0 transforms the platform from a five-stage tool interceptor into a comprehensive, multi-tenant AI Agent Security, Intent Authorization, and Execution Governance system.

---

### New Features

#### 1. Intent Authorization Context Subsystem (Critical Priority)
- **Immutable Context Model**: Added `IntentContextModel` and `IntentContext` schema capturing `authorized_objective`, `allowed_actions`, `denied_actions`, `allowed_resources`, `allowed_recipients`, `sensitivity_ceiling`, and `expiration_timestamp`.
- **Pre-Execution Issuance**: Contexts are issued via `POST /api/v1/intents` by trusted applications/users before agent invocation.
- **Fail-Closed Evaluator**: Any mismatch in tenant, agent binding, scope, or expiration results in an immediate deterministic `DENY`.
- **Revocation Protocol**: Instant revocation with audit reason logging via `POST /api/v1/intents/{id}/revoke`.

#### 2. 8-Stage Interception Pipeline
- Upgraded the legacy 5-stage pipeline to an authoritative 8-stage pipeline:
  1. Tenant & Agent Identity Verification
  2. Permission Allow/Deny List Evaluation (Explicit Deny priority)
  3. Intent Context Validation & Scope Confinement
  4. Sensitivity Ceiling Enforcement
  5. Recipient & Data-Exfiltration Boundary Filter
  6. Resource Scope Glob Confinement
  7. Atomic Human Approval Nonce Verification
  8. Cryptographic Tamper-Evident Audit Recording

#### 3. Execution Provenance & Causal Evidence Graph
- Added `/api/v1/provenance` and `/api/v1/provenance/{trace_id}`.
- Reconstructs directional causal relationships: Authorized Objective $\rightarrow$ IntentContext $\rightarrow$ Agent $\rightarrow$ Tool Call $\rightarrow$ Policy Evaluation $\rightarrow$ Approval $\rightarrow$ Execution Result.
- Includes automatic secret redaction (`sk-ant-*`, `Bearer *`, passwords) across parameters and evidence cards.

#### 4. Advanced Policy Governance
- **Policy Versioning & Snapshotting**: Added `PolicyVersionModel` capturing frozen policy state on every mutation.
- **Atomic Rollback**: `/api/v1/policies/{id}/rollback/{version}`.
- **Dry-Run Policy Simulator**: `/api/v1/policies/simulate` allows testing hypothetical actions without execution.
- **Conflict Detection Engine**: `/api/v1/policies/{id}/conflicts` identifies contradictory rules.
- **Enterprise Policy Templates**: 6 built-in enterprise profiles (Data Analyst, Restricted DB, Email Assistant, Financial Ops, Customer Support, Dev Sandbox).

#### 5. Advanced Approval Security & Anti-Replay Nonces
- Cryptographic multi-binding to canonical action hash, agent, intent context, policy version, and expiration.
- Atomic single-use approval consumption (`consumed = True`, `consumed_at = now`) prevents replay attacks.

#### 6. Real-Time Threat Intelligence & Anomaly Engine
- Added `ThreatDetector` and `/api/v1/threats` endpoints.
- Detects rapid repeated denials ($\ge 3$ in 60s), data exfiltration attempts, intent boundary tampering, and sensitivity escalations.
- Operator mitigation actions: `MITIGATED` or `DISMISSED` with audit notes.

#### 7. 25-Vector Adversarial Benchmark Suite
- Expanded attack vector verification from 15 to 25 automated scenarios.
- Added `/api/v1/benchmarks` endpoints with quantitative metrics: total scenarios, block rate (100%), and average latency (< 1ms).

#### 8. Cryptographic Audit Hash-Chaining
- Each audit log entry is chained via SHA-256 sequential hashing:
  $\text{entry\_hash} = \text{SHA256}(\text{seq} \parallel \text{prev\_hash} \parallel \text{org\_id} \parallel \text{agent\_id} \parallel \text{tool} \parallel \text{verdict} \parallel \text{action\_hash} \parallel \text{epoch})$.
- Added `GET /api/v1/audit/verify` to detect any database tampering, modification, or sequence corruption.

#### 9. Ecosystem Integrations: LangGraph & MCP
- Added `SecureGraphNode` and `@secure_langgraph_node` for LangGraph stateful multi-agent graphs with human-in-the-loop branching.
- Enhanced `MCPSecurityProxy` with intent propagation across JSON-RPC 2.0 `tools/call`.

#### 10. Dashboard Evolution (Next.js 16)
- Added `/intents` (Intent Authorization Console).
- Added `/provenance` (Trace Explorer & Evidence Graph).
- Added `/threats` (Threat Intelligence Console).
- Added `/benchmark` (Adversarial Benchmark Runner).
- Updated horizontal navigation pill bar.

---

### Backward Compatibility
- **Zero Regressions**: 100% of legacy API routes, parameters, and models remain supported.
- **Test Suite**: Expanded from 93 passing tests to **121 passing tests**.
