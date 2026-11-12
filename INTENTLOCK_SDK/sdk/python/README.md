# IntentLock Python SDK (`intentlock`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-blue.svg)](https://www.python.org/downloads/)
[![Architecture: Fail-Closed](https://img.shields.io/badge/Security-Fail--Closed-red.svg)](https://github.com/intentlock/intentlock)

> **Deterministic Security Middleware and Zero-Trust Execution Guard for Autonomous AI Agents.**

IntentLock intercepts AI tool calls at runtime, enforces declarative deterministic security policies, manages cryptographic single-use approvals for high-risk actions, and maintains an append-only verifiable audit trail.

---

## Key Capabilities

- **Deterministic 9-Step Policy Pipeline**: Evaluates tool calls against deny lists, allow lists, argument schemas, glob-matched resources, rate limits, and risk thresholds without relying on non-deterministic LLM self-evaluation.
- **Fail-Closed Architecture**: Any unregistered tool, malformed payload, expired token, or unexpected error automatically resolves to `DENY`.
- **HMAC-SHA256 Single-Use Approvals**: High-risk actions generate cryptographically signed, action-bound approval tokens with strict TTL and nonce replay protection.
- **Append-Only Audit Trail**: Every decision (`ALLOW`, `DENY`, `REQUIRE_APPROVAL`, `RATE_LIMITED`) and execution result is recorded with timestamped hashes and recursive secret redaction.
- **Ecosystem Ready**: First-class drop-in wrappers for **LangChain** (`SecureTool`) and **Model Context Protocol (MCP)** (`MCPSecurityProxy`).

---

## Installation

```bash
pip install intentlock
```

Or install from source:
```bash
git clone https://github.com/intentlock/intentlock.git
cd intentlock/sdk/python
pip install -e .
```

---

## Quickstart

```python
from intentlock import SecureAgent, Config, Policy, ActionRule, ActionType, RuleAction

# 1. Define declarative security policy
policy = Policy(
    rules=[
        ActionRule(
            action_type=ActionType.FILE_READ,
            target_pattern="/safe/*",
            action=RuleAction.ALLOW
        ),
        ActionRule(
            action_type=ActionType.EXTERNAL_API,
            action=RuleAction.REQUIRE_APPROVAL
        ),
        ActionRule(
            action_type=ActionType.BASH_EXECUTE,
            action=RuleAction.DENY
        ),
    ]
)

config = Config(agent_id="support-agent-01", default_policy=policy)
agent = SecureAgent(config=config)

# 2. Register tools with schema validation
@agent.tool(
    name="read_report",
    action_type=ActionType.FILE_READ,
    schema={"path": str}
)
def read_report(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

# 3. Execute through the security boundary
result = agent.execute_tool("read_report", {"path": "/safe/q4_results.txt"})
if result.success:
    print("Report Content:", result.output)
else:
    print(f"Blocked by IntentLock [{result.decision}]: {result.error}")
```

---

## Integrations

### LangChain Integration
```python
from langchain.tools import tool
from intentlock import SecureAgent, ActionType
from intentlock.integrations.langchain import secure_langchain_tool

@tool
def send_refund(order_id: str, amount: float) -> str:
    """Process an e-commerce customer refund."""
    return f"Refunded ${amount} for order {order_id}"

agent = SecureAgent(...)
secured_tool = secure_langchain_tool(
    send_refund,
    agent=agent,
    action_type=ActionType.PAYMENT,
    risk_score=0.9
)

# Intercepted and evaluated before execution
response = secured_tool.invoke({"order_id": "ORD-123", "amount": 250.00})
```

### Model Context Protocol (MCP) Proxy
```python
from intentlock import SecureAgent
from intentlock.integrations.mcp import MCPSecurityProxy

agent = SecureAgent(...)
proxy = MCPSecurityProxy(agent=agent)

# Intercept standard JSON-RPC 2.0 messages from MCP clients
rpc_request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
        "name": "delete_database",
        "arguments": {"confirm": True}
    }
}
rpc_response = proxy.handle_jsonrpc(rpc_request)
```

---

## Security Model

| Threat ID | Threat Vector | Mitigation |
| :--- | :--- | :--- |
| **T-01** | Prompt Injection / Indirect Tool Hijacking | Out-of-band policy engine with strict argument validation |
| **T-02** | Unregistered Shadow Tool Invocation | Fail-closed registry default; unknown tools instantly rejected |
| **T-03** | Path Traversal / Data Exfiltration | Canonical path resolution and glob-based file boundary enforcement |
| **T-04** | Email / Webhook Exfiltration | Recipient domain whitelist with wildcard glob matching |
| **T-05** | Unauthorized Financial / State Modification | Cryptographic single-use HMAC-SHA256 human approval tokens |
| **T-06** | Approval Token Replay Attacks | Nonce tracking and single-use invalidation upon consumption |
| **T-07** | High-Frequency DoS / Resource Exhaustion | Per-agent token-bucket rate limiters |
| **T-08** | Sensitive Data Leakage in Audit Logs | Automatic recursive regex scrubbing for keys, tokens, and credentials |

---

## License

MIT License. Designed and developed as an academic final year engineering project by **Divy Bhanushali**.

