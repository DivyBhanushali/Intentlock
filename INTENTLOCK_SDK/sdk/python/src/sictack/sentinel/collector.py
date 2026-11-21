"""
INTENTLOCK SENTINEL – Behavioral Event Collector & Redactor (Phase 1B).
Collects, validates, redacts, and persists behavioral telemetry events.
"""

from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from sictack.sentinel.models import (
    BehavioralEvent,
    BehavioralEventType,
    TaskSession,
)

# Sensitive keys and patterns for credential redaction
SENSITIVE_KEY_PATTERNS = [
    re.compile(p, re.IGNORECASE)
    for p in [
        r"password",
        r"secret",
        r"token",
        r"api[-_]?key",
        r"auth",
        r"bearer",
        r"private[-_]?key",
        r"access[-_]?key",
        r"credential",
    ]
]

JWT_BEARER_PATTERN = re.compile(r"Bearer\s+[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*", re.IGNORECASE)
API_KEY_VAL_PATTERN = re.compile(r"(live|test|sec|key)_[a-zA-Z0-9]{16,}", re.IGNORECASE)


def redact_sensitive_data(val: Any) -> Any:
    """
    Recursively redacts sensitive credentials, tokens, and secret patterns from data structures.
    """
    if isinstance(val, dict):
        redacted = {}
        for k, v in val.items():
            if any(p.search(str(k)) for p in SENSITIVE_KEY_PATTERNS):
                redacted[k] = "[REDACTED]"
            else:
                redacted[k] = redact_sensitive_data(v)
        return redacted
    elif isinstance(val, (list, tuple)):
        return [redact_sensitive_data(item) for item in val]
    elif isinstance(val, str):
        # Scrub Bearer JWTs and api key strings
        s = JWT_BEARER_PATTERN.sub("Bearer [REDACTED]", val)
        s = API_KEY_VAL_PATTERN.sub("[REDACTED_KEY]", s)
        return s
    else:
        return val


class BehavioralEventCollector:
    """
    Collects, validates, deduplicates, and manages behavioral telemetry events.
    """

    def __init__(self) -> None:
        self._events: List[BehavioralEvent] = []
        self._seen_ids: Set[str] = set()

    def record_event(
        self,
        session: TaskSession,
        event_type: BehavioralEventType,
        tool_name: Optional[str] = None,
        resource_id: Optional[str] = None,
        verdict: Optional[str] = None,
        execution_success: Optional[bool] = None,
        execution_error: Optional[str] = None,
        event_payload: Optional[Dict[str, Any]] = None,
        correlation_id: Optional[str] = None,
    ) -> BehavioralEvent:
        """
        Records a redacted behavioral event.
        """
        cleaned_payload = redact_sensitive_data(event_payload or {})
        step_idx = len([e for e in self._events if e.session_id == session.session_id]) + 1

        event = BehavioralEvent(
            session_id=session.session_id,
            org_id=session.org_id,
            agent_id=session.agent_id,
            correlation_id=correlation_id or session.session_id,
            event_type=event_type,
            step_index=step_idx,
            tool_name=tool_name,
            resource_id=resource_id,
            verdict=verdict,
            execution_success=execution_success,
            execution_error=redact_sensitive_data(execution_error) if execution_error else None,
            event_payload=cleaned_payload,
            timestamp=datetime.now(timezone.utc),
        )

        if event.event_id not in self._seen_ids:
            self._seen_ids.add(event.event_id)
            self._events.append(event)

        return event

    def get_events_for_session(self, session_id: str) -> List[BehavioralEvent]:
        """Returns ordered timeline of events for a given session."""
        return [e for e in self._events if e.session_id == session_id]

    def clear(self) -> None:
        """Clears the in-memory collector cache."""
        self._events.clear()
        self._seen_ids.clear()
