// SICTACK – SOC Data Provenance & Execution Integrity Console (Phase 4D)
// Product: SICTACK — Global AI Agent Runtime Security Infrastructure
// "Secure the action. Protect the intention."

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  provenanceApi,
  integrityApi,
  type DataProvenanceItem,
  type ProvenanceLineageNodeItem,
  type ExecutionIntegrityItem,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationIcon,
  RefreshIcon,
  TerminalIcon,
} from "@/components/icons";

export default function SocProvenancePage() {
  const [provenanceRecords, setProvenanceRecords] = useState<DataProvenanceItem[]>([]);
  const [integrityRecords, setIntegrityRecords] = useState<ExecutionIntegrityItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<DataProvenanceItem | null>(null);
  const [lineageTree, setLineageTree] = useState<ProvenanceLineageNodeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"records" | "integrity" | "verifier">("records");
  const [trustFilter, setTrustFilter] = useState<string>("ALL");
  const [agentFilter, setAgentFilter] = useState<string>("");

  // Trust Verification Playground State
  const [verifyClaimedTrust, setVerifyClaimedTrust] = useState("TRUSTED_CONTROL");
  const [verifyParentIds, setVerifyParentIds] = useState("");
  const [verifyResult, setVerifyResult] = useState<{ is_valid: boolean; effective_trust_level: string; reason: string } | null>(null);

  const loadLineage = useCallback(async (recordId: string) => {
    try {
      const tree = await provenanceApi.getLineage(recordId);
      setLineageTree(tree);
    } catch {
      setLineageTree(null);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadTelemetry() {
      try {
        const [provList, integList] = await Promise.all([
          provenanceApi.listRecords({ limit: 50 }).catch(() => []),
          integrityApi.listRecords({ limit: 50 }).catch(() => []),
        ]);
        if (!ignore) {
          setProvenanceRecords(provList);
          setIntegrityRecords(integList);
          if (provList.length > 0) {
            setSelectedRecord(provList[0]);
            try {
              const tree = await provenanceApi.getLineage(provList[0].id);
              if (!ignore) setLineageTree(tree);
            } catch {
              if (!ignore) setLineageTree(null);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load provenance telemetry:", e);
      } finally {
        if (!ignore) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    void loadTelemetry();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [provList, integList] = await Promise.all([
        provenanceApi.listRecords({ limit: 50 }).catch(() => []),
        integrityApi.listRecords({ limit: 50 }).catch(() => []),
      ]);
      setProvenanceRecords(provList);
      setIntegrityRecords(integList);
      if (provList.length > 0) {
        const target = selectedRecord
          ? provList.find((r) => r.id === selectedRecord.id) || provList[0]
          : provList[0];
        setSelectedRecord(target);
        await loadLineage(target.id);
      }
    } catch (e) {
      console.error("Failed to refresh provenance telemetry:", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSelectRecord = (record: DataProvenanceItem) => {
    setSelectedRecord(record);
    loadLineage(record.id);
  };

  const handleVerifyTrust = async (e: React.FormEvent) => {
    e.preventDefault();
    const parentIds = verifyParentIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      const res = await provenanceApi.verifyTrust({
        claimed_trust_level: verifyClaimedTrust,
        parent_provenance_ids: parentIds,
      });
      setVerifyResult(res);
    } catch (err: unknown) {
      setVerifyResult({
        is_valid: false,
        effective_trust_level: "UNKNOWN_OR_UNVERIFIED",
        reason: err instanceof Error ? err.message : "Verification request failed",
      });
    }
  };

  const filteredRecords = provenanceRecords.filter((r) => {
    if (trustFilter !== "ALL" && r.trust_level !== trustFilter) return false;
    if (agentFilter && !r.agent_id.toLowerCase().includes(agentFilter.toLowerCase())) return false;
    return true;
  });

  const getTrustBadgeClass = (level: string) => {
    switch (level) {
      case "TRUSTED_CONTROL":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "AUTHENTICATED_USER_INPUT":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "VERIFIED_INTERNAL_DATA":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/30";
      case "UNTRUSTED_EXTERNAL_DATA":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 p-6 md:p-8">
      {/* Top Banner Navigation */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-semibold tracking-wider uppercase rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              SICTACK PROVENANCE
            </span>
            <span className="text-xs text-slate-400">Phase 4D Active Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-1">
            Data Provenance & Execution Integrity Console
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Cryptographic causal ancestry DAGs, trust boundary enforcement, and TOCTOU anti-replay monitoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/soc/core"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-600 transition"
          >
            SICTACK CORE
          </Link>
          <Link
            href="/soc/sentinel"
            className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 border border-slate-700 rounded-lg hover:border-slate-600 transition"
          >
            SICTACK SENTINEL
          </Link>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition disabled:opacity-50"
          >
            <RefreshIcon className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Tracked Records</span>
            <ShieldIcon className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white">{provenanceRecords.length}</div>
          <p className="text-xs text-slate-500 mt-1">Immutable HMAC-SHA256 DAG nodes</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">External Ingestions</span>
            <ExclamationIcon className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400">
            {provenanceRecords.filter((r) => r.trust_level === "UNTRUSTED_EXTERNAL_DATA").length}
          </div>
          <p className="text-xs text-slate-500 mt-1">Strictly constrained external inputs</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Execution Validations</span>
            <TerminalIcon className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-cyan-400">{integrityRecords.length}</div>
          <p className="text-xs text-slate-500 mt-1">Single-use anti-replay verified calls</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs uppercase tracking-wider font-medium">Integrity Violations</span>
            <XCircleIcon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-rose-400">
            {integrityRecords.filter((r) => r.status !== "VALID").length}
          </div>
          <p className="text-xs text-slate-500 mt-1">TOCTOU tampering or replays blocked</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto flex gap-2 border-b border-slate-800 mb-6">
        <button
          onClick={() => setActiveTab("records")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === "records"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Provenance Lineage Graph
        </button>
        <button
          onClick={() => setActiveTab("integrity")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === "integrity"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Execution Integrity Log (TOCTOU)
        </button>
        <button
          onClick={() => setActiveTab("verifier")}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 transition ${
            activeTab === "verifier"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          Trust Boundary Validator
        </button>
      </div>

      {/* Main Tab Views */}
      <div className="max-w-7xl mx-auto">
        {activeTab === "records" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left list */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Filter by agent ID..."
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={trustFilter}
                  onChange={(e) => setTrustFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="ALL">All Trust Levels</option>
                  <option value="TRUSTED_CONTROL">TRUSTED_CONTROL</option>
                  <option value="AUTHENTICATED_USER_INPUT">AUTHENTICATED_USER_INPUT</option>
                  <option value="VERIFIED_INTERNAL_DATA">VERIFIED_INTERNAL_DATA</option>
                  <option value="UNTRUSTED_EXTERNAL_DATA">UNTRUSTED_EXTERNAL_DATA</option>
                  <option value="UNKNOWN_OR_UNVERIFIED">UNKNOWN_OR_UNVERIFIED</option>
                </select>
              </div>

              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {loading ? (
                  <div className="text-xs text-slate-500 p-4">Loading provenance records...</div>
                ) : filteredRecords.length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 border border-slate-800/80 rounded-xl bg-slate-900/40">
                    No provenance records found.
                  </div>
                ) : (
                  filteredRecords.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleSelectRecord(r)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition ${
                        selectedRecord?.id === r.id
                          ? "bg-indigo-500/10 border-indigo-500/40"
                          : "bg-slate-900/50 border-slate-800/70 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-medium text-white">{r.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${getTrustBadgeClass(r.trust_level)}`}>
                          {r.trust_level}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-300 truncate">
                        <span className="text-slate-500">Source:</span> {r.source_identifier}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Agent: {r.agent_id}</span>
                        <span>{formatDate(r.created_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right details & Lineage Graph */}
            <div className="lg:col-span-7">
              {selectedRecord ? (
                <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-base font-semibold text-white">Record Details</h2>
                      <span className={`text-xs px-2.5 py-0.5 rounded border font-medium ${getTrustBadgeClass(selectedRecord.trust_level)}`}>
                        {selectedRecord.trust_level}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{selectedRecord.id}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 block">Source Classification</span>
                      <span className="text-slate-200 font-medium">{selectedRecord.source_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Data Classification</span>
                      <span className="text-slate-200 font-medium">{selectedRecord.data_classification}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Agent Identity</span>
                      <span className="text-slate-200 font-medium">{selectedRecord.agent_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Transformation Type</span>
                      <span className="text-slate-200 font-medium">{selectedRecord.transformation_type || "None (Ingress)"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 block mb-1">Cryptographic Digests</span>
                    <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-[11px] space-y-1 text-slate-400 border border-slate-800/60">
                      <div><span className="text-slate-500">Input Hash:</span> {selectedRecord.input_hash}</div>
                      <div><span className="text-slate-500">Output Hash:</span> {selectedRecord.output_hash}</div>
                      <div><span className="text-slate-500">Signature:</span> {selectedRecord.signature}</div>
                    </div>
                  </div>

                  {/* Lineage Tree */}
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Causal Ancestry Lineage (DAG)
                    </h3>
                    {lineageTree ? (
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <CheckCircleIcon className="w-4 h-4" />
                          <span>{lineageTree.record_id} ({lineageTree.source_type})</span>
                        </div>
                        {lineageTree.parent_nodes && lineageTree.parent_nodes.length > 0 ? (
                          lineageTree.parent_nodes.map((p, idx) => (
                            <div key={idx} className="ml-5 pl-3 border-l-2 border-slate-800 space-y-2">
                              <div className="text-slate-300">
                                ↳ <span className="text-slate-400">{p.record_id}</span> [{p.trust_level}]
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">{p.source_identifier}</div>
                              {p.parent_nodes && p.parent_nodes.map((gp, gidx) => (
                                <div key={gidx} className="ml-4 pl-3 border-l border-slate-800/60 text-slate-400">
                                  ↳ {gp.record_id} [{gp.trust_level}]
                                </div>
                              ))}
                            </div>
                          ))
                        ) : (
                          <div className="text-slate-500 text-[11px] ml-6">Genesis node (root of causal ancestry)</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Lineage tree unavailable.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 border border-slate-800 rounded-xl bg-slate-900/30">
                  Select a provenance record to inspect causal graph and cryptographic signatures.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "integrity" && (
          <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800">
            <h2 className="text-base font-semibold text-white mb-1">Execution Request Integrity Audit Log</h2>
            <p className="text-xs text-slate-400 mb-4">
              Defends against Time-of-Check to Time-of-Use (TOCTOU) parameter alteration and token replays.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2.5">Status</th>
                    <th className="pb-2.5">Tool Name</th>
                    <th className="pb-2.5">Agent</th>
                    <th className="pb-2.5">Digest</th>
                    <th className="pb-2.5">Nonce</th>
                    <th className="pb-2.5">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {integrityRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500 font-sans">
                        No integrity validation records logged yet.
                      </td>
                    </tr>
                  ) : (
                    integrityRecords.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                              r.status === "VALID"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-white font-sans">{r.tool_name}</td>
                        <td className="py-2.5 text-slate-400">{r.agent_id}</td>
                        <td className="py-2.5 text-slate-400 truncate max-w-[140px]">{r.request_digest}</td>
                        <td className="py-2.5 text-slate-500 truncate max-w-[120px]">{r.nonce}</td>
                        <td className="py-2.5 text-slate-500 font-sans">{formatDate(r.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "verifier" && (
          <div className="max-w-2xl p-6 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Interactive Trust Elevation Verifier</h2>
              <p className="text-xs text-slate-400 mt-1">
                Tests the core SICTACK invariant: Untrusted external data can NEVER elevate to TRUSTED_CONTROL.
              </p>
            </div>

            <form onSubmit={handleVerifyTrust} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Claimed Trust Level</label>
                <select
                  value={verifyClaimedTrust}
                  onChange={(e) => setVerifyClaimedTrust(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="TRUSTED_CONTROL">TRUSTED_CONTROL</option>
                  <option value="AUTHENTICATED_USER_INPUT">AUTHENTICATED_USER_INPUT</option>
                  <option value="VERIFIED_INTERNAL_DATA">VERIFIED_INTERNAL_DATA</option>
                  <option value="UNTRUSTED_EXTERNAL_DATA">UNTRUSTED_EXTERNAL_DATA</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Parent Provenance IDs (comma-separated)</label>
                <input
                  type="text"
                  placeholder="prov_xxx, prov_yyy"
                  value={verifyParentIds}
                  onChange={(e) => setVerifyParentIds(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
              >
                Validate Trust Propagation Invariant
              </button>
            </form>

            {verifyResult && (
              <div
                className={`p-4 rounded-xl border text-xs space-y-1 mt-4 ${
                  verifyResult.is_valid
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                }`}
              >
                <div className="font-semibold">
                  {verifyResult.is_valid ? "✓ Trust Propagation Allowed" : "✗ Trust Boundary Violation"}
                </div>
                <div>Effective Trust: {verifyResult.effective_trust_level}</div>
                <div className="text-[11px] opacity-80">{verifyResult.reason}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Strategic Ecosystem Footer Note */}
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-slate-900 text-center text-xs text-slate-600 space-y-1">
        <div>SICTACK — The Security Infrastructure for the Autonomous AI Economy</div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span>SICTACK CORE — Active</span>
          <span>•</span>
          <span>SICTACK SENTINEL — Active</span>
          <span>•</span>
          <span>SICTACK LABS — Research Initiative</span>
          <span>•</span>
          <span>SICTACK CLOUD — Planned Platform</span>
        </div>
      </div>
    </div>
  );
}
