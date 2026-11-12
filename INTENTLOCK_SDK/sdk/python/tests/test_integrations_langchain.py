"""
Tests for LangChain & LangGraph ecosystem integrations.
"""

import pytest
from intentlock.agent import SecureAgent
from intentlock.integrations.langchain import SecureTool, secure_langchain_tool
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError
from intentlock.models import Policy, Config, RiskLevel


def mock_calculator(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b


def mock_format_text(text: str) -> str:
    """Uppercase text."""
    return text.upper()


@pytest.fixture
def agent_with_policy():
    policy = Policy(
        name="langchain-test-policy",
        allowed_permissions=["calc:add", "text:format"],
        denied_permissions=["db:drop"],
        require_approval_permissions=["email:broadcast"],
        max_risk_level=RiskLevel.HIGH,
        max_sensitivity=8,
    )
    config = Config(default_policy=policy)
    return SecureAgent(agent_id="test-langchain-agent", config=config)


def test_secure_tool_run_allowed(agent_with_policy):
    tool = SecureTool(
        name="add_numbers",
        func=mock_calculator,
        description="Adds two integers",
        agent=agent_with_policy,
        permission="calc:add",
    )

    # Call with dict
    result = tool.run({"a": 10, "b": 25})
    assert result == 35

    # Call with keyword args
    result2 = tool.run(a=5, b=7)
    assert result2 == 12


def test_secure_tool_single_arg_run(agent_with_policy):
    tool = SecureTool(
        name="uppercase",
        func=mock_format_text,
        description="Converts to uppercase",
        agent=agent_with_policy,
        permission="text:format",
    )

    result = tool.run("hello world")
    assert result == "HELLO WORLD"


def test_secure_tool_denied_with_error_handling(agent_with_policy):
    def dangerous_drop(table: str):
        return f"Dropped {table}"

    tool = SecureTool(
        name="drop_table",
        func=dangerous_drop,
        agent=agent_with_policy,
        permission="db:drop",
        handle_tool_error=True,
    )

    # When handle_tool_error=True, returns formatted string instead of crashing
    output = tool.run({"table": "users"})
    assert "[SECURITY_ERROR: PermissionDeniedError]" in output


def test_secure_tool_denied_raising(agent_with_policy):
    def dangerous_drop(table: str):
        return f"Dropped {table}"

    tool = SecureTool(
        name="drop_table_strict",
        func=dangerous_drop,
        agent=agent_with_policy,
        permission="db:drop",
        handle_tool_error=False,
    )

    with pytest.raises(PermissionDeniedError):
        tool.run({"table": "users"})


def test_secure_tool_approval_flow(agent_with_policy):
    def broadcast_email(subject: str, message: str):
        return "Email broadcast sent"

    tool = SecureTool(
        name="broadcast",
        func=broadcast_email,
        agent=agent_with_policy,
        permission="email:broadcast",
        handle_tool_error=False,
    )

    with pytest.raises(ApprovalRequiredError) as exc_info:
        tool.run({"subject": "Notice", "message": "All hands"})

    approval_id = exc_info.value.approval_id
    assert bool(approval_id)
    assert len(approval_id) >= 16

    # Authorize the pending approval
    agent_with_policy.gateway.approval_service.approve(approval_id, approver_id="security-lead")

    # Re-execute with approval token
    success = tool.run({"subject": "Notice", "message": "All hands"}, approval_id=approval_id)
    assert success == "Email broadcast sent"


def test_secure_tool_invoke_interface(agent_with_policy):
    tool = SecureTool(
        name="adder",
        func=mock_calculator,
        agent=agent_with_policy,
        permission="calc:add",
    )

    # Runnable invoke interface
    res = tool.invoke({"a": 100, "b": 200})
    assert res == 300


def test_secure_tool_callable_interface(agent_with_policy):
    tool = SecureTool(
        name="adder_call",
        func=mock_calculator,
        agent=agent_with_policy,
        permission="calc:add",
    )

    # Direct __call__
    assert tool(a=3, b=4) == 7


def test_secure_langchain_tool_helper(agent_with_policy):
    class FakeLangChainTool:
        name = "fake_adder"
        description = "A fake LangChain tool"
        
        def func(self, a: int, b: int):
            return a + b

    fake = FakeLangChainTool()
    secured = secure_langchain_tool(fake, agent=agent_with_policy, permission="calc:add")

    assert isinstance(secured, SecureTool)
    assert secured.name == "fake_adder"
    assert secured.run({"a": 20, "b": 30}) == 50
