"""
INTENTLOCK – Risk Scoring Engine.

The :class:`RiskEngine` computes an *informational* risk score for a
proposed tool invocation.  The score is **advisory only** — it never
overrides a policy decision.  It is recorded in the :class:`Decision`
and :class:`AuditEvent` for human review.

Score components
~~~~~~~~~~~~~~~~
- Tool sensitivity (0-10) → 0.0 – 0.50
- Action sensitivity (0-10) → 0.0 – 0.30
- Recipient specified → +0.10
- Large argument payload (≥5 keys) → +0.10

Risk levels
~~~~~~~~~~~
- ``< 0.25`` → LOW
- ``< 0.50`` → MEDIUM
- ``< 0.75`` → HIGH
- ``≥ 0.75`` → CRITICAL
"""

from __future__ import annotations

from intentlock.models import RegisteredTool, RiskLevel, ToolCall


class RiskEngine:
    """Stateless risk-assessment engine."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def assess(
        self,
        tool_call: ToolCall,
        tool: RegisteredTool,
    ) -> tuple[float, RiskLevel]:
        """
        Compute a normalised risk score and human-readable risk level.

        Parameters
        ----------
        tool_call:
            The proposed action.
        tool:
            The registered tool descriptor.

        Returns
        -------
        tuple[float, RiskLevel]
            ``(score, level)`` where score ∈ [0.0, 1.0].
        """
        score = 0.0

        # Component 1: Tool's inherent sensitivity (0-10 → 0.0-0.50).
        score += (tool.sensitivity / 10.0) * 0.50

        # Component 2: Action's declared sensitivity (0-10 → 0.0-0.30).
        score += (tool_call.sensitivity / 10.0) * 0.30

        # Component 3: Recipient specified → +0.10.
        if tool_call.recipient:
            score += 0.10

        # Component 4: Large argument payload (≥5 keys) → +0.10.
        if len(tool_call.arguments) >= 5:
            score += 0.10

        # Clamp to [0.0, 1.0].
        score = min(max(score, 0.0), 1.0)

        level = self._score_to_level(score)
        return round(score, 4), level

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _score_to_level(score: float) -> RiskLevel:
        """Map a normalised score to a :class:`RiskLevel`."""
        if score < 0.25:
            return RiskLevel.LOW
        if score < 0.50:
            return RiskLevel.MEDIUM
        if score < 0.75:
            return RiskLevel.HIGH
        return RiskLevel.CRITICAL
