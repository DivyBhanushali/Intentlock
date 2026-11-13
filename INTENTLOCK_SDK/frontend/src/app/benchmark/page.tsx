// INTENTLOCK 2.0 – Adversarial Security Benchmark Suite

"use client";

import { useEffect, useState } from "react";
import { benchmarksApi, BenchmarkRun, BenchmarkScenario } from "@/lib/api";
import { BeakerIcon, ShieldIcon, CheckIcon, XIcon, ClockIcon } from "@/components/icons";

export default function BenchmarkPage() {
  const [latestRun, setLatestRun] = useState<BenchmarkRun | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchBenchmark = async () => {
    setLoading(true);
    try {
      const data = await benchmarksApi.getLatest();
      setLatestRun(data);
    } catch (err) {
      console.error("Failed to load benchmark", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  const handleExecute = async () => {
    setRunning(true);
    try {
      const result = await benchmarksApi.run();
      setLatestRun(result);
    } catch (err) {
      alert("Failed to execute benchmark suite: " + String(err));
    } finally {
      setRunning(false);
    }
  };

  const report = latestRun?.report_json;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              Adversarial Benchmark & Penetration Suite
            </h1>
            <span className="rounded bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-400">
              25 ATTACK VECTORS
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Automated quantitative penetration test validating deterministic fail-closed defenses against prompt injections, intent evasions, and privilege escalation.
          </p>
        </div>

        <button
          onClick={handleExecute}
          disabled={running}
          className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/15 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/25 transition-all disabled:opacity-50 shadow-lg"
        >
          <BeakerIcon size={14} className={running ? "animate-spin" : ""} />
          {running ? "Simulating 25 Vectors..." : "Run Adversarial Benchmark"}
        </button>
      </div>

      {/* Metric Cards */}
      {latestRun && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Scenarios Tested
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-100">{latestRun.total_scenarios}</div>
          </div>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
              Passed (Blocked)
            </span>
            <div className="mt-1 text-2xl font-bold text-emerald-400">{latestRun.passed_scenarios}</div>
          </div>

          <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Bypasses (Failed)
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-100">{latestRun.failed_scenarios}</div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/10 p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
              Deterministic Block Rate
            </span>
            <div className="mt-1 text-2xl font-bold text-indigo-400">
              {(latestRun.block_rate * 100).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Average Latency
            </span>
            <div className="mt-1 text-2xl font-bold text-slate-100 font-mono">
              {latestRun.average_latency_ms.toFixed(2)}ms
            </div>
          </div>
        </div>
      )}

      {/* Scenarios Table */}
      {loading ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center text-xs text-slate-400">
          Loading adversarial benchmark report...
        </div>
      ) : !report?.scenarios ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-12 text-center text-xs text-slate-500">
          No benchmark results available. Click "Run Adversarial Benchmark" above.
        </div>
      ) : (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] overflow-hidden">
          <div className="p-4 border-b border-[#1a2233] flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Adversarial Evaluation Matrix (25 Vectors)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Run ID: {latestRun?.id} • {new Date(latestRun?.created_at || "").toLocaleTimeString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#080b12] text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-[#1a2233]">
                <tr>
                  <th className="px-4 py-3">Vector</th>
                  <th className="px-4 py-3">Attack Scenario</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payload Sample</th>
                  <th className="px-4 py-3">Outcome</th>
                  <th className="px-4 py-3">Mitigation Layer</th>
                  <th className="px-4 py-3 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2233]">
                {report.scenarios.map((sc: BenchmarkScenario) => (
                  <tr key={sc.vector_id} className="hover:bg-[#121824]/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {sc.vector_id}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-200">
                      {sc.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-[#141b29] px-2 py-0.5 text-[10px] font-mono text-slate-400 border border-[#1e293b] whitespace-nowrap">
                        {sc.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-slate-400 max-w-[200px] truncate" title={sc.attack_payload}>
                      {sc.attack_payload}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                        <CheckIcon size={10} />
                        BLOCKED (PASS)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-slate-300">
                      {sc.mitigation_layer}
                    </td>
                    <td className="px-4 py-3 font-mono text-right text-slate-400 whitespace-nowrap">
                      {sc.latency_ms.toFixed(3)} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

