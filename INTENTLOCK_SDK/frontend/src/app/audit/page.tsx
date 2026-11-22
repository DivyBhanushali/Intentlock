// SICTACK – Cryptographic Security Audit Log
// Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState, useMemo } from "react";
import {
  auditApi,
  auditVerifyApi,
  type AuditEvent,
  type AuditVerifyReport,
} from "@/lib/api";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatDate } from "@/lib/utils";
import {
  ListIcon,
  RefreshIcon,
  ShieldIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationIcon,
} from "@/components/icons";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cryptographic Verification State
  const [verifyReport, setVerifyReport] = useState<AuditVerifyReport | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState<string>("ALL");
  const [toolSearch, setToolSearch] = useState<string>("");
  const [agentSearch, setAgentSearch] = useState<string>("");
  const [activeQuery, setActiveQuery] = useState({
    verdict: "ALL",
    tool: "",
    agent: "",
  });

  // Modal Inspection
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadInitialAudit() {
      try {
        const [data, rep] = await Promise.all([
          auditApi.list({ limit: 100 }),
          auditVerifyApi.verify().catch(() => null),
        ]);
        if (!ignore) {
          setEvents(data);
          if (rep) setVerifyReport(rep);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load audit ledger");
          setLoading(false);
        }
      }
    }

    void loadInitialAudit();

    return () => {
      ignore = true;
    };
  }, []);

  const fetchEventsWithFilters = async (
    vFilter = activeQuery.verdict,
    tSearch = activeQuery.tool,
    aSearch = activeQuery.agent
  ) => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await auditApi.list({
        verdict: vFilter !== "ALL" ? vFilter : undefined,
        tool_name: tSearch.trim() || undefined,
        agent_id: aSearch.trim() || undefined,
        limit: 100,
      });
      setEvents(data);
      setActiveQuery({ verdict: vFilter, tool: tSearch, agent: aSearch });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to filter audit events");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVerifyChain = async () => {
    setVerifying(true);
    try {
      const rep = await auditVerifyApi.verify();
      setVerifyReport(rep);
    } catch (err) {
      alert("Failed to verify audit hash chain: " + String(err));
    } finally {
      setVerifying(false);
    }
  };

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEventsWithFilters(verdictFilter, toolSearch, agentSearch);
  };

  const handleResetFilters = () => {
    setVerdictFilter("ALL");
    setToolSearch("");
    setAgentSearch("");
    fetchEventsWithFilters("ALL", "", "");
  };

  // Metrics
  const allowedCount = useMemo(
    () => events.filter((e) => e.verdict === "ALLOW").length,
    [events]
  );
  const blockedCount = useMemo(
    () => events.filter((e) => e.verdict === "DENY").length,
    [events]
  );

  return (
    <div className="space-y-8 font-sans text-[#202629]">
      {/* ─── A. PAGE HEADER ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E4E9E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202629]">
              Security Audit Ledger
            </h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#485F84] bg-[#D5E3FF]/30 border border-[#485F84]/20">
              APPEND-ONLY &middot; CRYPTOGRAPHICALLY SIGNED
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5A6063] max-w-2xl leading-relaxed">
            Immutable, hash-chained ledger recording every autonomous agent tool authorization
            decision, calculated risk score, policy stage evaluation, and execution outcome.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleVerifyChain}
            disabled={verifying}
            className="inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            title="Perform SHA-256 HMAC cryptographic chain verification"
          >
            <ShieldIcon size={13} className={verifying ? "animate-spin" : ""} />
            <span>{verifying ? "Verifying Ledger..." : "Verify Hash Chain"}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchEventsWithFilters()}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Audit Events"
          >
            <RefreshIcon size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>
        </div>
      </header>

      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="rounded-lg border border-[#F8D5D0] bg-[#FDF1EF] p-4 text-xs text-[#943425] flex items-start gap-3">
          <XCircleIcon size={16} className="shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-[#202629]">Connection Error</div>
            <p className="text-[#5A6063] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* ─── B. CRYPTOGRAPHIC INTEGRITY VERIFICATION BANNER ─── */}
      {verifyReport && (
        <section
          className={`rounded-lg border p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
            verifyReport.verified
              ? "border-[#D4E8DC] bg-[#EDF5F0] text-[#234E39]"
              : "border-[#F8D5D0] bg-[#FDF1EF] text-[#943425]"
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            {verifyReport.verified ? (
              <CheckCircleIcon size={18} className="shrink-0 mt-0.5 sm:mt-0 text-[#234E39]" />
            ) : (
              <ExclamationIcon size={18} className="shrink-0 mt-0.5 sm:mt-0 text-[#943425]" />
            )}
            <div>
              <div className="font-semibold text-[#202629]">
                {verifyReport.verified
                  ? "Cryptographic Hash Chain Verified (SHA-256 HMAC)"
                  : "Ledger Corruption Detected"}
              </div>
              <p className="text-[#5A6063] mt-0.5">{verifyReport.details}</p>
            </div>
          </div>

          <div className="font-mono text-[11px] shrink-0 self-start sm:self-auto text-right">
            <span className="text-[#202629] font-semibold">{verifyReport.valid_records}</span> records
            sequentially linked
          </div>
        </section>
      )}

      {/* ─── C. METRICS STRIP ─── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Ledger Records Loaded</span>
            <ListIcon size={15} className="text-[#787E81]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#202629]">
            {loading ? "—" : events.length}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Events matching current query window
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Allowed Executions</span>
            <CheckCircleIcon size={15} className="text-[#234E39]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#234E39]">
            {loading ? "—" : allowedCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Operations that cleared deterministic policy
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Blocked Invocations</span>
            <XCircleIcon size={15} className="text-[#943425]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#943425]">
            {loading ? "—" : blockedCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Halted at execution boundary (fail-closed)
          </div>
        </div>
      </section>

      {/* ─── D. INVESTIGATION FILTER BAR ─── */}
      <form
        onSubmit={handleFilterSubmit}
        className="grid grid-cols-1 gap-3 rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 sm:grid-cols-4 text-xs shadow-xs"
      >
        <div>
          <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
            Decision Verdict
          </label>
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-mono text-[#202629] focus:border-[#485F84] focus:outline-none"
          >
            <option value="ALL">All Verdicts</option>
            <option value="ALLOW">ALLOW (Authorized)</option>
            <option value="DENY">DENY (Halted)</option>
            <option value="REQUIRE_APPROVAL">REQUIRE_APPROVAL (Escalated)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
            Tool Target
          </label>
          <input
            type="text"
            value={toolSearch}
            onChange={(e) => setToolSearch(e.target.value)}
            placeholder="e.g. database:query"
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
            Originating Agent ID
          </label>
          <input
            type="text"
            value={agentSearch}
            onChange={(e) => setAgentSearch(e.target.value)}
            placeholder="e.g. support-agent"
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 rounded border border-[#485F84] bg-[#485F84] px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all cursor-pointer shadow-xs"
          >
            Apply Query
          </button>
          {(activeQuery.verdict !== "ALL" || activeQuery.tool || activeQuery.agent) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="rounded border border-[#E4E9E8] bg-transparent px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* ─── E. AUDIT EVENTS TABLE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#787E81] font-mono">
            Loading cryptographic audit records...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ListIcon size={24} className="text-[#787E81] mb-2" />
            <p className="text-xs font-semibold text-[#202629]">No matching audit events</p>
            <p className="mt-1 text-[11px] text-[#787E81] max-w-sm">
              No runtime records match the current query parameters. Clear filters to inspect all
              historical telemetry.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] transition-colors cursor-pointer shadow-xs"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9E8] bg-[#F2F4F3] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5A6063]">
                  <th className="px-5 py-3">Timestamp (UTC)</th>
                  <th className="px-5 py-3">Agent Principal</th>
                  <th className="px-5 py-3">Tool Target</th>
                  <th className="px-5 py-3">Verdict</th>
                  <th className="px-5 py-3">Risk Score</th>
                  <th className="px-5 py-3">Enforcement Reason</th>
                  <th className="px-5 py-3 text-right">Execution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E8]">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-[#F8F9F8] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#787E81] whitespace-nowrap">
                      {formatDate(ev.timestamp)}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#202629] whitespace-nowrap">
                      {ev.agent_id || "—"}
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] whitespace-nowrap">
                      <span className="rounded bg-[#F2F4F3] px-2 py-0.5 text-[#485F84] border border-[#E4E9E8] font-semibold">
                        {ev.tool_name}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <VerdictBadge verdict={ev.verdict} />
                    </td>

                    <td className="px-5 py-3.5 font-mono text-[11px] text-[#5A6063] whitespace-nowrap">
                      {ev.risk_score.toFixed(2)}
                    </td>

                    <td className="px-5 py-3.5 text-[11px] text-[#5A6063] max-w-md truncate" title={ev.reason}>
                      {ev.reason}
                    </td>

                    <td className="px-5 py-3.5 text-right font-mono text-[11px] text-[#485F84] whitespace-nowrap">
                      <span className="hover:underline font-semibold">Inspect &rarr;</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── F. FORENSIC EVENT INSPECTION MODAL ─── */}
      {selectedEvent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="audit-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#202629]/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="w-full max-w-2xl rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E4E9E8] pb-3">
              <div className="flex items-center gap-2">
                <h3 id="audit-modal-title" className="text-base font-semibold text-[#202629]">
                  Cryptographic Audit Record
                </h3>
                <VerdictBadge verdict={selectedEvent.verdict} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-[#787E81] hover:text-[#202629] text-base p-1 cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded border border-[#E4E9E8] bg-[#F8F9F8]">
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Record UUID</span>
                  <span className="font-mono text-[#202629] text-[11px] select-all">
                    {selectedEvent.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Timestamp</span>
                  <span className="font-mono text-[#5A6063] text-[11px]">
                    {formatDate(selectedEvent.timestamp)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Agent Principal</span>
                  <span className="font-mono font-semibold text-[#202629]">
                    {selectedEvent.agent_id || "Unregistered"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Tool Invocation</span>
                  <span className="font-mono font-semibold text-[#485F84]">
                    {selectedEvent.tool_name}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                  Sequential SHA-256 HMAC Action Hash
                </span>
                <div className="p-2.5 rounded bg-[#F2F4F3] border border-[#E4E9E8] font-mono text-[11px] text-[#202629] break-all select-all">
                  {selectedEvent.action_hash || "0x00000000000000000000000000000000"}
                </div>
              </div>

              {selectedEvent.metadata_json && (
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                    Event Execution Metadata & Parameters
                  </span>
                  <pre className="p-3 rounded bg-[#0C0F0E] text-[#BEEDD1] border border-[#282A30] font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedEvent.metadata_json, null, 2)}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                  Enforcement Justification & Policy Stage Log
                </span>
                <p className="p-3 rounded bg-[#F8F9F8] border border-[#E4E9E8] text-[#5A6063] leading-relaxed">
                  {selectedEvent.reason}
                </p>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                  Complete Canonical Event Payload
                </span>
                <pre className="p-3 rounded bg-[#0C0F0E] text-[#ADB3B2] border border-[#282A30] font-mono text-[10px] overflow-x-auto max-h-48 custom-scrollbar">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E4E9E8]">
              <span className="text-[10px] font-mono text-[#787E81]">
                Risk Score: {selectedEvent.risk_score.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="px-3 py-1.5 rounded border border-[#E4E9E8] bg-transparent text-xs font-medium text-[#5A6063] hover:text-[#202629] transition-colors cursor-pointer"
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
