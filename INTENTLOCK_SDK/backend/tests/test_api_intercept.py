"""
Tests for Remote Interception Gateway route handler.
"""

import pytest
from fastapi import HTTPException
from app.api.v1.policies import create_policy
from app.api.v1.agents import register_agent
from app.api.v1.approvals import approve_request
from app.api.v1.intercept import intercept_tool_call
from app.schemas.schemas import (
    PolicyCreate,
    AgentCreate,
    InterceptRequest,
    ApprovalActionRequest,
)
from intentlock.models import DecisionVerdict


def test_intercept_allow_action(db):
    pol = create_policy(
        PolicyCreate(
            name="Email Policy",
            allowed_permissions=["read_email"],
            denied_permissions=["delete_email"],
        ),
        db=db,
    )

    register_agent(
        AgentCreate(id="agent-001", name="Support Agent", policy_id=pol.id),
        db=db,
    )

    req = InterceptRequest(
        agent_id="agent-001",
        tool_name="read_email",
        arguments={"folder": "inbox"},
    )
    resp = intercept_tool_call(request=req, db=db)
    assert resp.verdict == DecisionVerdict.ALLOW
    assert resp.allowed is True
    assert resp.reason == "POLICY_MATCH"


def test_intercept_deny_action(db):
    pol = create_policy(
        PolicyCreate(
            name="Email Policy",
            allowed_permissions=["read_email"],
            denied_permissions=["delete_email"],
        ),
        db=db,
    )

    register_agent(
        AgentCreate(id="agent-002", name="Agent 2", policy_id=pol.id),
        db=db,
    )

    req = InterceptRequest(
        agent_id="agent-002",
        tool_name="delete_email",
        arguments={"email_id": "1"},
    )
    resp = intercept_tool_call(request=req, db=db)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert resp.reason == "PERMISSION_DENIED"


def test_intercept_approval_workflow(db):
    pol = create_policy(
        PolicyCreate(
            name="Export Policy",
            allowed_permissions=["read_email"],
            require_approval_permissions=["export_data"],
        ),
        db=db,
    )

    register_agent(
        AgentCreate(id="agent-003", name="Agent 3", policy_id=pol.id),
        db=db,
    )

    # 1. First invocation requires approval
    req = InterceptRequest(
        agent_id="agent-003",
        tool_name="export_data",
        arguments={"format": "csv"},
    )
    resp = intercept_tool_call(request=req, db=db)
    assert resp.verdict == DecisionVerdict.REQUIRE_APPROVAL
    assert resp.allowed is False
    approval_id = resp.approval_id
    assert approval_id is not None

    # 2. Human supervisor approves
    approve_request(
        approval_id=approval_id,
        action=ApprovalActionRequest(approver_id="security-officer@corp.com"),
        db=db,
    )

    # 3. Re-execution with approval_id succeeds
    req_approved = InterceptRequest(
        agent_id="agent-003",
        tool_name="export_data",
        arguments={"format": "csv"},
        approval_id=approval_id,
    )
    resp_approved = intercept_tool_call(request=req_approved, db=db)
    assert resp_approved.verdict == DecisionVerdict.ALLOW
    assert resp_approved.allowed is True

    # 4. Replay attempt must be blocked!
    with pytest.raises(HTTPException) as exc_info:
        intercept_tool_call(request=req_approved, db=db)
    assert exc_info.value.status_code == 409  # Conflict: token already consumed
