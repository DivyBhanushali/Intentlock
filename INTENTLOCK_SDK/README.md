# INTENTLOCK — AI Agent Security Middleware & Python Developer SDK

[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Security: Deny-by-Default](https://img.shields.io/badge/Security-Deny--by--Default-red.svg)]()

> **The security enforcement layer for AI agents.**  
> Developers build intelligent agents. INTENTLOCK ensures those agents only perform actions explicitly authorized by the user's configured policies and permissions at the runtime execution boundary.

---

## 🛡️ Product Vision

AI agents are rapidly being granted access to sensitive tools, enterprise APIs, internal databases, filesystems, and communication channels. Traditional security models and LLM system prompts rely on model compliance ("safety prompts" or LLM self-policing), which are easily bypassed by prompt injections, jailbreaks, tool manipulation, or unexpected model drift.

**INTENTLOCK** provides deterministic, policy-driven security enforcement directly at the tool execution boundary. It sits between an AI agent (LangChain, LlamaIndex, OpenAI Swarm, custom agents) and the tools or external APIs it attempts to invoke.

### Core Security Principle
> **AI agents must only execute actions explicitly authorized by configured policies and permissions. An LLM's own claim that an action is safe or authorized is never trusted.**

---

## ⚡ Core Features

- **Runtime Tool-Call Interception**: Intercepts every tool call before invocation. Denies unauthorized calls before handlers execute.
- **Deterministic Policy Engine**: Pure-code evaluation of allowed/denied permissions, resource paths, recipient constraints, and sensitivity levels (no LLM in the authorization path).
- **Human-in-the-Loop Approval Workflow**: Sensitive operations require single-use, time-limited, cryptographically bound human approval before execution. Replay-resistant.
- **Intent Context Engine**: Captures user requests and permitted task scopes, comparing proposed tool calls against allowed scopes without confusing intent with permission.
- **Explainable Risk Signals**: Evaluates tool sensitivity, resource exposure, and argument impact to produce actionable risk metrics.
- **Append-Only Security Audit Trail**: Immutable logging of every evaluation, verdict, reason code, actor, and outcome without leaking secrets or credentials.
- **Developer-First Python SDK**: Intuitive API designed for easy integration with modern agent frameworks.
- **Observability & Management Dashboard**: Dark-mode cybersecurity interface for policy management, approval triage, and audit inspection.

---

## 🚀 Quick Developer Experience (Target SDK API)

```python
from intentlock import SecureAgent

# Initialize secure agent with explicit permissions
agent = SecureAgent(
    agent_id="support-agent-01",
    permissions=["read_email", "summarize_email"]
)

# Register tools with explicit permission requirements
agent.register_tool(
    name="read_email",
    handler=read_email_fn,
    permission="read_email",
    description="Fetch emails from inbox"
)

agent.register_tool(
    name="delete_email",
    handler=delete_email_fn,
    permission="delete_email",
    description="Permanently delete an email"
)

# 1. Allowed action executes safely
result = agent.execute(
    user_request="Read my latest support email",
    tool_name="read_email",
    arguments={"folder": "inbox", "limit": 1}
)
print(result)

# 2. Unauthorized action is blocked deterministically before execution
try:
    agent.execute(
        user_request="Clean up inbox",
        tool_name="delete_email",
        arguments={"email_id": "123"}
    )
except PermissionDeniedError as e:
    print(f"Blocked by INTENTLOCK: {e.reason}")  # PERMISSION_NOT_GRANTED
```

---

## 📂 Repository Structure

```
INTENTLOCK_SDK/
├── README.md                  # Project overview & quickstart
├── PRODUCT_SPEC.md            # Detailed product specification
├── ARCHITECTURE.md            # System architecture, flow diagrams, and invariants
├── THREAT_MODEL.md            # Threat taxonomy, STRIDE analysis, and mitigations
├── DEVELOPMENT_ROADMAP.md     # 9-phase development plan
├── TASK_TRACKER.md            # Granular task tracking
├── .gitignore                 # Environment and build exclusions
├── .env.example               # Template environment configuration
│
├── sdk/
│   └── python/
│       ├── pyproject.toml     # Packaging and dependency declarations
│       ├── src/
│       │   └── intentlock/    # Core SDK source code
│       └── tests/             # SDK unit & security test suite
│
├── backend/
│   ├── app/                   # FastAPI application & endpoints
│   └── tests/                 # Backend API integration tests
│
├── frontend/                  # Next.js & Tailwind CSS dashboard
├── docs/                      # Technical manuals and integration guides
├── examples/                  # Realistic reference implementations
│   └── email_agent/           # Mock email agent demonstration
└── infrastructure/
    └── docker/                # Containerization and Compose configurations
```

---

## 🔒 Security Invariants

1. **Deny by Default**: Any tool, permission, or resource not explicitly permitted is rejected.
2. **Deterministic Execution Boundary**: Tool execution logic is isolated inside the SDK gateway. No bypass path exists.
3. **No LLM Trust**: LLM reasoning or prompt context is considered untrusted data and never dictates authorization.
4. **Single-Use Bound Approvals**: Approvals expire, are bound to SHA-256 payload hashes, and cannot be replayed or altered.
5. **Fail Closed**: Any failure in policy evaluation, schema checking, or audit storage immediately halts execution.
6. **Zero Secret Exposure**: Structured redaction filters keys, tokens, and passwords from logs and dashboards.

---

## 🛠️ Getting Started

### Prerequisites
- Python 3.12+
- Node.js 20+ (for dashboard)
- Docker & Docker Compose (optional, for backend services)

### Setup SDK Virtual Environment
```powershell
cd sdk/python
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
pytest
```

---

## 📖 Documentation
- [Product Specification](PRODUCT_SPEC.md)
- [Architecture & Design](ARCHITECTURE.md)
- [Threat Model](THREAT_MODEL.md)
- [Development Roadmap](DEVELOPMENT_ROADMAP.md)
- [Task Tracker](TASK_TRACKER.md)

