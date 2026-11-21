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
import os
import re
import types
from datetime import datetime, timedelta, timezone
from typing import Any

from sictack.logger import get_logger
from sictack.network import canonicalize_destination, validate_network_destination
from sictack.models import (
    Decision,
    DecisionVerdict,
    IntentContext,
    Policy,
    RiskLevel,
    SecurityMode,
    ToolCall,
    to_canonical_dict,
)
from sictack.registry import ToolRegistry

_log = get_logger(__name__)


def _extract_all_string_values(obj: Any) -> list[str]:
    strings: list[str] = []
    if isinstance(obj, str):
        strings.append(obj)
    elif isinstance(obj, (dict, types.MappingProxyType)) or (hasattr(obj, "items") and callable(obj.items)):
        for v in obj.values():
            strings.extend(_extract_all_string_values(v))
    elif isinstance(obj, (list, tuple, set, frozenset)):
        for item in obj:
            strings.extend(_extract_all_string_values(item))
    return strings


def evaluate_parameter_constraints(
    arguments: Any,
    constraints: dict[str, Any],
) -> tuple[bool, str]:
    """
    Evaluates tool arguments against parameter-level authorization rules.
    Returns (True, "") if compliant, or (False, error_reason) if violated.
    """
    if not constraints:
        return True, ""

    args_dict = to_canonical_dict(arguments) if arguments else {}
    if not isinstance(args_dict, dict):
        args_dict = {}

    # 1. Required keys
    req_keys = constraints.get("required_keys", [])
    for k in req_keys:
        if k not in args_dict or args_dict[k] is None:
            return False, f"Missing required parameter '{k}'"

    # 2. Allowed keys
    allowed_keys = constraints.get("allowed_keys")
    if allowed_keys is not None:
        for k in args_dict.keys():
            if k not in allowed_keys:
                return False, f"Unauthorized parameter key '{k}'"

    # 3. Numeric maximum limits
    max_numeric = constraints.get("max_numeric", {})
    for param_name, max_val in max_numeric.items():
        if param_name in args_dict and args_dict[param_name] is not None:
            val = args_dict[param_name]
            try:
                num_val = float(val)
                if num_val > float(max_val):
                    return False, f"Parameter '{param_name}' value {num_val} exceeds authorized maximum limit of {max_val}"
            except (ValueError, TypeError):
                return False, f"Parameter '{param_name}' expected numeric value for limit check"

    # 4. Numeric minimum limits
    min_numeric = constraints.get("min_numeric", {})
    for param_name, min_val in min_numeric.items():
        if param_name in args_dict and args_dict[param_name] is not None:
            val = args_dict[param_name]
            try:
                num_val = float(val)
                if num_val < float(min_val):
                    return False, f"Parameter '{param_name}' value {num_val} is below authorized minimum limit of {min_val}"
            except (ValueError, TypeError):
                return False, f"Parameter '{param_name}' expected numeric value for limit check"

    # 5. Allowed / Disallowed values
    allowed_values = constraints.get("allowed_values", {})
    for param_name, allowed_list in allowed_values.items():
        if param_name in args_dict and args_dict[param_name] is not None:
            if args_dict[param_name] not in allowed_list:
                return False, f"Parameter '{param_name}' value '{args_dict[param_name]}' is not in allowed list"

    disallowed_values = constraints.get("disallowed_values", {})
    for param_name, disallowed_list in disallowed_values.items():
        if param_name in args_dict and args_dict[param_name] is not None:
            if args_dict[param_name] in disallowed_list:
                return False, f"Parameter '{param_name}' value '{args_dict[param_name]}' is explicitly forbidden"

    # 6. Forbidden patterns across string values
    forbidden_patterns = constraints.get("forbidden_patterns", [])
    if forbidden_patterns:
        all_strings = _extract_all_string_values(args_dict)
        for pat in forbidden_patterns:
            compiled = re.compile(pat, re.IGNORECASE) if isinstance(pat, str) else pat
            for s in all_strings:
                if compiled.search(s):
                    return False, f"Parameter value matches forbidden pattern '{pat}'"

    return True, ""


def is_resource_allowed(resource_id: str, allowed_patterns: list[str]) -> bool:
    """
    Evaluates whether resource_id matches any of the allowed_patterns in a traversal-resistant manner.
    Guards against:
    - Null byte injection (\x00)
    - Directory traversal breakouts ('../', '..\\')
    - Absolute path escapes when relative patterns are specified
    - Glob spoofing
    """
    if not resource_id or not allowed_patterns:
        return False
    if "\x00" in resource_id:
        return False

    for raw_pattern in allowed_patterns:
        if raw_pattern == "*":
            return True
        if "\x00" in raw_pattern:
            continue
        if resource_id == raw_pattern:
            return True

        is_path_like = "/" in resource_id or "\\" in resource_id or "/" in raw_pattern or "\\" in raw_pattern

        if is_path_like:
            norm_res = os.path.normpath(resource_id).replace("\\", "/")
            norm_pat = os.path.normpath(raw_pattern).replace("\\", "/")

            # Detect directory traversal escapes
            if norm_res.startswith("../") or norm_res == ".." or "/../" in norm_res:
                continue

            # If pattern is relative (e.g. "data/*"), an absolute resource (e.g. "/etc/passwd") must never match
            if not norm_pat.startswith("/") and norm_res.startswith("/"):
                continue

            # If pattern ends with "/*" or "/**", verify prefix confinement
            if raw_pattern.endswith("/*") or raw_pattern.endswith("/**"):
                base_dir = raw_pattern.rstrip("/*").replace("\\", "/")
                norm_base = os.path.normpath(base_dir).replace("\\", "/")
                if not (norm_res == norm_base or norm_res.startswith(norm_base + "/")):
                    continue

            if fnmatch.fnmatch(norm_res, norm_pat):
                return True
        else:
            if fnmatch.fnmatch(resource_id, raw_pattern):
                return True

    return False


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
        intent_context: IntentContext | None = None,
        ttl_seconds: int = 300,
    ) -> Decision:
        """
        Evaluate *tool_call* against *policy* and optional *intent_context* using the *registry*.

        Returns a fully-populated :class:`Decision`.
        """
        action_hash = tool_call.canonical_hash()
        now = datetime.now(timezone.utc)
        intent_id = intent_context.intent_id if intent_context else tool_call.intent_id
        policy_version = getattr(policy, "version", 1) if policy else 1
        expires_at = now + timedelta(seconds=ttl_seconds)

        # ---- Step 1: Policy presence -----------------------------------
        if policy is None:
            eff_mode = tool_call.security_mode if tool_call.security_mode != SecurityMode.ENFORCE else SecurityMode.ENFORCE
            return self._deny(
                tool_call=tool_call,
                reason="POLICY_MISSING",
                action_hash=action_hash,
                policy_id="",
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=eff_mode,
            )

        security_mode = tool_call.security_mode if tool_call.security_mode != SecurityMode.ENFORCE else getattr(policy, "security_mode", SecurityMode.ENFORCE)

        # ---- Step 2: Tool registration --------------------------------
        if not registry.has(tool_call.tool_name):
            return self._deny(
                tool_call=tool_call,
                reason="TOOL_NOT_REGISTERED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        tool_descriptor, _ = registry.get(tool_call.tool_name)
        permission = tool_descriptor.permission

        # ---- Step 3: Explicit policy deny -----------------------------
        if any(pat == "*" or pat == permission or fnmatch.fnmatch(permission, pat) for pat in policy.denied_permissions):
            return self._deny(
                tool_call=tool_call,
                reason="PERMISSION_DENIED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        # ---- Step 3.1: Environment Restrictions -----------------------
        if policy.denied_environments and tool_call.environment in policy.denied_environments:
            return self._deny(
                tool_call=tool_call,
                reason="ENVIRONMENT_DENIED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
                metadata={"environment": tool_call.environment},
            )
        if policy.allowed_environments and tool_call.environment not in policy.allowed_environments:
            return self._deny(
                tool_call=tool_call,
                reason="ENVIRONMENT_NOT_PERMITTED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
                metadata={"environment": tool_call.environment},
            )

        # ---- Step 3.2: Network Destination Constraints ----------------
        if tool_call.network_destination:
            is_valid_dest, dest_reason = validate_network_destination(
                destination=tool_call.network_destination,
                allowed_destinations=policy.network_destinations,
                denied_destinations=policy.denied_network_destinations,
            )
            if not is_valid_dest:
                canon = canonicalize_destination(tool_call.network_destination)
                reason_code = "NETWORK_DESTINATION_DENIED" if "DENIED" in dest_reason or "BLOCKED" in dest_reason else "NETWORK_DESTINATION_NOT_PERMITTED"
                return self._deny(
                    tool_call=tool_call,
                    reason=reason_code,
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                    metadata={
                        "network_destination": tool_call.network_destination,
                        "canonical_host": canon.host,
                        "validation_error": dest_reason,
                    },
                )

        # ---- Step 3.3: Sensitive Administrative Actions ---------------
        is_sensitive_admin = (
            tool_call.tool_name in policy.sensitive_admin_actions
            or tool_call.operation_type.lower() == "admin"
        )
        if is_sensitive_admin:
            if permission in policy.denied_permissions:
                return self._deny(
                    tool_call=tool_call,
                    reason="PERMISSION_DENIED",
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                )
            if tool_call.tool_name in policy.sensitive_admin_actions or security_mode == SecurityMode.STRICT:
                return Decision(
                    verdict=DecisionVerdict.REQUIRE_APPROVAL,
                    tool_name=tool_call.tool_name,
                    reason="SENSITIVE_ADMIN_APPROVAL_REQUIRED",
                    policy_id=policy.policy_id,
                    action_hash=action_hash,
                    agent_id=tool_call.agent_id,
                    intent_id=intent_id,
                    trace_id=tool_call.trace_id,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    timestamp=now,
                    security_mode=security_mode,
                    context_metadata={
                        "environment": tool_call.environment,
                        "operation_type": tool_call.operation_type,
                        "sensitive_admin": True,
                    },
                )

        # ---- Step 4: Intent Context Validation (if present) -----------
        if intent_context is not None:
            # 4.1 Validity & Expiry
            if not intent_context.is_valid(now):
                reason = "INTENT_EXPIRED" if intent_context.is_expired(now) else "INTENT_REVOKED"
                return self._deny(
                    tool_call=tool_call,
                    reason=reason,
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                )

            # 4.2 Agent Binding
            if intent_context.agent_id and intent_context.agent_id != "*" and intent_context.agent_id != tool_call.agent_id:
                return self._deny(
                    tool_call=tool_call,
                    reason="INTENT_AGENT_MISMATCH",
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                )

            # 4.3 Explicit Denied Actions in Intent
            if (
                tool_call.tool_name in intent_context.denied_actions
                or permission in intent_context.denied_actions
            ):
                return self._deny(
                    tool_call=tool_call,
                    reason="INTENT_ACTION_DENIED",
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                )

            # 4.4 Allowed Actions in Intent (if specified)
            if intent_context.allowed_actions or intent_context.allowed_permissions:
                action_permitted = (
                    tool_call.tool_name in intent_context.allowed_actions
                    or permission in intent_context.allowed_actions
                    or permission in intent_context.allowed_permissions
                )
                if not action_permitted:
                    return self._deny(
                        tool_call=tool_call,
                        reason="INTENT_ACTION_NOT_PERMITTED",
                        action_hash=action_hash,
                        policy_id=policy.policy_id,
                        intent_id=intent_id,
                        now=now,
                        policy_version=policy_version,
                        expires_at=expires_at,
                        security_mode=security_mode,
                    )

            # 4.5 Resource Confinement in Intent
            if tool_call.resource_id and intent_context.allowed_resources:
                if not is_resource_allowed(tool_call.resource_id, intent_context.allowed_resources):
                    return self._deny(
                        tool_call=tool_call,
                        reason="INTENT_RESOURCE_OUT_OF_SCOPE",
                        action_hash=action_hash,
                        policy_id=policy.policy_id,
                        intent_id=intent_id,
                        now=now,
                        policy_version=policy_version,
                        expires_at=expires_at,
                        security_mode=security_mode,
                    )

            # 4.6 Recipient Whitelist in Intent
            if tool_call.recipient and intent_context.allowed_recipients:
                if not any(fnmatch.fnmatch(tool_call.recipient, pat) for pat in intent_context.allowed_recipients):
                    return self._deny(
                        tool_call=tool_call,
                        reason="INTENT_RECIPIENT_NOT_ALLOWED",
                        action_hash=action_hash,
                        policy_id=policy.policy_id,
                        intent_id=intent_id,
                        now=now,
                        policy_version=policy_version,
                        expires_at=expires_at,
                        security_mode=security_mode,
                    )

            # 4.7 Sensitivity Ceiling in Intent
            effective_sensitivity = max(tool_call.sensitivity, tool_descriptor.sensitivity)
            if effective_sensitivity > intent_context.sensitivity_ceiling:
                return self._deny(
                    tool_call=tool_call,
                    reason="INTENT_SENSITIVITY_EXCEEDED",
                    action_hash=action_hash,
                    policy_id=policy.policy_id,
                    intent_id=intent_id,
                    now=now,
                    policy_version=policy_version,
                    expires_at=expires_at,
                    security_mode=security_mode,
                )

        # ---- Step 5: Recipient allow-list (Policy Exfiltration boundary)
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
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        # ---- Step 6: Resource glob matching (Policy Scope boundary) ----
        if (
            tool_call.resource_id
            and policy.allowed_resources
            and not is_resource_allowed(tool_call.resource_id, policy.allowed_resources)
        ):
            return self._deny(
                tool_call=tool_call,
                reason="RESOURCE_OUT_OF_SCOPE",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        # ---- Step 6.5: Parameter Constraints Evaluation ---------------
        if policy.parameter_constraints:
            tool_constraints = policy.parameter_constraints.get(tool_call.tool_name) or {}
            global_constraints = policy.parameter_constraints.get("*") or {}
            has_top_level = any(
                k in policy.parameter_constraints
                for k in (
                    "max_numeric",
                    "min_numeric",
                    "required_keys",
                    "allowed_keys",
                    "forbidden_patterns",
                    "allowed_values",
                    "disallowed_values",
                )
            )

            combined_constraints: dict[str, Any] = {}
            if has_top_level:
                combined_constraints.update(
                    {
                        k: v
                        for k, v in policy.parameter_constraints.items()
                        if k not in ("*", tool_call.tool_name)
                    }
                )
            if global_constraints and isinstance(global_constraints, dict):
                combined_constraints.update(global_constraints)
            if tool_constraints and isinstance(tool_constraints, dict):
                combined_constraints.update(tool_constraints)

            if combined_constraints:
                ok, err_msg = evaluate_parameter_constraints(
                    tool_call.arguments, combined_constraints
                )
                if not ok:
                    return self._deny(
                        tool_call=tool_call,
                        reason="PARAMETER_AUTHORIZATION_VIOLATION",
                        action_hash=action_hash,
                        policy_id=policy.policy_id,
                        intent_id=intent_id,
                        now=now,
                        policy_version=policy_version,
                        expires_at=expires_at,
                        metadata={"parameter_error": err_msg},
                        security_mode=security_mode,
                    )

        # ---- Step 7: Requires approval --------------------------------
        if permission in policy.require_approval_permissions:
            meta_approval: dict[str, Any] = {}
            if security_mode == SecurityMode.MONITOR:
                meta_approval["monitor_mode"] = True
            return Decision(
                verdict=DecisionVerdict.REQUIRE_APPROVAL,
                tool_name=tool_call.tool_name,
                reason="APPROVAL_REQUIRED",
                policy_id=policy.policy_id,
                action_hash=action_hash,
                agent_id=tool_call.agent_id,
                intent_id=intent_id,
                trace_id=tool_call.trace_id,
                policy_version=policy_version,
                expires_at=expires_at,
                timestamp=now,
                metadata=meta_approval,
                security_mode=security_mode,
                context_metadata={"environment": tool_call.environment, "operation_type": tool_call.operation_type},
            )

        # ---- Step 8: Permission not granted (deny-by-default) ----------
        if not any(pat == "*" or pat == permission or fnmatch.fnmatch(permission, pat) for pat in policy.allowed_permissions):
            return self._deny(
                tool_call=tool_call,
                reason="PERMISSION_NOT_GRANTED",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        # ---- Step 9: Sensitivity ceiling ------------------------------
        effective_sensitivity = max(tool_call.sensitivity, tool_descriptor.sensitivity)
        if effective_sensitivity > policy.max_sensitivity:
            return self._deny(
                tool_call=tool_call,
                reason="SENSITIVITY_TOO_HIGH",
                action_hash=action_hash,
                policy_id=policy.policy_id,
                intent_id=intent_id,
                now=now,
                policy_version=policy_version,
                expires_at=expires_at,
                security_mode=security_mode,
            )

        # ---- Step 10: All checks passed --------------------------------
        _log.info(
            "Policy evaluation: ALLOW",
            extra={
                "tool_name": tool_call.tool_name,
                "agent_id": tool_call.agent_id,
                "policy_id": policy.policy_id,
                "intent_id": intent_id,
            },
        )
        return Decision(
            verdict=DecisionVerdict.ALLOW,
            tool_name=tool_call.tool_name,
            reason="POLICY_MATCH",
            policy_id=policy.policy_id,
            action_hash=action_hash,
            agent_id=tool_call.agent_id,
            intent_id=intent_id,
            trace_id=tool_call.trace_id,
            policy_version=policy_version,
            expires_at=expires_at,
            timestamp=now,
            security_mode=security_mode,
            context_metadata={"environment": tool_call.environment, "operation_type": tool_call.operation_type},
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
        intent_id: str = "",
        now: datetime,
        policy_version: int = 1,
        expires_at: datetime | None = None,
        metadata: dict[str, Any] | None = None,
        security_mode: SecurityMode = SecurityMode.ENFORCE,
    ) -> Decision:
        """Build a DENY :class:`Decision` with full context, strictly preserving CORE denial invariant across all modes."""
        meta = dict(metadata or {})
        if security_mode == SecurityMode.MONITOR:
            _log.info(
                "Policy evaluation: MONITOR (Explicit CORE DENY enforced and observed)",
                extra={
                    "tool_name": tool_call.tool_name,
                    "agent_id": tool_call.agent_id,
                    "reason": reason,
                    "policy_id": policy_id,
                    "intent_id": intent_id,
                },
            )
            meta["monitor_mode"] = True
            meta["monitored_verdict"] = "DENY"
            meta["violation_reason"] = reason

        _log.warning(
            "Policy evaluation: DENY",
            extra={
                "tool_name": tool_call.tool_name,
                "agent_id": tool_call.agent_id,
                "reason": reason,
                "policy_id": policy_id,
                "intent_id": intent_id,
                "security_mode": security_mode.value,
            },
        )
        return Decision(
            verdict=DecisionVerdict.DENY,
            tool_name=tool_call.tool_name,
            reason=reason,
            policy_id=policy_id,
            action_hash=action_hash,
            agent_id=tool_call.agent_id,
            intent_id=intent_id,
            trace_id=tool_call.trace_id,
            policy_version=policy_version,
            expires_at=expires_at,
            metadata=meta,
            security_mode=security_mode,
            context_metadata={
                "environment": tool_call.environment,
                "operation_type": tool_call.operation_type,
            },
            timestamp=now,
        )

