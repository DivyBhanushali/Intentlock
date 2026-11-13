# INTENTLOCK 2.0 — Enterprise Architecture Specification

## 1. Executive Summary

**INTENTLOCK 2.0** is an enterprise-grade AI Agent Security, Intent Authorization, and Execution Governance Platform. It enforces authoritative, deterministic security boundaries around autonomous and semi-autonomous AI agents (powered by OpenAI, Anthropic, Gemini, LangChain, LangGraph, CrewAI, AutoGen, and Model Context Protocol).

The core thesis of INTENTLOCK 2.0 is the strict separation between:
1. **Agent Capabilities**: What tools, functions, and APIs an agent is technically equipped to execute.
2. **Deterministic Organization Policy**: What coarse-grained permissions, roles, and risk ceilings the tenant permits.
3. **Intent Authorization Context**: What specific, bounded, and task-scoped objectives the user or trusted application actually authorized the agent to perform.

In INTENTLOCK 2.0, **an LLM is never the authority responsible for authorizing its own actions**. All authorization decisions are strictly deterministic, auditable, and mathematically verifiable.

---

## 2. High-Level System Architecture

```
                    ┌──────────────────────────────────────────────┐
                    │          Trusted Application / User          │
                    │        (Issues Scoped Intent Context)        │
                    └──────────────────────┬───────────────────────┘
                                           │
                                           ▼ [POST /api/v1/intents]
                    ┌──────────────────────────────────────────────┐
                    │      INTENT AUTHORIZATION REGISTRY           │
                    │  • Immutable IntentContext Storage           │
                    │  • Objective, Allowed/Denied Action Globs   │
                    │  • Expiration TTL & Sensitivity Ceilings     │
                    └──────────────────────┬───────────────────────┘
                                           │
 ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
 │                                         │                                         │
 │                      AI Agent Runtime (LangChain/LangGraph/MCP)                   │
 │                                         │                                         │
 └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                           │
                                           ▼ [POST /api/v1/intercept]
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        INTENTLOCK 8-STAGE INTERCEPTION PIPELINE                        │
│                                                                                        │
│  Stage 1: Identity & Tenant Verification (JWT / TenantContext / Multi-Tenant Isolation)│
│  Stage 2: Deterministic Allow/Deny Evaluation (Explicit Deny Overrides All)            │
│  Stage 3: Intent Context Enforcement (Immutability, TTL, Agent Binding, Scope)         │
│  Stage 4: Sensitivity Ceiling Enforcement (Max sensitivity ceiling check)              │
│  Stage 5: Data Exfiltration & Recipient Filtering (Regex / Domain Whitelist)           │
│  Stage 6: Resource Scope Confinement (Glob matching: /data/public/* vs traversal)      │
│  Stage 7: Atomic Human Approval Nonce Verification (Single-use token, replay guard)    │
│  Stage 8: Cryptographic Audit Hash-Chaining (Sequential SHA-256 tamper-evident log)    │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │
                     ┌─────────────────────┴─────────────────────┐
                     ▼                                           ▼
       ┌───────────────────────────┐               ┌───────────────────────────┐
       │   ALLOW / EXECUTE TOOL    │               │  DENY / REQUIRE APPROVAL  │
       │  • Action executed        │               │  • Threat Engine Trigger  │
       │  • Output sanitized       │               │  • HITL Approval Queue    │
       │  • Audit event chained    │               │  • Trace node logged      │
       └───────────────────────────┘               └───────────────────────────┘
```

---

## 3. Core Architectural Modules

### 3.1 Intent Authorization Context Subsystem
- **Model**: `IntentContextModel` (backend) & `IntentContext` (SDK).
- **Invariants**:
  - Context is strictly immutable once issued.
  - Revocations require a cryptographically recorded reason and timestamp.
  - Any parameter mismatch between requested agent and intent context results in immediate fail-closed `DENY`.
  - Objective text is stored for audit traceability, but permissions are evaluated strictly through structured claims (`allowed_actions`, `denied_actions`, `allowed_resources`, `allowed_recipients`, `sensitivity_ceiling`).

### 3.2 8-Stage Interception Pipeline
Located in `backend/app/api/v1/intercept.py` and `sdk/python/src/intentlock/policy_engine.py`:
1. **Tenant & Agent Authentication**: Validates tenant workspace and active agent registration.
2. **Explicit Deny & Capability Verification**: Rejects unregistered tools or explicitly denied permissions.
3. **Intent Boundary Validation**: Verifies intent existence, tenant ownership, agent authorization, expiration, and whitelist/denylist membership.
4. **Sensitivity Ceiling Enforcement**: Compares tool sensitivity against policy threshold and intent ceiling.
5. **Recipient Exfiltration Filter**: Inspects target emails, IPs, or domains against whitelist patterns.
6. **Resource Confinement**: Matches target file/database paths against permitted glob patterns, preventing directory traversal escapes (`../../etc/shadow`).
7. **Atomic Single-Use Approval Verification**: Verifies human-in-the-loop approval token with database-level row lock, ensuring single-use consumption and zero token replay.
8. **Tamper-Evident Audit Recording**: Emits sequential cryptographically chained SHA-256 audit record.

### 3.3 Provenance & Causal Evidence Graph
Located in `backend/app/api/v1/provenance.py`:
- Tracks traces via `trace_id`.
- Connects: User Task Objective $\rightarrow$ IntentContext $\rightarrow$ Agent Invocation $\rightarrow$ Intercepted Tool Call $\rightarrow$ Policy Evaluation $\rightarrow$ Human Approval $\rightarrow$ Final Execution Result.
- Performs automatic secret redaction (`sk-ant-*`, `Bearer *`, passwords, tokens) before graph rendering or logging.

### 3.4 Advanced Policy Governance
Located in `backend/app/api/v1/policies.py`:
- **Policy Versioning**: Every mutation triggers `_snapshot_version`, persisting full historical snapshots in `PolicyVersionModel`.
- **Atomic Rollback**: `/policies/{id}/rollback/{version}` reverts policies instantaneously.
- **Dry-Run Policy Simulator**: `/policies/simulate` allows operators to test hypothetical tool calls against active policies and intent contexts without executing tools.
- **Conflict Detection Engine**: `/policies/{id}/conflicts` identifies logical contradictions (e.g. tool simultaneously in allowed and denied lists).
- **Enterprise Policy Templates**: Pre-configured profiles for Read-Only Analyst, Restricted Database Agent, Email Assistant, Financial Operations, Support Agent, and Developer Sandbox.

### 3.5 Real-Time Threat Intelligence & Anomaly Engine
Located in `backend/app/core/threat_engine.py` and `backend/app/api/v1/threats.py`:
- Evaluates real-time patterns on interception rejections:
  - `RULE_RAPID_DENIALS`: Detects automated probing when $\ge 3$ rejections occur within 60s.
  - `RULE_EXFILTRATION_ATTEMPT`: Detects recipient policy violations.
  - `RULE_INTENT_TAMPERING`: Detects boundary escapes beyond intent scope.
  - `RULE_SENSITIVITY_ESCALATION`: Detects unauthorized sensitivity spikes.
- Supports tenant mitigation workflows (`MITIGATED`, `DISMISSED`) with operator audit notes.

### 3.6 Cryptographic Audit Hash-Chaining
Located in `backend/app/core/audit_chain.py` and `/api/v1/audit/verify`:
- Each audit entry computes:
  $$\text{entry\_hash} = \text{SHA256}(\text{seq} \parallel \text{prev\_hash} \parallel \text{org\_id} \parallel \text{agent\_id} \parallel \text{tool} \parallel \text{verdict} \parallel \text{action\_hash} \parallel \text{epoch})$$
- Linkage: `entry[N].previous_hash == entry[N-1].entry_hash`.
- Verification endpoint `/audit/verify` traverses the full ledger to mathematically confirm integrity and flag any corrupted or modified records.

---

## 4. Multi-Tenant Isolation Architecture

Every database query in INTENTLOCK 2.0 is scoped strictly by `org_id` extracted from authenticated JWT tokens or API key headers (`TenantContext`). Cross-tenant access is structurally prevented at the database and service layer:
- Tenants cannot query, view, or mutate IntentContexts of other tenants.
- Execution traces and provenance graphs are partitioned strictly by tenant.
- Audit chains are maintained per organization.
- Threat detections and security benchmarks are isolated per workspace.
