"""
Tests for Audit and Stats route handlers.
"""

from app.api.v1.intercept import intercept_tool_call
from app.api.v1.audit import list_audit_events, get_audit_stats
from app.schemas.schemas import InterceptRequest


def test_audit_events_recorded_and_queried(db):
    req = InterceptRequest(
        agent_id="audit-agent",
        tool_name="unregistered_tool",
    )
    intercept_tool_call(request=req, db=db)

    events = list_audit_events(agent_id="audit-agent", db=db)
    assert len(events) >= 1
    assert events[0].agent_id == "audit-agent"


def test_audit_stats(db):
    stats = get_audit_stats(db=db)
    assert stats.total_events >= 0
    assert stats.allowed_count >= 0
    assert stats.denied_count >= 0
