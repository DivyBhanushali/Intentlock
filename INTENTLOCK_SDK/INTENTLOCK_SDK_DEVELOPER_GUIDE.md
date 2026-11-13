# INTENTLOCK 2.0 — Python SDK Developer Guide

## 1. Installation

Install the official INTENTLOCK Python SDK from the local package or enterprise repository:

```bash
cd sdk/python
pip install -e .
```

Dependencies: `pydantic>=2.0`, `requests>=2.28`, `typing-extensions>=4.0`.

---

## 2. Remote Gateway Mode (`IntentLockClient`)

The `IntentLockClient` communicates with the INTENTLOCK backend enforcement gateway.

```python
from intentlock import IntentLockClient

client = IntentLockClient(
    base_url="https://intentlock-backend-ze2i.onrender.com",
    api_key="ilk_live_your_api_key_here",
)

# 1. Authorize an Intent Context
intent = client.authorize_intent(
    agent_id="customer-support-agent",
    authorized_objective="Help user verify account balance and read FAQs",
    allowed_actions=["banking:get_balance", "kb:search"],
    denied_actions=["banking:transfer_funds", "admin:exec"],
    allowed_resources=["/accounts/public/*"],
    sensitivity_ceiling=4,
    duration_seconds=1800,  # 30-minute validity
)

print(f"Issued Intent Context: {intent.intent_id} (Expires: {intent.expiration_timestamp})")

# 2. Intercept an Agent Tool Call
response = client.intercept(
    agent_id="customer-support-agent",
    tool_name="banking:get_balance",
    arguments={"account_id": "ACC-90412"},
    intent_id=intent.intent_id,
    sensitivity=3,
)

if response.verdict == "ALLOW":
    print("Action permitted! Proceeding with handler.")
elif response.verdict == "REQUIRE_APPROVAL":
    print(f"Human authorization required. Approval ID: {response.approval_id}")
else:
    print(f"Action blocked by policy: {response.reason}")
```

---

## 3. LangGraph Stateful Workflow Integration

INTENTLOCK 2.0 provides native wrappers for LangGraph nodes and execution graphs.

```python
from intentlock.agent import SecureAgent
from intentlock.models import Policy, Config, RiskLevel
from intentlock.integrations.langgraph import SecureGraphNode, secure_langgraph_node

# Configure agent policy
policy = Policy(
    name="finance-graph-policy",
    allowed_permissions=["node:research", "node:summarize"],
    require_approval_permissions=["node:wire_funds"],
    max_sensitivity=8,
)
agent = SecureAgent(agent_id="graph-executor", config=Config(default_policy=policy))

# Option A: Class wrapper
def research_node_fn(state: dict) -> dict:
    return {"data": f"Market analysis for {state.get('ticker')}"}

secure_research_node = SecureGraphNode(
    name="market_research",
    func=research_node_fn,
    agent=agent,
    permission="node:research",
)

# Option B: Decorator syntax
@secure_langgraph_node(
    name="wire_funds",
    agent=agent,
    permission="node:wire_funds",
    sensitivity=9,
)
def wire_funds_node(state: dict) -> dict:
    return {"transfer_confirmed": True, "amount": state.get("amount")}

# LangGraph state invocation
state = {
    "ticker": "GOOGL",
    "intent_id": "int_finance_01",
    "trace_id": "tr_graph_99",
}

output = secure_research_node(state)
print("Graph output:", output)
# output contains: {'data': '...', 'trace_id': 'tr_graph_99', '_intentlock_status': 'APPROVED'}
```

---

## 4. LangChain Integration (`SecureTool`)

Wrap any standard Python function or LangChain `BaseTool` to intercept invocations through INTENTLOCK.

```python
from intentlock.integrations.langchain import SecureTool

def search_documents(query: str) -> str:
    return f"Search results for: {query}"

tool = SecureTool(
    name="doc_search",
    func=search_documents,
    description="Search internal product documentation",
    agent=agent,
    permission="kb:search",
    sensitivity=2,
)

# Standard LangChain tool execution protocols:
res = tool.run({"query": "Password reset steps"})
# or: tool.invoke({"query": "..."})
```

---

## 5. Model Context Protocol (MCP) Security Proxy

Secure Model Context Protocol JSON-RPC 2.0 tool execution boundaries against unauthorized access and prompt injection.

```python
from intentlock.integrations.mcp import MCPSecurityProxy

proxy = MCPSecurityProxy(agent=agent)

# Register MCP tool
proxy.register_mcp_tool(
    name="query_database",
    handler=lambda query: [{"id": 1, "val": "active"}],
    permission="db:query",
    sensitivity=3,
)

# Handle incoming JSON-RPC 2.0 tools/call packet
jsonrpc_request = {
    "jsonrpc": "2.0",
    "id": 101,
    "method": "tools/call",
    "params": {
        "name": "query_database",
        "arguments": {"query": "SELECT * FROM users;"},
        "intent_id": "int_scoped_01",
    },
}

response = proxy.handle_jsonrpc(jsonrpc_request)
print("MCP Response:", response)
```

---

## 6. Embedded In-Process Mode

For zero-network latency environments, execute INTENTLOCK directly in-process:

```python
from intentlock.agent import SecureAgent
from intentlock.models import Policy, Config, RiskLevel

policy = Policy(
    policy_id="local-policy",
    allowed_permissions=["calc:add", "file:read"],
    denied_permissions=["db:drop"],
    max_sensitivity=5,
)

agent = SecureAgent(agent_id="local-agent", config=Config(default_policy=policy))

agent.register_tool(
    name="add_numbers",
    handler=lambda a, b: a + b,
    permission="calc:add",
)

result = agent.call_tool("add_numbers", a=10, b=25)
print(f"Calculated: {result}")
```
