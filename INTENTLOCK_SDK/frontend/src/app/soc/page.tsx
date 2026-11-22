// SICTACK – Security Operations Center (SOC) Overview
// Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  auditApi,
  benchmarksApi,
  auditVerifyApi,
  approvalsApi,
  type AuditStats,
  type AuditEvent,
  type BenchmarkRun,
  type AuditVerifyReport,
  type Approval,
} from "@/lib/api";
import { StatCard } from "@/components/stat-card";
import { VerdictBadge } from "@/components/verdict-badge";
import { formatDate } from "@/lib/utils";
import {
  ShieldIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationIcon,
  UsersIcon,
  RefreshIcon,
  BeakerIcon,
  LockIcon,
} from "@/components/icons";

export default function SocDashboardPage() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [latestBenchmark, setLatestBenchmark] = useState<BenchmarkRun | null>(null);
  const [auditVerify, setAuditVerify] = useState<AuditVerifyReport | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadTelemetry() {
      try {
        const [s, events, bmk, vrf, apprs] = await Promise.all([
          auditApi.stats().catch(() => null),
          auditApi.list({ limit: 10 }).catch(() => []),
          benchmarksApi.getLatest().catch(() => null),
          auditVerifyApi.verify().catch(() => null),
          approvalsApi.list().catch(() => []),
        ]);

        if (!ignore) {
          setStats(s);
          setRecentEvents(events);
          setLatestBenchmark(bmk);
          setAuditVerify(vrf);
          setPendingApprovals(apprs.filter((a) => a.status === "PENDING"));
          setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: false }));
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to connect to backend");
          setLoading(false);
        }
      }
    }

    void loadTelemetry();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const [s, events, bmk, vrf, apprs] = await Promise.all([
        auditApi.stats().catch(() => null),
        auditApi.list({ limit: 10 }).catch(() => []),
        benchmarksApi.getLatest().catch(() => null),
        auditVerifyApi.verify().catch(() => null),
        approvalsApi.list().catch(() => []),
      ]);

      setStats(s);
      setRecentEvents(events);
      setLatestBenchmark(bmk);
      setAuditVerify(vrf);
      setPendingApprovals(apprs.filter((a) => a.status === "PENDING"));
      setLastUpdated(new Date().toLocaleTimeString("en-US", { hour12: false }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#202629]">
      {/* ─── A. PAGE HEADER ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E4E9E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202629]">
              Security Operations Overview
            </h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#234E39] bg-[#EDF5F0] border border-[#D4E8DC]">
              POLICY ENGINE READY
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5A6063] max-w-2xl leading-relaxed">
            Deterministic runtime execution firewall, immutable intent pre-authorization, and
            real-time tool governance for autonomous AI agents.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start sm:self-auto">
          {lastUpdated && (
            <span className="text-[11px] font-mono text-[#787E81] hidden md:inline-block mr-1">
              Updated {lastUpdated} UTC
            </span>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Refresh Live Telemetry"
          >
            <RefreshIcon size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          <Link
            href="/intents"
            className="inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all shadow-xs"
          >
            <LockIcon size={13} />
            <span>Issue Intent</span>
          </Link>

          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors shadow-xs"
          >
            <BeakerIcon size={13} />
            <span>Playground</span>
          </Link>
        </div>
      </header>

      {/* ─── ERROR BANNER ─── */}
      {error && (
        <div className="rounded-lg border border-[#F8D5D0] bg-[#FDF1EF] p-4 text-xs text-[#943425] flex items-start gap-3">
          <XCircleIcon size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-[#202629]">Backend Connection Offline</div>
            <p className="text-[#5A6063] leading-relaxed">
              Could not retrieve live telemetry from the SICTACK backend service ({error}).
              Verify network connectivity or review local server logs.
            </p>
          </div>
        </div>
      )}

      {/* ─── UNIFIED SECURITY ENGINE COMMAND DOCK ─── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CORE Telemetry Module */}
        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between hover:border-[#485f84]/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#234e39]"></span>
                <span className="font-mono text-xs font-bold text-[#202629]">SICTACK CORE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#edf5f0] text-[#234e39] border border-[#d4e8dc]">
                  DETERMINISTIC
                </span>
              </div>
              <p className="text-xs text-[#56585d] mt-1">
                In-process tool execution boundary. Parameter constraints &amp; policy version binding.
              </p>
            </div>
            <span className="text-xs font-mono text-[#3d6851] font-semibold">&lt; 1.0 ms</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#e4e9e8] text-xs">
            <span className="text-[#757c7b] font-mono text-[11px]">
              Status: Active Gatekeeper
            </span>
            <Link
              href="/soc/core"
              className="text-[#485f84] hover:text-[#3c5377] font-semibold flex items-center gap-1"
            >
              <span>Launch CORE</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* SENTINEL Telemetry Module */}
        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between hover:border-[#8d5b18]/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8d5b18]"></span>
                <span className="font-mono text-xs font-bold text-[#202629]">SICTACK SENTINEL</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#fef7ec] text-[#8d5b18] border border-[#f5dcba]">
                  BEHAVIORAL
                </span>
              </div>
              <p className="text-xs text-[#56585d] mt-1">
                Continuous runtime task session surveillance. 10 anomaly detectors &amp; automated containment.
              </p>
            </div>
            <span className="text-xs font-mono text-[#8d5b18] font-semibold">10 Detectors</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#e4e9e8] text-xs">
            <span className="text-[#757c7b] font-mono text-[11px]">
              Status: Surveillance Enforcing
            </span>
            <Link
              href="/soc/sentinel"
              className="text-[#8d5b18] hover:text-[#724810] font-semibold flex items-center gap-1"
            >
              <span>Launch SENTINEL</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* PROVENANCE & INTEGRITY Module */}
        <div className="p-4 bg-white rounded-xl border border-[#e4e9e8] shadow-sm flex flex-col justify-between hover:border-[#3c5276]/40 transition-colors">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3c5276]"></span>
                <span className="font-mono text-xs font-bold text-[#202629]">DATA PROVENANCE</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#eef3fb] text-[#3c5276] border border-[#d2def0]">
                  CRYPTOGRAPHIC
                </span>
              </div>
              <p className="text-xs text-[#56585d] mt-1">
                Causal ancestry DAG, trust boundaries &amp; anti-tampering execution integrity validation.
              </p>
            </div>
            <span className="text-xs font-mono text-[#3c5276] font-semibold">DAG + TOCTOU</span>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-[#e4e9e8] text-xs">
            <span className="text-[#757c7b] font-mono text-[11px]">
              Status: DAG Verifying
            </span>
            <Link
              href="/soc/provenance"
              className="text-[#3c5276] hover:text-[#283852] font-semibold flex items-center gap-1"
            >
              <span>Launch Provenance</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── B. SECURITY POSTURE SUMMARY (5 ALIGNED METRICS) ─── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#787E81]">
            Runtime Execution Metrics
          </span>
          <span className="font-mono text-[10px] text-[#787E81]">
            Telemetry Window: All Recorded Actions
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-6 xl:grid-cols-5">
          <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
            <StatCard
              label="Total Interceptions"
              value={loading ? "—" : stats ? stats.total_events : 0}
              subtitle="All runtime calls intercepted"
              icon={<ShieldIcon size={16} />}
              accentColor="blue"
            />
          </div>
          <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
            <StatCard
              label="Actions Allowed"
              value={loading ? "—" : stats ? stats.allowed_count : 0}
              subtitle="Passed all 8 policy stages"
              icon={<CheckCircleIcon size={16} />}
              accentColor="emerald"
            />
          </div>
          <div className="sm:col-span-1 md:col-span-2 xl:col-span-1">
            <StatCard
              label="Actions Blocked"
              value={loading ? "—" : stats ? stats.denied_count : 0}
              subtitle="Denied by deterministic policy"
              icon={<XCircleIcon size={16} />}
              accentColor="red"
            />
          </div>
          <div className="sm:col-span-1 md:col-span-3 xl:col-span-1">
            <StatCard
              label="Human Approvals"
              value={loading ? "—" : stats ? stats.require_approval_count : 0}
              subtitle="Pending or resolved tokens"
              icon={<ExclamationIcon size={16} />}
              accentColor="amber"
            />
          </div>
          <div className="sm:col-span-2 md:col-span-3 xl:col-span-1">
            <StatCard
              label="Active Agents"
              value={loading ? "—" : stats ? stats.active_agents_count : 0}
              subtitle="Registered autonomous principals"
              icon={<UsersIcon size={16} />}
              accentColor="purple"
            />
          </div>
        </div>
      </section>

      {/* ─── C. DECISION DISTRIBUTION RATIO ─── */}
      {stats && stats.total_events > 0 && (
        <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="font-semibold text-[#202629]">Authoritative Decision Breakdown</span>
              <span className="text-[11px] text-[#5A6063] ml-2">
                ({stats.total_events} evaluated tool requests)
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#787E81]">
              Deterministic Policy Engine
            </span>
          </div>

          {/* Visual Ratio Bar */}
          <div className="flex h-2.5 overflow-hidden rounded bg-[#F2F4F3] border border-[#E4E9E8]">
            <div
              className="bg-[#234E39] transition-all duration-300"
              style={{ width: `${(stats.allowed_count / stats.total_events) * 100}%` }}
              title={`Allowed: ${stats.allowed_count} (${Math.round((stats.allowed_count / stats.total_events) * 100)}%)`}
            />
            <div
              className="bg-[#943425] transition-all duration-300"
              style={{ width: `${(stats.denied_count / stats.total_events) * 100}%` }}
              title={`Denied: ${stats.denied_count} (${Math.round((stats.denied_count / stats.total_events) * 100)}%)`}
            />
            <div
              className="bg-[#8D5B18] transition-all duration-300"
              style={{ width: `${(stats.require_approval_count / stats.total_events) * 100}%` }}
              title={`Approvals: ${stats.require_approval_count} (${Math.round((stats.require_approval_count / stats.total_events) * 100)}%)`}
            />
          </div>

          {/* Numerical Breakdown Labels */}
          <div className="flex flex-wrap items-center gap-6 text-xs text-[#5A6063]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#234E39]" />
              <span>
                Allowed: <strong className="text-[#202629] font-mono">{stats.allowed_count}</strong>{" "}
                <span className="text-[#787E81]">
                  ({Math.round((stats.allowed_count / stats.total_events) * 100)}%)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#943425]" />
              <span>
                Blocked: <strong className="text-[#202629] font-mono">{stats.denied_count}</strong>{" "}
                <span className="text-[#787E81]">
                  ({Math.round((stats.denied_count / stats.total_events) * 100)}%)
                </span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8D5B18]" />
              <span>
                Human Approvals:{" "}
                <strong className="text-[#202629] font-mono">{stats.require_approval_count}</strong>{" "}
                <span className="text-[#787E81]">
                  ({Math.round((stats.require_approval_count / stats.total_events) * 100)}%)
                </span>
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ─── D. ATTENTION REQUIRED (ACTIONABLE HUMAN APPROVALS QUEUE) ─── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#787E81]">
              Attention Required
            </span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-[#FEF6EC] text-[#8D5B18] border border-[#FBE3C6]">
                {pendingApprovals.length} PENDING
              </span>
            )}
          </div>
          <Link
            href="/approvals"
            className="text-xs text-[#485F84] hover:underline inline-flex items-center gap-1 font-medium"
          >
            <span>Open Approvals Console</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {pendingApprovals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingApprovals.map((appr) => (
              <div
                key={appr.id}
                className="p-4 rounded-lg border border-[#FBE3C6] bg-[#FEF6EC]/60 space-y-2.5 shadow-xs"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[10px] text-[#8D5B18] font-bold">
                    PENDING AUTHORIZATION
                  </span>
                  <span className="font-mono text-[10px] text-[#787E81]">
                    {formatDate(appr.created_at)}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-semibold text-[#202629] truncate">
                    {appr.tool_name}
                  </div>
                  <div className="text-xs font-mono text-[#5A6063] truncate">
                    Agent: {appr.agent_id}
                  </div>
                </div>
                <div className="pt-2 border-t border-[#FBE3C6] flex items-center justify-between text-xs">
                  <span className="text-[10px] font-mono text-[#787E81]">
                    ID: {appr.id.slice(0, 8)}...
                  </span>
                  <Link
                    href={`/approvals?id=${appr.id}`}
                    className="text-xs font-semibold text-[#8D5B18] hover:underline"
                  >
                    Review Action &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] flex items-center justify-between text-xs text-[#5A6063] shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-[#234E39]" />
              <span>All approval queues clear — 0 actions awaiting operator sign-off.</span>
            </div>
            <Link href="/approvals" className="text-xs text-[#485F84] hover:underline font-medium">
              View History
            </Link>
          </div>
        )}
      </section>

      {/* ─── E. SECURITY INTEGRITY & ADVERSARIAL BENCHMARK ─── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audit Hash Chain Card */}
        <div className="p-5 rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#787E81]">
              Forensics & Chain Integrity
            </span>
            <span className="text-[10px] font-mono text-[#485F84] font-semibold">SHA-256</span>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#202629] flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  auditVerify?.verified ? "bg-[#234E39]" : "bg-[#8D5B18]"
                }`}
              />
              <span>
                {auditVerify?.verified
                  ? "Sequential Hash Chain Unbroken"
                  : "Cryptographic Audit Ledger Active"}
              </span>
            </div>
            <p className="text-xs text-[#5A6063] leading-relaxed">
              Every request payload, policy rule evaluation, and verdict signature is chained
              sequentially to guarantee non-repudiation.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E4E9E8] flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-[#787E81]">
              {auditVerify?.total_records
                ? `${auditVerify.total_records} records verified`
                : `${stats?.total_events || 0} events signed`}
            </span>
            <Link href="/audit" className="text-xs text-[#485F84] hover:underline font-medium">
              Inspect Full Ledger &rarr;
            </Link>
          </div>
        </div>

        {/* Adversarial Penetration Benchmark Card */}
        <div className="p-5 rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-[#787E81]">
              Adversarial Benchmark
            </span>
            <span className="text-[10px] font-mono text-[#234E39] font-semibold">25 Vectors</span>
          </div>

          <div className="space-y-1">
            <div className="text-sm font-semibold text-[#202629] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#234E39]" />
              <span>
                {latestBenchmark
                  ? `${latestBenchmark.passed_scenarios}/${latestBenchmark.total_scenarios} Attack Vectors Neutralized`
                  : "Automated Penetration Suite Active"}
              </span>
            </div>
            <p className="text-xs text-[#5A6063] leading-relaxed">
              Evaluates configuration against prompt injection, privilege escalation, replay
              attacks, argument spoofing, and exfiltration attempts.
            </p>
          </div>

          <div className="pt-2 border-t border-[#E4E9E8] flex items-center justify-between text-xs">
            <span className="font-mono text-[11px] text-[#787E81]">
              {latestBenchmark
                ? `Pass Rate: ${Math.round(
                    (latestBenchmark.passed_scenarios / latestBenchmark.total_scenarios) * 100
                  )}%`
                : "25 Attack Scenarios"}
            </span>
            <Link href="/benchmark" className="text-xs text-[#485F84] hover:underline font-medium">
              Run Benchmark &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── F. LIVE INTERCEPTION ACTIVITY LEDGER TABLE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] overflow-hidden space-y-0 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#E4E9E8] bg-[#F8F9F8] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <h2 className="text-xs font-mono font-semibold uppercase tracking-wider text-[#202629]">
              Live Interception Ledger
            </h2>
            <span className="rounded bg-[#F2F4F3] px-1.5 py-0.5 font-mono text-[10px] text-[#5A6063] border border-[#E4E9E8]">
              Latest {recentEvents.length} Actions
            </span>
          </div>
          <Link
            href="/audit"
            className="text-xs text-[#485F84] hover:underline font-semibold inline-flex items-center gap-1"
          >
            <span>View Complete Ledger</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-[#787E81] font-mono">
            Loading real-time security events...
          </div>
        ) : recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4 space-y-2">
            <ShieldIcon size={24} className="text-[#787E81]" />
            <p className="text-xs font-medium text-[#202629]">No security events recorded yet</p>
            <p className="text-[11px] text-[#787E81] max-w-sm">
              Execute an agent tool or test the Security Playground simulator to trigger live policy
              interception.
            </p>
            <div className="pt-2">
              <Link
                href="/test"
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#485F84] text-[#FFFFFF] hover:bg-[#3C5377] transition-colors shadow-xs"
              >
                Open Security Playground
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9E8] bg-[#F2F4F3] text-[10px] font-mono font-semibold text-[#5A6063] uppercase tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Agent Principal</th>
                  <th className="px-5 py-3">Intercepted Tool</th>
                  <th className="px-5 py-3">Verdict</th>
                  <th className="px-5 py-3 text-right">Risk Score</th>
                  <th className="px-5 py-3">Trace / Intent</th>
                  <th className="px-5 py-3">Policy Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E8] font-mono">
                {recentEvents.map((event, idx) => (
                  <tr
                    key={event.id || idx}
                    className="hover:bg-[#F8F9F8] transition-colors"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-[11px] text-[#787E81]">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-medium text-[#202629]">
                      {event.agent_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <span className="rounded bg-[#F2F4F3] px-2 py-0.5 text-[#485F84] border border-[#E4E9E8] font-semibold">
                        {event.tool_name || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <VerdictBadge verdict={event.verdict} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-[11px] text-[#5A6063]">
                      {event.risk_score.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-[10px] text-[#787E81]">
                      {event.intent_id ? (
                        <Link href="/intents" className="text-[#485F84] hover:underline font-medium">
                          {event.intent_id.slice(0, 10)}...
                        </Link>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                    <td className="max-w-md truncate px-5 py-3 text-[11px] font-sans text-[#5A6063]" title={event.reason}>
                      {event.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── QUICK OPERATIONAL NAVIGATION ─── */}
      <footer className="pt-2 border-t border-[#E4E9E8] flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-[#787E81]">
        <div className="flex items-center gap-4">
          <Link href="/policies" className="hover:text-[#202629] transition-colors">
            Policies ({stats ? "Active" : "—"})
          </Link>
          <span>·</span>
          <Link href="/audit" className="hover:text-[#202629] transition-colors">
            Audit Ledger ({stats ? stats.total_events : "—"})
          </Link>
          <span>·</span>
          <Link href="/benchmark" className="hover:text-[#202629] transition-colors">
            25-Vector Benchmark
          </Link>
          <span>·</span>
          <Link href="/team" className="hover:text-[#202629] transition-colors">
            Workspace & Keys
          </Link>
        </div>

        <div className="text-[11px] text-[#787E81]">
          SICTACK SOC · Python 3.12+ · Fail-Closed
        </div>
      </footer>
    </div>
  );
}
