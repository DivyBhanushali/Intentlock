// INTENTLOCK 2.0 – LangChain Integration Guide
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function LangChainIntegrationPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Integrations", href: "/developers/integrations" },
    { label: "LangChain", href: "/developers/integrations/langchain" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Overview & Dependencies", level: 2 },
    { id: "wrapping", title: "Wrapping Tools with SecureTool", level: 2 },
    { id: "helper", title: "Using secure_langchain_tool Helper", level: 2 },
    { id: "invocations", title: "Execution Protocols (.run & .invoke)", level: 2 },
    { id: "error-handling", title: "Handling Denials & LLM Errors", level: 2 },
    { id: "approvals", title: "Human Approvals in LangChain", level: 2 },
    { id: "limitations", title: "Trust Boundaries & Limitations", level: 2 },
  ];

  const installCode = `pip install "intentlock-sdk>=0.1.0"
pip install "langchain-core>=0.1.0"`;

  const secureToolCode = `from intentlock import SecureAgent, Config, Policy
from intentlock.integrations.langchain import SecureTool

# 1. Define deterministic policy
policy = Policy(
    name="langchain-assistant-policy",
    allowed_permissions=["search:query", "math:calculate"],
    denied_permissions=["shell:exec", "db:drop"],
    require_approval_permissions=["email:send"],
)

# 2. Instantiate SecureAgent
agent = SecureAgent(
    agent_id="langchain-agent",
    permissions=["search:query", "math:calculate", "email:send"],
    config=Config(default_policy=policy),
)

# 3. Define standard Python tool handler
def search_knowledge_base(query: str) -> str:
    """Search internal documentation for relevant technical articles."""
    return f"Articles matching: {query}"

# 4. Wrap with SecureTool
search_tool = SecureTool(
    name="search_kb",
    func=search_knowledge_base,
    description="Searches technical documentation by keyword",
    agent=agent,
    permission="search:query",
    handle_tool_error=True,  # Formats denials as clean error messages for the LLM
)`;

  const invokeCode = `# LangChain Runnable invoke protocol
result = search_tool.invoke({"query": "zero-trust agent security"})
print("Tool Output:", result)
# -> Tool Output: Articles matching: zero-trust agent security

# Positional/keyword run protocol
direct_result = search_tool.run("zero-trust agent security")
print("Direct Output:", direct_result)`;

  const denialHandlingCode = `from intentlock.integrations.langchain import secure_langchain_tool

def execute_shell(command: str) -> str:
    return f"Executed: {command}"

# With handle_tool_error=True (Default)
# Tool returns a formatted security string so the LLM agent learns it was blocked
safe_shell = secure_langchain_tool(
    tool_or_func=execute_shell,
    agent=agent,
    permission="shell:exec",
    handle_tool_error=True,
)
output = safe_shell.invoke({"command": "rm -rf /"})
print(output)
# -> [SECURITY_ERROR: PermissionDeniedError] Action denied by policy

# With handle_tool_error=False
# Tool raises the typed PermissionDeniedError exception immediately
strict_shell = secure_langchain_tool(
    tool_or_func=execute_shell,
    agent=agent,
    permission="shell:exec",
    handle_tool_error=False,
)
try:
    strict_shell.invoke({"command": "rm -rf /"})
except Exception as e:
    print(f"Halted immediately: {type(e).__name__}")
    # -> Halted immediately: PermissionDeniedError`;

  const approvalCode = `from intentlock.exceptions import ApprovalRequiredError

def transfer_funds(recipient: str, amount: float) -> str:
    return f"Transferred USD {amount:.2f} to {recipient}"

transfer_tool = SecureTool(
    name="transfer_funds",
    func=transfer_funds,
    agent=agent,
    permission="email:send",  # Configured as require_approval
    handle_tool_error=False,
)

# Execution raises ApprovalRequiredError
try:
    transfer_tool.run({"recipient": "vendor-corp", "amount": 2500.0})
except ApprovalRequiredError as e:
    ticket_id = e.approval_id
    print(f"Approval ticket created: {ticket_id}")

    # Simulated operator authorization
    agent.gateway.approval_service.approve(ticket_id, approver_id="compliance-admin")

    # Resume execution with single-use approval token
    result = transfer_tool.run(
        {"recipient": "vendor-corp", "amount": 2500.0},
        approval_id=ticket_id,
    )
    print("Execution completed:", result)
    # -> Execution completed: Transferred USD 2500.00 to vendor-corp`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Integrations
            </span>
            <span className="text-xs text-slate-500">LangChain Core</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            LangChain Tool Security
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Secure LangChain tools, agents, and custom Runnables using <code className="text-emerald-300 font-mono text-sm">SecureTool</code>. Enforce deterministic permission boundaries, automatic argument normalization, and approval lifecycles.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Overview &amp; Supported Dependencies
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The INTENTLOCK LangChain adapter integrates with LangChain 0.1, 0.2, and 0.3. It implements standard LangChain tool interfaces without adding runtime overhead:
          </p>
          <CodeBlock code={installCode} language="bash" filename="Terminal" />
        </section>

        {/* Section: Wrapping */}
        <section id="wrapping" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Wrapping Tools with SecureTool
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Wrap any callable or LangChain <code className="text-emerald-300 font-mono">BaseTool</code> using <code className="text-emerald-300 font-mono">SecureTool</code>:
          </p>
          <CodeBlock code={secureToolCode} language="python" filename="secure_langchain_demo.py" />
        </section>

        {/* Section: Helper */}
        <section id="helper" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Using secure_langchain_tool Helper
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The <code className="text-emerald-300 font-mono">secure_langchain_tool</code> utility inspects functions, classes, and decorated <code className="text-slate-200 font-mono">@tool</code> callables automatically:
          </p>
          <CodeBlock code={denialHandlingCode} language="python" filename="helper_usage.py" />
        </section>

        {/* Section: Invocations */}
        <section id="invocations" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Execution Protocols (.run &amp; .invoke)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            <code className="text-emerald-300 font-mono">SecureTool</code> supports both classic LangChain <code className="text-slate-300 font-mono">.run()</code> and modern LCEL <code className="text-slate-300 font-mono">.invoke()</code> invocation patterns:
          </p>
          <CodeBlock code={invokeCode} language="python" filename="invocations.py" />
        </section>

        {/* Section: Error Handling */}
        <section id="error-handling" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Handling Denials &amp; LLM Context
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            When <code className="text-emerald-300 font-mono">handle_tool_error=True</code> is set, policy denials do not crash the agent reasoning loop. Instead, a clean message formatted as <code className="text-amber-300 font-mono">[SECURITY_ERROR: PermissionDeniedError]</code> is returned to the model, allowing it to explain the restriction to the user.
          </p>
        </section>

        {/* Section: Approvals */}
        <section id="approvals" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Human Approvals in LangChain
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            When sensitive actions require human confirmation, set <code className="text-emerald-300 font-mono">handle_tool_error=False</code> to catch <code className="text-amber-400 font-mono">ApprovalRequiredError</code> and resume with <code className="text-emerald-300 font-mono">approval_id</code>:
          </p>
          <CodeBlock code={approvalCode} language="python" filename="approval_flow.py" />
        </section>

        {/* Section: Limitations */}
        <section id="limitations" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Trust Boundaries &amp; Limitations
          </h2>
          <Callout type="warning" title="In-Process Execution Boundary">
            <p className="text-xs leading-relaxed">
              <code className="font-mono text-emerald-300">SecureTool</code> operates inside the Python process of your LangChain agent. If untrusted code can execute arbitrary Python commands (e.g. via dynamic <code className="font-mono text-slate-300">exec()</code> or <code className="font-mono text-slate-300">eval()</code>), boundary enforcement must be combined with operating system sandboxing.
            </p>
          </Callout>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Integrations Overview", href: "/developers/integrations" }}
          next={{ title: "LangGraph Integration", href: "/developers/integrations/langgraph" }}
        />
      </div>
    </DeveloperLayout>
  );
}
