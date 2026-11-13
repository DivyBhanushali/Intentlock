"""
INTENTLOCK 2.0 – Intent Authorization Context API Integration Tests.
Tests issuance, inspection, listing, revocation, and 8-stage pipeline enforcement.
"""

from datetime import datetime, timezone, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.db.models import OrganizationModel, UserModel, PolicyModel, IntentContextModel
from app.api.deps import TenantContext
from app.schemas.schemas import IntentContextCreate, IntentContextRevoke, InterceptRequest
from app.api.v1.intents import (
    issue_intent_context,
    get_intent_context,
    list_intent_contexts,
    revoke_intent_context,
)
from app.api.v1.intercept import intercept_tool_call
from intentlock.models import DecisionVerdict


@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    # Seed organization and users
    org = OrganizationModel(id="org_test_enterprise", name="Test Enterprise", slug="test-ent")
    admin_user = UserModel(
        id="usr_admin_1",
        org_id="org_test_enterprise",
        email="admin@enterprise.ai",
        full_name="Admin One",
        password_hash="fakehash",
        role="ADMIN",
    )
    viewer_user = UserModel(
        id="usr_viewer_1",
        org_id="org_test_enterprise",
        email="viewer@enterprise.ai",
        full_name="Viewer One",
        password_hash="fakehash",
        role="VIEWER",
    )
    db.add_all([org, admin_user, viewer_user])

    # Seed broad policy
    policy = PolicyModel(
        id="pol_broad",
        org_id="org_test_enterprise",
        name="Broad Org Policy",
        allowed_permissions=["database:read", "database:drop", "email:send"],
        allowed_resources=["sales/*"],
        allowed_recipients=["*@enterprise.ai"],
        max_risk_level="HIGH",
        max_sensitivity=10,
    )
    db.add(policy)
    db.commit()

    try:
        yield db
    finally:
        db.close()


def test_intent_context_lifecycle_and_enforcement(test_db):
    admin = test_db.query(UserModel).filter(UserModel.id == "usr_admin_1").first()
    tenant = TenantContext(org_id="org_test_enterprise", org_name="Test Enterprise", plan="GROWTH", user=admin)

    # 1. Issue task-scoped intent authorization context
    create_req = IntentContextCreate(
        agent_id="reporting_agent",
        authorized_objective="Generate quarterly financial overview",
        allowed_actions=["database:read"],
        denied_actions=["database:drop"],
        allowed_resources=["sales/q1/*"],
        sensitivity_ceiling=4,
        ttl_seconds=3600,
    )
    issued = issue_intent_context(req=create_req, tenant=tenant, current_user=admin, db=test_db)
    assert issued.id.startswith("itc_")
    assert issued.authorized_objective == "Generate quarterly financial overview"
    assert issued.context_status == "ACTIVE"

    # 2. Retrieve intent details
    fetched = get_intent_context(intent_id=issued.id, tenant=tenant, user=admin, db=test_db)
    assert fetched.id == issued.id

    # 3. List intents
    intents_list = list_intent_contexts(tenant=tenant, user=admin, db=test_db)
    assert len(intents_list) == 1

    # 4. Intercept tool call with valid intent within scope -> ALLOW
    allowed_req = InterceptRequest(
        agent_id="reporting_agent",
        tool_name="database:read",
        resource_id="sales/q1/data.csv",
        sensitivity=2,
        intent_id=issued.id,
    )
    resp = intercept_tool_call(request=allowed_req, tenant=tenant, db=test_db)
    assert resp.verdict == DecisionVerdict.ALLOW
    assert resp.allowed is True
    assert resp.intent_id == issued.id

    # 5. Intercept tool call violating intent's explicit denied_actions -> DENY
    denied_req = InterceptRequest(
        agent_id="reporting_agent",
        tool_name="database:drop",
        intent_id=issued.id,
    )
    resp_denied = intercept_tool_call(request=denied_req, tenant=tenant, db=test_db)
    assert resp_denied.verdict == DecisionVerdict.DENY
    assert resp_denied.reason == "INTENT_ACTION_DENIED"

    # 6. Intercept tool call violating resource scope -> DENY
    scope_req = InterceptRequest(
        agent_id="reporting_agent",
        tool_name="database:read",
        resource_id="sales/restricted/confidential.csv",
        intent_id=issued.id,
    )
    resp_scope = intercept_tool_call(request=scope_req, tenant=tenant, db=test_db)
    assert resp_scope.verdict == DecisionVerdict.DENY
    assert resp_scope.reason == "INTENT_RESOURCE_OUT_OF_SCOPE"

    # 7. Explicitly revoke intent context
    revoke_req = IntentContextRevoke(reason="Task completed early")
    revoked = revoke_intent_context(intent_id=issued.id, req=revoke_req, tenant=tenant, current_user=admin, db=test_db)
    assert revoked.context_status == "REVOKED"
    assert revoked.revoked_reason == "Task completed early"

    # 8. Subsequent call under revoked intent fails closed immediately -> DENY
    resp_after_revocation = intercept_tool_call(request=allowed_req, tenant=tenant, db=test_db)
    assert resp_after_revocation.verdict == DecisionVerdict.DENY
    assert resp_after_revocation.reason == "INTENT_REVOKED"


def test_intent_context_cross_tenant_isolation(test_db):
    admin = test_db.query(UserModel).filter(UserModel.id == "usr_admin_1").first()
    tenant_a = TenantContext(org_id="org_test_enterprise", org_name="Test Enterprise", plan="GROWTH", user=admin)
    tenant_b = TenantContext(org_id="org_competitor", org_name="Competitor Inc", plan="ENTERPRISE")

    # Issue under tenant A
    issued = issue_intent_context(
        req=IntentContextCreate(
            agent_id="agent_a",
            authorized_objective="Tenant A Task",
            allowed_actions=["database:read"],
        ),
        tenant=tenant_a,
        current_user=admin,
        db=test_db,
    )

    # Calling from tenant B using tenant A's intent_id -> Fail closed DENY
    cross_req = InterceptRequest(
        agent_id="agent_b",
        tool_name="database:read",
        intent_id=issued.id,
    )
    resp = intercept_tool_call(request=cross_req, tenant=tenant_b, db=test_db)
    assert resp.verdict == DecisionVerdict.DENY
    assert resp.reason == "INTENT_CONTEXT_NOT_FOUND"
