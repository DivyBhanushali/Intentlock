"""
SICTACK – Audit Service & Tamper-Evident Evidence Chain.

Provides an append-only, thread-safe, cryptographically hash-chained audit log
and evidence chain linking authorization decisions, data provenance, incidents,
and tool executions.
"""

from __future__ import annotations

import hashlib
import json
import threading
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from sictack.exceptions import AuditError
from sictack.logger import get_logger
from sictack.models import AuditEvent, DecisionVerdict

_log = get_logger(__name__)


def _canonical_payload_hash(payload: Any) -> str:
    """Computes a deterministic SHA-256 hash of arbitrary dict/payload."""
    if isinstance(payload, BaseModel):
        data = payload.model_dump(mode="json")
    elif isinstance(payload, dict):
        data = payload
    else:
        data = {"value": str(payload)}
    canon = json.dumps(data, sort_keys=True, default=str)
    return hashlib.sha256(canon.encode("utf-8")).hexdigest()


class EvidenceChainEntry(BaseModel):
    """
    A single immutable node in the tamper-evident cryptographic hash chain.
    """
    entry_id: str = Field(default_factory=lambda: f"ev_{uuid.uuid4().hex[:16]}")
    sequence_number: int = Field(ge=1)
    previous_hash: str
    entry_hash: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    event_type: str = Field(..., description="AUTHORIZATION, PROVENANCE, INCIDENT, INTEGRITY, ISOLATION")
    tenant_id: str = Field(default="org_default")
    agent_id: str = Field(default="")
    provenance_id: Optional[str] = None
    decision_id: Optional[str] = None
    incident_id: Optional[str] = None
    payload_hash: str = Field(default="")
    metadata: Dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def compute_hash(
        cls,
        sequence_number: int,
        previous_hash: str,
        timestamp_epoch: int,
        event_type: str,
        tenant_id: str,
        agent_id: str,
        payload_hash: str,
        provenance_id: Optional[str] = None,
        decision_id: Optional[str] = None,
        incident_id: Optional[str] = None,
    ) -> str:
        prov = provenance_id or ""
        dec = decision_id or ""
        inc = incident_id or ""
        raw = (
            f"{sequence_number}|{previous_hash}|{timestamp_epoch}|"
            f"{event_type}|{tenant_id}|{agent_id}|{payload_hash}|"
            f"{prov}|{dec}|{inc}"
        )
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class EvidenceChainVerificationResult(BaseModel):
    """Integrity verification result for an evidence hash chain."""
    is_valid: bool
    total_entries: int
    broken_sequence_number: Optional[int] = None
    error_message: Optional[str] = None
    verified_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TamperEvidentEvidenceChain:
    """
    Thread-safe, append-only cryptographic evidence chain.
    Guarantees detection of modified, deleted, inserted, or reordered records.
    """

    GENESIS_HASH = "0" * 64

    def __init__(self, tenant_id: str = "org_default") -> None:
        self.tenant_id = tenant_id
        self._lock = threading.Lock()
        self._chain: List[EvidenceChainEntry] = []

    def append(
        self,
        event_type: str,
        payload: Any,
        agent_id: str = "",
        provenance_id: Optional[str] = None,
        decision_id: Optional[str] = None,
        incident_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None,
    ) -> EvidenceChainEntry:
        """Appends a new cryptographically chained evidence record."""
        now = timestamp or datetime.now(timezone.utc)
        if now.tzinfo is None:
            now = now.replace(tzinfo=timezone.utc)
        epoch_ts = int(now.timestamp())

        payload_hash = _canonical_payload_hash(payload)

        with self._lock:
            if not self._chain:
                seq = 1
                prev_hash = self.GENESIS_HASH
            else:
                last_entry = self._chain[-1]
                seq = last_entry.sequence_number + 1
                prev_hash = last_entry.entry_hash

            entry_hash = EvidenceChainEntry.compute_hash(
                sequence_number=seq,
                previous_hash=prev_hash,
                timestamp_epoch=epoch_ts,
                event_type=event_type,
                tenant_id=self.tenant_id,
                agent_id=agent_id,
                payload_hash=payload_hash,
                provenance_id=provenance_id,
                decision_id=decision_id,
                incident_id=incident_id,
            )

            entry = EvidenceChainEntry(
                sequence_number=seq,
                previous_hash=prev_hash,
                entry_hash=entry_hash,
                timestamp=now,
                event_type=event_type,
                tenant_id=self.tenant_id,
                agent_id=agent_id,
                provenance_id=provenance_id,
                decision_id=decision_id,
                incident_id=incident_id,
                payload_hash=payload_hash,
                metadata=metadata or {},
            )
            self._chain.append(entry)
            return entry

    def verify_chain_integrity(self) -> EvidenceChainVerificationResult:
        """
        Verifies the full cryptographic hash chain from genesis to tail.
        Returns a verification report identifying any integrity break.
        """
        with self._lock:
            if not self._chain:
                return EvidenceChainVerificationResult(
                    is_valid=True,
                    total_entries=0,
                )

            expected_prev = self.GENESIS_HASH
            for idx, entry in enumerate(self._chain):
                expected_seq = idx + 1
                if entry.sequence_number != expected_seq:
                    return EvidenceChainVerificationResult(
                        is_valid=False,
                        total_entries=len(self._chain),
                        broken_sequence_number=entry.sequence_number,
                        error_message=(
                            f"Sequence discontinuity at index {idx}: "
                            f"expected {expected_seq}, found {entry.sequence_number}"
                        ),
                    )

                if entry.previous_hash != expected_prev:
                    return EvidenceChainVerificationResult(
                        is_valid=False,
                        total_entries=len(self._chain),
                        broken_sequence_number=entry.sequence_number,
                        error_message=(
                            f"Broken previous_hash link at sequence {entry.sequence_number}: "
                            f"expected {expected_prev}, found {entry.previous_hash}"
                        ),
                    )

                epoch_ts = int(
                    (entry.timestamp if entry.timestamp.tzinfo else entry.timestamp.replace(tzinfo=timezone.utc)).timestamp()
                )
                recomputed = EvidenceChainEntry.compute_hash(
                    sequence_number=entry.sequence_number,
                    previous_hash=entry.previous_hash,
                    timestamp_epoch=epoch_ts,
                    event_type=entry.event_type,
                    tenant_id=entry.tenant_id,
                    agent_id=entry.agent_id,
                    payload_hash=entry.payload_hash,
                    provenance_id=entry.provenance_id,
                    decision_id=entry.decision_id,
                    incident_id=entry.incident_id,
                )

                if recomputed != entry.entry_hash:
                    return EvidenceChainVerificationResult(
                        is_valid=False,
                        total_entries=len(self._chain),
                        broken_sequence_number=entry.sequence_number,
                        error_message=(
                            f"Hash mismatch at sequence {entry.sequence_number}: "
                            f"recorded {entry.entry_hash}, recomputed {recomputed}"
                        ),
                    )

                expected_prev = entry.entry_hash

            return EvidenceChainVerificationResult(
                is_valid=True,
                total_entries=len(self._chain),
            )

    def get_entries(self, limit: int = 100) -> List[EvidenceChainEntry]:
        """Returns entries newest first."""
        with self._lock:
            return list(reversed(self._chain))[:limit]

    def count(self) -> int:
        with self._lock:
            return len(self._chain)

    def clear(self) -> None:
        """Clears chain for test harness teardown."""
        with self._lock:
            self._chain.clear()


class AuditService:
    """In-memory, thread-safe audit event store backed by cryptographic evidence chain."""

    def __init__(self, enabled: bool = True, tenant_id: str = "org_default") -> None:
        self._enabled: bool = enabled
        self._lock = threading.Lock()
        self._events: list[AuditEvent] = []
        self.evidence_chain = TamperEvidentEvidenceChain(tenant_id=tenant_id)

    # ------------------------------------------------------------------
    # Record
    # ------------------------------------------------------------------

    def record(self, event: AuditEvent) -> None:
        """
        Append *event* to the audit log and evidence chain.

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
            # Record in cryptographic evidence chain
            prov_id = event.metadata.get("provenance_id") if event.metadata else None
            dec_id = event.metadata.get("decision_id") if event.metadata else None
            inc_id = event.metadata.get("incident_id") if event.metadata else None
            self.evidence_chain.append(
                event_type="AUDIT_EVENT",
                payload={
                    "event_id": event.event_id,
                    "tool_name": event.tool_name,
                    "verdict": event.verdict.value,
                    "agent_id": event.agent_id,
                    "action_hash": event.action_hash,
                    "risk_score": event.risk_score,
                },
                agent_id=event.agent_id,
                provenance_id=prov_id,
                decision_id=dec_id,
                incident_id=inc_id,
                timestamp=event.timestamp,
            )
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

    def verify_integrity(self) -> EvidenceChainVerificationResult:
        """Verifies the integrity of the underlying evidence chain."""
        return self.evidence_chain.verify_chain_integrity()

    # ------------------------------------------------------------------
    # Testing utility
    # ------------------------------------------------------------------

    def clear(self) -> None:
        """
        Remove all recorded events and clear evidence chain.

        .. warning::
           Intended for **testing only**. Do not call in production.
        """
        with self._lock:
            self._events.clear()
        self.evidence_chain.clear()
        _log.warning("Audit log and evidence chain cleared (testing only)")
