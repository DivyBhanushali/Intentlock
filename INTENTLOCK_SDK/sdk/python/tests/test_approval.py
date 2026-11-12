"""Unit tests for INTENTLOCK ApprovalService."""

import pytest
from datetime import datetime, timezone, timedelta
from intentlock.models import ToolCall, ApprovalStatus
from intentlock.approval import ApprovalService
from intentlock.exceptions import (
    ApprovalExpiredError,
    ApprovalReplayError,
    ApprovalMismatchError,
    IntentLockError,
)


def test_create_and_get_request():
    service = ApprovalService(timeout_seconds=120)
    tc = ToolCall(tool_name="sensitive_tool", arguments={"key": "val"})

    req = service.create_request(tc)
    assert req.approval_id is not None
    assert req.action_hash == tc.canonical_hash()
    assert req.status == ApprovalStatus.PENDING
    assert req.consumed is False

    retrieved = service.get(req.approval_id)
    assert retrieved.approval_id == req.approval_id


def test_approve_request():
    service = ApprovalService()
    tc = ToolCall(tool_name="test_tool")
    req = service.create_request(tc)

    approved = service.approve(req.approval_id, approver_id="admin-user")
    assert approved.status == ApprovalStatus.APPROVED
    assert approved.resolved_by == "admin-user"
    assert approved.resolved_at is not None


def test_reject_request():
    service = ApprovalService()
    tc = ToolCall(tool_name="test_tool")
    req = service.create_request(tc)

    rejected = service.reject(req.approval_id, approver_id="admin-user")
    assert rejected.status == ApprovalStatus.REJECTED
    assert rejected.resolved_by == "admin-user"


def test_consume_valid_approval():
    service = ApprovalService()
    tc = ToolCall(tool_name="test_tool")
    req = service.create_request(tc)
    service.approve(req.approval_id, approver_id="admin")

    consumed = service.consume(req.approval_id, expected_action_hash=tc.canonical_hash())
    assert consumed.consumed is True


def test_consume_unapproved_raises():
    service = ApprovalService()
    tc = ToolCall(tool_name="test_tool")
    req = service.create_request(tc)  # Still PENDING

    with pytest.raises(IntentLockError, match="not approved"):
        service.consume(req.approval_id, expected_action_hash=tc.canonical_hash())


def test_consume_hash_mismatch_raises():
    service = ApprovalService()
    tc = ToolCall(tool_name="test_tool")
    req = service.create_request(tc)
    service.approve(req.approval_id, approver_id="admin")

    with pytest.raises(ApprovalMismatchError):
        service.consume(req.approval_id, expected_action_hash="wrong_hash")


def test_list_pending():
    service = ApprovalService()
    tc1 = ToolCall(tool_name="tool_1")
    tc2 = ToolCall(tool_name="tool_2")

    r1 = service.create_request(tc1)
    r2 = service.create_request(tc2)

    pending = service.list_pending()
    assert len(pending) == 2

    service.approve(r1.approval_id, "admin")
    pending_after = service.list_pending()
    assert len(pending_after) == 1
    assert pending_after[0].approval_id == r2.approval_id

