"""Integration tests for INTENTLOCK ActionGateway runtime interceptor."""

import pytest
from intentlock.models import ToolCall
from intentlock.gateway import ActionGateway
from intentlock.exceptions import (
    PermissionDeniedError,
    ApprovalRequiredError,
    ApprovalExpiredError,
    ApprovalReplayError,
    ApprovalMismatchError,
)


def test_execute_allowed_tool(gateway: ActionGateway):
    tc = ToolCall(tool_name="read_email", arguments={"folder": "inbox"})
    result = gateway.execute(tc)

    assert isinstance(result, list)
    assert result[0]["subject"] == "Test"


def test_execute_denied_tool_raises(gateway: ActionGateway):
    tc = ToolCall(tool_name="delete_email", arguments={"email_id": "123"})

    with pytest.raises(PermissionDeniedError) as exc_info:
        gateway.execute(tc)

    assert exc_info.value.tool_name == "delete_email"
    assert exc_info.value.reason == "PERMISSION_DENIED"


def test_execute_approval_required_raises(gateway: ActionGateway):
    tc = ToolCall(tool_name="export_user_data", arguments={"format": "csv"})

    with pytest.raises(ApprovalRequiredError) as exc_info:
        gateway.execute(tc)

    assert exc_info.value.tool_name == "export_user_data"
    assert exc_info.value.approval_id != ""
    assert exc_info.value.action_hash != ""


def test_execute_with_valid_approval(gateway: ActionGateway):
    tc = ToolCall(tool_name="export_user_data", arguments={"format": "json"})

    # First attempt raises approval required
    with pytest.raises(ApprovalRequiredError) as exc_info:
        gateway.execute(tc)

    approval_id = exc_info.value.approval_id

    # Human approves
    gateway.approval_service.approve(approval_id, approver_id="security-admin")

    # Second attempt with approval succeeds
    result = gateway.execute_with_approval(tc, approval_id)
    assert result["format"] == "json"
    assert result["data"] == "CONFIDENTIAL_EXPORT"


def test_execute_with_consumed_approval_raises_replay_error(gateway: ActionGateway):
    tc = ToolCall(tool_name="export_user_data", arguments={"format": "json"})

    with pytest.raises(ApprovalRequiredError) as exc_info:
        gateway.execute(tc)

    approval_id = exc_info.value.approval_id
    gateway.approval_service.approve(approval_id, approver_id="security-admin")

    # Consume once
    gateway.execute_with_approval(tc, approval_id)

    # Attempting to replay the same approval must fail!
    with pytest.raises(ApprovalReplayError):
        gateway.execute_with_approval(tc, approval_id)


def test_execute_with_mismatched_approval_raises(gateway: ActionGateway):
    tc1 = ToolCall(tool_name="export_user_data", arguments={"format": "json"})
    tc2 = ToolCall(tool_name="export_user_data", arguments={"format": "xml"})  # Altered arguments!

    with pytest.raises(ApprovalRequiredError) as exc_info:
        gateway.execute(tc1)

    approval_id = exc_info.value.approval_id
    gateway.approval_service.approve(approval_id, approver_id="security-admin")

    # Using tc1's approval token on altered tc2 must fail!
    with pytest.raises(ApprovalMismatchError):
        gateway.execute_with_approval(tc2, approval_id)


def test_audit_recorded_on_allow(gateway: ActionGateway):
    tc = ToolCall(tool_name="summarize_email", arguments={"email_id": "1"})
    gateway.execute(tc)

    events = gateway.audit_service.get_events(tool_name="summarize_email")
    assert len(events) >= 1
    assert events[0].verdict.value == "ALLOW"
    assert events[0].execution_success is True


def test_audit_recorded_on_deny(gateway: ActionGateway):
    tc = ToolCall(tool_name="delete_email", arguments={"email_id": "99"})

    with pytest.raises(PermissionDeniedError):
        gateway.execute(tc)

    events = gateway.audit_service.get_events(tool_name="delete_email")
    assert len(events) >= 1
    assert events[0].verdict.value == "DENY"
    assert events[0].reason == "PERMISSION_DENIED"

