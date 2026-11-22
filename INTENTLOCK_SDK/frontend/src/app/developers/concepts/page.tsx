// SICTACK 1.0 – Core Concepts Documentation Page
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function ConceptsPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Getting Started", href: "/developers/installation" },
    { label: "Core Concepts", href: "/developers/concepts" },
  ];

  const toc: TocItem[] = [
    { id: "execution-boundary", title: "The Execution Boundary", level: 2 },
    { id: "zero-trust-identity", title: "Zero-Trust Agent Identity", level: 2 },
    { id: "intent-contexts", title: "Intent Authorization Contexts", level: 2 },
    { id: "action-hashes", title: "Canonical Action Hashes", level: 2 },
    { id: "policy-evaluation", title: "Deterministic Policy Engine", level: 2 },
    { id: "approval-lifecycle", title: "Approval Lifecycle & Replay Defense", level: 2 },
    { id: "fail-closed", title: "Fail-Closed Architecture", level: 2 },
  ];

  const hashExample = `# Canonical Hash Calculation Mechanism
import hashlib
import json

# Arguments are sorted by key to guarantee identical bytes regardless of key insertion order
canonical_payload = json.dumps(
    {"tool_name": "transfer_funds", "arguments": {"amount": 250.0, "recipient": "ACC-9921"}},
    sort_keys=True,
    separators=(",", ":")
)
action_hash = hashlib.sha256(canonical_payload.encode("utf-8")).hexdigest()
# -> "a7f3b890c21e..."`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Architecture
            </span>
            <span className="text-xs text-[#787A80]">Security Model</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Core Concepts &amp; Architecture
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Understand the theoretical foundation and security guarantees of SICTACK: why prompt filters fail, how canonical action hashes prevent replay attacks, and why fail-closed execution boundaries protect production systems.
          </p>
        </div>

        {/* Section: The Execution Boundary */}
        <section id="execution-boundary" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            1. The Execution Boundary
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Modern Large Language Models (LLMs) are probabilistic and inherently vulnerable to prompt injection, jailbreaking, and indirect prompt injection through untrusted external data (such as emails, scraped websites, or database records).
          </p>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Relying solely on system prompts or prompt-level guardrails is fundamentally insecure: an attacker who compromises the model&apos;s linguistic context can trick it into invoking dangerous tools.
          </p>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5">
            <div className="text-xs font-mono font-bold text-[#234E39] uppercase tracking-wider mb-2">The SICTACK Principle</div>
            <p className="text-sm text-[#18191B] leading-relaxed">
              <strong>Security enforcement must occur at the point of execution, outside the LLM&apos;s probabilistic reasoning loop.</strong>
            </p>
            <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
              SICTACK operates as a deterministic gatekeeper between the model&apos;s generated tool invocation and the actual runtime execution environment. Even if the model is 100% convinced it should drop a database table, SICTACK intercepts the tool call, verifies policies and permissions deterministically, and halts the call before a single byte touches external systems.
            </p>
          </div>
        </section>

        {/* Section: Zero-Trust Agent Identity */}
        <section id="zero-trust-identity" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            2. Zero-Trust Agent Identity
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            In an enterprise ecosystem, not all agents have the same privileges. A customer-facing support agent should never share the permissions of an automated accounting reconciliation worker.
          </p>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK binds every execution request to an authenticated <code className="text-[#234E39] font-mono">agent_id</code> and a set of explicit capability scopes (<code className="text-[#234E39] font-mono">permissions</code>). Policy evaluation takes into account:
          </p>
          <ul className="text-xs text-[#56585D] list-disc list-inside space-y-1.5 ml-2">
            <li>The identity of the calling agent (<code className="font-mono text-[#234E39]">agent_id</code>)</li>
            <li>The granular permissions possessed by that agent (<code className="font-mono text-[#234E39]">permissions</code>)</li>
            <li>The target tool name and exact JSON argument payload</li>
            <li>The active task-scoped intent authorization context</li>
          </ul>
        </section>

        {/* Section: Intent Authorization Contexts */}
        <section id="intent-contexts" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            3. Intent Authorization Contexts
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Traditional API gateways grant broad static permissions (e.g., &quot;can write to database&quot;). However, an agent should only be allowed to modify a database when it is actively executing a specific authorized workflow.
          </p>
          <p className="text-sm text-[#56585D] leading-relaxed">
            <strong>Intent Contexts</strong> are short-lived, task-scoped execution authorization windows created via <code className="text-[#234E39] font-mono">POST /api/v1/intent-contexts</code>. Each context defines:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
              <div className="text-xs font-mono font-bold text-[#18191B]">Time-To-Live (TTL)</div>
              <p className="text-[11px] text-[#56585D] mt-1">Automatically expires after the task completes or timeout expires.</p>
            </div>
            <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
              <div className="text-xs font-mono font-bold text-[#18191B]">Allowed Tool Scope</div>
              <p className="text-[11px] text-[#56585D] mt-1">Restricts tool execution strictly to tools needed for this specific goal.</p>
            </div>
            <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
              <div className="text-xs font-mono font-bold text-[#18191B]">Task Correlation</div>
              <p className="text-[11px] text-[#56585D] mt-1">Correlates all downstream tool calls and audit events to a single user goal.</p>
            </div>
          </div>
        </section>

        {/* Section: Canonical Action Hashes */}
        <section id="action-hashes" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            4. Canonical Action Hashes
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            To prevent parameter tampering and ensure verifiable auditing, SICTACK computes a deterministic SHA-256 hash over every tool invocation:
          </p>

          <CodeBlock code={hashExample} language="python" filename="action_hash_concept.py" />

          <p className="text-xs text-[#56585D] leading-relaxed">
            Because arguments are strictly sorted and formatted prior to hashing, identical arguments produce identical hashes regardless of dictionary key ordering, while any modification to an argument (e.g. changing <code className="text-[#18191B]">amount=250.0</code> to <code className="text-[#18191B]">amount=250000.0</code>) produces a completely different hash.
          </p>
        </section>

        {/* Section: Deterministic Policy Engine */}
        <section id="policy-evaluation" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            5. Deterministic Policy Engine
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Policy evaluation is non-probabilistic. Rules are evaluated sequentially:
          </p>
          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Action</th>
                  <th className="py-2.5 px-4">Behavior</th>
                  <th className="py-2.5 px-4">Exception / Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39] font-bold">allow</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Tool execution proceeds immediately</td>
                  <td className="py-2.5 px-4 text-[#56585D]">None (Returns tool result)</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#8D5B18] font-bold">require_approval</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Suspends execution, creates an approval request ticket bound to action hash</td>
                  <td className="py-2.5 px-4 text-[#8D5B18]">Raises ApprovalRequiredError</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#943425] font-bold">deny</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Halts execution immediately, logs security threat event</td>
                  <td className="py-2.5 px-4 text-[#943425]">Raises PermissionDeniedError</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Approval Lifecycle */}
        <section id="approval-lifecycle" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            6. Approval Lifecycle &amp; Replay Defense
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Human-in-the-loop approvals are guarded by four rigorous cryptographic constraints:
          </p>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-sm font-semibold text-[#234E39]">Single-Use Token Guarantee</h3>
              <p className="mt-1 text-xs text-[#56585D] leading-relaxed">
                When an operator approves a request, an approval token is issued. Upon calling <code className="text-[#18191B]">execute_with_approval</code>, the token is consumed (<code className="text-[#18191B] font-mono">consumed = True</code>). Any subsequent execution attempt with that same approval ID raises an <code className="text-[#943425] font-mono">ApprovalReplayError</code>.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-sm font-semibold text-[#234E39]">Cryptographic Parameter Binding</h3>
              <p className="mt-1 text-xs text-[#56585D] leading-relaxed">
                The approval request stores the exact <code className="text-[#18191B] font-mono">action_hash</code>. When the approval is presented to execute the action, SICTACK recomputes the hash of the current payload. If an attacker modifies even a single parameter value, an <code className="text-[#943425] font-mono">ApprovalMismatchError</code> is raised.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-sm font-semibold text-[#234E39]">TTL &amp; Expiration Enforcement</h3>
              <p className="mt-1 text-xs text-[#56585D] leading-relaxed">
                Approvals carry an <code className="text-[#18191B] font-mono">expires_at</code> timestamp (default 300 seconds). Presenting an approval after expiration raises an <code className="text-[#943425] font-mono">ApprovalExpiredError</code>.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Fail-Closed */}
        <section id="fail-closed" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            7. Fail-Closed Architecture
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK follows a strict <strong>fail-closed</strong> philosophy:
          </p>

          <Callout type="danger" title="Guaranteed Denial on Failure">
            <p className="text-xs leading-relaxed">
              If an unknown tool is invoked, if a network timeout occurs connecting to the centralized gateway, if a policy evaluation encounters invalid syntax, or if an approval is missing or unverified, SICTACK <strong>always denies execution</strong>. It never fails open under any circumstances.
            </p>
          </Callout>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Quickstart", href: "/developers/quickstart" }}
          next={{ title: "Python SDK Overview", href: "/developers/sdk" }}
        />
      </div>
    </DeveloperLayout>
  );
}
