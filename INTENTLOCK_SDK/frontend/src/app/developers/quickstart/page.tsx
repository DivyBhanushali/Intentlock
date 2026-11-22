// SICTACK 1.0 – Quickstart Documentation Page
// Direction A: Warm Editorial Software (Human-Centered Design)
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
    { id: "in-process-denial", title: "2. Catching Policy Denials", level: 3 },
    { id: "in-process-approval", title: "3. Human-in-the-Loop Approvals", level: 3 },
    { id: "in-process-audit", title: "4. Inspecting Audit Events", level: 3 },
    { id: "remote-gateway", title: "Tutorial B: Remote Authorization Client", level: 2 },
    { id: "remote-setup", title: "1. Client Initialization", level: 3 },
  ];

  const inProcessCode = `from sictack import SecureAgent, ToolCall, Config, Policy
from sictack.exceptions import PermissionDeniedError, ApprovalRequiredError

# 1. Define explicit deterministic security policy
policy = Policy(
    allowed_permissions=["db:read"],
    require_approval_permissions=["db:write"],
    denied_permissions=["db:admin"],
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

  const inProcessDenialCode = `from sictack import ToolCall
from sictack.exceptions import PermissionDeniedError

try:
    forbidden_call = ToolCall(tool_name="drop_table", arguments={"table": "users"})
    agent.execute(forbidden_call)
except PermissionDeniedError as e:
    print(f"Blocked by policy: {e}")
    # Output: Blocked by policy: Tool drop_table is denied by policy`;

  const inProcessApprovalCode = `from sictack import ToolCall
from sictack.exceptions import ApprovalRequiredError

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

  const remoteClientCode = `from sictack import SictackClient
from sictack.models import DecisionVerdict

# 1. Initialize client pointing to your SICTACK backend
client = SictackClient(
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
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Getting Started
            </span>
            <span className="text-xs text-[#787A80]">5-minute guide</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#18191B] sm:text-4xl">
            Quickstart Guide
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Get up and running with SICTACK in under five minutes. Protect your first tool call, enforce fail-closed policies, and implement human-in-the-loop approvals.
          </p>
        </div>

        {/* Section: Two Integration Models */}
        <section id="overview" className="space-y-4 scroll-mt-20">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Two Integration Models
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK is built to support two distinct operational topologies depending on your security architecture:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#234E39] bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Pattern 1
              </span>
              <h3 className="text-base font-bold text-[#18191B] mt-2">In-Process Security (SecureAgent)</h3>
              <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                Zero network latency. Runs directly inside your Python process. Evaluates policies in-memory, wraps native callables, manages the approval lifecycle, and produces immutable tamper-evident audit logs.
              </p>
              <div className="mt-4 text-xs font-semibold text-[#234E39]">
                Recommended for: Autonomous micro-agents, serverless functions, local scripts, and maximum execution speed.
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 shadow-xs">
              <span className="text-xs font-mono font-bold text-[#1D3557] bg-[#EEF4F8] border border-[#1D3557]/20 px-2 py-0.5 rounded uppercase tracking-wider">
                Pattern 2
              </span>
              <h3 className="text-base font-bold text-[#18191B] mt-2">Remote Authorization (SictackClient)</h3>
              <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                Centralized enterprise policy gateway. Connects via HTTPS to the SICTACK backend. Verifies API keys, correlates task-scoped Intent Contexts, logs events to PostgreSQL, and feeds the SOC Dashboard in real-time.
              </p>
              <div className="mt-4 text-xs font-semibold text-[#1D3557]">
                Recommended for: Multi-tenant SaaS, enterprise agent fleets, cross-language services, and centralized SOC governance.
              </div>
            </div>
          </div>
        </section>

        {/* Tutorial A: In-Process SecureAgent */}
        <section id="in-process" className="space-y-6 pt-4 scroll-mt-20">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EDF5F0] border border-[#234E39]/20 text-xs font-bold text-[#234E39]">
              A
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#18191B]">
              Tutorial A: In-Process Security with SecureAgent
            </h2>
          </div>

          <div id="in-process-setup" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-[#18191B]">1. Setup &amp; Tool Registration</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Create an agent with an explicit policy and register your native Python functions with the internal registry:
            </p>
            <CodeBlock code={inProcessCode} language="python" filename="agent_demo.py" />
          </div>

          <div id="in-process-denial" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-[#18191B]">2. Catching Policy Denials</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              When an agent requests an action that violates policy, <code className="text-[#234E39] font-mono bg-[#EDF5F0] px-1 py-0.5 rounded">SecureAgent</code> halts execution immediately and raises <code className="text-[#943425] font-mono bg-[#FDF1EF] px-1 py-0.5 rounded">PermissionDeniedError</code>:
            </p>
            <CodeBlock code={inProcessDenialCode} language="python" filename="catch_denial.py" />
          </div>

          <div id="in-process-approval" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-[#18191B]">3. Human-in-the-Loop Approval Workflow</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              When a policy rule specifies <code className="text-[#8D5B18] font-mono bg-[#FEF6EC] px-1 py-0.5 rounded">require_approval</code>, execution pauses and an approval ticket is issued. The approval token is cryptographically bound to the canonical action hash:
            </p>
            <CodeBlock code={inProcessApprovalCode} language="python" filename="approval_flow.py" />

            <Callout type="tip" title="Single-Use Token Guarantee">
              <p className="text-xs leading-relaxed text-[#56585D]">
                Approval tokens cannot be reused. Calling <code className="font-mono text-[#234E39]">execute_with_approval</code> a second time with the same approval ID raises an <code className="font-mono text-[#943425]">ApprovalReplayError</code>.
              </p>
            </Callout>
          </div>

          <div id="in-process-audit" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-[#18191B]">4. Inspecting Audit Events</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Retrieve immutable in-memory audit logs containing SHA-256 action hashes, timestamps, and verdicts:
            </p>
            <CodeBlock code={inProcessAuditCode} language="python" filename="audit_inspect.py" />
          </div>
        </section>

        {/* Tutorial B: Remote Client */}
        <section id="remote-gateway" className="space-y-6 pt-6 border-t border-[#E2E0D8] scroll-mt-20">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF4F8] border border-[#1D3557]/20 text-xs font-bold text-[#1D3557]">
              B
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#18191B]">
              Tutorial B: Remote Gateway with SictackClient
            </h2>
          </div>

          <div id="remote-setup" className="space-y-3 scroll-mt-20">
            <h3 className="text-lg font-semibold text-[#18191B]">1. Client Initialization &amp; Interception</h3>
            <p className="text-sm text-[#56585D] leading-relaxed">
              Use <code className="text-[#1D3557] font-mono bg-[#EEF4F8] px-1 py-0.5 rounded">SictackClient</code> to query your centralized SICTACK backend before executing external side effects:
            </p>
            <CodeBlock code={remoteClientCode} language="python" filename="remote_demo.py" />
          </div>

          <Callout type="warning" title="Remote Client Execution Boundary">
            <p className="text-xs leading-relaxed text-[#56585D]">
              Notice that <code className="font-mono text-[#1D3557]">SictackClient.intercept()</code> returns a <code className="font-mono text-[#1D3557]">Decision</code> object; it does <strong>not</strong> execute the tool itself. Your application code retains complete custody of the underlying API keys and callable execution.
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
