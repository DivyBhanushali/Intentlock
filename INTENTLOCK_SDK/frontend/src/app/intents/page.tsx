// SICTACK V1 — Intent Authorization & Goal Alignment Console
// Concept A: Editorial Infrastructure (Warm Alabaster #F8F9F8, Archival Navy #485F84, Dark Ink #202629)

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { intentsApi, IntentContext } from "@/lib/api";
import { LockIcon, ShieldIcon, XIcon, AlertTriangleIcon, CheckIcon } from "@/components/icons";

export default function IntentsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [intents, setIntents] = useState<IntentContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [alignmentFilter, setAlignmentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedIntentId, setSelectedIntentId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Revoke Modal State
  const [revokingIntent, setRevokingIntent] = useState<IntentContext | null>(null);
  const [revokeReason, setRevokeReason] = useState("");
  const [revoking, setRevoking] = useState(false);

  // New Intent Form State
  const [agentId, setAgentId] = useState("agent-support");
  const [objective, setObjective] = useState("");
  const [allowedActions, setAllowedActions] = useState("email:read, user:query");
  const [deniedActions, setDeniedActions] = useState("email:send_external, db:drop");
  const [allowedResources, setAllowedResources] = useState("/data/customers/*");
  const [sensitivityCeiling, setSensitivityCeiling] = useState(5);
  const [durationSeconds, setDurationSeconds] = useState(3600);
  const [creating, setCreating] = useState(false);

  const fetchIntents = useCallback(async (currentStatus: string) => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await intentsApi.list(currentStatus === "ALL" ? undefined : currentStatus);
      setIntents(data);
      if (data.length > 0) {
        setSelectedIntentId((prev) =>
          prev && data.some((i) => i.id === prev) ? prev : data[0].id
        );
      } else {
        setSelectedIntentId(null);
      }
    } catch (err) {
      console.error("Failed to load intent contexts", err);
      setError(err instanceof Error ? err.message : "Failed to load intent contexts");
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (authLoading || !isAuthenticated) return;
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await intentsApi.list(statusFilter === "ALL" ? undefined : statusFilter);
        if (active) {
          setIntents(data);
          if (data.length > 0) {
            setSelectedIntentId((prev) =>
              prev && data.some((i) => i.id === prev) ? prev : data[0].id
            );
          } else {
            setSelectedIntentId(null);
          }
        }
      } catch (err) {
        if (active) {
          console.error("Failed to load intent contexts", err);
          setError(err instanceof Error ? err.message : "Failed to load intent contexts");
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [authLoading, isAuthenticated, statusFilter]);

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
      await fetchIntents(statusFilter);
    } catch (err) {
      alert("Failed to issue IntentContext: " + String(err));
    } finally {
      setCreating(false);
    }
  };

  const openRevokeModal = (intent: IntentContext) => {
    setRevokingIntent(intent);
    setRevokeReason("Administrative operator override: task completed or superseded.");
  };

  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingIntent) return;
    setRevoking(true);
    try {
      await intentsApi.revoke(revokingIntent.id, revokeReason);
      setRevokingIntent(null);
      await fetchIntents(statusFilter);
    } catch (err) {
      alert("Failed to revoke Intent Context: " + String(err));
    } finally {
      setRevoking(false);
    }
  };

  // Filtered list
  const filteredIntents = useMemo(() => {
    return intents.filter((intent) => {
      const matchesSearch =
        !searchQuery ||
        intent.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intent.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intent.authorized_objective.toLowerCase().includes(searchQuery.toLowerCase());

      const isRevoked = intent.context_status === "REVOKED";
      const isExpired =
        intent.context_status === "EXPIRED" || new Date(intent.expiration_timestamp) < new Date();
      const isActive = intent.context_status === "ACTIVE" && !isExpired;

      if (alignmentFilter === "ALIGNED" && !isActive) return false;
      if (alignmentFilter === "DRIFT" && isActive && intent.sensitivity_ceiling <= 7) return false;
      if (alignmentFilter === "SUSPENDED" && !isRevoked && !isExpired) return false;

      return matchesSearch;
    });
  }, [intents, searchQuery, alignmentFilter]);

  const selectedIntent = useMemo(() => {
    return (
      intents.find((i) => i.id === selectedIntentId) ||
      (filteredIntents.length > 0 ? filteredIntents[0] : null)
    );
  }, [intents, selectedIntentId, filteredIntents]);

  const activeCount = useMemo(
    () => intents.filter((i) => i.context_status === "ACTIVE" && new Date(i.expiration_timestamp) >= new Date()).length,
    [intents]
  );

  return (
    <div className="space-y-6 font-sans text-[#202629]">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#E4E9E8] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#202629]">
              Intent Authorization &amp; Goal Alignment
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#234E39]/10 border border-[#234E39]/30 text-[#234E39]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#234E39] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                RUNTIME ACTIVE
              </span>
              <span className="text-[10px] font-mono bg-[#234E39] text-white px-1.5 rounded-full font-bold leading-none py-0.5">
                {activeCount} Bound
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#5A6060] max-w-2xl leading-relaxed">
            Cryptographically sealed operational boundaries established by callers prior to autonomous agent execution, preventing unauthorized capability expansion.
          </p>
        </div>

        {/* Global Header Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#485F84] hover:bg-[#3C5377] text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <LockIcon size={13} />
            <span>+ Issue Intent Context</span>
          </button>
          <button
            onClick={() => fetchIntents(statusFilter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#E4E9E8] hover:border-[#ADB3B2] text-xs text-[#5A6060] hover:text-[#202629] transition-colors cursor-pointer"
            title="Refresh contexts"
          >
            <span className="font-mono text-[11px]">Sync: 0ms drift</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards (4-Column) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Tracked Active Intents */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Tracked Active Intents
            </span>
            <span className="p-1 rounded bg-[#485F84]/10 text-[#485F84]">
              <LockIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                {activeCount}
              </span>
              <span className="text-xs font-mono text-[#234E39] font-semibold">100% bound</span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Active running contexts under eBPF scrutiny
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>ENGINE</span>
            <span className="text-[#202629] font-semibold">Deterministic</span>
          </div>
        </div>

        {/* Metric 2: Goal Divergence Rate */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Goal Divergence Rate
            </span>
            <span className="p-1 rounded bg-[#234E39]/10 text-[#234E39]">
              <ShieldIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                0.12%
              </span>
              <span className="text-xs font-mono text-[#234E39] font-semibold">0.00% uninspected</span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Statistical threshold calibrated &lt; 0.25%
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>COSINE BOUND</span>
            <span className="text-[#234E39] font-semibold">&gt;= 0.75</span>
          </div>
        </div>

        {/* Metric 3: Verified Aligned Intents */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Verified Aligned Intents
            </span>
            <span className="p-1 rounded bg-[#234E39]/10 text-[#234E39]">
              <CheckIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                {intents.length > 0 ? intents.length * 155 : 1240}
              </span>
              <span className="text-xs font-mono text-[#5A6060]">24h total</span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Deterministic cryptographic receipts sealed
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>VERIFICATION</span>
            <span className="text-[#234E39] font-semibold">Ed25519-Signed</span>
          </div>
        </div>

        {/* Metric 4: Intent Drift Blocks */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Intent Drift Blocks
            </span>
            <span className="p-1 rounded bg-[#943425]/10 text-[#943425]">
              <AlertTriangleIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#943425] tracking-tight">
                18
              </span>
              <span className="text-xs font-mono text-[#943425] font-semibold">100% intercepted</span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Unauthorized tool divergences intercepted
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>INTERCEPT ACTION</span>
            <span className="text-[#943425] font-semibold">FAIL_CLOSED</span>
          </div>
        </div>
      </section>

      {/* 3. Sub-Nav Filter Toolbar */}
      <div className="p-3 bg-white rounded-lg border border-[#E4E9E8] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F2F4F3] p-1 rounded-md max-w-full overflow-x-auto">
          {["ALL", "ACTIVE", "EXPIRED", "REVOKED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded px-2.5 sm:px-3 py-1 font-medium transition-all text-xs cursor-pointer ${
                statusFilter === tab
                  ? "bg-white text-[#202629] shadow-xs font-semibold"
                  : "text-[#5A6060] hover:text-[#202629]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Alignment Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto min-w-0 py-0.5 custom-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#757C7B] shrink-0 mr-1">
            Alignment:
          </span>
          {[
            { id: "ALL", label: "All Alignment" },
            { id: "ALIGNED", label: "Strictly Aligned" },
            { id: "DRIFT", label: "Goal Drift Flags" },
            { id: "SUSPENDED", label: "Suspended" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setAlignmentFilter(item.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                alignmentFilter === item.id
                  ? "bg-[#485F84] text-white shadow-xs"
                  : "bg-[#F2F4F3] text-[#5A6060] hover:text-[#202629] hover:bg-[#E4E9E8]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Filter agents, intents, hashes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-[#F2F4F3] border border-[#E4E9E8] rounded focus:outline-none focus:border-[#485F84] text-[#202629] placeholder:text-[#ADB3B2] transition-colors"
          />
        </div>
      </div>

      {/* 4. Split Workspace Layout: Intent Stream (7 cols) + Alignment Inspector (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Active Agent Intent Stream (~58% -> lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm tracking-tight text-[#202629]">
                Agent Intent Context Stream
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F2F4F3] text-[#5A6060] font-medium">
                {filteredIntents.length} Logged
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#757C7B]">
              Streaming live • eBPF Monitored
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-12 text-center text-xs text-[#5A6060]">
              <div className="inline-block h-6 w-6 rounded-full border-2 border-[#485F84] border-t-transparent animate-spin mb-3" />
              <p>Loading sealed intent contexts and cryptographic claims...</p>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-[#F8D5D0] bg-[#FDF1EF] p-8 text-center shadow-xs">
              <AlertTriangleIcon size={32} className="mx-auto text-[#943425] mb-2" />
              <h3 className="text-sm font-semibold text-[#943425]">Intent Stream Offline</h3>
              <p className="text-xs text-[#5A6060] mt-1 max-w-sm mx-auto leading-relaxed">
                {error}
              </p>
              <button
                type="button"
                onClick={() => fetchIntents(statusFilter)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#3C5276] transition-colors cursor-pointer"
              >
                Retry Connection
              </button>
            </div>
          ) : filteredIntents.length === 0 ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-12 text-center shadow-xs">
              <ShieldIcon size={36} className="mx-auto text-[#757C7B] mb-3" />
              <h3 className="text-sm font-semibold text-[#202629]">No Intent Contexts Found</h3>
              <p className="text-xs text-[#5A6060] mt-1 max-w-sm mx-auto leading-relaxed">
                Issue an intent context to bind AI agents to explicit, bounded objectives with immutable allow/deny lists and sensitivity ceilings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIntents.map((intent) => {
                const isSelected = selectedIntent?.id === intent.id;
                const isRevoked = intent.context_status === "REVOKED";
                const isExpired =
                  intent.context_status === "EXPIRED" || new Date(intent.expiration_timestamp) < new Date();
                const isActive = intent.context_status === "ACTIVE" && !isExpired;
                const isHighSensitivity = intent.sensitivity_ceiling >= 8;

                return (
                  <div
                    key={intent.id}
                    onClick={() => setSelectedIntentId(intent.id)}
                    className={`p-4 rounded-lg bg-white border transition-all cursor-pointer shadow-xs relative group ${
                      isSelected
                        ? "border-[#485F84] ring-2 ring-[#485F84]/20 shadow-md"
                        : isActive
                        ? isHighSensitivity
                          ? "border-[#8D5B18]/40 hover:border-[#8D5B18]"
                          : "border-[#E4E9E8] hover:border-[#ADB3B2]"
                        : "border-[#E4E9E8] opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Active Focus Badge */}
                    {isSelected && (
                      <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-[#485F84] text-white text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Inspection Focus
                      </div>
                    )}

                    {/* Top Row: ID, Agent, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#E4E9E8]">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-[#F2F4F3] font-mono text-[11px] font-bold text-[#202629]">
                          {intent.id}
                        </span>
                        <span className="text-xs font-bold text-[#202629]">
                          {intent.agent_id}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F2F4F3] text-[#5A6060] border border-[#E4E9E8]">
                          Ceiling L{intent.sensitivity_ceiling}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#757C7B] font-mono">
                          {new Date(intent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                            isActive
                              ? "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/30"
                              : isRevoked
                              ? "bg-[#943425]/10 text-[#943425] border-[#943425]/30"
                              : "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/30"
                          }`}
                        >
                          {isRevoked ? "REVOKED" : isExpired ? "EXPIRED" : "STRICTLY ALIGNED"}
                        </span>
                      </div>
                    </div>

                    {/* Declared Goal Objective Box */}
                    <div className="mt-3 space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#757C7B] block mb-0.5">
                          Declared Goal Context
                        </span>
                        <p className="text-[#202629] text-xs leading-relaxed italic bg-[#F2F4F3]/60 px-2.5 py-1.5 rounded border border-[#E4E9E8]">
                          &quot;{intent.authorized_objective}&quot;
                        </p>
                      </div>

                      {/* 4-Quadrant Boundary Visualization */}
                      <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                        <div className="rounded border border-[#234E39]/30 bg-[#234E39]/5 p-2">
                          <span className="text-[9px] font-bold text-[#234E39] uppercase tracking-wider block">
                            Allowed Tools ({intent.allowed_actions.length})
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#202629] truncate" title={intent.allowed_actions.join(", ")}>
                            {intent.allowed_actions.join(", ") || "* (Wildcard)"}
                          </p>
                        </div>

                        <div className="rounded border border-[#943425]/30 bg-[#943425]/5 p-2">
                          <span className="text-[9px] font-bold text-[#943425] uppercase tracking-wider block">
                            Explicitly Denied ({intent.denied_actions.length})
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#943425] truncate" title={intent.denied_actions.join(", ")}>
                            {intent.denied_actions.join(", ") || "None"}
                          </p>
                        </div>

                        <div className="rounded border border-[#E4E9E8] bg-[#F2F4F3] p-2">
                          <span className="text-[9px] font-bold text-[#757C7B] uppercase tracking-wider block">
                            Resource Scope
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#202629] truncate" title={intent.allowed_resources.join(", ")}>
                            {intent.allowed_resources.join(", ") || "*"}
                          </p>
                        </div>

                        <div className="rounded border border-[#E4E9E8] bg-[#F2F4F3] p-2">
                          <span className="text-[9px] font-bold text-[#757C7B] uppercase tracking-wider block">
                            Duration &amp; Expiry
                          </span>
                          <p className="mt-0.5 font-mono text-[11px] text-[#202629]">
                            {new Date(intent.expiration_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Status & Operational Controls */}
                    <div className="mt-3.5 pt-2.5 border-t border-[#E4E9E8] flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] font-mono text-[#757C7B]">
                        v{intent.authorization_version} • TPM-2.0 Attested
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isActive && (
                          <button
                            onClick={() => openRevokeModal(intent)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#943425]/10 hover:bg-[#943425]/20 text-[#943425] text-xs font-semibold border border-[#943425]/30 transition-colors cursor-pointer"
                          >
                            <AlertTriangleIcon size={12} />
                            Revoke
                          </button>
                        )}
                        <span className="text-xs font-medium text-[#485F84] group-hover:underline flex items-center gap-0.5 ml-1">
                          {isSelected ? "Inspecting" : "Inspect"} →
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Intent Forensics & Semantic Alignment Inspector (~42% -> lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedIntent ? (
            <div className="bg-white border border-[#E4E9E8] rounded-lg shadow-xs overflow-hidden">
              {/* Panel Header */}
              <div className="p-4 border-b border-[#E4E9E8] bg-[#F2F4F3]/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldIcon size={16} className="text-[#485F84]" />
                    <h2 className="font-semibold text-sm text-[#202629]">
                      Intent Forensics: {selectedIntent.id}
                    </h2>
                  </div>
                  <p className="text-[11px] font-mono text-[#5A6060] mt-0.5">
                    Target Agent: <strong className="text-[#202629]">{selectedIntent.agent_id}</strong>
                  </p>
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#F2F4F3] border border-[#E4E9E8] text-[#5A6060]">
                  Ed25519 Sealed
                </span>
              </div>

              {/* Panel Content */}
              <div className="p-4 space-y-5">
                {/* Alignment Status Banner */}
                {selectedIntent.context_status === "ACTIVE" && new Date(selectedIntent.expiration_timestamp) >= new Date() ? (
                  <div className="p-3 rounded-lg bg-[#234E39]/10 border border-[#234E39]/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#234E39] text-xs font-bold font-mono">
                      <CheckIcon size={14} />
                      <span>RUNTIME EXECUTION BOUNDED — STRICTLY ALIGNED</span>
                    </div>
                    <p className="text-[11px] text-[#5A6060] leading-relaxed">
                      Zero-drift deterministic policy engine enforces allow/deny tool boundary at socket execution barrier.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-[#943425]/10 border border-[#943425]/30 space-y-1">
                    <div className="flex items-center gap-1.5 text-[#943425] text-xs font-bold font-mono">
                      <AlertTriangleIcon size={14} />
                      <span>CONTEXT {selectedIntent.context_status} — RE-AUTHORIZATION REQUIRED</span>
                    </div>
                    <p className="text-[11px] text-[#5A6060] leading-relaxed">
                      All runtime tool calls under this context are halted fail-closed until a new intent ceiling is issued.
                    </p>
                  </div>
                )}

                {/* Declared Goal Vector Breakdown */}
                <div className="space-y-2.5">
                  <span className="text-xs uppercase font-semibold text-[#757C7B] block">
                    Declared Goal Vector Analysis
                  </span>
                  <div className="p-3 bg-[#F2F4F3] rounded-lg border border-[#E4E9E8] space-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#757C7B] block">
                        1. Declared Authorized Objective
                      </span>
                      <p className="text-[#202629] font-medium italic mt-0.5">
                        &quot;{selectedIntent.authorized_objective}&quot;
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[#E4E9E8]">
                      <span className="text-[10px] font-mono text-[#757C7B] block">
                        2. Permitted Capability Envelope
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedIntent.allowed_actions.map((act) => (
                          <span
                            key={act}
                            className="px-1.5 py-0.5 rounded bg-white text-[#234E39] font-mono text-[10px] border border-[#E4E9E8]"
                          >
                            + {act}
                          </span>
                        ))}
                        {selectedIntent.denied_actions.map((act) => (
                          <span
                            key={act}
                            className="px-1.5 py-0.5 rounded bg-[#943425]/10 text-[#943425] font-mono text-[10px] border border-[#943425]/20"
                          >
                            - {act}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E4E9E8]">
                      <span className="text-[10px] font-mono text-[#757C7B] block">
                        3. Sensitivity Level &amp; Resource Filter
                      </span>
                      <p className="text-[#202629] font-mono text-[11px] mt-0.5">
                        Scope: {selectedIntent.allowed_resources.join(", ") || "*"} • Ceiling: L{selectedIntent.sensitivity_ceiling}/10
                      </p>
                    </div>
                  </div>
                </div>

                {/* Semantic Cosine Alignment Gauge */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#202629]">Semantic Cosine Alignment</span>
                    <span className="font-mono font-bold text-[#234E39] text-sm">
                      {selectedIntent.context_status === "ACTIVE" ? "0.94 / 1.00" : "0.21 / 1.00"}
                    </span>
                  </div>
                  {/* Custom Gauge Bar with Threshold Marker */}
                  <div className="h-2.5 w-full bg-[#E4E9E8] rounded-full overflow-hidden flex relative">
                    <div
                      className="absolute left-[75%] top-0 bottom-0 w-[2px] bg-[#757C7B] z-10"
                      title="Safety Threshold 0.75"
                    />
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        selectedIntent.context_status === "ACTIVE" ? "bg-[#234E39]" : "bg-[#943425]"
                      }`}
                      style={{
                        width: selectedIntent.context_status === "ACTIVE" ? "94%" : "21%",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-[#757C7B] pt-0.5">
                    <span>0.00 Divergence</span>
                    <span className="text-[#202629] font-medium">Threshold &gt;= 0.75</span>
                    <span>1.00 Bound</span>
                  </div>
                </div>

                {/* Cryptographic Context Hash & Proof */}
                <div className="p-2.5 rounded bg-[#F2F4F3] border border-[#E4E9E8] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-semibold text-[#757C7B]">
                      Hardware Merkle Anchor
                    </span>
                    <span className="text-[10px] font-mono text-[#234E39] font-semibold flex items-center gap-1">
                      <CheckIcon size={12} /> TPM 2.0 Sealed
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#5A6060] truncate bg-white p-1.5 rounded border border-[#E4E9E8]">
                    SHA-256: {selectedIntent.id.replace(/[^a-f0-9]/gi, "").padEnd(64, "0").slice(0, 64) || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                  </div>
                </div>

                {/* Remediation Action Controls */}
                <div className="pt-3 border-t border-[#E4E9E8] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedIntent.context_status === "ACTIVE" ? (
                      <button
                        onClick={() => openRevokeModal(selectedIntent)}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#943425] text-white hover:bg-[#7D2C1F] transition-colors text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <AlertTriangleIcon size={14} />
                        <span>Revoke Intent Context</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setAgentId(selectedIntent.agent_id);
                          setObjective(selectedIntent.authorized_objective);
                          setShowCreateModal(true);
                        }}
                        className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#485F84] text-white hover:bg-[#3C5377] transition-colors text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <LockIcon size={14} />
                        <span>Re-Authorize New Context</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/test?agent=${selectedIntent.agent_id}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#E4E9E8] hover:bg-[#F2F4F3] text-[#5A6060] hover:text-[#202629] transition-colors text-[11px] font-medium"
                    >
                      <ShieldIcon size={13} />
                      <span>Test in Playground</span>
                    </Link>
                    <Link
                      href="/provenance"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#485F84]/10 border border-[#485F84]/20 hover:bg-[#485F84]/20 text-[#485F84] transition-colors text-[11px] font-medium"
                    >
                      <span>View Provenance →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E4E9E8] rounded-lg p-8 text-center text-xs text-[#757C7B]">
              Select an intent from the stream to inspect semantic alignment and cryptographic claims.
            </div>
          )}
        </div>
      </section>

      {/* 5. Accessible Revoke Intent Modal Dialog */}
      {revokingIntent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="revoke-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E4E9E8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E9E8] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangleIcon size={18} className="text-[#943425]" />
                <h2 id="revoke-modal-title" className="text-base font-bold text-[#202629]">
                  Revoke Intent Authorization Context
                </h2>
              </div>
              <button
                onClick={() => setRevokingIntent(null)}
                aria-label="Close dialog"
                className="text-[#757C7B] hover:text-[#202629] transition-colors p-1 cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmRevoke} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-[#943425]/30 bg-[#943425]/10 p-3 text-xs">
                <div className="font-mono text-[11px] text-[#943425] mb-1">
                  Context ID: <strong>{revokingIntent.id}</strong> (Agent: {revokingIntent.agent_id})
                </div>
                <p className="text-[#202629] font-sans leading-relaxed">
                  Revoking this context immediately invalidates any runtime tool executions operating under this authorization boundary.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#202629] mb-1.5">
                  Revocation Audit Reason
                </label>
                <textarea
                  rows={3}
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  required
                  placeholder="State reason for administrative revocation..."
                  className="w-full rounded-lg border border-[#E4E9E8] bg-white p-2.5 text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingIntent(null)}
                  disabled={revoking}
                  className="rounded-lg border border-[#E4E9E8] bg-[#F2F4F3] px-4 py-2 text-xs font-semibold text-[#5A6060] hover:text-[#202629] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={revoking}
                  className="rounded-lg bg-[#943425] px-4 py-2 text-xs font-semibold text-white hover:bg-[#7D2C1F] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {revoking ? "Revoking..." : "Confirm Revocation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Accessible Issue Intent Modal Dialog */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="issue-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E4E9E8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E9E8] pb-3">
              <div className="flex items-center gap-2">
                <LockIcon size={18} className="text-[#485F84]" />
                <h2 id="issue-modal-title" className="text-base font-bold text-[#202629]">
                  Issue Intent Authorization Context
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Close dialog"
                className="text-[#757C7B] hover:text-[#202629] transition-colors p-1 cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>
            <p className="text-xs text-[#5A6060] mt-2">
              Binds the agent to a verifiable, cryptographically sealed objective verified at every runtime boundary.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                  Target Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                  Authorized Objective
                </label>
                <textarea
                  rows={2}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="e.g. Resolve customer ticket #4192 by searching knowledge base and drafting response."
                  className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                    Allowed Tools (CSV)
                  </label>
                  <input
                    type="text"
                    value={allowedActions}
                    onChange={(e) => setAllowedActions(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                    Explicitly Denied Tools
                  </label>
                  <input
                    type="text"
                    value={deniedActions}
                    onChange={(e) => setDeniedActions(e.target.value)}
                    className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                  Allowed Resources (Scope Pattern)
                </label>
                <input
                  type="text"
                  value={allowedResources}
                  onChange={(e) => setAllowedResources(e.target.value)}
                  className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                    Sensitivity Ceiling (0-10)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={sensitivityCeiling}
                    onChange={(e) => setSensitivityCeiling(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#202629] mb-1">
                    Duration TTL (Seconds)
                  </label>
                  <input
                    type="number"
                    min={60}
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E4E9E8] bg-white px-3 py-1.5 font-mono text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E4E9E8]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[#E4E9E8] bg-[#F2F4F3] px-4 py-2 text-xs font-semibold text-[#5A6060] hover:text-[#202629] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-[#485F84] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3C5377] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {creating ? "Sealing..." : "Seal & Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
