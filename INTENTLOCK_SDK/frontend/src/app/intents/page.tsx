// INTENTLOCK 2.0 – Intent Authorization Contexts Console

"use client";

import { useEffect, useState } from "react";
import { intentsApi, IntentContext, IntentCreate } from "@/lib/api";
import { LockIcon, ShieldIcon, CheckIcon, XIcon, ClockIcon } from "@/components/icons";

export default function IntentsPage() {
  const [intents, setIntents] = useState<IntentContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Intent Form
  const [agentId, setAgentId] = useState("agent-support");
  const [objective, setObjective] = useState("");
  const [allowedActions, setAllowedActions] = useState("email:read, user:query");
  const [deniedActions, setDeniedActions] = useState("email:send_external, db:drop");
  const [allowedResources, setAllowedResources] = useState("/data/customers/*");
  const [sensitivityCeiling, setSensitivityCeiling] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(3600);
  const [creating, setCreating] = useState(false);

  const fetchIntents = async () => {
    setLoading(true);
    try {
      const data = await intentsApi.list(filter === "ALL" ? undefined : filter);
      setIntents(data);
    } catch (err) {
      console.error("Failed to load intent contexts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntents();
  }, [filter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;
    setCreating(true);
    try {
      await intentsApi.create({
        agent_id: agentId,
        authorized_objective: objective,
        allowed_actions: allowedActions.split(",").map((s) => s.trim()).filter(Boolean),
        denied_actions: deniedActions.split(",").map((s) => s.trim()).filter(Boolean),
        allowed_resources: allowedResources.split(",").map((s) => s.trim()).filter(Boolean),
        sensitivity_ceiling: sensitivityCeiling,
        duration_seconds: durationSeconds,
      });
      setShowCreateModal(false);
      setObjective("");
      fetchIntents();
    } catch (err) {
      alert("Failed to issue IntentContext: " + String(err));
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id: string) => {
    const reason = prompt("Enter reason for revoking this Intent Context:", "Administrative operator override");
    if (!reason) return;
    try {
      await intentsApi.revoke(id, reason);
      fetchIntents();
    } catch (err) {
      alert("Failed to revoke: " + String(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Intent Authorization Contexts
            </h1>
            <span className="rounded bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              IMMUTABLE CLAIMS
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cryptographically sealed operational boundaries established by trusted callers before agent execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-[#1a2233] bg-[#0d111a] p-1 text-xs">
            {["ALL", "ACTIVE", "EXPIRED", "REVOKED"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`rounded px-2.5 py-1 font-medium transition-all ${
                  filter === tab
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all"
          >
            <LockIcon size={13} />
            Issue Intent Context
          </button>
        </div>
      </div>

      {/* Intents Grid */}
      {loading ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center text-xs text-slate-400">
          Loading immutable intent contexts...
        </div>
      ) : intents.length === 0 ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center">
          <ShieldIcon size={32} className="mx-auto text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">No Intent Contexts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Issue an intent context to bind AI agents to explicit, bounded objectives with immutable allow/deny lists.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {intents.map((intent) => {
            const isActive = intent.context_status === "ACTIVE";
            const isExpired = intent.context_status === "EXPIRED" || new Date(intent.expiration_timestamp) < new Date();
            const isRevoked = intent.context_status === "REVOKED";

            return (
              <div
                key={intent.id}
                className="flex flex-col justify-between rounded-xl border border-[#1a2233] bg-[#0d111a] p-5 hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-200">{intent.id}</span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${
                            isActive && !isExpired
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                              : isRevoked
                              ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          {isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : "ACTIVE"}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-slate-400">
                        Agent: <span className="text-emerald-400">{intent.agent_id}</span>
                      </p>
                    </div>

                    {isActive && !isExpired && (
                      <button
                        onClick={() => handleRevoke(intent.id)}
                        className="rounded border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
                      >
                        Revoke
                      </button>
                    )}
                  </div>

                  {/* Objective */}
                  <div className="mt-3.5 rounded-lg border border-[#141b29] bg-[#07090e] p-3">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                      Authorized Objective
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {intent.authorized_objective}
                    </p>
                  </div>

                  {/* Boundaries Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded border border-[#1a2233] bg-[#090d14] p-2">
                      <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wide block">
                        Allowed Actions ({intent.allowed_actions.length})
                      </span>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300 truncate">
                        {intent.allowed_actions.join(", ") || "*"}
                      </p>
                    </div>

                    <div className="rounded border border-[#1a2233] bg-[#090d14] p-2">
                      <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wide block">
                        Explicitly Denied ({intent.denied_actions.length})
                      </span>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300 truncate">
                        {intent.denied_actions.join(", ") || "None"}
                      </p>
                    </div>

                    <div className="rounded border border-[#1a2233] bg-[#090d14] p-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                        Resource Scope
                      </span>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300 truncate">
                        {intent.allowed_resources.join(", ") || "*"}
                      </p>
                    </div>

                    <div className="rounded border border-[#1a2233] bg-[#090d14] p-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                        Sensitivity Ceiling
                      </span>
                      <p className="mt-0.5 font-mono text-[10px] text-slate-300">
                        Level {intent.sensitivity_ceiling} / 10
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 pt-3 border-t border-[#1a2233] flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Expires: {new Date(intent.expiration_timestamp).toLocaleTimeString()}</span>
                  <span>v{intent.authorization_version} • {new Date(intent.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Issue Intent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-xl border border-[#1a2233] bg-[#0d111a] p-6 shadow-2xl">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <LockIcon size={16} className="text-emerald-400" />
              Issue Intent Authorization Context
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Creates an immutable authorization token verifiable by INTENTLOCK's 8-stage pipeline.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target Agent ID</label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 font-mono text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">Authorized Objective</label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Resolve customer ticket #4192 by searching knowledge base and drafting response."
                  className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Allowed Tools (CSV)</label>
                  <input
                    type="text"
                    value={allowedActions}
                    onChange={(e) => setAllowedActions(e.target.value)}
                    className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 font-mono text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Denied Tools (CSV)</label>
                  <input
                    type="text"
                    value={deniedActions}
                    onChange={(e) => setDeniedActions(e.target.value)}
                    className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 font-mono text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Sensitivity Ceiling (0-10)</label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={sensitivityCeiling}
                    onChange={(e) => setSensitivityCeiling(Number(e.target.value))}
                    className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 font-mono text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">TTL (Seconds)</label>
                  <input
                    type="number"
                    min={60}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="w-full rounded border border-[#1a2233] bg-[#07090e] px-3 py-1.5 font-mono text-slate-200 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#1a2233]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded px-3 py-1.5 font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-emerald-500 px-4 py-1.5 font-semibold text-slate-950 hover:bg-emerald-400 transition-all disabled:opacity-50"
                >
                  {creating ? "Issuing..." : "Seal & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
