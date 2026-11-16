// INTENTLOCK 2.0 – Decisions & Approvals Documentation Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SdkDecisionsPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Python SDK", href: "/developers/sdk" },
    { label: "Decisions & Approvals", href: "/developers/sdk/decisions" },
  ];

  const toc: TocItem[] = [
    { id: "decision-model", title: "The Decision Model", level: 2 },
    { id: "verdicts", title: "DecisionVerdict Values", level: 2 },
    { id: "risk-levels", title: "RiskLevel & Risk Scoring", level: 2 },
    { id: "action-hash", title: "Canonical Action Hashes", level: 2 },
    { id: "approval-workflow", title: "Approval Token Lifecycle", level: 2 },
    { id: "handling-decisions", title: "Evaluating Decisions in Application Code", level: 2 },
  ];

  const decisionSchemaCode = `from pydantic import BaseModel
from typing import Any, Dict
from intentlock.models import DecisionVerdict, RiskLevel

class Decision(BaseModel):
    verdict: DecisionVerdict      # ALLOW, DENY, REQUIRE_APPROVAL
    action_hash: str              # SHA-256 canonical hex digest
    risk_score: float             # Deterministic risk metric (0.0 to 1.0)
    risk_level: RiskLevel         # LOW, MEDIUM, HIGH, CRITICAL
    metadata: Dict[str, Any]      # Includes approval_id, policy_rule, etc.`;

  const handlingCode = `from intentlock import IntentLockClient
from intentlock.models import DecisionVerdict, RiskLevel

client = IntentLockClient(api_key="...", base_url="https://...", agent_id="agent-1")

decision = client.intercept(
    tool_name="publish_social_post",
    arguments={"channel": "twitter", "content": "Welcome to our launch event!"}
)

match decision.verdict:
    case DecisionVerdict.ALLOW:
        # Action is authorized: invoke your local tool
        execute_local_tool()

    case DecisionVerdict.REQUIRE_APPROVAL:
        # Extract approval request identifier
        approval_id = decision.metadata.get("approval_id")
        print(f"Action suspended. Awaiting human sign-off: ticket {approval_id}")

    case DecisionVerdict.DENY:
        # Action blocked: record or notify
        print(f"Action rejected by policy. Risk score: {decision.risk_score}")`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Python SDK
            </span>
            <span className="text-xs text-slate-500">Security Verdicts</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Decisions &amp; Approvals
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Understand how INTENTLOCK classifies agent actions, assigns deterministic risk scores, and manages the cryptographic human-in-the-loop approval lifecycle.
          </p>
        </div>

        {/* Section: Decision Model */}
        <section id="decision-model" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            The Decision Model
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every authorization evaluation in INTENTLOCK (whether in-process or via the remote gateway) produces a standardized <code className="text-emerald-300 font-mono">Decision</code> model:
          </p>

          <CodeBlock code={decisionSchemaCode} language="python" filename="decision_model.py" />
        </section>

        {/* Section: Verdicts */}
        <section id="verdicts" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            DecisionVerdict Values
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The <code className="text-emerald-300 font-mono">verdict</code> field is an enum representing the explicit authorization outcome:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Verdict</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Action Expected by Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">ALLOW</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">The tool call passed all permission, policy, and context checks.</td>
                  <td className="py-2.5 px-4 font-sans text-emerald-300">Execute the tool callable immediately.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-amber-400 font-bold">REQUIRE_APPROVAL</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">Action touches sensitive resources; requires human operator confirmation.</td>
                  <td className="py-2.5 px-4 font-sans text-amber-300">Suspend execution; poll or listen for approval completion before proceeding.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-rose-400 font-bold">DENY</td>
                  <td className="py-2.5 px-4 font-sans text-slate-300">Action violates policy, lacks permission, or exceeds context boundaries.</td>
                  <td className="py-2.5 px-4 font-sans text-rose-300">Abort tool call; raise error or feed denial message back to agent prompt.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Risk Levels */}
        <section id="risk-levels" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            RiskLevel &amp; Risk Scoring
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK computes a deterministic risk metric between 0.0 and 1.0, categorized into four discrete tiers:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-[#091510] p-3 text-center">
              <span className="text-xs font-mono font-bold text-emerald-400">LOW</span>
              <div className="text-[11px] text-slate-400 mt-1">Read-only, idempotent data lookups</div>
            </div>
            <div className="rounded-xl border border-sky-500/30 bg-[#09121a] p-3 text-center">
              <span className="text-xs font-mono font-bold text-sky-400">MEDIUM</span>
              <div className="text-[11px] text-slate-400 mt-1">Controlled state changes, logging</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-[#161208] p-3 text-center">
              <span className="text-xs font-mono font-bold text-amber-400">HIGH</span>
              <div className="text-[11px] text-slate-400 mt-1">External transactions, sensitive queries</div>
            </div>
            <div className="rounded-xl border border-rose-500/30 bg-[#1a0a0e] p-3 text-center">
              <span className="text-xs font-mono font-bold text-rose-400">CRITICAL</span>
              <div className="text-[11px] text-slate-400 mt-1">Destructive actions, key modifications</div>
            </div>
          </div>
        </section>

        {/* Section: Action Hash */}
        <section id="action-hash" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Canonical Action Hashes
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The <code className="text-emerald-300 font-mono">action_hash</code> is a 64-character hexadecimal SHA-256 digest computed over the canonical representation of the action. It serves as an immutable fingerprint that binds approvals directly to the exact arguments inspected by the security engine.
          </p>
        </section>

        {/* Section: Handling Decisions */}
        <section id="handling-decisions" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Evaluating Decisions in Application Code
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            When using the remote client, pattern match against the verdict to determine safe downstream actions:
          </p>

          <CodeBlock code={handlingCode} language="python" filename="evaluate_decision.py" />
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Tool Protection & Adapters", href: "/developers/sdk/tool-protection" }}
          next={{ title: "Error Handling", href: "/developers/sdk/errors" }}
        />
      </div>
    </DeveloperLayout>
  );
}
