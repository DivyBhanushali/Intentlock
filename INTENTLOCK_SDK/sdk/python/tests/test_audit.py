"""Unit tests for INTENTLOCK AuditService."""

import pytest
from intentlock.models import AuditEvent, DecisionVerdict
from intentlock.audit import AuditService


def test_record_and_get_events():
    audit = AuditService(enabled=True)
    audit.clear()

    e1 = AuditEvent(agent_id="agt-1", tool_name="tool_a", verdict=DecisionVerdict.ALLOW)
    e2 = AuditEvent(agent_id="agt-1", tool_name="tool_b", verdict=DecisionVerdict.DENY)
    e3 = AuditEvent(agent_id="agt-2", tool_name="tool_a", verdict=DecisionVerdict.ALLOW)

    audit.record(e1)
    audit.record(e2)
    audit.record(e3)

    assert audit.count() == 3

    # Filter by agent
    agt1_events = audit.get_events(agent_id="agt-1")
    assert len(agt1_events) == 2

    # Filter by tool
    tool_b_events = audit.get_events(tool_name="tool_b")
    assert len(tool_b_events) == 1
    assert tool_b_events[0].verdict == DecisionVerdict.DENY

    # Filter by verdict
    allowed_events = audit.get_events(verdict=DecisionVerdict.ALLOW)
    assert len(allowed_events) == 2


def test_get_event_by_id():
    audit = AuditService(enabled=True)
    audit.clear()

    ev = AuditEvent(agent_id="agt-9", tool_name="special_tool")
    audit.record(ev)

    found = audit.get_event(ev.event_id)
    assert found is not None
    assert found.agent_id == "agt-9"

    not_found = audit.get_event("nonexistent-id")
    assert not_found is None


def test_clear():
    audit = AuditService(enabled=True)
    audit.record(AuditEvent(agent_id="agt-1"))
    assert audit.count() >= 1

    audit.clear()
    assert audit.count() == 0

