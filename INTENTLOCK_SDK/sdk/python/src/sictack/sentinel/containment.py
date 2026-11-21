"""
INTENTLOCK SENTINEL – Automated Containment Engine (Phase 2D).

Enforces deterministic containment boundaries based on explainable risk assessments:
- Tier 0 (Nominal: 0.00 – 0.24)   -> ALLOW_NOMINAL
- Tier 1 (Elevated: 0.25 – 0.49)  -> STEP_UP_MONITORING / RATE_THROTTLE
- Tier 2 (High Risk: 0.50 – 0.74) -> REQUIRE_APPROVAL
- Tier 3 (Critical: 0.75 – 1.00)  -> QUARANTINE_SUSPEND

Core Security Guarantees:
1. Strict Monotonicity: SENTINEL can only escalate containment; it can NEVER override CORE policy denials.
2. Fail-Closed Boundary: Suspended or Quarantined sessions block execution before handler invocation.
3. Administrative Audit: All manual and automated transitions record immutable containment actions.
"""

from __future__ import annotations

import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional

from sictack.sentinel.models import (
    ContainmentAction,
    ContainmentActionType,
    RiskAssessment,
    RiskTier,
    TaskSession,
    TaskSessionState,
)
from sictack.sentinel.session import TaskSessionManager


class ContainmentPolicy:
    """Configurable containment policy mapping risk tiers to action types."""

    def __init__(
        self,
        tier1_action: ContainmentActionType = ContainmentActionType.STEP_UP_MONITORING,
        tier2_action: ContainmentActionType = ContainmentActionType.REQUIRE_APPROVAL,
        tier3_action: ContainmentActionType = ContainmentActionType.QUARANTINE_SUSPEND,
    ) -> None:
        self.tier1_action = tier1_action
        self.tier2_action = tier2_action
        self.tier3_action = tier3_action

    def map_tier_to_action(self, tier: RiskTier) -> ContainmentActionType:
        if tier == RiskTier.TIER_3_CRITICAL:
            return self.tier3_action
        elif tier == RiskTier.TIER_2_HIGH_RISK:
            return self.tier2_action
        elif tier == RiskTier.TIER_1_ELEVATED:
            return self.tier1_action
        return ContainmentActionType.ALLOW_NOMINAL


class AutomatedContainmentEngine:
    """
    Evaluates risk assessments and executes automated runtime containment on TaskSessions.
    """

    def __init__(
        self,
        session_manager: TaskSessionManager,
        policy: Optional[ContainmentPolicy] = None,
    ) -> None:
        self.session_manager = session_manager
        self.policy = policy or ContainmentPolicy()
        self._lock = threading.Lock()
        self._containment_history: Dict[str, List[ContainmentAction]] = {}

    def enforce(
        self,
        session: TaskSession,
        assessment: RiskAssessment,
    ) -> ContainmentAction:
        """
        Determines and applies the required containment action based on risk assessment.
        """
        action_type = self.policy.map_tier_to_action(assessment.risk_tier)
        reason = f"Risk Tier {assessment.risk_tier.value} (Score: {assessment.risk_score})"

        with self._lock:
            # If critical and session is not already suspended or terminal, suspend session
            if action_type == ContainmentActionType.QUARANTINE_SUSPEND and not session.is_suspended() and not session.is_terminal():
                suspended = self.session_manager.suspend_session(
                    session,
                    reason=f"AUTOMATED_CONTAINMENT: {reason}",
                )
                session.state = suspended.state
                session.suspension_reason = suspended.suspension_reason
                session.suspended_at = suspended.suspended_at
            elif action_type == ContainmentActionType.TERMINATE and not session.is_terminal():
                terminated = self.session_manager.terminate_session(
                    session,
                    reason=f"AUTOMATED_CONTAINMENT_TERMINATION: {reason}",
                )
                session.state = terminated.state
                session.suspension_reason = terminated.suspension_reason

            action = ContainmentAction(
                session_id=session.session_id,
                org_id=session.org_id,
                action_type=action_type,
                trigger_reason=reason,
                status="ACTIVE",
                metadata={
                    "risk_score": assessment.risk_score,
                    "risk_tier": assessment.risk_tier.value,
                    "factor_count": len(assessment.factors),
                },
            )

            if session.session_id not in self._containment_history:
                self._containment_history[session.session_id] = []
            self._containment_history[session.session_id].append(action)

            return action

    def get_history(self, session_id: str) -> List[ContainmentAction]:
        """Returns containment history for the given session ID."""
        with self._lock:
            return list(self._containment_history.get(session_id, []))
