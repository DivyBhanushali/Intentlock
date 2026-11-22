// SICTACK 1.0 – Tool Protection & Adapters Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SdkToolProtectionPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Python SDK", href: "/developers/sdk" },
    { label: "Tool Protection", href: "/developers/sdk/tool-protection" },
  ];

  const toc: TocItem[] = [
    { id: "register-tool", title: "Registering Native Tools", level: 2 },
    { id: "execute-tool", title: "Executing Protected Tools", level: 2 },
    { id: "approval-resumption", title: "Resuming with Approvals", level: 2 },
    { id: "langchain-adapter", title: "LangChain Integration (SecureTool)", level: 2 },
    { id: "langgraph-adapter", title: "LangGraph Integration (SecureGraphNode)", level: 2 },
    { id: "mcp-adapter", title: "MCP Integration (MCPSecurityProxy)", level: 2 },
  ];

  const registerCode = `def fetch_weather(city: str) -> dict:
    return {"city": city, "temperature_c": 22, "condition": "Sunny"}

# Register the Python function with SecureAgent
agent.register_tool(
    name="fetch_weather",
    func=fetch_weather,
    description="Fetches real-time weather metrics for a specified city",
    parameters={
        "type": "object",
        "properties": {
            "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"],
    },
)`;

  const executeCode = `from sictack import ToolCall

# Construct the immutable ToolCall model
call = ToolCall(tool_name="fetch_weather", arguments={"city": "San Francisco"})

# Executes the callable if allowed; raises exception if denied or requiring approval
result = agent.execute(call)
print(result)
# -> {'city': 'San Francisco', 'temperature_c': 22, 'condition': 'Sunny'}`;

  const approvalCode = `from sictack import ToolCall
from sictack.exceptions import ApprovalRequiredError

call = ToolCall(tool_name="restart_server", arguments={"server_id": "srv-99"})

try:
    agent.execute(call)
except ApprovalRequiredError as e:
    # 1. Capture the issued approval_id
    ticket_id = e.approval_id
    
    # 2. Operator authorizes the action via UI or script
    agent.approve(ticket_id)
    
    # 3. Resume execution using the single-use token
    result = agent.execute_with_approval(call, approval_id=ticket_id)
    print("Action executed:", result)`;

  const langchainCode = `from langchain_core.tools import tool
from sictack.integrations.langchain import SecureTool, secure_langchain_tool

@tool
def calculate_vat(subtotal: float, country_code: str) -> float:
    """Calculates tax rate based on jurisdiction."""
    return subtotal * 0.20

# Method 1: Class wrapper
protected_tool = SecureTool(tool=calculate_vat, agent=agent)

# Method 2: Convenience decorator / helper
secured_tool = secure_langchain_tool(calculate_vat, agent=agent)

# When LangChain invokes the tool, SICTACK intercepts it automatically
tax = protected_tool.invoke({"subtotal": 100.0, "country_code": "GB"})`;

  const langgraphCode = `from sictack.integrations.langgraph import SecureGraphNode

# Wrap a graph state node before registering it in your StateGraph
def process_refund_node(state: dict) -> dict:
    # Business logic for refunds
    return {"status": "refund_issued", "amount": state["amount"]}

secure_node = SecureGraphNode(
    name="process_refund",
    node_func=process_refund_node,
    agent=agent
)

# Use secure_node inside your langgraph.graph.StateGraph`;

  const mcpCode = `from sictack.integrations.mcp import MCPSecurityProxy

# Wrap an existing MCP client connection with deterministic policy enforcement
proxy = MCPSecurityProxy(agent=agent)

# All incoming call_tool requests are verified against agent policies
response = proxy.intercept_tool_call(
    tool_name="read_file",
    arguments={"path": "/etc/hosts"}
)`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Python SDK
            </span>
            <span className="text-xs text-[#787A80]">Execution Protection</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Tool Protection &amp; Adapters
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Protect native Python callables, LangChain tools, LangGraph state nodes, and Model Context Protocol (MCP) servers with deterministic policy enforcement.
          </p>
        </div>

        {/* Section: Registering Native Tools */}
        <section id="register-tool" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Registering Native Tools
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Register any standard Python callable with <code className="text-[#234E39] font-mono">SecureAgent.register_tool()</code>. SICTACK preserves original typing, return values, and docstrings:
          </p>

          <CodeBlock code={registerCode} language="python" filename="register_tool.py" />
        </section>

        {/* Section: Executing Tools */}
        <section id="execute-tool" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Executing Protected Tools
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Execute tools by passing a <code className="text-[#234E39] font-mono">ToolCall</code> instance into <code className="text-[#234E39] font-mono">agent.execute()</code>. Prior to executing the underlying callable, the agent verifies permissions, evaluates policies, and computes the action hash:
          </p>

          <CodeBlock code={executeCode} language="python" filename="execute_tool.py" />
        </section>

        {/* Section: Approval Resumption */}
        <section id="approval-resumption" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Resuming with Approvals
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            When a tool requires human confirmation, <code className="text-[#234E39] font-mono">execute()</code> raises an <code className="text-[#8D5B18] font-mono">ApprovalRequiredError</code>. Resume execution with <code className="text-[#234E39] font-mono">execute_with_approval()</code>:
          </p>

          <CodeBlock code={approvalCode} language="python" filename="resume_approval.py" />

          <Callout type="tip" title="Parameter Tampering Protection">
            <p className="text-xs leading-relaxed">
              If an attacker attempts to alter the parameters inside <code className="font-mono text-[#234E39]">call.arguments</code> between the initial denial and calling <code className="font-mono text-[#234E39]">execute_with_approval</code>, the action hash will not match and SICTACK will reject the call with an <code className="font-mono text-[#943425]">ApprovalMismatchError</code>.
            </p>
          </Callout>
        </section>

        {/* Section: LangChain */}
        <section id="langchain-adapter" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            LangChain Integration (SecureTool)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Wrap existing LangChain tools with <code className="text-[#234E39] font-mono">SecureTool</code>. The wrapped tool adheres to the LangChain <code className="text-[#56585D] font-mono">BaseTool</code> contract:
          </p>

          <CodeBlock code={langchainCode} language="python" filename="langchain_demo.py" />
        </section>

        {/* Section: LangGraph */}
        <section id="langgraph-adapter" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            LangGraph Integration (SecureGraphNode)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Guard state transitions and node executions in LangGraph graphs using <code className="text-[#234E39] font-mono">SecureGraphNode</code>:
          </p>

          <CodeBlock code={langgraphCode} language="python" filename="langgraph_demo.py" />
        </section>

        {/* Section: MCP */}
        <section id="mcp-adapter" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            MCP Integration (MCPSecurityProxy)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Intercept Model Context Protocol (MCP) tool invocations before they reach downstream MCP servers using <code className="text-[#234E39] font-mono">MCPSecurityProxy</code>:
          </p>

          <CodeBlock code={mcpCode} language="python" filename="mcp_demo.py" />
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Initialization & Config", href: "/developers/sdk/initialization" }}
          next={{ title: "Decisions & Approvals", href: "/developers/sdk/decisions" }}
        />
      </div>
    </DeveloperLayout>
  );
}
