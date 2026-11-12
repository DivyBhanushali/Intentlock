"""End-to-end unit tests for INTENTLOCK SecureAgent facade."""

import pytest
from intentlock.agent import SecureAgent
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError


def test_agent_execute_allowed(agent: SecureAgent):
    result = agent.execute(
        user_request="Please read my email inbox",
        tool_name="read_email",
        arguments={"folder": "inbox", "limit": 5}
    )
    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["subject"] == "Test"


def test_agent_execute_denied(agent: SecureAgent):
    with pytest.raises(PermissionDeniedError) as exc_info:
        agent.execute(
            user_request="Delete all spam messages",
            tool_name="delete_email",
            arguments={"email_id": "100"}
        )
    assert exc_info.value.tool_name == "delete_email"


def test_agent_approval_workflow(agent: SecureAgent):
    # Step 1: Agent proposes action requiring approval
    with pytest.raises(ApprovalRequiredError) as exc_info:
        agent.execute(
            user_request="Export our customer database",
            tool_name="export_user_data",
            arguments={"format": "csv"}
        )

    approval_id = exc_info.value.approval_id
    assert approval_id != ""

    # Step 2: Human inspects pending requests
    pending = agent.get_pending_approvals()
    assert any(p.approval_id == approval_id for p in pending)

    # Step 3: Human grants approval
    agent.approve(approval_id, approver_id="security-officer")

    # Step 4: Re-execution with approval succeeds
    result = agent.execute_with_approval(
        approval_id=approval_id,
        tool_name="export_user_data",
        arguments={"format": "csv"}
    )
    assert result["format"] == "csv"
    assert result["data"] == "CONFIDENTIAL_EXPORT"


def test_agent_audit_log(agent: SecureAgent):
    agent.execute(
        user_request="Check inbox",
        tool_name="read_email",
        arguments={"folder": "inbox"}
    )
    logs = agent.get_audit_log(limit=10)
    assert len(logs) >= 1
    assert any(entry.tool_name == "read_email" for entry in logs)


def test_agent_tools_property(agent: SecureAgent):
    tools = agent.tools
    tool_names = [t.name for t in tools]
    assert "read_email" in tool_names
    assert "delete_email" in tool_names

