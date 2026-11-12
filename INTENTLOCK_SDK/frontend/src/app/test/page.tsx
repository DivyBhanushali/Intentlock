// INTENTLOCK – Intercept Security Playground

"use client";

import { useState } from "react";
import { interceptApi, type InterceptResponse } from "@/lib/api";
import { VerdictBadge } from "@/components/verdict-badge";
import { BeakerIcon, InfoIcon, ShieldIcon, LockIcon } from "@/components/icons";
import Link from "next/link";

const PRESETS = [
  {
    name: "Safe Read Tool",
    badge: "EXPECT ALLOW",
    badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    description: "Standard permitted read action",
    payload: {
      agent_id: "support-agent-alpha",
      tool_name: "email:read",
      arguments: { email_id: "msg-101", folder: "inbox" },
      user_request: "Check customer inquiries in inbox",
      sensitivity: 2,
      resource_id: "inbox/emails",
    },
  },
  {
    name: "Zero-Trust Block",
    badge: "EXPECT DENY",
    badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    description: "Privileged / destructive action prohibited by policy",
    payload: {
      agent_id: "support-agent-alpha",
      tool_name: "database:drop",
      arguments: { table: "customers", cascade: true },
      user_request: "Delete all records in the customer database",
      sensitivity: 10,
      resource_id: "prod/db",
    },
  },
  {
    name: "Escalate for Human Sign-off",
    badge: "EXPECT APPROVAL",
    badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    description: "High-impact external action requiring single-use human token",
    payload: {
      agent_id: "support-agent-alpha",
      tool_name: "email:send",
      arguments: {
        to: "press@external-media.com",
        subject: "Press Release Announcement",
        body: "Embargoed product details",
      },
      user_request: "Send the release email to external press",
      sensitivity: 6,
      resource_id: "outbox/email",
      recipient: "press@external-media.com",
    },
  },
];

export default function TestPage() {
  const [agentId, setAgentId] = useState("support-agent-alpha");
  const [toolName, setToolName] = useState("email:read");
  const [argsJson, setArgsJson] = useState('{\n  "email_id": "msg-101",\n  "folder": "inbox"\n}');
  const [userRequest, setUserRequest] = useState("Check customer inquiries in inbox");
  const [sensitivity, setSensitivity] = useState(2);
  const [resourceId, setResourceId] = useState("inbox/emails");
  const [recipient, setRecipient] = useState("");
  const [approvalId, setApprovalId] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InterceptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function applyPreset(preset: typeof PRESETS[0]) {
    setAgentId(preset.payload.agent_id);
    setToolName(preset.payload.tool_name);
    setArgsJson(JSON.stringify(preset.payload.arguments, null, 2));
    setUserRequest(preset.payload.user_request);
    setSensitivity(preset.payload.sensitivity);
    setResourceId(preset.payload.resource_id);
    setRecipient(preset.payload.recipient || "");
    setApprovalId("");
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(argsJson);
    } catch {
      setError("Arguments must be valid JSON");
      setLoading(false);
      return;
    }

    try {
      const resp = await interceptApi.evaluate({
        agent_id: agentId.trim(),
        tool_name: toolName.trim(),
        arguments: parsedArgs,
        user_request: userRequest.trim(),
        sensitivity,
        resource_id: resourceId.trim() || undefined,
        recipient: recipient.trim() || undefined,
        approval_id: approvalId.trim() || undefined,
      });
      setResult(resp);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute intercept evaluation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#1a2233] pb-5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-100">
            Security Intercept Playground
          </h1>
          <span className="rounded-full bg-violet-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400 border border-violet-500/25">
            Interactive Test Console
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Simulate runtime tool calls against the deterministic 9-step policy pipeline and verify enforcement behavior.
        </p>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-4 text-xs">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          <span>Execution Boundary Interception Flow</span>
          <span className="text-emerald-400 font-mono">Zero LLM Trust Architecture</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-center text-xs">
          <div className="rounded-lg border border-[#1a2233] bg-[#0a0e17] p-2.5">
            <div className="text-[10px] font-semibold text-slate-500 uppercase">Step 1</div>
            <div className="font-medium text-slate-200 mt-0.5">Agent Calls Tool</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Payload captured</div>
          </div>
          <div className="rounded-lg border border-sky-500/30 bg-sky-500/5 p-2.5">
            <div className="text-[10px] font-semibold text-sky-400 uppercase">Step 2</div>
            <div className="font-medium text-slate-200 mt-0.5">IntentLock Intercepts</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Execution blocked</div>
          </div>
          <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-2.5">
            <div className="text-[10px] font-semibold text-violet-400 uppercase">Step 3</div>
            <div className="font-medium text-slate-200 mt-0.5">Policy Engine Evaluates</div>
            <div className="text-[10px] text-slate-500 mt-0.5">9 deterministic checks</div>
          </div>
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
            <div className="text-[10px] font-semibold text-emerald-400 uppercase">Step 4</div>
            <div className="font-medium text-slate-200 mt-0.5">Deterministic Verdict</div>
            <div className="text-[10px] text-slate-500 mt-0.5">ALLOW / DENY / ESCALATE</div>
          </div>
        </div>
      </div>

      {/* Preset Test Scenarios */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
          Load Sample Security Scenarios
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(p)}
              className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-3 text-left transition-all hover:border-[#2b3a55] hover:bg-[#121824]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200">{p.name}</span>
                <span className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold border ${p.badgeColor}`}>
                  {p.badge}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{p.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Form & Result Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Form Panel */}
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-5">
          <div className="flex items-center gap-2 border-b border-[#1a2233] pb-3 mb-4">
            <BeakerIcon size={16} className="text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Tool Call Intercept Parameters
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Originating Agent ID
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Target Tool Name
                </label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-emerald-400 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                User Request Context (Prompt Intent)
              </label>
              <input
                type="text"
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                placeholder="User's original prompt instruction"
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Sensitivity: <span className="font-mono text-emerald-400">{sensitivity}</span>/10
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Resource Path
                </label>
                <input
                  type="text"
                  value={resourceId}
                  onChange={(e) => setResourceId(e.target.value)}
                  placeholder="e.g. inbox/emails"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Recipient Domain
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="e.g. dev@company.com"
                  className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Approval Token (Optional — to verify signed execution)
              </label>
              <input
                type="text"
                value={approvalId}
                onChange={(e) => setApprovalId(e.target.value)}
                placeholder="appr-xxxx-xxxx"
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] px-2.5 py-1.5 text-xs text-amber-400 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-400 mb-1">
                Tool Arguments (JSON Payload)
              </label>
              <textarea
                rows={4}
                value={argsJson}
                onChange={(e) => setArgsJson(e.target.value)}
                className="w-full rounded-lg border border-[#1a2233] bg-[#0a0e17] p-2.5 text-xs text-slate-300 font-mono focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition-colors"
            >
              {loading ? "Evaluating Deterministic Policy..." : "Run Security Intercept"}
            </button>
          </form>
        </div>

        {/* Results Panel */}
        <div className="rounded-xl border border-[#1a2233] bg-[#0d111a] p-5">
          <div className="flex items-center gap-2 border-b border-[#1a2233] pb-3 mb-4">
            <ShieldIcon size={16} className="text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Gateway Enforcement Verdict
            </h2>
          </div>

          {error && (
            <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3 text-xs text-rose-400 mb-4">
              {error}
            </div>
          )}

          {!result && !error && !loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BeakerIcon size={28} className="text-slate-600 mb-2" />
              <p className="text-xs font-medium text-slate-400">Awaiting Tool Call</p>
              <p className="mt-1 text-[11px] text-slate-500 max-w-xs">
                Pick a preset above or input parameters and click &quot;Run Security Intercept&quot; to test the gateway.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
              <p className="text-xs text-slate-400">Hashing arguments & evaluating policy rules...</p>
            </div>
          )}

          {result && (
            <div className="space-y-3.5 text-xs">
              {/* Verdict Banner */}
              <div
                className={`rounded-xl border p-4 ${
                  result.verdict === "ALLOW"
                    ? "border-emerald-500/30 bg-emerald-500/10"
                    : result.verdict === "DENY"
                    ? "border-rose-500/30 bg-rose-500/10"
                    : "border-amber-500/30 bg-amber-500/10"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VerdictBadge verdict={result.verdict} />
                    <span className="font-mono text-[11px] text-slate-400">
                      Risk: {result.risk_level} ({result.risk_score.toFixed(2)})
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-500">
                    ID: {result.decision_id}
                  </span>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-200">
                  {result.reason}
                </p>
              </div>

              {/* Action Hash */}
              <div className="rounded-lg border border-[#1a2233] bg-[#0a0e17] p-3">
                <span className="text-[11px] text-slate-400 font-medium">
                  Computed Action Hash (SHA-256):
                </span>
                <p className="font-mono text-[11px] text-slate-300 break-all mt-1">
                  {result.action_hash}
                </p>
              </div>

              {/* Human Approval Escalation */}
              {result.approval_id && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-400">
                        Approval Request Escalated
                      </p>
                      <p className="font-mono text-[11px] text-slate-300 mt-0.5">
                        Approval ID: {result.approval_id}
                      </p>
                    </div>
                    <Link
                      href="/approvals"
                      className="rounded bg-amber-500 px-2.5 py-1 font-semibold text-[11px] text-black hover:bg-amber-400 transition-colors"
                    >
                      Authorize in Queue →
                    </Link>
                  </div>
                </div>
              )}

              {/* Result Value */}
              {result.execution_result !== null && result.execution_result !== undefined && (
                <div>
                  <span className="text-slate-400 text-[11px]">Handler Execution Output:</span>
                  <pre className="mt-1 font-mono text-[11px] bg-[#0a0e17] p-2.5 rounded border border-[#1a2233] text-emerald-400 overflow-x-auto max-h-32">
                    {JSON.stringify(result.execution_result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
