// SICTACK 1.0 – Developer Security Playground Guide Page
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
    engine: "CORE Deterministic Gateway",
    tool: "email:read",
    args: { email_id: "msg-101", folder: "inbox" },
    taskObjective: "Process inbox support requests",
    sensitivity: 2,
    verdict: "ALLOW",
    verdictColor: "text-[#234E39] bg-[#EDF5F0] border-[#234E39]/20",
    riskScore: 0.15,
    riskLevel: "LOW",
    explanation: "Matches allowed permission 'email:read' on resource 'inbox/*'. Deterministic in-process gate authorized execution in 0.8ms.",
  },
  {
    id: "drop-db",
    title: "Scenario 2: Zero-Trust Policy Block",
    engine: "CORE Deterministic Gateway",
    tool: "database:drop",
    args: { table: "customers", cascade: true },
    taskObjective: "Process inbox support requests",
    sensitivity: 10,
    verdict: "DENY",
    verdictColor: "text-[#943425] bg-[#FDF1EF] border-[#943425]/20",
    riskScore: 0.95,
    riskLevel: "CRITICAL",
    explanation: "Explicitly forbidden by rule 'database:drop'. Halts execution before touching any database or socket.",
  },
  {
    id: "send-email",
    title: "Scenario 3: Human-in-the-Loop Sign-Off",
    engine: "CORE Deterministic Gateway",
    tool: "email:send",
    args: { to: "external-partner@acme.com", subject: "Contract Details" },
    taskObjective: "Process inbox support requests",
    sensitivity: 6,
    verdict: "REQUIRE_APPROVAL",
    verdictColor: "text-[#8D5B18] bg-[#FEF6EC] border-[#8D5B18]/20",
    riskScore: 0.65,
    riskLevel: "HIGH",
    explanation: "External communication requires operator authorization. Issues a single-use SHA-256 bound ticket.",
  },
  {
    id: "objective-deviation",
    title: "Scenario 4: Semantic Objective Deviation",
    engine: "SENTINEL Semantic Guardian",
    tool: "system:dump_passwords",
    args: { target_file: "/etc/shadow" },
    taskObjective: "Generate quarterly revenue report",
    sensitivity: 9,
    verdict: "DENY",
    verdictColor: "text-[#943425] bg-[#FDF1EF] border-[#943425]/20",
    riskScore: 0.98,
    riskLevel: "CRITICAL",
    explanation: "SNT-R010: Lexical drift and credential harvesting detected. Tool execution deviates from declared accounting objective.",
  },
  {
    id: "contained-session",
    title: "Scenario 5: Protected-Session Containment",
    engine: "SENTINEL Containment Boundary",
    tool: "reports:read",
    args: { report_id: "q3-revenue" },
    taskObjective: "Generate quarterly revenue report",
    sensitivity: 3,
    verdict: "CONTAINED",
    verdictColor: "text-[#742a2a] bg-[#fbf1f0] border-[#742a2a]/20",
    riskScore: 0.88,
    riskLevel: "CRITICAL",
    explanation: "Task session is under active QUARANTINE containment. Invocations fail-closed at gateway boundary with zero host leakage.",
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
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Interactive Tools
            </span>
            <span className="text-xs text-[#787A80]">Security Sandbox</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
              Security Playground Guide
            </h1>
            <Link
              href="/test"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#234E39]/20 bg-[#EDF5F0] px-3 py-1.5 text-xs font-semibold text-[#234E39] hover:bg-emerald-500/20 transition-colors"
            >
              <span>Open Live SOC Playground</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          </div>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Test policy rules, simulate tool call interceptions, inspect canonical action hashes, and understand deterministic security verdicts without risking production side effects.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Playground Overview
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The SICTACK Security Playground enables security engineers and agent developers to test how the 8-stage evaluation pipeline responds to specific tool calls, arguments, and sensitivity levels. Two playground experiences exist:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4">
              <h3 className="text-xs font-bold font-mono text-[#234E39] uppercase tracking-wider mb-1">Documentation Demo (Below)</h3>
              <p className="text-xs text-[#56585D]">
                A client-side illustrative demonstration showing canonical scenarios. Zero backend requests, zero authentication required, zero external side effects.
              </p>
            </div>
            <div className="rounded-xl border border-[#234E39]/20 bg-[#FFFFFF] p-4">
              <h3 className="text-xs font-bold font-mono text-[#234E39] uppercase tracking-wider mb-1">Live SOC Playground (/test)</h3>
              <p className="text-xs text-[#56585D]">
                The authoritative interactive console connected to your live tenant backend. Executes real policy evaluations against registered agents and active database rules.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Interactive Demo */}
        <section id="interactive-demo" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Illustrative Policy Evaluator (Demo Sandbox)
          </h2>
          <Callout type="info" title="Illustrative Client-Side Demonstration">
            <p className="text-xs leading-relaxed">
              The scenarios below run entirely in your browser using predefined representative models. These illustrative results model SICTACK&apos;s 8-stage pipeline without sending network packets or contacting the live backend.
            </p>
          </Callout>

          {/* Scenario Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {SIMULATION_SCENARIOS.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => setActiveScenario(scenario)}
                className={`rounded-xl border p-3 text-left transition-all ${
                  activeScenario.id === scenario.id
                    ? "border-[#234E39] bg-white ring-2 ring-[#234E39]/10 shadow-sm"
                    : "border-[#E2E0D8] bg-[#FFFFFF] hover:border-[#234E39]/40"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#8D5B18]">{scenario.engine}</span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    scenario.verdict === "ALLOW" ? "bg-[#edf5f0] text-[#234e39]" : scenario.verdict === "REQUIRE_APPROVAL" ? "bg-[#fef7ec] text-[#8d5b18]" : "bg-[#fbf1f0] text-[#943425]"
                  }`}>
                    {scenario.verdict}
                  </span>
                </div>
                <div className="text-xs font-bold text-[#18191B]">{scenario.title}</div>
                <div className="text-[11px] font-mono text-[#56585D] mt-0.5">{scenario.tool}</div>
              </button>
            ))}
          </div>

          {/* Scenario Details Card */}
          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E0D8] pb-3">
              <div>
                <span className="text-[10px] font-mono text-[#787A80] uppercase tracking-wider block">TARGET TOOL</span>
                <span className="font-mono text-sm font-bold text-[#18191B]">{activeScenario.tool}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#787A80] uppercase tracking-wider block">RESPONSIBLE ENGINE</span>
                <span className="font-mono text-xs font-bold text-[#1D3557]">{activeScenario.engine}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#787A80] uppercase tracking-wider block">SECURITY VERDICT</span>
                <span className={`inline-block px-2.5 py-0.5 rounded border text-xs font-mono font-bold ${activeScenario.verdictColor}`}>
                  {activeScenario.verdict}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#787A80] uppercase tracking-wider block">RISK LEVEL</span>
                <span className="font-mono text-xs font-bold text-[#18191B]">{activeScenario.riskLevel} ({activeScenario.riskScore})</span>
              </div>
            </div>

            {activeScenario.taskObjective && (
              <div className="p-2.5 rounded bg-[#f8f9f8] border border-[#e4e9e8] text-xs">
                <span className="text-[10px] font-mono text-[#757c7b] uppercase font-bold block mb-0.5">
                  Declared Task Objective Context (SENTINEL Envelope)
                </span>
                <span className="font-medium text-[#202629]">&quot;{activeScenario.taskObjective}&quot;</span>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-[#56585D] block mb-1">Payload Arguments:</span>
              <pre className="rounded-lg border border-[#E2E0D8] bg-[#141518] text-[#EDEDEB] p-3 text-xs font-mono text-[#234E39] overflow-x-auto">
                {JSON.stringify(activeScenario.args, null, 2)}
              </pre>
            </div>

            <div className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] p-3">
              <span className="text-xs font-semibold text-[#18191B] block mb-0.5">Policy Rationale:</span>
              <p className="text-xs text-[#56585D]">{activeScenario.explanation}</p>
            </div>
          </div>
        </section>

        {/* Section: Safety Guarantees */}
        <section id="safety-guarantees" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Simulator Safety Guarantees
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK strictly isolates testing and dry-run evaluations from production execution environments:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-semibold text-[#18191B]">No External Tool Invocation</span>
              <p className="text-[#56585D]">Underlying Python callables, external APIs, and shell commands are never dispatched during evaluation or simulation.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-semibold text-[#18191B]">No Production Data Mutations</span>
              <p className="text-[#56585D]">Dry-run simulations create no persistent database rows and do not alter application tables or customer states.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-semibold text-[#18191B]">Zero Secret Leakage</span>
              <p className="text-[#56585D]">Simulators never log or return raw API keys, JWT bearer tokens, or sensitive argument payloads in telemetry.</p>
            </div>
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-3.5 space-y-1">
              <span className="font-semibold text-[#18191B]">Cryptographic Action Binding</span>
              <p className="text-[#56585D]">Simulations output the exact canonical SHA-256 action hash that production interceptors will expect during live execution.</p>
            </div>
          </div>
        </section>

        {/* Section: Verdicts */}
        <section id="verdicts" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Interpreting Security Verdicts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-xl border border-[#234E39]/20 bg-[#EDF5F0] p-4">
              <span className="text-xs font-mono font-bold text-[#234E39]">ALLOW</span>
              <p className="mt-2 text-xs text-[#56585D]">
                Action is permitted. The tool call satisfies policy rules, permissions, and risk ceilings. Tool execution continues immediately.
              </p>
            </div>

            <div className="rounded-xl border border-[#8D5B18]/20 bg-[#FFFFFF] p-4">
              <span className="text-xs font-mono font-bold text-[#8D5B18]">REQUIRE_APPROVAL</span>
              <p className="mt-2 text-xs text-[#56585D]">
                Action is sensitive. Execution is suspended until authorized by an operator. A single-use approval ticket bound to the action hash is generated.
              </p>
            </div>

            <div className="rounded-xl border border-[#943425]/20 bg-[#FFFFFF] p-4">
              <span className="text-xs font-mono font-bold text-[#943425]">DENY</span>
              <p className="mt-2 text-xs text-[#56585D]">
                Action is forbidden. Violates explicit denial rules or lacks required capability. Tool execution halts instantly.
              </p>
            </div>
          </div>
        </section>

        {/* Section: Simulation vs Execution */}
        <section id="simulation-vs-execution" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Simulation vs Real Execution
          </h2>
          <Callout type="warning" title="Simulations Never Run Side Effects">
            <p className="text-xs leading-relaxed">
              When using the policy simulation endpoint (<code className="font-mono text-[#234E39]">POST /api/v1/policies/simulate</code>) or Playground, the security engine evaluates permissions, resource matching, and risk algorithms in a <strong>dry-run sandbox</strong>. The underlying tool is never executed, and no external emails, database mutations, or API calls are enacted.
            </p>
          </Callout>
          <CodeBlock code={curlSimulationExample} language="bash" filename="Simulate API Request" />
        </section>

        {/* Section: Live Playground */}
        <section id="live-playground" className="scroll-mt-20 space-y-4 pt-4 border-t border-[#E2E0D8]">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Accessing the Live SOC Playground
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The full interactive Security Playground is accessible within the SICTACK dashboard at <Link href="/test" className="text-[#234E39] underline font-mono">/test</Link>. It connects to your active tenant backend to test live custom policies against registered agents.
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
