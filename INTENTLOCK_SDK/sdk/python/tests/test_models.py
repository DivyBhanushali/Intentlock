"""Unit tests for INTENTLOCK Pydantic data models."""

import pytest
from pydantic import ValidationError
from intentlock.models import (
    Policy,
    ToolCall,
    Decision,
    DecisionVerdict,
    ApprovalRequest,
    ApprovalStatus,
    AuditEvent,
    Config,
    RiskLevel,
    RegisteredTool,
)


def test_policy_creation_defaults():
    policy = Policy()
    assert policy.policy_id is not None
    assert policy.allowed_permissions == []
    assert policy.denied_permissions == []
    assert policy.require_approval_permissions == []
    assert policy.max_risk_level == RiskLevel.MEDIUM
    assert policy.max_sensitivity == 5


def test_policy_custom_values():
    policy = Policy(
        policy_id="custom-pol",
        allowed_permissions=["perm:a", "perm:b"],
        denied_permissions=["perm:c"],
        require_approval_permissions=["perm:d"],
        max_sensitivity=8,
    )
    assert policy.policy_id == "custom-pol"
    assert len(policy.allowed_permissions) == 2
    assert policy.max_sensitivity == 8


def test_tool_call_validation():
    # Valid tool call
    tc = ToolCall(tool_name="read_email", arguments={"limit": 5})
    assert tc.tool_name == "read_email"
    assert tc.arguments["limit"] == 5

    # tool_name with whitespace must raise ValueError
    with pytest.raises(ValidationError):
        ToolCall(tool_name="read email")


def test_tool_call_canonical_hash_determinism():
    tc1 = ToolCall(
        tool_name="read_email",
        arguments={"b": 2, "a": 1},
        agent_id="agt-1",
        sensitivity=2
    )
    tc2 = ToolCall(
        tool_name="read_email",
        arguments={"a": 1, "b": 2},  # Reordered keys
        agent_id="agt-1",
        sensitivity=2
    )
    # Canonical hash must be identical regardless of key order
    assert tc1.canonical_hash() == tc2.canonical_hash()


def test_decision_model():
    dec = Decision(
        verdict=DecisionVerdict.ALLOW,
        tool_name="read_email",
        reason="POLICY_MATCH"
    )
    assert dec.verdict == DecisionVerdict.ALLOW
    assert dec.decision_id is not None
    assert dec.timestamp is not None


def test_approval_request_lifecycle():
    with pytest.raises(ValidationError):
        ApprovalRequest(
            action_hash="abc123hash",
            tool_name="export_data",
            expires_at=Policy().max_risk_level,  # Invalid type to test
        )


def test_approval_request_valid():
    from datetime import datetime, timezone, timedelta
    req = ApprovalRequest(
        action_hash="abc123hash",
        tool_name="export_data",
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    assert req.status == ApprovalStatus.PENDING
    assert req.consumed is False


def test_audit_event_creation():
    event = AuditEvent(
        agent_id="agt-1",
        tool_name="read_email",
        verdict=DecisionVerdict.ALLOW,
        reason="POLICY_MATCH",
        execution_success=True
    )
    assert event.event_id is not None
    assert event.execution_success is True


def test_config_validation():
    cfg = Config(approval_timeout_seconds=60)
    assert cfg.approval_timeout_seconds == 60
    assert cfg.fail_closed is True

    # Less than 30s must fail
    with pytest.raises(ValidationError):
        Config(approval_timeout_seconds=10)

