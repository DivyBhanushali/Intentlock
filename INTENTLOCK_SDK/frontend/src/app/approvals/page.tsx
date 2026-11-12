// INTENTLOCK – Human Approvals Queue

"use client";

import { useEffect, useState } from "react";
import { approvalsApi, type Approval, type ApprovalStatus } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import { ClockIcon, CheckCircleIcon, XCircleIcon, RefreshIcon, InfoIcon, KeyIcon } from "@/components/icons";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const data = await approvalsApi.list();
      setApprovals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load approval requests");
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setActionInProgress(id);
    try {
      await approvalsApi.approve(id, "admin@intentlock.io", "Approved via Security Dashboard");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approval action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  async function handleReject(id: string) {
    setActionInProgress(id);
    try {
      await approvalsApi.reject(id, "admin@intentlock.io", "Rejected via Security Dashboard");
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rejection action failed");
    } finally {
      setActionInProgress(null);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const filteredApprovals = approvals.filter((item) => {
    if (filter === "ALL") return true;
    return item.status === filter;
  });

  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1a2233] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Human-in-the-Loop Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/30">
                {pendingCount} Awaiting Authorization
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Sensitive AI actions intercepted at runtime requiring human verification before execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2233] bg-[#0d111a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121824] hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Understandable Explainer Banner */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-amber-500/10 p-1.5 text-amber-400 border border-amber-500/20 mt-0.5">
            <KeyIcon size={16} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Cryptographic Replay Protection: </span>
            <span className="text-slate-400">
              Each approval token is SHA-256 hash-bound to the exact tool name and parameter arguments. Tokens are single-use, time-limited, and cannot be replayed or reused for altered parameters.
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#1a2233] pb-2 text-xs">
        {["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 font-medium transition-colors ${
              filter === tab
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab}
            {tab === "PENDING" && pendingCount > 0 && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Approvals Table */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] overflow-hidden">
        {filteredApprovals.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClockIcon size={24} className="text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">
              No {filter !== "ALL" ? filter.toLowerCase() : ""} approval requests found
            </p>
            <p className="mt-1 text-[11px] text-slate-500">
              When an agent invokes a tool classified under require_approval, it will pause and appear here
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2233] bg-[#0a0e17] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Target Tool</th>
                  <th className="px-5 py-2.5">Agent Identity</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Requested At</th>
                  <th className="px-5 py-2.5">Expires</th>
                  <th className="px-5 py-2.5">Action Hash</th>
                  <th className="px-5 py-2.5 text-right">Human Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30]">
                {filteredApprovals.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-[#121824]/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedApproval(req)}
                  >
                    <td className="whitespace-nowrap px-5 py-3 font-mono font-medium text-amber-400">
                      <span className="rounded bg-amber-500/10 px-2 py-0.5 border border-amber-500/20">
                        {req.tool_name}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-300">
                      {req.agent_id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <StatusBadge status={req.status as ApprovalStatus} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">
                      {formatDate(req.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">
                      {formatDate(req.expires_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-500">
                      {req.action_hash.slice(0, 12)}…
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {req.status === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            disabled={actionInProgress === req.id}
                            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
                          >
                            <CheckCircleIcon size={12} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={actionInProgress === req.id}
                            className="inline-flex items-center gap-1 rounded border border-rose-500/30 px-2.5 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
                          >
                            <XCircleIcon size={12} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono text-[11px] text-slate-500">
                          {req.consumed ? "TOKEN_CONSUMED" : req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedApproval && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          onClick={() => setSelectedApproval(null)}
        >
          <div
            className="w-full max-w-xl rounded-xl border border-[#202b3f] bg-[#0f1420] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#1a2233] pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Approval Request Security Audit
                </h3>
                <p className="font-mono text-[11px] text-slate-500 mt-0.5">
                  ID: {selectedApproval.id}
                </p>
              </div>
              <StatusBadge status={selectedApproval.status as ApprovalStatus} />
            </div>

            <div className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400">Target Tool:</span>
                  <p className="font-mono font-medium text-amber-400 mt-0.5">{selectedApproval.tool_name}</p>
                </div>
                <div>
                  <span className="text-slate-400">Originating Agent:</span>
                  <p className="font-mono text-slate-200 mt-0.5">{selectedApproval.agent_id}</p>
                </div>
              </div>

              <div>
                <span className="text-slate-400">Deterministic SHA-256 Action Hash:</span>
                <p className="font-mono text-[11px] break-all bg-[#0a0e17] p-2 rounded border border-[#1a2233] text-slate-300 mt-1">
                  {selectedApproval.action_hash}
                </p>
              </div>

              <div>
                <span className="text-slate-400">Full Parameter Arguments (JSON):</span>
                <pre className="font-mono text-[11px] bg-[#0a0e17] p-3 rounded border border-[#1a2233] text-slate-300 overflow-x-auto max-h-40 mt-1">
                  {JSON.stringify(selectedApproval.arguments_json, null, 2)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-[11px] text-slate-400 pt-2 border-t border-[#1a2233]">
                <div>Created: {formatDate(selectedApproval.created_at)}</div>
                <div>Expires: {formatDate(selectedApproval.expires_at)}</div>
                {selectedApproval.resolved_at && (
                  <div>Resolved: {formatDate(selectedApproval.resolved_at)} ({selectedApproval.resolved_by})</div>
                )}
                <div>Token Consumed: {selectedApproval.consumed ? "Yes (Protected from replay)" : "No"}</div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2.5 pt-3 border-t border-[#1a2233]">
              {selectedApproval.status === "PENDING" && (
                <>
                  <button
                    onClick={() => {
                      handleApprove(selectedApproval.id);
                      setSelectedApproval(null);
                    }}
                    className="rounded bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    Authorize Action
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedApproval.id);
                      setSelectedApproval(null);
                    }}
                    className="rounded border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10"
                  >
                    Reject Action
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedApproval(null)}
                className="rounded border border-[#1a2233] px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-[#121824]"
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
