"""
INTENTLOCK – Multi-Agent Delegated Authorization Engine (Phase 4B).

Enforces:
1. Least-privilege capability delegation from parent agents to child agents.
2. Effective permission evaluation (intersection of parent policy, child policy, and delegation token).
3. Privilege escalation prevention (child agents can never receive or execute authority exceeding parent).
4. Confused-deputy prevention (cryptographic verification of agent identity, token binding, and caller matching).
5. Delegation lifecycle: expiration, instant revocation, and cascading sub-delegation invalidation.
6. Shared execution budget accounting across parent-child agent hierarchies.
"""

from __future__ import annotations

import fnmatch
import hmac
import hashlib
import json
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from sictack.exceptions import (
    ConfusedDeputyError,
    DelegationError,
    DelegationExpiredError,
    DelegationPrivilegeEscalationError,
    DelegationRevokedError,
    MaxDelegationDepthExceededError,
    PermissionDeniedError,
)
from sictack.logger import get_logger
from sictack.models import (
    AgentIdentity,
    Decision,
    DecisionVerdict,
    DelegationToken,
    Policy,
    SecurityMode,
    ToolCall,
)
from sictack.registry import ToolRegistry

_log = get_logger("sictack.delegation")


class DelegationEngine:
    """
    Stateless and stateful multi-agent delegation manager and evaluator.
    Thread-safe registry of active, expired, and revoked delegation tokens.
    """

    def __init__(
        self,
        default_secret_key: str = "intentlock_delegation_master_secret",
        max_delegation_depth: int = 3,
    ) -> None:
        self.default_secret_key = default_secret_key
        self.max_delegation_depth = max_delegation_depth
        self._lock = threading.Lock()
        self._tokens: Dict[str, DelegationToken] = {}
        self._revoked_tokens: Set[str] = set()
        self._agent_identities: Dict[str, AgentIdentity] = {}
        self._parent_child_index: Dict[str, Set[str]] = {}  # parent_id -> set of child_ids
        self._delegation_hierarchy: Dict[str, Set[str]] = {}  # delegation_id -> set of sub_delegation_ids

    # ------------------------------------------------------------------
    # Agent Identity Management
    # ------------------------------------------------------------------

    def register_agent(
        self,
        agent_id: str,
        org_id: str = "default-org",
        parent_agent_id: Optional[str] = None,
        name: str = "",
        role: str = "worker",
        max_depth: Optional[int] = None,
    ) -> AgentIdentity:
        """Register or update an agent identity within the multi-agent hierarchy."""
        with self._lock:
            # Check for circular parent relationships
            if parent_agent_id and parent_agent_id == agent_id:
                raise DelegationError(
                    f"Agent '{agent_id}' cannot be its own parent",
                    parent_agent_id=parent_agent_id,
                    child_agent_id=agent_id,
                )

            identity = AgentIdentity(
                agent_id=agent_id,
                org_id=org_id,
                parent_agent_id=parent_agent_id,
                name=name or agent_id,
                role=role,
                max_delegation_depth=max_depth if max_depth is not None else self.max_delegation_depth,
            )
            self._agent_identities[agent_id] = identity

            if parent_agent_id:
                if parent_agent_id not in self._parent_child_index:
                    self._parent_child_index[parent_agent_id] = set()
                self._parent_child_index[parent_agent_id].add(agent_id)

            _log.info(
                "Agent identity registered",
                extra={"agent_id": agent_id, "parent_agent_id": parent_agent_id, "role": role},
            )
            return identity

    def get_agent(self, agent_id: str) -> Optional[AgentIdentity]:
        with self._lock:
            return self._agent_identities.get(agent_id)

    # ------------------------------------------------------------------
    # Delegation Issuance (Least-Privilege & Escalation Prevention)
    # ------------------------------------------------------------------

    def create_delegation(
        self,
        *,
        parent_agent_id: str,
        child_agent_id: str,
        org_id: str = "default-org",
        parent_policy: Policy,
        delegated_permissions: List[str],
        delegated_tools: Optional[List[str]] = None,
        delegated_resources: Optional[List[str]] = None,
        allocated_budget: int = 50,
        parent_session_id: str = "",
        depth: int = 1,
        ttl_seconds: int = 3600,
        secret_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DelegationToken:
        """
        Creates, signs, and activates a DelegationToken from parent to child.

        Enforces:
        1. Privilege Escalation Prevention: Child permissions must be a subset of parent permissions.
        2. Maximum Hierarchy Depth limits.
        3. Cryptographic HMAC-SHA256 signature binding.
        """
        if depth > self.max_delegation_depth:
            raise MaxDelegationDepthExceededError(
                f"Delegation depth {depth} exceeds maximum authorized depth of {self.max_delegation_depth}",
                current_depth=depth,
                max_depth=self.max_delegation_depth,
            )

        # Privilege escalation check: parent cannot delegate what it cannot do
        unauthorized = []
        for perm in delegated_permissions:
            if perm == "*":
                # Wildcard delegation requires parent to hold unrestricted wildcard
                if "*" not in parent_policy.allowed_permissions:
                    unauthorized.append("*")
                continue

            # Denied in parent policy
            if any(pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat) for pat in parent_policy.denied_permissions):
                unauthorized.append(perm)
                continue

            # Must be allowed in parent policy
            is_parent_allowed = any(
                pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat)
                for pat in parent_policy.allowed_permissions
            )
            if not is_parent_allowed:
                unauthorized.append(perm)

        if unauthorized:
            raise DelegationPrivilegeEscalationError(
                f"Parent agent '{parent_agent_id}' cannot delegate unauthorized permissions: {unauthorized}",
                parent_agent_id=parent_agent_id,
                child_agent_id=child_agent_id,
                unauthorized_permissions=unauthorized,
            )

        now = datetime.now(timezone.utc)
        expires_at = (now + timedelta(seconds=ttl_seconds)) if ttl_seconds is not None else None

        token = DelegationToken(
            org_id=org_id,
            parent_agent_id=parent_agent_id,
            child_agent_id=child_agent_id,
            parent_session_id=parent_session_id,
            delegated_permissions=list(delegated_permissions),
            delegated_tools=list(delegated_tools or []),
            delegated_resources=list(delegated_resources or []),
            allocated_budget=allocated_budget,
            executions_count=0,
            depth=depth,
            issued_at=now,
            expires_at=expires_at,
            metadata=dict(metadata or {}),
        )

        effective_secret = secret_key or self.default_secret_key
        token.sign(effective_secret)

        with self._lock:
            self._tokens[token.delegation_id] = token

        _log.info(
            "Delegation token issued",
            extra={
                "delegation_id": token.delegation_id,
                "parent_agent_id": parent_agent_id,
                "child_agent_id": child_agent_id,
                "allocated_budget": allocated_budget,
                "depth": depth,
            },
        )
        return token

    # ------------------------------------------------------------------
    # Effective Authorization Evaluation & Confused Deputy Prevention
    # ------------------------------------------------------------------

    def evaluate_delegated_call(
        self,
        *,
        tool_call: ToolCall,
        delegation_token: DelegationToken,
        parent_policy: Policy,
        child_policy: Policy,
        registry: ToolRegistry,
        now: Optional[datetime] = None,
        secret_key: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Evaluates a tool call invoked under delegated authority.

        Returns (is_allowed: bool, failure_reason: str).
        Raises dedicated exceptions on critical security violations (Escalation, Confused Deputy).
        """
        current_time = now or datetime.now(timezone.utc)
        effective_secret = secret_key or self.default_secret_key

        # 1. Cryptographic token signature verification
        if not delegation_token.verify_signature(effective_secret):
            raise ConfusedDeputyError(
                "Cryptographic signature verification failed: token integrity compromised",
                caller_agent_id=tool_call.agent_id,
                deputy_agent_id=delegation_token.child_agent_id,
                delegation_id=delegation_token.delegation_id,
            )

        # 2. Revocation status check
        if delegation_token.delegation_id in self._revoked_tokens or delegation_token.revoked:
            raise DelegationRevokedError(
                f"Delegation token '{delegation_token.delegation_id}' was revoked: {delegation_token.revocation_reason or 'No reason provided'}",
                delegation_id=delegation_token.delegation_id,
                revocation_reason=delegation_token.revocation_reason or "",
            )

        # 3. Expiration check
        if delegation_token.is_expired(current_time):
            exp_str = delegation_token.expires_at.isoformat() if delegation_token.expires_at else "UNKNOWN"
            raise DelegationExpiredError(
                f"Delegation token '{delegation_token.delegation_id}' expired at {exp_str}",
                delegation_id=delegation_token.delegation_id,
                expired_at=exp_str,
            )

        # 4. Confused Deputy Prevention: Verify calling agent is the authorized child
        if tool_call.agent_id != delegation_token.child_agent_id:
            raise ConfusedDeputyError(
                f"Confused deputy attack blocked: Caller '{tool_call.agent_id}' attempted to use delegation token assigned to '{delegation_token.child_agent_id}'",
                caller_agent_id=tool_call.agent_id,
                deputy_agent_id=delegation_token.child_agent_id,
                delegation_id=delegation_token.delegation_id,
            )

        # 5. Confused Deputy Prevention: Verify parent binding matches tool call
        if tool_call.parent_agent_id and tool_call.parent_agent_id != delegation_token.parent_agent_id:
            raise ConfusedDeputyError(
                f"Parent agent mismatch: declared '{tool_call.parent_agent_id}' != token parent '{delegation_token.parent_agent_id}'",
                caller_agent_id=tool_call.agent_id,
                deputy_agent_id=delegation_token.child_agent_id,
                delegation_id=delegation_token.delegation_id,
            )

        # 6. Tool Registration
        if not registry.has(tool_call.tool_name):
            return False, "TOOL_NOT_REGISTERED"

        tool_desc, _ = registry.get(tool_call.tool_name)
        perm = tool_desc.permission

        # 7. Delegated Scope Check (Tools and Permissions)
        if delegation_token.delegated_tools and tool_call.tool_name not in delegation_token.delegated_tools:
            return False, f"Tool '{tool_call.tool_name}' is not in delegated tool allowlist"

        has_delegated_perm = any(
            pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat)
            for pat in delegation_token.delegated_permissions
        )
        if not has_delegated_perm:
            return False, f"Permission '{perm}' is not granted in delegation token"

        # 8. Parent Authority Check (Privilege Escalation Prevention)
        if any(pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat) for pat in parent_policy.denied_permissions):
            raise DelegationPrivilegeEscalationError(
                f"Permission '{perm}' is explicitly denied by parent policy",
                delegation_id=delegation_token.delegation_id,
                parent_agent_id=delegation_token.parent_agent_id,
                child_agent_id=delegation_token.child_agent_id,
                unauthorized_permissions=[perm],
            )
        is_parent_allowed = any(
            pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat)
            for pat in parent_policy.allowed_permissions
        )
        if not is_parent_allowed:
            raise DelegationPrivilegeEscalationError(
                f"Permission '{perm}' is not authorized in parent policy",
                delegation_id=delegation_token.delegation_id,
                parent_agent_id=delegation_token.parent_agent_id,
                child_agent_id=delegation_token.child_agent_id,
                unauthorized_permissions=[perm],
            )

        # 9. Child Policy Check (Child policy can further restrict, never expand)
        if any(pat == "*" or pat == perm or fnmatch.fnmatch(perm, pat) for pat in child_policy.denied_permissions):
            return False, f"Permission '{perm}' is explicitly forbidden by child agent policy"

        # 10. Shared Execution Budget Check
        with self._lock:
            if delegation_token.executions_count >= delegation_token.allocated_budget:
                return False, f"Delegated execution budget exhausted ({delegation_token.executions_count}/{delegation_token.allocated_budget})"
            delegation_token.executions_count += 1

        return True, ""

    # ------------------------------------------------------------------
    # Revocation & Lifecycle
    # ------------------------------------------------------------------

    def revoke_delegation(self, delegation_id: str, reason: str = "") -> bool:
        """
        Instantly revokes a delegation token and cascades revocation to any
        sub-delegations spawned under its authority.
        """
        with self._lock:
            token = self._tokens.get(delegation_id)
            if not token:
                return False

            token.revoked = True
            token.revocation_reason = reason or "Revoked by administrator or parent agent"
            self._revoked_tokens.add(delegation_id)

            # Cascade revocation to sub-delegations
            sub_ids = self._delegation_hierarchy.get(delegation_id, set())
            for sub_id in sub_ids:
                self._revoked_tokens.add(sub_id)
                sub_token = self._tokens.get(sub_id)
                if sub_token and not sub_token.revoked:
                    sub_token.revoked = True
                    sub_token.revocation_reason = f"CASCADING_REVOCATION: Parent delegation '{delegation_id}' revoked"

            _log.warning(
                "Delegation revoked",
                extra={"delegation_id": delegation_id, "reason": token.revocation_reason, "cascaded_count": len(sub_ids)},
            )
            return True

    def get_delegation(self, delegation_id: str) -> Optional[DelegationToken]:
        with self._lock:
            return self._tokens.get(delegation_id)

    def list_delegations(
        self,
        org_id: str = "default-org",
        parent_agent_id: Optional[str] = None,
        child_agent_id: Optional[str] = None,
    ) -> List[DelegationToken]:
        with self._lock:
            res = [
                t for t in self._tokens.values()
                if t.org_id == org_id
            ]
            if parent_agent_id:
                res = [t for t in res if t.parent_agent_id == parent_agent_id]
            if child_agent_id:
                res = [t for t in res if t.child_agent_id == child_agent_id]
            return res
