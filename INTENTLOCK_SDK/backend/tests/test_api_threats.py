"""
INTENTLOCK 2.0 — Threat Detection Engine & API Tests
Verifies real-time anomaly detection, rapid denial alerts, exfiltration probing, and threat mitigation.
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, AuditEventModel, SecurityThreatEventModel
from app.core.threat_engine import ThreatDetector
from app.api.v1.threats import list_threats, get_threat_stats, mitigate_threat
from app.api.deps import TenantContext
from app.schemas.schemas import ThreatMitigateRequest


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_threat_detector_exfiltration(db_session):
    tenant_org = "org-threat-test"
    agent_id = "malicious-agent-1"
    now = datetime.now(timezone.utc)

    # Trigger exfiltration denial
    threat = ThreatDetector.inspect_and_record(
        db=db_session,
        org_id=tenant_org,
        agent_id=agent_id,
        verdict="DENY",
        reason="RECIPIENT_NOT_ALLOWED",
        trace_id="tr-exfil-01",
        tool_name="send_external_email",
        now=now,
    )

    assert threat is not None
    assert threat.threat_category == "DATA_EXFILTRATION"
    assert threat.severity == "CRITICAL"
    assert threat.detection_rule == "RULE_EXFILTRATION_ATTEMPT"
    assert threat.mitigation_status == "ACTIVE"


def test_threat_detector_rapid_denials(db_session):
    tenant_org = "org-threat-test"
    agent_id = "brute-agent-2"
    now = datetime.now(timezone.utc)

    # Insert two prior denials within 60s
    for i in range(2):
        audit = AuditEventModel(
            id=f"audit-{i}",
            org_id=tenant_org,
            agent_id=agent_id,
            tool_name=f"restricted_tool_{i}",
            verdict="DENY",
            reason="PERMISSION_DENIED",
            timestamp=now,
        )
        db_session.add(audit)
    db_session.commit()

    # Third denial triggers rapid denial threat
    threat = ThreatDetector.inspect_and_record(
        db=db_session,
        org_id=tenant_org,
        agent_id=agent_id,
        verdict="DENY",
        reason="PERMISSION_DENIED",
        trace_id="tr-rapid-01",
        tool_name="restricted_tool_3",
        now=now,
    )

    assert threat is not None
    assert threat.threat_category == "ANOMALOUS_BEHAVIOR"
    assert threat.detection_rule == "RULE_RAPID_DENIALS"
    assert threat.recommended_response == "SUSPEND_AGENT"


def test_threat_api_listing_and_mitigation(db_session):
    tenant = TenantContext(org_id="org-api-threat", org_name="Threat Org", plan="ENTERPRISE")
    other_tenant = TenantContext(org_id="other-org", org_name="Other Org", plan="ENTERPRISE")

    # Create a threat directly in DB
    threat = SecurityThreatEventModel(
        id="thr_test_123",
        org_id=tenant.org_id,
        agent_id="test-agent",
        threat_category="INTENT_VIOLATION",
        severity="HIGH",
        description="Intent boundary breach",
        detection_rule="RULE_INTENT_TAMPERING",
        mitigation_status="ACTIVE",
    )
    db_session.add(threat)
    db_session.commit()

    # List threats as tenant
    results = list_threats(status_filter=None, severity=None, agent_id=None, limit=50, offset=0, db=db_session, tenant=tenant)
    assert len(results) == 1
    assert results[0].id == "thr_test_123"

    # Multi-tenant isolation: other tenant sees 0 threats
    other_results = list_threats(status_filter=None, severity=None, agent_id=None, limit=50, offset=0, db=db_session, tenant=other_tenant)
    assert len(other_results) == 0

    # Get stats
    stats = get_threat_stats(db=db_session, tenant=tenant)
    assert stats.total_threats == 1
    assert stats.active_threats == 1
    assert stats.high_threats == 1

    # Mitigate threat
    mitigate_req = ThreatMitigateRequest(status="MITIGATED", note="Agent reviewed and reprimanded.")
    updated = mitigate_threat(threat_id="thr_test_123", payload=mitigate_req, db=db_session, tenant=tenant)
    assert updated.mitigation_status == "MITIGATED"
    assert "Agent reviewed and reprimanded" in updated.description
