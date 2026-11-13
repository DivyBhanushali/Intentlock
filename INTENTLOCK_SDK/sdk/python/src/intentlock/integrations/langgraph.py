"""
INTENTLOCK 2.0 — LangGraph Ecosystem Integration
Provides secure stateful workflow nodes, tool interception, and human-in-the-loop
approval branching for LangGraph multi-agent execution graphs.
"""

from __future__ import annotations

import functools
import uuid
from typing import Any, Callable, Dict, Optional, Union

from intentlock.agent import SecureAgent
from intentlock.gateway import ActionGateway
from intentlock.models import ToolCall, DecisionVerdict
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError


class SecureGraphNode:
    """
    Wraps a LangGraph node execution with deterministic INTENTLOCK security governance.
    Extracts intent_id, trace_id, and user context from graph state, intercepts
    actions, and handles human-in-the-loop approval requests cleanly.
    """

    def __init__(
        self,
        name: str,
        func: Callable[[Dict[str, Any]], Dict[str, Any]],
        agent: Optional[SecureAgent] = None,
        gateway: Optional[ActionGateway] = None,
        permission: Optional[str] = None,
        sensitivity: int = 0,
        fail_closed: bool = True,
    ):
        self.name = name
        self.func = func
        self.agent = agent
        self.gateway = gateway or (agent.gateway if agent else None)
        self.permission = permission or name
        self.sensitivity = sensitivity
        self.fail_closed = fail_closed

        if not self.gateway:
            raise ValueError("SecureGraphNode requires either an 'agent' or 'gateway' instance.")

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
        agent_id = state.get("agent_id") or (self.agent.agent_id if self.agent else "langgraph-agent")
        approval_id = state.get("approval_id")

        tool_call = ToolCall(
            tool_name=self.name,
            arguments={"state": state},
            agent_id=agent_id,
            intent_id=intent_id or "",
            trace_id=trace_id,
            sensitivity=self.sensitivity,
        )

        try:
            if approval_id:
                output_state = self.gateway.execute_with_approval(tool_call, approval_id=approval_id)
            else:
                output_state = self.gateway.execute(tool_call)

            if not isinstance(output_state, dict):
                output_state = {"result": output_state}

            output_state["trace_id"] = trace_id
            if intent_id:
                output_state["intent_id"] = intent_id
            output_state["_intentlock_status"] = "APPROVED"
            return output_state

        except ApprovalRequiredError as e:
            updated_state = dict(state)
            updated_state["_intentlock_status"] = "REQUIRE_APPROVAL"
            updated_state["_approval_id"] = e.approval_id
            updated_state["_action_hash"] = getattr(e, "action_hash", "")
            updated_state["_pending_node"] = self.name
            return updated_state

        except PermissionDeniedError:
            if self.fail_closed:
                raise
            updated_state = dict(state)
            updated_state["_intentlock_status"] = "DENIED"
            return updated_state


def secure_langgraph_node(
    name: str,
    agent: Optional[SecureAgent] = None,
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
            gateway=gateway,
            permission=permission,
            sensitivity=sensitivity,
        )
    return decorator
