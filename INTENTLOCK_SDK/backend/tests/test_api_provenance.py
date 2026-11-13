"""
INTENTLOCK 2.0 – Provenance & Evidence Graph API Integration Tests.
Tests trace grouping, causal explanations, and secret redaction.
"""

from datetime import datetime, timezone
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.db.models import OrganizationModel, UserModel, AuditEventModel, IntentContextModel
from app.api.deps import TenantContext
from app.api.v1.provenance import list_provenance_traces, get_trace_provenance_detail


@pytest.fixture
def prov_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    org = OrganizationModel(id="org_prov_test", name="Provenance Org", slug="prov-org")
    user = UserModel(id="usr_prov_admin", org_id="org_prov_test", email="admin@prov.io", role="ADMIN", password_hash="hash")
    db.add_all([org, user])

    itc = IntentContextModel(
        id="itc_trace_task_01",
        org_id="org_prov_test",
        user_id="usr_prov_admin",
        agent_id="data_agent",
        authorized_objective="Summarize internal server telemetry",
        allowed_actions=["query_db"],
        expiration_timestamp=datetime.now(timezone.utc),
    )
    db.add(itc)

    # Add 2 audit events under the same trace_id
    ev1 = AuditEventModel(
        id="ev_001",
        org_id="org_prov_test",
        trace_id="trace_workflow_xyz",
        agent_id="data_agent",
        tool_name="query_db",
        verdict="ALLOW",
        reason="POLICY_MATCH",
        risk_score=0.2,
        intent_id="itc_trace_task_01",
        metadata_json={"query": "SELECT COUNT(*) FROM logs", "api_key": "secret_token_12345"},
    )
    ev2 = AuditEventModel(
        id="ev_002",
        org_id="org_prov_test",
        trace_id="trace_workflow_xyz",
        agent_id="data_agent",
        tool_name="delete_records",
        verdict="DENY",
        reason="PERMISSION_NOT_GRANTED",
        risk_score=0.9,
        intent_id="itc_trace_task_01",
    )
    db.add_all([ev1, ev2])
    db.commit()

    try:
        yield db
    finally:
        db.close()


def test_provenance_trace_listing_and_detail(prov_db):
    user = prov_db.query(UserModel).filter(UserModel.id == "usr_prov_admin").first()
    tenant = TenantContext(org_id="org_prov_test", org_name="Provenance Org", plan="ENTERPRISE", user=user)

    # 1. List traces
    traces = list_provenance_traces(tenant=tenant, user=user, db=prov_db)
    assert len(traces) == 1
    assert traces[0].trace_id == "trace_workflow_xyz"
    assert traces[0].total_actions == 2
    assert traces[0].allowed_count == 1
    assert traces[0].denied_count == 1
    assert traces[0].authorized_objective == "Summarize internal server telemetry"

    # 2. Get trace detail & causal explanation
    detail = get_trace_provenance_detail(trace_id="trace_workflow_xyz", tenant=tenant, user=user, db=prov_db)
    assert detail.trace_id == "trace_workflow_xyz"
    assert len(detail.timeline) == 2
    assert detail.intent_context["authorized_objective"] == "Summarize internal server telemetry"
    assert "PERMISSION_NOT_GRANTED" in detail.causal_summary

    # 3. Verify secret redaction in metadata
    ev1_node = next(n for n in detail.timeline if n.event_id == "ev_001")
    assert ev1_node.sanitized_metadata["api_key"] == "••••••• [REDACTED]"
    assert ev1_node.sanitized_metadata["query"] == "SELECT COUNT(*) FROM logs"
