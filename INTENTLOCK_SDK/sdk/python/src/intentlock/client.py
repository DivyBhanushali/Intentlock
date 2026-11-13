"""
INTENTLOCK 2.0 – Official Python Gateway Client.
Provides high-level, production-ready interface for AI agent frameworks
(LangChain, AutoGen, CrewAI, Custom) to communicate with the INTENTLOCK Security Gateway.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone, timedelta
from typing import Any, Callable, Dict, List, Optional
import urllib.request
import urllib.error

from intentlock.models import (
    Decision,
    DecisionVerdict,
    IntentContext,
    Policy,
    RiskLevel,
    ToolCall,
)
from intentlock.exceptions import (
    ApprovalRequiredError,
    IntentLockError,
    PermissionDeniedError,
)


class IntentLockClient:
    """
    Client for interacting with the INTENTLOCK Zero-Trust AI Agent Security Gateway.

    :param api_key: Stripe-style M2M machine key (ilk_live_...) or User JWT Bearer token.
    :param base_url: Base URL of the INTENTLOCK backend service.
    :param agent_id: Unique identifier for this client agent.
    :param timeout: Request timeout in seconds.
    """

    def __init__(
        self,
        api_key: str = "",
        base_url: str = "https://intentlock-backend-ze2i.onrender.com",
        agent_id: str = "default-agent",
        timeout: float = 15.0,
    ):
        self.api_key = api_key.strip()
        self.base_url = base_url.rstrip("/")
        self.agent_id = agent_id
        self.timeout = timeout

    def _headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "IntentLock-Python-SDK/2.0",
        }
        if self.api_key:
            if self.api_key.startswith("ilk_"):
                headers["X-API-Key"] = self.api_key
                headers["Authorization"] = f"Bearer {self.api_key}"
            else:
                headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    def _post(self, path: str, data: Dict[str, Any]) -> Dict[str, Any]:
        url = f"{self.base_url}/api/v1{path}"
        req = urllib.request.Request(
            url=url,
            data=json.dumps(data).encode("utf-8"),
            headers=self._headers(),
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise IntentLockError(f"HTTP {e.code}: {err_body or e.reason}")
        except Exception as e:
            raise IntentLockError(f"Network error connecting to INTENTLOCK gateway: {e}")

    def _get(self, path: str) -> Any:
        url = f"{self.base_url}/api/v1{path}"
        req = urllib.request.Request(
            url=url,
            headers=self._headers(),
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            raise IntentLockError(f"HTTP {e.code}: {err_body or e.reason}")
        except Exception as e:
            raise IntentLockError(f"Network error connecting to INTENTLOCK gateway: {e}")

    # -------------------------------------------------------------------------
    # Intent Authorization Context APIs
    # -------------------------------------------------------------------------

    def authorize_intent(
        self,
        objective: str,
        allowed_actions: Optional[List[str]] = None,
        denied_actions: Optional[List[str]] = None,
        allowed_permissions: Optional[List[str]] = None,
        allowed_resources: Optional[List[str]] = None,
        allowed_recipients: Optional[List[str]] = None,
        sensitivity_ceiling: int = 5,
        execution_scope: str = "default",
        ttl_seconds: int = 3600,
        agent_id: Optional[str] = None,
    ) -> IntentContext:
        """
        Request issuance of an immutable task-scoped Intent Authorization Context.
        Must be invoked by a trusted application principal before autonomous execution.
        """
        payload = {
            "agent_id": agent_id or self.agent_id,
            "authorized_objective": objective,
            "allowed_actions": allowed_actions or [],
            "denied_actions": denied_actions or [],
            "allowed_permissions": allowed_permissions or [],
            "allowed_resources": allowed_resources or [],
            "allowed_recipients": allowed_recipients or [],
            "sensitivity_ceiling": sensitivity_ceiling,
            "execution_scope": execution_scope,
            "ttl_seconds": ttl_seconds,
        }
        res = self._post("/intents", payload)
        exp_time = datetime.fromisoformat(res["expiration_timestamp"].replace("Z", "+00:00"))
        return IntentContext(
            intent_id=res["id"],
            org_id=res["org_id"],
            user_id=res["user_id"],
            agent_id=res["agent_id"],
            authorized_objective=res["authorized_objective"],
            allowed_actions=res.get("allowed_actions", []),
            denied_actions=res.get("denied_actions", []),
            allowed_permissions=res.get("allowed_permissions", []),
            allowed_resources=res.get("allowed_resources", []),
            allowed_recipients=res.get("allowed_recipients", []),
            sensitivity_ceiling=res.get("sensitivity_ceiling", 5),
            execution_scope=res.get("execution_scope", "default"),
            expiration_timestamp=exp_time,
            context_status=res.get("context_status", "ACTIVE"),
            authorization_version=res.get("authorization_version", 1),
        )

    def revoke_intent(self, intent_id: str, reason: str = "Task completed") -> bool:
        """Explicitly revoke an active intent context."""
        res = self._post(f"/intents/{intent_id}/revoke", {"reason": reason})
        return res.get("context_status") == "REVOKED"

    # -------------------------------------------------------------------------
    # Interception Gateway APIs
    # -------------------------------------------------------------------------

    def intercept(
        self,
        tool_name: str,
        arguments: Optional[Dict[str, Any]] = None,
        agent_id: Optional[str] = None,
        user_request: str = "",
        sensitivity: int = 0,
        resource_id: str = "",
        recipient: str = "",
        intent_id: Optional[str] = None,
        approval_id: Optional[str] = None,
        trace_id: Optional[str] = None,
    ) -> Decision:
        """
        Evaluate a proposed tool invocation against INTENTLOCK policies and intent contexts.
        Returns a strongly-typed Decision object.
        """
        payload = {
            "agent_id": agent_id or self.agent_id,
            "tool_name": tool_name,
            "arguments": arguments or {},
            "user_request": user_request,
            "sensitivity": sensitivity,
            "resource_id": resource_id,
            "recipient": recipient,
            "intent_id": intent_id,
            "approval_id": approval_id,
            "trace_id": trace_id,
        }
        res = self._post("/intercept", payload)

        verdict_val = res.get("verdict", DecisionVerdict.DENY.value)
        return Decision(
            verdict=DecisionVerdict(verdict_val),
            tool_name=tool_name,
            reason=res.get("reason", ""),
            action_hash=res.get("action_hash", ""),
            risk_score=res.get("risk_score", 0.0),
            risk_level=RiskLevel(res.get("risk_level", RiskLevel.MEDIUM.value)),
            agent_id=agent_id or self.agent_id,
            intent_id=res.get("intent_id", "") or "",
            trace_id=res.get("trace_id", "") or "",
            metadata={"approval_id": res.get("approval_id")},
        )
