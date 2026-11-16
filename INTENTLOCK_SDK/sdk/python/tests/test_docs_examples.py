"""
Automated verification tests for code examples published in the INTENTLOCK Developer Portal.
Ensures all documented Python SDK tutorials and methods are syntactically valid and run cleanly.
"""

import json
from unittest.mock import MagicMock, patch
import pytest

from intentlock import (
    SecureAgent,
    IntentLockClient,
    Config,
    Policy,
    ToolCall,
    Decision,
    DecisionVerdict,
    RiskLevel,
    ApprovalStatus,
    AuditEvent,
    ApprovalRequest,
    IntentContext,
)
from intentlock.exceptions import (
    ApprovalMismatchError,
    ApprovalReplayError,
    ApprovalRequiredError,
    PermissionDeniedError,
)


def test_in_process_quickstart_tutorial():
    """Verify Tutorial A (In-Process Security with SecureAgent)."""
    # 1. Initialize SecureAgent
    agent = SecureAgent(
        agent_id="support-agent-v1",
        permissions=["file:read", "email:send"],
    )

    # 2. Register allowed and sensitive tools
    read_data = {"record": "user_42"}
    agent.register_tool(
        name="read_file",
        handler=lambda path: read_data,
        permission="file:read",
        description="Read file safely",
    )
    agent.register_tool(
        name="delete_account",
        handler=lambda uid: "deleted",
        permission="admin:delete",
        description="Delete user account",
    )

    # 3. Execute allowed tool
    res = agent.execute(tool_name="read_file", arguments={"path": "/data/42.json"})
    assert res == read_data

    # 4. Denied tool raises PermissionDeniedError
    with pytest.raises(PermissionDeniedError) as exc_info:
        agent.execute(tool_name="delete_account", arguments={"uid": "user_42"})
    assert exc_info.value.tool_name == "delete_account"

    # 5. Inspect local audit records
    audit_events = agent.get_audit_log(limit=10)
    assert len(audit_events) >= 2
    verdicts = [ev.verdict for ev in audit_events]
    assert DecisionVerdict.ALLOW in verdicts
    assert DecisionVerdict.DENY in verdicts


def test_in_process_approval_lifecycle():
    """Verify Human-in-the-loop approval workflow on SecureAgent."""
    # Policy requiring approval for wire transfers
    policy = Policy(
        allowed_permissions=["transfer:wire"],
        require_approval_permissions=["transfer:wire"],
        description="Wire transfer policy",
    )
    agent = SecureAgent(
        agent_id="finance-agent",
        config=Config(default_policy=policy),
    )
    agent.register_tool(
        name="transfer_funds",
        handler=lambda amount, to_account: f"Transferred ${amount} to {to_account}",
        permission="transfer:wire",
    )

    tc = ToolCall(
        tool_name="transfer_funds",
        arguments={"amount": 5000, "to_account": "ACC-9988"},
        agent_id="finance-agent",
    )

    # 1. Execution is paused and raises ApprovalRequiredError
    with pytest.raises(ApprovalRequiredError) as exc_info:
        agent.execute(tc)

    approval_id = exc_info.value.approval_id
    assert approval_id

    # 2. Pending approval is listed
    pending = agent.get_pending_approvals()
    assert any(req.approval_id == approval_id for req in pending)

    # 3. Human operator approves
    app_req = agent.approve(approval_id, approver_id="security-officer-1")
    assert app_req.status == ApprovalStatus.APPROVED

    # 4. Execute with valid approved token
    result = agent.execute_with_approval(tc, approval_id=approval_id)
    assert result == "Transferred $5000 to ACC-9988"

    # 5. Token is single-use; replay is blocked
    with pytest.raises(ApprovalReplayError):
        agent.execute_with_approval(tc, approval_id=approval_id)


def test_remote_client_mocked():
    """Verify Tutorial B (Remote Authorization with IntentLockClient) with mocked HTTP."""
    client = IntentLockClient(
        api_key="ilk_live_test_key_12345",
        base_url="https://mock.intentlock.internal",
        agent_id="support-agent-remote",
    )

    # Mock authorize_intent response
    intent_resp_payload = {
        "id": "itc_test_99",
        "org_id": "org_default",
        "user_id": "usr_1",
        "agent_id": "support-agent-remote",
        "authorized_objective": "Read customer records",
        "allowed_actions": ["read_file"],
        "denied_actions": [],
        "allowed_permissions": ["file:read"],
        "allowed_resources": ["/data/*"],
        "allowed_recipients": [],
        "sensitivity_ceiling": 5,
        "execution_scope": "default",
        "expiration_timestamp": "2026-12-31T23:59:59Z",
        "context_status": "ACTIVE",
        "authorization_version": 1,
    }

    # Mock intercept response
    intercept_resp_payload = {
        "verdict": "ALLOW",
        "tool_name": "read_file",
        "reason": "Action permitted by intent context",
        "action_hash": "hash_abc_123",
        "risk_score": 0.1,
        "risk_level": "LOW",
        "trace_id": "trc_456",
        "intent_id": "itc_test_99",
        "approval_id": None,
    }

    with patch("urllib.request.urlopen") as mock_urlopen:
        # Mock authorize_intent HTTP call
        mock_resp_intent = MagicMock()
        mock_resp_intent.read.return_value = json.dumps(intent_resp_payload).encode("utf-8")
        mock_resp_intent.__enter__.return_value = mock_resp_intent

        # Mock intercept HTTP call
        mock_resp_intercept = MagicMock()
        mock_resp_intercept.read.return_value = json.dumps(intercept_resp_payload).encode("utf-8")
        mock_resp_intercept.__enter__.return_value = mock_resp_intercept

        mock_urlopen.side_effect = [mock_resp_intent, mock_resp_intercept]

        # 1. Request Intent Authorization Context
        intent = client.authorize_intent(
            objective="Read customer records",
            allowed_actions=["read_file"],
            allowed_permissions=["file:read"],
        )
        assert intent.intent_id == "itc_test_99"
        assert intent.context_status == "ACTIVE"

        # 2. Request Interception Decision
        decision = client.intercept(
            tool_name="read_file",
            arguments={"path": "/data/record.json"},
            intent_id=intent.intent_id,
        )
        assert decision.verdict == DecisionVerdict.ALLOW
        assert decision.risk_level == RiskLevel.LOW
        assert decision.action_hash == "hash_abc_123"
