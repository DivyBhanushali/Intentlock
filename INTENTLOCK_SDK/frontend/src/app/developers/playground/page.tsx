// INTENTLOCK 2.0 – Developer Security Playground Guide Page
"use client";

import { useState } from "react";
import Link from "next/link";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

const SIMULATION_SCENARIOS = [
  {
    id: "read-email",
    title: "Scenario 1: Permitted Read Action",
    tool: "email:read",
    args: { email_id: "msg-101", folder: "inbox" },
    sensitivity: 2,
    verdict: "ALLOW",
    verdictColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    riskScore: 0.15,
    riskLevel: "LOW",
    explanation: "Matches allowed permission 'email:read' on resource 'inbox/*'. Risk score is below threshold.",
  },
  {
    id: "drop-db",
    title: "Scenario 2: Zero-Trust Policy Block",
    tool: "database:drop",
    args: { table: "customers", cascade: true },
    sensitivity: 10,
    verdict: "DENY",
    verdictColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    riskScore: 0.95,
    riskLevel: "CRITICAL",
    explanation: "Explicitly forbidden by rule 'database:drop'. Halts execution before touching any database.",
  },
  {
    id: "send-email",
    title: "Scenario 3: Human-in-the-Loop Sign-Off",
    tool: "email:send",
    args: { to: "external-partner@acme.com", subject: "Contract Details" },
    sensitivity: 6,
    verdict: "REQUIRE_APPROVAL",
    verdictColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    riskScore: 0.65,
    riskLevel: "HIGH",
    explanation: "External communication requires operator authorization. Issues a single-use approval ticket.",
  },
];

export default function PlaygroundGuidePage() {
  const [activeScenario, setActiveScenario] = useState(SIMULATION_SCENARIOS[0]);

  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Security & Operations", href: "/developers/playground" },
    { label: "Playground Guide", href: "/developers/playground" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Playground Overview", level: 2 },
    { id: "interactive-demo", title: "Illustrative Policy Evaluator", level: 2 },
    { id: "safety-guarantees", title: "Simulator Safety Guarantees", level: 2 },
    { id: "verdicts", title: "Interpreting Security Verdicts", level: 2 },
    { id: "simulation-vs-execution", title: "Simulation vs Real Execution", level: 2 },
    { id: "live-playground", title: "Accessing the Live SOC Playground", level: 2 },
  ];

  const curlSimulationExample = `# Simulate policy evaluation against the backend API (Safe dry-run)
curl -X POST "https://intentlock-backend-ze2i.onrender.com/api/v1/policies/simulate" \\
  -H "Authorization: Bearer <your-jwt-token>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tool_name": "database:drop",
    "arguments": {"table": "customers"},
    "sensitivity": 10
  }'`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Interactive Tools
            </span>
            <span className="text-xs text-slate-500">Security Sandbox</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Security Playground Guide
            </h1>
            <Link
              href="/test"
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <span>Open Live SOC Playground</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Test policy rules, simulate tool call interceptions, inspect canonical action hashes, and understand deterministic security verdicts without risking production side effects.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Playground Overview
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The INTENTLOCK Security Playground enables security engineers and agent developers to test how the 8-stage evaluation pipeline responds to specific tool calls, arguments, and sensitivity levels. Two playground experiences exist:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-4">
              <h3 className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider mb-1">Documentation Demo (Below)</h3>
              <p className="text-xs text-slate-400">
                A client-side illustrative demonstration showing canonical scenarios. Zero backend requests, zero authentication required, zero external side effects.
              </p>
            </div>
            <div className="rounded-xl border border-emerald-500/30 bg-[#0e1713] p-4">
              <h3 className="text-xs font-bold font-mono text-emerald-300 uppercase tracking-wider mb-1">Live SOC Playground (/test)</h3>
              <p className="text-xs text-slate-400">
                The authoritative interactive console connected to your live tenant backend. Executes real policy evaluations against registered agents and active database rules.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Interactive Demo */}
        <section id="interactive-demo" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Illustrative Policy Evaluator (Demo Sandbox)
          </h2>
          <Callout type="info" title="Illustrative Client-Side Demonstration">
            <p className="text-xs leading-relaxed">
              The scenarios below run entirely in your browser using predefined representative models. These illustrative results model INTENTLOCK&apos;s 8-stage pipeline without sending network packets or contacting the live backend.
            </p>
          </Callout>

          {/* Scenario Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SIMULATION_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  activeScenario.id === scenario.id
                    ? "border-emerald-500/50 bg-[#0e1713]"
                    : "border-slate-800 bg-[#0a0e17] hover:border-slate-700"
                }`}
              >
                <div className="text-xs font-bold text-white">{scenario.title}</div>
                <div className="text-[11px] font-mono text-slate-400 mt-1">{scenario.tool}</div>
              </button>
            ))}
          </div>

          {/* Scenario Details Card */}
          <div className="rounded-xl border border-slate-800 bg-[#080c14] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">TARGET TOOL</span>
                <span className="font-mono text-sm font-bold text-white">{activeScenario.tool}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">ILLUSTRATIVE VERDICT</span>
                <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-mono font-bold ${activeScenario.verdictColor}`}>
                  {activeScenario.verdict}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">RISK LEVEL</span>
                <span className="font-mono text-xs font-bold text-slate-200">{activeScenario.riskLevel} ({activeScenario.riskScore})</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-1">Payload Arguments:</span>
              <pre className="rounded-lg border border-slate-800/80 bg-[#05070c] p-3 text-xs font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(activeScenario.args, null, 2)}
              </pre>
            </div>

            <div className="rounded-lg border border-slate-800 bg-[#0a0e18] p-3">
              <span className="text-xs font-semibold text-slate-200 block mb-0.5">Policy Rationale:</span>
              <p className="text-xs text-slate-400">{activeScenario.explanation}</p>
            </div>
          </div>
        </section>

        {/* Section: Safety Guarantees */}
        <section id="safety-guarantees" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Simulator Safety Guarantees
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            INTENTLOCK strictly isolates testing and dry-run evaluations from production execution environments:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-semibold text-white">No External Tool Invocation</span>
              <p className="text-slate-400">Underlying Python callables, external APIs, and shell commands are never dispatched during evaluation or simulation.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-semibold text-white">No Production Data Mutations</span>
              <p className="text-slate-400">Dry-run simulations create no persistent database rows and do not alter application tables or customer states.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-semibold text-white">Zero Secret Leakage</span>
              <p className="text-slate-400">Simulators never log or return raw API keys, JWT bearer tokens, or sensitive argument payloads in telemetry.</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#0a0e17] p-3.5 space-y-1">
              <span className="font-semibold text-white">Cryptographic Action Binding</span>
              <p className="text-slate-400">Simulations output the exact canonical SHA-256 action hash that production interceptors will expect during live execution.</p>
            </div>
          </div>
        </section>

        {/* Section: Verdicts */}
        <section id="verdicts" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Interpreting Security Verdicts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-[#07130e] p-4">
              <span className="text-xs font-mono font-bold text-emerald-400">ALLOW</span>
              <p className="mt-2 text-xs text-slate-300">
                Action is permitted. The tool call satisfies policy rules, permissions, and risk ceilings. Tool execution continues immediately.
              </p>
            </div>

            <div className="rounded-xl border border-amber-500/30 bg-[#161007] p-4">
              <span className="text-xs font-mono font-bold text-amber-400">REQUIRE_APPROVAL</span>
              <p className="mt-2 text-xs text-slate-300">
                Action is sensitive. Execution is suspended until authorized by an operator. A single-use approval ticket bound to the action hash is generated.
              </p>
            </div>

            <div className="rounded-xl border border-rose-500/30 bg-[#18080c] p-4">
              <span className="text-xs font-mono font-bold text-rose-400">DENY</span>
              <p className="mt-2 text-xs text-slate-300">
                Action is forbidden. Violates explicit denial rules or lacks required capability. Tool execution halts instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Simulation vs Execution */}
        <section id="simulation-vs-execution" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Simulation vs Real Execution
          </h2>
          <Callout type="warning" title="Simulations Never Run Side Effects">
            <p className="text-xs leading-relaxed">
              When using the policy simulation endpoint (<code className="font-mono text-emerald-300">POST /api/v1/policies/simulate</code>) or Playground, the security engine evaluates permissions, resource matching, and risk algorithms in a <strong>dry-run sandbox</strong>. The underlying tool is never executed, and no external emails, database mutations, or API calls are enacted.
            </p>
          </Callout>
          <CodeBlock code={curlSimulationExample} language="bash" filename="Simulate API Request" />
        </section>

        {/* Section: Live Playground */}
        <section id="live-playground" className="space-y-4 pt-4 border-t border-slate-800/80">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Accessing the Live SOC Playground
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The full interactive Security Playground is accessible within the INTENTLOCK dashboard at <Link href="/test" className="text-emerald-400 underline font-mono">/test</Link>. It connects to your active tenant backend to test live custom policies against registered agents.
          </p>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Complete Code Examples", href: "/developers/examples" }}
          next={{ title: "Security Architecture", href: "/developers/security" }}
        />
      </div>
    </DeveloperLayout>
  );
}
