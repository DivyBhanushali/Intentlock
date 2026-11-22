// SICTACK 1.0 – Changelog & Releases Page
"use client";

import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function ChangelogPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/changelog" },
    { label: "Changelog & Releases", href: "/developers/changelog" },
  ];

  const toc: TocItem[] = [
    { id: "versioning-policy", title: "Versioning Policy & Architecture Cadence", level: 2 },
    { id: "developer-portal", title: "Developer Portal (Current Release)", level: 2 },
    { id: "platform-v2", title: "Platform Architecture v2.0 (November 2026)", level: 2 },
    { id: "sdk-v010", title: "Python SDK v1.0.0 (November 2026)", level: 2 },
    { id: "backwards-compatibility", title: "Backwards Compatibility Guarantees", level: 2 },
  ];

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Release Notes
            </span>
            <span className="text-xs text-[#787A80]">Semantic Versioning</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Changelog &amp; Release History
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Transparent release history tracking the SICTACK Python SDK (<code className="font-mono text-[#234E39]">v1.0.0</code>), the SICTACK Platform Architecture (<code className="font-mono text-[#234E39]">v2.0</code>), and the comprehensive Developer Portal overhaul.
          </p>
        </div>

        {/* Section: Policy */}
        <section id="versioning-policy" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Versioning Policy &amp; Architecture Cadence
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK strictly distinguishes between the <strong>Python SDK library version</strong> and the <strong>Enterprise Platform release</strong>:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-1.5">
              <span className="font-mono font-bold text-[#234E39]">Python SDK (sictack)</span>
              <p className="text-[#56585D]">
                Follows Semantic Versioning (<code className="font-mono text-[#56585D]">MAJOR.MINOR.PATCH</code>). The active library release is <code className="font-mono text-[#234E39]">1.0.0</code> as configured in <code className="font-mono text-[#56585D]">sdk/python/pyproject.toml</code>.
              </p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-1.5">
              <span className="font-mono font-bold text-cyan-400">Platform &amp; Dashboard (SICTACK 1.0)</span>
              <p className="text-[#56585D]">
                Represents the cloud infrastructure deployment, database migrations, REST API v1, and multi-tenant security architecture deployed on Render, Vercel, and Supabase.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Developer Portal */}
        <section id="developer-portal" className="scroll-mt-20 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
              Developer Portal Implementation
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EDF5F0] text-[#234E39] border border-[#234E39]/20">
              Active Release
            </span>
          </div>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4 text-xs">
            <div className="border-b border-[#E2E0D8] pb-3">
              <h3 className="text-sm font-semibold text-[#18191B]">Production-Ready Developer Portal &amp; Documentation Overhaul</h3>
              <p className="text-[#56585D] mt-1">
                Completed production-quality developer documentation system under <code className="font-mono text-[#234E39]">/developers</code> integrated seamlessly with the existing Security Operations Dashboard.
              </p>
            </div>

            <div className="space-y-3 text-[#56585D]">
              <div>
                <span className="font-semibold text-[#234E39] block mb-1">Key Deliverables:</span>
                <ul className="list-disc list-inside space-y-1 text-[#56585D]">
                  <li><strong>Developer Portal Foundation:</strong> Reusable design system, searchable sidebar, accessible code copy blocks, tabbed code snippets, and active table-of-contents navigation.</li>
                  <li><strong>Landing Page &amp; Navigation Integration:</strong> Polished landing page with quickstart cards, direct links from global navbar, and zero disruption to the SOC dashboard.</li>
                  <li><strong>Getting Started &amp; Core Guides:</strong> 5-Minute Quickstart, Installation Guide, Core Concepts, and 8-Stage Pipeline Architecture.</li>
                  <li><strong>Python SDK Reference:</strong> In-process <code className="font-mono text-[#56585D]">SecureAgent</code> vs remote <code className="font-mono text-[#56585D]">SictackClient</code>, tool registration, decision handling, and fail-closed exception reference.</li>
                  <li><strong>REST API Reference:</strong> Complete 48-operation API reference generated deterministically from the local FastAPI application, with verified RBAC matrix and JWT/API key authentication guides.</li>
                  <li><strong>Framework Integrations &amp; Examples:</strong> Complete guides and runnable code for LangChain (<code className="font-mono text-[#56585D]">SecureTool</code>), LangGraph (<code className="font-mono text-[#56585D]">SecureGraphNode</code>), and Model Context Protocol (<code className="font-mono text-[#56585D]">MCPSecurityProxy</code>).</li>
                  <li><strong>Security, Deployment &amp; Troubleshooting:</strong> Cryptographic SHA-256 audit chain specification, production deployment topology, and actionable diagnostics for Windows OneDrive locks and error codes.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Platform v2.0 */}
        <section id="platform-v2" className="scroll-mt-20 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
              Platform Architecture v2.0
            </h2>
            <span className="text-xs font-mono text-[#787A80]">November 2026</span>
          </div>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4 text-xs">
            <div className="border-b border-[#E2E0D8] pb-3">
              <h3 className="text-sm font-semibold text-[#18191B]">Enterprise Multi-Tenancy &amp; Execution Boundary Hardening</h3>
              <p className="text-[#56585D] mt-1">
                Introduced comprehensive enterprise multi-tenancy, pre-authorized intent governance, and cryptographic audit verifiability across the cloud stack.
              </p>
            </div>

            <ul className="list-disc list-inside space-y-1.5 text-[#56585D]">
              <li><strong>Intent-Scoped Authorization:</strong> Added <code className="font-mono text-[#234E39]">IntentContext</code> model granting time-bound, objective-specific tool execution boundaries.</li>
              <li><strong>Cryptographic SHA-256 Audit Chaining:</strong> Implemented sequential hash chaining on all audit trail entries with monotonic sequence numbers, previous-hash linkage, and the <code className="font-mono text-[#56585D]">GET /api/v1/audit/verify</code> endpoint.</li>
              <li><strong>Database Migration 1:</strong> Schema backfill adding <code className="font-mono text-[#56585D]">org_id</code> multi-tenancy columns, audit hash fields, and default organization seeding.</li>
              <li><strong>Database Migration 2:</strong> Supabase PostgreSQL Row Level Security (RLS) enforcement across all 12 core tables; revoked public grants from <code className="font-mono text-[#56585D]">anon</code>, <code className="font-mono text-[#56585D]">authenticated</code>, and <code className="font-mono text-[#56585D]">PUBLIC</code>; revoked table-associated sequence privileges via <code className="font-mono text-[#56585D]">pg_depend</code> catalog matching while strictly preserving <code className="font-mono text-[#56585D]">service_role</code> access.</li>
              <li><strong>Atomic Approval Nonces:</strong> Added row-locked <code className="font-mono text-[#56585D]">consumed</code> flag verification and canonical SHA-256 action hash binding to prevent replay and parameter tampering attacks.</li>
            </ul>
          </div>
        </section>

        {/* Section: SDK v1.0.0 */}
        <section id="sdk-v010" className="scroll-mt-20 space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold tracking-tight text-[#18191B]">
              Python SDK v1.0.0
            </h2>
            <span className="text-xs font-mono text-[#787A80]">November 2026</span>
          </div>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4 text-xs">
            <div className="border-b border-[#E2E0D8] pb-3">
              <h3 className="text-sm font-semibold text-[#18191B]">Initial Release of sictack</h3>
              <p className="text-[#56585D] mt-1">
                Pure Python SDK library implementing in-process execution guardrails, the deterministic policy engine, and remote gateway clients.
              </p>
            </div>

            <ul className="list-disc list-inside space-y-1.5 text-[#56585D]">
              <li><strong>In-Process SecureAgent:</strong> Direct Python tool encapsulation inside private closures via <code className="font-mono text-[#234E39]">ToolRegistry</code>.</li>
              <li><strong>Remote SictackClient:</strong> HTTP client communicating with the centralized FastAPI Interception Gateway.</li>
              <li><strong>Deterministic Policy Engine:</strong> Pure Python rule evaluator with permission allow/deny lists, sensitivity ceilings, resource glob matching, and recipient boundaries.</li>
              <li><strong>Ecosystem Adapters:</strong> Official support for LangChain (<code className="font-mono text-[#56585D]">SecureTool</code>), LangGraph (<code className="font-mono text-[#56585D]">SecureGraphNode</code>), and Model Context Protocol (<code className="font-mono text-[#56585D]">MCPSecurityProxy</code>).</li>
              <li><strong>Fail-Closed Exception Hierarchy:</strong> Structured exceptions including <code className="font-mono text-[#56585D]">PermissionDeniedError</code>, <code className="font-mono text-[#56585D]">ApprovalRequiredError</code>, <code className="font-mono text-[#56585D]">ApprovalExpiredError</code>, <code className="font-mono text-[#56585D]">ApprovalReplayError</code>, and <code className="font-mono text-[#56585D]">ApprovalMismatchError</code>.</li>
            </ul>
          </div>
        </section>

        {/* Section: Compatibility */}
        <section id="backwards-compatibility" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Backwards Compatibility Guarantees
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK adheres to semantic compatibility principles:
          </p>
          <ul className="text-xs text-[#56585D] list-disc list-inside space-y-1.5">
            <li><strong>Additive Schema Migrations:</strong> Database updates only add nullable columns, default values, and indexes. Older backend versions can continue operating against updated databases without breaking.</li>
            <li><strong>Deterministic Verdict Enums:</strong> Verdict strings (<code className="font-mono text-[#234E39]">ALLOW</code>, <code className="font-mono text-[#943425]">DENY</code>, <code className="font-mono text-[#8D5B18]">REQUIRE_APPROVAL</code>) will never be renamed or mutated in v1 API routes.</li>
            <li><strong>Zero Unhandled Exceptions:</strong> The SDK guarantees that policy evaluations return structured decisions or typed exceptions inheriting from <code className="font-mono text-[#234E39]">SictackError</code> (with <code className="font-mono text-[#56585D]">IntentLockError = SictackError</code> for transparent backward compatibility).</li>
          </ul>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Troubleshooting & FAQs", href: "/developers/troubleshooting" }}
          next={{ title: "Developer Overview", href: "/developers" }}
        />
      </div>
    </DeveloperLayout>
  );
}
