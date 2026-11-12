// INTENTLOCK – Security Dashboard Overview

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { auditApi, API_BASE, type AuditStats, type AuditEvent } from "@/lib/api";
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
  InfoIcon,
  BeakerIcon,
  LockIcon,
} from "@/components/icons";

const THREAT_VECTORS = [
  { id: "T-01", name: "Prompt Injection", status: "BLOCKED" },
  { id: "T-02", name: "Shadow Tools", status: "BLOCKED" },
  { id: "T-03", name: "Path Traversal", status: "BLOCKED" },
  { id: "T-04", name: "Exfiltration", status: "BLOCKED" },
  { id: "T-05", name: "Unauthorized Pay", status: "GUARDED" },
  { id: "T-06", name: "Token Replay", status: "BLOCKED" },
  { id: "T-07", name: "Rate Limit DoS", status: "BLOCKED" },
  { id: "T-08", name: "Key Scrubbing", status: "REDACTED" },
  { id: "T-09", name: "Param Injection", status: "BLOCKED" },
  { id: "T-10", name: "Glob Escalation", status: "BLOCKED" },
  { id: "T-11", name: "State Tampering", status: "BLOCKED" },
  { id: "T-12", name: "Nonce Spoofing", status: "BLOCKED" },
  { id: "T-13", name: "Expired Tokens", status: "BLOCKED" },
  { id: "T-14", name: "Fail-Closed Exit", status: "ENFORCED" },
  { id: "T-15", name: "MCP Protocol Hack", status: "BLOCKED" },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [recentEvents, setRecentEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [s, events] = await Promise.all([
        auditApi.stats(),
        auditApi.list({ limit: 12 }),
      ]);
      setStats(s);
      setRecentEvents(events);
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
      {/* Top Banner / System Identity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#1a2233] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Security Operations Center
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
              Live Interceptor Active
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real-time deterministic authorization boundary between autonomous AI agents and executable tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/test"
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
          >
            <BeakerIcon size={14} />
            Simulate Attack
          </Link>
          <button
            onClick={fetchData}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#1a2233] bg-[#0d111a] px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#121824] hover:text-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshIcon size={14} className={loading ? "animate-spin" : ""} />
            Sync
          </button>
        </div>
      </div>

      {/* Understandable Explainer Box */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-sky-500/10 p-1.5 text-sky-400 border border-sky-500/20 mt-0.5">
            <InfoIcon size={16} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-200">How IntentLock Protects Your Agents: </span>
            <span className="text-slate-400">
              Every tool call emitted by an LLM is intercepted before execution. The policy engine evaluates permissions, argument constraints, resource paths, and recipient domains deterministically. If unauthorized or suspicious, it is rejected immediately without trusting the LLM.
            </span>
          </div>
        </div>
      </div>

      {/* Active Threat Matrix Defense Strip */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0a0e17] p-4">
        <div className="flex items-center justify-between border-b border-[#161f30] pb-3 mb-3">
          <div className="flex items-center gap-2">
            <ShieldIcon size={16} className="text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              15 / 15 Threat Vectors Monitored & Enforced
            </span>
            <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400 border border-emerald-500/30">
              100% FAIL-CLOSED
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">MITRE ATLAS & OWASP LLM Top 10</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {THREAT_VECTORS.map((tv) => (
            <div
              key={tv.id}
              className="flex items-center justify-between rounded-lg border border-[#161f30] bg-[#0d111a] px-2.5 py-1.5 text-[11px]"
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-mono text-[10px] font-bold text-slate-400">{tv.id}</span>
                <span className="truncate text-slate-300 font-medium">{tv.name}</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {tv.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-400">
          <div className="flex items-center gap-2 font-semibold">
            <XCircleIcon size={16} /> Backend Connection Offline
          </div>
          <p className="mt-1 text-slate-400">
            Could not reach FastAPI at <code className="text-emerald-400">{API_BASE}</code>. {error}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Interceptions"
          value={stats ? stats.total_events : "—"}
          subtitle="All runtime calls checked"
          icon={<ShieldIcon size={16} />}
          accentColor="blue"
        />
        <StatCard
          label="Allowed"
          value={stats ? stats.allowed_count : "—"}
          subtitle="Passed policy guard"
          icon={<CheckCircleIcon size={16} />}
          accentColor="emerald"
        />
        <StatCard
          label="Denied (Blocked)"
          value={stats ? stats.denied_count : "—"}
          subtitle="Blocked by policy"
          icon={<XCircleIcon size={16} />}
          accentColor="red"
        />
        <StatCard
          label="Human Approvals"
          value={stats ? stats.require_approval_count : "—"}
          subtitle="Requires human sign-off"
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

      {/* Verdict Visualizer Ratio Bar */}
      {stats && stats.total_events > 0 && (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Enforcement Breakdown</span>
            <span>{stats.total_events} Total Security Decisions</span>
          </div>
          <div className="flex h-2 overflow-hidden rounded-full bg-[#121824]">
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
              Human Approval: <strong className="text-slate-200">{stats.require_approval_count}</strong> ({Math.round((stats.require_approval_count / stats.total_events) * 100)}%)
            </span>
          </div>
        </div>
      )}

      {/* Live Activity Table */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#1a2233] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Live Intercept Activity
            </h2>
            <span className="rounded bg-[#121824] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              Latest {recentEvents.length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">Auto-audited & tamper-evident</span>
        </div>

        {recentEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldIcon size={24} className="text-slate-600 mb-2" />
            <p className="text-xs font-medium text-slate-400">No security events recorded yet</p>
            <p className="mt-1 text-[11px] text-slate-500">
              Use the Playground tab or run an agent demo to trigger live tool interception
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1a2233] bg-[#0a0e17] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-5 py-2.5">Time</th>
                  <th className="px-5 py-2.5">Agent</th>
                  <th className="px-5 py-2.5">Intercepted Tool</th>
                  <th className="px-5 py-2.5">Decision Verdict</th>
                  <th className="px-5 py-2.5">Risk Score</th>
                  <th className="px-5 py-2.5">Policy Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161f30]">
                {recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-[#121824]/60 transition-colors">
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[11px] text-slate-400">
                      {formatDate(event.timestamp)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-slate-300">
                      {event.agent_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono">
                      <span className="rounded bg-[#162032] px-2 py-0.5 text-emerald-400 border border-[#202b3f]">
                        {event.tool_name || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5">
                      <VerdictBadge verdict={event.verdict} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-2.5 font-mono text-[11px] text-slate-400">
                      {event.risk_score.toFixed(2)}
                    </td>
                    <td className="max-w-md truncate px-5 py-2.5 text-[11px] text-slate-400">
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
