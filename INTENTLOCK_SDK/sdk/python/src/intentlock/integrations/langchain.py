"""
INTENTLOCK – LangChain & LangGraph Tool Security Integration.

Provides wrappers to secure LangChain tools with IntentLock's deterministic
policy engine, interception gateway, and audit trail.
"""

from __future__ import annotations

import inspect
from typing import Any, Callable, Dict, Optional, Union
from intentlock.agent import SecureAgent
from intentlock.gateway import ActionGateway
from intentlock.models import ToolCall
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError, IntentLockError


class SecureTool:
    """
    A LangChain-compatible tool wrapper that intercepts invocations through IntentLock.
    
    Can wrap existing functions or LangChain BaseTool instances. Implements
    the standard LangChain invocation methods: `run()`, `_run()`, and `invoke()`.
    """

    def __init__(
        self,
        name: str,
        func: Callable[..., Any],
        description: str = "",
        gateway: Optional[ActionGateway] = None,
        agent: Optional[SecureAgent] = None,
        permission: Optional[str] = None,
        sensitivity: int = 0,
        return_direct: bool = False,
        handle_tool_error: bool = True,
    ):
        """
        Initialize a secured LangChain tool.

        :param name: Unique name of the tool (must match registered tool name in gateway).
        :param func: The executable handler.
        :param description: Tool description for LLM reasoning.
        :param gateway: Optional ActionGateway instance.
        :param agent: Optional SecureAgent instance (if provided, uses agent's gateway).
        :param permission: Optional permission string (e.g. 'email:read').
        :param sensitivity: Sensitivity rating (0 to 10).
        :param return_direct: Whether the tool output is returned directly to the user.
        :param handle_tool_error: If True, returns error strings instead of raising exceptions.
        """
        self.name = name
        self.func = func
        self.description = description
        self.return_direct = return_direct
        self.handle_tool_error = handle_tool_error
        self.permission = permission or name
        self.sensitivity = sensitivity

        if agent is not None:
            self._gateway = agent.gateway
            self._agent_id = agent.agent_id
            if not self._gateway.registry.has(name):
                agent.register_tool(name=name, handler=func, permission=self.permission, sensitivity=sensitivity)
        elif gateway is not None:
            self._gateway = gateway
            self._agent_id = "langchain-agent"
            if not self._gateway.registry.has(name):
                self._gateway.registry.register(name=name, handler=func, permission=self.permission, sensitivity=sensitivity)
        else:
            raise ValueError("Either 'gateway' or 'agent' must be provided to SecureTool.")

    def _normalize_args(self, *args: Any, **kwargs: Any) -> Dict[str, Any]:
        """Convert positional and keyword arguments into a clean argument dictionary."""
        if len(args) == 1 and isinstance(args[0], dict) and not kwargs:
            return args[0]
        
        if len(args) == 1 and not kwargs:
            sig = inspect.signature(self.func)
            params = list(sig.parameters.keys())
            if len(params) == 1:
                return {params[0]: args[0]}
            return {"input": args[0]}

        arg_dict = dict(kwargs)
        if args:
            sig = inspect.signature(self.func)
            params = list(sig.parameters.keys())
            for i, val in enumerate(args):
                if i < len(params):
                    arg_dict[params[i]] = val
        return arg_dict

    def run(
        self,
        tool_input: Union[str, Dict[str, Any], Any] = "",
        user_request: str = "",
        approval_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Execute the tool through the IntentLock gateway (LangChain `run` protocol).
        """
        if isinstance(tool_input, dict):
            args = {**tool_input, **kwargs}
        elif tool_input == "" and kwargs:
            args = kwargs
        else:
            args = self._normalize_args(tool_input, **kwargs)

        tc = ToolCall(
            tool_name=self.name,
            arguments=args,
            agent_id=self._agent_id,
            user_request=user_request,
        )

        try:
            if approval_id:
                return self._gateway.execute_with_approval(tc, approval_id=approval_id)
            return self._gateway.execute(tc)
        except IntentLockError as exc:
            if self.handle_tool_error:
                return f"[SECURITY_ERROR: {exc.__class__.__name__}] {str(exc)}"
            raise

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        """Internal runner compatible with LangChain BaseTool._run()."""
        normalized = self._normalize_args(*args, **kwargs)
        return self.run(normalized)

    def invoke(self, input_data: Any, config: Optional[Dict[str, Any]] = None) -> Any:
        """
        LangChain Runnable `invoke` interface.
        """
        user_request = ""
        approval_id = None
        if config and isinstance(config, dict):
            metadata = config.get("metadata", {})
            user_request = metadata.get("user_request", "")
            approval_id = metadata.get("approval_id")

        if isinstance(input_data, dict):
            return self.run(tool_input=input_data, user_request=user_request, approval_id=approval_id)
        return self.run(tool_input=input_data, user_request=user_request, approval_id=approval_id)

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        """Callable protocol support."""
        return self._run(*args, **kwargs)


def secure_langchain_tool(
    tool_or_func: Any,
    agent: Optional[SecureAgent] = None,
    gateway: Optional[ActionGateway] = None,
    permission: Optional[str] = None,
    sensitivity: int = 0,
    handle_tool_error: bool = True,
) -> SecureTool:
    """
    Wrap an existing callable or LangChain tool with IntentLock security enforcement.
    """
    if hasattr(tool_or_func, "name") and hasattr(tool_or_func, "func"):
        name = tool_or_func.name
        func = tool_or_func.func
        desc = getattr(tool_or_func, "description", "")
    elif hasattr(tool_or_func, "name") and callable(getattr(tool_or_func, "_run", None)):
        name = tool_or_func.name
        func = tool_or_func._run
        desc = getattr(tool_or_func, "description", "")
    elif callable(tool_or_func):
        name = getattr(tool_or_func, "__name__", "custom_tool")
        func = tool_or_func
        desc = getattr(tool_or_func, "__doc__", "") or ""
    else:
        raise TypeError(f"Cannot wrap object of type {type(tool_or_func)} as a SecureTool.")

    return SecureTool(
        name=name,
        func=func,
        description=desc,
        agent=agent,
        gateway=gateway,
        permission=permission,
        sensitivity=sensitivity,
        handle_tool_error=handle_tool_error,
    )
