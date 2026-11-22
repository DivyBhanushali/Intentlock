// SICTACK – Deterministic Security Policies Management
// Concept A: Editorial Infrastructure

"use client";

import { useEffect, useState, useMemo } from "react";
import { policiesApi, type Policy, type PolicyCreate, type RiskLevel } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import {
  DocumentIcon,
  RefreshIcon,
  ShieldIcon,
  XCircleIcon,
  ExclamationIcon,
} from "@/components/icons";

const RISK_LEVELS: RiskLevel[] = ["NONE", "LOW", "MEDIUM", "HIGH", "CRITICAL"];

const riskBadgeConfig: Record<RiskLevel, { text: string; bg: string; border: string }> = {
  NONE: { text: "text-[#787E81]", bg: "bg-[#F2F4F3]", border: "border-[#E4E9E8]" },
  LOW: { text: "text-[#234E39]", bg: "bg-[#EDF5F0]", border: "border-[#D4E8DC]" },
  MEDIUM: { text: "text-[#8D5B18]", bg: "bg-[#FEF6EC]", border: "border-[#FBE3C6]" },
  HIGH: { text: "text-[#943425]", bg: "bg-[#FDF1EF]", border: "border-[#F8D5D0]" },
  CRITICAL: { text: "text-[#943425]", bg: "bg-[#FDF1EF]", border: "border-[#943425]" },
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");

  // Form State (Create / Edit)
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

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

  // Deletion Modal State
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadPolicies() {
      try {
        const data = await policiesApi.list();
        if (!ignore) {
          setPolicies(data);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load policies");
          setLoading(false);
        }
      }
    }

    void loadPolicies();

    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const data = await policiesApi.list();
      setPolicies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync policies");
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetForm = () => {
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
    setFormError(null);
    setShowForm(false);
  };

  const startEdit = (policy: Policy) => {
    setForm({
      name: policy.name,
      description: policy.description,
      allowed_permissions: policy.allowed_permissions || [],
      denied_permissions: policy.denied_permissions || [],
      require_approval_permissions: policy.require_approval_permissions || [],
      allowed_resources: policy.allowed_resources || [],
      allowed_recipients: policy.allowed_recipients || [],
      max_risk_level: policy.max_risk_level,
      max_sensitivity: policy.max_sensitivity,
    });
    setEditingId(policy.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const cleanName = form.name.trim();
    if (!cleanName) {
      setFormError("Policy name is required.");
      setSubmitting(false);
      return;
    }

    try {
      if (editingId) {
        await policiesApi.update(editingId, {
          ...form,
          name: cleanName,
        });
      } else {
        await policiesApi.create({
          ...form,
          name: cleanName,
        });
      }
      resetForm();
      await handleRefresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save policy");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!policyToDelete) return;
    setDeleting(true);
    try {
      await policiesApi.delete(policyToDelete.id);
      setPolicyToDelete(null);
      await handleRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete policy");
    } finally {
      setDeleting(false);
    }
  };

  const parseTags = (input: string): string[] => {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  // Filtered Policies
  const filteredPolicies = useMemo(() => {
    return policies.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;
      if (riskFilter !== "ALL" && p.max_risk_level !== riskFilter) return false;

      return true;
    });
  }, [policies, searchQuery, riskFilter]);

  return (
    <div className="space-y-8 font-sans text-[#202629]">
      {/* ─── A. PAGE HEADER ─── */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between border-b border-[#E4E9E8] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#202629]">
              Security Policies
            </h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-mono font-semibold text-[#234E39] bg-[#EDF5F0] border border-[#D4E8DC]">
              {policies.length} RULESETS
            </span>
          </div>
          <p className="mt-1.5 text-xs text-[#5A6063] max-w-2xl leading-relaxed">
            Deterministic permission matrices, resource globs, and sensitivity ceilings evaluated in
            strict order prior to tool execution.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="inline-flex items-center gap-1.5 rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
            title="Synchronize Policies"
          >
            <RefreshIcon size={13} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Syncing..." : "Sync"}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (showForm) resetForm();
              else {
                resetForm();
                setShowForm(true);
              }
            }}
            className="inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all shadow-xs cursor-pointer"
          >
            <span>{showForm ? "Cancel Form" : "+ New Policy"}</span>
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

      {/* ─── B. EVALUATION PRECEDENCE ARCHITECTURE NOTE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-4 flex items-start gap-3.5 shadow-xs">
        <div className="rounded bg-[#EDF5F0] p-2 text-[#234E39] border border-[#D4E8DC] shrink-0 mt-0.5">
          <ShieldIcon size={16} />
        </div>
        <div className="text-xs space-y-1">
          <div className="font-semibold text-[#202629]">Deterministic 9-Stage Evaluation Order</div>
          <p className="text-[#5A6063] leading-relaxed">
            SICTACK evaluates tool invocations in a strict, unalterable sequence:
            <span className="text-[#202629] font-medium"> (1) Registered tool check</span> &rarr;
            <span className="text-[#202629] font-medium"> (2) Active policy binding</span> &rarr;
            <span className="text-[#202629] font-medium"> (3) Explicit deny list</span> &rarr;
            <span className="text-[#202629] font-medium"> (4) Explicit allow list</span> &rarr;
            <span className="text-[#202629] font-medium"> (5) Human approval requirement</span> &rarr;
            <span className="text-[#202629] font-medium"> (6) Sensitivity ceiling</span> &rarr;
            <span className="text-[#202629] font-medium"> (7) Max risk rating</span> &rarr;
            <span className="text-[#202629] font-medium"> (8) Recipient domain allowlist</span> &rarr;
            <span className="text-[#202629] font-medium"> (9) Resource glob match</span>.
            If any stage fails, execution is immediately aborted with a fail-closed verdict.
          </p>
        </div>
      </section>

      {/* ─── C. CREATE / EDIT FORM (COLLAPSIBLE) ─── */}
      {showForm && (
        <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-5 sm:p-6 space-y-5 shadow-sm">
          <div className="border-b border-[#E4E9E8] pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#202629]">
                {editingId ? "Edit Security Policy" : "Define New Security Policy"}
              </h2>
              <p className="text-xs text-[#5A6063] mt-0.5">
                {editingId
                  ? "Update permission matrices and constraints for this policy."
                  : "Create an immutable ruleset that can be attached to autonomous agents."}
              </p>
            </div>
            {editingId && (
              <span className="font-mono text-[10px] text-[#787E81]">
                Editing ID: {editingId}
              </span>
            )}
          </div>

          {formError && (
            <div className="rounded border border-[#F8D5D0] bg-[#FDF1EF] p-3 text-xs text-[#943425]">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* General Info */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Policy Name <span className="text-[#943425]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. tier1-support-ruleset"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Description / Purpose
                </label>
                <input
                  type="text"
                  value={form.description || ""}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="e.g. Read-only permissions for customer tier 1 support agent"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
              </div>
            </div>

            {/* Permission Matrix */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2 border-t border-[#E4E9E8]">
              <div>
                <label className="block text-[11px] font-semibold text-[#234E39] mb-1.5">
                  Allowed Permissions <span className="text-[#787E81]">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={(form.allowed_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, allowed_permissions: parseTags(e.target.value) })
                  }
                  placeholder="email:read, search:query"
                  className="w-full rounded border border-[#D4E8DC] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#234E39] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Cleared for execution without review
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#943425] mb-1.5">
                  Explicit Deny Permissions <span className="text-[#787E81]">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={(form.denied_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, denied_permissions: parseTags(e.target.value) })
                  }
                  placeholder="database:drop, email:delete"
                  className="w-full rounded border border-[#F8D5D0] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#943425] placeholder:text-[#787E81] focus:border-[#943425] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Immediately blocked with zero exceptions
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#8D5B18] mb-1.5">
                  Require Human Approval <span className="text-[#787E81]">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={(form.require_approval_permissions || []).join(", ")}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      require_approval_permissions: parseTags(e.target.value),
                    })
                  }
                  placeholder="email:send, payment:execute"
                  className="w-full rounded border border-[#FBE3C6] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#8D5B18] placeholder:text-[#787E81] focus:border-[#8D5B18] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Suspends execution until human approves
                </span>
              </div>
            </div>

            {/* Scope & Risk Boundaries */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 pt-2 border-t border-[#E4E9E8]">
              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Max Risk Level
                </label>
                <select
                  value={form.max_risk_level}
                  onChange={(e) =>
                    setForm({ ...form, max_risk_level: e.target.value as RiskLevel })
                  }
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] focus:border-[#485F84] focus:outline-none"
                >
                  {RISK_LEVELS.map((rl) => (
                    <option key={rl} value={rl}>
                      {rl}
                    </option>
                  ))}
                </select>
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Hard threshold ceiling
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Max Sensitivity (0–10)
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={form.max_sensitivity}
                  onChange={(e) =>
                    setForm({ ...form, max_sensitivity: parseInt(e.target.value, 10) || 0 })
                  }
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] focus:border-[#485F84] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Data classification ceiling
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Allowed Resources (Globs)
                </label>
                <input
                  type="text"
                  value={(form.allowed_resources || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, allowed_resources: parseTags(e.target.value) })
                  }
                  placeholder="data/*, logs/*"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Wildcard path matches
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#5A6063] mb-1.5">
                  Allowed Recipients / Domains
                </label>
                <input
                  type="text"
                  value={(form.allowed_recipients || []).join(", ")}
                  onChange={(e) =>
                    setForm({ ...form, allowed_recipients: parseTags(e.target.value) })
                  }
                  placeholder="@company.com, api.partner.org"
                  className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-2 text-xs font-mono text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none"
                />
                <span className="block mt-1 text-[10px] text-[#787E81]">
                  Outbound communication boundary
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-3 border-t border-[#E4E9E8]">
              <button
                type="submit"
                disabled={submitting}
                className="rounded border border-[#485F84] bg-[#485F84] px-4 py-2 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {submitting ? "Saving..." : editingId ? "Update Policy" : "Create Policy"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="rounded border border-[#E4E9E8] bg-transparent px-3.5 py-2 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:border-[#ADB3B2] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ─── D. POLICIES SEARCH & FILTER ─── */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search policies by name, ID, or description..."
            className="w-full rounded border border-[#E4E9E8] bg-[#FFFFFF] px-3 py-1.5 text-xs text-[#202629] placeholder:text-[#787E81] focus:border-[#485F84] focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs">
          <span className="text-[11px] text-[#787E81] mr-1">Max Risk:</span>
          {(["ALL", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((rTab) => (
            <button
              key={rTab}
              type="button"
              onClick={() => setRiskFilter(rTab)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                riskFilter === rTab
                  ? "border border-[#485F84]/40 bg-[#485F84]/10 text-[#485F84] font-semibold"
                  : "border border-transparent text-[#787E81] hover:text-[#202629]"
              }`}
            >
              {rTab}
            </button>
          ))}
        </div>
      </section>

      {/* ─── E. POLICIES TABLE ─── */}
      <section className="rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#787E81] font-mono">
            Loading deterministic security policies...
          </div>
        ) : filteredPolicies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <DocumentIcon size={24} className="text-[#787E81] mb-2" />
            <p className="text-xs font-semibold text-[#202629]">
              {searchQuery || riskFilter !== "ALL"
                ? "No matching security policies found"
                : "No policies created yet"}
            </p>
            <p className="mt-1 text-[11px] text-[#787E81] max-w-sm">
              {searchQuery || riskFilter !== "ALL"
                ? "Try clearing filters to display all tenant rulesets."
                : "Define deterministic rulesets to bind permissions, resource boundaries, and sensitivity ceilings to your agents."}
            </p>
            {!searchQuery && riskFilter === "ALL" && (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                className="mt-4 inline-flex items-center gap-1.5 rounded border border-[#485F84] bg-[#485F84] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] hover:bg-[#3C5377] transition-all cursor-pointer shadow-xs"
              >
                + Create Policy
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E4E9E8] bg-[#F2F4F3] text-[10px] font-mono font-semibold uppercase tracking-wider text-[#5A6063]">
                  <th className="px-5 py-3">Policy Identity</th>
                  <th className="px-5 py-3">Risk Ceiling</th>
                  <th className="px-5 py-3">Sensitivity</th>
                  <th className="px-5 py-3">Permissions Breakdown</th>
                  <th className="px-5 py-3">Resources & Scope</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E9E8]">
                {filteredPolicies.map((policy) => {
                  const riskCfg =
                    riskBadgeConfig[policy.max_risk_level] || riskBadgeConfig.MEDIUM;

                  const allowCount = policy.allowed_permissions?.length || 0;
                  const denyCount = policy.denied_permissions?.length || 0;
                  const apprCount = policy.require_approval_permissions?.length || 0;

                  return (
                    <tr
                      key={policy.id}
                      className="hover:bg-[#F8F9F8] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-[#202629] font-mono">{policy.name}</div>
                        {policy.description ? (
                          <div className="text-[11px] text-[#5A6063] line-clamp-1 mt-0.5">
                            {policy.description}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#787E81] italic mt-0.5">
                            No description
                          </div>
                        )}
                        <div className="text-[10px] font-mono text-[#787E81] mt-1">
                          ID: {policy.id.slice(0, 12)}…
                        </div>
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-mono font-semibold border ${riskCfg.bg} ${riskCfg.text} ${riskCfg.border}`}
                        >
                          {policy.max_risk_level}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px]">
                        <span className="rounded bg-[#F2F4F3] px-2 py-0.5 text-[#202629] border border-[#E4E9E8]">
                          L{policy.max_sensitivity} / 10
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                          <span
                            className="rounded px-1.5 py-0.5 bg-[#EDF5F0] text-[#234E39] border border-[#D4E8DC] font-semibold"
                            title={(policy.allowed_permissions || []).join(", ") || "None"}
                          >
                            {allowCount} Allowed
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 bg-[#FDF1EF] text-[#943425] border border-[#F8D5D0] font-semibold"
                            title={(policy.denied_permissions || []).join(", ") || "None"}
                          >
                            {denyCount} Denied
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 bg-[#FEF6EC] text-[#8D5B18] border border-[#FBE3C6] font-semibold"
                            title={
                              (policy.require_approval_permissions || []).join(", ") || "None"
                            }
                          >
                            {apprCount} Approval
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 text-[11px] font-mono text-[#5A6063]">
                        {policy.allowed_resources?.length ? (
                          <span className="truncate max-w-[140px] block" title={policy.allowed_resources.join(", ")}>
                            {policy.allowed_resources.join(", ")}
                          </span>
                        ) : (
                          <span className="text-[#787E81] italic">Default (All internal)</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5 font-mono text-[11px] text-[#5A6063]">
                        {formatDate(policy.created_at)}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(policy)}
                            className="rounded border border-[#E4E9E8] bg-[#FFFFFF] px-2.5 py-1 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:bg-[#F2F4F3] transition-colors cursor-pointer shadow-xs"
                            title="Edit policy definition"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setPolicyToDelete(policy)}
                            className="rounded border border-[#F8D5D0] bg-[#FDF1EF] px-2 py-1 text-xs font-medium text-[#943425] hover:bg-[#F8D5D0] transition-colors cursor-pointer shadow-xs"
                            title="Delete policy definition"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── F. SAFE DELETION CONFIRMATION MODAL ─── */}
      {policyToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#202629]/40 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-[#E4E9E8] bg-[#FFFFFF] p-6 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center gap-3 text-[#943425]">
              <div className="rounded bg-[#FDF1EF] p-2 border border-[#F8D5D0]">
                <ExclamationIcon size={20} />
              </div>
              <div>
                <h3 id="delete-modal-title" className="text-sm font-semibold text-[#202629]">
                  Delete Security Policy
                </h3>
                <p className="text-xs text-[#5A6063]">This action cannot be undone.</p>
              </div>
            </div>

            <div className="text-xs text-[#5A6063] space-y-2">
              <p>
                Are you sure you want to permanently delete policy{" "}
                <strong className="text-[#202629] font-mono">{policyToDelete.name}</strong>?
              </p>
              <p className="rounded border border-[#FBE3C6] bg-[#FEF6EC] p-2.5 text-[#8D5B18] font-mono text-[11px]">
                WARNING: Any agent bound to this policy will immediately fail-closed to DENY_ALL on
                its next intercepted tool execution.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E4E9E8]">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setPolicyToDelete(null)}
                className="rounded border border-[#E4E9E8] bg-transparent px-3 py-1.5 text-xs font-medium text-[#5A6063] hover:text-[#202629] hover:bg-[#F2F4F3] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="rounded border border-[#943425] bg-[#943425] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#7D2C1F] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
