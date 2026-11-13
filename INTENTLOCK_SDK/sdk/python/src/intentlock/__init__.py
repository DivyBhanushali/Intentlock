"""
INTENTLOCK – AI Agent Authorization & Security SDK.

Provides deterministic policy evaluation, human-in-the-loop approval
workflows, risk scoring, and immutable audit logging for AI agent tool
invocations.

Quick start::

    from intentlock import SecureAgent

    agent = SecureAgent(agent_id="my-agent", permissions=["file:read"])
    agent.register_tool("read_file", my_handler, permission="file:read")
    result = agent.execute(tool_name="read_file", arguments={"path": "/tmp/x"})
"""

from intentlock.agent import SecureAgent
from intentlock.client import IntentLockClient
from intentlock.models import (
    ApprovalRequest,
    ApprovalStatus,
    AuditEvent,
    Config,
    Decision,
    DecisionVerdict,
    IntentContext,
    Policy,
    RegisteredTool,
    RiskLevel,
    ToolCall,
)
from intentlock.integrations import (
    SecureTool,
    secure_langchain_tool,
    MCPSecurityProxy,
)

__version__ = "0.1.0"

__all__ = [
    "SecureAgent",
    "IntentLockClient",
    "Config",
    "Policy",
    "ToolCall",
    "Decision",
    "DecisionVerdict",
    "RiskLevel",
    "ApprovalStatus",
    "AuditEvent",
    "ApprovalRequest",
    "IntentContext",
    "RegisteredTool",
    "SecureTool",
    "secure_langchain_tool",
    "MCPSecurityProxy",
    "__version__",
]
