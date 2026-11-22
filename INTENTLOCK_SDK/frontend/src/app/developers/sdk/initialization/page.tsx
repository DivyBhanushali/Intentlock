// SICTACK 1.0 – SDK Initialization & Configuration Page
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
    { id: "remote-client", title: "Initializing SictackClient", level: 2 },
    { id: "environment-vars", title: "Environment Variables & Security", level: 2 },
  ];

  const secureAgentCode = `from sictack import SecureAgent, Config, Policy
from sictack.core.policy import PolicyRule

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
from sictack import SictackClient

# Initialize client using environment configuration
client = SictackClient(
    api_key=os.environ["SICTACK_API_KEY"],
    base_url=os.getenv("SICTACK_BASE_URL", "https://intentlock-backend-ze2i.onrender.com"),
    agent_id="reconciliation-worker",
    timeout=10.0,  # 10 second HTTP timeout
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
            <span className="text-xs text-[#787A80]">Constructors &amp; Config</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Initialization &amp; Configuration
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Configure agent identity, deterministic security policies, audit logging, and connection parameters for both in-process and remote execution modes.
          </p>
        </div>

        {/* Section: SecureAgent */}
        <section id="secure-agent" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Initializing SecureAgent
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            <code className="text-[#234E39] font-mono">SecureAgent</code> is the primary in-process orchestrator. It manages the tool registry, policy engine, approval lifecycle service, and audit trail in memory.
          </p>

          <CodeBlock code={secureAgentCode} language="python" filename="init_secure_agent.py" />

          <h3 className="text-sm font-bold text-[#18191B] pt-2">Constructor Parameters</h3>
          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39]">agent_id</td>
                  <td className="py-2.5 px-4 text-[#56585D]">str</td>
                  <td className="py-2.5 px-4 text-[#56585D]">&quot;default-agent&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Unique identifier for the agent used in audit events and policy scoping.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39]">permissions</td>
                  <td className="py-2.5 px-4 text-[#56585D]">list[str] | None</td>
                  <td className="py-2.5 px-4 text-[#56585D]">None</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">List of permission strings granted to this agent (e.g. <code className="text-[#56585D]">[&quot;db:read&quot;]</code>).</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39]">config</td>
                  <td className="py-2.5 px-4 text-[#56585D]">Config | None</td>
                  <td className="py-2.5 px-4 text-[#56585D]">None (defaults to standard Config)</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Configuration object containing policy, audit settings, and timeout.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Config Options */}
        <section id="config-options" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Configuration Options (Config)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The <code className="text-[#234E39] font-mono">Config</code> model controls the execution guarantees and runtime behaviors:
          </p>

          <CodeBlock code={configSignature} language="python" filename="config_schema.py" />

          <ul className="text-xs text-[#56585D] space-y-2 list-disc list-inside">
            <li><strong className="text-[#18191B] font-mono">policy</strong>: An instance of <code className="text-[#234E39] font-mono">Policy</code>. If omitted, all tools are permitted by default unless rules are provided.</li>
            <li><strong className="text-[#18191B] font-mono">audit_enabled</strong>: Whether audit events are captured in memory (<code className="text-[#56585D] font-mono">True</code> by default).</li>
            <li><strong className="text-[#18191B] font-mono">fail_closed</strong>: When <code className="text-[#56585D] font-mono">True</code>, any policy or validation ambiguity results in immediate denial.</li>
            <li><strong className="text-[#18191B] font-mono">approval_timeout_seconds</strong>: Maximum duration in seconds that a human approval token remains valid before expiring (default: 300 seconds / 5 minutes).</li>
          </ul>
        </section>

        {/* Section: Policy Definition */}
        <section id="policy-definition" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Defining Policies (Policy &amp; PolicyRule)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Policies consist of ordered rules and a default fallback action:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Action String</th>
                  <th className="py-2.5 px-4">Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39]">&quot;allow&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Execution is permitted immediately without human intervention.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#8D5B18]">&quot;require_approval&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Execution is paused. An approval ticket is issued and must be authorized.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425]">&quot;deny&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Execution is blocked immediately. Raises PermissionDeniedError.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: SictackClient */}
        <section id="remote-client" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Initializing SictackClient
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Use <code className="text-[#1D3557] font-mono">SictackClient</code> when interacting with a centralized SICTACK backend instance:
          </p>

          <CodeBlock code={remoteClientInitCode} language="python" filename="init_client.py" />

          <h3 className="text-sm font-bold text-[#18191B] pt-2">Constructor Parameters</h3>
          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Parameter</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Default</th>
                  <th className="py-2.5 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#1D3557]">api_key</td>
                  <td className="py-2.5 px-4 text-[#56585D]">str</td>
                  <td className="py-2.5 px-4 text-[#943425]">Required</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Secret API key passed via the <code className="text-[#56585D]">X-API-Key</code> HTTP header.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#1D3557]">base_url</td>
                  <td className="py-2.5 px-4 text-[#56585D]">str</td>
                  <td className="py-2.5 px-4 text-[#56585D]">&quot;http://localhost:8000&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Root URL of the SICTACK backend service.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#1D3557]">agent_id</td>
                  <td className="py-2.5 px-4 text-[#56585D]">str</td>
                  <td className="py-2.5 px-4 text-[#56585D]">&quot;default-agent&quot;</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Agent identifier passed with each interception request.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#1D3557]">timeout</td>
                  <td className="py-2.5 px-4 text-[#56585D]">float</td>
                  <td className="py-2.5 px-4 text-[#56585D]">10.0</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">HTTP request timeout in seconds.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Environment Variables */}
        <section id="environment-vars" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Environment Variables &amp; Best Practices
          </h2>
          <Callout type="tip" title="API Key Security">
            <p className="text-xs leading-relaxed">
              Never commit your <code className="font-mono text-[#234E39]">SICTACK_API_KEY</code> into version control. Load it from a secrets manager (e.g. AWS Secrets Manager, HashiCorp Vault) or inject it via runtime environment variables.
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
