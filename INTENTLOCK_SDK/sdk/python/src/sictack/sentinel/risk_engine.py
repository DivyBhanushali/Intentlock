"""
INTENTLOCK SENTINEL – Explainable Behavioral Risk Engine (Phase 2C).

Transforms deterministic behavioral detections and session telemetry into
a calibrated risk score (0.00 to 1.00), classified into 4 standardized Risk Tiers:
- Tier 0: Nominal (0.00 – 0.24)
- Tier 1: Elevated (0.25 – 0.49)
- Tier 2: High Risk (0.50 – 0.74)
- Tier 3: Critical (0.75 – 1.00)

Every assessment includes a transparent, mathematically explainable factor breakdown.
"""

from __future__ import annotations

import math
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sictack.sentinel.models import (
    BehavioralDetectionResult,
    DetectionSeverity,
    RiskAssessment,
    RiskFactorContribution,
    RiskTier,
    TaskSession,
)

# Standardized deterministic severity weights
SEVERITY_WEIGHTS: Dict[DetectionSeverity, float] = {
    DetectionSeverity.LOW: 0.15,
    DetectionSeverity.MEDIUM: 0.35,
    DetectionSeverity.HIGH: 0.65,
    DetectionSeverity.CRITICAL: 0.90,
}


class ExplainableRiskEngine:
    """
    Deterministic risk scoring engine with explainable factor decomposition.
    """

    def __init__(
        self,
        severity_weights: Optional[Dict[DetectionSeverity, float]] = None,
        decay_half_life_seconds: float = 300.0,
    ) -> None:
        self.weights = severity_weights or SEVERITY_WEIGHTS
        self.decay_half_life_seconds = decay_half_life_seconds

    def assess_risk(
        self,
        session: TaskSession,
        detections: List[BehavioralDetectionResult],
        now: Optional[datetime] = None,
    ) -> RiskAssessment:
        """
        Calculates an explainable RiskAssessment from detections and session telemetry.
        Uses independent probability union: S = 1 - Prod(1 - w_i * c_i)
        to prevent artificial clipping while guaranteeing monotonicity and strict boundedness [0.0, 1.0].
        """
        current_time = now or datetime.now(timezone.utc)
        if not detections and session.blocked_executions == 0 and session.scope_violations == 0:
            return RiskAssessment(
                session_id=session.session_id,
                org_id=session.org_id,
                risk_score=0.0,
                risk_tier=RiskTier.TIER_0_NOMINAL,
                factors=[],
                timestamp=current_time,
            )

        factors: List[RiskFactorContribution] = []
        survival_prob = 1.0

        for d in detections:
            weight = self.weights.get(d.severity, 0.20)
            confidence = max(0.1, min(1.0, d.confidence))
            raw_factor_risk = weight * confidence
            
            # Independent risk combination: P(A union B) = 1 - (1 - P(A))*(1 - P(B))
            survival_prob *= (1.0 - raw_factor_risk)

            factors.append(
                RiskFactorContribution(
                    rule_id=d.rule_id,
                    factor_name=d.rule_name,
                    severity=d.severity,
                    raw_score=round(raw_factor_risk, 4),
                    weighted_contribution=round(weight, 4),
                    description=f"{d.reason_code}: {d.evidence}",
                )
            )

        # Baseline risk from session counters if detections haven't already covered them
        if session.scope_violations > 0 and not any(d.rule_id == "SNT-R004" for d in detections):
            scope_risk = min(0.65, 0.35 * session.scope_violations)
            survival_prob *= (1.0 - scope_risk)
            factors.append(
                RiskFactorContribution(
                    rule_id="SESSION-SCOPE",
                    factor_name="Historical Scope Violations",
                    severity=DetectionSeverity.HIGH,
                    raw_score=round(scope_risk, 4),
                    weighted_contribution=0.65,
                    description=f"Session has recorded {session.scope_violations} scope violations",
                )
            )

        combined_score = 1.0 - survival_prob
        final_score = round(max(0.0, min(1.0, combined_score)), 4)
        tier = RiskTier.from_score(final_score)

        return RiskAssessment(
            session_id=session.session_id,
            org_id=session.org_id,
            risk_score=final_score,
            risk_tier=tier,
            factors=factors,
            timestamp=current_time,
        )
