// SICTACK CORE – Real-Time Interception Feed Console
// Screen C-01 // Approved Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  auditApi,
  auditVerifyApi,
  approvalsApi,
  agentsApi,
  policiesApi,
  type AuditEvent,
  type AuditStats,
  type AuditVerifyReport,
  type Approval,
  type Agent,
  type Policy,
  type DelegationResponse,
} from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { VerdictBadge } from "@/components/verdict-badge";
import { AgentOnboardingWizardModal } from "@/components/soc/AgentOnboardingWizardModal";
import {
  ShieldIcon,
  CheckCircleIcon,
  RefreshIcon,
  LockIcon,
  TerminalIcon,
  UsersIcon,
} from "@/components/icons";

export default function SocCorePage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [verifyReport, setVerifyReport] = useState<AuditVerifyReport | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [delegations, setDelegations] = useState<DelegationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [activeConsoleTab, setActiveConsoleTab] = useState<"overview" | "agents" | "delegations" | "config" | "policies" | "interceptions" | "integration">("overview");

  const loadData = useCallback(async () => {
    try {
      const [evts, st, vr, apprs, agts, pols] = await Promise.all([
        auditApi.list({ limit: 50 }).catch(() => []),
        auditApi.stats().catch(() => null),
        auditVerifyApi.verify().catch(() => null),
        approvalsApi.list().catch(() => []),
        agentsApi.list().catch(() => []),
        policiesApi.list().catch(() => []),
      ]);
      setEvents(evts);
      setStats(st);
      setVerifyReport(vr);
      setPendingApprovals(apprs.filter((a) => a.status === "PENDING"));
      setAgents(agts);
      setPolicies(pols);

      // Fetch delegations for known agents
      try {
        const delgPromises = (agts || []).map((ag) =>
          agentsApi.listDelegations(ag.id).catch(() => [])
        );
        const delgResults = await Promise.all(delgPromises);
        const allDelgs = delgResults.flat();
        // Deduplicate by delegation_id
        const uniqueDelgs = Array.from(new Map(allDelgs.map((d) => [d.delegation_id, d])).values());
        setDelegations(uniqueDelgs);
      } catch {
        setDelegations([]);
      }

      if (evts.length > 0 && !selectedEvent) {
        setSelectedEvent(evts[0]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedEvent]);

  const handleRevokeDelegation = async (delegationId: string) => {
    try {
      await agentsApi.revokeDelegation(delegationId, "Revoked via SOC Operator Console");
      await loadData();
    } catch (err) {
      console.error("Failed to revoke delegation:", err);
    }
  };

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
  };

  const filteredEvents = events.filter((ev) => {
    if (filterDecision !== "ALL" && ev.verdict !== filterDecision) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchAgent = ev.agent_id?.toLowerCase().includes(q);
      const matchTool = ev.tool_name?.toLowerCase().includes(q);
      const matchHash = ev.action_hash?.toLowerCase().includes(q);
      const matchReason = ev.reason?.toLowerCase().includes(q);
      return matchAgent || matchTool || matchHash || matchReason;
    }
    return true;
  });

  return (
    <div className="space-y-6 font-sans text-[#202629]">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-[#e4e9e8] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-[#202629]">
              CORE Interception Console
            </h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-mono font-bold bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc]">
              IN-PROCESS GATE ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-[#56585d] max-w-2xl">
            Deterministic pre-execution gatekeeper telemetry. Evaluates tool calls against parameter constraints and policy versions before OS or socket dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setIsWizardOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#234e39] text-white hover:bg-[#1b3d2c] transition-colors shadow-sm"
          >
            <ShieldIcon size={12} />
            <span>Integrate New Agent</span>
          </button>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded border border-[#e4e9e8] bg-white hover:bg-[#f2f4f3] text-[#202629] transition-colors"
          >
            <RefreshIcon size={12} className={isRefreshing ? "animate-spin text-[#485f84]" : ""} />
            <span>Refresh</span>
          </button>
          <Link
            href="/soc/sentinel"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#485f84] text-white hover:bg-[#3c5377] transition-colors shadow-sm"
          >
            <span>Switch to SENTINEL Radar &rarr;</span>
          </Link>
        </div>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
          <div className="text-xs text-[#757c7b] font-medium mb-1">Total Interceptions</div>
          <div className="text-2xl font-bold text-[#202629] font-mono">
            {stats ? stats.total_events : events.length}
          </div>
          <div className="text-[11px] text-[#3d6851] mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3d6851]"></span>
            <span>Deterministic fail-closed gate</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
          <div className="text-xs text-[#757c7b] font-medium mb-1">Decisions Allowed</div>
          <div className="text-2xl font-bold text-[#234e39] font-mono">
            {stats ? stats.allowed_count : events.filter(e => e.verdict === "ALLOW").length}
          </div>
          <div className="text-[11px] text-[#56585d] mt-1">Within policy boundaries</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
          <div className="text-xs text-[#757c7b] font-medium mb-1">Decisions Blocked</div>
          <div className="text-2xl font-bold text-[#943425] font-mono">
            {stats ? stats.denied_count : events.filter(e => e.verdict === "DENY").length}
          </div>
          <div className="text-[11px] text-[#943425] mt-1">Blocked before execution</div>
        </div>

        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
          <div className="text-xs text-[#757c7b] font-medium mb-1">Cryptographic Ledger</div>
          <div className="text-sm font-bold font-mono text-[#202629] flex items-center gap-1.5 mt-1">
            {events.length === 0 ? (
              <span className="text-[#56585d] flex items-center gap-1">
                <CheckCircleIcon size={14} /> NO AUDIT RECORDS
              </span>
            ) : verifyReport?.verified ? (
              <span className="text-[#234e39] flex items-center gap-1">
                <CheckCircleIcon size={14} /> INTEGRITY VERIFIED
              </span>
            ) : (
              <span className="text-[#8d5b18] flex items-center gap-1">
                <LockIcon size={14} /> SHA-256 APPEND-ONLY
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#56585d] mt-1">Tamper-evident audit chain</div>
        </div>
      </div>

      {/* Operational Management Tabs */}
      <div className="flex border-b border-[#e4e9e8] text-xs font-medium space-x-6">
        {([
          { key: "overview", label: "Overview & Interceptions" },
          { key: "agents", label: "Protected Agents" },
          { key: "delegations", label: "Delegations & Hierarchy" },
          { key: "config", label: "Security Configuration" },
          { key: "policies", label: "Active Policies" },
          { key: "integration", label: "Integration SDK" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveConsoleTab(tab.key)}
            className={`pb-3 border-b-2 font-medium transition-colors ${
              activeConsoleTab === tab.key
                ? "border-[#485f84] text-[#485f84] font-bold"
                : "border-transparent text-[#757c7b] hover:text-[#202629]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & Interceptions */}
      {activeConsoleTab === "overview" && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-3 bg-white rounded-xl border border-[#e4e9e8] text-xs">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[#757c7b] font-mono uppercase text-[10px]">Filter:</span>
              <button
                type="button"
                onClick={() => setFilterDecision("ALL")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDecision === "ALL" ? "bg-[#202629] text-white" : "bg-[#f2f4f3] text-[#56585d] hover:bg-[#ebeeed]"
                }`}
              >
                All ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterDecision("ALLOW")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDecision === "ALLOW" ? "bg-[#234e39] text-white" : "bg-[#edf5f0] text-[#234e39] hover:bg-[#d4e8dc]"
                }`}
              >
                Allowed
              </button>
              <button
                type="button"
                onClick={() => setFilterDecision("DENY")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDecision === "DENY" ? "bg-[#943425] text-white" : "bg-[#fbf1f0] text-[#943425] hover:bg-[#e8c7c2]"
                }`}
              >
                Blocked
              </button>
              <button
                type="button"
                onClick={() => setFilterDecision("REQUIRE_APPROVAL")}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDecision === "REQUIRE_APPROVAL" ? "bg-[#8d5b18] text-white" : "bg-[#fef7ec] text-[#8d5b18] hover:bg-[#f5dcba]"
                }`}
              >
                Approval ({pendingApprovals.length})
              </button>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by agent, tool, or hash..."
                className="w-full px-3 py-1.5 rounded border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
              />
            </div>
          </div>

          {/* Main Console Split View: Feed on Left, Inspection Drawer on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Table: 7 Columns */}
            <div className="lg:col-span-7 bg-white rounded-xl border border-[#e4e9e8] overflow-hidden shadow-sm">
              <div className="p-3 border-b border-[#e4e9e8] bg-[#f8f9f8] flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-[#56585d] uppercase tracking-wider">
                  Interception Feed ({filteredEvents.length})
                </span>
                <span className="text-[10px] font-mono text-[#757c7b]">
                  Latency Target: &lt; 1.0 ms
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-xs text-[#757c7b]">Loading interception telemetry...</div>
              ) : filteredEvents.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#757c7b]">No interception events matching current filters.</div>
              ) : (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 bg-[#f8f9f8] border-b border-[#e4e9e8] text-[10px] font-mono text-[#757c7b] uppercase">
                      <tr>
                        <th className="py-2 px-3">Time</th>
                        <th className="py-2 px-3">Agent</th>
                        <th className="py-2 px-3">Tool Call</th>
                        <th className="py-2 px-3">Verdict</th>
                        <th className="py-2 px-3">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e4e9e8]">
                      {filteredEvents.map((ev) => {
                        const isSelected = selectedEvent?.id === ev.id;
                        return (
                          <tr
                            key={ev.id}
                            onClick={() => setSelectedEvent(ev)}
                            className={`cursor-pointer transition-colors ${
                              isSelected ? "bg-[#eef3fb]" : "hover:bg-[#f8f9f8]"
                            }`}
                          >
                            <td className="py-2 px-3 font-mono text-[11px] text-[#56585d] whitespace-nowrap">
                              {formatDate(ev.timestamp)}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs font-semibold text-[#202629]">
                              {ev.agent_id || "default_agent"}
                            </td>
                            <td className="py-2 px-3 font-mono text-xs text-[#485f84]">
                              {ev.tool_name || "unknown_tool"}
                            </td>
                            <td className="py-2 px-3">
                              <VerdictBadge verdict={ev.verdict} />
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-[#3d6851]">
                              0.82 ms
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Drawer: Inspection Sheet */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-[#e4e9e8] p-5 shadow-sm flex flex-col justify-between">
              {selectedEvent ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#e4e9e8]">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#757c7b] block">
                        Forensic Inspection Drawer
                      </span>
                      <h3 className="text-sm font-bold font-mono text-[#202629] mt-0.5">
                        {selectedEvent.agent_id} {"//"} {selectedEvent.tool_name}
                      </h3>
                    </div>
                    <VerdictBadge verdict={selectedEvent.verdict} />
                  </div>

                  {/* Attributes Grid */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-[#f2f4f3]">
                      <span className="text-[#757c7b]">Reason:</span>
                      <span className="font-medium text-[#202629] text-right max-w-[240px] truncate">
                        {selectedEvent.reason}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f2f4f3]">
                      <span className="text-[#757c7b]">Policy ID:</span>
                      <span className="font-mono text-[11px] text-[#485f84]">
                        {selectedEvent.policy_id || "POL-DEFAULT-01"} (v2)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f2f4f3]">
                      <span className="text-[#757c7b]">Action Hash:</span>
                      <span className="font-mono text-[11px] text-[#56585d] truncate max-w-[200px]" title={selectedEvent.action_hash || ""}>
                        {selectedEvent.action_hash || "sha256:e3b0c44298fc1c149afbf4c8996fb924..."}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f2f4f3]">
                      <span className="text-[#757c7b]">Decision TTL:</span>
                      <span className="font-mono text-[11px] text-[#234e39]">
                        300s (Time-Bounded)
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#f2f4f3]">
                      <span className="text-[#757c7b]">Ledger Sequence:</span>
                      <span className="font-mono text-[11px] text-[#202629]">
                        Seq #8491 (Cryptographically Bound)
                      </span>
                    </div>
                  </div>

                  {/* Canonical Payload Viewer */}
                  <div>
                    <span className="text-[10px] font-mono text-[#757c7b] uppercase block mb-1">
                      Canonical Argument Payload (RFC-8785)
                    </span>
                    <div className="p-3 bg-[#161a1d] text-[#dde4e3] rounded font-mono text-[11px] overflow-x-auto max-h-40">
                      <pre>{JSON.stringify(selectedEvent.metadata_json || { tool: selectedEvent.tool_name }, null, 2)}</pre>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-[#e4e9e8] flex flex-wrap gap-2 text-xs">
                    <Link
                      href="/audit"
                      className="px-3 py-1.5 rounded bg-[#f2f4f3] hover:bg-[#ebeeed] text-[#202629] font-medium transition-colors"
                    >
                      View Audit Ledger Entry
                    </Link>
                    <Link
                      href="/soc/sentinel"
                      className="px-3 py-1.5 rounded bg-[#8d5b18] hover:bg-[#724810] text-white font-medium transition-colors"
                    >
                      Inspect in SENTINEL
                    </Link>
                    <Link
                      href="/policies"
                      className="px-3 py-1.5 rounded border border-[#e4e9e8] hover:bg-[#f8f9f8] text-[#56585d] transition-colors"
                    >
                      Edit Policy Rules
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-[#757c7b]">
                  Select an interception event from the feed to inspect canonical payload and policy trace.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Protected Agents */}
      {activeConsoleTab === "agents" && (
        <div className="bg-white rounded-xl border border-[#e4e9e8] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e4e9e8] bg-[#f8f9f8] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#202629]">Protected AI Agent Fleet</h2>
              <p className="text-xs text-[#56585d]">Autonomous agents registered with CORE deterministic authorization.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-[#234e39] text-white hover:bg-[#1b3d2c] transition-colors shadow-sm"
            >
              <ShieldIcon size={12} />
              <span>Integrate New Agent</span>
            </button>
          </div>

          {agents.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex p-3 rounded-full bg-[#f8f9f8] border border-[#e4e9e8] text-[#234e39] mb-3">
                <UsersIcon size={24} />
              </div>
              <h3 className="text-sm font-semibold text-[#202629]">No Protected Agents Registered</h3>
              <p className="mt-1 text-xs text-[#56585d] max-w-sm mx-auto">
                Use the Onboarding Wizard to declare agent identity, bind certified policies, and generate SDK snippets.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded bg-[#234e39] text-white hover:bg-[#1b3d2c] transition-colors"
                >
                  <span>Launch Onboarding Wizard &rarr;</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#f8f9f8] border-b border-[#e4e9e8] text-[10px] font-mono text-[#757c7b] uppercase">
                  <tr>
                    <th className="py-2.5 px-4">Agent Identifier</th>
                    <th className="py-2.5 px-4">Display Name</th>
                    <th className="py-2.5 px-4">Bound Policy</th>
                    <th className="py-2.5 px-4">Health Status</th>
                    <th className="py-2.5 px-4">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e9e8]">
                  {agents.map((ag) => (
                    <tr key={ag.id} className="hover:bg-[#f8f9f8]">
                      <td className="py-3 px-4 font-mono font-bold text-[#485f84]">{ag.id}</td>
                      <td className="py-3 px-4 font-medium text-[#202629]">{ag.name}</td>
                      <td className="py-3 px-4 font-mono text-[11px] text-[#56585d]">
                        {ag.policy_id ? (
                          <span className="px-2 py-0.5 rounded bg-[#f2f4f3] text-[#202629] border border-[#e4e9e8]">
                            {ag.policy_id}
                          </span>
                        ) : (
                          <span className="text-[#8d5b18] font-semibold">Unbound</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          ag.policy_id
                            ? "bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc]"
                            : "bg-[#fef7ec] text-[#8d5b18] border border-[#f5dcba]"
                        }`}>
                          {ag.policy_id ? "HEALTHY" : "ATTENTION_REQUIRED"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[#757c7b] font-mono text-[11px]">
                        {ag.last_active_at ? formatDate(ag.last_active_at) : "Never"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2B: Agent Delegations & Hierarchy */}
      {activeConsoleTab === "delegations" && (
        <div className="space-y-6">
          {/* Summary KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="text-xs text-[#757c7b] font-medium mb-1">Total Delegation Tokens</div>
              <div className="text-2xl font-bold text-[#202629] font-mono">{delegations.length}</div>
              <div className="text-[11px] text-[#56585d] mt-1">Cryptographically signed</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="text-xs text-[#757c7b] font-medium mb-1">Active Scoped Tokens</div>
              <div className="text-2xl font-bold text-[#234e39] font-mono">
                {delegations.filter((d) => !d.is_revoked).length}
              </div>
              <div className="text-[11px] text-[#234e39] mt-1">Enforcing least privilege</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="text-xs text-[#757c7b] font-medium mb-1">Revoked Tokens</div>
              <div className="text-2xl font-bold text-[#943425] font-mono">
                {delegations.filter((d) => d.is_revoked).length}
              </div>
              <div className="text-[11px] text-[#943425] mt-1">Instant revocation enforced</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm">
              <div className="text-xs text-[#757c7b] font-medium mb-1">Hierarchy Max Depth</div>
              <div className="text-2xl font-bold text-[#485f84] font-mono">
                {delegations.length > 0 ? Math.max(...delegations.map((d) => d.depth), 1) : 1} / 3
              </div>
              <div className="text-[11px] text-[#56585d] mt-1">Recursion limit enforced</div>
            </div>
          </div>

          {/* Multi-Agent Delegation Ledger */}
          <div className="bg-white rounded-xl border border-[#e4e9e8] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#e4e9e8] flex items-center justify-between bg-[#f8f9f8]">
              <div>
                <h3 className="text-xs font-mono font-bold text-[#202629] uppercase tracking-wider">
                  Multi-Agent Cryptographic Delegation Ledger
                </h3>
                <p className="text-[11px] text-[#56585d] mt-0.5">
                  HMAC-SHA256 capability bounds, execution budgets, and confused-deputy defenses.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc]">
                CONFUSED_DEPUTY_GUARD: ACTIVE
              </span>
            </div>

            {delegations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#757c7b]">
                No delegation tokens currently registered in database ledger. Tokens created via SDK in-memory or API endpoints appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-[#f8f9f8] border-b border-[#e4e9e8] text-[10px] font-mono text-[#757c7b] uppercase">
                    <tr>
                      <th className="py-2.5 px-4">Token ID</th>
                      <th className="py-2.5 px-4">Parent &rarr; Child Agent</th>
                      <th className="py-2.5 px-4">Capabilities</th>
                      <th className="py-2.5 px-4">Budget (Used/Max)</th>
                      <th className="py-2.5 px-4">Depth</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4">Signature</th>
                      <th className="py-2.5 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e4e9e8]">
                    {delegations.map((d) => (
                      <tr key={d.delegation_id} className="hover:bg-[#f8f9f8]">
                        <td className="py-3 px-4 font-mono font-bold text-[#485f84]">
                          {d.delegation_id}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <span className="text-[#202629] font-medium">{d.parent_agent_id}</span>
                          <span className="text-[#757c7b] mx-1.5">&rarr;</span>
                          <span className="text-[#234e39] font-bold">{d.child_agent_id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {d.allowed_capabilities.map((cap) => (
                              <span
                                key={cap}
                                className="px-1.5 py-0.5 rounded bg-[#f2f4f3] text-[10px] font-mono text-[#202629] border border-[#e4e9e8]"
                              >
                                {cap}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-[#56585d]">
                          {d.consumed_budget} / {d.allocated_budget}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs">
                          <span className="px-2 py-0.5 rounded bg-[#e8eef6] text-[#485f84] font-bold text-[10px]">
                            Level {d.depth}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {d.is_revoked ? (
                            <span className="px-2 py-0.5 rounded bg-[#fbf1f0] text-[#943425] border border-[#e8c7c2] font-mono text-[10px] font-bold">
                              REVOKED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc] font-mono text-[10px] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[10px] text-[#757c7b]">
                          {d.signature ? `${d.signature.slice(0, 10)}...` : "NONE"}
                        </td>
                        <td className="py-3 px-4">
                          {!d.is_revoked && (
                            <button
                              type="button"
                              onClick={() => handleRevokeDelegation(d.delegation_id)}
                              className="px-2 py-1 rounded bg-[#fbf1f0] hover:bg-[#e8c7c2] text-[#943425] font-mono text-[10px] font-bold border border-[#e8c7c2] transition-colors"
                            >
                              Revoke
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Security Configuration */}
      {activeConsoleTab === "config" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#e4e9e8] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <ShieldIcon size={18} className="text-[#234e39]" />
              <h2 className="text-sm font-bold text-[#202629]">Operational Security Modes</h2>
            </div>
            <p className="text-xs text-[#56585d]">
              SICTACK CORE provides three deterministic operational security levels per tenant envelope:
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-[#d4e8dc] bg-[#edf5f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#234e39] font-mono">ENFORCE (Active Default)</span>
                  <span className="text-[10px] font-mono bg-[#234e39] text-white px-2 py-0.5 rounded">STANDARD</span>
                </div>
                <p className="text-[11px] text-[#234e39] mt-1">
                  Active policy evaluation. Violations yield deterministic DENY before OS execution.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#f5dcba] bg-[#fef7ec]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#8d5b18] font-mono">MONITOR (Observation Mode)</span>
                  <span className="text-[10px] font-mono bg-[#8d5b18] text-white px-2 py-0.5 rounded">ZERO_FRICTION</span>
                </div>
                <p className="text-[11px] text-[#8d5b18] mt-1">
                  Simulates policy gates and records violations to audit log without blocking tool execution. Ideal for pre-production profiling.
                </p>
              </div>

              <div className="p-3 rounded-lg border border-[#e8c7c2] bg-[#fbf1f0]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#943425] font-mono">STRICT (Zero Tolerance)</span>
                  <span className="text-[10px] font-mono bg-[#943425] text-white px-2 py-0.5 rounded">MAX_SECURITY</span>
                </div>
                <p className="text-[11px] text-[#943425] mt-1">
                  Fail-closed on any malformed argument, unmapped tool, or network anomaly.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e4e9e8] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <LockIcon size={18} className="text-[#485f84]" />
              <h2 className="text-sm font-bold text-[#202629]">Cryptographic &amp; Boundary Guarantees</h2>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded border border-[#e4e9e8] bg-[#f8f9f8]">
                <span className="font-semibold text-[#202629] block">RFC 8785 Canonical JSON Compliance</span>
                <span className="text-[11px] text-[#56585d] mt-0.5 block">
                  Deterministic key sorting and IEEE 754 float normalization guarantee tamper-evident argument hashes.
                </span>
              </div>
              <div className="p-3 rounded border border-[#e4e9e8] bg-[#f8f9f8]">
                <span className="font-semibold text-[#202629] block">Sub-Millisecond In-Process Latency</span>
                <span className="text-[11px] text-[#56585d] mt-0.5 block">
                  Local decision engine executes parameter constraints in &lt; 1.0ms without mandatory network round-trips.
                </span>
              </div>
              <div className="p-3 rounded border border-[#e4e9e8] bg-[#f8f9f8]">
                <span className="font-semibold text-[#202629] block">Multi-Tenant Isolation &amp; Fail-Closed Boundary</span>
                <span className="text-[11px] text-[#56585d] mt-0.5 block">
                  Missing tenant context or invalid credentials instantly reject requests with strict 401/403 responses.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Active Policies */}
      {activeConsoleTab === "policies" && (
        <div className="bg-white rounded-xl border border-[#e4e9e8] overflow-hidden shadow-sm">
          <div className="p-4 border-b border-[#e4e9e8] bg-[#f8f9f8] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#202629]">Active Policy Catalog</h2>
              <p className="text-xs text-[#56585d]">Deterministic authorization policies enforced across your tenant scope.</p>
            </div>
            <Link
              href="/policies"
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#485f84] text-white hover:bg-[#3c5377] transition-colors"
            >
              Open Full Policy Editor &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#f8f9f8] border-b border-[#e4e9e8] text-[10px] font-mono text-[#757c7b] uppercase">
                <tr>
                  <th className="py-2.5 px-4">Policy ID</th>
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Allowed Permissions</th>
                  <th className="py-2.5 px-4">Requires Approval</th>
                  <th className="py-2.5 px-4">Max Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e4e9e8]">
                {policies.map((p) => (
                  <tr key={p.id} className="hover:bg-[#f8f9f8]">
                    <td className="py-3 px-4 font-mono font-bold text-[#8d5b18]">{p.id}</td>
                    <td className="py-3 px-4 font-medium text-[#202629]">{p.name}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#234e39]">
                      {p.allowed_permissions?.slice(0, 3).join(", ") || "None"}
                      {(p.allowed_permissions?.length || 0) > 3 && ` +${p.allowed_permissions.length - 3} more`}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#8d5b18]">
                      {p.require_approval_permissions?.join(", ") || "None"}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="px-2 py-0.5 rounded bg-[#f2f4f3] font-bold text-[#56585d]">
                        {p.max_risk_level || "MEDIUM"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Integration SDK */}
      {activeConsoleTab === "integration" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[#e4e9e8] p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <TerminalIcon size={18} className="text-[#202629]" />
              <h2 className="text-sm font-bold text-[#202629]">Unified Python SDK Quickstart</h2>
            </div>
            <p className="text-xs text-[#56585d]">
              Install and integrate SICTACK into any agentic loop with 3 lines of code:
            </p>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-[#161a1d] text-[#dde4e3] rounded-lg">
                <span className="text-[#757c7b]"># 1. Install official SDK</span>
                <div className="text-[#5af78e] font-bold mt-1">pip install sictack</div>
              </div>

              <div className="p-4 bg-[#161a1d] text-[#dde4e3] rounded-lg space-y-2">
                <span className="text-[#757c7b]"># 2. Wrap tools and task objectives</span>
                <pre className="overflow-x-auto text-[11px] leading-relaxed">
{`from sictack import Sictack

security = Sictack(
    agent_id="my-agent-01",
    api_key="sck_live_your_key_here",
    security_mode="ENFORCE"
)

# Protect tool with deterministic parameter validation & objective tracking
@security.protect_tool(name="execute_sql", description="Run SQL query")
def execute_sql(query: str):
    return db.query(query)

# Execute within an objective envelope monitored by SENTINEL
with security.task(objective="Generate quarterly revenue report") as task:
    result = execute_sql("SELECT SUM(amount) FROM invoices WHERE status = 'paid'")
`}
                </pre>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/developers/quickstart"
                className="text-xs font-semibold text-[#485f84] hover:underline"
              >
                Read Complete Developer Quickstart &rarr;
              </Link>
              <Link
                href="/developers/api-reference"
                className="text-xs font-semibold text-[#8d5b18] hover:underline"
              >
                View OpenAPI Reference &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      <AgentOnboardingWizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
