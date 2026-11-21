"""
INTENTLOCK – LangChain & LangGraph Tool Security Integration.

Provides wrappers to secure LangChain tools with IntentLock's deterministic
policy engine, interception gateway, and audit trail.
"""

from __future__ import annotations

import inspect
from typing import Any, Callable, Dict, Optional, Union
from sictack.agent import SecureAgent
from sictack.gateway import ActionGateway
from sictack.models import ToolCall, DelegationToken
from sictack.exceptions import PermissionDeniedError, ApprovalRequiredError, IntentLockError


class SecureTool:
    """
    A LangChain-compatible tool wrapper that intercepts invocations through IntentLock.
    
    Can wrap existing functions or LangChain BaseTool instances. Implements
    the standard LangChain invocation methods: `run()`, `_run()`, and `invoke()`.
    Supports unified IntentLock client and multi-agent delegation tokens.
    """

    def __init__(
        self,
        name: str,
        func: Callable[..., Any],
        description: str = "",
        gateway: Optional[ActionGateway] = None,
        agent: Optional[SecureAgent] = None,
        security: Optional[Any] = None,
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
        :param security: Optional IntentLock unified client instance.
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
        self._security = security

        if agent is not None:
            self._gateway = agent.gateway
            self._agent_id = agent.agent_id
            if not self._gateway.registry.has(name):
                agent.register_tool(name=name, handler=func, permission=self.permission, sensitivity=sensitivity)
        elif security is not None:
            self._gateway = security.gateway
            self._agent_id = security.agent_id
            if not self._gateway.registry.has(name):
                self._gateway.registry.register(name=name, handler=func, permission=self.permission, sensitivity=sensitivity)
        elif gateway is not None:
            self._gateway = gateway
            self._agent_id = "langchain-agent"
            if not self._gateway.registry.has(name):
                self._gateway.registry.register(name=name, handler=func, permission=self.permission, sensitivity=sensitivity)
        else:
            raise ValueError("Either 'security', 'gateway', or 'agent' must be provided to SecureTool.")

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
        delegation_token: Optional[DelegationToken] = None,
        parent_agent_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Execute the tool through the IntentLock gateway (LangChain `run` protocol).
        Supports multi-agent delegation token verification and parent-child tracking.
        """
        if isinstance(tool_input, dict):
            args = {**tool_input, **kwargs}
        elif tool_input == "" and kwargs:
            args = kwargs
        else:
            args = self._normalize_args(tool_input, **kwargs)

        p_agent_id = parent_agent_id or (delegation_token.parent_agent_id if delegation_token else "")
        d_id = delegation_token.delegation_id if delegation_token else ""
        d_depth = delegation_token.depth if delegation_token else 0

        tc = ToolCall(
            tool_name=self.name,
            arguments=args,
            agent_id=self._agent_id,
            user_request=user_request,
            parent_agent_id=p_agent_id,
            delegation_id=d_id,
            delegation_depth=d_depth,
        )

        try:
            if delegation_token and self._security:
                is_allowed, reason = self._security.delegation_engine.evaluate_delegated_call(
                    tool_call=tc,
                    delegation_token=delegation_token,
                    parent_policy=getattr(self._security, "policy", None),
                    child_policy=getattr(self._security, "policy", None),
                    registry=self._gateway.registry,
                )
                if not is_allowed:
                    raise PermissionDeniedError(f"Delegated action denied: {reason}", tool_name=self.name, reason="DELEGATION_VIOLATION")

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

    async def arun(
        self,
        tool_input: Union[str, Dict[str, Any], Any] = "",
        user_request: str = "",
        approval_id: Optional[str] = None,
        delegation_token: Optional[DelegationToken] = None,
        parent_agent_id: Optional[str] = None,
        **kwargs: Any,
    ) -> Any:
        """
        Asynchronously execute the tool through the SICTACK gateway (LangChain `arun` protocol).
        If the wrapped tool function is an async coroutine, it awaits it after policy authorization.
        """
        import asyncio
        if inspect.iscoroutinefunction(self.func):
            if isinstance(tool_input, dict):
                args = {**tool_input, **kwargs}
            elif tool_input == "" and kwargs:
                args = kwargs
            else:
                args = self._normalize_args(tool_input, **kwargs)

            p_agent_id = parent_agent_id or (delegation_token.parent_agent_id if delegation_token else "")
            d_id = delegation_token.delegation_id if delegation_token else ""
            d_depth = delegation_token.depth if delegation_token else 0

            tc = ToolCall(
                tool_name=self.name,
                arguments=args,
                agent_id=self._agent_id,
                user_request=user_request,
                parent_agent_id=p_agent_id,
                delegation_id=d_id,
                delegation_depth=d_depth,
            )

            try:
                if delegation_token and self._security:
                    is_allowed, reason = self._security.delegation_engine.evaluate_delegated_call(
                        tool_call=tc,
                        delegation_token=delegation_token,
                        parent_policy=getattr(self._security, "policy", None),
                        child_policy=getattr(self._security, "policy", None),
                        registry=self._gateway.registry,
                    )
                    if not is_allowed:
                        raise PermissionDeniedError(f"Delegated action denied: {reason}", tool_name=self.name, reason="DELEGATION_VIOLATION")

                # Authorize via policy engine through gateway
                decision = self._gateway.policy_engine.evaluate(tc, self._gateway.config.policy)
                if decision.verdict.value == "DENY":
                    raise PermissionDeniedError(f"Tool '{self.name}' is denied by policy.", tool_name=self.name)
                if decision.verdict.value == "REQUIRE_APPROVAL" and not approval_id:
                    raise ApprovalRequiredError(
                        f"Tool '{self.name}' requires human approval before execution.",
                        tool_name=self.name,
                        action_hash=tc.action_hash,
                        approval_id=f"appr_{tc.action_hash[:16]}",
                    )
                return await self.func(**args)
            except IntentLockError as exc:
                if self.handle_tool_error:
                    return f"[SECURITY_ERROR: {exc.__class__.__name__}] {str(exc)}"
                raise

        # For synchronous functions, run synchronously in executor or directly
        return self.run(
            tool_input=tool_input,
            user_request=user_request,
            approval_id=approval_id,
            delegation_token=delegation_token,
            parent_agent_id=parent_agent_id,
            **kwargs,
        )

    async def ainvoke(self, input_data: Any, config: Optional[Dict[str, Any]] = None) -> Any:
        """
        Async LangChain Runnable `ainvoke` interface.
        """
        user_request = ""
        approval_id = None
        if config and isinstance(config, dict):
            metadata = config.get("metadata", {})
            user_request = metadata.get("user_request", "")
            approval_id = metadata.get("approval_id")

        if isinstance(input_data, dict):
            return await self.arun(tool_input=input_data, user_request=user_request, approval_id=approval_id)
        return await self.arun(tool_input=input_data, user_request=user_request, approval_id=approval_id)


def secure_langchain_tool(
    tool_or_func: Optional[Any] = None,
    *,
    agent: Optional[SecureAgent] = None,
    security: Optional[Any] = None,
    gateway: Optional[ActionGateway] = None,
    permission: Optional[str] = None,
    sensitivity: int = 0,
    handle_tool_error: bool = True,
) -> Union[SecureTool, Callable[[Any], SecureTool]]:
    """
    Wrap an existing callable or LangChain tool with SICTACK security enforcement.
    Supports both direct function wrapping and decorator syntax:

        @secure_langchain_tool(security=security, permission="db:read")
        def query_database(sql: str) -> str:
            ...
    """
    def decorator(fn: Any) -> SecureTool:
        if hasattr(fn, "name") and hasattr(fn, "func"):
            name = fn.name
            func = fn.func
            desc = getattr(fn, "description", "")
        elif hasattr(fn, "name") and callable(getattr(fn, "_run", None)):
            name = fn.name
            func = fn._run
            desc = getattr(fn, "description", "")
        elif callable(fn):
            name = getattr(fn, "__name__", "custom_tool")
            func = fn
            desc = getattr(fn, "__doc__", "") or ""
        else:
            raise TypeError(f"Cannot wrap object of type {type(fn)} as a SecureTool.")

        return SecureTool(
            name=name,
            func=func,
            description=desc,
            agent=agent,
            security=security,
            gateway=gateway,
            permission=permission,
            sensitivity=sensitivity,
            handle_tool_error=handle_tool_error,
        )

    if tool_or_func is None:
        return decorator
    return decorator(tool_or_func)
