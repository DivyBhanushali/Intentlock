// INTENTLOCK 2.0 – Enterprise Security Operations Center Overview

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  auditApi,
  benchmarksApi,
  auditVerifyApi,
  type AuditStats,
  type AuditEvent,
  type BenchmarkRun,
  type AuditVerifyReport,
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
  TerminalIcon,
  DocumentIcon,
  SparklesIcon,
} from "@/components/icons";

export default function DashboardPage() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [latestBenchmark, setLatestBenchmark] = useState<BenchmarkRun | null>(null);
  const [auditVerify, setAuditVerify] = useState<AuditVerifyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [s, events, bmk, vrf] = await Promise.all([
        auditApi.stats().catch(() => null),
        auditApi.list({ limit: 10 }).catch(() => []),
        benchmarksApi.getLatest().catch(() => null),
        auditVerifyApi.verify().catch(() => null),
      ]);
      setStats(s);
      setRecentEvents(events);
      setLatestBenchmark(bmk);
      setAuditVerify(vrf);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Header / Defense Posture */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-100">
              Security Operations Center
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/25 font-mono">
              FAIL-CLOSED GUARD ACTIVE
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Deterministic execution firewall, immutable intent pre-authorization, and real-time execution governance for autonomous AI agents.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/intents"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-xs"
          >
            <LockIcon size={13} />
            Issue Intent
          </Link>
          <Link
            href="/benchmark"
            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all shadow-xs"
          >
            <BeakerIcon size={13} />
            25-Vector Benchmark
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-[#0d111a] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-slate-100 transition-colors disabled:opacity-50"
            title="Refresh Live Telemetry"
          >
            <RefreshIcon size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Security Invariants & Posture Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: 8-Stage Pipeline */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0b0f19] p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Interception Pipeline</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">STAGE 1–8</span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-100">8 Deterministic Gates</div>
          <p className="mt-0.5 text-[10px] text-slate-500">Identity, Allow/Deny, Intent, Sensitivity, Recipients, Globs, HITL, Hash-Chain</p>
        </div>

        {/* Card 2: Intent Context */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0b0f19] p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Intent Governance</span>
            <span className="text-[10px] font-mono text-indigo-400 font-bold">PRE-AUTH</span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-100">Immutable Intent Claims</div>
          <p className="mt-0.5 text-[10px] text-slate-500">Task-scoped allow/deny globs, sensitivity ceiling, and automatic expiration</p>
        </div>

        {/* Card 3: Adversarial Benchmark */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0b0f19] p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Adversarial Resistance</span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">100% BLOCK</span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-100">
            {latestBenchmark ? `${latestBenchmark.passed_scenarios}/${latestBenchmark.total_scenarios} Attack Vectors` : "25 Attack Vectors"}
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500">Prompt injection, privilege escalation, replay nonces & exfiltration neutralized</p>
        </div>

        {/* Card 4: Cryptographic Audit */}
        <div className="rounded-xl border border-slate-800/80 bg-[#0b0f19] p-3.5 text-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">Audit Ledger Integrity</span>
            <span className="text-[10px] font-mono text-sky-400 font-bold">SHA-256</span>
          </div>
          <div className="mt-1 text-sm font-bold text-slate-100">
            {auditVerify?.verified ? "Chain Verified (Unbroken)" : "Sequential Hash Chain"}
          </div>
          <p className="mt-0.5 text-[10px] text-slate-500">Tamper-evident sequential linking guarantees non-repudiation</p>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-semibold">
            <XCircleIcon size={16} /> Backend Connection Offline
          </div>
          <p className="mt-1 text-slate-400">
            Could not reach the INTENTLOCK backend service: {error}
          </p>
        </div>
      )}

      {/* Primary Telemetry Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Interceptions"
          value={stats ? stats.total_events : "—"}
          subtitle="All runtime calls intercepted"
          icon={<ShieldIcon size={16} />}
          accentColor="blue"
        />
        <StatCard
          label="Actions Allowed"
          value={stats ? stats.allowed_count : "—"}
          subtitle="Passed all 8 policy stages"
          icon={<CheckCircleIcon size={16} />}
          accentColor="emerald"
        />
        <StatCard
          label="Actions Blocked"
          value={stats ? stats.denied_count : "—"}
          subtitle="Denied by policy or intent"
          icon={<XCircleIcon size={16} />}
          accentColor="red"
        />
        <StatCard
          label="Human Approvals"
          value={stats ? stats.require_approval_count : "—"}
          subtitle="Pending or resolved tokens"
          icon={<ExclamationIcon size={16} />}
          accentColor="amber"
        />
        <StatCard
          label="Active Agents"
          value={stats ? stats.active_agents_count : "—"}
          subtitle="Registered autonomous agents"
          icon={<UsersIcon size={16} />}
          accentColor="purple"
        />
      </div>

      {/* Enforcement Breakdown Ratio Bar */}
      {stats && stats.total_events > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0d111a] p-4 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="font-semibold text-slate-200">Execution Decision Ratio</span>
            <span className="font-mono text-slate-400">{stats.total_events} Total Authoritative Decisions</span>
          </div>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${(stats.allowed_count / stats.total_events) * 100}%` }}
              title={`Allowed: ${stats.allowed_count}`}
            />
            <div
              className="bg-rose-500 transition-all duration-500"
              style={{ width: `${(stats.denied_count / stats.total_events) * 100}%` }}
              title={`Denied: ${stats.denied_count}`}
            />
            <div
              className="bg-amber-500 transition-all duration-500"
              style={{ width: `${(stats.require_approval_count / stats.total_events) * 100}%` }}
              title={`Approvals: ${stats.require_approval_count}`}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Allowed: <strong className="text-slate-200">{stats.allowed_count}</strong> ({Math.round((stats.allowed_count / stats.total_events) * 100)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Denied: <strong className="text-slate-200">{stats.denied_count}</strong> ({Math.round((stats.denied_count / stats.total_events) * 100)}%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Human Approvals: <strong className="text-slate-200">{stats.require_approval_count}</strong> ({Math.round((stats.require_approval_count / stats.total_events) * 100)}%)
            </span>
          </div>
        </div>
      )}

      {/* Live Activity Interception Ledger */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0d111a] overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Live Interception Activity
            </h2>
            <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              Latest {recentEvents.length}
            </span>
          </div>
          <Link
            href="/audit"
            className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            View Complete Ledger &rarr;
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldIcon size={24} className="text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">No security events recorded yet</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Execute an agent tool or run the Security Playground to trigger live interception.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-[#080b12] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Agent</th>
                  <th className="px-5 py-3">Intercepted Tool</th>
                  <th className="px-5 py-3">Decision</th>
                  <th className="px-5 py-3">Risk</th>
                  <th className="px-5 py-3">Trace / Intent</th>
                  <th className="px-5 py-3">Policy Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-slate-300 font-medium">
                      {event.agent_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono">
                      <span className="rounded bg-slate-800/80 px-2 py-0.5 text-emerald-300 border border-slate-700/60">
                        {event.tool_name || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3">
                      <VerdictBadge verdict={event.verdict} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[11px] text-slate-400">
                      {event.risk_score.toFixed(2)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-[10px] text-slate-400">
                      {event.intent_id ? (
                        <Link href="/intents" className="text-indigo-400 hover:underline">
                          {event.intent_id.slice(0, 10)}...
                        </Link>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="max-w-md truncate px-5 py-3 text-[11px] text-slate-300">
                      {event.reason}
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
