// SICTACK 1.0 – 8-Stage Pipeline Architecture Documentation
"use client";

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function ArchitecturePage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Getting Started", href: "/developers/concepts" },
    { label: "8-Stage Pipeline Architecture", href: "/developers/architecture" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Architecture Overview", level: 2 },
    { id: "pipeline-diagram", title: "Execution Boundary Flow", level: 2 },
    { id: "stage-1-identity", title: "Stage 1: Identity & Heartbeat", level: 2 },
    { id: "stage-2-intent", title: "Stage 2: Intent Context Resolution", level: 2 },
    { id: "stage-3-permissions", title: "Stage 3: Allow / Deny Lists", level: 2 },
    { id: "stage-4-sensitivity", title: "Stage 4: Sensitivity Ceiling", level: 2 },
    { id: "stage-5-recipients", title: "Stage 5: Recipient Boundaries", level: 2 },
    { id: "stage-6-resources", title: "Stage 6: Resource Scope Confinement", level: 2 },
    { id: "stage-7-approval", title: "Stage 7: Approval Nonce Verification", level: 2 },
    { id: "stage-8-audit", title: "Stage 8: Cryptographic Hash Chaining", level: 2 },
    { id: "short-circuiting", title: "Short-Circuiting & Fail-Closed Guarantees", level: 2 },
  ];

  const interceptionPayloadExample = `{
  "agent_id": "support-agent-alpha",
  "tool_name": "send_customer_email",
  "arguments": {
    "to": "client@enterprise.com",
    "subject": "Monthly Statement",
    "attachment": "statement-nov2026.pdf"
  },
  "sensitivity": 6,
  "resource_id": "reports/statement-nov2026.pdf",
  "recipient": "client@enterprise.com",
  "intent_id": "int-7f9a2b81",
  "trace_id": "tr-99824"
}`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Authoritative Gateway
            </span>
            <span className="text-xs text-[#787A80]">8-Stage Enforcement Pipeline</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            8-Stage Pipeline Architecture
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Every tool invocation intercepted by SICTACK passes through an authoritative 8-stage verification pipeline in strict sequential order. If any stage denies permission or requires human escalation, execution short-circuits immediately.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Architecture Overview
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The interception pipeline is implemented symmetrically in both the Python SDK (<code className="font-mono text-[#234E39]">PolicyEngine</code>) and the FastAPI backend (<code className="font-mono text-[#234E39]">POST /api/v1/intercept</code>). It decouples the authorization logic entirely from the agent&apos;s language model, ensuring deterministic, reproducible decisions.
          </p>
          <CodeBlock code={interceptionPayloadExample} language="json" filename="Example Interception Request Payload" />
        </section>

        {/* Section: Pipeline Diagram */}
        <section id="pipeline-diagram" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Execution Boundary Flow
          </h2>
          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-center text-xs">
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                <span className="text-[10px] font-mono font-bold text-[#787A80] uppercase">Input</span>
                <div className="font-semibold text-[#18191B] mt-1">ToolCall Emitted</div>
                <div className="text-[11px] text-[#56585D] mt-0.5">Payload captured</div>
              </div>
              <div className="rounded-lg border border-[#234E39]/20 bg-[#EDF5F0] p-3">
                <span className="text-[10px] font-mono font-bold text-[#234E39] uppercase">Boundary</span>
                <div className="font-semibold text-[#234E39] mt-1">8-Stage Evaluator</div>
                <div className="text-[11px] text-[#56585D] mt-0.5">Strict zero-trust gates</div>
              </div>
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                <span className="text-[10px] font-mono font-bold text-[#787A80] uppercase">Decision</span>
                <div className="font-semibold text-[#18191B] mt-1">Verdict Output</div>
                <div className="text-[11px] text-[#56585D] mt-0.5">ALLOW / DENY / APPROVE</div>
              </div>
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                <span className="text-[10px] font-mono font-bold text-[#787A80] uppercase">Audit</span>
                <div className="font-semibold text-[#18191B] mt-1">SHA-256 Ledger</div>
                <div className="text-[11px] text-[#56585D] mt-0.5">Tamper-evident record</div>
              </div>
            </div>
          </div>
        </section>

        {/* Stages Detail */}
        <section className="space-y-6">
          <div id="stage-1-identity" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 1</span>
              <h3 className="font-bold text-[#18191B] text-sm">Tenant &amp; Agent Identity Verification</h3>
            </div>
            <p className="text-[#56585D]">
              Validates authentication credentials (machine-to-machine API key or operator JWT bearer token). Checks that the agent identity is registered within the authenticated organization and updates the agent&apos;s <code className="font-mono text-[#234E39]">last_active_at</code> heartbeat timestamp in PostgreSQL.
            </p>
          </div>

          <div id="stage-2-intent" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 2</span>
              <h3 className="font-bold text-[#18191B] text-sm">Intent Context Resolution &amp; Immutability Verification</h3>
            </div>
            <p className="text-[#56585D]">
              If an <code className="font-mono text-[#234E39]">intent_id</code> is provided, resolves the pre-authorized <code className="font-mono text-[#234E39]">IntentContext</code>. Verifies that the intent belongs to the active tenant, is marked <code className="font-mono text-[#234E39]">ACTIVE</code>, and has not exceeded its <code className="font-mono text-[#234E39]">expiration_timestamp</code>. If invalid, fails closed with <code className="font-mono text-[#943425]">INTENT_CONTEXT_NOT_FOUND</code>.
            </p>
          </div>

          <div id="stage-3-permissions" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 3</span>
              <h3 className="font-bold text-[#18191B] text-sm">Permission Allow / Deny Lists</h3>
            </div>
            <p className="text-[#56585D]">
              Compares the required tool permission against explicit denial and allowance lists:
            </p>
            <ul className="list-disc list-inside text-[#56585D] space-y-1">
              <li>If the permission is in <code className="font-mono text-[#943425]">denied_permissions</code>: instant <code className="font-mono text-[#943425]">DENY</code>.</li>
              <li>If the permission is in <code className="font-mono text-[#8D5B18]">require_approval_permissions</code>: generates <code className="font-mono text-[#8D5B18]">REQUIRE_APPROVAL</code>.</li>
              <li>If <code className="font-mono text-[#234E39]">allowed_permissions</code> is configured and the permission is omitted: fails closed with <code className="font-mono text-[#943425]">DENY</code>.</li>
            </ul>
          </div>

          <div id="stage-4-sensitivity" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 4</span>
              <h3 className="font-bold text-[#18191B] text-sm">Sensitivity Ceiling Enforcement</h3>
            </div>
            <p className="text-[#56585D]">
              Every tool and action carries a sensitivity score (1&ndash;10). If the tool sensitivity exceeds the policy <code className="font-mono text-[#234E39]">max_sensitivity</code> or the active intent&apos;s <code className="font-mono text-[#234E39]">sensitivity_ceiling</code>, the call is rejected with <code className="font-mono text-[#943425]">SENSITIVITY_TOO_HIGH</code>.
            </p>
          </div>

          <div id="stage-5-recipients" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 5</span>
              <h3 className="font-bold text-[#18191B] text-sm">Recipient &amp; Exfiltration Boundaries</h3>
            </div>
            <p className="text-[#56585D]">
              For tools that communicate externally (emails, webhooks, messages), verifies the <code className="font-mono text-[#234E39]">recipient</code> parameter against <code className="font-mono text-[#234E39]">allowed_recipients</code> glob patterns (e.g. <code className="font-mono text-[#234E39]">*@trusted-company.com</code>). Prevents unauthorized data exfiltration.
            </p>
          </div>

          <div id="stage-6-resources" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 6</span>
              <h3 className="font-bold text-[#18191B] text-sm">Resource Scope Glob Confinement</h3>
            </div>
            <p className="text-[#56585D]">
              Validates target resource paths (filesystem files, S3 keys, database tables) against <code className="font-mono text-[#234E39]">allowed_resources</code> patterns (e.g. <code className="font-mono text-[#234E39]">inbox/*</code>, <code className="font-mono text-[#234E39]">reports/*</code>). Rejects directory traversal attempts (<code className="font-mono text-[#56585D]">../../etc/shadow</code>).
            </p>
          </div>

          <div id="stage-7-approval" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 7</span>
              <h3 className="font-bold text-[#18191B] text-sm">Atomic Human Approval Nonce Verification</h3>
            </div>
            <p className="text-[#56585D]">
              If an <code className="font-mono text-[#234E39]">approval_id</code> is submitted, locks the approval row in PostgreSQL, checks status is <code className="font-mono text-[#234E39]">APPROVED</code>, checks <code className="font-mono text-[#234E39]">consumed == False</code> (preventing replay attacks), matches the canonical SHA-256 <code className="font-mono text-[#234E39]">action_hash</code>, verifies unexpired TTL, and marks consumed atomically.
            </p>
          </div>

          <div id="stage-8-audit" className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 text-xs space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">Stage 8</span>
              <h3 className="font-bold text-[#18191B] text-sm">Cryptographic SHA-256 Audit Trail Chaining</h3>
            </div>
            <p className="text-[#56585D]">
              Appends an immutable audit event to the tenant&apos;s sequential hash chain with an atomic <code className="font-mono text-[#234E39]">sequence_number</code>, previous-entry hash linkage, and computed SHA-256 <code className="font-mono text-[#234E39]">entry_hash</code> before dispatching the response.
            </p>
          </div>
        </section>

        {/* Section: Short-Circuiting */}
        <section id="short-circuiting" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Short-Circuiting &amp; Fail-Closed Guarantees
          </h2>
          <Callout type="info" title="Fail-Closed Short-Circuit Evaluation">
            <p className="text-xs leading-relaxed">
              If an action fails at Stage 3 (explicit denial), subsequent stages (such as recipient verification or approval checks) are bypassed, and Stage 8 immediately records the denial event. The underlying tool is never executed, and no resources are consumed.
            </p>
          </Callout>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Core Concepts", href: "/developers/concepts" }}
          next={{ title: "Python SDK Overview", href: "/developers/sdk" }}
        />
      </div>
    </DeveloperLayout>
  );
}
