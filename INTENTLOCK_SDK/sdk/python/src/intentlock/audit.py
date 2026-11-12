"""
INTENTLOCK – Audit Service.

Provides an append-only, thread-safe audit log of security-relevant events.
The MVP implementation stores events in memory; a persistent backend
(e.g. SQLAlchemy / SQLite) is planned for Phase 5.
"""

from __future__ import annotations

import threading
from typing import Optional

from intentlock.exceptions import AuditError
from intentlock.logger import get_logger
from intentlock.models import AuditEvent, DecisionVerdict

_log = get_logger(__name__)


class AuditService:
    """In-memory, thread-safe audit event store."""

    def __init__(self, enabled: bool = True) -> None:
        self._enabled: bool = enabled
        self._lock = threading.Lock()
        self._events: list[AuditEvent] = []

    # ------------------------------------------------------------------
    # Record
    # ------------------------------------------------------------------

    def record(self, event: AuditEvent) -> None:
        """
        Append *event* to the audit log.

        Raises
        ------
        AuditError
            If recording fails for any reason (e.g. memory, internal bug).
        """
        if not self._enabled:
            return

        try:
            with self._lock:
                self._events.append(event)
        except Exception as exc:
            _log.error(
                "Audit recording failed",
                extra={"event_id": event.event_id, "error": str(exc)},
            )
            raise AuditError(
                f"Failed to record audit event: {exc}",
                event_id=event.event_id,
            ) from exc

        _log.debug(
            "Audit event recorded",
            extra={
                "event_id": event.event_id,
                "tool_name": event.tool_name,
                "verdict": event.verdict.value,
                "agent_id": event.agent_id,
            },
        )

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def get_events(
        self,
        agent_id: Optional[str] = None,
        tool_name: Optional[str] = None,
        verdict: Optional[DecisionVerdict] = None,
        limit: int = 100,
    ) -> list[AuditEvent]:
        """
        Return audit events matching the optional filters.

        Events are returned in reverse-chronological order (newest first),
        limited to *limit* results.
        """
        with self._lock:
            results: list[AuditEvent] = []
            # Iterate in reverse for newest-first order.
            for event in reversed(self._events):
                if agent_id is not None and event.agent_id != agent_id:
                    continue
                if tool_name is not None and event.tool_name != tool_name:
                    continue
                if verdict is not None and event.verdict != verdict:
                    continue
                results.append(event)
                if len(results) >= limit:
                    break
            return results

    def get_event(self, event_id: str) -> AuditEvent | None:
        """Return the event with *event_id*, or ``None`` if not found."""
        with self._lock:
            for event in self._events:
                if event.event_id == event_id:
                    return event
        return None

    def count(self) -> int:
        """Return the total number of recorded events."""
        with self._lock:
            return len(self._events)

    # ------------------------------------------------------------------
    # Testing utility
    # ------------------------------------------------------------------

    def clear(self) -> None:
        """
        Remove all recorded events.

        .. warning::
           Intended for **testing only**. Do not call in production.
        """
        with self._lock:
            self._events.clear()
        _log.warning("Audit log cleared (testing only)")
