// SICTACK – Human-in-the-Loop Approvals Queue
// Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState, useMemo } from "react";
import { approvalsApi, type Approval, type ApprovalStatus } from "@/lib/api";
import { StatusBadge } from "@/components/status-badge";
import { formatDate } from "@/lib/utils";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  RefreshIcon,
  KeyIcon,
} from "@/components/icons";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter Tabs
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Action State
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadApprovals() {
      try {
        const data = await approvalsApi.list();
        if (!ignore) {
          setApprovals(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load approval requests");
          setLoading(false);
        }
      }
    }

    void loadApprovals();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await approvalsApi.list();
      setApprovals(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync approval requests");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleApprove = async (id: string, approver = "admin@sictack.io") => {
    setActionInProgress(id);
    try {
      await approvalsApi.approve(id, approver, "Authorized via Security Operations Console");
      await handleRefresh();
      if (selectedApproval?.id === id) {
        setSelectedApproval(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Approval action failed");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleReject = async (id: string, approver = "admin@sictack.io") => {
    setActionInProgress(id);
    try {
      await approvalsApi.reject(id, approver, "Rejected via Security Operations Console");
      await handleRefresh();
      if (selectedApproval?.id === id) {
        setSelectedApproval(null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Rejection action failed");
    } finally {
      setActionInProgress(null);
    }
  };

  // Metrics
  const pendingCount = useMemo(
    () => approvals.filter((a) => a.status === "PENDING").length,
    [approvals]
  );
  const approvedCount = useMemo(
    () => approvals.filter((a) => a.status === "APPROVED").length,
    [approvals]
  );
  const consumedCount = useMemo(
    () => approvals.filter((a) => a.consumed).length,
    [approvals]
  );

  // Filtered List
  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.tool_name.toLowerCase().includes(q) ||
          item.agent_id.toLowerCase().includes(q) ||
          item.action_hash.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [approvals, statusFilter, searchQuery]);

  return (
    <div className="space-y-8 font-sans text-[#202629]">
      {/* ─── A. PAGE HEADER ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E4E9E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202629]">
              Human-in-the-Loop Approvals
            </h1>
            {pendingCount > 0 ? (
              <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#8D5B18] bg-[#FEF6EC] border border-[#FBE3C6] animate-pulse">
                {pendingCount} AWAITING REVIEW
              </span>
            ) : (
              <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#234E39] bg-[#EDF5F0] border border-[#D4E8DC]">
                QUEUE CLEAR
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs text-[#5A6063] max-w-2xl leading-relaxed">
            Sensitive autonomous agent tool invocations halted at runtime requiring explicit human
            security authorization before downstream execution.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Approval Queue"
          >
            <RefreshIcon size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Refresh Queue"}</span>
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

      {/* ─── B. OPERATIONAL METRICS ─── */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Pending Review</span>
            <ClockIcon size={15} className="text-[#8D5B18]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#8D5B18]">
            {loading ? "—" : pendingCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Active runtime requests awaiting decision
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Authorized Total</span>
            <CheckCircleIcon size={15} className="text-[#234E39]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#234E39]">
            {loading ? "—" : approvedCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Total operations granted approval
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Replay Protected Tokens</span>
            <KeyIcon size={15} className="text-[#485F84]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#485F84]">
            {loading ? "—" : consumedCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Single-use cryptographic tokens consumed
          </div>
        </div>
      </section>

      {/* ─── C. CRYPTOGRAPHIC REPLAY DEFENSE NOTICE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 flex items-start gap-3.5 shadow-xs">
        <div className="rounded bg-[#D5E3FF]/30 p-2 text-[#485F84] border border-[#485F84]/20 shrink-0 mt-0.5">
          <KeyIcon size={16} />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-[#202629]">Cryptographic Replay Defense</div>
          <p className="text-[#5A6063] leading-relaxed">
            Every authorization token is cryptographically bound to the SHA-256 canonical hash of the
            exact tool name and invocation payload. Approval tokens are single-use, strictly
            time-limited, and cannot be replayed or altered for unauthorized tool parameters.
          </p>
        </div>
      </section>

      {/* ─── D. FILTER TABS & SEARCH ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {(["ALL", "PENDING", "APPROVED", "REJECTED", "EXPIRED"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded px-3 py-1.5 font-medium transition-colors cursor-pointer ${
                statusFilter === tab
                  ? "border border-[#485F84]/40 bg-[#485F84]/10 text-[#485F84] font-semibold"
                  : "border border-transparent text-[#787E81] hover:text-[#202629]"
              }`}
            >
              {tab === "ALL" && `All (${approvals.length})`}
              {tab === "PENDING" && `Pending (${pendingCount})`}
              {tab === "APPROVED" && `Approved (${approvedCount})`}
              {tab === "REJECTED" &&
                `Rejected (${approvals.filter((a) => a.status === "REJECTED").length})`}
              {tab === "EXPIRED" &&
                `Expired (${approvals.filter((a) => a.status === "EXPIRED").length})`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by tool, agent, or hash..."
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none shadow-xs"
          />
        </div>
      </section>

      {/* ─── E. APPROVALS TABLE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#787E81] font-mono">
            Loading authorization requests...
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <ClockIcon size={24} className="text-[#787E81] mb-2" />
            <p className="text-xs font-semibold text-[#202629]">
              No {statusFilter !== "ALL" ? statusFilter.toLowerCase() : ""} approval requests found
            </p>
            <p className="mt-1 text-[11px] text-[#787E81] max-w-sm">
              When an autonomous agent invokes a sensitive tool classified under{" "}
              <code className="font-mono text-[#8D5B18] font-semibold">require_approval</code>, execution pauses and
              the request appears here for human review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9E8] bg-[#F2F4F3] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5A6063]">
                  <th className="px-5 py-3">Target Tool</th>
                  <th className="px-5 py-3">Originating Agent</th>
                  <th className="px-5 py-3">Authorization Status</th>
                  <th className="px-5 py-3">Requested At</th>
                  <th className="px-5 py-3">Expiration</th>
                  <th className="px-5 py-3">Canonical Action Hash</th>
                  <th className="px-5 py-3 text-right">Human Triage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E8]">
                {filteredApprovals.map((req) => {
                  const isPending = req.status === "PENDING";
                  const isProcessing = actionInProgress === req.id;

                  return (
                    <tr
                      key={req.id}
                      onClick={() => setSelectedApproval(req)}
                      className="hover:bg-[#F8F9F8] transition-colors cursor-pointer"
                    >
                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="rounded bg-[#FEF6EC] px-2 py-0.5 text-[#8D5B18] border border-[#FBE3C6] font-semibold">
                          {req.tool_name}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#202629]">
                        {req.agent_id}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status as ApprovalStatus} />
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#5A6063]">
                        {formatDate(req.created_at)}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#787E81]">
                        {formatDate(req.expires_at)}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#787E81]">
                        {req.action_hash ? `${req.action_hash.slice(0, 12)}…` : "—"}
                      </td>

                      <td
                        className="px-5 py-3.5 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleApprove(req.id)}
                              className="inline-flex items-center gap-1 rounded border border-[#D4E8DC] bg-[#EDF5F0] px-2.5 py-1 text-xs font-semibold text-[#234E39] hover:bg-[#D4E8DC] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                              title="Authorize tool execution"
                            >
                              <CheckCircleIcon size={12} />
                              <span>{isProcessing ? "Processing..." : "Approve"}</span>
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(req.id)}
                              className="inline-flex items-center gap-1 rounded border border-[#F8D5D0] bg-[#FDF1EF] px-2.5 py-1 text-xs font-semibold text-[#943425] hover:bg-[#F8D5D0] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                              title="Deny tool execution"
                            >
                              <XCircleIcon size={12} />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-[#787E81]">
                            {req.consumed ? "TOKEN_CONSUMED" : req.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── F. APPROVAL RECORD INSPECTION MODAL ─── */}
      {selectedApproval && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="approval-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#202629]/40 backdrop-blur-xs p-4"
          onClick={() => setSelectedApproval(null)}
        >
          <div
            className="w-full max-w-xl rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-6 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E4E9E8] pb-3">
              <div className="flex items-center gap-2">
                <h3 id="approval-modal-title" className="text-base font-semibold text-[#202629]">
                  Approval Request Details
                </h3>
                <StatusBadge status={selectedApproval.status as ApprovalStatus} />
              </div>
              <button
                type="button"
                onClick={() => setSelectedApproval(null)}
                className="text-[#787E81] hover:text-[#202629] text-base p-1 cursor-pointer"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded border border-[#E4E9E8] bg-[#F8F9F8]">
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Target Tool</span>
                  <span className="font-mono font-semibold text-[#202629] text-sm">
                    {selectedApproval.tool_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Originating Agent</span>
                  <span className="font-mono font-semibold text-[#202629] text-sm">
                    {selectedApproval.agent_id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Requested Timestamp</span>
                  <span className="font-mono text-[#5A6063]">
                    {formatDate(selectedApproval.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block">Expiration Time</span>
                  <span className="font-mono text-[#5A6063]">
                    {formatDate(selectedApproval.expires_at)}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                  Canonical SHA-256 Action Hash
                </span>
                <div className="p-2 rounded bg-[#F2F4F3] border border-[#E4E9E8] font-mono text-[11px] text-[#202629] break-all select-all">
                  {selectedApproval.action_hash || "Not provided"}
                </div>
              </div>

              {selectedApproval.arguments_json && (
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                    Intercepted Parameters / Execution Payload
                  </span>
                  <pre className="p-3 rounded bg-[#0C0F0E] text-[#BEEDD1] border border-[#282A30] font-mono text-[11px] overflow-x-auto max-h-48 custom-scrollbar">
                    {JSON.stringify(selectedApproval.arguments_json, null, 2)}
                  </pre>
                </div>
              )}

              {selectedApproval.resolved_by && (
                <div>
                  <span className="text-[10px] font-mono text-[#787E81] uppercase block mb-1">
                    Resolved By Operator
                  </span>
                  <p className="p-2.5 rounded bg-[#F8F9F8] border border-[#E4E9E8] text-[#5A6063] font-mono">
                    {selectedApproval.resolved_by} {selectedApproval.resolved_at ? `at ${formatDate(selectedApproval.resolved_at)}` : ""}
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E4E9E8]">
              <span className="text-[10px] font-mono text-[#787E81]">
                ID: {selectedApproval.id}
              </span>

              <div className="flex items-center gap-2">
                {selectedApproval.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      disabled={actionInProgress === selectedApproval.id}
                      onClick={() => handleReject(selectedApproval.id)}
                      className="px-3 py-1.5 rounded border border-[#F8D5D0] bg-[#FDF1EF] text-xs font-semibold text-[#943425] hover:bg-[#F8D5D0] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Reject Request
                    </button>
                    <button
                      type="button"
                      disabled={actionInProgress === selectedApproval.id}
                      onClick={() => handleApprove(selectedApproval.id)}
                      className="px-3.5 py-1.5 rounded border border-[#D4E8DC] bg-[#EDF5F0] text-xs font-semibold text-[#234E39] hover:bg-[#D4E8DC] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      Authorize Execution
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-3 py-1.5 rounded border border-[#E4E9E8] bg-transparent text-xs font-medium text-[#5A6063] hover:text-[#202629] transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
