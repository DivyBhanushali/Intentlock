"""
Tests for Model Context Protocol (MCP) security proxy integration.
"""

import pytest
from intentlock.agent import SecureAgent
from intentlock.integrations.mcp import MCPSecurityProxy
from intentlock.models import Policy, Config, RiskLevel, DecisionVerdict


@pytest.fixture
def mcp_proxy():
    policy = Policy(
        name="mcp-test-policy",
        allowed_permissions=["fs:read", "calc:add"],
        denied_permissions=["fs:delete", "db:drop"],
        require_approval_permissions=["fs:write"],
        max_risk_level=RiskLevel.HIGH,
        max_sensitivity=8,
    )
    config = Config(default_policy=policy)
    agent = SecureAgent(agent_id="mcp-client-agent", config=config)
    proxy = MCPSecurityProxy(agent=agent)

    # Register tools
    proxy.register_mcp_tool(
        name="read_file",
        handler=lambda path: f"Contents of {path}",
        permission="fs:read",
        description="Reads a file from filesystem",
        parameters_schema={"type": "object", "properties": {"path": {"type": "string"}}},
    )

    proxy.register_mcp_tool(
        name="delete_file",
        handler=lambda path: f"Deleted {path}",
        permission="fs:delete",
        description="Deletes a file from filesystem",
    )

    proxy.register_mcp_tool(
        name="write_file",
        handler=lambda path, content: f"Wrote to {path}",
        permission="fs:write",
        description="Writes content to a file",
    )

    return proxy


def test_mcp_tools_list(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list",
    }
    resp = mcp_proxy.handle_jsonrpc(req)

    assert resp["jsonrpc"] == "2.0"
    assert resp["id"] == 1
    assert "result" in resp
    tools = resp["result"]["tools"]
    tool_names = [t["name"] for t in tools]
    assert "read_file" in tool_names
    assert "delete_file" in tool_names
    assert "write_file" in tool_names


def test_mcp_tool_call_allowed(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 2,
        "method": "tools/call",
        "params": {
            "name": "read_file",
            "arguments": {"path": "/var/log/syslog"},
        },
    }
    resp = mcp_proxy.handle_jsonrpc(req)

    assert resp["id"] == 2
    result = resp["result"]
    assert result["isError"] is False
    assert result["_intentlock"]["verdict"] == DecisionVerdict.ALLOW.value
    assert "Contents of /var/log/syslog" in result["content"][0]["text"]


def test_mcp_tool_call_denied(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 3,
        "method": "tools/call",
        "params": {
            "name": "delete_file",
            "arguments": {"path": "/etc/passwd"},
        },
    }
    resp = mcp_proxy.handle_jsonrpc(req)

    assert resp["id"] == 3
    result = resp["result"]
    assert result["isError"] is True
    assert result["_intentlock"]["verdict"] == DecisionVerdict.DENY.value
    assert "INTENTLOCK_SECURITY_BLOCK" in result["content"][0]["text"]


def test_mcp_tool_call_require_approval_flow(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 4,
        "method": "tools/call",
        "params": {
            "name": "write_file",
            "arguments": {"path": "/etc/config.json", "content": "{}"},
        },
    }
    resp = mcp_proxy.handle_jsonrpc(req)

    result = resp["result"]
    assert result["isError"] is True
    assert result["_intentlock"]["verdict"] == DecisionVerdict.REQUIRE_APPROVAL.value
    approval_id = result["_intentlock"]["approval_id"]
    assert bool(approval_id)
    assert len(approval_id) >= 16

    # Now authorize the approval
    mcp_proxy.gateway.approval_service.approve(approval_id, approver_id="sysadmin")

    # Retry call with approval_id
    req_approved = {
        "jsonrpc": "2.0",
        "id": 5,
        "method": "tools/call",
        "params": {
            "name": "write_file",
            "arguments": {"path": "/etc/config.json", "content": "{}"},
            "approval_id": approval_id,
        },
    }
    resp_approved = mcp_proxy.handle_jsonrpc(req_approved)
    result_approved = resp_approved["result"]

    assert result_approved["isError"] is False
    assert result_approved["_intentlock"]["verdict"] == DecisionVerdict.ALLOW.value
    assert "Wrote to /etc/config.json" in result_approved["content"][0]["text"]


def test_mcp_unknown_method(mcp_proxy):
    req = {
        "jsonrpc": "2.0",
        "id": 99,
        "method": "resources/read",
    }
    resp = mcp_proxy.handle_jsonrpc(req)

    assert resp["id"] == 99
    assert "error" in resp
    assert resp["error"]["code"] == -32601
