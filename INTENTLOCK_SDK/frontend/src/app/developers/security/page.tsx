// SICTACK 1.0 – Security Architecture & Threat Model Documentation
"use client";

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SecurityArchitecturePage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/security" },
    { label: "Security Architecture", href: "/developers/security" },
  ];

  const toc: TocItem[] = [
    { id: "threat-model", title: "Threat Model & Trust Boundaries", level: 2 },
    { id: "enforcement-modes", title: "In-Process vs Remote Gateway", level: 2 },
    { id: "deterministic-pipeline", title: "Deterministic 8-Stage Pipeline", level: 2 },
    { id: "intent-authorization", title: "Intent-Scoped Authorization", level: 2 },
    { id: "approval-replay-defense", title: "Human Approval & Replay Defense", level: 2 },
    { id: "audit-hash-chaining", title: "Cryptographic SHA-256 Audit Chain", level: 2 },
    { id: "auth-rbac-scoping", title: "Authentication, RBAC & Tenant Scoping", level: 2 },
    { id: "fail-closed", title: "Fail-Closed Behavior & Exceptions", level: 2 },
    { id: "verified-vs-future", title: "Verified Controls vs Recommendations", level: 2 },
    { id: "known-limitations", title: "Known Limitations & Unsupported Guarantees", level: 2 },
  ];

  const hashChainFormulaCode = `# Canonical Entry Hash Formula (app/core/audit_chain.py)
payload = f"{sequence_number}|{previous_hash}|{org_id}|{agent_id}|{tool_name}|{verdict}|{action_hash}|{timestamp_epoch}"
entry_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()`;

  const verifyAuditCurl = `# Verify the cryptographic hash chain for your tenant
curl -X GET "https://intentlock-backend-ze2i.onrender.com/api/v1/audit/verify" \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "X-Organization-ID: org-enterprise-alpha"`;

  const verifyAuditResponse = `{
  "verified": true,
  "total_records": 1284,
  "valid_records": 1284,
  "corrupted_records": 0,
  "first_corrupted_id": null,
  "details": "Audit chain integrity verified. All sequential hashes match."
}`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Zero-Trust Architecture
            </span>
            <span className="text-xs text-[#787A80]">Defense-in-Depth Specification</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Security Architecture &amp; Threat Model
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            SICTACK is a deterministic security middleware operating at the execution boundary between autonomous AI agents and underlying system tools. This document provides a transparent, verifiable breakdown of its threat model, cryptographic audit trails, approval replay defenses, and boundary guarantees.
          </p>
        </div>

        {/* Section: Threat Model */}
        <section id="threat-model" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Threat Model &amp; Trust Boundaries
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK treats the <strong>Large Language Model (LLM) as an untrusted reasoning engine</strong>. Regardless of how well an agent is prompt-engineered, an LLM remains vulnerable to prompt injection, hallucination, goal drift, and prompt manipulation. Therefore, an LLM is never permitted to make its own authorization decisions or alter security constraints.
          </p>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#18191B]">Trust Boundary Principles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1.5">
                <span className="font-bold text-[#943425] font-mono">UNTRUSTED ZONE</span>
                <p className="text-[#56585D]">Natural-language prompts, user inputs, external documents, web search results, and raw LLM output tokens.</p>
              </div>
              <div className="rounded-lg border border-[#234E39]/20 bg-[#EDF5F0] p-3.5 space-y-1.5">
                <span className="font-bold text-[#234E39] font-mono">TRUSTED ZONE</span>
                <p className="text-[#56585D]">Signed policies, verified API keys, immutable <code className="font-mono text-[#234E39]">IntentContext</code>, operator approval nonces, and the deterministic 8-stage interception engine.</p>
              </div>
            </div>
            <p className="text-xs text-[#56585D]">
              The execution boundary is placed between the tool call request emitted by the agent and the real Python callable or downstream REST endpoint. If an action does not pass deterministic evaluation, it is stopped dead before touching system memory, filesystems, databases, or APIs.
            </p>
          </div>
        </section>

        {/* Section: Enforcement Modes */}
        <section id="enforcement-modes" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            In-Process SDK vs Remote Authorization Gateway
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK provides two complementary integration architectures depending on your runtime latency, infrastructure requirements, and centralized governance needs:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#234E39]">IN-PROCESS ENFORCEMENT</span>
                <span className="text-[10px] font-mono text-[#787A80]">SecureAgent</span>
              </div>
              <p className="text-xs text-[#56585D] leading-relaxed">
                Runs entirely within the Python agent process. Tool callables are encapsulated inside a private closure registry (<code className="font-mono text-[#234E39]">ToolRegistry</code>). The agent runtime never receives direct references to the unshielded callable.
              </p>
              <ul className="text-xs text-[#56585D] list-disc list-inside space-y-1">
                <li>Sub-millisecond policy evaluation overhead (&lt; 0.5ms).</li>
                <li>Zero external network dependencies.</li>
                <li>In-memory thread-safe approval manager (<code className="font-mono text-[#234E39]">ApprovalService</code>).</li>
                <li>Best for local agents, CLI scripts, and offline development.</li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-cyan-400">REMOTE GATEWAY</span>
                <span className="text-[10px] font-mono text-[#787A80]">SictackClient</span>
              </div>
              <p className="text-xs text-[#56585D] leading-relaxed">
                Routes all interception requests over HTTPS to the centralized FastAPI backend (<code className="font-mono text-[#234E39]">POST /api/v1/intercept</code>).
              </p>
              <ul className="text-xs text-[#56585D] list-disc list-inside space-y-1">
                <li>Centralized organization-wide policy management.</li>
                <li>Persistent PostgreSQL database with human approval queues.</li>
                <li>Cryptographic SHA-256 sequential audit trail.</li>
                <li>SOC dashboard telemetry and real-time threat detection.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section: Deterministic Pipeline */}
        <section id="deterministic-pipeline" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Deterministic 8-Stage Policy Pipeline
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Every tool invocation sent to <code className="font-mono text-[#234E39]">POST /api/v1/intercept</code> passes through an authoritative 8-stage verification pipeline in strict sequential order. If any stage denies or requires approval, evaluation short-circuits immediately:
          </p>

          <div className="space-y-2.5">
            {[
              { step: 1, name: "Tenant & Agent Identity Verification", desc: "Validates API key/JWT, checks active organization membership, and updates agent heartbeat." },
              { step: 2, name: "Intent Context Resolution", desc: "Verifies whether the supplied intent_id exists, belongs to the tenant, is ACTIVE, and has not expired." },
              { step: 3, name: "Explicit Allow & Deny Filtering", desc: "Denies any tool in denied_permissions or lacking required permission in allowed_permissions." },
              { step: 4, name: "Sensitivity Ceiling Enforcement", desc: "Compares tool sensitivity score against the policy max_sensitivity and intent sensitivity_ceiling." },
              { step: 5, name: "Recipient & Exfiltration Boundaries", desc: "Enforces wildcard domain matching (*@company.com) on external communications tools." },
              { step: 6, name: "Resource Scope Glob Confinement", desc: "Evaluates resource_id against authorized resource patterns (e.g., reports/*) to prevent directory traversal." },
              { step: 7, name: "Atomic Human Approval Nonce Verification", desc: "If approval_id is provided, validates that the single-use token was approved, unexpired, unconsumed, and matches the action hash." },
              { step: 8, name: "Tamper-Evident Audit Recording", desc: "Appends the decision to the organization's SHA-256 sequential hash chain before returning." },
            ].map((stage) => (
              <div key={stage.step} className="flex items-start gap-3 rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3 text-xs">
                <span className="flex-shrink-0 font-mono font-bold text-[#234E39] bg-[#EDF5F0] px-2 py-0.5 rounded border border-[#234E39]/20">
                  Stage {stage.step}
                </span>
                <div>
                  <h4 className="font-semibold text-[#18191B]">{stage.name}</h4>
                  <p className="text-[#56585D] mt-0.5">{stage.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Intent Authorization */}
        <section id="intent-authorization" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Intent-Scoped Authorization (IntentContext)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            In standard RBAC, permissions are tied permanently to an agent identity. If an agent is granted <code className="font-mono text-[#234E39]">db:write</code>, it retains that power indefinitely. SICTACK 1.0 introduces <strong>Intent-Scoped Authorization</strong>:
          </p>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#18191B]">How IntentContext Works</h3>
            <ol className="list-decimal list-inside text-xs text-[#56585D] space-y-2">
              <li>
                <strong>Pre-Authorization by Trusted App:</strong> Before dispatching an agent task, your application creates an <code className="font-mono text-[#234E39]">IntentContext</code> with an explicit <code className="font-mono text-[#234E39]">authorized_objective</code>, allowed actions list, and <code className="font-mono text-[#234E39]">expiration_timestamp</code> (e.g., 10 minutes).
              </li>
              <li>
                <strong>Execution Context Binding:</strong> The agent receives the <code className="font-mono text-[#234E39]">intent_id</code> and includes it with every tool call.
              </li>
              <li>
                <strong>Boundary Enforcement:</strong> The security engine verifies that the tool call falls strictly within the bounds granted for that specific task.
              </li>
              <li>
                <strong>Immutability &amp; Revocation:</strong> Once provisioned, an intent cannot be broadened by the agent. If an operator revokes an intent via <code className="font-mono text-[#234E39]">POST /api/v1/intents/{'{id}'}/revoke</code>, subsequent agent calls fail closed with <code className="font-mono text-[#943425]">DENY</code>.
              </li>
            </ol>
          </div>
        </section>

        {/* Section: Approval Replay Defense */}
        <section id="approval-replay-defense" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Human Approval &amp; Cryptographic Replay Defense
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            When a high-risk tool call triggers <code className="font-mono text-[#8D5B18]">REQUIRE_APPROVAL</code>, SICTACK issues an approval request bound to an action hash. The approval token cannot be stolen, reused, or modified:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-[#8D5B18]">Action Hash Binding</span>
              <p className="text-[#56585D]">
                The approval ticket stores <code className="font-mono text-[#234E39]">action_hash = sha256(canonical(tool_name, arguments, agent_id))</code>. If an attacker tampers with even one argument after approval, execution is rejected with HTTP 400 (<code className="font-mono text-[#943425]">ApprovalMismatchError</code>).
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-[#943425]">Single-Use Atomic Nonce</span>
              <p className="text-[#56585D]">
                Approvals are atomic single-use tokens. On redemption, the database marks <code className="font-mono text-[#234E39]">consumed = true</code> in a row-locked transaction. Any secondary attempt triggers HTTP 409 Conflict (<code className="font-mono text-[#943425]">ApprovalReplayError</code>).
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <span className="font-mono font-bold text-cyan-400">Strict TTL Expiration</span>
              <p className="text-[#56585D]">
                Each approval has an <code className="font-mono text-[#234E39]">expires_at</code> timestamp (default 300 seconds). Approvals not claimed within the window are automatically invalidated with HTTP 410 Gone (<code className="font-mono text-[#943425]">ApprovalExpiredError</code>).
              </p>
            </div>
          </div>
        </section>

        {/* Section: Audit Hash Chaining */}
        <section id="audit-hash-chaining" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Cryptographic SHA-256 Audit Chaining
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK eliminates blind spots and prevents retroactive audit manipulation using a sequential SHA-256 hash chain inspired by blockchain ledger verification:
          </p>

          <CodeBlock code={hashChainFormulaCode} language="python" filename="app/core/audit_chain.py" />

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-[#18191B]">How Audit Integrity Is Guaranteed</h3>
            <ul className="list-disc list-inside text-[#56585D] space-y-1.5">
              <li><strong>Monotonic Sequence Numbers:</strong> Each tenant maintains an ordered sequence of events (<code className="font-mono text-[#234E39]">sequence_number</code> 1, 2, 3...).</li>
              <li><strong>Genesis Block:</strong> The first record in an organization chain links to a 64-character zero-hash (<code className="font-mono text-[#56585D]">0000000000000000000000000000000000000000000000000000000000000000</code>).</li>
              <li><strong>Linkage:</strong> Every subsequent record stores <code className="font-mono text-[#234E39]">previous_hash</code> equal to the preceding record&apos;s <code className="font-mono text-[#234E39]">entry_hash</code>.</li>
              <li><strong>Tamper-Evident Detection:</strong> If any database row is altered, inserted out-of-order, or deleted, every downstream hash in the chain breaks immediately.</li>
            </ul>
          </div>

          <p className="text-xs text-[#56585D]">
            You can verify your organization&apos;s audit trail at any time using the cryptographic verification endpoint:
          </p>
          <CodeBlock code={verifyAuditCurl} language="bash" filename="Audit Verification Request" />
          <CodeBlock code={verifyAuditResponse} language="json" filename="Verification Response" />
        </section>

        {/* Section: Auth, RBAC & Tenant Scoping */}
        <section id="auth-rbac-scoping" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Authentication, RBAC &amp; Tenant Scoping
          </h2>
          <div className="space-y-4 text-xs text-[#56585D]">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#18191B]">Authentication Protocols</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3 space-y-1">
                  <span className="font-bold text-[#234E39] font-mono">Agent M2M API Keys</span>
                  <p className="text-[#56585D]">Header: <code className="text-[#234E39] font-mono">X-API-Key: ilk_live_...</code>. Scoped exclusively to the Interception Gateway for machine-to-machine agents.</p>
                </div>
                <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3 space-y-1">
                  <span className="font-bold text-cyan-400 font-mono">Operator JWT Tokens</span>
                  <p className="text-[#56585D]">Header: <code className="text-cyan-300 font-mono">Authorization: Bearer &lt;jwt&gt;</code>. Issued upon login containing signed claims for <code className="text-[#56585D] font-mono">sub</code>, <code className="text-[#56585D] font-mono">org_id</code>, and <code className="text-[#56585D] font-mono">role</code>.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-3">
              <h3 className="text-sm font-semibold text-[#18191B]">Authoritative RBAC Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                  <span className="font-bold text-[#943425] font-mono">ADMIN</span>
                  <p className="text-[#56585D] mt-1">Full management: create/update policies, issue API keys, manage organization members, and inspect all audit logs.</p>
                </div>
                <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                  <span className="font-bold text-[#8D5B18] font-mono">OPERATOR</span>
                  <p className="text-[#56585D] mt-1">Operational control: triage and approve/reject pending approval requests, review alerts, and query audit events.</p>
                </div>
                <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
                  <span className="font-bold text-[#56585D] font-mono">VIEWER</span>
                  <p className="text-[#56585D] mt-1">Read-only monitoring: inspect dashboard telemetry, view audit events, and run verification probes.</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2">
              <h3 className="text-sm font-semibold text-[#18191B]">Organization Scoping</h3>
              <p className="text-[#56585D]">
                All database entities (policies, agents, approvals, audit events, intents) carry an <code className="font-mono text-[#234E39]">org_id</code> column. Backend database queries filter strictly by the authenticated tenant context (<code className="font-mono text-[#234E39]">TenantContext.org_id</code>). In addition, PostgreSQL Row Level Security (RLS) is enabled on all 12 core tables in Supabase.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Fail-Closed */}
        <section id="fail-closed" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Fail-Closed Behavior &amp; Exception Hierarchy
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK operates under strict <strong>fail-closed</strong> invariants: if anything goes wrong, permission is denied immediately.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-mono font-semibold text-[#943425]">Missing or Malformed Policy</span>
              <p className="text-[#56585D]">If an agent is not mapped to an active policy, the interceptor logs <code className="text-[#943425] font-mono">POLICY_MISSING_FAIL_CLOSED</code> and outputs <code className="text-[#943425] font-mono">DENY</code>.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-mono font-semibold text-[#943425]">Unknown or Revoked Intent</span>
              <p className="text-[#56585D]">If an intent context cannot be resolved for the active tenant, the call fails closed with <code className="text-[#943425] font-mono">INTENT_CONTEXT_NOT_FOUND</code>.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-mono font-semibold text-[#943425]">Unhandled Server Errors</span>
              <p className="text-[#56585D]">Top-level exception handlers intercept uncaught exceptions and return sanitized 500 errors without leaking internal stack traces or secrets.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-mono font-semibold text-[#943425]">Deterministic Typing</span>
              <p className="text-[#56585D]">All SDK exceptions inherit from <code className="text-[#234E39] font-mono">IntentLockError</code>, allowing applications to reliably distinguish security denials from operational crashes.</p>
            </div>
          </div>
        </section>

        {/* Section: Verified vs Future */}
        <section id="verified-vs-future" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Verified Controls vs Recommended Future Protections
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            To maintain engineering integrity, we explicitly distinguish controls verified by automated test suites from recommended future enterprise enhancements:
          </p>

          <div className="rounded-xl border border-[#E2E0D8] overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FFFFFF] border-b border-[#E2E0D8] text-[#56585D] font-mono">
                <tr>
                  <th className="p-3">Capability</th>
                  <th className="p-3">Current Status</th>
                  <th className="p-3">Implementation Mechanism</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] bg-[#FFFFFF] text-[#56585D]">
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">SHA-256 Sequential Audit Chaining</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F0] text-[#234E39] border border-[#234E39]/20">VERIFIED</span></td>
                  <td className="p-3 text-[#56585D]">Cryptographic hash chain validated by <code className="font-mono text-[#234E39]">test_api_audit.py</code> and <code className="font-mono text-[#234E39]">GET /api/v1/audit/verify</code>.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">Single-Use Approval Replay Protection</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F0] text-[#234E39] border border-[#234E39]/20">VERIFIED</span></td>
                  <td className="p-3 text-[#56585D]">Atomic database transaction locking with SHA-256 action hash validation in <code className="font-mono text-[#234E39]">POST /api/v1/intercept</code>.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">Deterministic 8-Stage Policy Evaluation</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F0] text-[#234E39] border border-[#234E39]/20">VERIFIED</span></td>
                  <td className="p-3 text-[#56585D]">Pure Python policy engine (<code className="font-mono text-[#234E39]">PolicyEngine</code>) tested across 27+ automated test suites.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">Supabase PostgreSQL RLS &amp; API Hardening</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F0] text-[#234E39] border border-[#234E39]/20">VERIFIED</span></td>
                  <td className="p-3 text-[#56585D]">Migration 2 enables RLS and revokes public PostgREST grants on 12 application tables and sequences.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">Hardware Security Module (HSM) Key Storage</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-[#56585D] border border-slate-500/20">RECOMMENDED</span></td>
                  <td className="p-3 text-[#56585D]">Future enterprise roadmap item. Keys are currently stored as salted bcrypt hashes in PostgreSQL.</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-[#18191B]">Per-Tenant Database Schema Isolation</td>
                  <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-500/10 text-[#56585D] border border-slate-500/20">RECOMMENDED</span></td>
                  <td className="p-3 text-[#56585D]">Multi-tenancy currently relies on tenant_id column scoping and API dependency filtering.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Known Limitations */}
        <section id="known-limitations" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Known Limitations &amp; Unsupported Guarantees
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK is designed with uncompromising technical honesty. We do not make unsupported marketing claims:
          </p>

          <div className="space-y-3">
            <Callout type="warning" title="Non-Goal: Natural-Language Prompt Injection Cleansing">
              <p className="text-xs leading-relaxed">
                SICTACK does <strong>not</strong> claim to detect or clean prompt injections in user prompts or LLM output tokens. Prompt injection defense is an unresolved natural-language problem. Instead, SICTACK guarantees that even if an agent is 100% jailbroken or subverted, <strong>it cannot execute unauthorized tools, breach sensitivity ceilings, or exfiltrate data to disallowed recipients</strong> at the execution boundary.
              </p>
            </Callout>

            <Callout type="warning" title="Tenant Isolation Scope Notice">
              <p className="text-xs leading-relaxed">
                Multi-tenant isolation is enforced at the API layer via <code className="font-mono text-[#234E39]">X-Organization-ID</code> headers and application query filters. While PostgreSQL RLS is enabled on tables via Migration 2, backend services connecting with the database owner or <code className="font-mono text-[#234E39]">service_role</code> bypass RLS. Universal database-level isolation across direct unauthenticated connections is not guaranteed.
              </p>
            </Callout>

            <Callout type="warning" title="Model Context Protocol (MCP) Boundary Notice">
              <p className="text-xs leading-relaxed">
                The <code className="font-mono text-[#234E39]">MCPSecurityProxy</code> intercepts JSON-RPC 2.0 <code className="font-mono text-[#234E39]">tools/call</code> and <code className="font-mono text-[#234E39]">tools/list</code> messages. It does not inspect raw TCP sockets, lower-level transport stream vulnerabilities, or non-standard custom protocol extensions outside the MCP specification.
              </p>
            </Callout>

            <Callout type="warning" title="Commercial Release Blockers Register (Pre-Production Disclosures)">
              <div className="space-y-2 text-xs leading-relaxed text-[#56585D]">
                <p>
                  SICTACK maintains an explicit Commercial Blockers Register. The following security items are tracked and must not be misrepresented as fully production-hardened:
                </p>
                <ul className="list-disc pl-4 space-y-1 font-mono text-[11px]">
                  <li><strong>BLK-001 (PostgreSQL RLS):</strong> Local suites evaluate against SQLite. PostgreSQL Row-Level Security and multi-tenant connection pooling require production database staging.</li>
                  <li><strong>BLK-002 (Transport-Level DNS Rebinding):</strong> Pre-flight DNS checks block private/metadata IPs, but socket-level pinning at the TCP transport layer is not enforced on Windows.</li>
                  <li><strong>BLK-003 (Linux Kernel Isolation):</strong> <code className="text-[#234E39]">LINUX_SANDBOX</code> fails closed on Windows hosts (<code className="text-[#943425]">RuntimeIsolationUnavailableError</code>); kernel namespace testing is pending a native Linux runner.</li>
                  <li><strong>BLK-004 (PyPI Signing &amp; Attestation):</strong> Wheels are built and tested locally; public PyPI publication and cryptographic key attestation are deferred.</li>
                  <li><strong>BLK-005 (Distributed State Synchronization):</strong> Threat sessions and sliding windows are maintained in memory; multi-worker Redis cluster coordination is pending.</li>
                </ul>
                <p className="mt-2 text-[11px] text-[#787A80]">
                  *Note: Phase 4D full regression verification is formally recorded as IMPLEMENTED / VERIFICATION PENDING.
                </p>
              </div>
            </Callout>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Security Playground Guide", href: "/developers/playground" }}
          next={{ title: "Production Deployment", href: "/developers/deployment" }}
        />
      </div>
    </DeveloperLayout>
  );
}
