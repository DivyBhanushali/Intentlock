// SICTACK 1.0 – Developer Documentation: SENTINEL Behavioral Engine
// Direction A: Warm Editorial Software (Human-Centered Design)

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function DevelopersSentinelPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security Engines", href: "/developers/sentinel" },
    { label: "SENTINEL Behavioral Radar", href: "/developers/sentinel" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "SENTINEL Architecture & Role", level: 2 },
    { id: "session-confinement", title: "Task Session Confinement", level: 2 },
    { id: "detectors", title: "9 Behavioral Detectors (SNT-R001 to SNT-R009)", level: 2 },
    { id: "risk-engine", title: "Explainable Risk Scoring & 4 Tiers", level: 2 },
    { id: "containment", title: "Autonomous Containment Pipeline", level: 2 },
    { id: "sdk-example", title: "Python SDK Integration Example", level: 2 },
  ];

  const sessionInitCode = `from sictack.sentinel import (
    TaskSessionManager,
    TaskScope,
    BehavioralIntelligenceEngine,
    AutomatedContainmentEngine,
    ContainmentPolicy,
)

# 1. Initialize Task Session Manager
manager = TaskSessionManager()

# 2. Define authorized task scope envelope
scope = TaskScope(
    allowed_tools=["fetch_html", "parse_table", "summarize_text"],
    allowed_resources=["https://sec.gov/*", "https://treasury.gov/*"],
    max_steps=50,
    max_execution_time_seconds=300,
)

# 3. Create confined session
session = manager.create_session(
    agent_id="research_bot_01",
    task_objective="Extract annual 10-K filing disclosures",
    authorized_scope=scope,
)`;

  const riskAndContainmentCode = `from sictack.sentinel import ExplainableRiskEngine, AutomatedContainmentEngine

# 1. Initialize behavioral detector and risk engine
behavioral_engine = BehavioralIntelligenceEngine()
risk_engine = ExplainableRiskEngine()
containment_engine = AutomatedContainmentEngine()

# 2. Evaluate execution event across 9 continuous detectors
anomalies = behavioral_engine.evaluate_event(session, event)

# 3. Compute normalized risk score and factor breakdown
assessment = risk_engine.assess_session(session, anomalies)
print(f"Risk Score: {assessment.risk_score:.2f} | Tier: {assessment.risk_tier.name}")
# Output: Risk Score: 0.85 | Tier: TIER_3

# 4. Enforce automated containment based on risk policy
action = containment_engine.enforce(session, assessment)
print(f"Enforced Action: {action.action_type.name} (Status: {action.status.name})")
# Output: Enforced Action: QUARANTINE_SUSPEND (Status: ENFORCED)`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <header className="mb-8 border-b border-[#E2E0D8] pb-8">
        <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#FEF7EC] border border-[#F5DCBA] text-[#8D5B18] text-xs font-mono mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8D5B18]"></span>
          <span>SECURITY ENGINE 02 // BEHAVIORAL SURVEILLANCE</span>
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#18191B] sm:text-4xl">
          SICTACK SENTINEL Behavioral Engine
        </h1>
        <p className="mt-3 text-base text-[#56585D] leading-relaxed max-w-3xl">
          Developer reference for stateful task session monitoring, deterministic anomaly detection (SNT-R001 to SNT-R009), explainable risk scoring, and automated containment.
        </p>
      </header>

      <section id="overview" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          SENTINEL Architecture &amp; Role
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          While <strong>SICTACK CORE</strong> evaluates isolated tool calls at the in-process execution boundary, <strong>SICTACK SENTINEL</strong> operates across time and multi-step execution traces.
        </p>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Autonomous AI agents often fail not because a single tool call was forbidden, but because a sequence of individually permissible actions collectively deviates from the intended goal (such as data exfiltration via tiny payload fragments, infinite execution loops, or goal drift). SENTINEL provides continuous behavioral surveillance and progressive containment.
        </p>
        <Callout type="info" title="Zero-Bypass Monotonicity">
          SENTINEL operates with strict monotonicity: it can only increase security restrictions (e.g. rate throttling, requiring approval, or quarantining). SENTINEL can never grant permissions or override a CORE denial.
        </Callout>
      </section>

      <section id="session-confinement" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Task Session Confinement
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          Every autonomous workflow runs inside a <code>TaskSession</code> bound to a <code>TaskScope</code> envelope. This envelope defines the agent&rsquo;s authorized tool set, allowed external resources, maximum step count, and execution time budget.
        </p>
        <CodeBlock code={sessionInitCode} language="python" filename="sentinel_session.py" />
      </section>

      <section id="detectors" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          9 Behavioral Detectors (SNT-R001 to SNT-R009)
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          SENTINEL evaluates 9 deterministic detection algorithms on every step event:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-[#E4E9E8]">
            <thead className="bg-[#F8F9F8] text-[11px] font-mono text-[#787E81] uppercase">
              <tr>
                <th className="p-2.5 border-b border-[#E4E9E8]">Rule ID</th>
                <th className="p-2.5 border-b border-[#E4E9E8]">Detector Name</th>
                <th className="p-2.5 border-b border-[#E4E9E8]">Severity</th>
                <th className="p-2.5 border-b border-[#E4E9E8]">Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E9E8]">
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R001</td>
                <td className="p-2.5 text-[#56585D]">Repeated Unauthorized Tool Calls</td>
                <td className="p-2.5 font-mono text-[#943425]">HIGH</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.65</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R002</td>
                <td className="p-2.5 text-[#56585D]">Repeated Restricted Resource Access</td>
                <td className="p-2.5 font-mono text-[#943425]">HIGH</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.65</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R003</td>
                <td className="p-2.5 text-[#56585D]">Excessive Tool Execution Attempts</td>
                <td className="p-2.5 font-mono text-[#8D5B18]">MEDIUM</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.35</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R004</td>
                <td className="p-2.5 text-[#56585D]">Task Scope Violations &amp; Drift</td>
                <td className="p-2.5 font-mono text-[#943425]">HIGH</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.65</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R005</td>
                <td className="p-2.5 text-[#56585D]">Abnormal Execution Frequency</td>
                <td className="p-2.5 font-mono text-[#8D5B18]">MEDIUM</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.35</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R006</td>
                <td className="p-2.5 text-[#56585D]">Execution Budget &amp; Step Limit Violations</td>
                <td className="p-2.5 font-mono text-[#943425]">HIGH</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.65</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R007</td>
                <td className="p-2.5 text-[#56585D]">Suspicious Tool Sequences</td>
                <td className="p-2.5 font-mono text-[#742A2A] font-bold">CRITICAL</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.90</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R008</td>
                <td className="p-2.5 text-[#56585D]">Approval Abuse &amp; Coercion Spam</td>
                <td className="p-2.5 font-mono text-[#943425]">HIGH</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.65</td>
              </tr>
              <tr>
                <td className="p-2.5 font-mono text-[#18191B]">SNT-R009</td>
                <td className="p-2.5 text-[#56585D]">Fragmented Data Exfiltration Patterns</td>
                <td className="p-2.5 font-mono text-[#742A2A] font-bold">CRITICAL</td>
                <td className="p-2.5 font-mono text-[#18191B]">0.90</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="risk-engine" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Explainable Risk Scoring &amp; 4 Tiers
        </h2>
        <p className="text-sm leading-relaxed text-[#56585D]">
          The <code>ExplainableRiskEngine</code> aggregates individual detector triggers using an independent probability union formula:
        </p>
        <div className="p-3 bg-[#F8F9F8] rounded font-mono text-xs text-[#18191B]">
          Risk = 1.0 - &prod; (1.0 - w_i)
        </div>
        <p className="text-sm leading-relaxed text-[#56585D]">
          The resulting score maps directly to four standardized operational tiers:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded border border-[#E4E9E8]">
            <span className="font-mono font-bold text-[#234E39]">TIER 0 // Nominal (0.00 - 0.24)</span>
            <p className="text-[#56585D] mt-1">Normal execution within bounds. No action taken.</p>
          </div>
          <div className="p-3 bg-white rounded border border-[#E4E9E8]">
            <span className="font-mono font-bold text-[#8D5B18]">TIER 1 // Elevated (0.25 - 0.49)</span>
            <p className="text-[#56585D] mt-1">Minor behavioral drift. Enforces step-up monitoring.</p>
          </div>
          <div className="p-3 bg-white rounded border border-[#E4E9E8]">
            <span className="font-mono font-bold text-[#943425]">TIER 2 // High Risk (0.50 - 0.74)</span>
            <p className="text-[#56585D] mt-1">Multiple anomaly indicators. Rate throttles and requires approval.</p>
          </div>
          <div className="p-3 bg-white rounded border border-[#E4E9E8]">
            <span className="font-mono font-bold text-[#742A2A]">TIER 3 // Critical Threat (0.75 - 1.00)</span>
            <p className="text-[#56585D] mt-1">Severe breach detected. Immediate quarantine and suspension.</p>
          </div>
        </div>
      </section>

      <section id="sdk-example" className="space-y-4 pt-8 border-t border-[#E4E9E8]">
        <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
          Python SDK Integration Example
        </h2>
        <CodeBlock code={riskAndContainmentCode} language="python" filename="sentinel_surveillance.py" />
      </section>

      <div className="pt-8 border-t border-[#E4E9E8]">
        <PreviousNextNavigation
          prev={{ title: "CORE Deterministic Gateway", href: "/developers/core" }}
          next={{ title: "Python SDK Overview", href: "/developers/sdk" }}
        />
      </div>
    </DeveloperLayout>
  );
}
