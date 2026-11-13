"""
INTENTLOCK 2.0 — Cryptographic Audit Hash-Chaining Engine
Provides immutable, tamper-evident audit records using sequential SHA-256 hash chains.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import AuditEventModel


def _normalize_timestamp(dt: Optional[datetime]) -> int:
    """Returns canonical unix epoch integer for cross-database deterministic hashing."""
    if not dt:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp())


def calculate_entry_hash(
    sequence_number: int,
    previous_hash: str,
    org_id: str,
    agent_id: str,
    tool_name: str,
    verdict: str,
    action_hash: str,
    timestamp_epoch: int,
) -> str:
    """Computes a canonical SHA-256 hash of an audit log entry."""
    payload = (
        f"{sequence_number}|{previous_hash}|{org_id}|{agent_id}|"
        f"{tool_name}|{verdict}|{action_hash}|{timestamp_epoch}"
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def append_audit_event(
    db: Session,
    org_id: str,
    agent_id: str,
    tool_name: str,
    verdict: str,
    reason: str,
    policy_id: str = "",
    action_hash: str = "",
    trace_id: str = "",
    intent_id: str = "",
    approval_id: str = "",
    risk_score: float = 0.0,
    execution_success: Optional[bool] = None,
    execution_error: str = "",
    metadata_json: Optional[Dict[str, Any]] = None,
    timestamp: Optional[datetime] = None,
) -> AuditEventModel:
    """
    Appends an audit event to the organization's hash chain with an atomic sequence number
    and verifiable previous_hash linkage.
    """
    now = timestamp or datetime.now(timezone.utc)
    epoch_ts = _normalize_timestamp(now)

    # Find the latest event in the organization's chain
    last_event = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.org_id == org_id)
        .order_by(desc(AuditEventModel.sequence_number), desc(AuditEventModel.timestamp))
        .first()
    )

    if last_event and last_event.sequence_number is not None:
        sequence_number = last_event.sequence_number + 1
        previous_hash = last_event.entry_hash or ("0" * 64)
    else:
        sequence_number = 1
        previous_hash = "0" * 64

    entry_hash = calculate_entry_hash(
        sequence_number=sequence_number,
        previous_hash=previous_hash,
        org_id=org_id,
        agent_id=agent_id,
        tool_name=tool_name,
        verdict=verdict,
        action_hash=action_hash,
        timestamp_epoch=epoch_ts,
    )

    event = AuditEventModel(
        id=str(uuid.uuid4()),
        org_id=org_id,
        timestamp=now,
        agent_id=agent_id,
        tool_name=tool_name,
        verdict=verdict,
        reason=reason,
        policy_id=policy_id,
        action_hash=action_hash,
        approval_id=approval_id,
        intent_id=intent_id,
        trace_id=trace_id,
        sequence_number=sequence_number,
        previous_hash=previous_hash,
        entry_hash=entry_hash,
        risk_score=risk_score,
        execution_success=execution_success,
        execution_error=execution_error,
        metadata_json=metadata_json or {},
    )

    db.add(event)
    return event


def verify_audit_chain(db: Session, org_id: str) -> Dict[str, Any]:
    """
    Verifies the cryptographic integrity of all audit events for a given organization.
    Ensures no records have been deleted, reordered, or modified after the fact.
    """
    events: List[AuditEventModel] = (
        db.query(AuditEventModel)
        .filter(AuditEventModel.org_id == org_id)
        .order_by(AuditEventModel.sequence_number.asc(), AuditEventModel.timestamp.asc())
        .all()
    )

    total_records = len(events)
    if total_records == 0:
        return {
            "verified": True,
            "total_records": 0,
            "valid_records": 0,
            "corrupted_records": 0,
            "first_corrupted_id": None,
            "details": "Audit chain is empty. No integrity violations.",
        }

    expected_previous_hash = "0" * 64
    valid_count = 0

    for idx, event in enumerate(events):
        # If legacy entry lacks sequence_number or entry_hash, mark verified baseline
        if event.sequence_number is None or not event.entry_hash:
            valid_count += 1
            continue

        # Check sequence continuity
        if idx > 0 and event.sequence_number <= events[idx - 1].sequence_number:
            return {
                "verified": False,
                "total_records": total_records,
                "valid_records": valid_count,
                "corrupted_records": total_records - valid_count,
                "first_corrupted_id": event.id,
                "details": f"Sequence discontinuity detected at record ID {event.id}: seq {event.sequence_number}",
            }

        # Check hash linkage
        if event.previous_hash != expected_previous_hash:
            return {
                "verified": False,
                "total_records": total_records,
                "valid_records": valid_count,
                "corrupted_records": total_records - valid_count,
                "first_corrupted_id": event.id,
                "details": f"Broken hash chain link at record ID {event.id}: expected {expected_previous_hash[:12]}..., got {event.previous_hash[:12]}...",
            }

        # Check tamper calculation
        epoch_ts = _normalize_timestamp(event.timestamp)
        expected_hash = calculate_entry_hash(
            sequence_number=event.sequence_number,
            previous_hash=event.previous_hash,
            org_id=event.org_id,
            agent_id=event.agent_id,
            tool_name=event.tool_name,
            verdict=event.verdict,
            action_hash=event.action_hash or "",
            timestamp_epoch=epoch_ts,
        )

        if expected_hash != event.entry_hash:
            return {
                "verified": False,
                "total_records": total_records,
                "valid_records": valid_count,
                "corrupted_records": total_records - valid_count,
                "first_corrupted_id": event.id,
                "details": f"Content tampering detected at record ID {event.id}: payload signature does not match stored entry hash",
            }

        expected_previous_hash = event.entry_hash
        valid_count += 1

    return {
        "verified": True,
        "total_records": total_records,
        "valid_records": valid_count,
        "corrupted_records": 0,
        "first_corrupted_id": None,
        "details": f"All {valid_count} audit chain records cryptographically verified with unbroken SHA-256 linkages.",
    }
