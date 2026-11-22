// SICTACK 1.0 – Complete Code Examples Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function CompleteExamplesPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/examples" },
    { label: "Code Examples", href: "/developers/examples" },
  ];

  const toc: TocItem[] = [
    { id: "scenario-1", title: "1. Read-Only Research Assistant", level: 2 },
    { id: "scenario-2", title: "2. Restricted File-Access Agent", level: 2 },
    { id: "scenario-3", title: "3. Email Agent with Human Sign-Off", level: 2 },
    { id: "scenario-4", title: "4. LangChain Search Tool Protection", level: 2 },
    { id: "scenario-5", title: "5. LangGraph Stateful Review Workflow", level: 2 },
    { id: "scenario-6", title: "6. MCP JSON-RPC Server Gateway", level: 2 },
  ];

  const scenario1Code = `from sictack import SecureAgent, Config, Policy, ToolCall

# 1. Define read-only policy
policy = Policy(
    name="research-assistant-policy",
    allowed_permissions=["web:search", "doc:read"],
    denied_permissions=["db:write", "network:exfiltrate"],
)

# 2. Initialize Agent
agent = SecureAgent(
    agent_id="researcher-01",
    permissions=["web:search", "doc:read"],
    config=Config(default_policy=policy),
)

# 3. Register safe simulated tool
def mock_search(query: str) -> str:
    return f"Synthesized research findings for: {query}"

agent.register_tool(name="web_search", handler=mock_search, permission="web:search")

# 4. Execute tool call
call = ToolCall(tool_name="web_search", arguments={"query": "quantum computing architectures"})
result = agent.execute(call)
print("Research Result:", result)
# -> Research Result: Synthesized research findings for: quantum computing architectures`;

  const scenario2Code = `from sictack import SecureAgent, Config, Policy, ToolCall
from sictack.exceptions import PermissionDeniedError

# Policy only permits reading from public documentation directory
policy = Policy(
    name="file-access-policy",
    allowed_permissions=["file:read_public"],
    denied_permissions=["file:write_system"],
)

agent = SecureAgent(
    agent_id="file-agent-02",
    permissions=["file:read_public"],
    config=Config(default_policy=policy),
)

def safe_file_reader(path: str) -> str:
    # Simulated safe read
    return f"Content of {path}: [Dataset loaded]"

def system_file_writer(path: str, content: str) -> str:
    return "Written"

agent.register_tool("read_public_file", safe_file_reader, permission="file:read_public")
agent.register_tool("write_system_file", system_file_writer, permission="file:write_system")

# Permitted execution
allowed_call = ToolCall(tool_name="read_public_file", arguments={"path": "public_quarterly_report.pdf"})
print(agent.execute(allowed_call))
# -> Content of public_quarterly_report.pdf: [Dataset loaded]

# Blocked execution (Zero-trust denial)
try:
    blocked_call = ToolCall(tool_name="write_system_file", arguments={"path": "/etc/hosts", "content": "..."})
    agent.execute(blocked_call)
except PermissionDeniedError as e:
    print(f"Blocked by policy: {e}")
    # -> Blocked by policy: Tool write_system_file is denied by policy`;

  const scenario3Code = `from sictack import SecureAgent, Config, Policy, ToolCall
from sictack.exceptions import ApprovalRequiredError

policy = Policy(
    name="customer-outreach-policy",
    allowed_permissions=["email:draft"],
    require_approval_permissions=["email:send_external"],
)

agent = SecureAgent(
    agent_id="email-agent-03",
    permissions=["email:draft", "email:send_external"],
    config=Config(default_policy=policy),
)

def dispatch_email(recipient: str, subject: str, body: str) -> str:
    return f"Message delivered to {recipient}"

agent.register_tool("send_external_email", dispatch_email, permission="email:send_external")

outreach_call = ToolCall(
    tool_name="send_external_email",
    arguments={"recipient": "client@partner.com", "subject": "Contract Addendum", "body": "Please review."}
)

# Step 1: Execution automatically suspends for human review
try:
    agent.execute(outreach_call)
except ApprovalRequiredError as e:
    ticket_id = e.approval_id
    print(f"Suspended. Approval ID: {ticket_id}")

    # Step 2: Human operator inspects parameters and approves
    agent.approve(ticket_id)

    # Step 3: Resumed execution with single-use authorization token
    confirmation = agent.execute_with_approval(outreach_call, approval_id=ticket_id)
    print("Dispatch result:", confirmation)
    # -> Dispatch result: Message delivered to client@partner.com`;

  const scenario4Code = `from sictack import SecureAgent, Config, Policy
from sictack.integrations.langchain import secure_langchain_tool

policy = Policy(
    name="langchain-guard-policy",
    allowed_permissions=["calc:add"],
    denied_permissions=["shell:exec"],
)
agent = SecureAgent(agent_id="langchain-math-bot", permissions=["calc:add"], config=Config(default_policy=policy))

def add_numbers(a: int, b: int) -> int:
    return a + b

# Wrapped as a LangChain Runnable tool with handle_tool_error=True
safe_math_tool = secure_langchain_tool(
    tool_or_func=add_numbers,
    agent=agent,
    permission="calc:add",
    handle_tool_error=True,
)

print(safe_math_tool.invoke({"a": 25, "b": 15}))
# -> 40`;

  const scenario5Code = `from sictack import SecureAgent, Config, Policy
from sictack.integrations.langgraph import SecureGraphNode

policy = Policy(
    name="graph-triage-policy",
    allowed_permissions=["validate_ticket"],
    require_approval_permissions=["refund_customer"],
)
agent = SecureAgent(agent_id="support-graph-agent", permissions=["validate_ticket", "refund_customer"], config=Config(default_policy=policy))

def refund_node(state: dict) -> dict:
    return {"refunded": True, "amount": state["amount"]}

secure_refund = SecureGraphNode(
    name="refund_customer",
    func=refund_node,
    agent=agent,
    permission="refund_customer",
)

# In LangGraph workflows, calling the node returns a branched state dictionary
output = secure_refund({"ticket_id": "TCK-9912", "amount": 150.0})
print("Branch Status:", output["_sictack_status"])  # (also emits legacy '_intentlock_status')
# -> Branch Status: REQUIRE_APPROVAL
print("Pending Node:", output["_pending_node"])
# -> Pending Node: refund_customer`;

  const scenario6Code = `from sictack import SecureAgent, Config, Policy
from sictack.integrations.mcp import MCPSecurityProxy

policy = Policy(
    name="mcp-gateway-policy",
    allowed_permissions=["query_cluster"],
    denied_permissions=["terminate_pod"],
)
agent = SecureAgent(agent_id="mcp-infra-agent", permissions=["query_cluster"], config=Config(default_policy=policy))

proxy = MCPSecurityProxy(agent=agent, agent_id="mcp-infra-agent")
proxy.register_mcp_tool("query_cluster", lambda region: f"Cluster {region}: Healthy", permission="query_cluster")
proxy.register_mcp_tool("terminate_pod", lambda pod_id: f"Terminated {pod_id}", permission="terminate_pod")

# Simulating incoming JSON-RPC tools/call request
rpc_payload = {
    "jsonrpc": "2.0",
    "id": "rpc-101",
    "method": "tools/call",
    "params": {"name": "query_cluster", "arguments": {"region": "us-east-1"}}
}
response = proxy.handle_jsonrpc(rpc_payload)
print(response["result"]["content"][0]["text"])
# -> Cluster us-east-1: Healthy`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Code Examples
            </span>
            <span className="text-xs text-[#787A80]">6 Verified Scenarios</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Real-World Enterprise Examples
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Copy-pasteable, production-ready Python examples illustrating agent security boundaries, policy enforcement, approval tickets, and multi-framework integration.
          </p>
        </div>

        {/* Scenario 1 */}
        <section id="scenario-1" className="scroll-mt-20 space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-[#234E39]">1</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">Read-Only Research Assistant</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">RESOURCE</span>
              <span className="text-[#56585D]">web_search</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">PERMISSION</span>
              <span className="text-[#234E39]">web:search</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">VERDICT</span>
              <span className="text-[#234E39]">ALLOW</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">AUDIT</span>
              <span className="text-[#56585D]">Logged to memory</span>
            </div>
          </div>
          <CodeBlock code={scenario1Code} language="python" filename="scenario_research_assistant.py" />
        </section>

        {/* Scenario 2 */}
        <section id="scenario-2" className="scroll-mt-20 space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-[#943425]">2</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">Restricted File-Access Agent</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">RESOURCE</span>
              <span className="text-[#56585D]">/etc/hosts</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">PERMISSION</span>
              <span className="text-[#943425]">file:write_system</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">VERDICT</span>
              <span className="text-[#943425]">DENY</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">EXCEPTION</span>
              <span className="text-[#943425]">PermissionDeniedError</span>
            </div>
          </div>
          <CodeBlock code={scenario2Code} language="python" filename="scenario_file_access.py" />
        </section>

        {/* Scenario 3 */}
        <section id="scenario-3" className="scroll-mt-20 space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-[#8D5B18]">3</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">Email Agent with Human Sign-Off</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">RESOURCE</span>
              <span className="text-[#56585D]">send_external_email</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">PERMISSION</span>
              <span className="text-[#8D5B18]">email:send_external</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">INITIAL VERDICT</span>
              <span className="text-[#8D5B18]">REQUIRE_APPROVAL</span>
            </div>
            <div className="rounded border border-[#E2E0D8] bg-[#F4F3EE] p-2">
              <span className="text-[#787A80] block text-[10px]">TOKEN LIFECYCLE</span>
              <span className="text-[#234E39]">Single-use consumed</span>
            </div>
          </div>
          <CodeBlock code={scenario3Code} language="python" filename="scenario_email_approval.py" />
        </section>

        {/* Scenario 4 */}
        <section id="scenario-4" className="scroll-mt-20 space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-xs font-bold text-[#1D3557]">4</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">LangChain Tool Protection</h2>
          </div>
          <CodeBlock code={scenario4Code} language="python" filename="scenario_langchain.py" />
        </section>

        {/* Scenario 5 */}
        <section id="scenario-5" className="scroll-mt-20 space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-bold text-indigo-400">5</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">LangGraph Stateful Review Workflow</h2>
          </div>
          <CodeBlock code={scenario5Code} language="python" filename="scenario_langgraph.py" />
        </section>

        {/* Scenario 6 */}
        <section id="scenario-6" className="scroll-mt-20 space-y-4 pt-4">
          <div className="flex items-center gap-2 border-b border-[#E2E0D8] pb-2">
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs font-bold text-purple-400">6</span>
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">MCP JSON-RPC Server Gateway</h2>
          </div>
          <CodeBlock code={scenario6Code} language="python" filename="scenario_mcp.py" />
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "MCP Integration", href: "/developers/integrations/mcp" }}
          next={{ title: "Interactive Security Playground", href: "/developers/playground" }}
        />
      </div>
    </DeveloperLayout>
  );
}
