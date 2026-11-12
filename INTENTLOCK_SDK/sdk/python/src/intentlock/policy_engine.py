"""
INTENTLOCK – Deterministic Policy Engine.

The :class:`PolicyEngine` performs a strictly-ordered, fail-closed evaluation
of a :class:`ToolCall` against a :class:`Policy` and the :class:`ToolRegistry`.

Evaluation order (each step short-circuits if matched):

1. ``policy is None``            → DENY  (POLICY_MISSING)
2. Tool not in registry          → DENY  (TOOL_NOT_REGISTERED)
3. Permission in denied list     → DENY  (PERMISSION_DENIED)
4. Permission in approval list   → REQUIRE_APPROVAL  (APPROVAL_REQUIRED)
5. Permission NOT in allowed     → DENY  (PERMISSION_NOT_GRANTED)
6. Sensitivity exceeds ceiling   → DENY  (SENSITIVITY_TOO_HIGH)
7. Recipient not in allow-list   → DENY  (RECIPIENT_NOT_ALLOWED)
8. Resource doesn't match globs  → DENY  (RESOURCE_OUT_OF_SCOPE)
9. All checks pass               → ALLOW (POLICY_MATCH)
"""

from __future__ import annotations

import fnmatch
from datetime import datetime, timezone

from intentlock.logger import get_logger
from intentlock.models import (
    Decision,
    DecisionVerdict,
    Policy,
    RiskLevel,
    ToolCall,
)
from intentlock.registry import ToolRegistry

_log = get_logger(__name__)


class PolicyEngine:
    """Stateless, deterministic policy evaluator."""

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def evaluate(
        self,
        tool_call: ToolCall,
        policy: Policy | None,
        registry: ToolRegistry,
    ) -> Decision:
        """
        Evaluate *tool_call* against *policy* using the *registry*.

        Returns a fully-populated :class:`Decision`.
        """
        action_hash = tool_call.canonical_hash()
        now = datetime.now(timezone.utc)

        # ---- Step 1: Policy presence -----------------------------------
        if policy is None:
            return self._deny(
                tool_call=tool_call,
                reason="POLICY_MISSING",
                action_hash=action_hash,
                policy_id="",
                now=now,
            )

        # ---- Step 2: Tool registration --------------------------------
        if not registry.has(tool_call.tool_name):
            return self._deny(
                tool_call=tool_call,
                reason="TOOL_NOT_REGISTERED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        tool_descriptor, _ = registry.get(tool_call.tool_name)
        permission = tool_descriptor.permission

        # ---- Step 3: Explicit deny ------------------------------------
        if permission in policy.denied_permissions:
            return self._deny(
                tool_call=tool_call,
                reason="PERMISSION_DENIED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        # ---- Step 4: Requires approval --------------------------------
        if permission in policy.require_approval_permissions:
            return Decision(
                verdict=DecisionVerdict.REQUIRE_APPROVAL,
                tool_name=tool_call.tool_name,
                reason="APPROVAL_REQUIRED",
                policy_id=policy.policy_id,
                action_hash=action_hash,
                agent_id=tool_call.agent_id,
                timestamp=now,
            )

        # ---- Step 5: Permission not granted (deny-by-default) ----------
        if permission not in policy.allowed_permissions:
            return self._deny(
                tool_call=tool_call,
                reason="PERMISSION_NOT_GRANTED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        # ---- Step 6: Sensitivity ceiling ------------------------------
        effective_sensitivity = max(tool_call.sensitivity, tool_descriptor.sensitivity)
        if effective_sensitivity > policy.max_sensitivity:
            return self._deny(
                tool_call=tool_call,
                reason="SENSITIVITY_TOO_HIGH",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        # ---- Step 7: Recipient allow-list ------------------------------
        if (
            tool_call.recipient
            and policy.allowed_recipients
            and not any(
                fnmatch.fnmatch(tool_call.recipient, pattern)
                for pattern in policy.allowed_recipients
            )
        ):
            return self._deny(
                tool_call=tool_call,
                reason="RECIPIENT_NOT_ALLOWED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        # ---- Step 8: Resource glob matching ----------------------------
        if (
            tool_call.resource_id
            and policy.allowed_resources
            and not any(
                fnmatch.fnmatch(tool_call.resource_id, pattern)
                for pattern in policy.allowed_resources
            )
        ):
            return self._deny(
                tool_call=tool_call,
                reason="RESOURCE_OUT_OF_SCOPE",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                now=now,
            )

        # ---- Step 9: All checks passed ---------------------------------
        _log.info(
            "Policy evaluation: ALLOW",
            extra={
                "tool_name": tool_call.tool_name,
                "agent_id": tool_call.agent_id,
                "policy_id": policy.policy_id,
            },
        )
        return Decision(
            verdict=DecisionVerdict.ALLOW,
            tool_name=tool_call.tool_name,
            reason="POLICY_MATCH",
            policy_id=policy.policy_id,
            action_hash=action_hash,
            agent_id=tool_call.agent_id,
            timestamp=now,
        )

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _deny(
        *,
        tool_call: ToolCall,
        reason: str,
        action_hash: str,
        policy_id: str,
        now: datetime,
    ) -> Decision:
        """Build a DENY :class:`Decision` with full context."""
        _log.warning(
            "Policy evaluation: DENY",
            extra={
                "tool_name": tool_call.tool_name,
                "agent_id": tool_call.agent_id,
                "reason": reason,
                "policy_id": policy_id,
            },
        )
        return Decision(
            verdict=DecisionVerdict.DENY,
            tool_name=tool_call.tool_name,
            reason=reason,
            policy_id=policy_id,
            action_hash=action_hash,
            agent_id=tool_call.agent_id,
            timestamp=now,
        )
