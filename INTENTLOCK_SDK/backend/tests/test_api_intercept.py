"""
Tests for Remote Interception Gateway route handler.
"""

import pytest
import uuid
from fastapi import HTTPException
from app.api.deps import TenantContext
from app.api.v1.policies import create_policy
from app.api.v1.agents import register_agent
from app.api.v1.approvals import approve_request
from app.api.v1.intercept import intercept_tool_call
from app.db.models import OrganizationModel, AgentModel
from app.schemas.schemas import (
    PolicyCreate,
    AgentCreate,
    InterceptRequest,
    ApprovalActionRequest,
)
from intentlock.models import DecisionVerdict, RiskLevel


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

    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-001",
        tool_name="read_email",
        arguments={"folder": "inbox"},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.ALLOW
    assert resp.allowed is True
    assert resp.reason == "POLICY_MATCH"
    assert resp.risk_score is not None
    assert isinstance(resp.risk_score, float)


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

    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-002",
        tool_name="delete_email",
        arguments={"email_id": "1"},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert resp.reason == "PERMISSION_DENIED"
    assert resp.risk_score is not None
    assert isinstance(resp.risk_score, float)


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

    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")

    # 1. First invocation requires approval
    req = InterceptRequest(
        agent_id="agent-003",
        tool_name="export_data",
        arguments={"format": "csv"},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.REQUIRE_APPROVAL
    assert resp.allowed is False
    approval_id = resp.approval_id
    assert approval_id is not None

    # 2. Human supervisor approves
    approve_request(
        approval_id=approval_id,
        action=ApprovalActionRequest(approver_id="security-officer@corp.com"),
        db=db,
        tenant=tenant,
    )

    # 3. Re-execution with approval_id succeeds
    req_approved = InterceptRequest(
        agent_id="agent-003",
        tool_name="export_data",
        arguments={"format": "csv"},
        approval_id=approval_id,
    )
    resp_approved = intercept_tool_call(request=req_approved, db=db, tenant=tenant)
    assert resp_approved.verdict == DecisionVerdict.ALLOW
    assert resp_approved.allowed is True

    # 4. Replay attempt must be blocked!
    with pytest.raises(HTTPException) as exc_info:
        intercept_tool_call(request=req_approved, db=db, tenant=tenant)
    assert exc_info.value.status_code == 409  # Conflict: token already consumed


def test_intercept_early_denial_missing_policy_fail_closed(db):
    tenant = TenantContext(org_id=f"org_{uuid.uuid4().hex[:8]}", org_name="No Policy Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="unregistered-agent",
        tool_name="database_query",
        arguments={"sql": "SELECT 1"},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert resp.reason == "POLICY_MISSING_FAIL_CLOSED"
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_early_denial_tenant_suspended(db):
    org_id = f"org_susp_{uuid.uuid4().hex[:8]}"
    org = OrganizationModel(id=org_id, name="Suspended Org", slug=f"slug-{org_id}", status="SUSPENDED")
    db.merge(org)
    db.commit()

    tenant = TenantContext(org_id=org_id, org_name="Suspended Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="any-agent",
        tool_name="any_tool",
        arguments={},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "TENANT_SUSPENDED" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_early_denial_quota_exhausted(db):
    org_id = f"org_quota_{uuid.uuid4().hex[:8]}"
    org = OrganizationModel(id=org_id, name="Zero Quota Org", slug=f"slug-{org_id}", status="ACTIVE", max_monthly_actions=0)
    db.merge(org)
    db.commit()

    tenant = TenantContext(org_id=org_id, org_name="Zero Quota Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="any-agent",
        tool_name="any_tool",
        arguments={},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "QUOTA_EXCEEDED" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_early_denial_agent_suspended(db):
    org_id = f"org_ag_susp_{uuid.uuid4().hex[:8]}"
    org = OrganizationModel(id=org_id, name="Agent Susp Org", slug=f"slug-{org_id}", status="ACTIVE")
    agent = AgentModel(id="agent-suspended-001", org_id=org_id, name="Suspended Agent", status="SUSPENDED")
    db.merge(org)
    db.merge(agent)
    db.commit()

    tenant = TenantContext(org_id=org_id, org_name="Agent Susp Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-suspended-001",
        tool_name="any_tool",
        arguments={},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "AGENT_SUSPENDED" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_early_denial_replay_detected(db):
    from sictack.coordination.state_sync import get_state_sync_coordinator
    coordinator = get_state_sync_coordinator()
    test_nonce = f"nonce_{uuid.uuid4().hex}"
    coordinator.register_nonce(test_nonce)

    tenant = TenantContext(org_id=f"org_replay_{uuid.uuid4().hex[:8]}", org_name="Replay Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="any-agent",
        tool_name="any_tool",
        arguments={},
        nonce=test_nonce,
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "REPLAY_DETECTED" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL
