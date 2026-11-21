"""
SICTACK – Global AI Agent Runtime Security Infrastructure.

The Security Infrastructure for the Autonomous AI Economy.
"Secure the action. Protect the intention."

Provides deterministic policy evaluation (SICTACK CORE), behavioral
intelligence and cascading containment (SICTACK SENTINEL), human-in-the-loop
approval workflows, parameter-level boundary enforcement, and immutable
audit logging for AI agent tool invocations and multi-agent topologies.

Official PyPI distribution:
    pip install sictack

Quick start::

    from sictack import Sictack

    security = Sictack()

    @security.protect_tool(name="read_file", permission="file:read")
    def read_file(path: str):
        return open(path).read()

    with security.task("Process document", allowed_tools=["read_file"]) as task:
        task.execute("read_file", path="doc.txt")
"""

from sictack.agent import SecureAgent
from sictack.client import SictackClient, IntentLockClient
from sictack.unified import Sictack, IntentLock, TaskContext
from sictack.exceptions import SictackError, IntentLockError
from sictack.models import (
    AgentIdentity,
    ApprovalRequest,
    ApprovalStatus,
    AuditEvent,
    Config,
    Decision,
    DecisionVerdict,
    DelegationToken,
    EnvironmentClassification,
    IntentContext,
    Policy,
    RegisteredTool,
    RiskLevel,
    SecurityMode,
    ToolCall,
)
from sictack.integrations import (
    SecureTool,
    secure_langchain_tool,
    SecureGraphNode,
    secure_langgraph_node,
    MCPSecurityProxy,
)
from sictack.provenance import (
    DataProvenanceRecord,
    ProvenanceLineageNode,
    ProvenanceTracker,
    SourceType,
    TrustLevel,
    TrustPolicyEngine,
)
from sictack.sentinel.tool_output_analyzer import (
    ToolOutputSecurityAnalyzer,
    ToolOutputThreatDetection,
    ToolOutputThreatType,
)
from sictack.integrity import (
    ExecutionIntegrityDigest,
    ExecutionIntegrityResult,
    ExecutionIntegrityValidator,
)
from sictack.isolation import (
    ExecutionLimits,
    IsolatedExecutionResult,
    IsolationMode,
    RuntimeSandbox,
)
from sictack.audit import (
    EvidenceChainEntry,
    EvidenceChainVerificationResult,
    TamperEvidentEvidenceChain,
)

__version__ = "1.0.0"

__all__ = [
    # Official SICTACK API
    "Sictack",
    "SictackClient",
    "SictackError",
    "TaskContext",
    "SecureAgent",
    "AgentIdentity",
    "DelegationToken",
    "Config",
    "Policy",
    "ToolCall",
    "Decision",
    "DecisionVerdict",
    "SecurityMode",
    "EnvironmentClassification",
    "RiskLevel",
    "ApprovalStatus",
    "AuditEvent",
    "ApprovalRequest",
    "IntentContext",
    "RegisteredTool",
    "SecureTool",
    "secure_langchain_tool",
    "SecureGraphNode",
    "secure_langgraph_node",
    "MCPSecurityProxy",
    # Phase 4D Provenance, Integrity & Isolation
    "DataProvenanceRecord",
    "ProvenanceLineageNode",
    "ProvenanceTracker",
    "SourceType",
    "TrustLevel",
    "TrustPolicyEngine",
    "ToolOutputSecurityAnalyzer",
    "ToolOutputThreatDetection",
    "ToolOutputThreatType",
    "ExecutionIntegrityDigest",
    "ExecutionIntegrityResult",
    "ExecutionIntegrityValidator",
    "ExecutionLimits",
    "IsolatedExecutionResult",
    "IsolationMode",
    "RuntimeSandbox",
    "EvidenceChainEntry",
    "EvidenceChainVerificationResult",
    "TamperEvidentEvidenceChain",
    "__version__",
    # Backward compatibility aliases
    "IntentLock",
    "IntentLockClient",
    "IntentLockError",
]
