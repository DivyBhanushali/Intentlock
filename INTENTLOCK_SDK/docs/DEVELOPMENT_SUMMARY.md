# INTENTLOCK — Complete Final Development & Engineering Report

**Product Identity**: AI Agent Security Middleware & Python Developer SDK  
**Repository Location**: `c:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project\INTENTLOCK_SDK\`  
**Document Version**: 2.0 (Phases 0 through 8 Complete — Production-Ready Release)  
**Author**: Divy Bhanushali & Lead Engineering Team  
**Project Track**: BSc IT Final Year Engineering Project  
**Overall Status**: All 8 Phases Fully Completed (88/88 Automated Tests Passing · 15/15 Threat Model Penetration Tests Verified · 0 TypeScript Errors · Dockerized & Packaged)

---

## 1. Executive Summary

Autonomous AI agents powered by Large Language Models (LLMs) are rapidly moving from chat interfaces to direct environment execution—invoking file system APIs, database queries, bash commands, emails, and financial transactions. However, LLMs are fundamentally non-deterministic and vulnerable to prompt injection, jailbreaking, context confusion, and hallucinatory tool invocation. System prompts and LLM-based guardrails fail because they operate within the same semantic space as untrusted user inputs.

**INTENTLOCK** provides an out-of-band, code-level **Security Middleware & Zero-Trust Execution Guard** that intercepts every agent tool call before execution. Tool execution is strictly governed by deterministic policies, cryptographic single-use approvals, and append-only audit logging.

### Fundamental Security Invariants
1. **Zero LLM Self-Authorization**: The LLM is never trusted to evaluate its own permissions or validate its own safety.
2. **Deterministic Evaluation**: Policy decisions rely entirely on hard-coded rules, glob matching, and heuristic risk scoring.
3. **Fail-Closed Architecture**: Any unregistered tool, malformed parameter, unhandled exception, or expired token defaults immediately to `DENY`.
4. **Cryptographic Binding**: Approval tokens are HMAC-SHA256 bound to canonical action hashes with single-use invalidation.
5. **Immutable Auditability**: All attempts (`ALLOW`, `DENY`, `REQUIRE_APPROVAL`, `RATE_LIMITED`) are permanently logged with recursive secret scrubbing.

---

## 2. Monorepo Architecture Overview

```
c:\Users\divyb\OneDrive\Desktop\TYIT FInal Year Project\INTENTLOCK_SDK\
├── sdk/python/                          # Core Python Security Library (`intentlock`)
│   ├── src/intentlock/
│   │   ├── __init__.py                  # Version and public exports
│   │   ├── models.py                    # Pydantic v2 schemas & canonical SHA-256 hashing
│   │   ├── exceptions.py                # Typed security exception hierarchy
│   │   ├── logger.py                    # JSON-lines logger with recursive secret scrubbing
│   │   ├── registry.py                  # Thread-safe tool registry with schema validation
│   │   ├── policy_engine.py             # Deterministic 9-step evaluation pipeline
│   │   ├── risk_engine.py               # Composite heuristic risk assessment
│   │   ├── approval.py                  # Single-use HMAC-SHA256 human approval engine
│   │   ├── audit.py                     # Append-only audit store with filtered queries
│   │   ├── gateway.py                   # ActionGateway runtime execution boundary
│   │   ├── agent.py                     # Developer facade (SecureAgent)
│   │   └── integrations/
│   │       ├── langchain.py             # LangChain SecureTool & decorator
│   │       └── mcp.py                   # Model Context Protocol JSON-RPC proxy
│   ├── tests/                           # 88 automated tests (100% passing)
│   │   ├── test_models.py
│   │   ├── test_registry.py
│   │   ├── test_policy_engine.py
│   │   ├── test_gateway.py
│   │   ├── test_approval.py
│   │   ├── test_audit.py
│   │   ├── test_agent.py
│   │   ├── test_integrations_langchain.py
│   │   ├── test_integrations_mcp.py
│   │   └── test_threat_model_pentest.py # 15/15 Automated Penetration Tests (T-01 to T-15)
│   ├── dist/                            # Production distribution packages
│   │   ├── intentlock-0.1.0-py3-none-any.whl
│   │   └── intentlock-0.1.0.tar.gz
│   ├── README.md                        # SDK developer documentation
│   └── pyproject.toml                   # Standard PEP 517/621 package build config
│
├── backend/                             # Enterprise Security REST API
│   ├── app/
│   │   ├── main.py                      # FastAPI entrypoint, CORS, exception handlers
│   │   ├── database.py                  # SQLAlchemy engine & session factory
│   │   ├── models/orm.py                # Relational tables (Policies, Approvals, Audit, Agents)
│   │   └── routers/
│   │       ├── policies.py              # CRUD for deterministic policies
│   │       ├── approvals.py             # Human-in-the-loop pending approval triage
│   │       ├── audit.py                 # Filterable audit events and metrics
│   │       ├── agents.py                # Agent registration and status
│   │       └── intercept.py             # Out-of-band tool call interception endpoint
│   ├── tests/                           # Direct SQLite API route tests
│   └── requirements.txt
│
├── frontend/                            # Developer Security Dashboard (Next.js 16 + React 19)
│   ├── src/app/
│   │   ├── globals.css                  # Self-contained ultra-minimal dark cyber CSS
│   │   ├── layout.tsx                   # System font layout, Navbar & Toast provider
│   │   ├── page.tsx                     # Security Overview & system telemetry metrics
│   │   ├── agents/page.tsx              # Agent registry and health status
│   │   ├── policies/page.tsx            # Policy rule manager
│   │   ├── approvals/page.tsx           # Human review queue & 1-click triage
│   │   ├── audit/page.tsx               # Filterable audit event stream & detail modal
│   │   └── test/page.tsx                # Interactive Tool Intercept Playground
│   └── components/
│       ├── navbar.tsx                   # Horizontal cyber nav with live server health pill
│       └── icons.tsx                    # Hardcoded 14px-18px inline SVG security icons
│
├── infrastructure/docker/               # Production Multi-Container Orchestration
│   ├── Dockerfile.backend               # Python 3.12 slim backend container
│   ├── Dockerfile.frontend              # Multi-stage Node 20 Alpine frontend container
│   ├── docker-compose.yml               # Unified bridge network & volume deployment
│   └── README.md                        # Container startup & operations guide
│
├── examples/                            # Real-World Demonstrations
│   ├── email_agent/demo.py              # Customer service agent reference demonstration
│   └── test_phase7_integrations.py      # Standalone LangChain & MCP verification script
│
└── docs/                                # Specification & Tracking Documentation
    ├── PRODUCT_SPEC.md
    ├── ARCHITECTURE.md
    ├── THREAT_MODEL.md                  # Comprehensive 15-vector threat matrix
    ├── DEVELOPMENT_ROADMAP.md           # Phases 0-8 tracking
    ├── TASK_TRACKER.md                  # Tasks T00-T20 completed
    └── DEVELOPMENT_SUMMARY.md           # This document
```

---

## 3. The 9-Step Deterministic Policy Pipeline

Every tool call dispatched through `SecureAgent.execute_tool(...)`, LangChain `SecureTool.run()`, or MCP `tools/call` traverses the following non-negotiable sequence:

```
[Tool Call Invocations]
         │
         ▼
 1. Tool Registration Check      ──(Unregistered)──> [DENY: Tool not registered]
         │
         ▼
 2. Policy Binding Verification   ──(No Policy)────> [DENY: Fail-closed default]
         │
         ▼
 3. Explicit Deny Rules          ──(Matches Rule)──> [DENY: Explicitly blocked]
         │
         ▼
 4. Explicit Allow Rules         ──(Matches Rule)──> [ALLOW: Pre-approved action]
         │
         ▼
 5. Human Approval Requirement   ──(Sensitive)────> [REQUIRE_APPROVAL: Issue HMAC token]
         │
         ▼
 6. Sensitivity Ceiling Check    ──(Exceeded)─────> [REQUIRE_APPROVAL or DENY]
         │
         ▼
 7. Risk Engine Scoring          ──(Risk > 0.8)───> [REQUIRE_APPROVAL / DENY]
         │
         ▼
 8. Recipient Domain Validation  ──(Untrusted)────> [DENY: Unauthorized domain glob]
         │
         ▼
 9. Resource Glob Matching       ──(Path Escape)──> [DENY: Directory traversal blocked]
         │
         ▼
[Final Decision: ALLOW or DENY or REQUIRE_APPROVAL]
```

---

## 4. Threat Model Penetration Test Results (Phase 8)

The penetration suite (`sdk/python/tests/test_threat_model_pentest.py`) tests the system against the 15 attack vectors identified in `THREAT_MODEL.md`:

| Threat ID | Attack Vector Tested | Test Name | Attack Payload / Behavior | Outcome |
| :---: | :--- | :--- | :--- | :---: |
| **T-01** | Prompt Injection / Hijack | `test_t01_prompt_injection_bypass` | `DROP TABLE users;--` in arguments | ✅ **BLOCKED** |
| **T-02** | Shadow Tool Execution | `test_t02_unregistered_tool_execution` | Invoking undeclared `os_system` tool | ✅ **BLOCKED** |
| **T-03** | Path Traversal / Escape | `test_t03_path_traversal` | `../../etc/shadow` in read path | ✅ **BLOCKED** |
| **T-04** | Email / Webhook Exfiltration | `test_t04_recipient_exfiltration` | Sending email to attacker domain | ✅ **BLOCKED** |
| **T-05** | Unauthorized Financial Action | `test_t05_unauthorized_payment` | \$50,000 wire transfer without token | ✅ **BLOCKED** |
| **T-06** | Approval Token Replay | `test_t06_approval_replay_attack` | Reusing same approval token twice | ✅ **BLOCKED** |
| **T-07** | High-Frequency Rate Exhaustion | `test_t07_rate_limit_exhaustion` | Burst of requests beyond limit | ✅ **BLOCKED** |
| **T-08** | Sensitive Data Leakage in Logs | `test_t08_sensitive_data_in_audit` | API keys logged directly | ✅ **REDACTED** |
| **T-09** | Malformed Parameter Injection | `test_t09_malformed_arguments` | Passing invalid types against schema | ✅ **BLOCKED** |
| **T-10** | Privilege Escalation via Glob | `test_t10_wildcard_scope_escalation` | Accessing `/etc/secret.key` outside glob | ✅ **BLOCKED** |
| **T-11** | Internal State Tampering | `test_t11_gateway_tampering` | Direct execution bypassing gateway | ✅ **PREVENTED**|
| **T-12** | Nonce Substitution Attack | `test_t12_nonce_substitution` | Forging token with mismatched action hash | ✅ **BLOCKED** |
| **T-13** | Expired Approval Token Use | `test_t13_expired_approval_token` | Using token after TTL expiry | ✅ **BLOCKED** |
| **T-14** | Fail-Closed on Handler Crash | `test_t14_fail_closed_on_error` | Tool raising unexpected exception | ✅ **FAIL-CLOSED**|
| **T-15** | MCP Protocol Injection | `test_t15_mcp_unauthorized_method` | Attempting forbidden JSON-RPC method | ✅ **BLOCKED** |

**Penetration Test Verdict**: **15 / 15 Attacks Defeated (100% Pass Rate)**.

---

## 5. Verification & Test Metrics

### Test Execution Summary
- **Total Test Suites**: 12 test files across SDK, API, Integrations, and Penetration tests.
- **Total Tests**: **88 passing tests** (0 failed, 0 skipped, 0 warnings).
- **Execution Speed**: **1.84 seconds** on Python 3.14.
- **Frontend TypeScript Verification**: `tsc --noEmit` returns **0 errors**.

```bash
# Command to execute all 88 tests
pytest sdk/python/tests backend/tests -q
# Output: 88 passed in 1.84s
```

---

## 6. How to Run IntentLock for Viva / Demonstration

### Step 1: Run the Interactive Python Reference Demo
```powershell
& "C:\Users\divyb\AppData\Local\Programs\Python\Python314\python.exe" examples\email_agent\demo.py
```
*Demonstrates*: Normal tool execution (`ALLOW`), blocked directory traversal (`DENY`), and financial transaction escalating to single-use cryptographic human approval (`REQUIRE_APPROVAL`).

### Step 2: Run the LangChain & MCP Ecosystem Integration Demo
```powershell
& "C:\Users\divyb\AppData\Local\Programs\Python\Python314\python.exe" examples\test_phase7_integrations.py
```
*Demonstrates*: LangChain `SecureTool` intercepting tool execution and Model Context Protocol (MCP) JSON-RPC proxy guarding client tool calls.

### Step 3: Run the Security Dashboard and Backend
**Terminal A (Backend API)**:
```powershell
cd backend
& "C:\Users\divyb\AppData\Local\Programs\Python\Python314\python.exe" -m uvicorn app.main:app --port 8000 --reload
```
Open Swagger Docs: `http://localhost:8000/docs`

**Terminal B (Frontend Dashboard)**:
```powershell
cd frontend
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run dev
```
Open Dashboard: `http://localhost:3000`

### Step 4: Run via Docker Compose (Single Command)
```powershell
docker compose -f infrastructure/docker/docker-compose.yml up --build
```
Both the Backend (`:8000`) and the Next.js Cyber Dashboard (`:3000`) will boot with health checks and persistent volume storage.

---

## 7. Viva / Examination Defense Q&A Guide

### Q1: Why not simply instruct the LLM in its system prompt to be secure?
> **Answer**: System instructions exist within the same semantic token space as user inputs. Attackers exploit this via indirect prompt injection, jailbreaks, and linguistic obfuscation. Software security cannot rely on probabilistic NLP predictions; IntentLock enforces security **out-of-band in code**, treating all LLM outputs as untrusted data.

### Q2: How does IntentLock prevent replay attacks with approval tokens?
> **Answer**: Approval tokens are HMAC-SHA256 digests cryptographically bound to the canonical action hash, a unique nonce, and a strict timestamp expiration. Once an approval token is submitted to execute an action, the token is permanently invalidated in memory and database, rendering replay attempts impossible.

### Q3: What is "Fail-Closed" and how is it implemented?
> **Answer**: If an unknown tool is invoked, if a parameter fails schema validation, if a database timeout occurs, or if an unexpected exception arises, IntentLock defaults to `DENY`. Tools only execute when an explicit, verified `ALLOW` verdict is calculated.

### Q4: How is this integrated with modern AI agent frameworks?
> **Answer**: IntentLock provides native drop-in wrappers:
> 1. For **LangChain / LangGraph**: `SecureTool` and the `@secure_langchain_tool` decorator wrap existing tools with zero code refactoring.
> 2. For **Anthropic Model Context Protocol (MCP)**: `MCPSecurityProxy` intercepts standard JSON-RPC 2.0 `tools/call` and `tools/list` messages before reaching backend tools.

---

## 8. Final Status Checklist

| Deliverable | Phase | Target State | Actual State | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Foundational Monorepo & Specs** | Phase 0 | Clean architecture, Project A untouched | Scaffolding complete | ✅ Verified |
| **Pydantic v2 Core Engine** | Phase 1 | Typed models, structured exceptions, logger | 9 models, redacting logger | ✅ Verified |
| **Tool Registry & Policy Engine** | Phase 2 | 9-step evaluation, glob matching | Deterministic pipeline | ✅ Verified |
| **Runtime Interceptor (Gateway)** | Phase 3 | Execution boundary, replay detection | Fail-closed execution guard | ✅ Verified |
| **Risk, Approvals & Audit System** | Phase 4 | HMAC tokens, queryable audit trail | Cryptographic approvals | ✅ Verified |
| **FastAPI REST Backend** | Phase 5 | SQLite persistence, OpenAPI endpoints | 5 router modules | ✅ Verified |
| **Developer Security Dashboard** | Phase 6 | Next.js 16 dark cyber UI, 0 type errors | 6 functional views, sized SVGs | ✅ Verified |
| **Ecosystem Integrations** | Phase 7 | LangChain & MCP support | Tested wrappers | ✅ Verified |
| **Security Pentest Suite** | Phase 8 | 15/15 threat model verification | 15 automated attacks blocked | ✅ Verified |
| **Production Distribution Package** | Phase 8 | Python wheel & sdist in `dist/` | `.whl` & `.tar.gz` built & verified | ✅ Verified |
| **Docker Compose Orchestration** | Phase 8 | Multi-stage container deployment | Dockerfile & compose verified | ✅ Verified |

**Project Status**: **100% COMPLETE & PRODUCTION READY.**
