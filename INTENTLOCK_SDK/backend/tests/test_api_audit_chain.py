"""
INTENTLOCK 2.0 — Cryptographic Audit Hash-Chain Tests
Verifies SHA-256 sequential hash linkage, tamper detection, and verification API.
"""

import pytest
from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, AuditEventModel
from app.core.audit_chain import append_audit_event, verify_audit_chain
from app.api.v1.audit import verify_audit_log_chain
from app.api.deps import TenantContext


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_audit_hash_chain_sequential_integrity(db_session):
    org_id = "org-audit-verify"

    # Append 3 audit events
    e1 = append_audit_event(
        db=db_session,
        org_id=org_id,
        agent_id="agent-1",
        tool_name="tool_read",
        verdict="ALLOW",
        reason="POLICY_PERMITTED",
        action_hash="hash-1",
        trace_id="tr-1",
    )
    db_session.commit()

    e2 = append_audit_event(
        db=db_session,
        org_id=org_id,
        agent_id="agent-1",
        tool_name="tool_write",
        verdict="REQUIRE_APPROVAL",
        reason="SENSITIVITY_HIGH",
        action_hash="hash-2",
        trace_id="tr-1",
    )
    db_session.commit()

    e3 = append_audit_event(
        db=db_session,
        org_id=org_id,
        agent_id="agent-1",
        tool_name="tool_delete",
        verdict="DENY",
        reason="TOOL_EXPLICITLY_DENIED",
        action_hash="hash-3",
        trace_id="tr-1",
    )
    db_session.commit()

    # Assert sequence numbers and linkage
    assert e1.sequence_number == 1
    assert e1.previous_hash == "0" * 64
    assert len(e1.entry_hash) == 64

    assert e2.sequence_number == 2
    assert e2.previous_hash == e1.entry_hash

    assert e3.sequence_number == 3
    assert e3.previous_hash == e2.entry_hash

    # Verify chain
    result = verify_audit_chain(db_session, org_id)
    assert result["verified"] is True
    assert result["total_records"] == 3
    assert result["corrupted_records"] == 0


def test_audit_hash_chain_tamper_detection(db_session):
    org_id = "org-tamper-test"

    # Append 2 events
    e1 = append_audit_event(
        db=db_session,
        org_id=org_id,
        agent_id="agent-2",
        tool_name="read_records",
        verdict="ALLOW",
        reason="PERMITTED",
        action_hash="hash-a",
    )
    db_session.commit()

    e2 = append_audit_event(
        db=db_session,
        org_id=org_id,
        agent_id="agent-2",
        tool_name="update_records",
        verdict="ALLOW",
        reason="PERMITTED",
        action_hash="hash-b",
    )
    db_session.commit()

    # Tamper with e1 in place: change verdict from ALLOW to DENY without recalculating hash
    e1.verdict = "DENY"
    db_session.commit()

    # Verify should catch tampering
    result = verify_audit_chain(db_session, org_id)
    assert result["verified"] is False
    assert result["corrupted_records"] > 0
    assert result["first_corrupted_id"] == e1.id
    assert "Content tampering detected" in result["details"]


def test_audit_verify_api_endpoint(db_session):
    tenant = TenantContext(org_id="org-api-verify", org_name="Audit Org", plan="ENTERPRISE")

    append_audit_event(
        db=db_session,
        org_id=tenant.org_id,
        agent_id="agent-3",
        tool_name="list_users",
        verdict="ALLOW",
        reason="PERMITTED",
        action_hash="hash-c",
    )
    db_session.commit()

    resp = verify_audit_log_chain(db=db_session, tenant=tenant)
    assert resp.verified is True
    assert resp.total_records == 1
    assert resp.corrupted_records == 0
