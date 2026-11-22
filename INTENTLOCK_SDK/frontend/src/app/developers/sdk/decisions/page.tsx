// SICTACK 1.0 – Decisions & Approvals Documentation Page
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
from sictack.models import DecisionVerdict, RiskLevel

class Decision(BaseModel):
    verdict: DecisionVerdict      # ALLOW, DENY, REQUIRE_APPROVAL
    action_hash: str              # SHA-256 canonical hex digest
    risk_score: float             # Deterministic risk metric (0.0 to 1.0)
    risk_level: RiskLevel         # LOW, MEDIUM, HIGH, CRITICAL
    metadata: Dict[str, Any]      # Includes approval_id, policy_rule, etc.`;

  const handlingCode = `from sictack import SictackClient
from sictack.models import DecisionVerdict, RiskLevel

client = SictackClient(api_key="...", base_url="https://...", agent_id="agent-1")

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
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Python SDK
            </span>
            <span className="text-xs text-[#787A80]">Security Verdicts</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Decisions &amp; Approvals
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Understand how SICTACK classifies agent actions, assigns deterministic risk scores, and manages the cryptographic human-in-the-loop approval lifecycle.
          </p>
        </div>

        {/* Section: Decision Model */}
        <section id="decision-model" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            The Decision Model
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Every authorization evaluation in SICTACK (whether in-process or via the remote gateway) produces a standardized <code className="text-[#234E39] font-mono">Decision</code> model:
          </p>

          <CodeBlock code={decisionSchemaCode} language="python" filename="decision_model.py" />
        </section>

        {/* Section: Verdicts */}
        <section id="verdicts" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            DecisionVerdict Values
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The <code className="text-[#234E39] font-mono">verdict</code> field is an enum representing the explicit authorization outcome:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Verdict</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Action Expected by Developer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39] font-bold">ALLOW</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">The tool call passed all permission, policy, and context checks.</td>
                  <td className="py-2.5 px-4 font-sans text-[#234E39]">Execute the tool callable immediately.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#8D5B18] font-bold">REQUIRE_APPROVAL</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Action touches sensitive resources; requires human operator confirmation.</td>
                  <td className="py-2.5 px-4 font-sans text-[#8D5B18]">Suspend execution; poll or listen for approval completion before proceeding.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425] font-bold">DENY</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Action violates policy, lacks permission, or exceeds context boundaries.</td>
                  <td className="py-2.5 px-4 font-sans text-[#943425]">Abort tool call; raise error or feed denial message back to agent prompt.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Risk Levels */}
        <section id="risk-levels" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            RiskLevel &amp; Risk Scoring
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK computes a deterministic risk metric between 0.0 and 1.0, categorized into four discrete tiers:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-[#234E39]/20 bg-[#091510] p-3 text-center">
              <span className="text-xs font-mono font-bold text-[#234E39]">LOW</span>
              <div className="text-[11px] text-[#56585D] mt-1">Read-only, idempotent data lookups</div>
            </div>
            <div className="rounded-xl border border-[#1D3557]/20 bg-[#09121a] p-3 text-center">
              <span className="text-xs font-mono font-bold text-[#1D3557]">MEDIUM</span>
              <div className="text-[11px] text-[#56585D] mt-1">Controlled state changes, logging</div>
            </div>
            <div className="rounded-xl border border-[#8D5B18]/20 bg-[#FFFFFF] p-3 text-center">
              <span className="text-xs font-mono font-bold text-[#8D5B18]">HIGH</span>
              <div className="text-[11px] text-[#56585D] mt-1">External transactions, sensitive queries</div>
            </div>
            <div className="rounded-xl border border-[#943425]/20 bg-[#FFFFFF] p-3 text-center">
              <span className="text-xs font-mono font-bold text-[#943425]">CRITICAL</span>
              <div className="text-[11px] text-[#56585D] mt-1">Destructive actions, key modifications</div>
            </div>
          </div>
        </section>

        {/* Section: Action Hash */}
        <section id="action-hash" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Canonical Action Hashes
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The <code className="text-[#234E39] font-mono">action_hash</code> is a 64-character hexadecimal SHA-256 digest computed over the canonical representation of the action. It serves as an immutable fingerprint that binds approvals directly to the exact arguments inspected by the security engine.
          </p>
        </section>

        {/* Section: Handling Decisions */}
        <section id="handling-decisions" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Evaluating Decisions in Application Code
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
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
