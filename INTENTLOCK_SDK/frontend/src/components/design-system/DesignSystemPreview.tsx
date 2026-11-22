"use client";

import React, { useState } from "react";
import { PublicNavbarPreview } from "./nav/PublicNavbarPreview";
import { SocNavPreview } from "./nav/SocNavPreview";
import { DocsNavPreview } from "./nav/DocsNavPreview";

export function DesignSystemPreview() {
  const [theme, setTheme] = useState<"warm-light" | "warm-dark">("warm-light");
  const [navTab, setNavTab] = useState<"public" | "soc" | "docs">("public");
  const [viewportWidth, setViewportWidth] = useState<"100%" | "1440px" | "1024px" | "768px" | "375px">("100%");
  const [copyStatus, setCopyStatus] = useState<string>("Copy");
  const [showPassword, setShowPassword] = useState(false);
  const [buttonLoading, setButtonLoading] = useState(false);
  const [inputVal, setInputVal] = useState("agent_finance_runner_04");
  const [showErrorState, setShowErrorState] = useState(false);
  const [selectedTool, setSelectedTool] = useState("tool_stripe_transfer");

  const sampleCode = `from sictack import SictackClient, ToolExecutionRequest

client = SictackClient(
    api_key="sck_live_mock_5a8f9c1b...",
    environment="production"
)

# Intercept autonomous agent action before execution
decision = client.evaluate_intent(
    ToolExecutionRequest(
        agent_id="agent_finance_runner_04",
        tool_name="stripe_payout_execute",
        arguments={"amount_cents": 450000, "destination": "acct_8f99a1"}
    )
)

if decision.verdict == "REQUIRE_APPROVAL":
    print(f"Action held. Approval token: {decision.approval_id}")`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(sampleCode);
      setCopyStatus("Copied!");
      setTimeout(() => setCopyStatus("Copy"), 2000);
    } catch {
      setCopyStatus("Failed");
      setTimeout(() => setCopyStatus("Copy"), 2000);
    }
  };

  const toggleLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 1500);
  };

  return (
    <div
      data-theme={theme}
      className={`min-h-screen transition-colors duration-200 ${
        theme === "warm-light" ? "theme-warm-light" : "theme-warm-dark"
      }`}
      style={{
        backgroundColor: "var(--surface-canvas)",
        color: "var(--text-primary)",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* ─── 0. INTERNAL AUDIT BANNER ─── */}
      <div
        style={{
          backgroundColor: theme === "warm-light" ? "#FEF6EC" : "#2B2011",
          borderBottom: `1px solid ${
            theme === "warm-light" ? "#F7DEC0" : "#4D371A"
          }`,
          color: theme === "warm-light" ? "#8D5B18" : "#D99638",
        }}
        className="px-6 py-2.5 text-xs font-mono tracking-wide flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50 shadow-sm"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-semibold uppercase tracking-wider">
            NON-PRODUCTION DESIGN SYSTEM PREVIEW
          </span>
          <span className="opacity-75 hidden sm:inline">
            — Direction A: Warm Editorial Software (Internal Audit Only)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
            WCAG 2.2 AA Verified
          </span>
          <span className="px-2 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono">
            Zero Neon / Calm Contrast
          </span>
        </div>
      </div>

      {/* ─── 1. TOP CONTROL BAR / HERO ─── */}
      <header
        style={{
          borderBottom: "1px solid var(--border-default)",
          backgroundColor: "var(--surface-card)",
        }}
        className="px-6 sm:px-12 py-8 shadow-sm"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span
                style={{
                  backgroundColor: "var(--accent-brand)",
                  color: "#FFFFFF",
                }}
                className="text-[11px] font-mono font-medium px-2.5 py-1 rounded"
              >
                v2.0 Foundation
              </span>
              <span
                style={{ color: "var(--text-tertiary)" }}
                className="text-xs font-mono uppercase tracking-wider"
              >
                Token Architecture Proof
              </span>
            </div>
            <h1
              style={{
                color: "var(--text-primary)",
                fontFamily: "var(--font-display)",
              }}
              className="text-3xl sm:text-4xl font-semibold tracking-tight"
            >
              Warm Editorial Software
            </h1>
            <p
              style={{ color: "var(--text-secondary)" }}
              className="text-sm sm:text-base mt-2 max-w-2xl leading-relaxed"
            >
              A calm, human-centered design foundation engineered for AI security
              telemetry. Eliminates dark-neon styling, glowing cards, and AI-template
              tropes in favor of structured typography, warm alabaster surfaces, and
              archival ink accents.
            </p>
          </div>

          {/* Theme Switcher Toggle */}
          <div
            style={{
              backgroundColor: "var(--surface-subtle)",
              borderColor: "var(--border-default)",
            }}
            className="border p-1.5 rounded-lg flex items-center gap-1 self-start md:self-auto shrink-0"
          >
            <button
              type="button"
              onClick={() => setTheme("warm-light")}
              style={{
                backgroundColor:
                  theme === "warm-light" ? "var(--surface-card)" : "transparent",
                color:
                  theme === "warm-light"
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                boxShadow:
                  theme === "warm-light" ? "var(--shadow-sm)" : "none",
                borderColor:
                  theme === "warm-light"
                    ? "var(--border-default)"
                    : "transparent",
              }}
              className="px-4 py-2 text-xs font-medium rounded-md border transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="5" strokeWidth="2" />
                <path
                  strokeLinecap="round"
                  strokeWidth="2"
                  d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                />
              </svg>
              Warm Alabaster (Light)
            </button>

            <button
              type="button"
              onClick={() => setTheme("warm-dark")}
              style={{
                backgroundColor:
                  theme === "warm-dark" ? "var(--surface-card)" : "transparent",
                color:
                  theme === "warm-dark"
                    ? "var(--text-primary)"
                    : "var(--text-tertiary)",
                boxShadow:
                  theme === "warm-dark" ? "var(--shadow-sm)" : "none",
                borderColor:
                  theme === "warm-dark"
                    ? "var(--border-default)"
                    : "transparent",
              }}
              className="px-4 py-2 text-xs font-medium rounded-md border transition-all flex items-center gap-2 cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              Warm Obsidian (Dark)
            </button>
          </div>
        </div>
      </header>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <main className="max-w-[1200px] mx-auto px-6 sm:px-12 py-12 space-y-16">
        {/* ─── SECTION 1: DESIGN TOKENS INSPECTION MATRIX ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                01. Core Token Architecture
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Active CSS custom properties resolving in current mode (
                {theme === "warm-light" ? "Light" : "Dark"})
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)] uppercase">
              Semantic Variables
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                name: "Canvas Surface",
                var: "--surface-canvas",
                val: theme === "warm-light" ? "#FBFBF9" : "#121316",
                border: true,
              },
              {
                name: "Card Surface",
                var: "--surface-card",
                val: theme === "warm-light" ? "#FFFFFF" : "#1A1B1F",
                border: true,
              },
              {
                name: "Subtle Surface",
                var: "--surface-subtle",
                val: theme === "warm-light" ? "#F4F3EE" : "#222328",
                border: true,
              },
              {
                name: "Obsidian Ink",
                var: "--text-primary",
                val: theme === "warm-light" ? "#18191B" : "#EDEDEB",
                contrast: theme === "warm-light" ? "16.8:1" : "15.4:1",
              },
              {
                name: "Warm Slate",
                var: "--text-secondary",
                val: theme === "warm-light" ? "#56585D" : "#A6A8B0",
                contrast: theme === "warm-light" ? "6.2:1" : "5.8:1",
              },
              {
                name: "Archival Brand",
                var: "--accent-brand",
                val: theme === "warm-light" ? "#1D3557" : "#5B8AC4",
                contrast: theme === "warm-light" ? "8.9:1" : "5.1:1",
              },
            ].map((token) => (
              <div
                key={token.var}
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-sm)",
                }}
                className="p-3.5 rounded-lg border flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-full h-8 rounded mb-2.5 border border-black/5"
                    style={{ backgroundColor: `var(${token.var})` }}
                  />
                  <div className="text-xs font-medium text-[var(--text-primary)]">
                    {token.name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-tertiary)] mt-0.5 truncate">
                    {token.var}
                  </div>
                </div>
                <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                  <span>{token.val}</span>
                  {token.contrast && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      {token.contrast}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 2: TYPOGRAPHY HIERARCHY ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                02. Typographic Scale & Hierarchy
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Strict scale with disciplined line-heights and WCAG AA verified contrast
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Modular 4px Base
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-6 sm:p-8 divide-y divide-[var(--border-subtle)] space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Display · 40px / 48px · -0.02em
              </div>
              <div
                className="text-4xl font-semibold tracking-tight text-[var(--text-primary)] leading-[1.2] flex-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Autonomous Agent Guardrails
              </div>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Heading 1 · 30px / 38px · -0.015em
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] leading-[1.25] flex-1">
                Zero-Trust Tool Execution Pipeline
              </h1>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Heading 2 · 22px / 28px · -0.01em
              </div>
              <h2 className="text-[22px] font-semibold tracking-tight text-[var(--text-primary)] leading-[1.3] flex-1">
                Real-Time Policy Verification Ledger
              </h2>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Heading 3 · 17px / 24px · -0.005em
              </div>
              <h3 className="text-[17px] font-medium text-[var(--text-primary)] leading-normal flex-1">
                Cryptographic Audit Chains & Intercepted Payloads
              </h3>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Body Large · 16px / 26px · Normal
              </div>
              <p className="text-base text-[var(--text-secondary)] leading-relaxed flex-1 max-w-2xl">
                Every tool execution requested by an autonomous LLM is intercepted
                before reaching production APIs. IntentLock evaluates policy, executes
                drift detection, and signs an immutable tamper-evident record.
              </p>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Body Default · 14px / 22px · Normal
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-normal flex-1 max-w-2xl">
                Standard interface copy, table contents, and documentation body text.
                Maintains a minimum 4.5:1 contrast against both Warm Alabaster and
                Warm Obsidian card surfaces.
              </p>
            </div>

            <div className="pt-6 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
              <div className="w-48 shrink-0 text-xs font-mono text-[var(--text-tertiary)]">
                Monospace · 13px / 20px · Tabular
              </div>
              <div className="font-mono text-[13px] text-[var(--text-primary)] flex-1 flex flex-wrap gap-4">
                <span>0x8F9B2A4C6D1E</span>
                <span className="text-[var(--text-tertiary)]">sha256:7f83b165...</span>
                <span>$4,500.00 USD</span>
                <span className="text-[var(--text-secondary)]">2026-11-16 11:15:02 UTC</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 3: BUTTONS & INTERACTIVE CONTROLS ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                03. Buttons & Interaction States
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Primary (Archival Navy), Secondary (Warm Card), Ghost, and Terracotta Destructive
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Focus Rings & Pressed States
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-6 sm:p-8 space-y-6"
          >
            {/* Standard Button Row */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Primary Button */}
              <button
                type="button"
                onClick={toggleLoading}
                style={{
                  backgroundColor: "var(--accent-brand)",
                  color: "#FFFFFF",
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-95 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {buttonLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Evaluating...
                  </>
                ) : (
                  <>
                    <span>Deploy Guardrail</span>
                    <span className="text-xs opacity-75 font-mono">↵</span>
                  </>
                )}
              </button>

              {/* Secondary Button */}
              <button
                type="button"
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-primary)",
                  borderColor: "var(--border-default)",
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border hover:bg-[var(--surface-hover)] active:bg-[var(--surface-active)] transition-colors cursor-pointer"
              >
                Export Audit Ledger
              </button>

              {/* Ghost Button */}
              <button
                type="button"
                style={{
                  color: "var(--text-secondary)",
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors cursor-pointer"
              >
                View Documentation
              </button>

              {/* Destructive Button */}
              <button
                type="button"
                style={{
                  backgroundColor: "var(--status-denied)",
                  color: "#FFFFFF",
                }}
                className="px-4 py-2 text-sm font-medium rounded-md hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer shadow-sm"
              >
                Revoke Agent Credentials
              </button>

              {/* Disabled Button */}
              <button
                type="button"
                disabled
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  color: "var(--text-disabled)",
                  borderColor: "var(--border-subtle)",
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border cursor-not-allowed opacity-60"
              >
                Signature Verified (Locked)
              </button>
            </div>

            {/* Micro sizes and status dots */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex flex-wrap items-center gap-3">
              <span className="text-xs font-mono text-[var(--text-tertiary)] mr-2">
                Compact Controls:
              </span>
              <button
                type="button"
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                className="px-2.5 py-1 text-xs font-medium rounded border hover:bg-[var(--surface-hover)] transition-colors"
              >
                Filter: Active Only
              </button>
              <button
                type="button"
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                className="px-2.5 py-1 text-xs font-medium rounded border hover:bg-[var(--surface-hover)] transition-colors"
              >
                Sort: Timestamp (Desc)
              </button>
              <button
                type="button"
                onClick={() => setShowErrorState(!showErrorState)}
                style={{
                  backgroundColor: showErrorState
                    ? "var(--status-denied-bg)"
                    : "var(--surface-subtle)",
                  borderColor: showErrorState
                    ? "var(--status-denied-border)"
                    : "var(--border-default)",
                  color: showErrorState
                    ? "var(--status-denied)"
                    : "var(--text-secondary)",
                }}
                className="px-2.5 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ml-auto"
              >
                {showErrorState ? "✓ Error State Active" : "Toggle Form Error State"}
              </button>
            </div>
          </div>
        </section>

        {/* ─── SECTION 4: FORM CONTROLS & INPUTS ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                04. Form Architecture & Fields
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Inputs with tactile focus ring, clear helper typography, and error states
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Accessible Form Standards
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* Field 1: Agent Identifier */}
            <div className="space-y-1.5">
              <label
                htmlFor="demo-agent-id"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Target Agent Principal ID
              </label>
              <input
                id="demo-agent-id"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  backgroundColor: "var(--surface-canvas)",
                  borderColor: showErrorState
                    ? "var(--status-denied)"
                    : "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                className="w-full px-3 py-2 text-sm rounded-md border font-mono focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all"
                placeholder="agent_identifier_v1"
              />
              {showErrorState ? (
                <p className="text-[11px] font-medium text-[var(--status-denied)] flex items-center gap-1 mt-1">
                  <span>⚠</span> Agent ID cannot be empty or contain non-ASCII characters.
                </p>
              ) : (
                <p className="text-[11px] text-[var(--text-tertiary)]">
                  Unique identity registered with the SICTACK policy router.
                </p>
              )}
            </div>

            {/* Field 2: Target Tool Selection */}
            <div className="space-y-1.5">
              <label
                htmlFor="demo-tool-select"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Intercepted Tool Function
              </label>
              <select
                id="demo-tool-select"
                value={selectedTool}
                onChange={(e) => setSelectedTool(e.target.value)}
                style={{
                  backgroundColor: "var(--surface-canvas)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                className="w-full px-3 py-2 text-sm rounded-md border font-mono focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all cursor-pointer"
              >
                <option value="tool_stripe_transfer">tool_stripe_transfer (Financial / High-Risk)</option>
                <option value="tool_sql_drop_table">tool_sql_drop_table (Database / Critical)</option>
                <option value="tool_github_create_pr">tool_github_create_pr (Source / Low-Risk)</option>
                <option value="tool_slack_notify">tool_slack_notify (Messaging / Safe)</option>
              </select>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Selected tool dictates the automated boundary policy tier.
              </p>
            </div>

            {/* Field 3: Secret Token / Password with Reveal */}
            <div className="space-y-1.5">
              <label
                htmlFor="demo-token-input"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Signing Secret Key
              </label>
              <div className="relative">
                <input
                  id="demo-token-input"
                  type={showPassword ? "text" : "password"}
                  defaultValue="il_sec_89df201bc34e91"
                  style={{
                    backgroundColor: "var(--surface-canvas)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full pl-3 pr-10 py-2 text-sm rounded-md border font-mono focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ color: "var(--text-tertiary)" }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs hover:text-[var(--text-primary)] transition-colors p-1"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                HMAC signing secret used for tamper-evident payload verification.
              </p>
            </div>

            {/* Field 4: Search Input with shortcut */}
            <div className="space-y-1.5">
              <label
                htmlFor="demo-search-input"
                className="block text-xs font-medium text-[var(--text-primary)]"
              >
                Filter Audit Records
              </label>
              <div className="relative">
                <input
                  id="demo-search-input"
                  type="text"
                  placeholder="Search by hash, agent, or verdict..."
                  style={{
                    backgroundColor: "var(--surface-canvas)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-primary)",
                  }}
                  className="w-full pl-3 pr-14 py-2 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring)] transition-all"
                />
                <span
                  style={{
                    backgroundColor: "var(--surface-subtle)",
                    borderColor: "var(--border-default)",
                    color: "var(--text-tertiary)",
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded border"
                >
                  ⌘K
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)]">
                Supports prefix filtering (e.g. `verdict:denied`).
              </p>
            </div>
          </div>
        </section>

        {/* ─── SECTION 5: SEMANTIC STATUS BADGES ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                05. Semantic Security Badges
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Calm status tokens replacing aggressive neon indicators with disciplined editorial hues
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Decision Taxonomy
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ALLOWED Badge */}
              <div
                style={{
                  backgroundColor: "var(--status-allowed-bg)",
                  borderColor: "var(--status-allowed-border)",
                }}
                className="p-4 rounded-lg border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: "var(--status-allowed)" }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider"
                  >
                    <span
                      style={{ backgroundColor: "var(--status-allowed)" }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                    ALLOWED
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Code 200
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-normal">
                  Tool execution cleared by all active guardrail rules. No human approval
                  required.
                </p>
              </div>

              {/* DENIED Badge */}
              <div
                style={{
                  backgroundColor: "var(--status-denied-bg)",
                  borderColor: "var(--status-denied-border)",
                }}
                className="p-4 rounded-lg border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: "var(--status-denied)" }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider"
                  >
                    <span
                      style={{ backgroundColor: "var(--status-denied)" }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                    DENIED
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Code 403
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-normal">
                  Tool call blocked immediately. Policy violation or prompt injection pattern
                  detected.
                </p>
              </div>

              {/* REQUIRE_APPROVAL Badge */}
              <div
                style={{
                  backgroundColor: "var(--status-approval-bg)",
                  borderColor: "var(--status-approval-border)",
                }}
                className="p-4 rounded-lg border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: "var(--status-approval)" }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider"
                  >
                    <span
                      style={{ backgroundColor: "var(--status-approval)" }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                    REQUIRE_APPROVAL
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Code 202
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-normal">
                  Action quarantined. High-risk threshold requires explicit human operator
                  confirmation.
                </p>
              </div>

              {/* INFO / TELEMETRY Badge */}
              <div
                style={{
                  backgroundColor: "var(--status-info-bg)",
                  borderColor: "var(--status-info-border)",
                }}
                className="p-4 rounded-lg border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span
                    style={{ color: "var(--status-info)" }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold tracking-wider"
                  >
                    <span
                      style={{ backgroundColor: "var(--status-info)" }}
                      className="w-1.5 h-1.5 rounded-full"
                    />
                    TELEMETRY
                  </span>
                  <span className="text-[10px] font-mono text-[var(--text-tertiary)]">
                    Code 100
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-normal">
                  Informational audit event logged to immutable ledger without modifying
                  action flow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 6: DATA TABLE (LEDGER STYLE) ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                06. Audit Ledger Table (Zebra & Sticky Headers)
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Dense telemetry layout engineered for operational scanning and high data density
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Fictional Demo Telemetry
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--surface-subtle)",
                      borderBottom: "1px solid var(--border-default)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <th className="py-3 px-4 font-mono font-medium">Timestamp</th>
                    <th className="py-3 px-4 font-medium">Agent Principal</th>
                    <th className="py-3 px-4 font-medium">Intercepted Tool</th>
                    <th className="py-3 px-4 font-medium">Verdict</th>
                    <th className="py-3 px-4 font-medium text-right">Risk Score</th>
                    <th className="py-3 px-4 font-mono font-medium">Digest Hash</th>
                    <th className="py-3 px-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {[
                    {
                      ts: "11:14:32.408",
                      agent: "finance_agent_04",
                      tool: "stripe_payout_execute",
                      verdict: "REQUIRE_APPROVAL",
                      badgeBg: "var(--status-approval-bg)",
                      badgeText: "var(--status-approval)",
                      badgeBorder: "var(--status-approval-border)",
                      risk: "0.85",
                      hash: "a4f89d...",
                    },
                    {
                      ts: "11:14:18.112",
                      agent: "rag_crawler_prod",
                      tool: "sql_table_drop",
                      verdict: "DENIED",
                      badgeBg: "var(--status-denied-bg)",
                      badgeText: "var(--status-denied)",
                      badgeBorder: "var(--status-denied-border)",
                      risk: "0.99",
                      hash: "c720e1...",
                    },
                    {
                      ts: "11:13:55.894",
                      agent: "support_bot_triage",
                      tool: "send_slack_message",
                      verdict: "ALLOWED",
                      badgeBg: "var(--status-allowed-bg)",
                      badgeText: "var(--status-allowed)",
                      badgeBorder: "var(--status-allowed-border)",
                      risk: "0.04",
                      hash: "5b8ac4...",
                    },
                    {
                      ts: "11:13:12.720",
                      agent: "code_reviewer_ai",
                      tool: "github_merge_pr",
                      verdict: "ALLOWED",
                      badgeBg: "var(--status-allowed-bg)",
                      badgeText: "var(--status-allowed)",
                      badgeBorder: "var(--status-allowed-border)",
                      risk: "0.18",
                      hash: "8e9102...",
                    },
                  ].map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                      style={{
                        backgroundColor:
                          idx % 2 === 1 ? "var(--surface-canvas)" : "var(--surface-card)",
                      }}
                    >
                      <td className="py-3 px-4 text-[var(--text-tertiary)]">{row.ts}</td>
                      <td className="py-3 px-4 font-sans font-medium text-[var(--text-primary)]">
                        {row.agent}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)]">{row.tool}</td>
                      <td className="py-3 px-4">
                        <span
                          style={{
                            backgroundColor: row.badgeBg,
                            color: row.badgeText,
                            borderColor: row.badgeBorder,
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-semibold border inline-block"
                        >
                          {row.verdict}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-[var(--text-primary)]">
                        {row.risk}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-tertiary)]">{row.hash}</td>
                      <td className="py-3 px-4 text-right font-sans">
                        <button
                          type="button"
                          className="text-xs text-[var(--accent-brand)] hover:underline cursor-pointer"
                        >
                          Inspect Trace
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ─── SECTION 7: SECURITY DECISION STATE CARD ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                07. Intercepted Decision Surface
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Visualizing an intercepted tool execution event with risk factors and cryptographic proof
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Decision Telemetry
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-md)",
            }}
            className="border rounded-xl p-6 sm:p-8 space-y-6"
          >
            {/* Header of the Decision Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <span
                  style={{
                    backgroundColor: "var(--status-denied-bg)",
                    borderColor: "var(--status-denied-border)",
                    color: "var(--status-denied)",
                  }}
                  className="w-10 h-10 rounded-lg border flex items-center justify-center font-bold text-base"
                >
                  ✕
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">
                      Tool Execution Blocked
                    </span>
                    <span
                      style={{
                        backgroundColor: "var(--status-denied-bg)",
                        color: "var(--status-denied)",
                        borderColor: "var(--status-denied-border)",
                      }}
                      className="px-2 py-0.2 rounded text-[10px] font-mono font-semibold border"
                    >
                      RULE_VIOLATION
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Agent attempted to call restricted administrative tool without human approval token.
                  </p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:pl-6 border-[var(--border-subtle)]">
                <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  Calculated Risk
                </div>
                <div className="text-xl font-semibold font-mono text-[var(--status-denied)]">
                  0.98 <span className="text-xs font-normal">/ 1.00</span>
                </div>
              </div>
            </div>

            {/* Inset payload view */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div
                style={{
                  backgroundColor: "var(--surface-muted)",
                  borderColor: "var(--border-subtle)",
                }}
                className="p-4 rounded-lg border font-mono text-xs space-y-2"
              >
                <div className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Intercepted Request Parameters
                </div>
                <pre className="text-[var(--text-primary)] overflow-x-auto leading-relaxed">
{`{
  "agent_id": "fictional_rag_crawler_prod",
  "tool_name": "database_drop_collection",
  "parameters": {
    "collection": "production_customer_pii",
    "cascade": true,
    "bypass_confirm": true
  }
}`}
                </pre>
              </div>

              <div
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  borderColor: "var(--border-subtle)",
                }}
                className="p-4 rounded-lg border space-y-3"
              >
                <div className="text-[11px] font-mono font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Security Engine Reasoning
                </div>
                <ul className="text-xs text-[var(--text-secondary)] space-y-2 list-disc list-inside">
                  <li>
                    Target tool <code className="font-mono text-[var(--text-primary)]">database_drop_collection</code> is classified under Tier-1 Critical Mutation.
                  </li>
                  <li>
                    Target argument <code className="font-mono text-[var(--text-primary)]">bypass_confirm: true</code> triggers strict anti-tamper rule #409.
                  </li>
                  <li>
                    Audit record signed and pinned to immutable chain with key <code className="font-mono text-[var(--text-primary)]">0x9F...3A</code>.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SECTION 8: EDITORIAL CODE BLOCK (NO FAKE DOTS) ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                08. Restrained Code Presentation
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Warm Stone background with calm syntax highlights and zero fake macOS window chrome
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              Editorial Cleanliness
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-muted)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl overflow-hidden"
          >
            {/* Real functional bar with file name and copy */}
            <div
              style={{
                backgroundColor: "var(--surface-subtle)",
                borderBottom: "1px solid var(--border-default)",
              }}
              className="px-4 py-2.5 flex items-center justify-between text-xs font-mono"
            >
              <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />
                <span>agent_guardrail.py</span>
                <span className="text-[var(--text-tertiary)] opacity-60">· Python 3.12+</span>
              </div>
              <button
                type="button"
                onClick={copyCode}
                style={{
                  backgroundColor: "var(--surface-card)",
                  borderColor: "var(--border-default)",
                  color: "var(--text-primary)",
                }}
                className="px-2.5 py-1 rounded border text-[11px] font-medium hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
              >
                {copyStatus}
              </button>
            </div>

            {/* Code Body with Selectable Line Numbers */}
            <div className="p-4 sm:p-6 overflow-x-auto text-[13px] font-mono leading-relaxed flex gap-4">
              <div
                style={{ color: "var(--text-tertiary)" }}
                className="select-none text-right opacity-50 pr-2 border-r border-[var(--border-subtle)] space-y-0.5"
              >
                <div>01</div>
                <div>02</div>
                <div>03</div>
                <div>04</div>
                <div>05</div>
                <div>06</div>
                <div>07</div>
                <div>08</div>
                <div>09</div>
                <div>10</div>
                <div>11</div>
                <div>12</div>
                <div>13</div>
                <div>14</div>
                <div>15</div>
                <div>16</div>
              </div>
              <pre className="text-[var(--text-primary)] flex-1 overflow-x-auto">
                <code>{sampleCode}</code>
              </pre>
            </div>
          </div>
        </section>

        {/* ─── SECTION 9: 4PX MODULAR SPACING SCALE VISUALIZER ─── */}
        <section className="space-y-6">
          <div className="flex items-baseline justify-between border-b pb-3 border-[var(--border-default)]">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                09. 4px Modular Spacing Visualizer
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Strict geometric spacing scale governing padding, margins, gaps, and component heights
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              4px Multiples Scale
            </span>
          </div>

          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-6 sm:p-8 space-y-4"
          >
            {[
              { token: "space-1", px: 4, desc: "Hairline offsets, badge internal gap" },
              { token: "space-2", px: 8, desc: "Button icon gap, compact chip padding" },
              { token: "space-3", px: 12, desc: "Card internal row gap, input padding y" },
              { token: "space-4", px: 16, desc: "Standard component padding, card gutter" },
              { token: "space-6", px: 24, desc: "Card body padding, section sub-gap" },
              { token: "space-8", px: 32, desc: "Major section headers, card padding large" },
              { token: "space-12", px: 48, desc: "Page section vertical rhythm" },
              { token: "space-16", px: 64, desc: "Marketing hero block margins" },
            ].map((step) => (
              <div key={step.token} className="flex items-center gap-4 text-xs font-mono">
                <div className="w-20 text-[var(--text-primary)] font-semibold">
                  {step.token}
                </div>
                <div className="w-12 text-[var(--text-tertiary)]">{step.px}px</div>
                <div className="flex-1 max-w-md bg-[var(--surface-subtle)] h-5 rounded overflow-hidden flex items-center">
                  <div
                    style={{
                      width: `${step.px * 3}px`,
                      backgroundColor: "var(--accent-brand)",
                    }}
                    className="h-full opacity-80"
                  />
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] hidden md:block font-sans">
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── SECTION 10: COMPLETE NAVIGATION ARCHITECTURE & INTERACTIVE LAB ─── */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b pb-3 border-[var(--border-default)]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-[var(--text-primary)]">
                  10. Coordinated Navigation Architecture
                </h2>
                <span
                  style={{
                    backgroundColor: "var(--status-allowed-bg)",
                    color: "var(--status-allowed)",
                    borderColor: "var(--status-allowed-border)",
                  }}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold border"
                >
                  Phase 1 Mandatory Prototype
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Three distinct connected navigation experiences engineered with restrained geometry, responsive drawers, and WCAG 2.2 AA interactions.
              </p>
            </div>
            <span className="text-[11px] font-mono text-[var(--text-tertiary)]">
              No Neon · Calm Contrast
            </span>
          </div>

          {/* Navigation Experience Tabs & Viewport Width Controls */}
          <div
            style={{
              backgroundColor: "var(--surface-card)",
              borderColor: "var(--border-default)",
              boxShadow: "var(--shadow-sm)",
            }}
            className="border rounded-xl p-4 sm:p-6 space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              {/* Experience Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)] mr-1">
                  Experience:
                </span>
                {[
                  { id: "public", label: "A. Public Website Navbar" },
                  { id: "soc", label: "B. SOC Dashboard Navigation" },
                  { id: "docs", label: "C. Developer Portal Navigation" },
                ].map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setNavTab(exp.id as "public" | "soc" | "docs")}
                    style={{
                      backgroundColor:
                        navTab === exp.id
                          ? "var(--accent-brand)"
                          : "var(--surface-subtle)",
                      color:
                        navTab === exp.id
                          ? "#FFFFFF"
                          : "var(--text-primary)",
                      borderColor:
                        navTab === exp.id
                          ? "var(--accent-brand)"
                          : "var(--border-default)",
                    }}
                    className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer"
                  >
                    {exp.label}
                  </button>
                ))}
              </div>

              {/* Viewport Width Emulation */}
              <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
                <span className="text-xs font-mono text-[var(--text-tertiary)] mr-1">
                  Viewport:
                </span>
                {[
                  { label: "Fluid 100%", width: "100%" },
                  { label: "1440px (Desktop)", width: "1440px" },
                  { label: "1024px (Laptop)", width: "1024px" },
                  { label: "768px (Tablet)", width: "768px" },
                  { label: "375px (Mobile)", width: "375px" },
                ].map((vp) => (
                  <button
                    key={vp.width}
                    type="button"
                    onClick={() =>
                      setViewportWidth(
                        vp.width as "100%" | "1440px" | "1024px" | "768px" | "375px"
                      )
                    }
                    style={{
                      backgroundColor:
                        viewportWidth === vp.width
                          ? "var(--surface-muted)"
                          : "var(--surface-canvas)",
                      borderColor:
                        viewportWidth === vp.width
                          ? "var(--border-strong)"
                          : "var(--border-subtle)",
                      color:
                        viewportWidth === vp.width
                          ? "var(--text-primary)"
                          : "var(--text-tertiary)",
                    }}
                    className="px-2 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer"
                  >
                    {vp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Frame */}
            <div
              className="mx-auto transition-all duration-300 overflow-hidden rounded-xl border border-[var(--border-default)] shadow-sm"
              style={{
                maxWidth: viewportWidth,
                backgroundColor: "var(--surface-canvas)",
              }}
            >
              {/* Frame Chrome Header showing active width */}
              <div
                style={{
                  backgroundColor: "var(--surface-subtle)",
                  borderBottom: "1px solid var(--border-default)",
                }}
                className="px-4 py-1.5 text-[10px] font-mono text-[var(--text-tertiary)] flex items-center justify-between"
              >
                <span>Frame: {navTab.toUpperCase()} NAVIGATION</span>
                <span>Active Width: {viewportWidth === "100%" ? "Responsive 100%" : viewportWidth}</span>
              </div>

              {/* Render Selected Navigation Prototype */}
              <div className="p-2 sm:p-4">
                {navTab === "public" && <PublicNavbarPreview />}
                {navTab === "soc" && <SocNavPreview />}
                {navTab === "docs" && <DocsNavPreview />}
              </div>
            </div>

            {/* Navigation Architectural Specifications Table */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
                Navigation Spacing & Geometry Specifications (Section 6 & 7 Compliance)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                <div
                  style={{
                    backgroundColor: "var(--surface-subtle)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border space-y-1.5"
                >
                  <div className="font-semibold text-[var(--text-primary)]">
                    A. Public Website Navbar
                  </div>
                  <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 font-mono">
                    <li>· Header Height: 64px (h-16)</li>
                    <li>· Brand Mark: 28px height, 130px width</li>
                    <li>· Horizontal Padding: 24px (px-6) / 32px (px-8)</li>
                    <li>· Link Gap: 24px desktop, 44px min touch target on mobile</li>
                    <li>· Dropdown: 320px width, 12px rounded, shadow-lg</li>
                    <li>· Mobile: Slide-over drawer with Escape & outside click dismissal</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--surface-subtle)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border space-y-1.5"
                >
                  <div className="font-semibold text-[var(--text-primary)]">
                    B. SOC Dashboard Navigation
                  </div>
                  <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 font-mono">
                    <li>· Header Height: 52px (compact secops header)</li>
                    <li>· Sidebar Width: 240px (expanded) / 64px (collapsed)</li>
                    <li>· Breadcrumbs: 12px font, muted separators</li>
                    <li>· Tenant Switcher: Dropdown with 250ms transition</li>
                    <li>· Pending Counter: Warm Amber Clay badge</li>
                    <li>· Command Trigger: ⌘K accessible shortcut</li>
                  </ul>
                </div>

                <div
                  style={{
                    backgroundColor: "var(--surface-subtle)",
                    borderColor: "var(--border-subtle)",
                  }}
                  className="p-3.5 rounded-lg border space-y-1.5"
                >
                  <div className="font-semibold text-[var(--text-primary)]">
                    C. Developer Portal Navigation
                  </div>
                  <ul className="text-[11px] text-[var(--text-secondary)] space-y-1 font-mono">
                    <li>· Header Height: 56px with &quot;Return to Console&quot; link</li>
                    <li>· Sidebar Width: 260px with categorized hierarchy</li>
                    <li>· Search Bar: 380px max width with ⌘K palette hook</li>
                    <li>· Version Pill: v1.0.0 with Python 3.12+ indicator</li>
                    <li>· Touch Targets: 44px min touch height on mobile drawer</li>
                    <li>· Focus Ring: 2px Deep Archival Navy focus indicator</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer
        style={{
          borderTop: "1px solid var(--border-default)",
          backgroundColor: "var(--surface-card)",
          color: "var(--text-secondary)",
        }}
        className="px-6 sm:px-12 py-8 mt-20 text-xs"
      >
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-mono text-[11px] text-[var(--text-tertiary)]">
            SICTACK REDESIGN PHASE 1 · FOUNDATION PROOF · WCAG 2.2 AA VERIFIED
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[var(--text-tertiary)]">
              Direction A: Warm Editorial Software
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
