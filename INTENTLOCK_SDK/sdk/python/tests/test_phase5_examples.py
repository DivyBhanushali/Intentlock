"""
INTENTLOCK – Phase 5 Documentation Examples Automated Verification Test Suite.

Verifies that all Python snippets presented in the Phase 5 documentation:
- LangChain adapter (`SecureTool`, `secure_langchain_tool`)
- LangGraph adapter (`SecureGraphNode`, `secure_langgraph_node`)
- MCP proxy (`MCPSecurityProxy`)
- Real-world enterprise examples (Research assistant, File access, Email approval)
execute with 100% fidelity without hitting real external services or production networks.
"""
from __future__ import annotations

import pytest
from intentlock.agent import SecureAgent
from intentlock.models import Config, Policy, ToolCall, RiskLevel
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError
from intentlock.integrations.langchain import SecureTool, secure_langchain_tool
from intentlock.integrations.langgraph import SecureGraphNode, secure_langgraph_node
from intentlock.integrations.mcp import MCPSecurityProxy


# ─── 1. LangChain Documentation Examples ───────────────────────────────────

def test_langchain_allowed_and_denied_docs_example():
    policy = Policy(
        name="langchain-policy",
        allowed_permissions=["search:query"],
        denied_permissions=["shell:exec"],
        require_approval_permissions=[],
    )
    agent = SecureAgent(
        agent_id="researcher-agent",
        permissions=["search:query"],
        config=Config(default_policy=policy),
    )

    def search_web(query: str) -> str:
        return f"Results for: {query}"

    def run_shell(command: str) -> str:
        return f"Executing {command}"

    # Wrap tools with handle_tool_error=True
    search_tool = secure_langchain_tool(
        tool_or_func=search_web,
        agent=agent,
        permission="search:query",
        handle_tool_error=True,
    )
    shell_tool = secure_langchain_tool(
        tool_or_func=run_shell,
        agent=agent,
        permission="shell:exec",
        handle_tool_error=True,
    )

    # Allowed execution
    result = search_tool.invoke({"query": "AI agent safety benchmarks"})
    assert result == "Results for: AI agent safety benchmarks"

    # Denied execution (caught cleanly and formatted for LLM context)
    error_result = shell_tool.invoke({"command": "rm -rf /"})
    assert "[SECURITY_ERROR: PermissionDeniedError]" in error_result


def test_langchain_approval_flow_docs_example():
    policy = Policy(
        name="approval-policy",
        allowed_permissions=["read:file"],
        denied_permissions=[],
        require_approval_permissions=["send:payment"],
    )
    agent = SecureAgent(
        agent_id="payment-agent",
        permissions=["read:file", "send:payment"],
        config=Config(default_policy=policy),
    )

    def process_payment(amount: float, recipient: str) -> str:
        return f"Transferred ${amount:.2f} to {recipient}"

    tool = SecureTool(
        name="send_payment",
        func=process_payment,
        agent=agent,
        permission="send:payment",
        handle_tool_error=False,  # Raise exception to manage approval ticket
    )

    # Step 1: Tool raises ApprovalRequiredError
    with pytest.raises(ApprovalRequiredError) as exc_info:
        tool.run({"amount": 1000.0, "recipient": "vendor-corp"})

    approval_id = exc_info.value.approval_id
    assert approval_id

    # Step 2: Human operator reviews and approves
    agent.gateway.approval_service.approve(approval_id, approver_id="security-admin")

    # Step 3: Resumed execution using approval_id parameter
    success = tool.run({"amount": 1000.0, "recipient": "vendor-corp"}, approval_id=approval_id)
    assert success == "Transferred $1000.00 to vendor-corp"


# ─── 2. LangGraph Documentation Examples ───────────────────────────────────

def test_langgraph_secure_node_docs_example():
    policy = Policy(
        name="graph-policy",
        allowed_permissions=["analyze_sentiment"],
        denied_permissions=["publish_tweet"],
        require_approval_permissions=["post_external_review"],
    )
    agent = SecureAgent(
        agent_id="graph-analyst",
        permissions=["analyze_sentiment", "publish_tweet", "post_external_review"],
        config=Config(default_policy=policy),
    )

    # State handler node
    def sentiment_node(state: dict) -> dict:
        text = state.get("text", "")
        return {"sentiment": "POSITIVE", "length": len(text)}

    def review_node(state: dict) -> dict:
        return {"reviewed": True, "feedback": "Looks ready."}

    secure_sentiment = SecureGraphNode(
        name="analyze_sentiment",
        func=sentiment_node,
        agent=agent,
        permission="analyze_sentiment",
    )

    secure_review = SecureGraphNode(
        name="post_external_review",
        func=review_node,
        agent=agent,
        permission="post_external_review",
    )

    # Test allowed execution
    initial_state = {"text": "Excellent security layer!"}
    output_state = secure_sentiment(initial_state)
    assert output_state["sentiment"] == "POSITIVE"
    assert output_state["_intentlock_status"] == "APPROVED"

    # Test approval required branching in LangGraph
    pending_state = secure_review(initial_state)
    assert pending_state["_intentlock_status"] == "REQUIRE_APPROVAL"
    assert "_approval_id" in pending_state
    assert pending_state["_pending_node"] == "post_external_review"
    assert len(pending_state["_approval_id"]) >= 16


# ─── 3. MCP Documentation Examples ─────────────────────────────────────────

def test_mcp_proxy_docs_example():
    policy = Policy(
        name="mcp-policy",
        allowed_permissions=["read_metric"],
        denied_permissions=["drop_schema"],
        require_approval_permissions=["restart_service"],
    )
    agent = SecureAgent(
        agent_id="mcp-server-agent",
        permissions=["read_metric", "drop_schema", "restart_service"],
        config=Config(default_policy=policy),
    )

    proxy = MCPSecurityProxy(agent=agent, agent_id="mcp-server-agent")

    def read_metric(metric_id: str) -> dict:
        return {"metric": metric_id, "value": 98.4}

    def drop_schema(schema_name: str) -> str:
        return f"Dropped {schema_name}"

    proxy.register_mcp_tool("read_metric", read_metric, permission="read_metric")
    proxy.register_mcp_tool("drop_schema", drop_schema, permission="drop_schema")

    # Allowed JSON-RPC tools/call
    rpc_allowed = {
        "jsonrpc": "2.0",
        "id": "req-1",
        "method": "tools/call",
        "params": {
            "name": "read_metric",
            "arguments": {"metric_id": "cpu_load"},
        },
    }
    resp_allowed = proxy.handle_jsonrpc(rpc_allowed)
    assert resp_allowed["result"]["isError"] is False
    assert resp_allowed["result"]["_intentlock"]["verdict"] == "ALLOW"

    # Blocked JSON-RPC tools/call
    rpc_denied = {
        "jsonrpc": "2.0",
        "id": "req-2",
        "method": "tools/call",
        "params": {
            "name": "drop_schema",
            "arguments": {"schema_name": "production"},
        },
    }
    resp_denied = proxy.handle_jsonrpc(rpc_denied)
    assert resp_denied["result"]["isError"] is True
    assert resp_denied["result"]["_intentlock"]["verdict"] == "DENY"


# ─── 4. Real-World Scenarios ────────────────────────────────────────────────

def test_real_world_scenario_1_research_assistant():
    """Scenario 1: Read-only research assistant."""
    policy = Policy(
        name="research-policy",
        allowed_permissions=["web:search", "doc:read"],
        denied_permissions=["db:write", "network:exfiltrate"],
    )
    agent = SecureAgent(
        agent_id="researcher-01",
        permissions=["web:search", "doc:read"],
        config=Config(default_policy=policy),
    )
    agent.register_tool(name="web_search", handler=lambda query: f"Facts on {query}", permission="web:search")

    call = ToolCall(tool_name="web_search", arguments={"query": "quantum computing"})
    result = agent.execute(call)
    assert "Facts on quantum computing" in result


def test_real_world_scenario_2_file_access_restricted():
    """Scenario 2: File-access agent with restricted path parameters."""
    policy = Policy(
        name="file-policy",
        allowed_permissions=["file:read_public"],
        denied_permissions=["file:write_system"],
    )
    agent = SecureAgent(
        agent_id="file-agent",
        permissions=["file:read_public"],
        config=Config(default_policy=policy),
    )

    def safe_read(path: str) -> str:
        return f"Safe content of {path}"

    agent.register_tool(name="read_public_file", handler=safe_read, permission="file:read_public")
    call = ToolCall(tool_name="read_public_file", arguments={"path": "public_report.txt"})
    assert "Safe content" in agent.execute(call)


def test_real_world_scenario_3_email_requiring_approval():
    """Scenario 3: Email-sending agent requiring approval."""
    policy = Policy(
        name="email-policy",
        allowed_permissions=["email:draft"],
        denied_permissions=[],
        require_approval_permissions=["email:send_external"],
    )
    agent = SecureAgent(
        agent_id="email-agent",
        permissions=["email:draft", "email:send_external"],
        config=Config(default_policy=policy),
    )

    def send_mail(to: str, subject: str) -> str:
        return f"Sent to {to}"

    agent.register_tool(name="send_external_email", handler=send_mail, permission="email:send_external")

    call = ToolCall(tool_name="send_external_email", arguments={"to": "client@acme.com", "subject": "Contract"})
    with pytest.raises(ApprovalRequiredError) as exc_info:
        agent.execute(call)

    app_id = exc_info.value.approval_id
    agent.approve(app_id)
    assert agent.execute_with_approval(call, approval_id=app_id) == "Sent to client@acme.com"
