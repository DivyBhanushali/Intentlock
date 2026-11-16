// INTENTLOCK 2.0 – SDK Initialization & Configuration Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SdkInitializationPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Python SDK", href: "/developers/sdk" },
    { label: "Initialization", href: "/developers/sdk/initialization" },
  ];

  const toc: TocItem[] = [
    { id: "secure-agent", title: "Initializing SecureAgent", level: 2 },
    { id: "config-options", title: "Configuration Options (Config)", level: 2 },
    { id: "policy-definition", title: "Defining Policies (Policy & PolicyRule)", level: 2 },
    { id: "remote-client", title: "Initializing IntentLockClient", level: 2 },
    { id: "environment-vars", title: "Environment Variables & Security", level: 2 },
  ];

  const secureAgentCode = `from intentlock import SecureAgent, Config, Policy
from intentlock.core.policy import PolicyRule

# Initialize SecureAgent with explicit identity and scoped capabilities
agent = SecureAgent(
    agent_id="customer-service-agent",
    permissions=["crm:read", "email:send"],
    config=Config(
        policy=Policy(
            rules=[
                PolicyRule(tool_name="lookup_customer", action="allow"),
                PolicyRule(tool_name="send_email", action="require_approval"),
                PolicyRule(tool_name="delete_account", action="deny"),
            ],
            default_action="deny",  # Strict fail-closed policy
        ),
        audit_enabled=True,
    ),
)`;

  const configSignature = `class Config(BaseModel):
    policy: Optional[Policy] = None
    audit_enabled: bool = True
    fail_closed: bool = True
    approval_timeout_seconds: int = 300`;

  const remoteClientInitCode = `import os
from intentlock import IntentLockClient

# Initialize client using environment configuration
client = IntentLockClient(
    api_key=os.environ["INTENTLOCK_API_KEY"],
    base_url=os.getenv("INTENTLOCK_BASE_URL", "https://intentlock-backend-ze2i.onrender.com"),
    agent_id="reconciliation-worker",
    timeout=10.0,  # 10 second HTTP timeout
)`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Python SDK
            </span>
            <span className="text-xs text-slate-500">Constructors &amp; Config</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Initialization &amp; Configuration
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Configure agent identity, deterministic security policies, audit logging, and connection parameters for both in-process and remote execution modes.
          </p>
        </div>

        {/* Section: SecureAgent */}
        <section id="secure-agent" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Initializing SecureAgent
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            <code className="text-emerald-300 font-mono">SecureAgent</code> is the primary in-process orchestrator. It manages the tool registry, policy engine, approval lifecycle service, and audit trail in memory.
          </p>

          <CodeBlock code={secureAgentCode} language="python" filename="init_secure_agent.py" />

          <h3 className="text-sm font-bold text-slate-200 pt-2">Constructor Parameters</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">agent_id</td>
                  <td className="py-2.5 px-4 text-slate-300">str</td>
                  <td className="py-2.5 px-4 text-slate-400">&quot;default-agent&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Unique identifier for the agent used in audit events and policy scoping.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">permissions</td>
                  <td className="py-2.5 px-4 text-slate-300">list[str] | None</td>
                  <td className="py-2.5 px-4 text-slate-400">None</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">List of permission strings granted to this agent (e.g. <code className="text-slate-300">[&quot;db:read&quot;]</code>).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">config</td>
                  <td className="py-2.5 px-4 text-slate-300">Config | None</td>
                  <td className="py-2.5 px-4 text-slate-400">None (defaults to standard Config)</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Configuration object containing policy, audit settings, and timeout.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Config Options */}
        <section id="config-options" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Configuration Options (Config)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The <code className="text-emerald-300 font-mono">Config</code> model controls the execution guarantees and runtime behaviors:
          </p>

          <CodeBlock code={configSignature} language="python" filename="config_schema.py" />

          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li><strong className="text-white font-mono">policy</strong>: An instance of <code className="text-emerald-300 font-mono">Policy</code>. If omitted, all tools are permitted by default unless rules are provided.</li>
            <li><strong className="text-white font-mono">audit_enabled</strong>: Whether audit events are captured in memory (<code className="text-slate-300 font-mono">True</code> by default).</li>
            <li><strong className="text-white font-mono">fail_closed</strong>: When <code className="text-slate-300 font-mono">True</code>, any policy or validation ambiguity results in immediate denial.</li>
            <li><strong className="text-white font-mono">approval_timeout_seconds</strong>: Maximum duration in seconds that a human approval token remains valid before expiring (default: 300 seconds / 5 minutes).</li>
          </ul>
        </section>

        {/* Section: Policy Definition */}
        <section id="policy-definition" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Defining Policies (Policy &amp; PolicyRule)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Policies consist of ordered rules and a default fallback action:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Action String</th>
                  <th className="py-2.5 px-4">Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">&quot;allow&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">Execution is permitted immediately without human intervention.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-amber-400">&quot;require_approval&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">Execution is paused. An approval ticket is issued and must be authorized.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-rose-400">&quot;deny&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">Execution is blocked immediately. Raises PermissionDeniedError.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: IntentLockClient */}
        <section id="remote-client" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Initializing IntentLockClient
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Use <code className="text-sky-300 font-mono">IntentLockClient</code> when interacting with a centralized INTENTLOCK backend instance:
          </p>

          <CodeBlock code={remoteClientInitCode} language="python" filename="init_client.py" />

          <h3 className="text-sm font-bold text-slate-200 pt-2">Constructor Parameters</h3>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-sky-400">api_key</td>
                  <td className="py-2.5 px-4 text-slate-300">str</td>
                  <td className="py-2.5 px-4 text-rose-400">Required</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Secret API key passed via the <code className="text-slate-300">X-API-Key</code> HTTP header.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-sky-400">base_url</td>
                  <td className="py-2.5 px-4 text-slate-300">str</td>
                  <td className="py-2.5 px-4 text-slate-400">&quot;http://localhost:8000&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Root URL of the INTENTLOCK backend service.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-sky-400">agent_id</td>
                  <td className="py-2.5 px-4 text-slate-300">str</td>
                  <td className="py-2.5 px-4 text-slate-400">&quot;default-agent&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Agent identifier passed with each interception request.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-sky-400">timeout</td>
                  <td className="py-2.5 px-4 text-slate-300">float</td>
                  <td className="py-2.5 px-4 text-slate-400">10.0</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">HTTP request timeout in seconds.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Environment Variables */}
        <section id="environment-vars" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Environment Variables &amp; Best Practices
          </h2>
          <Callout type="tip" title="API Key Security">
            <p className="text-xs leading-relaxed">
              Never commit your <code className="font-mono text-emerald-300">INTENTLOCK_API_KEY</code> into version control. Load it from a secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault) or inject it via runtime environment variables.
            </p>
          </Callout>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Python SDK Overview", href: "/developers/sdk" }}
          next={{ title: "Tool Protection & Adapters", href: "/developers/sdk/tool-protection" }}
        />
      </div>
    </DeveloperLayout>
  );
}
