"""
INTENTLOCK – SecureAgent (Developer-Facing API).

:class:`SecureAgent` wraps all internal services into a single, ergonomic
entry-point for application developers.  It manages the tool registry,
policy engine, approval service, audit trail, and action gateway behind
a simple interface.

Usage::

    from intentlock import SecureAgent

    agent = SecureAgent(
        agent_id="my-agent",
        permissions=["file:read", "email:send"],
    )
    agent.register_tool("read_file", read_file_fn, permission="file:read")
    result = agent.execute(tool_name="read_file", arguments={"path": "/tmp/x"})
"""

from __future__ import annotations

from typing import Any, Callable

from intentlock.approval import ApprovalService
from intentlock.audit import AuditService
from intentlock.gateway import ActionGateway
from intentlock.models import (
    ApprovalRequest,
    AuditEvent,
    Config,
    Policy,
    RegisteredTool,
    ToolCall,
)
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry
from intentlock.risk_engine import RiskEngine


class SecureAgent:
    """
    High-level, developer-facing API for INTENTLOCK.

    Parameters
    ----------
    agent_id:
        Unique identifier for this agent instance.
    permissions:
        List of permission strings the agent is allowed to use.
        A default :class:`Policy` is built from this list.
    config:
        SDK-level configuration.  If ``None``, a default
        :class:`Config` is created whose ``default_policy`` is derived
        from *permissions*.
    """

    def __init__(
        self,
        agent_id: str = "default-agent",
        permissions: list[str] | None = None,
        config: Config | None = None,
    ) -> None:
        self._agent_id: str = agent_id
        self._permissions: list[str] = permissions or []

        # Build the default policy from the permission list.
        default_policy = Policy(
            allowed_permissions=list(self._permissions),
            description=f"Auto-generated policy for agent '{agent_id}'",
        )

        # Resolve configuration.
        if config is not None:
            self._config = config
            # If the caller didn't set a default_policy, inject ours.
            if self._config.default_policy is None:
                self._config.default_policy = default_policy
        else:
            self._config = Config(default_policy=default_policy)

        # Internal services.
        self._registry = ToolRegistry()
        self._policy_engine = PolicyEngine()
        self._risk_engine = RiskEngine()
        self._approval_service = ApprovalService(
            timeout_seconds=self._config.approval_timeout_seconds,
        )
        self._audit_service = AuditService(
            enabled=self._config.audit_enabled,
        )
        self._gateway = ActionGateway(
            registry=self._registry,
            policy_engine=self._policy_engine,
            risk_engine=self._risk_engine,
            approval_service=self._approval_service,
            audit_service=self._audit_service,
            config=self._config,
        )

    # ------------------------------------------------------------------
    # Tool registration
    # ------------------------------------------------------------------

    def register_tool(
        self,
        name: str,
        handler: Callable[..., Any],
        permission: str,
        description: str = "",
        sensitivity: int = 0,
        schema: dict[str, Any] | None = None,
    ) -> None:
        """Register a tool with the agent's internal registry."""
        self._registry.register(
            name=name,
            handler=handler,
            permission=permission,
            description=description,
            sensitivity=sensitivity,
            schema=schema,
        )

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------

    def execute(
        self,
        tool_call: ToolCall | None = None,
        *,
        tool_name: str = "",
        arguments: dict[str, Any] | None = None,
        user_request: str = "",
    ) -> Any:
        """
        Evaluate and execute a tool invocation.

        Accepts either a pre-built :class:`ToolCall` or individual keyword
        arguments (``tool_name``, ``arguments``, ``user_request``).

        Returns the tool handler's return value.
        """
        tc = self._resolve_tool_call(
            tool_call=tool_call,
            tool_name=tool_name,
            arguments=arguments,
            user_request=user_request,
        )
        return self._gateway.execute(tc)

    def execute_with_approval(
        self,
        tool_call: ToolCall | None = None,
        approval_id: str = "",
        *,
        tool_name: str = "",
        arguments: dict[str, Any] | None = None,
    ) -> Any:
        """
        Execute a tool invocation using a pre-approved approval token.
        """
        if not approval_id:
            raise ValueError("approval_id is required")

        tc = self._resolve_tool_call(
            tool_call=tool_call,
            tool_name=tool_name,
            arguments=arguments,
        )
        return self._gateway.execute_with_approval(tc, approval_id)

    # ------------------------------------------------------------------
    # Approval management
    # ------------------------------------------------------------------

    def get_pending_approvals(self) -> list[ApprovalRequest]:
        """Return all pending, non-expired approval requests."""
        return self._approval_service.list_pending()

    def approve(
        self,
        approval_id: str,
        approver_id: str = "human",
    ) -> ApprovalRequest:
        """Mark an approval request as APPROVED."""
        return self._approval_service.approve(approval_id, approver_id)

    def reject(
        self,
        approval_id: str,
        approver_id: str = "human",
    ) -> ApprovalRequest:
        """Mark an approval request as REJECTED."""
        return self._approval_service.reject(approval_id, approver_id)

    # ------------------------------------------------------------------
    # Audit
    # ------------------------------------------------------------------

    def get_audit_log(self, limit: int = 100) -> list[AuditEvent]:
        """Return the most recent audit events (newest first)."""
        return self._audit_service.get_events(limit=limit)

    # ------------------------------------------------------------------
    # Properties
    # ------------------------------------------------------------------

    @property
    def gateway(self) -> ActionGateway:
        """Return the underlying ActionGateway instance."""
        return self._gateway

    @property
    def policy(self) -> Policy:
        """Return the current default policy."""
        if self._config.default_policy is not None:
            return self._config.default_policy
        # Should never happen given __init__ logic, but fail-closed.
        return Policy(description="empty fallback policy")

    @property
    def tools(self) -> list[RegisteredTool]:
        """Return descriptors for all registered tools."""
        return self._registry.list_tools()

    @property
    def agent_id(self) -> str:
        """Return this agent's identifier."""
        return self._agent_id

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _resolve_tool_call(
        self,
        *,
        tool_call: ToolCall | None,
        tool_name: str = "",
        arguments: dict[str, Any] | None = None,
        user_request: str = "",
    ) -> ToolCall:
        """Build a :class:`ToolCall`, either from the given object or kwargs."""
        if tool_call is not None:
            # Ensure agent_id is set.
            if tool_call.agent_id == "default-agent":
                tool_call.agent_id = self._agent_id
            return tool_call

        if not tool_name:
            raise ValueError(
                "Either a ToolCall object or tool_name must be provided"
            )

        return ToolCall(
            tool_name=tool_name,
            arguments=arguments or {},
            agent_id=self._agent_id,
            user_request=user_request,
        )
