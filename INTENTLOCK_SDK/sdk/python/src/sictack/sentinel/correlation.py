"""
SICTACK SENTINEL — Cross-Agent Behavioral Intelligence & Correlation Engine (Phase 4C).

Correlates telemetry across multiple collaborating AI agents, tracks agent relationship
hierarchies, executes MAD-001 through MAD-010 detectors within sliding time windows,
and computes dynamic hierarchical risk propagation with DAG cycle defense.
"""

from __future__ import annotations

import math
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from sictack.communication import MessageEnvelope
from sictack.models import ToolCall
from sictack.sentinel.models import (
    BehavioralEvent,
    DetectionSeverity,
    TaskSession,
)
from sictack.sentinel.multi_agent_detectors import (
    BaseMultiAgentDetector,
    get_default_multi_agent_detectors,
)
from sictack.sentinel.multi_agent_models import (
    AgentRiskScore,
    MultiAgentDetectionResult,
)


class MultiAgentCorrelationEngine:
    """
    Cross-agent behavioral correlation engine.
    
    Maintains bounded telemetry buffers (sliding time window + maximum event count)
    per organization, correlates inter-agent communications and tool calls, evaluates
    multi-agent attack detectors (MAD-001 through MAD-010), and performs dynamic
    hierarchical risk propagation across agent supervisor-subordinate relationships.
    """

    def __init__(
        self,
        *,
        max_events: int = 1000,
        window_seconds: float = 300.0,
        decay_half_life_seconds: float = 600.0,
        detectors: Optional[List[BaseMultiAgentDetector]] = None,
    ) -> None:
        self.max_events = max_events
        self.window_seconds = window_seconds
        self.decay_half_life_seconds = decay_half_life_seconds
        self.detectors = detectors if detectors is not None else get_default_multi_agent_detectors()

        # Telemetry stores indexed by org_id
        self._events: Dict[str, List[BehavioralEvent]] = defaultdict(list)
        self._messages: Dict[str, List[MessageEnvelope]] = defaultdict(list)
        self._sessions: Dict[str, Dict[str, TaskSession]] = defaultdict(dict)

        # Hierarchy tracking: child_agent_id -> parent_agent_id
        self._parent_map: Dict[str, str] = {}
        # parent_agent_id -> set of child_agent_ids
        self._children_map: Dict[str, Set[str]] = defaultdict(set)

        # Agent Risk state: agent_id -> direct risk (0.0 - 100.0)
        self._direct_risk: Dict[str, float] = defaultdict(float)
        self._last_risk_time: Dict[str, datetime] = {}
        self._recent_detections: Dict[str, List[MultiAgentDetectionResult]] = defaultdict(list)

    # ─── Hierarchy Registration ──────────────────────────────────────────────

    def register_relationship(self, parent_agent_id: str, child_agent_id: str) -> None:
        """Register a parent-child supervisor relationship between two agents."""
        if parent_agent_id == child_agent_id:
            return  # Prevent self-loop
        self._parent_map[child_agent_id] = parent_agent_id
        self._children_map[parent_agent_id].add(child_agent_id)

    def get_parent(self, agent_id: str) -> Optional[str]:
        """Return the parent supervisor agent ID if registered."""
        return self._parent_map.get(agent_id)

    def get_children(self, agent_id: str) -> List[str]:
        """Return all direct child subordinate agent IDs."""
        return sorted(list(self._children_map.get(agent_id, set())))

    # ─── Telemetry Ingestion ─────────────────────────────────────────────────

    def record_event(self, org_id: str, event: BehavioralEvent) -> None:
        """Ingest a behavioral telemetry event into the organization sliding buffer."""
        buf = self._events[org_id]
        buf.append(event)
        self._prune_buffer(org_id)

    def record_message(self, org_id: str, message: MessageEnvelope) -> None:
        """Ingest an authenticated inter-agent message envelope."""
        buf = self._messages[org_id]
        buf.append(message)
        self._prune_buffer(org_id)

    def record_session(self, org_id: str, session: TaskSession) -> None:
        """Track or update a task session."""
        self._sessions[org_id][session.session_id] = session

    def _prune_buffer(self, org_id: str, now: Optional[datetime] = None) -> None:
        """Enforce maximum window time and buffer capacity."""
        current_time = now or datetime.now(timezone.utc)
        cutoff_epoch = current_time.timestamp() - self.window_seconds

        events = self._events[org_id]
        self._events[org_id] = [
            e for e in events[-self.max_events:]
            if e.timestamp.timestamp() >= cutoff_epoch
        ]

        messages = self._messages[org_id]
        self._messages[org_id] = [
            m for m in messages[-self.max_events:]
            if m.timestamp.timestamp() >= cutoff_epoch
        ]

    # ─── Threat Correlation & Detection ──────────────────────────────────────

    def evaluate(
        self,
        org_id: str,
        current_call: Optional[ToolCall] = None,
        now: Optional[datetime] = None,
    ) -> List[MultiAgentDetectionResult]:
        """
        Evaluate all multi-agent threat detectors across buffered telemetry.
        Updates risk scores for flagged agents and returns any detections.
        """
        self._prune_buffer(org_id, now)
        events = self._events.get(org_id, [])
        sessions = self._sessions.get(org_id, {})
        messages = self._messages.get(org_id, [])

        detections: List[MultiAgentDetectionResult] = []

        for detector in self.detectors:
            try:
                res = detector.evaluate(
                    org_id=org_id,
                    events=events,
                    sessions=sessions,
                    messages=messages,
                    current_call=current_call,
                )
                if res:
                    detections.append(res)
                    self._recent_detections[org_id].append(res)
                    # Apply risk bump based on detection severity
                    severity_risk_bumps = {
                        DetectionSeverity.LOW: 10.0,
                        DetectionSeverity.MEDIUM: 25.0,
                        DetectionSeverity.HIGH: 50.0,
                        DetectionSeverity.CRITICAL: 85.0,
                    }
                    bump = severity_risk_bumps.get(res.severity, 20.0)
                    self.update_agent_risk(res.primary_agent_id, bump, now)
                    for correlated_id in res.correlated_agent_ids:
                        self.update_agent_risk(correlated_id, bump * 0.5, now)
            except Exception:
                # Individual detector failure must not crash the correlation engine
                continue

        return detections

    # ─── Dynamic Risk Propagation & Decay ────────────────────────────────────

    def update_agent_risk(
        self,
        agent_id: str,
        delta: float,
        now: Optional[datetime] = None,
    ) -> None:
        """Apply a direct risk increase to an agent, factoring in time decay."""
        current_time = now or datetime.now(timezone.utc)
        self._apply_decay(agent_id, current_time)
        new_val = min(100.0, max(0.0, self._direct_risk[agent_id] + delta))
        self._direct_risk[agent_id] = new_val
        self._last_risk_time[agent_id] = current_time

    def _apply_decay(self, agent_id: str, current_time: datetime) -> None:
        """Apply exponential time decay to an agent's direct risk."""
        last_time = self._last_risk_time.get(agent_id)
        if not last_time:
            self._last_risk_time[agent_id] = current_time
            return

        elapsed_seconds = (current_time - last_time).total_seconds()
        if elapsed_seconds > 0 and self.decay_half_life_seconds > 0:
            current_risk = self._direct_risk.get(agent_id, 0.0)
            decay_factor = math.pow(0.5, elapsed_seconds / self.decay_half_life_seconds)
            self._direct_risk[agent_id] = round(current_risk * decay_factor, 4)
            self._last_risk_time[agent_id] = current_time

    def get_agent_risk(
        self,
        agent_id: str,
        now: Optional[datetime] = None,
    ) -> AgentRiskScore:
        """
        Compute direct, propagated, and effective risk for an agent.
        
        Propagates risk upward from subordinate agents using:
        R_propagated = min(100.0, sum(0.5 * R_child for child in children))
        Includes strict DAG cycle defense to prevent infinite recursion.
        """
        current_time = now or datetime.now(timezone.utc)
        self._apply_decay(agent_id, current_time)

        direct = self._direct_risk.get(agent_id, 0.0)
        propagated = self._calculate_propagated_risk(agent_id, visited=set(), now=current_time)
        effective = min(100.0, max(direct, direct * 0.5 + propagated * 0.5))

        children = self.get_children(agent_id)
        return AgentRiskScore(
            agent_id=agent_id,
            direct_risk=round(direct, 2),
            propagated_risk=round(propagated, 2),
            effective_risk=round(effective, 2),
            subordinate_agent_ids=children,
            last_updated=current_time,
        )

    def _calculate_propagated_risk(
        self,
        agent_id: str,
        visited: Set[str],
        now: datetime,
    ) -> float:
        """Recursively calculate propagated risk from all subordinates with cycle defense."""
        if agent_id in visited:
            return 0.0  # DAG cycle defense: break infinite loop
        visited.add(agent_id)

        children = self.get_children(agent_id)
        if not children:
            return 0.0

        total_child_risk = 0.0
        for child_id in children:
            self._apply_decay(child_id, now)
            child_direct = self._direct_risk.get(child_id, 0.0)
            child_sub_propagated = self._calculate_propagated_risk(child_id, visited.copy(), now)
            child_effective = min(100.0, max(child_direct, child_direct * 0.5 + child_sub_propagated * 0.5))
            total_child_risk += 0.5 * child_effective

        return min(100.0, total_child_risk)

    def get_fleet_risk(
        self,
        org_id: str,
        now: Optional[datetime] = None,
    ) -> Dict[str, Any]:
        """
        Calculate aggregate fleet-wide risk posture and summary across all monitored agents.
        """
        current_time = now or datetime.now(timezone.utc)
        all_agent_ids: Set[str] = set()

        for event in self._events.get(org_id, []):
            if event.agent_id:
                all_agent_ids.add(event.agent_id)
        for msg in self._messages.get(org_id, []):
            all_agent_ids.add(msg.sender_id)
            all_agent_ids.add(msg.recipient_id)
        for child, parent in self._parent_map.items():
            all_agent_ids.add(child)
            all_agent_ids.add(parent)
        for aid in self._direct_risk.keys():
            all_agent_ids.add(aid)

        scores: Dict[str, AgentRiskScore] = {}
        for aid in sorted(all_agent_ids):
            scores[aid] = self.get_agent_risk(aid, current_time)

        if scores:
            fleet_avg = sum(s.effective_risk for s in scores.values()) / len(scores)
            fleet_max = max(s.effective_risk for s in scores.values())
        else:
            fleet_avg = 0.0
            fleet_max = 0.0

        # Overall fleet risk combines mean and peak
        fleet_risk = round(min(100.0, 0.4 * fleet_avg + 0.6 * fleet_max), 2)

        return {
            "org_id": org_id,
            "fleet_risk_score": fleet_risk,
            "monitored_agents_count": len(scores),
            "agent_risk_scores": {k: v.model_dump() for k, v in scores.items()},
            "recent_detections_count": len(self._recent_detections.get(org_id, [])),
            "timestamp": current_time.isoformat(),
        }
