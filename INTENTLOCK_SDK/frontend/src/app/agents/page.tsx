// SICTACK – Autonomous Agent Identity Registry
// Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { agentsApi, policiesApi, type Agent, type Policy } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/utils";
import {
  UsersIcon,
  RefreshIcon,
  ShieldIcon,
  XCircleIcon,
  CheckCircleIcon,
  ExclamationIcon,
} from "@/components/icons";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<Record<string, Policy>>({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [policyFilter, setPolicyFilter] = useState<"ALL" | "ASSIGNED" | "UNBOUND">("ALL");

  // Registration Form State
  const [showForm, setShowForm] = useState(false);
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPolicyId, setFormPolicyId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        const [a, p] = await Promise.all([
          agentsApi.list().catch(() => []),
          policiesApi.list().catch(() => []),
        ]);
        if (!ignore) {
          setAgents(a);
          const pMap: Record<string, Policy> = {};
          for (const pol of p) pMap[pol.id] = pol;
          setPolicies(pMap);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load agent registry");
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [a, p] = await Promise.all([agentsApi.list(), policiesApi.list()]);
      setAgents(a);
      const pMap: Record<string, Policy> = {};
      for (const pol of p) pMap[pol.id] = pol;
      setPolicies(pMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync agent registry");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const cleanId = formId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "-");
    const cleanName = formName.trim();

    if (!cleanId || !cleanName) {
      setFormError("Agent identifier and display name are required.");
      setSubmitting(false);
      return;
    }

    try {
      await agentsApi.create({
        id: cleanId,
        name: cleanName,
        description: formDesc.trim() || undefined,
        policy_id: formPolicyId || undefined,
      });

      setFormId("");
      setFormName("");
      setFormDesc("");
      setFormPolicyId("");
      setShowForm(false);
      await handleRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to register agent");
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered Inventory
  const filteredAgents = useMemo(() => {
    return agents.filter((agent) => {
      const matchesSearch =
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (policyFilter === "ASSIGNED") return Boolean(agent.policy_id);
      if (policyFilter === "UNBOUND") return !agent.policy_id;
      return true;
    });
  }, [agents, searchQuery, policyFilter]);

  const boundCount = agents.filter((a) => Boolean(a.policy_id)).length;
  const unboundCount = agents.length - boundCount;

  return (
    <div className="space-y-8 font-sans text-[#202629]">
      {/* ─── A. PAGE HEADER ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E4E9E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202629]">
              Agent Identity Registry
            </h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#234E39] bg-[#EDF5F0] border border-[#D4E8DC]">
              {agents.length} PRINCIPALS
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5A6063] max-w-2xl leading-relaxed">
            Cryptographic identity bindings, execution boundaries, and security policy attachments
            governing autonomous AI agent operations.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Synchronize Agent Inventory"
          >
            <RefreshIcon size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowForm(!showForm);
              setFormError(null);
            }}
            className="inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all shadow-xs cursor-pointer"
          >
            <span>{showForm ? "Cancel Registration" : "+ Register Agent"}</span>
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
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Total Registered Agents</span>
            <UsersIcon size={15} className="text-[#787E81]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#202629]">
            {loading ? "—" : agents.length}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Autonomous principals in this workspace
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Policy Bound</span>
            <CheckCircleIcon size={15} className="text-[#234E39]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#234E39]">
            {loading ? "—" : boundCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Bound to explicit deterministic rule sets
          </div>
        </div>

        <div className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-[#5A6063]">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Unbound (Default Deny)</span>
            <ExclamationIcon size={15} className="text-[#8D5B18]" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-[#8D5B18]">
            {loading ? "—" : unboundCount}
          </div>
          <div className="mt-1 text-[11px] text-[#787E81]">
            Unbound agents fail-closed on any tool request
          </div>
        </div>
      </section>

      {/* ─── C. ZERO-TRUST ARCHITECTURE NOTICE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 flex items-start gap-3.5 shadow-xs">
        <div className="rounded bg-[#EDF5F0] p-2 text-[#234E39] border border-[#D4E8DC] shrink-0 mt-0.5">
          <ShieldIcon size={16} />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-[#202629]">Zero-Trust Agent Identity Model</div>
          <p className="text-[#5A6063] leading-relaxed">
            Every autonomous agent must carry an explicit machine identifier. When an agent requests
            tool execution, SICTACK queries the identity registry to retrieve its bound security
            policy. Any unregistered machine identifier or unassigned agent immediately triggers a
            deterministic <code className="font-mono text-[#943425] font-semibold">DENY</code> under fail-closed
            invariants.
          </p>
        </div>
      </section>

      {/* ─── D. REGISTRATION FORM (COLLAPSIBLE) ─── */}
      {showForm && (
        <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="border-b border-[#E4E9E8] pb-3">
            <h2 className="text-sm font-semibold text-[#202629]">Register Autonomous Agent</h2>
            <p className="text-xs text-[#5A6063] mt-0.5">
              Bind a new autonomous agent principal to this tenant and select its security policy.
            </p>
          </div>

          {formError && (
            <div className="rounded border border-[#F8D5D0] bg-[#FDF1EF] p-3 text-xs text-[#943425]">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Machine Identifier <span className="text-[#943425]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  placeholder="e.g. data-pipeline-agent"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Unique slug passed to Python SDK: <code className="font-mono">SecureAgent(agent_id=&quot;...&quot;)</code>
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Display Name <span className="text-[#943425]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Data Pipeline Autonomous Runner"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Human-readable label displayed in audit logs and SOC telemetry
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Role / Description
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Executes scheduled ETL tasks and ingests database records"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Bound Security Policy
                </label>
                <select
                  value={formPolicyId}
                  onChange={(e) => setFormPolicyId(e.target.value)}
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] focus:border-[#485F84] focus:outline-none"
                >
                  <option value="">No policy assigned (Fail-Closed Default Deny)</option>
                  {Object.values(policies).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.max_risk_level} max risk)
                    </option>
                  ))}
                </select>
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Determines allowed tools, sensitivity limits, and approval rules
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded border border-[#485F84] bg-[#485F84] px-4 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? "Registering..." : "Save Agent Principal"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-[#E4E9E8] bg-transparent px-3.5 py-2 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── E. INVENTORY SEARCH & FILTER ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name, ID, or description..."
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-[11px] text-[#787E81] mr-1">Filter:</span>
          {(["ALL", "ASSIGNED", "UNBOUND"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPolicyFilter(tab)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                policyFilter === tab
                  ? "border border-[#485F84]/40 bg-[#485F84]/10 text-[#485F84] font-semibold"
                  : "border border-transparent text-[#787E81] hover:text-[#202629]"
              }`}
            >
              {tab === "ALL" && `All (${agents.length})`}
              {tab === "ASSIGNED" && `Policy Bound (${boundCount})`}
              {tab === "UNBOUND" && `Unbound (${unboundCount})`}
            </button>
          ))}
        </div>
      </section>

      {/* ─── F. AGENTS INVENTORY TABLE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#787E81] font-mono">
            Loading autonomous agent registry...
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <UsersIcon size={24} className="text-[#787E81] mb-2" />
            <p className="text-xs font-semibold text-[#202629]">
              {searchQuery ? "No matching agents found" : "No agents registered in this workspace"}
            </p>
            <p className="mt-1 text-[11px] text-[#787E81] max-w-sm">
              {searchQuery
                ? "Try clearing your search query or switching filters to see all principals."
                : "Register an autonomous agent principal to bind it to a deterministic security policy."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all cursor-pointer shadow-xs"
              >
                + Register Agent
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9E8] bg-[#F2F4F3] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5A6063]">
                  <th className="px-5 py-3">Agent Identity & Role</th>
                  <th className="px-5 py-3">Machine ID</th>
                  <th className="px-5 py-3">Bound Security Policy</th>
                  <th className="px-5 py-3">Registered Date</th>
                  <th className="px-5 py-3 text-right">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E8]">
                {filteredAgents.map((agent) => {
                  const policy = agent.policy_id ? policies[agent.policy_id] : null;

                  return (
                    <tr
                      key={agent.id}
                      className="hover:bg-[#F8F9F8] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#202629]">{agent.name}</div>
                        {agent.description ? (
                          <div className="text-[11px] text-[#5A6063] line-clamp-1 mt-0.5">
                            {agent.description}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#787E81] italic mt-0.5">
                            No role description provided
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="rounded bg-[#F2F4F3] px-2 py-0.5 text-[#202629] border border-[#E4E9E8]">
                          {agent.id}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        {policy ? (
                          <Link
                            href="/policies"
                            className="inline-flex items-center gap-1.5 text-[#234E39] hover:underline font-semibold"
                            title={`Inspect Policy: ${policy.name}`}
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-[#234E39]" />
                            <span>{policy.name}</span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[#943425] font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#943425]" />
                            <span>UNBOUND (DENY_ALL)</span>
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#5A6063]">
                        {formatDate(agent.created_at)}
                      </td>

                      <td className="px-5 py-3.5 text-right font-mono text-[11px] text-[#787E81]">
                        {timeAgo(agent.last_active_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
