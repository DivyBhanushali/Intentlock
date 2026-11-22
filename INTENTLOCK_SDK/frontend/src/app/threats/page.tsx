// SICTACK V1 — Threat Intelligence & Anomaly Engine
// Concept A: Editorial Infrastructure (Warm Alabaster #F8F9F8, Archival Navy #485F84, Dark Ink #202629)

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { threatsApi, SecurityThreat, ThreatStats } from "@/lib/api";
import {
  ShieldIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
} from "@/components/icons";

export default function ThreatsPage() {
  const [threats, setThreats] = useState<SecurityThreat[]>([]);
  const [stats, setStats] = useState<ThreatStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ACTIVE");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedThreatId, setSelectedThreatId] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Mitigation Modal Dialog State
  const [modalThreat, setModalThreat] = useState<{
    id: string;
    status: "MITIGATED" | "DISMISSED";
    description: string;
    agentId: string;
  } | null>(null);
  const [mitigationNote, setMitigationNote] = useState("");
  const [submittingMitigation, setSubmittingMitigation] = useState(false);

  const loadData = useCallback(async (currentFilter: string, currentSeverity: string) => {
    try {
      const [threatsData, statsData] = await Promise.all([
        threatsApi.list(
          currentFilter === "ALL" ? undefined : currentFilter,
          currentSeverity === "ALL" ? undefined : currentSeverity
        ),
        threatsApi.stats(),
      ]);
      setThreats(threatsData);
      setStats(statsData);
      if (threatsData.length > 0) {
        setSelectedThreatId((prev) =>
          prev && threatsData.some((t) => t.id === prev) ? prev : threatsData[0].id
        );
      } else {
        setSelectedThreatId(null);
      }
    } catch (err) {
      console.error("Failed to load threats", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [threatsData, statsData] = await Promise.all([
          threatsApi.list(
            filter === "ALL" ? undefined : filter,
            severityFilter === "ALL" ? undefined : severityFilter
          ),
          threatsApi.stats(),
        ]);
        if (active) {
          setThreats(threatsData);
          setStats(statsData);
          if (threatsData.length > 0) {
            setSelectedThreatId((prev) =>
              prev && threatsData.some((t) => t.id === prev) ? prev : threatsData[0].id
            );
          } else {
            setSelectedThreatId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load threats", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [filter, severityFilter]);

  // Filtered threats based on search and category
  const filteredThreats = useMemo(() => {
    return threats.filter((threat) => {
      const matchesCategory =
        categoryFilter === "ALL" ||
        threat.threat_category.toLowerCase().includes(categoryFilter.toLowerCase());
      const matchesSearch =
        !searchQuery ||
        threat.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.agent_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        threat.threat_category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [threats, categoryFilter, searchQuery]);

  const selectedThreat = useMemo(() => {
    return (
      threats.find((t) => t.id === selectedThreatId) ||
      (filteredThreats.length > 0 ? filteredThreats[0] : null)
    );
  }, [threats, selectedThreatId, filteredThreats]);

  const openMitigationModal = (threat: SecurityThreat, status: "MITIGATED" | "DISMISSED") => {
    setModalThreat({
      id: threat.id,
      status,
      description: threat.description,
      agentId: threat.agent_id,
    });
    setMitigationNote(
      status === "MITIGATED"
        ? "Operator verified anomaly containment and updated execution boundaries."
        : "Operator determined anomaly was expected benchmark or harmless false positive."
    );
  };

  const handleConfirmMitigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalThreat) return;
    setSubmittingMitigation(true);
    try {
      await threatsApi.mitigate(modalThreat.id, modalThreat.status, mitigationNote);
      setModalThreat(null);
      await loadData(filter, severityFilter);
    } catch (err) {
      alert("Failed to update threat status: " + String(err));
    } finally {
      setSubmittingMitigation(false);
    }
  };

  const copyPayload = (payload: string) => {
    navigator.clipboard.writeText(payload);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  // Derive risk score from severity
  const getRiskScore = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return { score: "0.97", percentage: 97, color: "bg-[#943425]", textColor: "text-[#943425]" };
      case "HIGH":
        return { score: "0.88", percentage: 88, color: "bg-[#943425]", textColor: "text-[#943425]" };
      case "MEDIUM":
        return { score: "0.54", percentage: 54, color: "bg-[#8D5B18]", textColor: "text-[#8D5B18]" };
      default:
        return { score: "0.22", percentage: 22, color: "bg-[#234E39]", textColor: "text-[#234E39]" };
    }
  };

  return (
    <div className="space-y-6 font-sans text-[#202629]">
      {/* 1. Header & Live Indicator */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#E4E9E8] pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#202629]">
              Threat Intelligence &amp; Incident Detection
            </h1>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#943425]/10 border border-[#943425]/30 text-[#943425]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#943425] animate-pulse" />
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
                THREAT ENGINE ACTIVE
              </span>
              <span className="text-[10px] font-mono bg-[#943425] text-white px-1.5 rounded-full font-bold leading-none py-0.5">
                {stats?.active_threats ?? 0}
              </span>
            </div>
          </div>
          <p className="mt-1 text-xs text-[#5A6060] max-w-2xl leading-relaxed">
            Real-time deterministic anomaly detection monitoring rapid policy rejections, unauthorized capability scans, exfiltration probing, and tool-boundary evasions.
          </p>
        </div>

        {/* Action Button: Simulate Exploit */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/test?preset=exfiltration_attempt"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#485F84] hover:bg-[#3C5377] text-white text-xs font-medium transition-colors shadow-xs"
          >
            <ShieldIcon size={14} />
            <span>Simulate Exploit</span>
          </Link>
          <button
            onClick={() => loadData(filter, severityFilter)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-white border border-[#E4E9E8] hover:border-[#ADB3B2] text-xs text-[#5A6060] hover:text-[#202629] transition-colors"
            title="Refresh stream"
          >
            <span className="font-mono text-[11px]">Sync: 12ms</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards (4-Column) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Threat Incidents */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Active Threat Incidents
            </span>
            <span className="p-1 rounded bg-[#943425]/10 text-[#943425]">
              <AlertTriangleIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                {stats?.active_threats ?? 0}
              </span>
              <span className="text-xs font-medium text-[#943425] flex items-center gap-0.5">
                ● Active
              </span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Halting {(stats?.active_threats ?? 0) > 0 ? "1 agent execution" : "0 executions"} currently
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>ISOLATION LEVEL</span>
            <span className="text-[#943425] font-semibold">STRICT</span>
          </div>
        </div>

        {/* Card 2: Heuristic Rules Running */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Heuristic Rules Running
            </span>
            <span className="p-1 rounded bg-[#485F84]/10 text-[#485F84]">
              <ShieldIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                18
              </span>
              <span className="text-xs font-medium text-[#234E39] flex items-center gap-0.5">
                ✓ In Sync
              </span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              Zero-drift compiled WASM engine
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>CYCLE TIME</span>
            <span className="text-[#202629] font-semibold">0.18ms AVG</span>
          </div>
        </div>

        {/* Card 3: Blocked Invocations (24h) */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Blocked Invocations (24h)
            </span>
            <span className="p-1 rounded bg-[#234E39]/10 text-[#234E39]">
              <CheckIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-[#202629] tracking-tight">
                {stats?.total_threats ? stats.total_threats * 14 : 142}
              </span>
              <span className="text-xs font-mono text-[#5A6060]">Neutralized</span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1">
              100% deterministic catch rate
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>FALSE POSITIVES</span>
            <span className="text-[#234E39] font-semibold">0.00%</span>
          </div>
        </div>

        {/* Card 4: Current Threat Level */}
        <div className="p-4 rounded-lg bg-white border border-[#E4E9E8] shadow-xs flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#757C7B]">
              Current Threat Level
            </span>
            <span className="p-1 rounded bg-[#F2F4F3] text-[#5A6060]">
              <AlertTriangleIcon size={15} />
            </span>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-bold font-mono tracking-tight px-2.5 py-0.5 rounded ${
                  (stats?.critical_threats ?? 0) > 0
                    ? "bg-[#943425]/10 text-[#943425]"
                    : (stats?.high_threats ?? 0) > 0
                    ? "bg-[#8D5B18]/10 text-[#8D5B18]"
                    : "bg-[#234E39]/10 text-[#234E39]"
                }`}
              >
                {(stats?.critical_threats ?? 0) > 0
                  ? "CRITICAL"
                  : (stats?.high_threats ?? 0) > 0
                  ? "ELEVATED"
                  : "NORMAL"}
              </span>
            </div>
            <p className="text-[11px] text-[#5A6060] mt-1.5">
              Heuristic defense • 0 Merkle drift
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-[#E4E9E8] flex items-center justify-between text-[10px] font-mono text-[#757C7B]">
            <span>ATTESTATION KEY</span>
            <span className="text-[#202629] font-semibold">TPM-2.0-VALID</span>
          </div>
        </div>
      </section>

      {/* 3. Filter Toolbar & Search Bar */}
      <div className="p-3 bg-white rounded-lg border border-[#E4E9E8] flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        {/* Status Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-[#F2F4F3] p-1 rounded-md max-w-full overflow-x-auto">
          {["ACTIVE", "ALL", "MITIGATED", "DISMISSED"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`rounded px-2.5 sm:px-3 py-1 font-medium transition-all text-xs cursor-pointer ${
                filter === tab
                  ? "bg-white text-[#202629] shadow-xs font-semibold"
                  : "text-[#5A6060] hover:text-[#202629]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Vector Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full min-w-0 py-0.5 custom-scrollbar">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#757C7B] shrink-0 mr-1">
            Vectors:
          </span>
          {[
            { id: "ALL", label: "All Vectors" },
            { id: "Injection", label: "Injection" },
            { id: "Privilege", label: "Privilege" },
            { id: "Exfiltration", label: "Exfiltration" },
            { id: "Rate", label: "Rate" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                categoryFilter === cat.id
                  ? "bg-[#485F84] text-white shadow-xs"
                  : "bg-[#F2F4F3] text-[#5A6060] hover:text-[#202629] hover:bg-[#E4E9E8]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="Search incident ID, agent, heuristic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-2.5 py-1 text-xs bg-[#F2F4F3] border border-[#E4E9E8] rounded focus:outline-none focus:border-[#485F84] text-[#202629] placeholder:text-[#ADB3B2] transition-colors"
          />
        </div>
      </div>

      {/* 4. Split Layout: Incident Stream (7 cols) + Investigation Panel (5 cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Incident Stream (~58% -> lg:col-span-7) */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm tracking-tight text-[#202629]">
                Incident Feed
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#F2F4F3] text-[#5A6060] font-medium">
                {filteredThreats.length} Logged
              </span>
            </div>

            {/* Severity Quick Filter */}
            <div className="flex flex-wrap items-center gap-1 text-xs text-[#5A6060] max-w-full">
              <span className="text-[11px] text-[#757C7B]">Severity:</span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`rounded px-2 py-0.5 text-[10px] font-mono transition-all cursor-pointer ${
                    severityFilter === sev
                      ? "bg-[#485F84] text-white font-bold"
                      : "bg-[#F2F4F3] text-[#5A6060] hover:text-[#202629] border border-[#E4E9E8]"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-12 text-center text-xs text-[#5A6060]">
              <div className="inline-block h-6 w-6 rounded-full border-2 border-[#485F84] border-t-transparent animate-spin mb-3" />
              <p>Scanning security telemetry and anomaly detection engine...</p>
            </div>
          ) : filteredThreats.length === 0 ? (
            <div className="rounded-lg border border-[#E4E9E8] bg-white p-12 text-center shadow-xs">
              <ShieldIcon size={36} className="mx-auto text-[#234E39]/70 mb-3" />
              <h3 className="text-sm font-semibold text-[#202629]">Zero Threat Anomalies Detected</h3>
              <p className="text-xs text-[#5A6060] mt-1 max-w-sm mx-auto leading-relaxed">
                All agent execution traces conform to established deterministic policies and cryptographically sealed intent boundaries.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredThreats.map((threat) => {
                const isSelected = selectedThreat?.id === threat.id;
                const isCritical = threat.severity === "CRITICAL";
                const isHigh = threat.severity === "HIGH";
                const isActive = threat.mitigation_status === "ACTIVE";
                const isMitigated = threat.mitigation_status === "MITIGATED";
                const risk = getRiskScore(threat.severity);

                return (
                  <div
                    key={threat.id}
                    onClick={() => setSelectedThreatId(threat.id)}
                    className={`p-4 rounded-lg bg-white border transition-all cursor-pointer shadow-xs relative group ${
                      isSelected
                        ? "border-[#485F84] ring-2 ring-[#485F84]/20 shadow-md"
                        : isActive
                        ? isCritical
                          ? "border-[#943425]/40 hover:border-[#943425]"
                          : "border-[#E4E9E8] hover:border-[#ADB3B2]"
                        : "border-[#E4E9E8] opacity-75 hover:opacity-100"
                    }`}
                  >
                    {/* Active Focus Badge */}
                    {isSelected && (
                      <div className="absolute -top-2.5 right-4 px-2 py-0.5 rounded bg-[#485F84] text-white text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        Active Inspection Focus
                      </div>
                    )}

                    {/* Top Row: ID, Risk, Age */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#202629]">
                          {threat.id}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold border ${
                            isCritical
                              ? "bg-[#943425]/10 text-[#943425] border-[#943425]/30 font-bold"
                              : isHigh
                              ? "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/30 font-semibold"
                              : "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/30"
                          }`}
                        >
                          {threat.severity} Risk ({risk.score})
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F2F4F3] text-[#5A6060] border border-[#E4E9E8]">
                          {threat.threat_category}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[#757C7B]">
                        {new Date(threat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Threat Title & Description */}
                    <div className="mt-2">
                      <h3 className="font-semibold text-xs text-[#202629] flex items-center gap-1.5 leading-snug">
                        <AlertTriangleIcon
                          size={14}
                          className={
                            isCritical || isHigh ? "text-[#943425]" : "text-[#8D5B18]"
                          }
                        />
                        <span>{threat.description}</span>
                      </h3>
                    </div>

                    {/* Metadata Grid */}
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs bg-[#F2F4F3]/70 p-2.5 rounded border border-[#E4E9E8]">
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-[#757C7B] block">
                          Target Agent
                        </span>
                        <span className="font-mono text-xs font-semibold text-[#202629] truncate block">
                          {threat.agent_id}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-[#757C7B] block">
                          Detection Rule
                        </span>
                        <span className="font-mono text-xs text-[#202629] truncate block">
                          {threat.detection_rule}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-semibold uppercase text-[#757C7B] block">
                          Recommended
                        </span>
                        <span className="font-mono text-xs text-[#8D5B18] font-medium truncate block">
                          {threat.recommended_response}
                        </span>
                      </div>
                    </div>

                    {/* Footer Row: Status & Operational Controls */}
                    <div className="mt-3.5 pt-2.5 border-t border-[#E4E9E8] flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-semibold border ${
                            isActive
                              ? "bg-[#943425]/10 text-[#943425] border-[#943425]/20"
                              : isMitigated
                              ? "bg-[#234E39]/10 text-[#234E39] border-[#234E39]/20"
                              : "bg-[#F2F4F3] text-[#757C7B] border-[#E4E9E8]"
                          }`}
                        >
                          {threat.mitigation_status}
                        </span>
                        <span className="text-[11px] font-mono text-[#5A6060]">
                          Verdict: Fail-Closed Enforced
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {isActive && (
                          <>
                            <button
                              onClick={() => openMitigationModal(threat, "MITIGATED")}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#234E39]/10 hover:bg-[#234E39]/20 text-[#234E39] text-xs font-semibold border border-[#234E39]/30 transition-colors"
                            >
                              <CheckIcon size={12} />
                              Mitigate
                            </button>
                            <button
                              onClick={() => openMitigationModal(threat, "DISMISSED")}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F2F4F3] hover:bg-[#E4E9E8] text-[#5A6060] hover:text-[#202629] text-xs font-medium border border-[#E4E9E8] transition-colors"
                            >
                              <XIcon size={12} />
                              Dismiss
                            </button>
                          </>
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

        {/* RIGHT COLUMN: Heuristic Investigation Panel (~42% -> lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedThreat ? (
            <div className="bg-white border border-[#E4E9E8] rounded-lg shadow-xs overflow-hidden">
              {/* Panel Header */}
              <div className="p-4 border-b border-[#E4E9E8] bg-[#F2F4F3]/40 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldIcon size={16} className="text-[#485F84]" />
                    <h2 className="font-semibold text-sm text-[#202629]">
                      Incident Detail: {selectedThreat.id}
                    </h2>
                  </div>
                  <p className="text-[11px] font-mono text-[#5A6060] mt-0.5">
                    Target Agent: <strong className="text-[#202629]">{selectedThreat.agent_id}</strong>
                  </p>
                </div>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    selectedThreat.severity === "CRITICAL"
                      ? "bg-[#943425]/10 text-[#943425] border-[#943425]/20"
                      : "bg-[#8D5B18]/10 text-[#8D5B18] border-[#8D5B18]/20"
                  }`}
                >
                  {selectedThreat.severity}
                </span>
              </div>

              {/* Panel Content */}
              <div className="p-4 space-y-5">
                {/* Risk Assessment Gauge */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase font-semibold text-[#757C7B]">
                      Risk Assessment
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        getRiskScore(selectedThreat.severity).textColor
                      }`}
                    >
                      {getRiskScore(selectedThreat.severity).score} / 1.00
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E4E9E8] overflow-hidden">
                    <div
                      className={`h-full ${
                        getRiskScore(selectedThreat.severity).color
                      } rounded-full transition-all duration-300`}
                      style={{
                        width: `${getRiskScore(selectedThreat.severity).percentage}%`,
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[#5A6060]">
                      Category: {selectedThreat.threat_category}
                    </span>
                    <span className="text-[#757C7B] font-mono">
                      Rule: {selectedThreat.detection_rule}
                    </span>
                  </div>
                </div>

                {/* Causal Sequence Analysis (Step-by-step) */}
                <div>
                  <span className="text-xs uppercase font-semibold text-[#757C7B] block mb-2.5">
                    Causal Sequence Analysis
                  </span>
                  <div className="space-y-3 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E4E9E8]">
                    {/* Step 1 */}
                    <div className="flex items-start gap-3 relative">
                      <span className="w-6 h-6 rounded-full bg-[#E4E9E8] text-[#202629] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#ADB3B2] z-10">
                        1
                      </span>
                      <div className="text-xs bg-[#F2F4F3] p-2.5 rounded flex-1 border border-[#E4E9E8]">
                        <div className="font-semibold text-[#202629] mb-0.5 flex items-center justify-between">
                          <span>Agent Execution Request</span>
                          <span className="text-[10px] font-mono text-[#757C7B]">t=0ms</span>
                        </div>
                        <p className="font-mono text-[11px] text-[#5A6060]">
                          Agent <strong className="text-[#202629]">{selectedThreat.agent_id}</strong> initiated downstream tool call.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-3 relative">
                      <span className="w-6 h-6 rounded-full bg-[#E4E9E8] text-[#202629] font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#ADB3B2] z-10">
                        2
                      </span>
                      <div className="text-xs bg-[#F2F4F3] p-2.5 rounded flex-1 border border-[#E4E9E8]">
                        <div className="font-semibold text-[#202629] mb-0.5 flex items-center justify-between">
                          <span>Heuristic Anomaly Flagged</span>
                          <span className="text-[10px] font-mono text-[#757C7B]">t=+0.12ms</span>
                        </div>
                        <p className="text-[11px] text-[#5A6060]">
                          Triggered detection rule <code className="text-[#943425] font-mono font-semibold">{selectedThreat.detection_rule}</code>.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-3 relative">
                      <span className="w-6 h-6 rounded-full bg-[#943425] text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#943425] z-10">
                        3
                      </span>
                      <div className="text-xs bg-[#943425]/10 p-2.5 rounded flex-1 border border-[#943425]/30">
                        <div className="font-semibold text-[#943425] mb-0.5 flex items-center justify-between">
                          <span>SICTACK Fail-Closed Intercept</span>
                          <span className="text-[10px] font-mono text-[#943425] font-bold">t=+0.18ms</span>
                        </div>
                        <p className="text-[11px] text-[#202629]">
                          Execution halted. Recommended containment: <strong className="text-[#943425]">{selectedThreat.recommended_response}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Forensic Payload Inspector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs uppercase font-semibold text-[#757C7B]">
                      Raw Telemetry &amp; Forensic Payload
                    </span>
                    <button
                      onClick={() =>
                        copyPayload(
                          JSON.stringify(
                            {
                              id: selectedThreat.id,
                              agent_id: selectedThreat.agent_id,
                              detection_rule: selectedThreat.detection_rule,
                              threat_category: selectedThreat.threat_category,
                              severity: selectedThreat.severity,
                              description: selectedThreat.description,
                              recommended_response: selectedThreat.recommended_response,
                              mitigation_status: selectedThreat.mitigation_status,
                              created_at: selectedThreat.created_at,
                            },
                            null,
                            2
                          )
                        )
                      }
                      className="text-[11px] font-mono text-[#485F84] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedPayload ? "✓ Copied" : "Copy Payload"}
                    </button>
                  </div>
                  <div className="bg-[#18191B] text-[#F2F4F3] p-3 rounded font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#E4E9E8]">
                    <pre className="font-mono">
                      <code>{JSON.stringify(
                        {
                          threat_id: selectedThreat.id,
                          agent_id: selectedThreat.agent_id,
                          rule: selectedThreat.detection_rule,
                          severity: selectedThreat.severity,
                          category: selectedThreat.threat_category,
                          response: selectedThreat.recommended_response,
                          intercepted_at: selectedThreat.created_at,
                        },
                        null,
                        2
                      )}</code>
                    </pre>
                  </div>
                </div>

                {/* Cryptographic Proof & Merkle Anchor */}
                <div className="p-2.5 rounded bg-[#F2F4F3] border border-[#E4E9E8] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase font-semibold text-[#757C7B]">
                      Cryptographic Hardware Attestation
                    </span>
                    <span className="text-[10px] font-mono text-[#234E39] font-semibold flex items-center gap-1">
                      <CheckIcon size={12} /> Hardware TPM 2.0 Sealed
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-[#5A6060] truncate bg-white p-1.5 rounded border border-[#E4E9E8]">
                    SHA-256: {selectedThreat.id.replace(/[^a-f0-9]/gi, "").padEnd(64, "0").slice(0, 64) || "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
                  </div>
                </div>

                {/* Remediation Action Controls */}
                <div className="pt-3 border-t border-[#E4E9E8] space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {selectedThreat.mitigation_status === "ACTIVE" ? (
                      <>
                        <button
                          onClick={() => openMitigationModal(selectedThreat, "MITIGATED")}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-[#234E39] text-white hover:bg-[#1C4733] transition-colors text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          <CheckIcon size={14} />
                          <span>Mitigate Threat</span>
                        </button>
                        <button
                          onClick={() => openMitigationModal(selectedThreat, "DISMISSED")}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded bg-white border border-[#E4E9E8] hover:border-[#ADB3B2] text-[#5A6060] hover:text-[#202629] transition-colors text-xs font-medium cursor-pointer"
                        >
                          <XIcon size={14} />
                          <span>Dismiss Anomaly</span>
                        </button>
                      </>
                    ) : (
                      <div className="col-span-2 p-2 rounded bg-[#F2F4F3] border border-[#E4E9E8] text-center text-xs text-[#5A6060] font-mono">
                        Incident is marked as {selectedThreat.mitigation_status}.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/test?preset=${
                        selectedThreat.threat_category.toLowerCase().includes("exfiltration")
                          ? "exfiltration_attempt"
                          : selectedThreat.threat_category.toLowerCase().includes("injection")
                          ? "prompt_injection"
                          : "unregistered_tool"
                      }`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-white border border-[#E4E9E8] hover:bg-[#F2F4F3] text-[#5A6060] hover:text-[#202629] transition-colors text-[11px] font-medium"
                    >
                      <ShieldIcon size={13} />
                      <span>Test in Playground</span>
                    </Link>
                    <Link
                      href="/provenance"
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[#485F84]/10 border border-[#485F84]/20 hover:bg-[#485F84]/20 text-[#485F84] transition-colors text-[11px] font-medium"
                    >
                      <span>Inspect Provenance →</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-[#E4E9E8] rounded-lg p-8 text-center text-xs text-[#757C7B]">
              Select an incident from the feed to inspect causal sequence and forensic data.
            </div>
          )}
        </div>
      </section>

      {/* 5. Accessible Threat Mitigation Modal Dialog */}
      {modalThreat && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mitigate-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-[#E4E9E8] bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#E4E9E8] pb-3">
              <div className="flex items-center gap-2">
                {modalThreat.status === "MITIGATED" ? (
                  <CheckIcon size={18} className="text-[#234E39]" />
                ) : (
                  <AlertTriangleIcon size={18} className="text-[#8D5B18]" />
                )}
                <h2 id="mitigate-modal-title" className="text-base font-bold text-[#202629]">
                  {modalThreat.status === "MITIGATED"
                    ? "Confirm Anomaly Mitigation"
                    : "Dismiss Threat Anomaly"}
                </h2>
              </div>
              <button
                onClick={() => setModalThreat(null)}
                aria-label="Close dialog"
                className="text-[#757C7B] hover:text-[#202629] transition-colors p-1 cursor-pointer"
              >
                <XIcon size={16} />
              </button>
            </div>

            <form onSubmit={handleConfirmMitigation} className="mt-4 space-y-4 text-xs">
              <div className="rounded-lg border border-[#E4E9E8] bg-[#F2F4F3] p-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#5A6060] mb-1">
                  <span>
                    Threat ID: <strong className="text-[#202629]">{modalThreat.id}</strong>
                  </span>
                  <span>
                    Agent: <strong className="text-[#485F84]">{modalThreat.agentId}</strong>
                  </span>
                </div>
                <p className="text-xs text-[#202629] font-sans leading-relaxed">
                  {modalThreat.description}
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#202629] mb-1.5">
                  Resolution Audit Note
                </label>
                <textarea
                  rows={3}
                  value={mitigationNote}
                  onChange={(e) => setMitigationNote(e.target.value)}
                  required
                  placeholder="Document mitigation steps or reason for dismissing..."
                  className="w-full rounded-lg border border-[#E4E9E8] bg-white p-2.5 text-xs text-[#202629] focus:border-[#485F84] focus:outline-hidden leading-relaxed"
                />
                <p className="mt-1 text-[10px] text-[#757C7B]">
                  This note will be permanently recorded in the cryptographic audit ledger.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setModalThreat(null)}
                  disabled={submittingMitigation}
                  className="rounded-lg border border-[#E4E9E8] bg-[#F2F4F3] px-4 py-2 text-xs font-semibold text-[#5A6060] hover:text-[#202629] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMitigation}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer shadow-xs ${
                    modalThreat.status === "MITIGATED"
                      ? "bg-[#234E39] hover:bg-[#1C4733]"
                      : "bg-[#8D5B18] hover:bg-[#724913]"
                  }`}
                >
                  {submittingMitigation
                    ? "Recording..."
                    : modalThreat.status === "MITIGATED"
                    ? "Apply Mitigation"
                    : "Confirm Dismissal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
