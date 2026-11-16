# INTENTLOCK — Developer Portal Audit & Technical Blueprint (Phase 0)

**Date:** 2026-11-16  
**Auditor:** Senior Developer Experience Engineer, Security Architect & Senior Next.js Engineer  
**Status:** PHASE 0 COMPLETE — AWAITING REVIEW & PHASE 1 APPROVAL  

---

## 1. Executive Summary

INTENTLOCK is a deterministic, zero-trust security middleware and Python SDK designed to intercept AI agent tool invocations at the execution boundary.

Currently, the live frontend (`https://intentlock-wheat.vercel.app/`) serves as a Security Operations Center (SOC) dashboard. The only external developer documentation provided is a raw external link in the top navigation bar pointing to the FastAPI Swagger UI (`https://intentlock-backend-ze2i.onrender.com/docs`).

This audit establishes the baseline technical foundation, inventories all verified SDK methods and REST API endpoints from source code, identifies architectural and documentation gaps, and outlines a comprehensive, non-breaking roadmap to build the **INTENTLOCK Developer Portal** directly under `/developers`.

---

## 1.1 Phase 0 Verification & Defect Classification

### A. Frontend Build Error
- **Exact Error:** `Error: EPERM: operation not permitted, rmdir '...\INTENTLOCK_SDK\frontend\.next\build\chunks'` (code: `EPERM`, errno: `-4048`).
- **Classification:** **Environment Issue (Operating System File Lock).**
- **Cause:** On Windows, the workspace directory resides inside a Microsoft OneDrive synchronized location (`OneDrive\Desktop\TYIT FInal Year Project`). The background OneDrive sync process or Windows file indexer locks files inside `.next\build\chunks`, preventing Next.js from deleting the previous build chunk directory during cleanup.
- **TypeScript Verification:** Running `tsc --project INTENTLOCK_SDK/frontend/tsconfig.json --noEmit` completes cleanly with **exit code 0 and zero type errors**, confirming the frontend codebase is type-sound.

### B. Frontend Lint Status
- **Exact Output:** 47 problems (13 errors, 34 warnings).
- **Classification:** **Existing Codebase Defect (React 19 / ESLint 9 Strictness).**
- **Cause:** Pre-existing pages (`src/app/agents/page.tsx`, `src/app/approvals/page.tsx`, `src/app/audit/page.tsx`, `src/app/threats/page.tsx`, `src/lib/auth.tsx`) call React state-setters synchronously within `useEffect` bodies (violating rule `react-hooks/set-state-in-effect`).
- **Policy:** In accordance with non-negotiable rules, these pre-existing SOC dashboard files must not be modified or refactored during the Developer Portal implementation. All new Developer Portal components will be authored to pass strict linting cleanly without warnings or errors.

### C. SDK Distribution & Installation Verification
- **PyPI Status:** `intentlock-sdk` is not currently published on public PyPI.
- **Authoritative Installation Source:** The SDK must be installed directly from the repository source or pre-built local wheel:
  ```bash
  # Option 1: Install from GitHub repository
  pip install git+https://github.com/DivyBhanushali/Intentlock.git#subdirectory=INTENTLOCK_SDK/sdk/python

  # Option 2: Editable local install from cloned repo
  pip install -e INTENTLOCK_SDK/sdk/python

  # Option 3: Install from built wheel distribution
  pip install INTENTLOCK_SDK/sdk/python/dist/intentlock_sdk-0.1.0-py3-none-any.whl
  ```
- **Documentation Obligation:** Never instruct developers to run `pip install intentlock-sdk` from PyPI until public distribution is published. Document the repository and local wheel install paths accurately.

### D. SDK Versioning vs. Dashboard Branding
- **SDK Library Version:** Strictly `0.1.0` (as declared in `pyproject.toml` and `intentlock.__version__`).
- **Dashboard Branding:** `v2.0` (denoting the INTENTLOCK 2.0 Enterprise Multi-Tenancy & Intent Governance architecture).
- **Documentation Obligation:** Distinctly separate the Python package release version (`v0.1.0`) from the overall platform architecture branding (`INTENTLOCK 2.0`).

### E. Verified Security Guarantees (Backed by Automated Test Suite)
Guarantees verified through 92 passing SDK penetration tests (`test_threat_model_pentest.py`) and 45 passing backend tests:
1. **Pre-Execution Boundary:** In-process `ActionGateway` intercepts before tool handler execution; denied tools never execute.
2. **Prompt Injection Boundary:** Injection within arguments cannot bypass explicit permission allow/deny lists (Test `T01`).
3. **Privilege Escalation:** Unregistered tools or missing permissions are denied by default fail-closed (Test `T02`).
4. **Data Exfiltration:** Target recipients and resource paths are matched deterministically against glob allowlists (Tests `T03`, `T04`).
5. **Approval Security:** Nonce hashes prevent token reuse and parameter tampering (Tests `T05`, `T06`).
6. **Audit Immutability:** SHA-256 chained audit events can be cryptographically verified (`/api/v1/audit/verify`).
7. **Explicit Limitation:** INTENTLOCK does **not** claim to sanitize natural language LLM prompts or prevent internal LLM reasoning bugs; it strictly enforces authorization policies at the executable tool boundary.

---

## 2. Existing Repository Architecture

```
INTENTLOCK_SDK/
├── backend/                  # FastAPI REST API Backend
│   ├── app/
│   │   ├── api/              # API Dependencies, Routers, and Endpoint Handlers
│   │   │   ├── deps.py       # Multi-tenant and RBAC authentication dependencies
│   │   │   └── v1/           # API v1 routers (10 active routers)
│   │   ├── core/             # Security, audit chaining, threat engine, config
│   │   ├── db/               # SQLAlchemy models, session, versioned migrations
│   │   ├── schemas/          # Pydantic request and response schemas
│   │   └── main.py           # Application entry-point, CORS, security headers
│   └── tests/                # Automated backend test suite (52 tests)
├── frontend/                 # Next.js 16.4.5 (App Router, React 19, Tailwind v4)
│   ├── src/
│   │   ├── app/              # Next.js route handlers and SOC dashboard pages
│   │   ├── components/       # UI components (Navbar, Sidebar, Icons, Badges)
│   │   └── lib/              # Client API wrapper, Auth context, utilities
│   └── package.json          # Next.js, React 19, Tailwind v4
└── sdk/python/               # Official INTENTLOCK Python SDK
    ├── src/intentlock/       # Core SDK implementation
    │   ├── agent.py          # SecureAgent developer-facing wrapper
    │   ├── client.py         # IntentLockClient remote HTTP client
    │   ├── gateway.py        # ActionGateway execution boundary
    │   ├── policy_engine.py  # Pure deterministic policy evaluator
    │   ├── risk_engine.py    # Risk assessment engine
    │   ├── approval.py       # Human-in-the-loop approval service
    │   ├── audit.py          # Audit event logger
    │   ├── registry.py       # Tool registry
    │   ├── models.py         # Pydantic v2 core schemas and enums
    │   ├── exceptions.py     # Hierarchical SDK exception classes
    │   └── integrations/     # LangChain, LangGraph, and MCP integrations
    └── tests/                # Automated SDK test suite (92 tests)
```

---

## 3. Verified Python SDK Specification

The SDK source in `INTENTLOCK_SDK/sdk/python/` provides two distinct usage modes:
1. **In-Process SDK (`SecureAgent`)**: Runs locally inside the agent runtime, executing tool calls through an in-memory `ActionGateway` and local policy engine.
2. **Remote Gateway Client (`IntentLockClient`)**: Connects over HTTP to the centralized INTENTLOCK backend service.

### Package Metadata
- **Package Distribution Name:** `intentlock-sdk` (build config in `pyproject.toml`)
- **Current Version:** `0.1.0`
- **Supported Python Versions:** `>= 3.12`
- **Core Runtime Dependencies:** `pydantic>=2.0` (zero heavyweight network or framework dependencies)

### Exported Symbols (`intentlock/__init__.py`)
- `SecureAgent`
- `IntentLockClient`
- `Config`
- `Policy`
- `ToolCall`
- `Decision`
- `DecisionVerdict` (`ALLOW`, `DENY`, `REQUIRE_APPROVAL`)
- `RiskLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`)
- `ApprovalStatus` (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`)
- `AuditEvent`
- `ApprovalRequest`
- `IntentContext`
- `RegisteredTool`
- `SecureTool`
- `secure_langchain_tool`
- `MCPSecurityProxy`

### Verified Class: `SecureAgent`
```python
class SecureAgent:
    def __init__(
        self,
        agent_id: str = "default-agent",
        permissions: list[str] | None = None,
        config: Config | None = None,
    ) -> None: ...

    def register_tool(
        self,
        name: str,
        handler: Callable[..., Any],
        permission: str,
        description: str = "",
        sensitivity: int = 0,
        schema: dict[str, Any] | None = None,
    ) -> None: ...

    def execute(
        self,
        tool_call: ToolCall | None = None,
        *,
        tool_name: str = "",
        arguments: dict[str, Any] | None = None,
        user_request: str = "",
    ) -> Any: ...

    def execute_with_approval(
        self,
        tool_call: ToolCall | None = None,
        approval_id: str = "",
        *,
        tool_name: str = "",
        arguments: dict[str, Any] | None = None,
    ) -> Any: ...

    def get_pending_approvals(self) -> list[ApprovalRequest]: ...
    def approve(self, approval_id: str, approver_id: str = "human") -> ApprovalRequest: ...
    def reject(self, approval_id: str, approver_id: str = "human") -> ApprovalRequest: ...
    def get_audit_log(self, limit: int = 100) -> list[AuditEvent]: ...

    # Properties
    @property
    def gateway(self) -> ActionGateway: ...
    @property
    def policy(self) -> Policy: ...
    @property
    def tools(self) -> list[RegisteredTool]: ...
    @property
    def agent_id(self) -> str: ...
```

### Verified Class: `IntentLockClient`
```python
class IntentLockClient:
    def __init__(
        self,
        api_key: str = "",
        base_url: str = "https://intentlock-backend-ze2i.onrender.com",
        agent_id: str = "default-agent",
        timeout: float = 15.0,
    ) -> None: ...

    def authorize_intent(
        self,
        objective: str,
        allowed_actions: list[str] | None = None,
        denied_actions: list[str] | None = None,
        allowed_permissions: list[str] | None = None,
        allowed_resources: list[str] | None = None,
        allowed_recipients: list[str] | None = None,
        sensitivity_ceiling: int = 5,
        execution_scope: str = "default",
        ttl_seconds: int = 3600,
        agent_id: str | None = None,
    ) -> IntentContext: ...

    def revoke_intent(self, intent_id: str, reason: str = "Task completed") -> bool: ...

    def intercept(
        self,
        tool_name: str,
        arguments: dict[str, Any] | None = None,
        agent_id: str | None = None,
        user_request: str = "",
        sensitivity: int = 0,
        resource_id: str = "",
        recipient: str = "",
        intent_id: str | None = None,
        approval_id: str | None = None,
        trace_id: str | None = None,
    ) -> Decision: ...
```

### Verified Integrations
1. **LangChain:** `SecureTool` wrapper and `secure_langchain_tool(tool, agent, ...)` decorator.
2. **LangGraph:** `SecureGraphNode` state-graph node wrapper and `secure_langgraph_node(...)` decorator.
3. **MCP (Model Context Protocol):** `MCPSecurityProxy` implementing JSON-RPC interceptor.

---

## 4. Verified Backend Endpoint Inventory

All endpoints are mounted under `settings.API_V1_STR` (`/api/v1`) in `backend/app/api/v1/router.py`.

| Method | Path | Router | Auth Requirement | Description |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/register` | `auth.py` | Public | Register initial organization admin user |
| `POST` | `/api/v1/auth/login` | `auth.py` | Public | Obtain JWT Bearer access token |
| `GET` | `/api/v1/auth/me` | `auth.py` | Bearer Token / API Key | Inspect current authenticated principal & organization |
| `GET` | `/api/v1/auth/keys` | `auth.py` | Bearer Token | List active M2M agent API keys |
| `POST` | `/api/v1/auth/keys` | `auth.py` | Admin Only | Provision new `ilk_live_...` API key |
| `DELETE` | `/api/v1/auth/keys/{key_id}` | `auth.py` | Admin Only | Revoke M2M API key |
| `GET` | `/api/v1/auth/members` | `auth.py` | Bearer Token | List organization team members |
| `POST` | `/api/v1/auth/members` | `auth.py` | Admin Only | Invite new team member with role |
| `PATCH` | `/api/v1/auth/members/{member_id}` | `auth.py` | Admin Only | Update member role or profile |
| `DELETE` | `/api/v1/auth/members/{member_id}` | `auth.py` | Admin Only | Remove team member |
| `POST` | `/api/v1/intercept` | `intercept.py` | API Key / Bearer Token | 8-Stage authoritative tool-call interception gateway |
| `GET` | `/api/v1/intents` | `intents.py` | Bearer Token | List task-scoped Intent Contexts |
| `POST` | `/api/v1/intents` | `intents.py` | Approver or Admin | Issue immutable task-scoped Intent Context |
| `GET` | `/api/v1/intents/{intent_id}` | `intents.py` | Bearer Token | Retrieve single intent context |
| `POST` | `/api/v1/intents/{intent_id}/revoke` | `intents.py` | Approver or Admin | Revoke active intent context |
| `GET` | `/api/v1/policies` | `policies.py` | Bearer Token / API Key | List declarative security policies |
| `POST` | `/api/v1/policies` | `policies.py` | Approver or Admin | Create new declarative policy |
| `GET` | `/api/v1/policies/{policy_id}` | `policies.py` | Bearer Token / API Key | Get policy details |
| `PUT` | `/api/v1/policies/{policy_id}` | `policies.py` | Approver or Admin | Update policy & record version |
| `DELETE` | `/api/v1/policies/{policy_id}` | `policies.py` | Admin Only | Delete policy |
| `GET` | `/api/v1/policies/{policy_id}/versions` | `policies.py` | Bearer Token | View policy historical versions |
| `POST` | `/api/v1/policies/{policy_id}/rollback` | `policies.py` | Admin Only | Roll back policy to earlier version |
| `GET` | `/api/v1/approvals` | `approvals.py` | Bearer Token | List pending and historical approvals |
| `POST` | `/api/v1/approvals` | `approvals.py` | Bearer Token / API Key | Create approval request |
| `GET` | `/api/v1/approvals/{approval_id}` | `approvals.py` | Bearer Token | Get approval request status |
| `POST` | `/api/v1/approvals/{approval_id}/approve` | `approvals.py` | Approver or Admin | Approve pending tool call |
| `POST` | `/api/v1/approvals/{approval_id}/reject` | `approvals.py` | Approver or Admin | Reject pending tool call |
| `GET` | `/api/v1/audit` | `audit.py` | Bearer Token | Retrieve SHA-256 chained audit events |
| `GET` | `/api/v1/audit/verify` | `audit.py` | Bearer Token | Cryptographically verify audit chain |
| `GET` | `/api/v1/audit/{event_id}` | `audit.py` | Bearer Token | Inspect single audit record |
| `GET` | `/api/v1/agents` | `agents.py` | Bearer Token | List registered agents |
| `POST` | `/api/v1/agents` | `agents.py` | Approver or Admin | Register new agent identity |
| `GET` | `/api/v1/agents/{agent_id}` | `agents.py` | Bearer Token | Inspect agent identity |
| `DELETE` | `/api/v1/agents/{agent_id}` | `agents.py` | Admin Only | Deregister agent identity |
| `GET` | `/api/v1/threats` | `threats.py` | Bearer Token | List heuristic security threat detections |
| `GET` | `/api/v1/threats/stats` | `threats.py` | Bearer Token | Retrieve threat intelligence metrics |
| `GET` | `/api/v1/provenance` | `provenance.py` | Bearer Token | List provenance execution traces |
| `GET` | `/api/v1/provenance/{trace_id}` | `provenance.py` | Bearer Token | Causal graph trace reconstruction |
| `GET` | `/api/v1/benchmarks` | `benchmarks.py` | Bearer Token | List penetration test benchmark runs |
| `POST` | `/api/v1/benchmarks/run` | `benchmarks.py` | Approver or Admin | Trigger automated 25-vector adversarial test |
| `GET` | `/health` | `main.py` | Public | System and database health status |
| `GET` | `/` | `main.py` | Public | Service index and doc pointers |

---

## 5. Authentication & Tenant Isolation Model

1. **User Authentication (Dashboard & Management):**
   - Protocol: JWT Bearer Token (`Authorization: Bearer <jwt>`).
   - Algorithm: HS256 signed with `SECRET_KEY`.
   - Payload: Subject (`sub`: user ID), Organization (`org_id`), Role (`role`: `ADMIN`, `APPROVER`, or `VIEWER`).
2. **Machine-to-Machine (M2M) Agent Authentication:**
   - Format: `ilk_live_<hex_32>` (generated via `secrets.token_hex(24)`).
   - Transmission: Supported either as `X-API-Key: ilk_live_...` or `Authorization: Bearer ilk_live_...`.
   - Security: The database stores only the SHA-256 hash (`key_hash`). The raw key is never stored and is displayed only once at creation time.
3. **Multi-Tenant Isolation:**
   - Every request is resolved by `get_current_tenant` dependency in `backend/app/api/deps.py`.
   - All database queries filter strictly on `org_id == tenant.org_id`.
   - Cross-tenant data retrieval or execution is completely prohibited.

---

## 6. Current Implementation Gaps & Risks

### A. Documentation Gaps
1. **No Embedded Developer Documentation:** The existing application has no `/developers` or `/docs` frontend routes. Developers are directed off-site to raw Swagger UI.
2. **No Interactive SDK Guides:** Developers cannot see how to instantiate `SecureAgent` or `IntentLockClient`, protect a tool, handle `REQUIRE_APPROVAL`, or verify audit records.
3. **No Language Tabs or Copyable cURL:** No pre-formatted, validated cURL or Python snippets exist on the frontend.
4. **Scattered Terminology:** The SOC dashboard refers to "Tools" dropdown for secondary diagnostics (`/test`, `/benchmark`, `/provenance`), while "API Docs" sits as a bare external link.

### B. Features Implemented vs. Features Not Implemented
| Feature | Status | Documentation Guidance |
|---|---|---|
| Python SDK (`intentlock-sdk`) | **Fully Implemented** | Document thoroughly with verified examples |
| LangChain & LangGraph Integrations | **Fully Implemented** | Document in Ecosystem Integrations guide |
| Model Context Protocol (MCP) Proxy | **Fully Implemented** | Document in MCP Proxy guide |
| 8-Stage Interception Gateway | **Fully Implemented** | Document in Architecture & Enforcement guide |
| SHA-256 Audit Chain Verification | **Fully Implemented** | Document in Security & Audit guide |
| Policy Version Rollback | **Fully Implemented** | Document in Policy Management guide |
| TypeScript / Node.js SDK | **Not Implemented** | **Omit completely** (do not invent npm packages) |
| Asynchronous Python SDK (`async execute`) | **Not Implemented** | Document strictly as synchronous |
| WebSocket Real-time Interception | **Not Implemented** | Document strictly as REST JSON |
| Dynamic Policy DSL Engine | **Not Implemented** | Document declarative JSON/Pydantic schemas |

### C. Security Concerns & Boundary Rules
1. **Never Display Real Keys:** All documentation must use placeholder credentials (`ilk_live_your_api_key_here`, `YOUR_ACCESS_TOKEN`).
2. **No Cross-Tenant Leaks:** Documentation search, playground simulations, and API references must not leak internal tenant or database identifiers.
3. **Preserve SOC Dashboard:** The Developer Portal must live as a clean, cohesive sub-tree (`/developers/...`) without displacing or altering existing SOC operational pages (`/`, `/intents`, `/policies`, `/audit`, `/threats`, `/approvals`).

---

## 7. Recommended Developer Portal Architecture

### Route Hierarchy
```
/developers                               # Developer Portal Landing Page
├── /developers/quickstart                # 5-minute zero-to-one guide
├── /developers/installation              # SDK installation, Python requirements, verification
├── /developers/concepts                  # Core concepts (Execution boundary, Zero-trust, etc.)
├── /developers/architecture              # 8-Stage interception pipeline & threat model
├── /developers/sdk                       # Python SDK Overview
│   ├── /developers/sdk/initialization    # SecureAgent & IntentLockClient setup
│   ├── /developers/sdk/tool-protection   # register_tool, execute, LangChain/LangGraph/MCP
│   ├── /developers/sdk/decisions         # Decision verdicts, risk levels, and handling
│   └── /developers/sdk/errors            # Error hierarchy and fail-closed handling
├── /developers/api                       # REST API Overview
│   ├── /developers/api/authentication    # API Key & JWT token workflow
│   └── /developers/api/reference         # Complete interactive REST endpoint reference
├── /developers/security                  # Security architecture, audit chains, least privilege
├── /developers/deployment                # Production deployment, Docker, Render, Supabase
├── /developers/troubleshooting           # Common errors, connection issues, FAQ
├── /developers/examples                  # Real-world agent protection code examples
└── /developers/changelog                 # Semantic release history (v0.1.0, v2.0)
```

### Shared Reusable Component System
Located in `INTENTLOCK_SDK/frontend/src/components/developers/`:
- `DeveloperLayout.tsx`: Common shell with responsive documentation sidebar, breadcrumbs, and search.
- `DeveloperSidebar.tsx`: Hierarchical navigation with active-route highlighting, badges, and collapse state.
- `CodeBlock.tsx`: Syntax-highlighted code container with line numbers and one-click copy button.
- `CodeTabs.tsx`: Multi-tab code switcher (e.g. Python SDK vs. cURL vs. LangChain).
- `EndpointCard.tsx`: Standardized API endpoint visualizer (HTTP badge, path, auth badge, collapsible schemas).
- `Callout.tsx`: Alerts (`info`, `warning`, `tip`, `danger`) styled in INTENTLOCK cyber theme.
- `Breadcrumbs.tsx`: Contextual location hierarchy.
- `TableOfContents.tsx`: In-page heading navigation (H2/H3 anchors).
- `PreviousNextNavigation.tsx`: Pagination to guide sequential reading.
- `DocumentationSearch.tsx`: Fast client-side keyword search over all documentation pages.

---

## 8. Planned File Modifications & New Files

### Files to be Modified (Minimal & Surgical)
1. `INTENTLOCK_SDK/frontend/src/components/navbar.tsx`:
   - Replace the external `/docs` link with an internal Next.js link to `/developers`.
   - Add a "Docs" or "Developers" tab in the main navigation.
   - Preserve all existing SOC routes, tenant tags, auth states, and tools dropdown.

### New Files to be Created (Pure Additions Under `/developers`)
1. Reusable Components:
   - `frontend/src/components/developers/DeveloperLayout.tsx`
   - `frontend/src/components/developers/DeveloperSidebar.tsx`
   - `frontend/src/components/developers/CodeBlock.tsx`
   - `frontend/src/components/developers/CodeTabs.tsx`
   - `frontend/src/components/developers/EndpointCard.tsx`
   - `frontend/src/components/developers/Callout.tsx`
   - `frontend/src/components/developers/TableOfContents.tsx`
   - `frontend/src/components/developers/Breadcrumbs.tsx`
   - `frontend/src/components/developers/PreviousNextNavigation.tsx`
   - `frontend/src/components/developers/DocumentationSearch.tsx`
2. Documentation Pages:
   - `frontend/src/app/developers/page.tsx`
   - `frontend/src/app/developers/quickstart/page.tsx`
   - `frontend/src/app/developers/installation/page.tsx`
   - `frontend/src/app/developers/concepts/page.tsx`
   - `frontend/src/app/developers/architecture/page.tsx`
   - `frontend/src/app/developers/sdk/page.tsx`
   - `frontend/src/app/developers/sdk/initialization/page.tsx`
   - `frontend/src/app/developers/sdk/tool-protection/page.tsx`
   - `frontend/src/app/developers/sdk/decisions/page.tsx`
   - `frontend/src/app/developers/sdk/errors/page.tsx`
   - `frontend/src/app/developers/api/page.tsx`
   - `frontend/src/app/developers/api/authentication/page.tsx`
   - `frontend/src/app/developers/api/reference/page.tsx`
   - `frontend/src/app/developers/security/page.tsx`
   - `frontend/src/app/developers/deployment/page.tsx`
   - `frontend/src/app/developers/troubleshooting/page.tsx`
   - `frontend/src/app/developers/examples/page.tsx`
   - `frontend/src/app/developers/changelog/page.tsx`

---

## 9. Recommended Implementation Roadmap

- **Phase 0 (Complete):** Repository and API audit, verified inventories, blueprint documentation.
- **Phase 1:** Core Developer Portal design system & reusable documentation components.
- **Phase 2:** Developer Portal landing page (`/developers`) and standardized top-level navigation.
- **Phase 3:** Getting Started (`quickstart`, `installation`) and Python SDK deep-dive documentation.
- **Phase 4:** REST API Reference (`/developers/api/reference`) and Authentication guide.
- **Phase 5:** Interactive Security Playground integration and ecosystem examples (LangChain, LangGraph, MCP).
- **Phase 6:** Security Architecture, Production Deployment, Error Reference, and Changelog.
- **Phase 7:** Documentation Search, mobile responsiveness, and accessibility tuning.
- **Phase 8:** Full build, test suite execution, verification, and final delivery report.
