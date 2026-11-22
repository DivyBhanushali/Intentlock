// SICTACK – Public Marketing Homepage
// Approved Concept A: Editorial Infrastructure (Stripe Press / Linear)

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  IconArrowForward,
  IconArrowDownward,
  IconContentCopy,
  IconCheck,
  IconVerified,
  IconCheckCircle,
  IconCancel,
  IconPendingActions,
  IconLockOpen,
  IconLink,
  IconShield,
  IconSupervisor,
  IconTerminal,
} from "@/components/ui/Icons";

export default function MarketingHomePage() {
  const [copiedPip, setCopiedPip] = useState(false);
  const [copiedPipCta, setCopiedPipCta] = useState(false);
  const [authorizedTx, setAuthorizedTx] = useState(false);

  const handleCopyPip = (isCta = false) => {
    navigator.clipboard.writeText("pip install sictack");
    if (isCta) {
      setCopiedPipCta(true);
      setTimeout(() => setCopiedPipCta(false), 2000);
    } else {
      setCopiedPip(true);
      setTimeout(() => setCopiedPip(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#f8f9f8] text-[#202629] font-sans selection:bg-[#d5e3ff] selection:text-[#3c5276] overflow-x-hidden">
      <main className="max-w-[1240px] mx-auto px-4 sm:px-6">
        {/* ─── SECTION 1: EDITORIAL HERO ─── */}
        <section className="pt-16 sm:pt-20 pb-20 sm:pb-24 border-b border-[#e4e9e8]" id="overview">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ebeeed] border border-[#e4e9e8] text-[#56585d] text-xs font-mono mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3d6851]"></span>
              <span>v1.0.0 • GLOBAL AI AGENT RUNTIME SECURITY INFRASTRUCTURE</span>
            </div>

            {/* Dual-Color Hero Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-bold tracking-tight leading-[1.15] sm:leading-[1.12] mb-6">
              <span className="text-[#202629]">Your AI agents can act.</span>
              <br className="hidden sm:inline" />
              <span className="text-[#485f84]">Make sure they should.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#56585d] leading-relaxed mb-4 max-w-2xl font-normal">
              The Security Infrastructure for the Autonomous AI Economy. Secure the action. Protect the intention.
            </p>
            <p className="text-sm text-[#757c7b] leading-relaxed mb-8 max-w-2xl font-normal">
              Deterministic runtime authorization, cryptographic audit trails, and continuous behavioral containment for autonomous AI systems. Intercept tool calls before real APIs execute.
            </p>

            {/* CTAs & Pip Quickstart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-12 sm:mb-14">
              <Link
                href="/developers"
                className="inline-flex items-center justify-center gap-2 bg-[#485f84] text-[#ffffff] hover:bg-[#3c5377] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] focus-visible:ring-offset-2 px-5 py-2.5 rounded font-medium text-sm transition duration-150 ease-in-out active:scale-95 shadow-sm"
              >
                <span>Read SDK Documentation</span>
                <IconArrowForward className="w-4 h-4 text-[#ffffff]" />
              </Link>

              <Link
                href="/soc"
                className="inline-flex items-center justify-center gap-2 bg-[#ffffff] border border-[#e4e9e8] hover:bg-[#f2f4f3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] text-[#202629] px-5 py-2.5 rounded font-medium text-sm transition duration-150 ease-in-out active:scale-95"
              >
                <span>Explore Live SOC</span>
              </Link>

              <button
                type="button"
                onClick={() => handleCopyPip(false)}
                className="flex items-center justify-between gap-3 px-3.5 py-2 bg-[#ffffff] rounded border border-[#e4e9e8] font-mono text-xs text-[#202629] group cursor-pointer hover:border-[#adb3b2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] transition-colors"
                title="Click to copy PyPI install command"
              >
                <span className="text-[#757c7b]">$</span>
                <span className="truncate">pip install sictack</span>
                {copiedPip ? (
                  <IconCheck className="w-4 h-4 text-[#3d6851] flex-shrink-0" />
                ) : (
                  <IconContentCopy className="w-4 h-4 text-[#757c7b] group-hover:text-[#485f84] transition-colors flex-shrink-0" />
                )}
              </button>
            </div>

            {/* Micro-metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[#e4e9e8]">
              <div>
                <div className="text-sm font-bold text-[#202629] tracking-tight mb-0.5">Fail-Closed Default</div>
                <div className="text-xs text-[#56585d]">Default-deny policy enforcement</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#202629] tracking-tight mb-0.5">Sequential SHA-256</div>
                <div className="text-xs text-[#56585d]">Append-only audit chain</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#202629] tracking-tight mb-0.5">In-Process Gate</div>
                <div className="text-xs text-[#56585d]">&lt; 1ms local policy evaluation</div>
              </div>
              <div>
                <div className="text-sm font-bold text-[#3d6851] tracking-tight mb-0.5 flex items-center gap-1">
                  <IconVerified className="w-3.5 h-3.5" />
                  <span>Local Verification</span>
                </div>
                <div className="text-[11px] text-[#757c7b]">Evaluated without LLM roundtrips</div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 2: ARCHITECTURE INTERCEPTION BOUNDARY ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]" id="architecture">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Diagram 01 // Deterministic Interception Boundary
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              How SICTACK Intercepts at the Tool Boundary
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-3xl leading-relaxed">
              Autonomous agents generate probabilistic tool calls. SICTACK acts as an in-process gatekeeper that evaluates intent against defined rules before any database query, API dispatch, or shell command executes.
            </p>
          </div>

          {/* Architectural Schematic Box */}
          <div className="bg-[#ffffff] rounded-xl border border-[#e4e9e8] p-5 sm:p-6 lg:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
              {/* Step 1: Agent Layer */}
              <div className="lg:col-span-3 bg-[#f2f4f3] p-5 rounded-lg border border-[#e4e9e8]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-mono font-semibold text-[#757c7b] uppercase tracking-wider">
                    Step 01: Initiator
                  </span>
                  <span className="px-2 py-0.5 text-[10px] bg-[#dde4e3] rounded text-[#56585d] font-mono">
                    Runtime LLM
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#202629] mb-2">Autonomous Agent</h3>
                <p className="text-xs text-[#56585d] mb-3">
                  LangChain / CrewAI / AutoGen executes task loop and yields dynamic call:
                </p>
                <div className="p-2.5 bg-[#ffffff] rounded border border-[#e4e9e8] font-mono text-[11px] text-[#a23e2e] break-all leading-relaxed">
                  stripe.refund.create(<br />&nbsp;&nbsp;amount=12000,<br />&nbsp;&nbsp;currency=&quot;usd&quot;<br />)
                </div>
              </div>

              {/* Flow Arrow 1 */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-[#757c7b]">
                <IconArrowForward className="w-5 h-5 hidden lg:block" />
                <IconArrowDownward className="w-5 h-5 lg:hidden" />
                <span className="text-[10px] font-mono tracking-tighter mt-1">Pre-Hook</span>
              </div>

              {/* Step 2: SICTACK Core Middleware */}
              <div className="lg:col-span-4 bg-[#f8f9f8] p-5 rounded-lg border-2 border-[#485f84]/20 relative shadow-sm">
                <div className="absolute -top-3 left-4 bg-[#485f84] text-[#ffffff] text-[10px] font-mono px-2 py-0.5 rounded tracking-wide font-medium">
                  SICTACK CORE ENGINE
                </div>
                <div className="flex items-center justify-between mt-1 mb-3">
                  <span className="text-[11px] font-mono font-semibold text-[#485f84] uppercase tracking-wider">
                    Step 02: Verification
                  </span>
                  <span className="text-[11px] text-[#3d6851] font-mono flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#3d6851] animate-pulse"></span> &lt; 1ms local
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-[#ffffff] rounded border border-[#e4e9e8] flex items-center justify-between">
                    <span className="font-medium text-[#202629]">1. Policy Rule Engine</span>
                    <span className="font-mono text-[10px] text-[#757c7b]">YAML / Pydantic</span>
                  </div>
                  <div className="p-2 bg-[#ffffff] rounded border border-[#e4e9e8] flex items-center justify-between">
                    <span className="font-medium text-[#202629]">2. Parameter Risk Scorer</span>
                    <span className="font-mono text-[10px] text-[#757c7b]">Bounds &amp; Schemas</span>
                  </div>
                  <div className="p-2 bg-[#ffffff] rounded border border-[#e4e9e8] flex items-center justify-between">
                    <span className="font-medium text-[#202629]">3. SHA-256 Digest Chain</span>
                    <span className="font-mono text-[10px] text-[#757c7b]">Append-Only Audit</span>
                  </div>
                </div>
              </div>

              {/* Flow Arrow 2 */}
              <div className="lg:col-span-1 flex flex-col items-center justify-center text-[#757c7b]">
                <IconArrowForward className="w-5 h-5 hidden lg:block" />
                <IconArrowDownward className="w-5 h-5 lg:hidden" />
                <span className="text-[10px] font-mono tracking-tighter mt-1">Verdict</span>
              </div>

              {/* Step 3: Verdict Pillars */}
              <div className="lg:col-span-3 space-y-2">
                <div className="bg-[#f0f7f3] border border-[#234e39]/20 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[#234e39] font-bold text-xs flex items-center gap-1">
                      <IconCheckCircle className="w-3.5 h-3.5" /> ALLOW
                    </span>
                    <span className="text-[10px] font-mono text-[#234e39]">Exit 0</span>
                  </div>
                  <p className="text-[11px] text-[#56585d] mt-1">Dispatches to downstream production API safely.</p>
                </div>

                <div className="bg-[#fbf1f0] border border-[#943425]/20 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[#943425] font-bold text-xs flex items-center gap-1">
                      <IconCancel className="w-3.5 h-3.5" /> DENY
                    </span>
                    <span className="text-[10px] font-mono text-[#943425]">Halted</span>
                  </div>
                  <p className="text-[11px] text-[#56585d] mt-1">Raises PolicyViolation exception before socket emit.</p>
                </div>

                <div className="bg-[#fef7ec] border border-[#8d5b18]/20 p-2.5 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8d5b18] font-bold text-xs flex items-center gap-1">
                      <IconPendingActions className="w-3.5 h-3.5" /> REQUIRE_APPROVAL
                    </span>
                    <span className="text-[10px] font-mono text-[#8d5b18]">Hold</span>
                  </div>
                  <p className="text-[11px] text-[#56585d] mt-1">Suspends execution; awaits cryptographic HMAC token.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION: ONE PLATFORM. TWO SECURITY ENGINES. ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]" id="engines">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#485f84] font-semibold block mb-2">
              Architectural Foundation // Coordinated Dual-Engine Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              One Platform. Two Security Engines.
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-3xl leading-relaxed">
              Autonomous AI agents require both deterministic boundary enforcement and continuous runtime surveillance. SICTACK combines pre-execution policy gating with post-execution behavioral intelligence into a single zero-trust security runtime.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Engine 1: SICTACK CORE */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e4e9e8] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-[#485f84]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#edf5f0] border border-[#d4e8dc] text-[#234e39] text-xs font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#234e39]"></span>
                    DETERMINISTIC GATEWAY
                  </span>
                  <span className="text-xs font-mono text-[#757c7b]">&lt; 1.0 ms Latency</span>
                </div>
                <h3 className="text-xl font-bold text-[#202629] mb-2 tracking-tight">
                  SICTACK CORE
                </h3>
                <p className="text-xs text-[#485f84] font-medium mb-4 uppercase tracking-wider font-mono">
                  Pre-Execution Authorization &amp; Cryptographic Audit
                </p>
                <p className="text-sm text-[#56585d] leading-relaxed mb-6">
                  Evaluates tool calls at the in-process execution boundary before network sockets or system processes execute. Guarantees deterministic parameter enforcement, policy version binding, stale approval expiration, and tamper-evident sequential SHA-256 hash chaining.
                </p>

                <div className="space-y-2.5 mb-8 text-xs font-sans">
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#3d6851] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">Parameter-Level Constraints:</span>{" "}
                      <span className="text-[#56585d]">Numeric min/max bounds, regex patterns, allowed/disallowed enum values.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#3d6851] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">Policy Version Binding:</span>{" "}
                      <span className="text-[#56585d]">Binds decisions to policy versions; blocks stale approvals if policy updates.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#3d6851] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">Cryptographic Audit Ledger:</span>{" "}
                      <span className="text-[#56585d]">SHA-256 chained digests ensure provable, zero-trust non-repudiation.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#e4e9e8] flex items-center justify-between">
                <Link
                  href="/core"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#485f84] hover:text-[#3c5377] transition-colors"
                >
                  <span>Explore CORE Architecture</span>
                  <IconArrowForward className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/soc/core"
                  className="text-xs font-mono text-[#56585d] hover:text-[#202629] underline"
                >
                  Launch CORE Console &rarr;
                </Link>
              </div>
            </div>

            {/* Engine 2: SICTACK SENTINEL */}
            <div className="bg-[#ffffff] rounded-xl border border-[#e4e9e8] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-[#943425]/40 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#fef7ec] border border-[#f5dcba] text-[#8d5b18] text-xs font-mono font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8d5b18]"></span>
                    BEHAVIORAL SURVEILLANCE
                  </span>
                  <span className="text-xs font-mono text-[#757c7b]">9 Continuous Detectors</span>
                </div>
                <h3 className="text-xl font-bold text-[#202629] mb-2 tracking-tight">
                  SICTACK SENTINEL
                </h3>
                <p className="text-xs text-[#8d5b18] font-medium mb-4 uppercase tracking-wider font-mono">
                  Runtime Intelligence &amp; Autonomous Containment
                </p>
                <p className="text-sm text-[#56585d] leading-relaxed mb-6">
                  Monitors active agent execution sessions across time and tool invocations. Detects abnormal execution frequency, task scope drift, fragmented exfiltration patterns, and autonomously initiates tiered containment actions.
                </p>

                <div className="space-y-2.5 mb-8 text-xs font-sans">
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#8d5b18] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">9 Behavioral Anomaly Detectors:</span>{" "}
                      <span className="text-[#56585d]">Frequency spikes, budget overruns, suspicious tool chains, exfiltration.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#8d5b18] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">Explainable Risk Scoring:</span>{" "}
                      <span className="text-[#56585d]">Normalized 4-tier risk classification with factor-level attribution.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5 p-2.5 bg-[#f8f9f8] rounded border border-[#e4e9e8]">
                    <IconCheckCircle className="w-4 h-4 text-[#8d5b18] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#202629]">Autonomous Containment:</span>{" "}
                      <span className="text-[#56585d]">Step-up monitoring, rate throttling, session quarantine, and worker kill.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-5 border-t border-[#e4e9e8] flex items-center justify-between">
                <Link
                  href="/sentinel"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8d5b18] hover:text-[#724810] transition-colors"
                >
                  <span>Explore SENTINEL Architecture</span>
                  <IconArrowForward className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/soc/sentinel"
                  className="text-xs font-mono text-[#56585d] hover:text-[#202629] underline"
                >
                  Launch SENTINEL Radar &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Future Product Divisions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-lg border border-dashed border-[#e4e9e8] bg-[#f8f9f8]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#202629]">SICTACK LABS</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ebeeed] text-[#56585d] font-semibold">Future Research</span>
              </div>
              <p className="text-xs text-[#757c7b]">Advanced adversarial agent alignment, game-theoretic containment, and emerging threat modeling.</p>
            </div>
            <div className="p-4 rounded-lg border border-dashed border-[#e4e9e8] bg-[#f8f9f8]">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-[#202629]">SICTACK CLOUD</span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#ebeeed] text-[#56585d] font-semibold">Future Infrastructure</span>
              </div>
              <p className="text-xs text-[#757c7b]">Managed enterprise policy federation, global agent telemetry mesh, and sovereign identity verification.</p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: INTERACTIVE PYTHON SDK & REAL-TIME INSPECTOR ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]" id="soc-console">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              SDK 02 // Runtime Inspection
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              Deterministic Python Integration. In-Process Enforcement.
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-2xl leading-relaxed">
              Register handlers with the <code className="px-1.5 py-0.5 rounded bg-[#ebeeed] text-xs font-mono">@agent.register_tool</code> decorator. Enforce permissions, glob patterns, argument bounds, and rate limits locally.
            </p>
          </div>

          {/* Split Code & Inspector Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 rounded-xl border border-[#e4e9e8] bg-[#ffffff] overflow-hidden shadow-sm min-w-0 max-w-full">
            {/* Left Pane: Code Editor */}
            <div className="lg:col-span-6 bg-[#161a1d] text-[#dde4e3] p-5 sm:p-6 font-mono text-xs flex flex-col justify-between min-w-0 max-w-full overflow-hidden">
              <div className="min-w-0 max-w-full">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#757c7b]/20">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3c4449]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3c4449]"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3c4449]"></span>
                    <span className="text-[11px] text-[#757c7b] ml-2">agent_defense.py</span>
                  </div>
                  <span className="text-[10px] text-[#757c7b] uppercase">Python 3.12+</span>
                </div>

                <pre className="leading-relaxed overflow-x-auto text-[11px] sm:text-[12px] max-w-full pb-2">
                  <span className="text-[#757c7b]"># Import SICTACK security runtime</span>{"\n"}
                  <span className="text-[#bbd3fd]">from</span> sictack <span className="text-[#bbd3fd]">import</span> Sictack, SecureAgent, Policy{"\n"}
                  <span className="text-[#bbd3fd]">from</span> sictack.models <span className="text-[#bbd3fd]">import</span> DecisionVerdict{"\n\n"}
                  <span className="text-[#757c7b]"># Initialize secure agent with declared permissions</span>{"\n"}
                  agent = SecureAgent(agent_id=<span className="text-[#beedd1]">&quot;finance_operator&quot;</span>, permissions=[<span className="text-[#beedd1]">&quot;stripe:transfer&quot;</span>]){"\n\n"}
                  <span className="text-[#757c7b]"># Intercept critical API dispatches at the execution boundary</span>{"\n"}
                  <span className="text-[#fd826d]">@agent.register_tool</span>(name=<span className="text-[#beedd1]">&quot;execute_wire_transfer&quot;</span>, permission=<span className="text-[#beedd1]">&quot;stripe:transfer&quot;</span>){"\n"}
                  <span className="text-[#bbd3fd]">def</span> <span className="text-[#beedd1]">execute_wire_transfer</span>(recipient_iban: <span className="text-[#bbd3fd]">str</span>, amount_usd: <span className="text-[#bbd3fd]">float</span>) -&gt; <span className="text-[#bbd3fd]">dict</span>:{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#757c7b]">&quot;&quot;&quot;Tool executes strictly after deterministic policy evaluation.&quot;&quot;&quot;</span>{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#bbd3fd]">return</span> bank_gateway.transfer(recipient_iban, amount_usd){"\n\n"}
                  <span className="text-[#757c7b]"># Invocations undergo in-process evaluation with default-deny semantics</span>{"\n"}
                  decision = agent.execute(<span className="text-[#beedd1]">&quot;execute_wire_transfer&quot;</span>, &#123;{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;recipient_iban&quot;</span>: <span className="text-[#beedd1]">&quot;DE89370400440532013000&quot;</span>,{"\n"}
                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-[#beedd1]">&quot;amount_usd&quot;</span>: <span className="text-[#fd826d]">45000.00</span>{"\n"}
                  &#125;)
                </pre>
              </div>

              <div className="pt-4 mt-6 border-t border-[#757c7b]/20 flex items-center justify-between text-[11px] text-[#757c7b]">
                <span>Deterministic Policy Evaluation</span>
                <span className="text-[#beedd1]">Status: In-Process Gate Active</span>
              </div>
            </div>

            {/* Right Pane: Real-Time Execution Inspector */}
            <div className="lg:col-span-6 p-5 sm:p-6 lg:p-7 flex flex-col justify-between bg-[#ffffff] border-t lg:border-t-0 lg:border-l border-[#e4e9e8]">
              <div>
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-[#e4e9e8]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#202629]">
                      INTERCEPTED INVOCATION #TX-8921
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#e4e9e8] text-[#56585d]">
                      SAMPLE DATA
                    </span>
                  </div>
                  {authorizedTx ? (
                    <span className="bg-[#f0f7f3] text-[#234e39] px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 border border-[#234e39]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#234e39]"></span> ALLOWED (AUTHORIZED)
                    </span>
                  ) : (
                    <span className="bg-[#fef7ec] text-[#8d5b18] px-2 py-0.5 rounded text-[11px] font-mono font-bold flex items-center gap-1 border border-[#8d5b18]/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8d5b18]"></span> REQUIRE_APPROVAL
                    </span>
                  )}
                </div>

                {/* Intercept Fields */}
                <div className="space-y-3.5 text-xs font-mono mb-6">
                  <div>
                    <span className="text-[#757c7b] text-[11px] block mb-1">Target Function:</span>
                    <div className="text-[#202629] font-semibold p-2 bg-[#f2f4f3] rounded border border-[#e4e9e8] break-all">
                      execute_wire_transfer(recipient_iban, amount_usd)
                    </div>
                  </div>

                  <div>
                    <span className="text-[#757c7b] text-[11px] block mb-1">Raw Evaluated Payload:</span>
                    <div className="p-2.5 bg-[#f2f4f3] rounded border border-[#e4e9e8] text-[#56585d] leading-relaxed text-[11px] break-all">
                      {`{"recipient_iban": "DE89370400440532013000", "amount_usd": 45000.00}`}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#757c7b] text-[11px] block mb-1">Triggered Security Constraint:</span>
                    <div className={`p-2.5 rounded border text-[11px] ${authorizedTx ? "bg-[#f0f7f3] text-[#234e39] border-[#234e39]/20" : "bg-[#fef7ec] text-[#8d5b18] border-[#8d5b18]/20"}`}>
                      {authorizedTx
                        ? "Quorum Verified: Slack signed token verified by designated human operator"
                        : "Rule #POL-904: amount_usd > 10,000 requires multi-party confirmation quorum"}
                    </div>
                  </div>

                  <div>
                    <span className="text-[#757c7b] text-[11px] block mb-1">Sequential SHA-256 Action Digest:</span>
                    <div className="p-2 bg-[#f2f4f3] rounded border border-[#e4e9e8] text-[10px] text-[#757c7b] break-all">
                      {authorizedTx
                        ? "8f12a349bc98ef11ca09de548812cde45829af41e4649b934ca495991b7899a1"
                        : "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Simulated Action Button */}
              <div className="pt-4 border-t border-[#e4e9e8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-[#757c7b]">
                  {authorizedTx
                    ? "State: Token verified. Appended to immutable chain."
                    : "State: Held pending operator approval token"}
                </span>
                <button
                  type="button"
                  onClick={() => setAuthorizedTx(!authorizedTx)}
                  className={`px-4 py-2 rounded text-xs font-medium transition duration-150 flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    authorizedTx
                      ? "bg-[#234e39] text-[#ffffff] hover:bg-[#1a3a2b] focus-visible:ring-[#234e39]"
                      : "bg-[#8d5b18] text-[#ffffff] hover:bg-[#734a14] focus-visible:ring-[#8d5b18]"
                  }`}
                >
                  {authorizedTx ? (
                    <IconCheck className="w-3.5 h-3.5 text-[#ffffff]" />
                  ) : (
                    <IconLockOpen className="w-3.5 h-3.5 text-[#ffffff]" />
                  )}
                  <span>{authorizedTx ? "Quorum Authorized" : "Authorize Via Slack Quorum"}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: FRAMEWORK INTEGRATIONS GRID ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Interoperability // Ecosystem
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              First-Class Support Across the Agent Ecosystem
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-2xl leading-relaxed">
              Plug SICTACK into existing agent pipelines in less than three lines of code. No proxy servers or architectural rewrite required.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] hover:border-[#adb3b2] transition-colors shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#202629]">LangChain</span>
                <span className="text-xs font-mono text-[#757c7b]">Integration</span>
              </div>
              <p className="text-xs text-[#56585d] mb-4 leading-relaxed">
                Direct drop-in wrapper for LangChain tools. Intercepts tool execution and validates arguments before invocation.
              </p>
              <div className="p-2 bg-[#f2f4f3] rounded font-mono text-[11px] text-[#485f84] break-all border border-[#e4e9e8]">
                sictack.integrations.SecureTool
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] hover:border-[#adb3b2] transition-colors shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#202629]">LangGraph</span>
                <span className="text-xs font-mono text-[#757c7b]">Node Guard</span>
              </div>
              <p className="text-xs text-[#56585d] mb-4 leading-relaxed">
                Secure node decorator that verifies permissions and branches to approval flows before state changes.
              </p>
              <div className="p-2 bg-[#f2f4f3] rounded font-mono text-[11px] text-[#485f84] break-all border border-[#e4e9e8]">
                sictack.integrations.secure_langchain_tool
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] hover:border-[#adb3b2] transition-colors shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#202629]">Model Context Protocol</span>
                <span className="text-xs font-mono text-[#757c7b]">Proxy</span>
              </div>
              <p className="text-xs text-[#56585d] mb-4 leading-relaxed">
                Client and server-side MCP inspection layer to enforce deterministic parameter envelopes over JSON-RPC.
              </p>
              <div className="p-2 bg-[#f2f4f3] rounded font-mono text-[11px] text-[#485f84] break-all border border-[#e4e9e8]">
                sictack.integrations.MCPSecurityProxy
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] hover:border-[#adb3b2] transition-colors shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#202629]">CrewAI &amp; AutoGen</span>
                <span className="text-xs font-mono text-[#757c7b]">Adapter</span>
              </div>
              <p className="text-xs text-[#56585d] mb-4 leading-relaxed">
                Multi-agent conversation gateway preventing recursive sub-agent privilege escalation and unauthorized actions.
              </p>
              <div className="p-2 bg-[#f2f4f3] rounded font-mono text-[11px] text-[#485f84] break-all border border-[#e4e9e8]">
                sictack.agent.SecureAgent
              </div>
            </div>

            {/* Card 5 */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] hover:border-[#adb3b2] transition-colors shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#202629]">Pure Python &amp; Asyncio</span>
                <span className="text-xs font-mono text-[#757c7b]">Native</span>
              </div>
              <p className="text-xs text-[#56585d] mb-4 leading-relaxed">
                Standard Python decorators and client libraries with zero framework lock-in. Compatible with FastAPI and Celery.
              </p>
              <div className="p-2 bg-[#f2f4f3] rounded font-mono text-[11px] text-[#485f84] break-all border border-[#e4e9e8]">
                sictack.client.SictackClient
              </div>
            </div>

            {/* Card 6: Custom Policies */}
            <div className="bg-[#ffffff] p-6 rounded-xl border border-dashed border-[#adb3b2]/60 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#202629]">Custom Declarative Policies</span>
                  <span className="text-xs font-mono text-[#757c7b]">Extensible</span>
                </div>
                <p className="text-xs text-[#56585d] leading-relaxed">
                  Author declarative security policies in YAML or Pydantic defining allow lists, deny lists, glob scopes, and thresholds.
                </p>
              </div>
              <Link
                href="/developers"
                className="text-xs font-medium text-[#485f84] hover:underline flex items-center gap-1 mt-4"
              >
                <span>Read policy specification</span>
                <IconArrowForward className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: CORE CAPABILITIES (3 PILLARS) ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Capabilities // Primitives
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              Engineered for Unforgiving Production Workloads
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-2xl leading-relaxed">
              Every component follows deterministic policy logic and fail-closed runtime semantics for systems handling critical operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#ebeeed] flex items-center justify-center text-[#485f84] mb-5">
                <IconLink className="w-5 h-5 text-[#485f84]" />
              </div>
              <h3 className="text-base font-bold text-[#202629] mb-2">Sequential SHA-256 Hash Chaining</h3>
              <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                Every evaluated invocation, argument hash, and verdict is linked into an immutable append-only audit trail with recursive secret redaction and verifiable hash continuity.
              </p>
              <span className="text-[11px] font-mono text-[#757c7b] block border-t border-[#e4e9e8] pt-3">
                H_n = SHA256(H_&#123;n-1&#125; || payload)
              </span>
            </div>

            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#ebeeed] flex items-center justify-center text-[#485f84] mb-5">
                <IconShield className="w-5 h-5 text-[#485f84]" />
              </div>
              <h3 className="text-base font-bold text-[#202629] mb-2">Fail-Closed Runtime Protection</h3>
              <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                Unregistered tools, ungranted permissions, schema violations, expired approval tokens, and internal exceptions automatically resolve to DENY.
              </p>
              <span className="text-[11px] font-mono text-[#757c7b] block border-t border-[#e4e9e8] pt-3">
                unhandled_error =&gt; DENY
              </span>
            </div>

            <div className="bg-[#ffffff] p-6 rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-[#ebeeed] flex items-center justify-center text-[#485f84] mb-5">
                <IconSupervisor className="w-5 h-5 text-[#485f84]" />
              </div>
              <h3 className="text-base font-bold text-[#202629] mb-2">Human-in-the-Loop Orchestration</h3>
              <p className="text-xs text-[#56585d] leading-relaxed mb-4">
                High-risk operations generate single-use, action-bound cryptographic approval tokens with strict TTL and nonce replay protection before execution resumes.
              </p>
              <span className="text-[11px] font-mono text-[#757c7b] block border-t border-[#e4e9e8] pt-3">
                HMAC-SHA256 &lt;nonce, ttl=3600&gt;
              </span>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: TECHNICAL COMPARISON MATRIX ─── */}
        <section className="py-20 sm:py-24 border-b border-[#e4e9e8]" id="benchmarks">
          <div className="mb-10 sm:mb-12">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-2">
              Technical Matrix // Structural Tradeoffs
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202629] mb-3">
              Comparing Defense Architectures
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-2xl leading-relaxed">
              Why probabilistic text filters cannot provide deterministic execution guarantees for tools with side effects.
            </p>
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto rounded-xl border border-[#e4e9e8] bg-[#ffffff] shadow-sm">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-[#e4e9e8] bg-[#f2f4f3] text-[#56585d] font-medium">
                  <th className="py-4 px-5 font-semibold text-[#202629]">Capability</th>
                  <th className="py-4 px-5">Raw Agent Tool Calling</th>
                  <th className="py-4 px-5">Prompt Guards (Text Filters)</th>
                  <th className="py-4 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] text-[#485f84] font-bold">
                    SICTACK Deterministic Middleware
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9e8] text-[#56585d]">
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#202629]">Execution Boundary</td>
                  <td className="py-3.5 px-5">Unchecked socket / direct call</td>
                  <td className="py-3.5 px-5">Pre-prompt text analysis only</td>
                  <td className="py-3.5 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] font-medium text-[#202629]">
                    In-process deterministic tool hook
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#202629]">Evaluation Model</td>
                  <td className="py-3.5 px-5">None</td>
                  <td className="py-3.5 px-5">Probabilistic secondary LLM check</td>
                  <td className="py-3.5 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] font-medium text-[#202629]">
                    Deterministic code, regex &amp; parameter rules
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#202629]">Latency Overhead</td>
                  <td className="py-3.5 px-5">0ms</td>
                  <td className="py-3.5 px-5">400ms – 1,200ms API roundtrip</td>
                  <td className="py-3.5 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] font-medium text-[#3d6851]">
                    &lt; 1ms local in-process evaluation
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#202629]">Tamper Resistance</td>
                  <td className="py-3.5 px-5">Zero</td>
                  <td className="py-3.5 px-5">Vulnerable to jailbreak &amp; adversarial tokens</td>
                  <td className="py-3.5 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] font-medium text-[#202629]">
                    Strict argument schemas &amp; glob invariants
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-5 font-semibold text-[#202629]">Audit Trail</td>
                  <td className="py-3.5 px-5">Unstructured logs</td>
                  <td className="py-3.5 px-5">Ephemeral prompt logs</td>
                  <td className="py-3.5 px-5 bg-[#ffffff] border-l border-r border-[#e4e9e8] font-medium text-[#202629]">
                    Sequential SHA-256 append-only ledger
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-[11px] text-[#757c7b] font-mono text-right">
            Evaluated on Python 3.12+ runtime. Zero external network roundtrips during local policy evaluation.
          </div>
        </section>

        {/* ─── SECTION 7: EDITORIAL CALL TO ACTION ─── */}
        <section className="py-20 sm:py-24" id="getstarted">
          <div className="bg-[#f2f4f3] rounded-2xl border border-[#e4e9e8] p-6 sm:p-12 text-center max-w-4xl mx-auto shadow-sm">
            <span className="text-xs font-mono uppercase tracking-wider text-[#757c7b] block mb-3">
              Production Deployment
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#202629] mb-4">
              Embed deterministic boundaries into your agent runtime.
            </h2>
            <p className="text-sm sm:text-base text-[#56585d] max-w-xl mx-auto mb-8 leading-relaxed">
              Stop relying on LLMs to self-regulate their own execution power. Enforce fail-closed controls before production APIs execute.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-6">
              <button
                type="button"
                onClick={() => handleCopyPip(true)}
                className="w-full sm:w-auto flex items-center justify-center gap-3 px-4 py-2.5 bg-[#ffffff] rounded border border-[#e4e9e8] font-mono text-xs text-[#202629] shadow-sm cursor-pointer hover:border-[#adb3b2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] transition-colors"
                title="Click to copy PyPI install command"
              >
                <span className="text-[#757c7b]">$</span>
                <span>pip install sictack</span>
                {copiedPipCta ? (
                  <IconCheck className="w-4 h-4 text-[#3d6851]" />
                ) : (
                  <IconContentCopy className="w-4 h-4 text-[#757c7b]" />
                )}
              </button>

              <Link
                href="/developers"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#485f84] text-[#ffffff] hover:bg-[#3c5377] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] focus-visible:ring-offset-2 px-6 py-2.5 rounded font-medium text-xs transition duration-150 ease-in-out active:scale-95 shadow-sm"
              >
                <span>Explore Documentation</span>
                <IconArrowForward className="w-3.5 h-3.5 text-[#ffffff]" />
              </Link>
            </div>

            <p className="text-[11px] text-[#757c7b] font-mono">
              Open-source under MIT License. Local source repository installation (Pre-PyPI release). Backward-compatible with intentlock.
            </p>
          </div>
        </section>
      </main>

      {/* ─── FOOTER (SHARED COMPONENT) ─── */}
      <footer className="bg-[#f2f4f3] border-t border-[#e4e9e8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex flex-col md:flex-row justify-between items-start gap-8 text-xs text-[#56585d]">
          <div className="max-w-md">
            <Link
              href="/"
              className="text-sm font-bold text-[#202629] block mb-2 tracking-tight flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#485f84] rounded"
            >
              <IconTerminal className="w-4 h-4 text-[#485f84]" />
              <span>SICTACK</span>
            </Link>
            <p className="leading-relaxed mb-4">
              © 2026 SICTACK. Released under the MIT License. The Security Infrastructure for the Autonomous AI Economy. Secure the action. Protect the intention.
            </p>
            <div className="text-[11px] text-[#757c7b]">
              Local in-process security middleware with zero network evaluation overhead.
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 font-medium">
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/#overview">
              Overview
            </Link>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/#architecture">
              Architecture
            </Link>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/soc">
              SOC Console
            </Link>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/developers">
              Documentation
            </Link>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/benchmark">
              Benchmarks
            </Link>
            <a
              className="hover:text-[#202629] underline transition-colors duration-150"
              href="https://github.com/sictack/sictack"
              rel="noreferrer"
              target="_blank"
            >
              GitHub
            </a>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/policies">
              Security
            </Link>
            <Link className="hover:text-[#202629] underline transition-colors duration-150" href="/audit">
              Audit Logs
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
