"""
SICTACK SENTINEL — Advanced Multi-Agent Threat Detectors (Phase 4C).

Implements 10 deterministic multi-agent behavioral detectors (MAD-001 to MAD-010)
protecting autonomous agent fleets against coordinated adversarial attacks:

1. MAD-001: Cross-Agent Prompt Injection Propagation
2. MAD-002: Unauthorized Lateral Movement
3. MAD-003: Delegation Privilege Abuse
4. MAD-004: Agent Identity Impersonation Attempt
5. MAD-005: Coordinated Resource Probing
6. MAD-006: Distributed Execution Budget Abuse
7. MAD-007: Suspicious / Circular Delegation Chains
8. MAD-008: Coordinated Objective Deviation
9. MAD-009: Multi-Agent Data Exfiltration Indicators
10. MAD-010: Containment Evasion Attempts
"""

from __future__ import annotations

import re
import unicodedata
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from sictack.communication import MessageEnvelope
from sictack.models import ToolCall
from sictack.sentinel.models import (
    BehavioralEvent,
    BehavioralEventType,
    DetectionSeverity,
    TaskSession,
    TaskSessionState,
)
from sictack.sentinel.multi_agent_models import MultiAgentDetectionResult


class BaseMultiAgentDetector(ABC):
    """Abstract base class for multi-agent behavioral detectors."""

    rule_id: str
    rule_name: str
    default_severity: DetectionSeverity

    @abstractmethod
    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        """
        Evaluate multi-agent telemetry across an organization within the active
        correlation window.
        """
        pass


# ─── MAD-001: Cross-Agent Prompt Injection Propagation ───────────────────────

class CrossAgentInjectionPropagationDetector(BaseMultiAgentDetector):
    """
    MAD-001: Detects prompt injection patterns and instruction override sequences
    in payloads exchanged between agents.
    """
    rule_id = "MAD-001"
    rule_name = "Cross-Agent Prompt Injection Propagation"
    default_severity = DetectionSeverity.CRITICAL

    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)", re.IGNORECASE),
        re.compile(r"(system\s+update|system\s+override|admin\s+mode|root\s+access)", re.IGNORECASE),
        re.compile(r"(disregard|bypass)\s+security\s+(policy|rules|controls)", re.IGNORECASE),
        re.compile(r"(dump|leak|exfiltrate|reveal)\s+(system\s+prompt|credentials|api_key|secret)", re.IGNORECASE),
    ]

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        if not messages:
            return None

        for msg in messages:
            # Flatten payload values to inspect text
            payload_str = json_str = ""
            try:
                import json
                payload_str = json.dumps(msg.payload)
            except Exception:
                payload_str = str(msg.payload)

            norm_text = unicodedata.normalize("NFKC", payload_str)
            for pat in self.INJECTION_PATTERNS:
                if pat.search(norm_text):
                    return MultiAgentDetectionResult(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=self.default_severity,
                        confidence=0.98,
                        primary_agent_id=msg.sender_agent_id,
                        correlated_agent_ids=[msg.recipient_agent_id],
                        session_id=msg.session_id,
                        reason_code="CROSS_AGENT_INJECTION_DETECTED",
                        explanation=f"Agent '{msg.sender_agent_id}' transmitted a prompt injection pattern to '{msg.recipient_agent_id}'.",
                        evidence={
                            "message_id": msg.message_id,
                            "matched_pattern": pat.pattern,
                            "snippet": norm_text[:256],
                        },
                        recommended_action="QUARANTINE_SENDER_AND_RECIPIENT",
                    )
        return None


# ─── MAD-002: Unauthorized Lateral Movement ──────────────────────────────────

class UnauthorizedLateralMovementDetector(BaseMultiAgentDetector):
    """
    MAD-002: Detects agents attempting to communicate with peer agents or invoke
    tools outside their authorized task scope and hierarchy.
    """
    rule_id = "MAD-002"
    rule_name = "Unauthorized Lateral Movement"
    default_severity = DetectionSeverity.HIGH

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        # Detect cross-session execution or unlinked agent calls
        if current_call and current_call.session_id:
            sess = sessions.get(current_call.session_id)
            if sess and sess.agent_id != current_call.agent_id:
                # Agent calling inside a session registered to another agent without delegation
                if not current_call.delegation_id:
                    return MultiAgentDetectionResult(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=self.default_severity,
                        confidence=0.95,
                        primary_agent_id=current_call.agent_id,
                        correlated_agent_ids=[sess.agent_id],
                        session_id=current_call.session_id,
                        reason_code="LATERAL_SESSION_INTRUSION",
                        explanation=f"Agent '{current_call.agent_id}' attempted to execute tools within session '{sess.session_id}' owned by '{sess.agent_id}' without delegation.",
                        evidence={"tool_name": current_call.tool_name},
                        recommended_action="SUSPEND_INVOKER",
                    )
        return None


# ─── MAD-003: Delegation Privilege Abuse ─────────────────────────────────────

class DelegationPrivilegeAbuseDetector(BaseMultiAgentDetector):
    """
    MAD-003: Detects excessive or overly permissive delegation creation,
    such as wildcard permissions or abnormal time-to-live.
    """
    rule_id = "MAD-003"
    rule_name = "Delegation Privilege Abuse"
    default_severity = DetectionSeverity.HIGH

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        for e in events:
            if e.event_type == BehavioralEventType.DELEGATION_CREATED:
                payload = e.event_payload or {}
                perms = payload.get("delegated_permissions", [])
                ttl = payload.get("ttl_seconds", 3600)
                # Over-scoping: granting '*' or more than 10 permissions
                if "*" in perms or len(perms) > 10:
                    return MultiAgentDetectionResult(
                        rule_id=self.rule_id,
                        rule_name=self.rule_name,
                        severity=self.default_severity,
                        confidence=0.90,
                        primary_agent_id=e.agent_id,
                        correlated_agent_ids=[payload.get("child_agent_id", "")],
                        session_id=e.session_id,
                        reason_code="OVERLY_BROAD_DELEGATION",
                        explanation=f"Agent '{e.agent_id}' issued an overly broad delegation containing wildcards or excessive capabilities.",
                        evidence={"permissions": perms, "ttl_seconds": ttl},
                        recommended_action="AUDIT_DELEGATION",
                    )
        return None


# ─── MAD-004: Agent Identity Impersonation Attempt ───────────────────────────

class AgentIdentityImpersonationDetector(BaseMultiAgentDetector):
    """
    MAD-004: Detects attempts by one agent to impersonate another agent identity
    or use cryptographic tokens belonging to another agent.
    """
    rule_id = "MAD-004"
    rule_name = "Agent Identity Impersonation Attempt"
    default_severity = DetectionSeverity.CRITICAL

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        for e in events:
            if e.event_payload.get("violation_type") == "CONFUSED_DEPUTY" or "confused deputy" in (e.execution_error or "").lower():
                return MultiAgentDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=1.0,
                    primary_agent_id=e.agent_id,
                    correlated_agent_ids=[e.event_payload.get("target_deputy", "")],
                    session_id=e.session_id,
                    reason_code="AGENT_IDENTITY_IMPERSONATION",
                    explanation=f"Agent '{e.agent_id}' attempted to spoof or tamper with identity credentials of another agent.",
                    evidence={"error": e.execution_error, "payload": e.event_payload},
                    recommended_action="IMMEDIATE_ISOLATION",
                )
        return None


# ─── MAD-005: Coordinated Resource Probing ───────────────────────────────────

class CoordinatedResourceProbingDetector(BaseMultiAgentDetector):
    """
    MAD-005: Detects multiple distinct agents in the same tenant repeatedly
    probing the same restricted resource or table across sessions.
    """
    rule_id = "MAD-005"
    rule_name = "Coordinated Resource Probing"
    default_severity = DetectionSeverity.HIGH

    def __init__(self, resource_threshold: int = 3) -> None:
        self.resource_threshold = resource_threshold

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        # Track denied resources -> Set[agent_id]
        denied_targets: Dict[str, Set[str]] = {}
        for e in events:
            if e.verdict == "DENY" and (e.resource_id or e.tool_name):
                target = e.resource_id or e.tool_name
                denied_targets.setdefault(target, set()).add(e.agent_id)

        for target, agents in denied_targets.items():
            if len(agents) >= self.resource_threshold:
                agent_list = sorted(list(agents))
                return MultiAgentDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=0.88,
                    primary_agent_id=agent_list[0],
                    correlated_agent_ids=agent_list[1:],
                    reason_code="COORDINATED_RESOURCE_PROBING",
                    explanation=f"Multiple agents ({', '.join(agent_list)}) attempted unauthorized access against restricted resource '{target}'.",
                    evidence={"resource": target, "probing_agents": agent_list},
                    recommended_action="STEP_UP_MONITORING_AND_THROTTLE",
                )
        return None


# ─── MAD-006: Distributed Execution Budget Abuse ─────────────────────────────

class DistributedBudgetAbuseDetector(BaseMultiAgentDetector):
    """
    MAD-006: Detects rapid execution attempts across child agents designed to
    deplete or evade execution budget limits.
    """
    rule_id = "MAD-006"
    rule_name = "Distributed Execution Budget Abuse"
    default_severity = DetectionSeverity.HIGH

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        # Count budget violation events
        budget_violations = [
            e for e in events
            if "budget exceeded" in (e.execution_error or "").lower()
            or e.event_payload.get("reason") == "EXECUTION_BUDGET_EXCEEDED"
        ]
        if len(budget_violations) >= 2:
            affected = sorted(list({e.agent_id for e in budget_violations}))
            return MultiAgentDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.92,
                primary_agent_id=affected[0],
                correlated_agent_ids=affected[1:],
                reason_code="DISTRIBUTED_BUDGET_EXHAUSTION",
                explanation=f"Multiple budget exhaustion violations detected across agents ({', '.join(affected)}).",
                evidence={"violation_count": len(budget_violations)},
                recommended_action="SUSPEND_PARENT_HIERARCHY",
            )
        return None


# ─── MAD-007: Suspicious Delegation Chains ───────────────────────────────────

class SuspiciousDelegationChainDetector(BaseMultiAgentDetector):
    """
    MAD-007: Detects cyclic, deeply nested, or rapidly expanding delegation chains.
    """
    rule_id = "MAD-007"
    rule_name = "Suspicious Delegation Chains"
    default_severity = DetectionSeverity.CRITICAL

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        # Detect any session with depth >= 3 or delegation violations
        for s_id, sess in sessions.items():
            if sess.delegation_depth > 3:
                return MultiAgentDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=1.0,
                    primary_agent_id=sess.agent_id,
                    correlated_agent_ids=[sess.parent_agent_id] if sess.parent_agent_id else [],
                    session_id=sess.session_id,
                    reason_code="EXCESSIVE_DELEGATION_DEPTH",
                    explanation=f"Delegation depth ({sess.delegation_depth}) exceeds maximum authorized ceiling (3).",
                    evidence={"depth": sess.delegation_depth, "session_id": sess.session_id},
                    recommended_action="REVOKE_AND_SUSPEND",
                )
        return None


# ─── MAD-008: Coordinated Objective Deviation ────────────────────────────────

class CoordinatedObjectiveDeviationDetector(BaseMultiAgentDetector):
    """
    MAD-008: Detects workers executing destructive or unauthorized actions
    that directly contradict the supervisor's stated goal.
    """
    rule_id = "MAD-008"
    rule_name = "Coordinated Objective Deviation"
    default_severity = DetectionSeverity.CRITICAL

    DESTRUCTIVE_ACTIONS = {"delete", "drop", "terminate", "destroy", "format", "wipe", "exfiltrate"}

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        if not current_call or not current_call.session_id:
            return None

        sess = sessions.get(current_call.session_id)
        if not sess or not sess.parent_session_id:
            return None

        parent_sess = sessions.get(sess.parent_session_id)
        if not parent_sess:
            return None

        parent_obj_lower = parent_sess.task_objective.lower()
        tool_lower = current_call.tool_name.lower()

        # If parent objective is read/analyze, but worker calls destructive action
        is_read_only = any(w in parent_obj_lower for w in ["read", "analyze", "query", "view", "report"])
        is_destructive = any(d in tool_lower for d in self.DESTRUCTIVE_ACTIONS)

        if is_read_only and is_destructive:
            return MultiAgentDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.96,
                primary_agent_id=current_call.agent_id,
                correlated_agent_ids=[parent_sess.agent_id],
                session_id=sess.session_id,
                reason_code="HIERARCHICAL_OBJECTIVE_VIOLATION",
                explanation=f"Worker '{current_call.agent_id}' attempted destructive action '{current_call.tool_name}' under read-only supervisor objective '{parent_sess.task_objective}'.",
                evidence={
                    "parent_objective": parent_sess.task_objective,
                    "invoked_tool": current_call.tool_name,
                },
                recommended_action="TARGETED_WORKER_CONTAINMENT",
            )
        return None


# ─── MAD-009: Multi-Agent Data Exfiltration Indicators ───────────────────────

class MultiAgentExfiltrationDetector(BaseMultiAgentDetector):
    """
    MAD-009: Aggregates observable exfiltration indicators across multiple
    agents within an organization.
    """
    rule_id = "MAD-009"
    rule_name = "Multi-Agent Data Exfiltration Indicators"
    default_severity = DetectionSeverity.HIGH

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        exfil_events = [
            e for e in events
            if e.event_payload.get("recipient") or "send" in (e.tool_name or "").lower() or "mail" in (e.tool_name or "").lower()
        ]
        if len(exfil_events) >= 3:
            agents = sorted(list({e.agent_id for e in exfil_events}))
            return MultiAgentDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.85,
                primary_agent_id=agents[0],
                correlated_agent_ids=agents[1:],
                reason_code="AGGREGATED_EXFILTRATION_BURST",
                explanation=f"Coordinated external dispatch activity observed across {len(agents)} agents.",
                evidence={"dispatch_count": len(exfil_events), "agents": agents},
                recommended_action="RATE_THROTTLE_AND_AUDIT",
            )
        return None


# ─── MAD-010: Containment Evasion Attempts ───────────────────────────────────

class ContainmentEvasionDetector(BaseMultiAgentDetector):
    """
    MAD-010: Detects agents attempting tool invocations or spawning subtasks
    after their session or parent session has been suspended or terminated.
    """
    rule_id = "MAD-010"
    rule_name = "Containment Evasion Attempts"
    default_severity = DetectionSeverity.CRITICAL

    def evaluate(
        self,
        *,
        org_id: str,
        events: List[BehavioralEvent],
        sessions: Dict[str, TaskSession],
        messages: Optional[List[MessageEnvelope]] = None,
        current_call: Optional[ToolCall] = None,
    ) -> Optional[MultiAgentDetectionResult]:
        for e in events:
            if "suspended" in (e.execution_error or "").lower() or "terminal" in (e.execution_error or "").lower():
                return MultiAgentDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=1.0,
                    primary_agent_id=e.agent_id,
                    session_id=e.session_id,
                    reason_code="CONTAINMENT_EVASION_ATTEMPT",
                    explanation=f"Agent '{e.agent_id}' attempted execution against suspended/contained session '{e.session_id}'.",
                    evidence={"error": e.execution_error},
                    recommended_action="HARD_TERMINATION",
                )
        return None


def get_default_multi_agent_detectors() -> List[BaseMultiAgentDetector]:
    """Return an initialized list of all 10 default multi-agent threat detectors."""
    return [
        CrossAgentInjectionPropagationDetector(),
        UnauthorizedLateralMovementDetector(),
        DelegationPrivilegeAbuseDetector(),
        AgentIdentityImpersonationDetector(),
        CoordinatedResourceProbingDetector(),
        DistributedBudgetAbuseDetector(),
        SuspiciousDelegationChainDetector(),
        CoordinatedObjectiveDeviationDetector(),
        MultiAgentExfiltrationDetector(),
        ContainmentEvasionDetector(),
    ]


