# PRODUCT SPECIFICATION — INTENTLOCK (Project B)

## 1. Executive Summary

- **Product Name**: INTENTLOCK
- **Category**: AI Agent Security Middleware & Python Developer SDK
- **Target Audience**: AI application developers, AI agent builders, platform teams, cybersecurity architects, and enterprise engineering teams deploying agents connected to internal tools and APIs.
- **Core Principle**: AI agents must only execute actions explicitly authorized by user-configured policies and permissions. Real enforcement occurs at the tool execution boundary.

---

## 2. Problem Statement

Autonomous AI agents (e.g., using ReAct patterns, LangGraph, AutoGen, CrewAI) interact with the real world by invoking tools (e.g., executing code, querying SQL databases, sending emails, reading cloud files, modifying SaaS records).

Current AI security solutions rely primarily on:
1. **Prompt Engineering / Safety Prompts**: Easily bypassed by prompt injection, indirect prompt injection, and adversarial token sequences.
2. **LLM Output Classifiers / Guardrails**: High latency, nondeterministic, prone to false negatives, and often bypassable by obfuscation.
3. **Coarse-Grained API Tokens**: Either allow all actions or nothing; unable to enforce task-specific, user-specific, or argument-specific policies.

When an AI agent is hijacked or makes an ungrounded hallucination, it can trigger catastrophic unintended actions (data exfiltration, unauthorized deletions, financial transactions).

---

## 3. Product Vision & Positioning

INTENTLOCK provides an **authoritative runtime security middleware**. 

It does not attempt to train models or rely on LLM honesty. Instead, INTENTLOCK treats all agent proposed actions as **untrusted requests** and evaluates them deterministically against an explicit policy before executing registered handlers.

```
+----------------+      Proposed Tool Call        +-------------------------------+      Allowed Call      +-------------------+
|  AI Agent      | -----------------------------> |  INTENTLOCK Runtime Gateway   | ---------------------> | Actual Tool / API |
| (LLM / Logic)  | <----------------------------- | (Policy / Authz / Approval)   | <--------------------- |  (Email, DB, FS)  |
+----------------+       Execution Result         +-------------------------------+      Tool Output       +-------------------+
                                                                  |
                                                                  v
                                                        [ Audit Trail & Logs ]
```

---

## 4. Key Tenets & Architectural Philosophy

1. **Deterministic Over Heuristic**: Permission grants and denials are evaluated using rigid, deterministic rule evaluation. Natural language understanding or semantic similarity can inform intent context, but **never** authorizes an action.
2. **Least Privilege & Deny by Default**: An action is denied unless an explicit rule allows it.
3. **Execution Boundary Interception**: Tool handlers are not directly accessible to the agent. The SDK encapsulates tool functions behind a protected execution gateway.
4. **Human In The Loop (HITL) with Cryptographic Binding**: Sensitive actions pause execution and request human review. Approvals are cryptographically bound to the canonical hash of the exact parameters, single-use, and time-expiring.
5. **Fail-Closed Operations**: If a policy file is malformed, the database is unreachable, or a schema validation fails, the action is denied.
6. **Defense in Depth**: Integrates intent context validation, risk scoring, parameter schema validation, recipient allowlisting, and sensitivity ceilings.

---

## 5. Core Product Modules

### 5.1 Python Developer SDK (`intentlock`)
- `SecureAgent`: Main developer entry point.
- `ToolRegistry`: Encapsulates tool functions and associated schemas, permissions, and sensitivities.
- `ActionGateway`: The secure interception boundary that evaluates policies and invokes handlers.
- `Policy`: Pydantic model defining permitted actions, denied actions, approval triggers, resource globs, and risk ceilings.
- `Decision`: Detailed typed result (`ALLOW`, `DENY`, `REQUIRE_APPROVAL`).
- `Exceptions`: Typed security exceptions (`PermissionDeniedError`, `ApprovalRequiredError`, `ApprovalExpiredError`, `ApprovalReplayError`, etc.).

### 5.2 Tool Registry
- Explicit registration of callable functions.
- Associates tools with required permission scopes (e.g., `email:read`, `system:delete`).
- Optional JSON schema validation of input arguments.
- Prohibits registration of raw shell or dangerous unconstrained evaluation handlers.

### 5.3 Deterministic Policy Engine
Evaluates incoming `ToolCall` requests against the active `Policy` in a strict 9-step order:
1. Policy existence validation (fail closed if missing).
2. Tool presence validation in registry (reject unregistered tools).
3. Explicit denial check (`denied_permissions` always wins).
4. Human approval requirement check (`require_approval_permissions`).
5. Explicit grant check (`allowed_permissions`).
6. Sensitivity ceiling check (`sensitivity` $\le$ `max_sensitivity`).
7. Recipient allowlist check (`recipient` in `allowed_recipients`).
8. Resource scope matching via glob evaluation (`fnmatch`).
9. Final `ALLOW` verdict.

### 5.4 Intent Context Engine
- Captures the initial natural language prompt and task declaration.
- Compares proposed tool operations with declared task bounds.
- Intent analysis serves as an advisory input and contextual metadata in audit logs, never as an authorization bypass.

### 5.5 Runtime Tool-Call Interceptor
- Intercepts calls synchronously or asynchronously.
- Enforces replay protection: prevents re-execution of identical one-shot commands where applicable.
- Verifies that approvals presented match the pending action hash.

### 5.6 Risk Engine
- Calculates explainable, composite risk scores ($0.0 \dots 1.0$) mapped to `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`.
- Factors include tool base sensitivity, argument complexity, recipient exposure, and resource criticality.
- Evaluates risk as advisory signals and enforces `max_risk_level` thresholds.

### 5.7 Human Approval Workflow
- Generates secure approval tokens with short expiration windows (default: 300s).
- Binds approval directly to `action_hash = SHA256(canonical(tool_call))`.
- Single-use consumption: once used, approval token is invalidated.
- Modification of arguments invalidates the approval token.

### 5.8 Security Audit System
- Records comprehensive metadata for every decision:
  - Timestamp (UTC)
  - Agent ID
  - Tool Name & Canonical Action Hash
  - Verdict & Detailed Reason Code
  - Policy ID
  - Risk Score
  - Execution Success / Error Outcome
- Enforces automated redacting of sensitive credentials (passwords, tokens, API keys).

### 5.9 Developer REST API (FastAPI Backend)
- API endpoints for managing policies, querying audit history, managing pending approvals, and agent registration.
- Backed by PostgreSQL (or SQLite for lightweight local development) via SQLAlchemy and Alembic.

### 5.10 Developer Security Dashboard (Next.js)
- Dark cybersecurity aesthetic.
- Views: Active Agents, Policy Editor, Approval Triage Queue, Real-Time Audit Feed, Risk Insights.

---

## 6. MVP Scope & Acceptance Demonstration

### Scenario: The Email Assistant Agent
1. **Registered Tools**:
   - `read_email` (permission: `read_email`, sensitivity: 1)
   - `summarize_email` (permission: `summarize_email`, sensitivity: 1)
   - `delete_email` (permission: `delete_email`, sensitivity: 7)
   - `export_user_data` (permission: `export_user_data`, sensitivity: 9)
2. **Policy Configuration**:
   - `allowed_permissions`: `["read_email", "summarize_email"]`
   - `denied_permissions`: `["delete_email"]`
   - `require_approval_permissions`: `["export_user_data"]`
3. **Execution Steps**:
   - `read_email` $\rightarrow$ Executes, returns mock emails, logged as `ALLOW`.
   - `summarize_email` $\rightarrow$ Executes, returns summary, logged as `ALLOW`.
   - `delete_email` $\rightarrow$ Denied with `PermissionDeniedError`, logged as `DENY`.
   - `export_user_data` $\rightarrow$ Raises `ApprovalRequiredError` with token, logged as `REQUIRE_APPROVAL`.
   - Approver approves token $\rightarrow$ Re-executed with approval $\rightarrow$ Executes, logged as `ALLOW (APPROVED)`.

