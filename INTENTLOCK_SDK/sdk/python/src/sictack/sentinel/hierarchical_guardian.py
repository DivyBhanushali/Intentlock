"""
SICTACK SENTINEL — Hierarchical Objective Guardian (Phase 4C).

Evaluates intent fidelity and goal alignment across multi-tiered agent delegation hierarchies:
User Intent <-> Supervisor Objective <-> Worker Objective <-> Proposed Action.

Detects subtle objective drift, prompt injection overrides in intermediate instructions,
and scope expansion attacks before worker tool execution occurs.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Set

from sictack.sentinel.models import DetectionSeverity
from sictack.sentinel.multi_agent_models import ObjectiveAlignmentAssessment
from sictack.sentinel.objective_guardian import (
    DISCLOSURE_PATTERNS,
    INJECTION_PATTERNS,
    STOP_WORDS,
    _tokenize,
)



# Comprehensive prompt injection patterns for multi-agent instruction hierarchies
HIERARCHICAL_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions", re.IGNORECASE),
    re.compile(r"override\s+(?:objective|guardrails|policy|security)", re.IGNORECASE),
    re.compile(r"system\s+prompt\s+override", re.IGNORECASE),
    re.compile(r"bypass\s+(?:policy|rules|sandbox|gateway)", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"disregard\s+(?:prior|previous)\s+context", re.IGNORECASE),
    re.compile(r"reveal\s+(?:api_key|secret|credentials|password)", re.IGNORECASE),
]


class HierarchicalObjectiveGuardian:
    """
    Evaluator verifying multi-level objective alignment across delegated agent hierarchies.
    
    Verifies that:
    1. The supervisor's mandate derives from the user's root objective.
    2. The worker's assigned sub-objective remains within the supervisor's mandate.
    3. The worker's proposed action directly serves the assigned sub-objective.
    4. No intermediate prompts introduce instruction overrides or data exfiltration paths.
    """

    def __init__(
        self,
        *,
        min_overlap_threshold: float = 0.20,
        drift_threshold: float = 0.70,
        strict_user_alignment: bool = True,
    ) -> None:
        self.min_overlap_threshold = min_overlap_threshold
        self.drift_threshold = drift_threshold
        self.strict_user_alignment = strict_user_alignment


    def compute_similarity(self, text_a: str, text_b: str) -> float:
        """Calculate lexical overlap coefficient over filtered keywords."""
        tokens_a = {w.rstrip("s") for w in re.split(r"[\s_\-\(\)\'\",\.:;]+", text_a.lower()) if len(w) > 2 and w not in STOP_WORDS}
        tokens_b = {w.rstrip("s") for w in re.split(r"[\s_\-\(\)\'\",\.:;]+", text_b.lower()) if len(w) > 2 and w not in STOP_WORDS}
        if not tokens_a or not tokens_b:
            return 0.5
        common = tokens_a & tokens_b
        smaller = min(len(tokens_a), len(tokens_b))
        return round(len(common) / smaller, 3) if smaller else 0.0


    def scan_for_injections(self, text: str) -> List[str]:
        """Detect injection and override patterns in objective or instruction text."""
        anomalies: List[str] = []
        for pat in HIERARCHICAL_INJECTION_PATTERNS:
            if pat.search(text):
                anomalies.append(f"Prompt injection pattern detected: '{pat.pattern}'")
        for pat in DISCLOSURE_PATTERNS:
            if pat.search(text):
                anomalies.append(f"Sensitive data disclosure pattern detected: '{pat.pattern}'")
        return anomalies


    def evaluate_hierarchy(
        self,
        *,
        user_objective: str,
        supervisor_objective: str,
        worker_objective: str,
        proposed_action: Optional[str] = None,
    ) -> ObjectiveAlignmentAssessment:
        """
        Evaluate full transitive alignment: User -> Supervisor -> Worker [-> Action].
        """
        anomalies: List[str] = []

        # 1. Check for prompt injection in all text tiers
        sup_injections = self.scan_for_injections(supervisor_objective)
        if sup_injections:
            anomalies.extend([f"Supervisor objective: {i}" for i in sup_injections])

        work_injections = self.scan_for_injections(worker_objective)
        if work_injections:
            anomalies.extend([f"Worker objective: {i}" for i in work_injections])

        if proposed_action:
            action_injections = self.scan_for_injections(proposed_action)
            if action_injections:
                anomalies.extend([f"Proposed action: {i}" for i in action_injections])

        # 2. Similarity evaluations
        sim_user_sup = self.compute_similarity(user_objective, supervisor_objective)
        sim_sup_work = self.compute_similarity(supervisor_objective, worker_objective)
        
        sim_work_act = 1.0
        sim_user_act = 1.0
        if proposed_action:
            sim_work_act = self.compute_similarity(worker_objective, proposed_action)
            sim_user_act = self.compute_similarity(user_objective, proposed_action)

        # 3. Deviation scoring
        # Direct parent-child steps have weight, plus transitive step from root user
        weights = [0.35, 0.35, 0.15, 0.15] if proposed_action else [0.5, 0.5]
        sims = [sim_user_sup, sim_sup_work, sim_work_act, sim_user_act] if proposed_action else [sim_user_sup, sim_sup_work]

        # Calculate average similarity
        weighted_sim = sum(w * s for w, s in zip(weights, sims))
        deviation_score = round(max(0.0, min(1.0, 1.0 - weighted_sim)), 3)

        # Evaluate drift anomalies
        if sim_user_sup < self.min_overlap_threshold:
            anomalies.append(f"Supervisor objective drifts from user intent (sim: {sim_user_sup})")
        if sim_sup_work < self.min_overlap_threshold:
            anomalies.append(f"Worker objective drifts from supervisor mandate (sim: {sim_sup_work})")
        if proposed_action and sim_work_act < self.min_overlap_threshold:
            anomalies.append(f"Proposed action diverges from worker objective (sim: {sim_work_act})")
        if proposed_action and self.strict_user_alignment and sim_user_act == 0.0 and sim_work_act < self.min_overlap_threshold:
            anomalies.append(f"Proposed action severely diverges from root user objective (sim: {sim_user_act})")

        # 4. Severity and Alignment Determination
        is_aligned = len(anomalies) == 0

        if any("injection" in a.lower() or "disclosure" in a.lower() for a in anomalies):
            severity = DetectionSeverity.CRITICAL
            is_aligned = False
        elif len(anomalies) > 1 or deviation_score >= 0.9:
            severity = DetectionSeverity.HIGH
            is_aligned = False
        elif len(anomalies) == 1:
            severity = DetectionSeverity.MEDIUM
            is_aligned = False
        else:
            severity = DetectionSeverity.LOW
            is_aligned = True

        explanation = (
            "Hierarchical objectives are aligned across all tiers."
            if is_aligned
            else f"Objective deviation or anomaly detected across delegation chain: {'; '.join(anomalies)}"
        )

        return ObjectiveAlignmentAssessment(
            user_objective=user_objective,
            supervisor_objective=supervisor_objective,
            worker_objective=worker_objective,
            is_aligned=is_aligned,
            deviation_score=deviation_score,
            severity=severity,
            detected_anomalies=anomalies,
            explanation=explanation,
            timestamp=datetime.now(timezone.utc),
        )
