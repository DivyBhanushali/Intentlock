// INTENTLOCK 2.0 – Quickstart Documentation Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function QuickstartPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Getting Started", href: "/developers/installation" },
    { label: "Quickstart", href: "/developers/quickstart" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Two Integration Models", level: 2 },
    { id: "in-process", title: "Tutorial A: In-Process SecureAgent", level: 2 },
    { id: "in-process-setup", title: "1. Setup & Registration", level: 3 },
    { id: "in-process-execution", title: "2. Executing Allowed Tools", level: 3 },
    { id: "in-process-denial", title: "3. Catching Policy Denials", level: 3 },
    { id: "in-process-approval", title: "4. Human-in-the-Loop Approvals", level: 3 },
    { id: "in-process-audit", title: "5. Inspecting Audit Logs", level: 3 },
    { id: "remote-gateway", title: "Tutorial B: Remote Authorization Client", level: 2 },
    { id: "remote-setup", title: "1. Client Initialization", level: 3 },
    { id: "remote-intercept", title: "2. Intercepting Tool Calls", level: 3 },
    { id: "remote-approval", title: "3. Handling Remote Approvals", level: 3 },
  ];

  const inProcessCode = `from intentlock import SecureAgent, ToolCall
from intentlock.core.config import Config
from intentlock.core.policy import Policy, PolicyRule
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError

# 1. Define explicit deterministic security policy
policy = Policy(
    rules=[
        PolicyRule(tool_name="read_query", action="allow"),
        PolicyRule(tool_name="update_db", action="require_approval"),
        PolicyRule(tool_name="drop_table", action="deny"),
    ],
    default_action="deny",  # Fail-closed default
)

# 2. Instantiate SecureAgent with agent identity and permissions
agent = SecureAgent(
    agent_id="data-analysis-agent",
    permissions=["db:read", "db:write"],
    config=Config(policy=policy),
)

# 3. Register native Python tools
def run_query(sql: str) -> str:
    return f"Results for: {sql}"

agent.register_tool(
    name="read_query",
    func=run_query,
    description="Executes read-only SQL queries",
)

# 4. Execute tool call - evaluated deterministically before running
call = ToolCall(tool_name="read_query", arguments={"sql": "SELECT id, name FROM users LIMIT 10;"})
result = agent.execute(call)
print("Query result:", result)
# Output: Results for: SELECT id, name FROM users LIMIT 10;`;

  const inProcessDenialCode = `from intentlock import ToolCall
from intentlock.exceptions import PermissionDeniedError

try:
    forbidden_call = ToolCall(tool_name="drop_table", arguments={"table": "users"})
    agent.execute(forbidden_call)
except PermissionDeniedError as e:
    print(f"Blocked by policy: {e}")
    # Output: Blocked by policy: Tool drop_table is denied by policy`;

  const inProcessApprovalCode = `from intentlock import ToolCall
from intentlock.exceptions import ApprovalRequiredError

sensitive_call = ToolCall(
    tool_name="update_db",
    arguments={"table": "users", "query": "UPDATE users SET active = 1"}
)

try:
    agent.execute(sensitive_call)
except ApprovalRequiredError as e:
    print(f"Approval required for tool '{e.tool_name}'!")
    print(f"Approval Request ID: {e.approval_id}")
    print(f"Canonical Action Hash: {e.action_hash}")

    # Simulated operator review and approval
    agent.approve(e.approval_id)

    # Resume execution with single-use approval token
    result = agent.execute_with_approval(sensitive_call, approval_id=e.approval_id)
    print("Execution succeeded after approval:", result)`;

  const inProcessAuditCode = `events = agent.get_audit_events()
for event in events:
    print(f"[{event.timestamp}] Tool: {event.tool_name} | Verdict: {event.verdict} | Action Hash: {event.action_hash[:12]}...")`;

  const remoteClientCode = `from intentlock import IntentLockClient
from intentlock.models import DecisionVerdict

# 1. Initialize client pointing to your INTENTLOCK backend
client = IntentLockClient(
    api_key="your-api-key-here",
    base_url="https://intentlock-backend-ze2i.onrender.com",
    agent_id="financial-reconciliation-agent",
    timeout=10.0,
)

# 2. Intercept an action before calling any real external system
decision = client.intercept(
    tool_name="transfer_funds",
    arguments={"recipient": "ACC-9921", "amount": 250.0},
    context_id="intent-ctx-991204",  # Optional task context
)

# 3. Deterministically inspect the returned verdict
if decision.verdict == DecisionVerdict.ALLOW:
    # Safely execute your underlying tool
    print("Action allowed! Proceeding with transaction.")
elif decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
    approval_id = decision.metadata.get("approval_id")
    print(f"Suspended for operator review. Approval ID: {approval_id}")
elif decision.verdict == DecisionVerdict.DENY:
    print(f"Blocked by policy gateway. Risk Score: {decision.risk_score}")`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Getting Started
            </span>
            <span className="text-xs text-slate-500">5-minute guide</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Quickstart Guide
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Get up and running with INTENTLOCK in under five minutes. Protect your first tool call, enforce fail-closed policies, and implement human-in-the-loop approvals.
          </p>
        </div>

        {/* Section: Two Integration Models */}
        <section id="overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Two Integration Models
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK is built to support two distinct operational topologies depending on your security architecture:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-[#0a1210] p-5">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Pattern 1</span>
              <h3 className="text-base font-bold text-white mt-1">In-Process Security (SecureAgent)</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Zero network latency. Runs directly inside your Python process. Evaluates policies in-memory, wraps native callables, manages the approval lifecycle, and produces immutable tamper-evident audit logs.
              </p>
              <div className="mt-4 text-xs font-semibold text-emerald-400">
                Recommended for: Autonomous micro-agents, serverless functions, local scripts, and maximum execution speed.
              </div>
            </div>

            <div className="rounded-xl border border-sky-500/30 bg-[#08101a] p-5">
              <span className="text-xs font-mono font-bold text-sky-400 uppercase tracking-wider">Pattern 2</span>
              <h3 className="text-base font-bold text-white mt-1">Remote Authorization (IntentLockClient)</h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Centralized enterprise policy gateway. Connects via HTTPS to the INTENTLOCK backend. Verifies API keys, correlates task-scoped Intent Contexts, logs events to PostgreSQL, and feeds the SOC Dashboard in real-time.
              </p>
              <div className="mt-4 text-xs font-semibold text-sky-400">
                Recommended for: Multi-tenant SaaS, enterprise agent fleets, cross-language services, and centralized SOC governance.
              </div>
            </div>
          </div>
        </section>

        {/* Tutorial A: In-Process SecureAgent */}
        <section id="in-process" className="space-y-6 pt-4">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-bold text-emerald-400">A</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Tutorial A: In-Process Security with SecureAgent
            </h2>
          </div>

          <div id="in-process-setup" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">1. Setup &amp; Tool Registration</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Create an agent with an explicit policy and register your native Python functions with the internal registry:
            </p>
            <CodeBlock code={inProcessCode} language="python" filename="agent_demo.py" />
          </div>

          <div id="in-process-denial" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">2. Catching Policy Denials</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              When an agent requests an action that violates policy, <code className="text-emerald-300 font-mono">SecureAgent</code> halts execution immediately and raises <code className="text-rose-400 font-mono">PermissionDeniedError</code>:
            </p>
            <CodeBlock code={inProcessDenialCode} language="python" filename="catch_denial.py" />
          </div>

          <div id="in-process-approval" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">3. Human-in-the-Loop Approval Workflow</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              When a policy rule specifies <code className="text-amber-300 font-mono">require_approval</code>, execution pauses and an approval ticket is issued. The approval token is cryptographically bound to the canonical action hash:
            </p>
            <CodeBlock code={inProcessApprovalCode} language="python" filename="approval_flow.py" />

            <Callout type="tip" title="Single-Use Token Guarantee">
              <p className="text-xs leading-relaxed">
                Approval tokens cannot be reused. Calling <code className="font-mono text-emerald-300">execute_with_approval</code> a second time with the same approval ID raises an <code className="font-mono text-rose-300">ApprovalReplayError</code>.
              </p>
            </Callout>
          </div>

          <div id="in-process-audit" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">4. Inspecting Audit Events</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Retrieve immutable in-memory audit logs containing SHA-256 action hashes, timestamps, and verdicts:
            </p>
            <CodeBlock code={inProcessAuditCode} language="python" filename="audit_inspect.py" />
          </div>
        </section>

        {/* Tutorial B: Remote Client */}
        <section id="remote-gateway" className="space-y-6 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/20 text-xs font-bold text-sky-400">B</span>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Tutorial B: Remote Gateway with IntentLockClient
            </h2>
          </div>

          <div id="remote-setup" className="space-y-3">
            <h3 className="text-lg font-semibold text-slate-200">1. Client Initialization &amp; Interception</h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Use <code className="text-sky-300 font-mono">IntentLockClient</code> to query your centralized INTENTLOCK backend before executing external side effects:
            </p>
            <CodeBlock code={remoteClientCode} language="python" filename="remote_demo.py" />
          </div>

          <Callout type="warning" title="Remote Client Execution Boundary">
            <p className="text-xs leading-relaxed">
              Notice that <code className="font-mono text-sky-300">IntentLockClient.intercept()</code> returns a <code className="font-mono text-sky-300">Decision</code> object; it does <strong>not</strong> execute the tool itself. Your application code retains complete custody of the underlying API keys and callable execution.
            </p>
          </Callout>
        </section>

        {/* Next Steps */}
        <PreviousNextNavigation
          prev={{ title: "Installation", href: "/developers/installation" }}
          next={{ title: "Core Concepts", href: "/developers/concepts" }}
        />
      </div>
    </DeveloperLayout>
  );
}
