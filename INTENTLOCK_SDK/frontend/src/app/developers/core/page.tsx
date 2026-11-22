// SICTACK 1.0 – Developer Documentation: CORE Deterministic Gateway
// Direction A: Warm Editorial Software (Human-Centered Design)

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function DevelopersCorePage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security Engines", href: "/developers/core" },
    { label: "CORE Deterministic Gateway", href: "/developers/core" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "CORE Engine Overview", level: 2 },
    { id: "parameter-constraints", title: "Parameter-Level Constraints", level: 2 },
    { id: "policy-versioning", title: "Policy Version Binding", level: 2 },
    { id: "decision-ttl", title: "Decision TTL & Expiration", level: 2 },
    { id: "canonical-hashing", title: "Canonical Argument Hashing", level: 2 },
    { id: "multi-agent-delegation", title: "Multi-Agent Delegated Authorization", level: 2 },
    { id: "sdk-example", title: "Full Python SDK Implementation", level: 2 },
  ];

  const multiAgentDelegationCode = `from sictack.unified import Sictack
from sictack.models import Policy
from sictack.exceptions import (
    DelegationPrivilegeEscalationError,
    ConfusedDeputyError,
    DelegationExpiredError,
)

security = Sictack(signing_key="enterprise-secret-key")

# 1. Supervisor issues scoped, cryptographically-signed token to worker
token = security.delegate(
    parent_agent_id="supervisor-agent",
    child_agent_id="researcher-agent",
    allowed_capabilities=["research:read", "compute:add"],
    allocated_budget=50,
    ttl_seconds=300,  # 5-minute lifespan
)
print("Delegation Token Issued:", token.delegation_id)
print("Cryptographic HMAC-SHA256 Signature:", token.signature)

# 2. Worker executes tool within delegated capability boundaries
with security.task(
    agent_id="researcher-agent",
    delegation_token=token,
    intent="Query customer telemetry",
):
    result = security.execute_tool("query_knowledge_base", {"query": "Zero Trust"})
    print("Execution Permitted:", result)

# 3. Privilege Escalation Prevention: Worker cannot exceed parent capability scope
try:
    with security.task(agent_id="researcher-agent", delegation_token=token):
        # Even if child agent attempts root-level admin actions:
        security.execute_tool("admin_purge_database", {"scope": "all"})
except DelegationPrivilegeEscalationError as err:
    print("Halted: Privilege Escalation Attempt Blocked:", err)

# 4. Confused-Deputy Defense: Token stolen by a different agent is immediately rejected
try:
    with security.task(agent_id="malicious-rogue-agent", delegation_token=token):
        security.execute_tool("query_knowledge_base", {"query": "Exfiltrate"})
except ConfusedDeputyError as err:
    print("Halted: Confused Deputy Attack Prevented:", err)`;

  const parameterConstraintsCode = `from sictack.models import Policy

# Declare policy with parameter constraints
policy = Policy(
    id="pol_fintech_transfers",
    name="Wire Transfer Security Policy",
    version=2,  # Monotonically increasing version
    allowed_permissions=["bank:transfer", "db:read"],
    parameter_constraints={
        "amount_usd": {
            "min_numeric": 1.0,
            "max_numeric": 10000.0,
        },
        "currency": {
            "allowed_values": ["USD", "EUR", "GBP"],
        },
        "recipient_iban": {
            "forbidden_patterns": ["^RU.*", "^IR.*", "^KP.*"],
        },
    },
)`;

  const sdkExecutionCode = `from sictack import SecureAgent, ToolCall, Config
from sictack.exceptions import PermissionDeniedError, PolicyVersionMismatchError, AuthorizationExpiredError

# 1. Initialize SecureAgent with hardened policy
agent = SecureAgent(
    agent_id="fintech_operator_01",
    permissions=["bank:transfer"],
    config=Config(
        policy=policy,
        decision_ttl_seconds=300,  # Approvals expire in 5 minutes
    ),
)

# 2. Register tool handler
@agent.register_tool(name="execute_transfer", permission="bank:transfer")
def transfer_handler(amount_usd: float, currency: str, recipient_iban: str) -> dict:
    return {"status": "SUCCESS", "tx_id": "tx_99210"}

# 3. Invocation within bounds -> ALLOW
call = ToolCall(
    tool_name="execute_transfer",
    arguments={
        "amount_usd": 450.0,
        "currency": "USD",
        "recipient_iban": "DE89370400440532013000",
    },
)
decision = agent.execute(call)
print("Execution Result:", decision)

# 4. Out-of-bounds invocation -> DENY (Exceeds max_numeric)
try:
    bad_call = ToolCall(
        tool_name="execute_transfer",
        arguments={
            "amount_usd": 50000.0,  # Exceeds max_numeric: 10000.0
            "currency": "USD",
            "recipient_iban": "DE89370400440532013000",
        },
    )
    agent.execute(bad_call)
except PermissionDeniedError as err:
    print("Blocked by CORE Policy Engine:", err)
    # >>> Blocked by CORE Policy Engine: Parameter 'amount_usd' value 50000.0 exceeds maximum 10000.0`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <header className="mb-8 border-b border-[#E2E0D8] pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#EDF5F0] border border-[#D4E8DC] text-[#234E39] text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#234E39]"></span>
          <span>SECURITY ENGINE 01 // IN-PROCESS GATEWAY</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#18191B] sm:text-4xl">
          SICTACK CORE Deterministic Gateway
        </h1>
        <p className="mt-3 text-base text-[#56585D] leading-relaxed max-w-3xl">
          In-depth developer reference for deterministic tool authorization, parameter constraints, policy version binding, and cryptographic audit trails.
        </p>
      </header>

      <section id="overview" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          CORE Engine Overview
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          <strong>SICTACK CORE</strong> is the deterministic pre-execution enforcement gateway for autonomous AI agents. Unlike probabilistic LLM guardrails that rely on prompt evaluation, CORE executes inside the local agent process before any tool handler, network request, or shell process is dispatched.
        </p>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Every tool invocation is evaluated against mathematical constraints in <strong>under 1.0 millisecond</strong>, guaranteeing strict default-deny enforcement, parameter boundary validation, and immutable audit logging.
        </p>
        <Callout type="info" title="Zero-Bypass Architecture">
          CORE acts as an authoritative boundary. Even if an LLM is compromised via indirect prompt injection, jailbreaking, or token smuggling, the underlying tool call cannot execute if it violates the declared policy constraints.
        </Callout>
      </section>

      <section id="parameter-constraints" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Parameter-Level Constraints
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Standard RBAC permissions only answer <em>&ldquo;Can this agent execute tool X?&rdquo;</em>. CORE parameter constraints answer <em>&ldquo;Can this agent execute tool X with these specific parameters?&rdquo;</em>.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-[#E4E9E8]">
            <thead className="bg-[#F8F9F8] text-[11px] font-mono text-[#787E81] uppercase">
              <tr>
                <th className="p-2.5 border-b border-[#E4E9E8]">Constraint Key</th>
                <th className="p-2.5 border-b border-[#E4E9E8]">Type</th>
                <th className="p-2.5 border-b border-[#E4E9E8]">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9E8]">
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">max_numeric</td>
                <td className="p-2.5 font-mono text-[#56585D]">float / int</td>
                <td className="p-2.5 text-[#56585D]">Maximum allowable numeric threshold for the argument.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">min_numeric</td>
                <td className="p-2.5 font-mono text-[#56585D]">float / int</td>
                <td className="p-2.5 text-[#56585D]">Minimum allowable numeric threshold for the argument.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">allowed_values</td>
                <td className="p-2.5 font-mono text-[#56585D]">list[str]</td>
                <td className="p-2.5 text-[#56585D]">Whitelist of permitted string enum values.</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">forbidden_patterns</td>
                <td className="p-2.5 font-mono text-[#56585D]">list[regex]</td>
                <td className="p-2.5 text-[#56585D]">Regex patterns that trigger immediate denial if matched.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock code={parameterConstraintsCode} language="python" filename="models.py" />
      </section>

      <section id="policy-versioning" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Policy Version Binding
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          To prevent race conditions during policy deployments, SICTACK binds every authorization decision to the active <code>version</code> of the policy.
        </p>
        <p className="text-sm leading-relaxed text-[#56585D]">
          If an approval request is generated under <strong>Policy v1</strong>, but an administrator updates the policy to <strong>Policy v2</strong> before the approval is granted, executing the stale approval triggers a <code>PolicyVersionMismatchError</code>. The agent is forced to re-evaluate intent under the latest policy rules.
        </p>
      </section>

      <section id="decision-ttl" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Decision TTL &amp; Expiration
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          All decisions and approval requests contain an immutable <code>expires_at</code> UNIX timestamp. By default, approvals are valid for <strong>300 seconds (5 minutes)</strong>. Any delayed execution attempt after the TTL has expired is halted immediately with an <code>AuthorizationExpiredError</code>.
        </p>
      </section>

      <section id="canonical-hashing" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Canonical Argument Hashing
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Tool arguments undergo deterministic canonicalization before hashing: keys are lexicographically sorted, whitespace is normalized, and numeric precision is standardized. The resulting SHA-256 digest (<code>action_hash</code>) ensures that human approvers authorize the exact arguments executed downstream.
        </p>
      </section>

      <section id="multi-agent-delegation" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Multi-Agent Delegated Authorization
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Modern enterprise AI fleets operate as multi-agent graphs where a supervisor orchestrates specialized workers (e.g., LangGraph supervisors, AutoGen fleets, CrewAI crews). SICTACK CORE provides mathematical, least-privilege delegation boundaries across the agent hierarchy.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          <div className="p-4 bg-white rounded-lg border border-[#E4E9E8]">
            <div className="font-mono text-xs font-semibold text-[#18191B] mb-1">Least-Privilege Bounds</div>
            <p className="text-xs text-[#56585D]">
              Child agent capability is strictly bounded by the mathematical intersection: <code>Parent Policy &cap; Delegation Token &cap; Child Policy</code>. A child can never exceed its parent&rsquo;s scope.
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-[#E4E9E8]">
            <div className="font-mono text-xs font-semibold text-[#18191B] mb-1">Confused-Deputy Defense</div>
            <p className="text-xs text-[#56585D]">
              Delegation tokens bind cryptographically to <code>child_agent_id</code> with HMAC-SHA256 signatures. If a rogue agent attempts to replay or present another agent&rsquo;s token, CORE rejects execution with <code>ConfusedDeputyError</code>.
            </p>
          </div>
          <div className="p-4 bg-white rounded-lg border border-[#E4E9E8]">
            <div className="font-mono text-xs font-semibold text-[#18191B] mb-1">Budget &amp; Depth Controls</div>
            <p className="text-xs text-[#56585D]">
              Tokens enforce bounded execution budgets (tool call counts) and maximum hierarchy depths (preventing unbounded recursive agent spawning loops).
            </p>
          </div>
        </div>
        <CodeBlock code={multiAgentDelegationCode} language="python" filename="delegation_security.py" />
      </section>

      <section id="sdk-example" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Full Python SDK Implementation
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Here is a complete end-to-end example configuring parameter constraints and handling runtime decisions:
        </p>
        <CodeBlock code={sdkExecutionCode} language="python" filename="agent_security.py" />
      </section>

      <div className="pt-8 border-t border-[#E4E9E8]">
        <PreviousNextNavigation
          prev={{ title: "8-Stage Pipeline Architecture", href: "/developers/architecture" }}
          next={{ title: "SENTINEL Behavioral Radar", href: "/developers/sentinel" }}
        />
      </div>
    </DeveloperLayout>
  );
}
