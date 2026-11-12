// INTENTLOCK – Registered AI Agents

"use client";

import { useEffect, useState } from "react";
import { agentsApi, policiesApi, type Agent, type Policy } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import { UsersIcon, RefreshIcon, InfoIcon } from "@/components/icons";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create agent form
  const [showForm, setShowForm] = useState(false);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPolicyId, setFormPolicyId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([agentsApi.list(), policiesApi.list()]);
      setAgents(a);
      const pMap: Record<string, Policy> = {};
      for (const pol of p) pMap[pol.id] = pol;
      setPolicies(pMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await agentsApi.create({
        id: formId.trim(),
        name: formName.trim(),
        description: formDesc.trim(),
        policy_id: formPolicyId || undefined,
      });
      setFormId("");
      setFormName("");
      setFormDesc("");
      setFormPolicyId("");
      setShowForm(false);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1a2233] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Agent Identity Registry
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
              {agents.length} Registered
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Cryptographic identity & policy bindings for autonomous LLM agents in your ecosystem.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2233] bg-[#0d111a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121824] hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            {showForm ? "Cancel" : "+ Register Agent"}
          </button>
        </div>
      </div>

      {/* Understandable Explainer */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20 mt-0.5">
            <InfoIcon size={16} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Why Register Agents? </span>
            <span className="text-slate-400">
              Each AI agent has an explicit security identity. When an agent requests a tool call, IntentLock retrieves its bound security policy to verify allowed permissions and resources. Unregistered agents are denied by default under zero-trust principles.
            </span>
          </div>
        </div>
      </div>

      {/* Create Agent Form */}
      {showForm && (
        <div className="rounded-xl border border-[#202b3f] bg-[#0d111a] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            Register Autonomous Agent
          </h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Unique Agent ID
              </label>
              <input
                value={formId}
                onChange={(e) => setFormId(e.target.value)}
                required
                placeholder="e.g. support-agent-beta"
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Display Name
              </label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                placeholder="e.g. Customer Support Beta"
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Description / Role
              </label>
              <input
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="e.g. Handles read-only customer tier 1 support"
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Bound Policy
              </label>
              <select
                value={formPolicyId}
                onChange={(e) => setFormPolicyId(e.target.value)}
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
              >
                <option value="">No policy assigned (Fail-Closed)</option>
                {Object.values(policies).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {submitting ? "Registering..." : "Save Agent"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[#1a2233] px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-[#121824] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Agents Table */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] overflow-hidden">
        {agents.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <UsersIcon size={24} className="text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">No agents registered</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Click &quot;+ Register Agent&quot; above to bind an AI agent to a security policy
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2233] bg-[#0a0e17] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Agent Name</th>
                  <th className="px-5 py-2.5">System Identifier</th>
                  <th className="px-5 py-2.5">Enforced Policy</th>
                  <th className="px-5 py-2.5">Registration Date</th>
                  <th className="px-5 py-2.5 text-right">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30]">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-[#121824]/60 transition-colors">
                    <td className="whitespace-nowrap px-5 py-3">
                      <div className="font-semibold text-slate-200">
                        {agent.name}
                      </div>
                      {agent.description && (
                        <div className="text-[11px] text-slate-500">
                          {agent.description}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px]">
                      <span className="rounded bg-[#162032] px-2 py-0.5 text-slate-300 border border-[#202b3f]">
                        {agent.id}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px]">
                      {agent.policy_id ? (
                        <span className="text-emerald-400">
                          {policies[agent.policy_id]?.name || agent.policy_id}
                        </span>
                      ) : (
                        <span className="text-rose-400">NONE (DENY_ALL)</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">
                      {formatDate(agent.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-mono text-[11px] text-slate-400">
                      {timeAgo(agent.last_active_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
