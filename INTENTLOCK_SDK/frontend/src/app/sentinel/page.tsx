// SICTACK SENTINEL – Public Product Architecture Page
// Approved Concept A: Editorial Infrastructure (Stripe Press / Linear)

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowForward,
  IconContentCopy,
  IconCheck,
} from "@/components/ui/Icons";

export default function SentinelProductPage() {
  const [copiedPip, setCopiedPip] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("pip install sictack");
    setCopiedPip(true);
    setTimeout(() => setCopiedPip(false), 2000);
  };

  const detectors = [
    {
      code: "SNT-R001",
      name: "Repeated Unauthorized Tool Invocations",
      severity: "HIGH",
      desc: "Triggers when an agent repeatedly attempts tool calls lacking assigned policy permissions.",
      weight: "0.65",
    },
    {
      code: "SNT-R002",
      name: "Repeated Restricted Resource Access",
      severity: "HIGH",
      desc: "Flags repeated attempts to read or mutate databases, endpoints, or files outside the agent's allowlist.",
      weight: "0.65",
    },
    {
      code: "SNT-R003",
      name: "Excessive Tool Execution Attempts",
      severity: "MEDIUM",
      desc: "Identifies rapid tool execution bursts exceeding defined per-minute operational ceilings.",
      weight: "0.35",
    },
    {
      code: "SNT-R004",
      name: "Task Scope Drift & Violations",
      severity: "HIGH",
      desc: "Monitors deviation from the agent's declared task objective and authorized tool/resource envelope.",
      weight: "0.65",
    },
    {
      code: "SNT-R005",
      name: "Abnormal Execution Frequency",
      severity: "MEDIUM",
      desc: "Detects anomalous invocation rates indicating runaway loops or automated brute-force attacks.",
      weight: "0.35",
    },
    {
      code: "SNT-R006",
      name: "Execution Budget Violations",
      severity: "HIGH",
      desc: "Halts agents exceeding cumulative step counts or total elapsed execution time limits.",
      weight: "0.65",
    },
    {
      code: "SNT-R007",
      name: "Suspicious Execution Sequences",
      severity: "CRITICAL",
      desc: "Detects multi-step attack patterns, such as read credentials immediately preceding an outbound network request.",
      weight: "0.90",
    },
    {
      code: "SNT-R008",
      name: "Approval Fatigue & Abuse",
      severity: "HIGH",
      desc: "Identifies repeated automated approval spam designed to coerce human reviewers into mistaken authorizations.",
      weight: "0.65",
    },
    {
      code: "SNT-R009",
      name: "Fragmented Exfiltration Patterns",
      severity: "CRITICAL",
      desc: "Detects small, fragmented data transmissions across multiple requests designed to evade payload inspection filters.",
      weight: "0.90",
    },
  ];

  return (
    <div className="w-full bg-[#f8f9f8] text-[#202629] font-sans selection:bg-[#d5e3ff] selection:text-[#3c5276] overflow-x-hidden min-h-screen">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#757c7b] mb-6">
          <Link href="/" className="hover:text-[#202629] transition-colors">Home</Link>
          <span>/</span>
          <span className="text-[#8d5b18] font-semibold">SICTACK SENTINEL</span>
        </div>

        {/* Hero Section */}
        <section className="pb-16 border-b border-[#e4e9e8]">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fef7ec] border border-[#f5dcba] text-[#8d5b18] text-xs font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8d5b18]"></span>
              <span>ENGINE 02 // BEHAVIORAL SURVEILLANCE &amp; CONTAINMENT</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#202629] mb-4 leading-tight">
              SICTACK SENTINEL
            </h1>
            <p className="text-lg sm:text-xl text-[#8d5b18] font-medium mb-6">
              Continuous runtime behavioral surveillance, explainable multi-factor risk assessment, and autonomous containment for autonomous agent sessions.
            </p>
            <p className="text-sm sm:text-base text-[#56585d] leading-relaxed mb-8 max-w-2xl">
              While SICTACK CORE ensures individual tool calls obey policy boundaries, complex agent attacks (such as goal hijacking, slow exfiltration, and resource exhaustion) unfold across multiple steps over time. SENTINEL maintains continuous stateful telemetry across active agent task sessions, calculating explainable risk scores and enforcing progressive containment.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/developers/sentinel"
                className="inline-flex items-center gap-2 bg-[#8d5b18] text-[#ffffff] hover:bg-[#724810] px-4 py-2.5 rounded font-medium text-xs shadow-sm transition-colors"
              >
                <span>Read SENTINEL Developer Guide</span>
                <IconArrowForward className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/soc/sentinel"
                className="inline-flex items-center gap-2 bg-[#ffffff] border border-[#e4e9e8] hover:bg-[#f2f4f3] text-[#202629] px-4 py-2.5 rounded font-medium text-xs transition-colors"
              >
                <span>Open SENTINEL Radar</span>
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

        {/* Explainable Risk Tiers */}
        <section className="py-16 border-b border-[#e4e9e8]">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Risk Architecture // 4 Standardized Operational Tiers
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629]">
              Explainable Risk &amp; Autonomous Escalation
            </h2>
            <p className="text-xs sm:text-sm text-[#56585d] mt-2 max-w-2xl">
              Risk scores are computed through independent probability aggregation bounded in [0.0, 1.0]. Offending factors are transparently reported with rule identifiers, weights, and triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Tier 0 */}
            <div className="p-5 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc]">
                  TIER 0 // 0.00 – 0.24
                </span>
                <h3 className="text-base font-bold text-[#202629] mt-3 mb-1">Nominal</h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Standard expected agent execution. Tool invocations fall strictly within declared scope and operational tempo.
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#3d6851] pt-3 border-t border-[#e4e9e8]">
                Action: Pass-through
              </div>
            </div>

            {/* Tier 1 */}
            <div className="p-5 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fef7ec] text-[#8d5b18] border border-[#f5dcba]">
                  TIER 1 // 0.25 – 0.49
                </span>
                <h3 className="text-base font-bold text-[#202629] mt-3 mb-1">Elevated</h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Minor behavioral drift detected (e.g. slight execution frequency acceleration or unexpected resource probing).
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#8d5b18] pt-3 border-t border-[#e4e9e8]">
                Action: Step-Up Monitoring
              </div>
            </div>

            {/* Tier 2 */}
            <div className="p-5 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#fbf1f0] text-[#943425] border border-[#e8c7c2]">
                  TIER 2 // 0.50 – 0.74
                </span>
                <h3 className="text-base font-bold text-[#202629] mt-3 mb-1">High Risk</h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Multiple overlapping anomaly signals (e.g. repeated policy denials combined with sudden tool chaining spikes).
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#943425] pt-3 border-t border-[#e4e9e8]">
                Action: Throttle &amp; Require Approval
              </div>
            </div>

            {/* Tier 3 */}
            <div className="p-5 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#742a2a] text-[#ffffff]">
                  TIER 3 // 0.75 – 1.00
                </span>
                <h3 className="text-base font-bold text-[#202629] mt-3 mb-1">Critical Threat</h3>
                <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                  Confirmed exfiltration sequence, rapid approval spamming, or severe scope breach violating containment policies.
                </p>
              </div>
              <div className="text-[11px] font-mono text-[#943425] font-semibold pt-3 border-t border-[#e4e9e8]">
                Action: Immediate Quarantine / Kill
              </div>
            </div>
          </div>
        </section>

        {/* 9 Behavioral Detectors */}
        <section className="py-16 border-b border-[#e4e9e8]">
          <div className="mb-10">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Surveillance Engine // Deterministic Rules SNT-R001 to SNT-R009
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629]">
              9 Continuous Behavioral Detectors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {detectors.map((d) => (
              <div key={d.code} className="p-5 bg-[#ffffff] rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold text-[#8d5b18]">{d.code}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      d.severity === "CRITICAL"
                        ? "bg-[#742a2a] text-white"
                        : d.severity === "HIGH"
                        ? "bg-[#fbf1f0] text-[#943425] border border-[#e8c7c2]"
                        : "bg-[#fef7ec] text-[#8d5b18] border border-[#f5dcba]"
                    }`}>
                      {d.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-[#202629] mb-2">{d.name}</h3>
                  <p className="text-xs text-[#56585d] leading-relaxed mb-4">{d.desc}</p>
                </div>
                <div className="text-[11px] font-mono text-[#757c7b] pt-3 border-t border-[#e4e9e8] flex justify-between">
                  <span>Weight:</span>
                  <span className="font-bold text-[#202629]">{d.weight}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Code Example Section */}
        <section className="py-16 border-b border-[#e4e9e8]">
          <div className="mb-8">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Implementation // Python SDK Syntax
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              Initializing a SENTINEL Task Session
            </h2>
            <p className="text-sm text-[#56585d] max-w-2xl leading-relaxed">
              Confine autonomous multi-step agents within an authorized task scope envelope and let SENTINEL detect behavioral deviations in real time.
            </p>
          </div>

          <div className="bg-[#161a1d] text-[#dde4e3] p-5 sm:p-7 rounded-xl border border-[#2d3748] font-mono text-xs overflow-x-auto shadow-sm">
            <pre className="leading-relaxed">
              <span className="text-[#757c7b]"># Initialize SENTINEL session confinement</span>{"\n"}
              <span className="text-[#bbd3fd]">from</span> sictack.sentinel <span className="text-[#bbd3fd]">import</span> ({"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;TaskSessionManager, TaskScope, BehavioralIntelligenceEngine, AutomatedContainmentEngine{"\n"}
              ){"\n\n"}
              manager = TaskSessionManager(){"\n"}
              session = manager.create_session({"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;agent_id&quot;</span>: <span className="text-[#beedd1]">&quot;research_analyst_04&quot;</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;task_objective&quot;</span>: <span className="text-[#beedd1]">&quot;Synthesize Q3 financial filings&quot;</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;authorized_scope&quot;</span>: TaskScope({"{"}{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;allowed_tools&quot;</span>: [<span className="text-[#beedd1]">&quot;search_sec_filings&quot;</span>, <span className="text-[#beedd1]">&quot;parse_table&quot;</span>],{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;max_steps&quot;</span>: <span className="text-[#fd826d]">50</span>,{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;max_execution_time_seconds&quot;</span>: <span className="text-[#fd826d]">300</span>{"\n"}
              &nbsp;&nbsp;&nbsp;&nbsp;{"}"}){"\n"}
              {"}"}){"\n\n"}
              <span className="text-[#757c7b]"># Feed execution events into the behavioral engine</span>{"\n"}
              engine = BehavioralIntelligenceEngine(){"\n"}
              anomalies = engine.evaluate_event(session, event){"\n\n"}
              <span className="text-[#757c7b]"># Automatically trigger tiered containment if risk reaches threshold</span>{"\n"}
              containment = AutomatedContainmentEngine(){"\n"}
              containment.enforce(session, risk_assessment)
            </pre>
          </div>
        </section>

        {/* CTA Footer */}
        <section className="pt-16 pb-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-[#202629]">Deploy continuous agent surveillance</h3>
            <p className="text-xs text-[#56585d] mt-1">Confine agents to scope envelopes and prevent autonomous runaways.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/developers/sentinel"
              className="px-4 py-2 bg-[#8d5b18] hover:bg-[#724810] text-white rounded font-medium text-xs shadow-sm transition-colors"
            >
              SENTINEL Developer Docs
            </Link>
            <Link
              href="/soc/sentinel"
              className="px-4 py-2 bg-white border border-[#e4e9e8] hover:bg-[#f2f4f3] text-[#202629] rounded font-medium text-xs transition-colors"
            >
              SENTINEL Radar Console
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
