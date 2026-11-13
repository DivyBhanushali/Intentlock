// INTENTLOCK 2.0 – Threat Intelligence & Containment Console

"use client";

import { useEffect, useState } from "react";
import { threatsApi, SecurityThreat, ThreatStats } from "@/lib/api";
import { ShieldIcon, LockIcon, AlertTriangleIcon, CheckIcon, XIcon } from "@/components/icons";

export default function ThreatsPage() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ACTIVE");

  const loadData = async () => {
    setLoading(true);
    try {
      const [threatsData, statsData] = await Promise.all([
        threatsApi.list(filter === "ALL" ? undefined : filter),
        threatsApi.stats(),
      ]);
      setThreats(threatsData);
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load threats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleMitigate = async (id: string, status: "MITIGATED" | "DISMISSED") => {
    const note = prompt(`Enter resolution note for threat [${status}]:`, "Operator verified and resolved anomaly.");
    if (!note) return;
    try {
      await threatsApi.mitigate(id, status, note);
      loadData();
    } catch (err) {
      alert("Failed to mitigate: " + String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Threat Intelligence & Anomaly Engine
            </h1>
            <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
              REAL-TIME DETECTION
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Automated detection of rapid policy denials, permission escalation scans, exfiltration probing, and intent boundary tampering.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center rounded-lg border border-[#1a2233] bg-[#0d111a] p-1 text-xs">
          {["ACTIVE", "ALL", "MITIGATED", "DISMISSED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded px-2.5 py-1 font-medium transition-all ${
                filter === tab
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Total Incidents
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-100">{stats.total_threats}</div>
          </div>

          <div className="rounded-xl border border-rose-500/20 bg-rose-950/10 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-400">
              Active Threats
            </span>
            <div className="mt-1 text-2xl font-bold text-rose-400">{stats.active_threats}</div>
          </div>

          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Critical Severity
            </span>
            <div className="mt-1 text-2xl font-bold text-amber-400">{stats.critical_threats}</div>
          </div>

          <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              High Severity
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-200">{stats.high_threats}</div>
          </div>
        </div>
      )}

      {/* Threats List */}
      {loading ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center text-xs text-slate-400">
          Scanning threat telemetry database...
        </div>
      ) : threats.length === 0 ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center">
          <ShieldIcon size={32} className="mx-auto text-emerald-400/60 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">Zero Active Threats Detected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All agent execution traces conform to deterministic security policies and intent boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threats.map((threat) => {
            const isCritical = threat.severity === "CRITICAL";
            const isActive = threat.mitigation_status === "ACTIVE";

            return (
              <div
                key={threat.id}
                className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-5 hover:border-slate-700 transition-all text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{threat.id}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                          isCritical
                            ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                        }`}
                      >
                        {threat.severity}
                      </span>
                      <span className="rounded bg-[#141b29] px-2 py-0.5 text-[9px] font-mono text-slate-400 border border-[#1e293b]">
                        {threat.threat_category}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold border ${
                          isActive
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {threat.mitigation_status}
                      </span>
                    </div>

                    <p className="mt-2 text-slate-300 font-sans leading-relaxed">
                      {threat.description}
                    </p>
                  </div>

                  {isActive && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleMitigate(threat.id, "MITIGATED")}
                        className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
                      >
                        Mitigate
                      </button>
                      <button
                        onClick={() => handleMitigate(threat.id, "DISMISSED")}
                        className="rounded border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>

                {/* Threat Metadata */}
                <div className="mt-3 pt-3 border-t border-[#1a2233] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>Agent: <span className="text-slate-300">{threat.agent_id}</span></span>
                    <span>Rule: <span className="text-rose-400">{threat.detection_rule}</span></span>
                    <span>Action: <span className="text-amber-400">{threat.recommended_response}</span></span>
                  </div>
                  <span>{new Date(threat.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
