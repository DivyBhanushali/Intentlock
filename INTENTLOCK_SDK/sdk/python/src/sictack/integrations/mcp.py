"""
INTENTLOCK – Model Context Protocol (MCP) Security Proxy.

Secures MCP JSON-RPC 2.0 tool execution boundaries against unauthorized access,
prompt injection tool misuse, and data exfiltration.
"""

from __future__ import annotations

from typing import Any, Callable, Dict, List, Optional
from sictack.agent import SecureAgent
from sictack.gateway import ActionGateway
from sictack.models import ToolCall, DecisionVerdict
from sictack.exceptions import (
    PermissionDeniedError,
    ApprovalRequiredError,
    IntentLockError,
)


class MCPSecurityProxy:
    """
    A security proxy for Model Context Protocol (MCP) servers and clients.
    
    Intercepts standard MCP JSON-RPC requests (specifically `tools/call`),
    enforces deterministic IntentLock security policies, and returns
    protocol-compliant MCP responses.
    """

    def __init__(
        self,
        gateway: Optional[ActionGateway] = None,
        agent: Optional[SecureAgent] = None,
        security: Optional[Any] = None,
        agent_id: str = "mcp-agent",
    ):
        """
        Initialize the MCP Security Proxy.

        :param gateway: Optional ActionGateway instance.
        :param agent: Optional SecureAgent instance.
        :param security: Optional IntentLock unified client instance.
        :param agent_id: Identifier for the client agent connecting via MCP.
        """
        self.security = security
        if agent is not None:
            self.gateway = agent.gateway
            self.agent_id = agent.agent_id
        elif security is not None:
            self.gateway = security.gateway
            self.agent_id = security.agent_id
        elif gateway is not None:
            self.gateway = gateway
            self.agent_id = agent_id
        else:
            raise ValueError("Either 'security', 'gateway', or 'agent' must be provided to MCPSecurityProxy.")

    def register_mcp_tool(
        self,
        name: str,
        handler: Callable[..., Any],
        permission: Optional[str] = None,
        sensitivity: int = 0,
        description: str = "",
        parameters_schema: Optional[Dict[str, Any]] = None,
    ) -> None:
        """
        Register a tool exported by the MCP server with IntentLock.
        """
        self.gateway.registry.register(
            name=name,
            handler=handler,
            permission=permission or name,
            sensitivity=sensitivity,
            description=description,
            schema=parameters_schema,
        )

    def handle_call_tool(
        self,
        name: str,
        arguments: Dict[str, Any],
        user_request: str = "",
        approval_id: Optional[str] = None,
        intent_id: Optional[str] = None,
        trace_id: Optional[str] = None,
        parent_agent_id: Optional[str] = None,
        delegation_id: Optional[str] = None,
        delegation_depth: int = 0,
        delegation_token: Optional[Any] = None,
    ) -> Dict[str, Any]:
        """
        Handle an MCP `tools/call` invocation directly.

        Returns a standard MCP tool response dictionary:
        `{"content": [{"type": "text", "text": "..."}], "isError": bool}`
        """
        p_agent_id = parent_agent_id or (delegation_token.parent_agent_id if delegation_token else "")
        d_id = delegation_id or (delegation_token.delegation_id if delegation_token else "")
        d_depth = delegation_depth or (delegation_token.depth if delegation_token else 0)

        tc = ToolCall(
            tool_name=name,
            arguments=arguments,
            agent_id=self.agent_id,
            user_request=user_request,
            intent_id=intent_id or "",
            trace_id=trace_id or "",
            parent_agent_id=p_agent_id,
            delegation_id=d_id,
            delegation_depth=d_depth,
        )

        try:
            if delegation_token and self.security:
                is_allowed, reason = self.security.delegation_engine.evaluate_delegated_call(
                    tool_call=tc,
                    delegation_token=delegation_token,
                    parent_policy=getattr(self.security, "policy", None),
                    child_policy=getattr(self.security, "policy", None),
                    registry=self.gateway.registry,
                )
                if not is_allowed:
                    raise PermissionDeniedError(f"Delegated MCP tool execution denied: {reason}", tool_name=name, reason="DELEGATION_VIOLATION")

            if approval_id:
                result = self.gateway.execute_with_approval(tc, approval_id=approval_id)
            else:
                result = self.gateway.execute(tc)

            # Format result text cleanly
            if isinstance(result, str):
                text_content = result
            elif isinstance(result, (dict, list)):
                import json
                text_content = json.dumps(result, default=str)
            else:
                text_content = str(result)

            meta = {
                "verdict": DecisionVerdict.ALLOW.value,
                "allowed": True,
            }
            return {
                "content": [{"type": "text", "text": text_content}],
                "isError": False,
                "_sictack": meta,
                "_intentlock": meta,
            }

        except ApprovalRequiredError as exc:
            meta = {
                "verdict": DecisionVerdict.REQUIRE_APPROVAL.value,
                "allowed": False,
                "approval_id": exc.approval_id,
                "reason": str(exc),
            }
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"[SICTACK_APPROVAL_REQUIRED] Tool '{name}' requires human authorization. {str(exc)}",
                    }
                ],
                "isError": True,
                "_sictack": meta,
                "_intentlock": meta,
            }

        except PermissionDeniedError as exc:
            meta = {
                "verdict": DecisionVerdict.DENY.value,
                "allowed": False,
                "reason": str(exc),
            }
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"[SICTACK_SECURITY_BLOCK] Tool '{name}' was blocked by security policy. {str(exc)}",
                    }
                ],
                "isError": True,
                "_sictack": meta,
                "_intentlock": meta,
            }

        except IntentLockError as exc:
            meta = {
                "verdict": DecisionVerdict.DENY.value,
                "allowed": False,
                "reason": str(exc),
            }
            return {
                "content": [
                    {
                        "type": "text",
                        "text": f"[SICTACK_ERROR] {exc.__class__.__name__}: {str(exc)}",
                    }
                ],
                "isError": True,
                "_sictack": meta,
                "_intentlock": meta,
            }

    def handle_jsonrpc(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process a full MCP JSON-RPC 2.0 message packet.

        Supports:
        - `tools/call`: Intercepted and policy-verified.
        - `tools/list`: Returns registered tools.
        """
        msg_id = request.get("id")
        method = request.get("method")
        params = request.get("params", {})

        if method == "tools/list":
            tools_list = []
            for tool in self.gateway.registry.list_tools():
                tools_list.append({
                    "name": tool.name,
                    "description": tool.description,
                    "inputSchema": tool.parameters_schema or {"type": "object", "properties": {}},
                })
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"tools": tools_list},
            }

        if method == "tools/call":
            tool_name = params.get("name", "")
            arguments = params.get("arguments", {})
            user_request = params.get("user_request", "")
            approval_id = params.get("approval_id")
            intent_id = params.get("intent_id")
            trace_id = params.get("trace_id")

            tool_result = self.handle_call_tool(
                name=tool_name,
                arguments=arguments,
                user_request=user_request,
                approval_id=approval_id,
                intent_id=intent_id,
                trace_id=trace_id,
            )

            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": tool_result,
            }

        # Unknown method
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {
                "code": -32601,
                "message": f"Method '{method}' not found or not supported by IntentLock MCP proxy.",
            },
        }
