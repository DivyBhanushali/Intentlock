"""
Tests for Remote Interception Gateway route handler.
"""

import pytest
import uuid
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.deps import TenantContext, get_db
from app.api.v1.policies import create_policy
from app.api.v1.agents import register_agent
from app.api.v1.approvals import approve_request
from app.api.v1.intercept import intercept_tool_call
from app.core.security import hash_api_key
from app.db.models import (
    OrganizationModel,
    ApiKeyModel,
    PolicyModel,
    AgentModel,
    SentinelTaskSessionModel,
    AuditEventModel,
    SecurityThreatEventModel,
)
from app.schemas.schemas import (
    PolicyCreate,
    AgentCreate,
    InterceptRequest,
    ApprovalActionRequest,
)
from intentlock.models import DecisionVerdict, RiskLevel


# ─────────────────────────────────────────────────────────────────────────────
# Core Route Handler Unit Tests
# ─────────────────────────────────────────────────────────────────────────────

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
    assert exc_info.value.status_code == 409


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


def test_intercept_request_without_session_id_does_not_crash(db):
    org_id = f"org_no_sess_{uuid.uuid4().hex[:8]}"
    pol = create_policy(
        PolicyCreate(
            name="No Session Policy",
            allowed_permissions=["safe_tool"],
        ),
        db=db,
    )
    register_agent(
        AgentCreate(id="agent-no-sess", name="Agent Without Session", policy_id=pol.id),
        db=db,
    )

    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-no-sess",
        tool_name="safe_tool",
        arguments={"key": "value"},
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.ALLOW
    assert resp.allowed is True
    assert resp.session_id is None


def test_intercept_request_with_valid_sentinel_session(db):
    agent_uid = f"agent-sess-ok-{uuid.uuid4().hex[:6]}"
    sess_id = f"sess_valid_{uuid.uuid4().hex[:8]}"

    pol = create_policy(
        PolicyCreate(
            name=f"Session OK Policy {uuid.uuid4().hex[:6]}",
            allowed_permissions=["in_scope_tool"],
        ),
        db=db,
    )
    register_agent(
        AgentCreate(id=agent_uid, name="Agent Session OK", policy_id=pol.id),
        db=db,
    )

    sess = SentinelTaskSessionModel(
        id=sess_id,
        org_id="default-org",
        agent_id=agent_uid,
        task_objective="Test task",
        session_state="ACTIVE",
        authorized_scope={"enforce_strict_scope": True, "allowed_tools": ["in_scope_tool"]},
    )
    db.merge(sess)
    db.commit()

    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id=agent_uid,
        tool_name="in_scope_tool",
        arguments={},
        session_id=sess_id,
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.ALLOW
    assert resp.allowed is True
    assert resp.session_id == sess_id


def test_intercept_request_with_invalid_session_fails_closed(db):
    tenant = TenantContext(org_id="default-org", org_name="Default Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-any",
        tool_name="any_tool",
        arguments={},
        session_id="nonexistent-session-id",
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert resp.reason == "SENTINEL_SESSION_NOT_FOUND_FOR_TENANT"
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_request_with_suspended_session_fails_closed(db):
    tenant_org_id = f"org_sess_susp_{uuid.uuid4().hex[:8]}"
    sess_id = f"sess_susp_{uuid.uuid4().hex[:8]}"

    sess = SentinelTaskSessionModel(
        id=sess_id,
        org_id=tenant_org_id,
        agent_id="agent-susp",
        task_objective="Suspended task",
        session_state="SUSPENDED",
        suspension_reason="Security policy violation",
        authorized_scope={},
    )
    db.merge(sess)
    db.commit()

    tenant = TenantContext(org_id=tenant_org_id, org_name="Suspended Session Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-susp",
        tool_name="any_tool",
        arguments={},
        session_id=sess_id,
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "Session is suspended" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


def test_intercept_request_with_session_scope_violation_fails_closed(db):
    tenant_org_id = f"org_scope_viol_{uuid.uuid4().hex[:8]}"
    sess_id = f"sess_scope_{uuid.uuid4().hex[:8]}"

    sess = SentinelTaskSessionModel(
        id=sess_id,
        org_id=tenant_org_id,
        agent_id="agent-scope",
        task_objective="Scoped task",
        session_state="ACTIVE",
        authorized_scope={"enforce_strict_scope": True, "allowed_tools": ["allowed_tool_only"]},
    )
    db.merge(sess)
    db.commit()

    tenant = TenantContext(org_id=tenant_org_id, org_name="Scope Org", plan="ENTERPRISE")
    req = InterceptRequest(
        agent_id="agent-scope",
        tool_name="prohibited_tool",
        arguments={},
        session_id=sess_id,
    )
    resp = intercept_tool_call(request=req, db=db, tenant=tenant)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.allowed is False
    assert "not permitted in session authorized scope" in resp.reason
    assert resp.risk_score == 1.0
    assert resp.risk_level == RiskLevel.CRITICAL


# ─────────────────────────────────────────────────────────────────────────────
# Real HTTP Boundary Integration Tests (FastAPI TestClient + Schema Validation)
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def http_client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def _seed_http_tenant_environment(db, org_id=None, agent_id=None, policy_perms=None, constraints=None):
    org_id = org_id or f"org_http_{uuid.uuid4().hex[:8]}"
    agent_id = agent_id or f"agent_http_{uuid.uuid4().hex[:8]}"
    raw_key = f"sck_live_test_{uuid.uuid4().hex}"
    key_hash = hash_api_key(raw_key)

    org = OrganizationModel(
        id=org_id,
        name=f"Org {org_id}",
        slug=f"slug-{org_id}",
        status="ACTIVE",
    )
    db.merge(org)

    key = ApiKeyModel(
        id=f"key_{uuid.uuid4().hex[:10]}",
        org_id=org_id,
        name="HTTP Boundary Test Key",
        key_prefix=raw_key[:12],
        key_hash=key_hash,
        is_active=True,
    )
    db.merge(key)

    pol = PolicyModel(
        id=f"pol_{uuid.uuid4().hex[:10]}",
        org_id=org_id,
        name="HTTP Boundary Policy",
        allowed_permissions=policy_perms or ["in_scope_tool", "safe_tool"],
        denied_permissions=["blocked_tool"],
        max_risk_level="HIGH",
        version=1,
        parameter_constraints=constraints or {},
    )
    db.merge(pol)

    agent = AgentModel(
        id=agent_id,
        org_id=org_id,
        name=f"Agent {agent_id}",
        policy_id=pol.id,
        status="ACTIVE",
    )
    db.merge(agent)
    db.commit()

    return raw_key, org_id, agent_id, pol.id


def test_http_1_no_session_backward_compatible(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {"param": "value"},
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ALLOW"
    assert data["allowed"] is True
    assert data["session_id"] is None


def test_http_2_valid_session_allow(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    sess_id = f"sess_http_ok_{uuid.uuid4().hex[:8]}"
    sess = SentinelTaskSessionModel(
        id=sess_id,
        org_id=org_id,
        agent_id=agent_id,
        task_objective="Authorized HTTP task",
        session_state="ACTIVE",
        authorized_scope={"enforce_strict_scope": True, "allowed_tools": ["safe_tool"]},
    )
    db.merge(sess)
    db.commit()

    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ALLOW"
    assert data["allowed"] is True
    assert data["session_id"] == sess_id


def test_http_3_invalid_session_deny(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": "nonexistent-sess-uuid",
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert data["reason"] == "SENTINEL_SESSION_NOT_FOUND_FOR_TENANT"
    assert data["risk_score"] == 1.0


def test_http_4_cross_tenant_session_deny(db, http_client):
    raw_key_a, org_a, agent_a, _ = _seed_http_tenant_environment(db)
    _, org_b, agent_b, _ = _seed_http_tenant_environment(db)

    # Seed session belonging to Tenant B
    sess_b = SentinelTaskSessionModel(
        id=f"sess_b_{uuid.uuid4().hex[:8]}",
        org_id=org_b,
        agent_id=agent_b,
        task_objective="Tenant B Task",
        session_state="ACTIVE",
    )
    db.merge(sess_b)
    db.commit()

    # Tenant A attempts to use Tenant B's session
    payload = {
        "agent_id": agent_a,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_b.id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key_a})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert data["reason"] == "SENTINEL_SESSION_NOT_FOUND_FOR_TENANT"
    assert data["risk_score"] == 1.0


def test_http_5_cross_agent_session_deny(db, http_client):
    raw_key, org_id, agent_1, pol_id = _seed_http_tenant_environment(db)

    # Register second agent in the same tenant
    agent_2_id = f"agent_second_{uuid.uuid4().hex[:6]}"
    agent_2 = AgentModel(
        id=agent_2_id,
        org_id=org_id,
        name="Second Agent",
        policy_id=pol_id,
        status="ACTIVE",
    )
    db.merge(agent_2)

    # Seed session bound to agent_1
    sess_1 = SentinelTaskSessionModel(
        id=f"sess_agent1_{uuid.uuid4().hex[:8]}",
        org_id=org_id,
        agent_id=agent_1,
        task_objective="Agent 1 Task",
        session_state="ACTIVE",
    )
    db.merge(sess_1)
    db.commit()

    # Agent 2 attempts to use Agent 1's session
    payload = {
        "agent_id": agent_2_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_1.id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "CROSS_AGENT_SESSION_UNAUTHORIZED" in data["reason"]
    assert data["risk_score"] == 1.0


def test_http_6_suspended_session_deny(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    sess_susp = SentinelTaskSessionModel(
        id=f"sess_susp_{uuid.uuid4().hex[:8]}",
        org_id=org_id,
        agent_id=agent_id,
        task_objective="Suspended Task",
        session_state="SUSPENDED",
        suspension_reason="Malicious prompt injection detected",
    )
    db.merge(sess_susp)
    db.commit()

    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_susp.id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "Session is suspended" in data["reason"]
    assert data["risk_score"] == 1.0


def test_http_7_terminal_session_deny(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    sess_term = SentinelTaskSessionModel(
        id=f"sess_term_{uuid.uuid4().hex[:8]}",
        org_id=org_id,
        agent_id=agent_id,
        task_objective="Terminated Task",
        session_state="TERMINATED",
    )
    db.merge(sess_term)
    db.commit()

    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_term.id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "terminal state" in data["reason"]
    assert data["risk_score"] == 1.0


def test_http_8_unauthorized_tool_scope_deny(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    sess_scope = SentinelTaskSessionModel(
        id=f"sess_scoped_{uuid.uuid4().hex[:8]}",
        org_id=org_id,
        agent_id=agent_id,
        task_objective="Strict Tool Scope Task",
        session_state="ACTIVE",
        authorized_scope={"enforce_strict_scope": True, "allowed_tools": ["safe_tool"]},
    )
    db.merge(sess_scope)
    db.commit()

    # Invoke tool not in session authorized scope
    payload = {
        "agent_id": agent_id,
        "tool_name": "in_scope_tool",  # Allowed by policy, but NOT in session authorized_scope
        "arguments": {},
        "session_id": sess_scope.id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "not permitted in session authorized scope" in data["reason"]
    assert data["risk_score"] == 1.0


def test_http_9_session_id_preserved_by_pydantic(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)
    sess_id = f"sess_pydantic_check_{uuid.uuid4().hex[:8]}"
    sess = SentinelTaskSessionModel(
        id=sess_id,
        org_id=org_id,
        agent_id=agent_id,
        task_objective="Schema preservation test",
        session_state="ACTIVE",
        authorized_scope={"enforce_strict_scope": True, "allowed_tools": ["safe_tool"]},
    )
    db.merge(sess)
    db.commit()

    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {"test": "preserve"},
        "session_id": sess_id,
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    # Explicit proof: HTTP parsing in FastAPI did NOT drop session_id
    assert data["session_id"] == sess_id


def test_http_10_missing_session_mandatory_rule_deny(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(
        db,
        constraints={"require_session": True},
    )

    payload = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "MANDATORY_SESSION_REQUIRED" in data["reason"]
    assert data["risk_score"] == 1.0


def test_http_11_threat_event_on_api_key_agent_mismatch(db, http_client):
    raw_key, org_id, agent_id, _ = _seed_http_tenant_environment(db)

    # Restrict API key to legitimate-agent-1
    hashed = hash_api_key(raw_key)
    api_key_rec = db.query(ApiKeyModel).filter(ApiKeyModel.key_hash == hashed).first()
    api_key_rec.scopes = ["agent:legitimate-agent-1"]
    db.commit()

    payload = {
        "agent_id": "spoofed-agent-2",
        "tool_name": "safe_tool",
        "arguments": {},
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "API_KEY_AGENT_MISMATCH" in data["reason"]
    assert data["risk_score"] == 1.0

    # Verify audit event persistence
    audit = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.org_id == org_id, AuditEventModel.reason == "API_KEY_AGENT_MISMATCH")
        .first()
    )
    assert audit is not None
    assert audit.verdict == "DENY"
    assert audit.risk_score == 1.0

    # Verify threat event persistence
    threat = (
        db.query(SecurityThreatEventModel)
        .filter(SecurityThreatEventModel.org_id == org_id, SecurityThreatEventModel.agent_id == "spoofed-agent-2")
        .first()
    )
    assert threat is not None
    assert threat.threat_category == "INTENT_VIOLATION"
    assert threat.detection_rule == "RULE_INTENT_TAMPERING"


def test_http_12_threat_event_on_cross_tenant_agent(db, http_client):
    raw_key1, org_id1, agent_id1, _ = _seed_http_tenant_environment(db)
    raw_key2, org_id2, agent_id2, _ = _seed_http_tenant_environment(db)

    # Tenant 1 API key requests Tenant 2's agent
    payload = {
        "agent_id": agent_id2,
        "tool_name": "safe_tool",
        "arguments": {},
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key1})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "DENY"
    assert data["allowed"] is False
    assert "CROSS_TENANT_AGENT_UNAUTHORIZED" in data["reason"]
    assert data["risk_score"] == 1.0

    # Verify audit event persistence
    audit = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.org_id == org_id1, AuditEventModel.reason == "CROSS_TENANT_AGENT_UNAUTHORIZED")
        .first()
    )
    assert audit is not None
    assert audit.verdict == "DENY"
    assert audit.risk_score == 1.0

    # Verify threat event persistence
    threat = (
        db.query(SecurityThreatEventModel)
        .filter(SecurityThreatEventModel.org_id == org_id1, SecurityThreatEventModel.agent_id == agent_id2)
        .first()
    )
    assert threat is not None
    assert threat.threat_category == "INTENT_VIOLATION"
    assert threat.detection_rule == "RULE_INTENT_TAMPERING"


def test_http_13_policy_lifecycle_mandatory_session(db, http_client):
    raw_key, org_id, _, _ = _seed_http_tenant_environment(db)

    # 1. Create policy using POST with require_session: true
    policy_payload = {
        "name": "Mandatory Task Session Policy",
        "description": "Lifecycle test policy requiring an active SENTINEL session",
        "allowed_permissions": ["safe_tool"],
        "parameter_constraints": {"require_session": True},
    }
    resp_create = http_client.post("/api/v1/policies", json=policy_payload, headers={"X-API-Key": raw_key})
    assert resp_create.status_code in (200, 201)
    created_policy = resp_create.json()
    policy_id = created_policy["id"]
    assert created_policy["parameter_constraints"] == {"require_session": True}

    # 2. Retrieve it and verify the constraint persists
    resp_get = http_client.get(f"/api/v1/policies/{policy_id}", headers={"X-API-Key": raw_key})
    assert resp_get.status_code == 200
    retrieved_policy = resp_get.json()
    assert retrieved_policy["parameter_constraints"] == {"require_session": True}

    # Bind a new agent to this policy
    agent_id = f"agent_lifecycle_{uuid.uuid4().hex[:8]}"
    db.merge(AgentModel(id=agent_id, org_id=org_id, name="Lifecycle Agent", policy_id=policy_id))
    db.commit()

    # 3. Execute intercept request without a session
    payload_no_session = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
    }
    resp_intercept1 = http_client.post("/api/v1/intercept", json=payload_no_session, headers={"X-API-Key": raw_key})
    assert resp_intercept1.status_code == 200
    data1 = resp_intercept1.json()
    # 4. Verify MANDATORY_SESSION_REQUIRED DENY
    assert data1["verdict"] == "DENY"
    assert data1["allowed"] is False
    assert "MANDATORY_SESSION_REQUIRED" in data1["reason"]
    assert data1["risk_score"] == 1.0

    # 5. Execute with valid authorized session and verify ALLOW
    sess_id = f"sess_lifecycle_{uuid.uuid4().hex[:8]}"
    db.merge(
        SentinelTaskSessionModel(
            id=sess_id,
            org_id=org_id,
            agent_id=agent_id,
            task_objective="Lifecycle session objective",
            session_state="ACTIVE",
            authorized_scope={"enforce_strict_scope": False, "allowed_tools": ["safe_tool"]},
        )
    )
    db.commit()

    payload_with_session = {
        "agent_id": agent_id,
        "tool_name": "safe_tool",
        "arguments": {},
        "session_id": sess_id,
    }
    resp_intercept2 = http_client.post("/api/v1/intercept", json=payload_with_session, headers={"X-API-Key": raw_key})
    assert resp_intercept2.status_code == 200
    data2 = resp_intercept2.json()
    assert data2["verdict"] == "ALLOW"
    assert data2["allowed"] is True
    assert data2["session_id"] == sess_id

    # 6. Confirm policy updates preserve the intended constraints
    update_payload = {
        "description": "Updated lifecycle test description",
    }
    resp_update = http_client.put(f"/api/v1/policies/{policy_id}", json=update_payload, headers={"X-API-Key": raw_key})
    assert resp_update.status_code == 200
    updated_policy = resp_update.json()
    assert updated_policy["description"] == "Updated lifecycle test description"
    assert updated_policy["parameter_constraints"] == {"require_session": True}
