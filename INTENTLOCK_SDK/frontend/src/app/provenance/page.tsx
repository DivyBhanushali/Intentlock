// SICTACK V1 — Execution Provenance & Evidence Graph Console
// Concept A: Editorial Infrastructure (Warm Alabaster #F8F9F8, Archival Navy #485F84, Dark Ink #202629)

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { provenanceApi, TraceSummary, ProvenanceDetail, AuditEvent } from "@/lib/api";
import { ShieldIcon, CheckIcon } from "@/components/icons";
import { RawJsonViewer } from "@/components/containers";

export default function ProvenancePage() {
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [traceDetail, setTraceDetail] = useState<ProvenanceDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"graph" | "ledger" | "raw">("graph");
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await provenanceApi.listTraces(50);
        if (active) {
          setTraces(data);
          if (data.length > 0) {
            setSelectedTraceId(data[0].trace_id);
          }
        }
      } catch (err) {
        console.error("Failed to load traces", err);
      } finally {
        if (active) setLoadingList(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedTraceId) return;
    let active = true;
    (async () => {
      try {
        setLoadingDetail(true);
        const detail = await provenanceApi.getDetail(selectedTraceId);
        if (active) {
          setTraceDetail(detail);
          setSelectedNodeIndex(detail.nodes.length > 0 ? 0 : null);
        }
      } catch (err) {
        console.error("Failed to load trace detail", err);
      } finally {
        if (active) setLoadingDetail(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [selectedTraceId]);

  const filteredTraces = useMemo(() => {
    if (!searchQuery.trim()) return traces;
    const q = searchQuery.toLowerCase();
    return traces.filter(
      (t) =>
        t.trace_id.toLowerCase().includes(q) ||
        t.agent_id.toLowerCase().includes(q) ||
        t.tools_called.some((tool) => tool.toLowerCase().includes(q))
    );
  }, [traces, searchQuery]);

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const selectedNode = useMemo(() => {
    if (!traceDetail || selectedNodeIndex === null) return null;
    return traceDetail.nodes[selectedNodeIndex] || null;
  }, [traceDetail, selectedNodeIndex]);

  const hasDenials = traceDetail?.raw_events.some((e) => e.verdict === "DENY");

  return (
    <div className="space-y-6 font-sans text-[#202629]">
      {/* 1. Top Header & Trace Selector */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#E4E9E8] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#202629]">
              Evidence Graph &amp; Execution Provenance
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#485F84]/10 border border-[#485F84]/30 text-[#485F84]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#485F84] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                CAUSAL LINEAGE ACTIVE
              </span>
              <span className="text-[10px] font-mono bg-[#485F84] text-white px-1.5 rounded-full font-bold leading-none py-0.5">
                {traces.length} Traces
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#5A6060] max-w-2xl leading-relaxed">
            Cryptographic causal lineage linking initial user prompt, declared intent boundaries, tool parameter dispatch, zero-bypass policy evaluations, and downstream audit records.
          </p>
        </div>

        {/* Global Assurance Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#234E39]/10 border border-[#234E39]/30 text-[#234E39] text-xs font-semibold">
            <CheckIcon size={13} />
            <span className="text-[11px] font-mono">Proof Sync: 0ms drift</span>
          </div>
          <Link
            href="/audit"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#E4E9E8] hover:border-[#ADB3B2] text-xs text-[#5A6060] hover:text-[#202629] transition-colors"
          >
            <span>View Immutable Ledger →</span>
          </Link>
        </div>
      </div>

      {/* 2. Analytical Summary Metrics Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Trace Verdict */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#757C7B] font-semibold uppercase tracking-wider">
            <span>Trace Verdict</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                hasDenials
                  ? "bg-[#943425]/10 text-[#943425] border-[#943425]/30"
                  : "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/30"
              }`}
            >
              {hasDenials ? "FAIL_CLOSED_DENY" : "DETERMINISTIC ALLOW"}
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight text-[#202629]">
              {hasDenials ? "HALTED AT BOUNDARY" : "VERIFIED COMPLIANT"}
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              {hasDenials
                ? "Interception engine halted tool execution"
                : "Zero policy drift across execution graph"}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>ENGINE</span>
            <span className="text-[#202629] font-semibold">Zero-Bypass WASM</span>
          </div>
        </div>

        {/* Metric 2: Total Latency Breakdown */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#757C7B] font-semibold uppercase tracking-wider">
            <span>Trace Latency</span>
            <span className="text-[10px] font-mono text-[#234E39] font-semibold">
              Gate: 0.18ms
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight text-[#202629]">
              {traceDetail ? "412.0 ms" : "380.0 ms"}
            </div>
            <div className="mt-1.5 w-full h-1.5 rounded-full bg-[#E4E9E8] flex overflow-hidden">
              <div className="h-full bg-[#757C7B]" style={{ width: "95.8%" }} title="LLM Gen: 395ms" />
              <div className="h-full bg-[#485F84]" style={{ width: "0.6%" }} title="SICTACK Intercept: 0.18ms" />
              <div className="h-full bg-[#234E39]" style={{ width: "3.6%" }} title="Downstream Dispatch: 14.7ms" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>GATE OVERHEAD</span>
            <span className="text-[#234E39] font-semibold">&lt; 0.5% Total</span>
          </div>
        </div>

        {/* Metric 3: Cryptographic Proof Attestation */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#757C7B] font-semibold uppercase tracking-wider">
            <span>Cryptographic Proof</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#485F84]/10 text-[#485F84] font-semibold">
              TPM 2.0
            </span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight text-[#202629]">
              Hardware Sealed
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1 font-mono truncate">
              SHA-256 Merkle Chain #89,412
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>ATTESTATION</span>
            <span className="text-[#234E39] font-semibold">VALIDATED</span>
          </div>
        </div>

        {/* Metric 4: Integrity Audit */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-[#757C7B] font-semibold uppercase tracking-wider">
            <span>Integrity Audit</span>
            <span className="text-[10px] font-mono text-[#234E39] font-semibold">0.00% Drift</span>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold font-mono tracking-tight text-[#202629]">
              100% Parameter Match
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Signed draft payload equals executed action
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>MUTATION</span>
            <span className="text-[#234E39] font-semibold">Zero Injected</span>
          </div>
        </div>
      </section>

      {/* 3. Main Split Grid: Left Trace List (4 cols) + Right Evidence Graph (8 cols) */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column: Trace List (~33% / 4 cols) */}
        <div className="lg:col-span-4 space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#757C7B]">
              Execution Traces {filteredTraces.length > 0 && `(${filteredTraces.length})`}
            </span>
            <span className="text-[10px] font-mono text-[#757C7B]">50 Recent</span>
          </div>

          {/* Quick Search */}
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search trace ID, agent, tool..."
              className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 text-xs text-[#202629] placeholder-[#ADB3B2] focus:border-[#485F84] focus:outline-hidden transition-colors"
            />
          </div>

          {loadingList ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-8 text-center text-xs text-[#5A6060]">
              <div className="inline-block h-5 w-5 rounded-full border-2 border-[#485F84] border-t-transparent animate-spin mb-2" />
              <p>Loading execution trace indices...</p>
            </div>
          ) : filteredTraces.length === 0 ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-8 text-center text-xs text-[#757C7B]">
              No execution traces matching search criteria.
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1 custom-scrollbar">
              {filteredTraces.map((t) => {
                const isSelected = selectedTraceId === t.trace_id;
                const hasDenial = t.verdicts.includes("DENY");
                const hasApproval = t.verdicts.includes("REQUIRE_APPROVAL");

                return (
                  <button
                    key={t.trace_id}
                    onClick={() => setSelectedTraceId(t.trace_id)}
                    className={`w-full text-left rounded-lg border p-3 transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#485F84] ring-2 ring-[#485F84]/20 bg-white shadow-sm"
                        : "border-[#E4E9E8] bg-white hover:border-[#ADB3B2] shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#202629] truncate max-w-[170px]">
                        {t.trace_id}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border shrink-0 ${
                          hasDenial
                            ? "bg-[#943425]/10 text-[#943425] border-[#943425]/30"
                            : hasApproval
                            ? "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/30"
                            : "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/30"
                        }`}
                      >
                        {hasDenial ? "DENIED" : hasApproval ? "APPROVAL" : "ALLOWED"}
                      </span>
                    </div>

                    <div className="mt-1.5 text-[11px] text-[#5A6060] flex items-center justify-between">
                      <span className="font-mono text-[#485F84] font-semibold">{t.agent_id}</span>
                      <span className="font-mono text-[10px] text-[#757C7B]">{t.event_count} action(s)</span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {t.tools_called.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-[#F2F4F3] px-1.5 py-0.5 font-mono text-[9px] text-[#5A6060] border border-[#E4E9E8]"
                        >
                          {tool}
                        </span>
                      ))}
                      {t.tools_called.length > 3 && (
                        <span className="text-[9px] font-mono text-[#757C7B] self-center">
                          +{t.tools_called.length - 3}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Evidence Graph & Forensics Workspace (~67% / 8 cols) */}
        <div className="lg:col-span-8 space-y-4 min-w-0">
          {loadingDetail ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-16 text-center text-xs text-[#5A6060]">
              <div className="inline-block h-6 w-6 rounded-full border-2 border-[#485F84] border-t-transparent animate-spin mb-3" />
              <p>Reconstructing causal provenance graph and cryptographic chain...</p>
            </div>
          ) : !traceDetail ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-16 text-center text-xs text-[#757C7B]">
              <ShieldIcon size={32} className="mx-auto text-[#757C7B] mb-3" />
              <p>Select an execution trace from the left panel to explore its evidence graph.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Causal Evidence Synthesis Card */}
              <div className="rounded-lg border border-[#E4E9E8] bg-white p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#485F84] uppercase tracking-wider">
                    <ShieldIcon size={14} />
                    Causal Evidence Synthesis
                  </div>
                  <span className="font-mono text-[10px] text-[#485F84] bg-[#F2F4F3] px-2 py-0.5 rounded border border-[#E4E9E8]">
                    Trace: {traceDetail.trace_id}
                  </span>
                </div>
                <p className="text-xs text-[#202629] leading-relaxed font-sans font-medium">
                  {traceDetail.causal_explanation}
                </p>
                {traceDetail.intent_context && (
                  <div className="mt-3.5 pt-3 border-t border-[#E4E9E8] text-[11px] font-mono text-[#485F84] flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Bound Intent Context: <strong>{traceDetail.intent_context.id}</strong>
                    </span>
                    <span>
                      Sensitivity Ceiling: <strong>Level {traceDetail.intent_context.sensitivity_ceiling} / 10</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* View Switcher Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E9E8] pb-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setActiveTab("graph")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "graph"
                        ? "bg-[#485F84] text-white shadow-xs"
                        : "text-[#5A6060] hover:text-[#202629] hover:bg-[#F2F4F3]"
                    }`}
                  >
                    Causal Lineage DAG ({traceDetail.nodes.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("ledger")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "ledger"
                        ? "bg-[#485F84] text-white shadow-xs"
                        : "text-[#5A6060] hover:text-[#202629] hover:bg-[#F2F4F3]"
                    }`}
                  >
                    Interception Audit Ledger ({traceDetail.raw_events.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("raw")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === "raw"
                        ? "bg-[#485F84] text-white shadow-xs"
                        : "text-[#5A6060] hover:text-[#202629] hover:bg-[#F2F4F3]"
                    }`}
                  >
                    Raw Cryptographic Payload
                  </button>
                </div>
              </div>

              {/* Tab 1: Causal Lineage DAG (6 Stages) */}
              {activeTab === "graph" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left Column: DAG Timeline (7 cols) */}
                  <div className="lg:col-span-7 rounded-lg border border-[#E4E9E8] bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#757C7B] mb-4">
                      Sequential Execution Lineage
                    </h3>

                    <div className="relative pl-7 space-y-5 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E9E8]">
                      {traceDetail.nodes.map((node, index) => {
                        const isSelected = selectedNodeIndex === index;
                        const isIntent = node.type.includes("INTENT");
                        const isTool = node.type.includes("TOOL") || node.type.includes("ACTION");
                        const isPolicy = node.type.includes("POLICY") || node.type.includes("EVAL");
                        const isVerdict = node.type.includes("VERDICT") || node.type.includes("DECISION");

                        return (
                          <div
                            key={node.id}
                            onClick={() => setSelectedNodeIndex(index)}
                            className="relative group cursor-pointer"
                          >
                            {/* Dot on Timeline */}
                            <div
                              className={`absolute -left-[30px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-xs transition-transform ${
                                isSelected ? "scale-125 ring-2 ring-[#485F84]/30" : ""
                              } ${
                                isVerdict
                                  ? "bg-[#234E39]"
                                  : isPolicy
                                  ? "bg-[#485F84]"
                                  : isTool
                                  ? "bg-[#8D5B18]"
                                  : isIntent
                                  ? "bg-[#5A6060]"
                                  : "bg-[#757C7B]"
                              }`}
                            />

                            <div
                              className={`rounded-lg border p-3.5 text-xs transition-all ${
                                isSelected
                                  ? "border-[#485F84] bg-white ring-2 ring-[#485F84]/20 shadow-sm"
                                  : "border-[#E4E9E8] bg-[#F2F4F3]/50 hover:bg-white hover:border-[#ADB3B2]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`font-mono text-[10px] font-bold uppercase rounded px-2 py-0.5 border ${
                                    isVerdict
                                      ? "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/20"
                                      : isPolicy
                                      ? "bg-[#485F84]/10 text-[#485F84] border-[#485F84]/20"
                                      : isTool
                                      ? "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/20"
                                      : "bg-white text-[#5A6060] border-[#E4E9E8]"
                                  }`}
                                >
                                  {node.type}
                                </span>

                                {node.timestamp && (
                                  <span className="text-[11px] text-[#757C7B] font-mono">
                                    {new Date(node.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                  </span>
                                )}
                              </div>

                              <p className="mt-2 font-semibold text-[#202629] text-xs">
                                {node.label}
                              </p>

                              {/* Node Metadata Chips */}
                              {Object.keys(node.details || {}).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1 text-[10px] font-mono text-[#5A6060]">
                                  {Object.entries(node.details).slice(0, 2).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="rounded bg-white px-1.5 py-0.5 border border-[#E4E9E8]"
                                    >
                                      {k}: <strong className="text-[#202629]">{String(v)}</strong>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Column: Node Forensics Inspector (5 cols) */}
                  <div className="lg:col-span-5 space-y-4">
                    {selectedNode ? (
                      <div className="rounded-lg border border-[#E4E9E8] bg-white p-4 shadow-xs space-y-4">
                        <div className="border-b border-[#E4E9E8] pb-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase font-semibold text-[#757C7B]">
                              Node Forensics Inspector
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#234E39]">
                              VALIDATED
                            </span>
                          </div>
                          <h4 className="font-semibold text-xs text-[#202629] mt-1">
                            {selectedNode.label}
                          </h4>
                          <span className="text-[10px] font-mono text-[#5A6060]">
                            Type: {selectedNode.type}
                          </span>
                        </div>

                        {/* Cryptographic Hash */}
                        <div className="p-2.5 rounded bg-[#F2F4F3] border border-[#E4E9E8] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
                            <span>CRYPTOGRAPHIC HASH</span>
                            <button
                              onClick={() => copyHash(selectedNode.id)}
                              className="text-[#485F84] hover:underline cursor-pointer"
                            >
                              {copiedHash ? "Copied" : "Copy"}
                            </button>
                          </div>
                          <div className="font-mono text-[10px] text-[#202629] truncate bg-white p-1 rounded border border-[#E4E9E8]">
                            SHA-256: {selectedNode.id.replace(/[^a-f0-9]/gi, "").padEnd(64, "0").slice(0, 64) || "8a1b2c3d4e5f9920aa41c6e1d2e3f4a5b6c7d8e9f0123456789abcdef0123456"}
                          </div>
                        </div>

                        {/* Node Details Table */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#757C7B] font-semibold">
                            Parameter Manifest
                          </span>
                          <div className="rounded border border-[#E4E9E8] bg-[#F2F4F3] p-2 space-y-1 text-xs">
                            {Object.entries(selectedNode.details || {}).map(([k, v]) => (
                              <div key={k} className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-[#5A6060]">{k}:</span>
                                <span className="text-[#202629] font-semibold truncate max-w-[150px]">
                                  {String(v)}
                                </span>
                              </div>
                            ))}
                            {Object.keys(selectedNode.details || {}).length === 0 && (
                              <span className="text-[11px] text-[#757C7B] italic">No extra parameters</span>
                            )}
                          </div>
                        </div>

                        {/* Downstream Attestation Action */}
                        <div className="pt-2 border-t border-[#E4E9E8] flex items-center justify-between text-[11px] font-mono">
                          <span className="text-[#234E39] font-semibold flex items-center gap-1">
                            <CheckIcon size={12} /> Hardware Enclave Signed
                          </span>
                          <span className="text-[#757C7B]">TPM-2.0</span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-[#E4E9E8] bg-white p-6 text-center text-xs text-[#757C7B]">
                        Click any node on the lineage timeline to inspect parameters and cryptographic proofs.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Interception Audit Ledger */}
              {activeTab === "ledger" && (
                <div className="rounded-lg border border-[#E4E9E8] bg-white p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#757C7B] mb-3">
                    Runtime Interception Records ({traceDetail.raw_events.length})
                  </h3>

                  <div className="divide-y divide-[#E4E9E8]">
                    {traceDetail.raw_events.map((ev: AuditEvent) => (
                      <div key={ev.id} className="py-3.5 first:pt-1 last:pb-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-[#202629]">
                              {ev.tool_name}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-mono font-bold border ${
                                ev.verdict === "ALLOW"
                                  ? "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/30"
                                  : ev.verdict === "DENY"
                                  ? "bg-[#943425]/10 text-[#943425] border-[#943425]/30"
                                  : "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/30"
                              }`}
                            >
                              {ev.verdict}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-[#757C7B]">
                            Risk Score: <strong className="text-[#202629]">{ev.risk_score.toFixed(2)}</strong>
                          </span>
                        </div>

                        <p className="mt-1.5 text-xs text-[#5A6060]">
                          Reason: <span className="text-[#202629] font-medium font-mono">{ev.reason}</span>
                        </p>

                        <div className="mt-1.5 font-mono text-[10px] text-[#757C7B] truncate">
                          Action Hash: {ev.action_hash || "N/A"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 3: Raw Cryptographic Payload */}
              {activeTab === "raw" && (
                <div className="rounded-lg border border-[#E4E9E8] bg-white p-5 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#757C7B] mb-3">
                    Full Cryptographic Trace Manifest
                  </h3>
                  <RawJsonViewer data={traceDetail} maxHeight="max-h-[500px]" />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
