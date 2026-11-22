// SICTACK CORE – Public Product Architecture Page
// Approved Concept A: Editorial Infrastructure (Stripe Press / Linear)

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowForward,
  IconContentCopy,
  IconCheck,
} from "@/components/ui/Icons";

export default function CoreProductPage() {
  const [copiedPip, setCopiedPip] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("pip install sictack");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  return (
    <div className="w-full bg-[#f8f9f8] text-[#202629] font-sans selection:bg-[#d5e3ff] selection:text-[#3c5276] overflow-x-hidden min-h-screen">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#757c7b] mb-6">
          <Link href="/" className="hover:text-[#202629] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#485f84] font-semibold">SICTACK CORE</span>
        </div>

        {/* Hero Section */}
        <section className="pb-16 border-b border-[#e4e9e8]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#edf5f0] border border-[#d4e8dc] text-[#234e39] text-xs font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#234e39]"></span>
              <span>ENGINE 01 // DETERMINISTIC EXECUTION GATEWAY</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#202629] mb-4 leading-tight">
              SICTACK CORE
            </h1>
            <p className="text-lg sm:text-xl text-[#485f84] font-medium mb-6">
              Deterministic runtime authorization, parameter-level constraints, and cryptographic audit trails for autonomous AI agents.
            </p>
            <p className="text-sm sm:text-base text-[#56585d] leading-relaxed mb-8 max-w-2xl">
              Unlike LLM-based prompt firewalls that can be bypassed via indirect prompt injections or token manipulations, SICTACK CORE operates at the in-process Python runtime boundary. Every tool invocation undergoes mathematical policy verification and cryptographic hashing before a single network socket or database query is dispatched.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/developers/core"
                className="inline-flex items-center gap-2 bg-[#485f84] text-[#ffffff] hover:bg-[#3c5377] px-4 py-2.5 rounded font-medium text-xs shadow-sm transition-colors"
              >
                <span>Read CORE Developer Guide</span>
                <IconArrowForward className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/soc/core"
                className="inline-flex items-center gap-2 bg-[#ffffff] border border-[#e4e9e8] hover:bg-[#f2f4f3] text-[#202629] px-4 py-2.5 rounded font-medium text-xs transition-colors"
              >
                <span>Open CORE SOC Console</span>
              </Link>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-[#ffffff] rounded border border-[#e4e9e8] font-mono text-xs text-[#202629] hover:border-[#adb3b2] transition-colors"
              >
                <span className="text-[#757c7b]">$</span>
                <span>pip install sictack</span>
                {copiedPip ? (
                  <IconCheck className="w-3.5 h-3.5 text-[#3d6851]" />
                ) : (
                  <IconContentCopy className="w-3.5 h-3.5 text-[#757c7b]" />
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Architectural Pillars */}
        <section className="py-16 border-b border-[#e4e9e8]">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Capabilities // Authoritative Defense Layers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629]">
              Hardened Boundary Protections
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#edf5f0] text-[#234e39] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  01
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Parameter-Level Constraints
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Enforce strict numeric boundaries (<code className="font-mono text-[11px] bg-[#f2f4f3] px-1 py-0.5 rounded">max_numeric</code>, <code className="font-mono text-[11px] bg-[#f2f4f3] px-1 py-0.5 rounded">min_numeric</code>), required keys, allowed enum values, and disallowed regex patterns on every tool argument.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#3d6851] bg-[#edf5f0] px-2 py-1 rounded inline-block w-fit">
                Evaluated in &lt; 0.2ms
              </span>
            </div>

            {/* Pillar 2 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#e8eef8] text-[#485f84] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  02
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Policy Version Binding
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Every authorization decision is cryptographically tied to the active policy version. If an organization updates its policy, pending approvals generated under older policies immediately fail closed.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#485f84] bg-[#e8eef8] px-2 py-1 rounded inline-block w-fit">
                Prevents Policy Race Conditions
              </span>
            </div>

            {/* Pillar 3 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#fef7ec] text-[#8d5b18] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  03
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Decision TTL &amp; Expiration
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Decisions and approvals carry an immutable expiration timestamp (<code className="font-mono text-[11px] bg-[#f2f4f3] px-1 py-0.5 rounded">expires_at</code>). Stale approval tokens cannot be replayed after the time window closes.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#8d5b18] bg-[#fef7ec] px-2 py-1 rounded inline-block w-fit">
                Default 300s Expiry Window
              </span>
            </div>

            {/* Pillar 4 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#fbf1f0] text-[#943425] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  04
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Canonical Argument Hashing
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Tool parameters are canonicalized (sorted keys, compact JSON, standardized precision) and hashed with SHA-256. Prevents parameter tampering between approval grant and tool execution.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#943425] bg-[#fbf1f0] px-2 py-1 rounded inline-block w-fit">
                RFC-8785 Canonical JSON
              </span>
            </div>

            {/* Pillar 5 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#edf5f0] text-[#234e39] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  05
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Cryptographic Audit Chain
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Every decision, approval, and execution event is committed to a sequential append-only ledger where each entry hashes the predecessor. Corruptions or deletions are instantly detected.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#234e39] bg-[#edf5f0] px-2 py-1 rounded inline-block w-fit">
                Zero-Trust Non-Repudiation
              </span>
            </div>

            {/* Pillar 6 */}
            <div className="p-6 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded bg-[#f2f4f3] text-[#56585d] flex items-center justify-center font-mono font-bold text-xs mb-4">
                  06
                </div>
                <h3 className="text-base font-bold text-[#202629] mb-2">
                  Fail-Closed Default Deny
                </h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  If any policy check throws an unhandled exception, syntax error, or parsing failure, execution halts immediately with a <code className="font-mono text-[11px] bg-[#f2f4f3] px-1 py-0.5 rounded">PolicyViolation</code> denial. Zero bypasses.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#56585d] bg-[#ebeeed] px-2 py-1 rounded inline-block w-fit">
                Strict Safe Failure
              </span>
            </div>
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-16 border-b border-[#e4e9e8]">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Implementation // Python SDK Syntax
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              Declaring Parameter Constraints in Code
            </h2>
            <p className="text-sm text-[#56585d] max-w-2xl leading-relaxed">
              Define parameter-level boundaries directly within policy configurations to protect downstream payment gateways, cloud APIs, and database mutations.
            </p>
          </div>

          <div className="bg-[#161a1d] text-[#dde4e3] p-5 sm:p-7 rounded-xl border border-[#2d3748] font-mono text-xs overflow-x-auto shadow-sm">
            <pre className="leading-relaxed">
              <span className="text-[#757c7b]"># Define policy with parameter constraints and version binding</span>{"\n"}
              <span className="text-[#bbd3fd]">from</span> sictack <span className="text-[#bbd3fd]">import</span> Policy, SecureAgent{"\n\n"}
              policy = Policy({"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;name&quot;</span>: <span className="text-[#beedd1]">&quot;fintech-wire-policy&quot;</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;version&quot;</span>: <span className="text-[#fd826d]">2</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;allowed_permissions&quot;</span>: [<span className="text-[#beedd1]">&quot;bank:transfer&quot;</span>],{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;parameter_constraints&quot;</span>: {"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;amount_usd&quot;</span>: {"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;min_numeric&quot;</span>: <span className="text-[#fd826d]">1.0</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;max_numeric&quot;</span>: <span className="text-[#fd826d]">10000.0</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"},{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;currency&quot;</span>: {"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;allowed_values&quot;</span>: [<span className="text-[#beedd1]">&quot;USD&quot;</span>, <span className="text-[#beedd1]">&quot;EUR&quot;</span>, <span className="text-[#beedd1]">&quot;GBP&quot;</span>]{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"},{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;recipient_iban&quot;</span>: {"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;forbidden_patterns&quot;</span>: [<span className="text-[#beedd1]">&quot;^RU.*&quot;</span>, <span className="text-[#beedd1]">&quot;^IR.*&quot;</span>]{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"}"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;{"}"}{"\n"}
              {"}"}){"\n\n"}
              <span className="text-[#757c7b]"># Agent automatically blocks calls violating any constraint</span>{"\n"}
              agent = SecureAgent(agent_id=<span className="text-[#beedd1]">&quot;ops_bot&quot;</span>, policy=policy){"\n"}
              decision = agent.execute(<span className="text-[#beedd1]">&quot;transfer&quot;</span>, {"{"}<span className="text-[#beedd1]">&quot;amount_usd&quot;</span>: <span className="text-[#fd826d]">50000.0</span>{"}"}){"\n"}
              <span className="text-[#757c7b]"># &gt;&gt;&gt; Decision: DENY (Exceeds max_numeric threshold 10000.0)</span>
            </pre>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="pt-16 pb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-[#202629]">Ready to deploy deterministic defenses?</h3>
            <p className="text-xs text-[#56585d] mt-1">Integrate the Python SDK in under 5 minutes or explore the live SOC.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/developers/quickstart"
              className="px-4 py-2 bg-[#485f84] hover:bg-[#3c5377] text-white rounded font-medium text-xs shadow-sm transition-colors"
            >
              Get Started Quickstart
            </Link>
            <Link
              href="/soc/core"
              className="px-4 py-2 bg-white border border-[#e4e9e8] hover:bg-[#f2f4f3] text-[#202629] rounded font-medium text-xs transition-colors"
            >
              SOC Live Feed
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
