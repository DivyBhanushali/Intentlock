"""
SICTACK Provenance Graph & Lineage Tracker (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Maintains a bounded, cycle-protected causal Directed Acyclic Graph (DAG) of
data provenance records across agent executions and organizational tenants.
"""

from __future__ import annotations

import logging
import threading
from collections import deque
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from sictack.provenance.models import (
    DataProvenanceRecord,
    ProvenanceLineageNode,
    SourceType,
    TrustLevel,
    compute_content_hash,
)
from sictack.provenance.trust import TrustPolicyEngine
from sictack.exceptions import SictackError

logger = logging.getLogger("sictack.provenance.graph")


class ProvenanceCycleError(SictackError):
    """Raised when a circular parent reference is detected in provenance lineage."""
    pass


class ProvenanceTracker:
    """
    Tenant-isolated provenance graph tracker.
    Maintains causal lineage with bounded retention and strict DAG cycle defense.
    """

    DEFAULT_SECRET_KEY = "sictack_provenance_signing_secret_default_key"
    MAX_RECORDS_PER_ORG = 2000

    def __init__(self, signing_key: Optional[str] = None) -> None:
        self.signing_key = signing_key or self.DEFAULT_SECRET_KEY
        self._lock = threading.RLock()
        # Storage: org_id -> record_id -> DataProvenanceRecord
        self._records: Dict[str, Dict[str, DataProvenanceRecord]] = {}
        # Order tracking for LRU / FIFO bounded pruning: org_id -> deque of record_id
        self._order: Dict[str, deque[str]] = {}

    def record_provenance(
        self,
        *,
        org_id: str,
        session_id: str = "",
        agent_id: str = "default-agent",
        source_type: SourceType = SourceType.USER_INPUT,
        source_identifier: str = "",
        input_content: Any = None,
        output_content: Any = None,
        tool_invocation_id: Optional[str] = None,
        parent_provenance_ids: Optional[List[str]] = None,
        transformation_type: Optional[str] = None,
        data_classification: str = "CONFIDENTIAL",
        explicit_trust_level: Optional[TrustLevel] = None,
        authorization_decision_id: Optional[str] = None,
        incident_id: Optional[str] = None,
        is_authoritative_component: bool = False,
        metadata: Optional[Dict[str, Any]] = None,
        record_id: Optional[str] = None,
    ) -> DataProvenanceRecord:
        """
        Create, cryptographically sign, and register a new provenance record.
        Enforces DAG cycle defenses and deterministic trust propagation.
        """
        with self._lock:
            if org_id not in self._records:
                self._records[org_id] = {}
                self._order[org_id] = deque()

            parents = parent_provenance_ids or []

            # 1. Cycle prevention check
            if record_id:
                for pid in parents:
                    if pid == record_id:
                        raise ProvenanceCycleError(f"Direct circular dependency: {record_id} cannot be its own parent.")
                    visited_ids: Set[str] = set()
                    queue: deque[str] = deque([pid])
                    while queue:
                        curr = queue.popleft()
                        if curr == record_id:
                            raise ProvenanceCycleError(f"Causal cycle detected: {record_id} is an ancestor of parent {pid}.")
                        visited_ids.add(curr)
                        p_rec = self._records[org_id].get(curr)
                        if p_rec:
                            for next_p in p_rec.parent_provenance_ids:
                                if next_p not in visited_ids:
                                    queue.append(next_p)

            # 2. Resolve parent records
            parent_objs: List[DataProvenanceRecord] = []
            for pid in parents:
                parent_rec = self._records[org_id].get(pid)
                if parent_rec:
                    parent_objs.append(parent_rec)

            # 2. Resolve effective trust level via TrustPolicyEngine
            effective_trust = TrustPolicyEngine.resolve_effective_trust(
                parent_records=parent_objs,
                source_type=source_type,
                explicit_trust=explicit_trust_level,
                is_authoritative_component=is_authoritative_component,
            )

            # 3. Compute SHA-256 hashes of input and output content
            in_hash = compute_content_hash(input_content) if input_content is not None else ""
            out_hash = compute_content_hash(output_content) if output_content is not None else ""

            # 4. Construct record
            kwargs: Dict[str, Any] = {
                "org_id": org_id,
                "session_id": session_id,
                "agent_id": agent_id,
                "source_type": source_type,
                "source_identifier": source_identifier,
                "tool_invocation_id": tool_invocation_id,
                "input_content_hash": in_hash,
                "output_content_hash": out_hash,
                "data_classification": data_classification,
                "trust_level": effective_trust,
                "parent_provenance_ids": parents,
                "transformation_type": transformation_type,
                "authorization_decision_id": authorization_decision_id,
                "incident_id": incident_id,
                "metadata": metadata or {},
                "timestamp": datetime.now(timezone.utc),
            }
            if record_id:
                kwargs["record_id"] = record_id
            record = DataProvenanceRecord(**kwargs)

            # 5. Sign the record with HMAC-SHA256
            sig = record.compute_signature(self.signing_key)
            signed_record = record.model_copy(update={"signature": sig})

            # 6. Store and enforce bounded memory limits
            self._records[org_id][signed_record.record_id] = signed_record
            self._order[org_id].append(signed_record.record_id)

            if len(self._order[org_id]) > self.MAX_RECORDS_PER_ORG:
                oldest_id = self._order[org_id].popleft()
                self._records[org_id].pop(oldest_id, None)

            return signed_record

    def get_provenance(self, org_id: str, record_id: str) -> Optional[DataProvenanceRecord]:
        """Retrieve a specific signed provenance record within a tenant."""
        with self._lock:
            return self._records.get(org_id, {}).get(record_id)

    def get_lineage(
        self,
        org_id: str,
        record_id: str,
        max_depth: int = 15,
    ) -> Optional[ProvenanceLineageNode]:
        """
        Build the complete causal ancestry DAG starting from record_id.
        Guarantees loop termination with visited set.
        """
        with self._lock:
            rec = self.get_provenance(org_id, record_id)
            if not rec:
                return None

            visited: Set[str] = set()

            def _build_node(r: DataProvenanceRecord, depth: int) -> ProvenanceLineageNode:
                if depth <= 0 or r.record_id in visited:
                    return ProvenanceLineageNode(record=r, effective_trust_level=r.trust_level)

                visited.add(r.record_id)
                ancestors: List[ProvenanceLineageNode] = []

                for pid in r.parent_provenance_ids:
                    if pid in visited:
                        # Cycle detected; terminate branch
                        logger.warning(f"Cycle detected in provenance graph at {pid}; halting descent.")
                        continue
                    parent_rec = self.get_provenance(org_id, pid)
                    if parent_rec:
                        ancestors.append(_build_node(parent_rec, depth - 1))

                return ProvenanceLineageNode(
                    record=r,
                    ancestors=ancestors,
                    effective_trust_level=r.trust_level,
                )

            return _build_node(rec, max_depth)

    def list_records(
        self,
        org_id: str,
        session_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        source_type: Optional[SourceType] = None,
        trust_level: Optional[TrustLevel] = None,
        limit: int = 50,
    ) -> List[DataProvenanceRecord]:
        """Query stored provenance records for a tenant with optional filtering."""
        with self._lock:
            records = list(self._records.get(org_id, {}).values())

            if session_id:
                records = [r for r in records if r.session_id == session_id]
            if agent_id:
                records = [r for r in records if r.agent_id == agent_id]
            if source_type:
                records = [r for r in records if r.source_type == source_type]
            if trust_level:
                records = [r for r in records if r.trust_level == trust_level]

            records.sort(key=lambda r: r.timestamp, reverse=True)
            return records[:limit]
