// INTENTLOCK – Security Policies Management

"use client";

import { useEffect, useState } from "react";
import { policiesApi, type Policy, type PolicyCreate, type RiskLevel } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { DocumentIcon, RefreshIcon, InfoIcon, ShieldIcon } from "@/components/icons";

const RISK_LEVELS: RiskLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const riskColors: Record<RiskLevel, string> = {
  NONE: "text-slate-400 bg-slate-500/10 border-slate-500/20",
  LOW: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  CRITICAL: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState<PolicyCreate>({
    name: "",
    description: "",
    allowed_permissions: [],
    denied_permissions: [],
    require_approval_permissions: [],
    allowed_resources: [],
    allowed_recipients: [],
    max_risk_level: "MEDIUM",
    max_sensitivity: 5,
  });

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      setPolicies(await policiesApi.list());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch policies");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      name: "",
      description: "",
      allowed_permissions: [],
      denied_permissions: [],
      require_approval_permissions: [],
      allowed_resources: [],
      allowed_recipients: [],
      max_risk_level: "MEDIUM",
      max_sensitivity: 5,
    });
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(policy: Policy) {
    setForm({
      name: policy.name,
      description: policy.description,
      allowed_permissions: policy.allowed_permissions,
      denied_permissions: policy.denied_permissions,
      require_approval_permissions: policy.require_approval_permissions,
      allowed_resources: policy.allowed_resources,
      allowed_recipients: policy.allowed_recipients,
      max_risk_level: policy.max_risk_level,
      max_sensitivity: policy.max_sensitivity,
    });
    setEditingId(policy.id);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await policiesApi.update(editingId, form);
      } else {
        await policiesApi.create(form);
      }
      resetForm();
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this security policy?")) return;
    try {
      await policiesApi.delete(id);
      await fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete policy");
    }
  }

  function parseTags(input: string): string[] {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
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
              Deterministic Security Policies
            </h1>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/25">
              {policies.length} Active Rulesets
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Define explicit permissions, resource scopes, and sensitivity thresholds for agent operations.
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
            onClick={() => {
              if (showForm) resetForm();
              else setShowForm(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Policy"}
          </button>
        </div>
      </div>

      {/* Understandable Explainer */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a]/70 p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-emerald-500/10 p-1.5 text-emerald-400 border border-emerald-500/20 mt-0.5">
            <ShieldIcon size={16} />
          </div>
          <div className="text-xs">
            <span className="font-semibold text-slate-200">Fail-Closed Precedence Order: </span>
            <span className="text-slate-400">
              The 9-step policy pipeline checks: (1) Registered tool, (2) Active policy, (3) Explicit deny, (4) Explicit allow, (5) Human approval list, (6) Sensitivity ceiling, (7) Max risk rating, (8) Recipient domain allowlist, (9) Resource glob pattern. If any check fails, execution is immediately aborted.
            </span>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Form Modal / Inline Box */}
      {showForm && (
        <div className="rounded-xl border border-[#202b3f] bg-[#0d111a] p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
            {editingId ? "Edit Security Policy" : "Define New Security Policy"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Policy Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. tier1-support-policy"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Description
                </label>
                <input
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Read-only permissions for customer tier 1 support"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Allowed Permissions <span className="text-slate-500">(comma-separated)</span>
                </label>
                <input
                  value={(form.allowed_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, allowed_permissions: parseTags(e.target.value) })
                  }
                  placeholder="email:read, email:list"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Explicit Deny Permissions
                </label>
                <input
                  value={(form.denied_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, denied_permissions: parseTags(e.target.value) })
                  }
                  placeholder="database:drop, email:delete"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-rose-400 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Require Human Approval
                </label>
                <input
                  value={(form.require_approval_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      require_approval_permissions: parseTags(e.target.value),
                    })
                  }
                  placeholder="email:send, payment:execute"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Allowed Resources (Globs)
                </label>
                <input
                  value={(form.allowed_resources || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, allowed_resources: parseTags(e.target.value) })
                  }
                  placeholder="inbox/*, public/*"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Max Risk Threshold
                </label>
                <select
                  value={form.max_risk_level}
                  onChange={(e) =>
                    setForm({ ...form, max_risk_level: e.target.value as RiskLevel })
                  }
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none font-mono"
                >
                  {RISK_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Max Sensitivity (0–10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.max_sensitivity}
                  onChange={(e) =>
                    setForm({ ...form, max_sensitivity: Number(e.target.value) })
                  }
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-[#1a2233] px-3.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-[#121824] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies List */}
      {policies.length === 0 && !loading ? (
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] flex flex-col items-center justify-center py-16 text-center">
          <DocumentIcon size={24} className="text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">No policies defined</p>
          <p className="mt-1 text-[11px] text-slate-500">Click &quot;+ New Policy&quot; to create a security ruleset</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4 hover:border-[#2b3a55] transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold text-slate-100">
                      {policy.name}
                    </h3>
                    <span
                      className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-semibold border ${
                        riskColors[policy.max_risk_level]
                      }`}
                    >
                      MAX RISK: {policy.max_risk_level}
                    </span>
                    <span className="rounded bg-[#162032] px-1.5 py-0.2 font-mono text-[9px] text-slate-400 border border-[#202b3f]">
                      SENSITIVITY ≤ {policy.max_sensitivity}/10
                    </span>
                  </div>
                  {policy.description && (
                    <p className="mt-1 text-[11px] text-slate-400">
                      {policy.description}
                    </p>
                  )}
                  <p className="mt-0.5 font-mono text-[10px] text-slate-600">
                    ID: {policy.id} · Updated: {formatDate(policy.updated_at)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(policy)}
                    className="rounded border border-[#1a2233] px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:bg-[#121824] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    className="rounded border border-rose-500/30 px-2.5 py-1 text-[11px] font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Permission Matrix Chips */}
              <div className="mt-3 flex flex-wrap gap-4 text-[11px] pt-3 border-t border-[#161f30]">
                <div>
                  <span className="text-slate-500 font-medium">Allowed: </span>
                  {policy.allowed_permissions.length > 0 ? (
                    policy.allowed_permissions.map((p) => (
                      <span
                        key={p}
                        className="mr-1 inline-block rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[10px] text-emerald-400 border border-emerald-500/20"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 font-mono">none</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Denied: </span>
                  {policy.denied_permissions.length > 0 ? (
                    policy.denied_permissions.map((p) => (
                      <span
                        key={p}
                        className="mr-1 inline-block rounded bg-rose-500/10 px-1.5 py-0.2 font-mono text-[10px] text-rose-400 border border-rose-500/20"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 font-mono">none</span>
                  )}
                </div>

                <div>
                  <span className="text-slate-500 font-medium">Approval Required: </span>
                  {policy.require_approval_permissions.length > 0 ? (
                    policy.require_approval_permissions.map((p) => (
                      <span
                        key={p}
                        className="mr-1 inline-block rounded bg-amber-500/10 px-1.5 py-0.2 font-mono text-[10px] text-amber-400 border border-amber-500/20"
                      >
                        {p}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-600 font-mono">none</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
