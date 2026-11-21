"""
INTENTLOCK 2.0 — LangGraph Ecosystem Integration
Provides secure stateful workflow nodes, tool interception, and human-in-the-loop
approval branching for LangGraph multi-agent execution graphs.
"""

from __future__ import annotations

import functools
import uuid
from typing import Any, Callable, Dict, Optional, Union

from sictack.agent import SecureAgent
from sictack.gateway import ActionGateway
from sictack.models import ToolCall, DecisionVerdict
from sictack.exceptions import PermissionDeniedError, ApprovalRequiredError


class SecureGraphNode:
    """
    Wraps a LangGraph node execution with deterministic INTENTLOCK security governance.
    Extracts intent_id, trace_id, user context, and multi-agent delegation tokens
    from graph state, intercepts actions, and handles approvals and containment cleanly.
    """

    def __init__(
        self,
        name: str,
        func: Callable[[Dict[str, Any]], Dict[str, Any]],
        agent: Optional[SecureAgent] = None,
        security: Optional[Any] = None,
        gateway: Optional[ActionGateway] = None,
        permission: Optional[str] = None,
        sensitivity: int = 0,
        fail_closed: bool = True,
    ):
        self.name = name
        self.func = func
        self.agent = agent
        self.security = security
        self.gateway = gateway or (security.gateway if security else (agent.gateway if agent else None))
        self.permission = permission or name
        self.sensitivity = sensitivity
        self.fail_closed = fail_closed

        if not self.gateway:
            raise ValueError("SecureGraphNode requires either a 'security', 'agent', or 'gateway' instance.")

        # Register node as an executable tool in gateway registry
        self.gateway.registry.register(
            name=self.name,
            handler=self._execute_internal,
            permission=self.permission,
            sensitivity=self.sensitivity,
            description=f"LangGraph secure node: {self.name}",
        )

    def _execute_internal(self, **kwargs) -> Any:
        state = kwargs.get("state", {})
        return self.func(state)

    def __call__(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes node with LangGraph state dictionary.
        Extracts authorization context and intercepts execution via gateway.
        """
        intent_id = state.get("intent_id")
        trace_id = state.get("trace_id") or str(uuid.uuid4())
        agent_id = state.get("agent_id") or (self.agent.agent_id if self.agent else (self.security.agent_id if self.security else "langgraph-agent"))
        approval_id = state.get("approval_id")

        delegation_token = state.get("delegation_token")
        parent_agent_id = state.get("parent_agent_id") or (delegation_token.parent_agent_id if delegation_token else "")
        delegation_id = state.get("delegation_id") or (delegation_token.delegation_id if delegation_token else "")
        delegation_depth = state.get("delegation_depth") or (delegation_token.depth if delegation_token else 0)

        meta_keys = {"approval_id", "trace_id", "intent_id", "delegation_token", "parent_agent_id", "delegation_id", "delegation_depth"}
        clean_state = {k: v for k, v in state.items() if not k.startswith("_") and k not in meta_keys}

        tool_call = ToolCall(
            tool_name=self.name,
            arguments={"state": clean_state},
            agent_id=agent_id,
            intent_id=intent_id or "",
            trace_id=trace_id,
            sensitivity=self.sensitivity,
            parent_agent_id=parent_agent_id,
            delegation_id=delegation_id,
            delegation_depth=delegation_depth,
        )

        try:
            if delegation_token and self.security:
                is_allowed, reason = self.security.delegation_engine.evaluate_delegated_call(
                    tool_call=tool_call,
                    delegation_token=delegation_token,
                    parent_policy=getattr(self.security, "policy", None),
                    child_policy=getattr(self.security, "policy", None),
                    registry=self.gateway.registry,
                )
                if not is_allowed:
                    raise PermissionDeniedError(f"Delegated node execution denied: {reason}", tool_name=self.name, reason="DELEGATION_VIOLATION")

            if approval_id:
                output_state = self.gateway.execute_with_approval(tool_call, approval_id=approval_id)
            else:
                output_state = self.gateway.execute(tool_call)

            if not isinstance(output_state, dict):
                output_state = {"result": output_state}

            output_state["trace_id"] = trace_id
            if intent_id:
                output_state["intent_id"] = intent_id
            output_state["_sictack_status"] = "APPROVED"
            output_state["_intentlock_status"] = "APPROVED"
            return output_state

        except ApprovalRequiredError as e:
            updated_state = dict(state)
            updated_state["_sictack_status"] = "REQUIRE_APPROVAL"
            updated_state["_intentlock_status"] = "REQUIRE_APPROVAL"
            updated_state["_approval_id"] = e.approval_id
            updated_state["_action_hash"] = getattr(e, "action_hash", "")
            updated_state["_pending_node"] = self.name
            return updated_state

        except PermissionDeniedError:
            if self.fail_closed:
                raise
            updated_state = dict(state)
            updated_state["_sictack_status"] = "DENIED"
            updated_state["_intentlock_status"] = "DENIED"
            return updated_state

    async def ainvoke(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """
        Asynchronously executes node with LangGraph state dictionary.
        Supports async coroutine handler functions and async LangGraph node workflows.
        """
        import inspect
        if inspect.iscoroutinefunction(self.func):
            intent_id = state.get("intent_id")
            trace_id = state.get("trace_id") or str(uuid.uuid4())
            agent_id = state.get("agent_id") or (self.agent.agent_id if self.agent else (self.security.agent_id if self.security else "langgraph-agent"))
            approval_id = state.get("approval_id")

            delegation_token = state.get("delegation_token")
            parent_agent_id = state.get("parent_agent_id") or (delegation_token.parent_agent_id if delegation_token else "")
            delegation_id = state.get("delegation_id") or (delegation_token.delegation_id if delegation_token else "")
            delegation_depth = state.get("delegation_depth") or (delegation_token.depth if delegation_token else 0)

            meta_keys = {"approval_id", "trace_id", "intent_id", "delegation_token", "parent_agent_id", "delegation_id", "delegation_depth"}
            clean_state = {k: v for k, v in state.items() if not k.startswith("_") and k not in meta_keys}

            tool_call = ToolCall(
                tool_name=self.name,
                arguments={"state": clean_state},
                agent_id=agent_id,
                intent_id=intent_id or "",
                trace_id=trace_id,
                sensitivity=self.sensitivity,
                parent_agent_id=parent_agent_id,
                delegation_id=delegation_id,
                delegation_depth=delegation_depth,
            )

            try:
                if delegation_token and self.security:
                    is_allowed, reason = self.security.delegation_engine.evaluate_delegated_call(
                        tool_call=tool_call,
                        delegation_token=delegation_token,
                        parent_policy=getattr(self.security, "policy", None),
                        child_policy=getattr(self.security, "policy", None),
                        registry=self.gateway.registry,
                    )
                    if not is_allowed:
                        raise PermissionDeniedError(f"Delegated node execution denied: {reason}", tool_name=self.name, reason="DELEGATION_VIOLATION")

                decision = self.gateway.policy_engine.evaluate(tool_call, self.gateway.config.policy)
                if decision.verdict.value == "DENY":
                    raise PermissionDeniedError(f"Node '{self.name}' is denied by policy.", tool_name=self.name)
                if decision.verdict.value == "REQUIRE_APPROVAL" and not approval_id:
                    raise ApprovalRequiredError(
                        f"Node '{self.name}' requires human approval before execution.",
                        tool_name=self.name,
                        action_hash=tool_call.action_hash,
                        approval_id=f"appr_{tool_call.action_hash[:16]}",
                    )

                output_state = await self.func(state)
                if not isinstance(output_state, dict):
                    output_state = {"result": output_state}

                output_state["trace_id"] = trace_id
                if intent_id:
                    output_state["intent_id"] = intent_id
                output_state["_sictack_status"] = "APPROVED"
                output_state["_intentlock_status"] = "APPROVED"
                return output_state
            except ApprovalRequiredError as e:
                updated_state = dict(state)
                updated_state["_sictack_status"] = "REQUIRE_APPROVAL"
                updated_state["_intentlock_status"] = "REQUIRE_APPROVAL"
                updated_state["_approval_id"] = e.approval_id
                updated_state["_action_hash"] = getattr(e, "action_hash", "")
                updated_state["_pending_node"] = self.name
                return updated_state
            except PermissionDeniedError:
                if self.fail_closed:
                    raise
                updated_state = dict(state)
                updated_state["_sictack_status"] = "DENIED"
                updated_state["_intentlock_status"] = "DENIED"
                return updated_state

        return self(state)


def secure_langgraph_node(
    name: str,
    agent: Optional[SecureAgent] = None,
    security: Optional[Any] = None,
    gateway: Optional[ActionGateway] = None,
    permission: Optional[str] = None,
    sensitivity: int = 0,
):
    """Decorator to convert a standard LangGraph node function into a SecureGraphNode."""
    def decorator(func: Callable[[Dict[str, Any]], Dict[str, Any]]):
        return SecureGraphNode(
            name=name,
            func=func,
            agent=agent,
            security=security,
            gateway=gateway,
            permission=permission,
            sensitivity=sensitivity,
        )
    return decorator
