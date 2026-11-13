// INTENTLOCK 2.0 – Provenance & Evidence Graph Explorer

"use client";

import { useEffect, useState } from "react";
import { provenanceApi, TraceSummary, ProvenanceDetail } from "@/lib/api";
import { DocumentIcon, ShieldIcon, CheckIcon, XIcon, ClockIcon, TerminalIcon } from "@/components/icons";

export default function ProvenancePage() {
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [traceDetail, setTraceDetail] = useState<ProvenanceDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    async function loadTraces() {
      setLoadingList(true);
      try {
        const data = await provenanceApi.listTraces(50);
        setTraces(data);
        if (data.length > 0) {
          setSelectedTraceId(data[0].trace_id);
        }
      } catch (err) {
        console.error("Failed to load traces", err);
      } finally {
        setLoadingList(false);
      }
    }
    loadTraces();
  }, []);

  useEffect(() => {
    if (!selectedTraceId) return;
    async function loadDetail() {
      setLoadingDetail(true);
      try {
        const detail = await provenanceApi.getDetail(selectedTraceId!);
        setTraceDetail(detail);
      } catch (err) {
        console.error("Failed to load trace detail", err);
      } finally {
        setLoadingDetail(false);
      }
    }
    loadDetail();
  }, [selectedTraceId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Execution Provenance & Evidence Graph
          </h1>
          <span className="rounded bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
            CAUSAL RECONSTRUCTION
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Traceable end-to-end evidence linking user objectives, IntentContexts, agent actions, policy evaluations, and outcomes.
        </p>
      </div>

      {/* Main Grid: Left Traces List, Right Evidence Graph */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Trace List (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Execution Traces ({traces.length})
            </span>
          </div>

          {loadingList ? (
            <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-8 text-center text-xs text-slate-400">
              Loading trace indices...
            </div>
          ) : traces.length === 0 ? (
            <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-8 text-center text-xs text-slate-500">
              No execution traces recorded yet.
            </div>
          ) : (
            <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
              {traces.map((t) => {
                const isSelected = selectedTraceId === t.trace_id;
                const hasDenial = t.verdicts.includes("DENY");
                const hasApproval = t.verdicts.includes("REQUIRE_APPROVAL");

                return (
                  <button
                    key={t.trace_id}
                    onClick={() => setSelectedTraceId(t.trace_id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      isSelected
                        ? "border-sky-500/40 bg-sky-950/20 shadow-lg"
                        : "border-[#1a2233] bg-[#0d111a] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-200 truncate max-w-[170px]">
                        {t.trace_id}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                          hasDenial
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                            : hasApproval
                            ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        }`}
                      >
                        {hasDenial ? "DENIED" : hasApproval ? "APPROVAL" : "ALLOWED"}
                      </span>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="font-mono text-slate-300">{t.agent_id}</span>
                      <span>{t.event_count} action(s)</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {t.tools_called.slice(0, 3).map((tool) => (
                        <span
                          key={tool}
                          className="rounded bg-[#141b29] px-1.5 py-0.2 font-mono text-[9px] text-slate-400 border border-[#1e293b]"
                        >
                          {tool}
                        </span>
                      ))}
                      {t.tools_called.length > 3 && (
                        <span className="text-[9px] text-slate-500">+{t.tools_called.length - 3}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Evidence Graph & Timeline (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {loadingDetail ? (
            <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-16 text-center text-xs text-slate-400">
              Reconstructing causal provenance graph...
            </div>
          ) : !traceDetail ? (
            <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-16 text-center text-xs text-slate-500">
              Select an execution trace from the left panel to explore its evidence graph.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Causal Explanation Card */}
              <div className="rounded-xl border border-sky-500/30 bg-sky-950/15 p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <ShieldIcon size={14} />
                  Causal Evidence Synthesis
                </div>
                <p className="mt-1.5 text-xs text-slate-200 leading-relaxed font-sans">
                  {traceDetail.causal_explanation}
                </p>
                {traceDetail.intent_context && (
                  <div className="mt-3 pt-3 border-t border-sky-500/20 text-[11px] font-mono text-sky-300 flex items-center justify-between">
                    <span>Bound Intent: {traceDetail.intent_context.id}</span>
                    <span>Ceiling: Level {traceDetail.intent_context.sensitivity_ceiling}</span>
                  </div>
                )}
              </div>

              {/* Provenance Graph Nodes */}
              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                  Causal Relationship Pipeline
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1a2233]">
                  {traceDetail.nodes.map((node, i) => (
                    <div key={node.id} className="relative group">
                      <div className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full border-2 border-[#0a0e17] bg-sky-400" />
                      <div className="rounded-lg border border-[#1a2233] bg-[#07090e] p-3 text-xs hover:border-slate-700 transition-all">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-sky-400 uppercase">
                            [{node.type}]
                          </span>
                          {node.timestamp && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(node.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-semibold text-slate-200">{node.label}</p>

                        {/* Node details */}
                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                          {Object.entries(node.details).map(([k, v]) => (
                            <span key={k} className="rounded bg-[#121824] px-1.5 py-0.5 border border-[#1a2233]">
                              {k}: <span className="text-slate-300">{String(v)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Action Interception Ledger */}
              <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Interception Audit Records ({traceDetail.raw_events.length})
                </h3>

                <div className="divide-y divide-[#1a2233]">
                  {traceDetail.raw_events.map((ev) => (
                    <div key={ev.id} className="py-3 first:pt-0 last:pb-0 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-200">{ev.tool_name}</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${
                              ev.verdict === "ALLOW"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                                : ev.verdict === "DENY"
                                ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                                : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {ev.verdict}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">
                          Risk: {ev.risk_score.toFixed(2)}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400">
                        Reason: <span className="text-slate-300 font-mono">{ev.reason}</span>
                      </p>
                      <div className="mt-1 font-mono text-[9px] text-slate-500 truncate">
                        Action Hash: {ev.action_hash || "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

