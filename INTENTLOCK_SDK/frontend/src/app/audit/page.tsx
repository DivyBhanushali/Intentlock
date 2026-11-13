// INTENTLOCK – Security Audit Log

"use client";

import { useEffect, useState } from "react";
import { auditApi, auditVerifyApi, type AuditEvent, type DecisionVerdict, type AuditVerifyReport } from "@/lib/api";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatDate } from "@/lib/utils";
import { ListIcon, RefreshIcon, InfoIcon, ShieldIcon, CheckCircleIcon } from "@/components/icons";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyReport, setVerifyReport] = useState<AuditVerifyReport | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState<string>("ALL");
  const [toolSearch, setToolSearch] = useState<string>("");
  const [agentSearch, setAgentSearch] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  async function handleVerifyChain() {
    setVerifying(true);
    try {
      const rep = await auditVerifyApi.verify();
      setVerifyReport(rep);
    } catch (err) {
      alert("Failed to verify audit chain: " + String(err));
    } finally {
      setVerifying(false);
    }
  }

  async function fetchEvents() {
    setLoading(true);
    setError(null);
    try {
      const [data, rep] = await Promise.all([
        auditApi.list({
          verdict: verdictFilter !== "ALL" ? verdictFilter : undefined,
          tool_name: toolSearch.trim() || undefined,
          agent_id: agentSearch.trim() || undefined,
          limit: 50,
        }),
        auditVerifyApi.verify().catch(() => null),
      ]);
      setEvents(data);
      if (rep) setVerifyReport(rep);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load audit events");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
  }, [verdictFilter]);

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchEvents();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1a2233] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Security Audit Trail
            </h1>
            <span className="rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-sky-400 border border-sky-500/25">
              Append-Only · Tamper-Evident
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Immutable log of all AI tool authorization decisions, risk assessments, and execution results.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 hover:bg-sky-500/20 transition-all disabled:opacity-50"
          >
            <ShieldIcon size={13} className={verifying ? "animate-spin" : ""} />
            {verifying ? "Verifying..." : "Verify Hash Chain"}
          </button>
          <button
            onClick={fetchEvents}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2233] bg-[#0d111a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121824] hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Cryptographic Hash-Chain Verification Banner */}
      {verifyReport && (
        <div className={`rounded-xl border p-3.5 text-xs flex items-center justify-between ${
          verifyReport.verified
            ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
            : "border-rose-500/30 bg-rose-500/5 text-rose-300"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${verifyReport.verified ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
            <span className="font-semibold">
              {verifyReport.verified ? "Cryptographic Integrity Verified:" : "Integrity Failure:"}
            </span>
            <span className="text-slate-300">{verifyReport.details}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">
            {verifyReport.valid_records} valid records
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-1 gap-3 rounded-xl border border-[#1a2233] bg-[#0d111a] p-3.5 sm:grid-cols-4"
      >
        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Filter by Verdict
          </label>
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
          >
            <option value="ALL">All Decisions</option>
            <option value="ALLOW">ALLOW (Authorized)</option>
            <option value="DENY">DENY (Blocked)</option>
            <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Escalated)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Tool Name
          </label>
          <input
            type="text"
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            placeholder="e.g. email:send"
            className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-400 mb-1">
            Agent ID
          </label>
          <input
            type="text"
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="e.g. support-agent"
            className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none font-mono"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            Apply Query
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Events Table */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] overflow-hidden">
        {events.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListIcon size={24} className="text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">No matching audit events</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Clear or change your filters to search other security events
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2233] bg-[#0a0e17] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Timestamp</th>
                  <th className="px-5 py-2.5">Agent</th>
                  <th className="px-5 py-2.5">Tool Target</th>
                  <th className="px-5 py-2.5">Verdict</th>
                  <th className="px-5 py-2.5">Risk Score</th>
                  <th className="px-5 py-2.5">Enforcement Reason</th>
                  <th className="px-5 py-2.5 text-right">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30]">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-[#121824]/60 transition-colors cursor-pointer"
                  >
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[11px] text-slate-400">
                      {formatDate(ev.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-slate-300">
                      {ev.agent_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono">
                      <span className="rounded bg-[#162032] px-2 py-0.5 text-emerald-400 border border-[#202b3f]">
                        {ev.tool_name || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <VerdictBadge verdict={ev.verdict as DecisionVerdict} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[11px] text-slate-400">
                      {ev.risk_score.toFixed(2)}
                    </td>
                    <td className="max-w-xs truncate px-5 py-2.5 text-[11px] text-slate-400">
                      {ev.reason}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 text-right font-mono text-[11px]">
                      {ev.execution_success === true ? (
                        <span className="text-emerald-400 font-semibold">SUCCESS</span>
                      ) : ev.execution_success === false ? (
                        <span className="text-rose-400 font-semibold">FAILED</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-[#202b3f] bg-[#0f1420] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Security Event Audit Record
                </h3>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  ID: {selectedEvent.id}
                </p>
              </div>
              <VerdictBadge verdict={selectedEvent.verdict as DecisionVerdict} />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Timestamp:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{formatDate(selectedEvent.timestamp)}</p>
                </div>
                <div>
                  <span className="text-slate-400">Agent ID:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedEvent.agent_id || "—"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Tool Target:</span>
                  <p className="font-mono text-emerald-400 mt-0.5">{selectedEvent.tool_name || "—"}</p>
                </div>
                <div>
                  <span className="text-slate-400">Policy Reference:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedEvent.policy_id || "—"}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Authorization Reason:</span>
                <p className="mt-1 rounded bg-[#0a0e17] p-2.5 text-xs text-slate-300 border border-[#1a2233]">
                  {selectedEvent.reason}
                </p>
              </div>

              {selectedEvent.action_hash && (
                <div>
                  <span className="text-slate-400">Canonical Action Hash:</span>
                  <p className="font-mono text-[11px] break-all bg-[#0a0e17] p-2 rounded border border-[#1a2233] text-slate-400 mt-1">
                    {selectedEvent.action_hash}
                  </p>
                </div>
              )}

              {selectedEvent.approval_id && (
                <div>
                  <span className="text-slate-400">Linked Approval ID:</span>
                  <p className="font-mono text-[11px] text-amber-400 mt-1">{selectedEvent.approval_id}</p>
                </div>
              )}

              <div>
                <span className="text-slate-400">Event Metadata (JSON):</span>
                <pre className="font-mono text-[11px] bg-[#0a0e17] p-3 rounded border border-[#1a2233] text-slate-300 overflow-x-auto max-h-36 mt-1">
                  {JSON.stringify(selectedEvent.metadata_json, null, 2)}
                </pre>
              </div>
            </div>

            <div className="mt-5 flex justify-end pt-3 border-t border-[#1a2233]">
              <button
                onClick={() => setSelectedEvent(null)}
                className="rounded border border-[#1a2233] px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-[#121824]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
