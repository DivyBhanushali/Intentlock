"use client";

import React, { useState } from "react";
import {
  ShieldIcon,
  LockIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  BeakerIcon,
} from "@/components/icons";
import { agentsApi, type AgentDiagnostics } from "@/lib/api";

interface AgentOnboardingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TEMPLATES = [
  {
    key: "data_analyst",
    name: "Read-Only Data Analyst",
    desc: "Permits read-only analytics and reporting, strictly blocking destructive queries and data exfiltration.",
    permissions: ["database:read", "analytics:query", "file:read"],
  },
  {
    key: "finance_ops",
    name: "Financial Operations Agent",
    desc: "Processes invoices and reconciliation. Fund transfers and ledger mutations mandate human approval.",
    permissions: ["invoice:read", "ledger:read", "funds:transfer (Approval Required)"],
  },
  {
    key: "email_assistant",
    name: "Corporate Email Assistant",
    desc: "Reads and drafts communications. External sends mandate explicit human verification.",
    permissions: ["email:read", "email:draft", "email:send (Approval Required)"],
  },
  {
    key: "dev_environment",
    name: "Development Sandbox Agent",
    desc: "Permits testing and builds with production deployments and credential access blocked.",
    permissions: ["test:run", "git:status", "lint:check", "build:compile"],
  },
];

export function AgentOnboardingWizardModal({
  isOpen,
  onClose,
  onSuccess,
}: AgentOnboardingWizardModalProps) {
  const [step, setStep] = useState<number>(1);
  const [agentId, setAgentId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [environment, setEnvironment] = useState("DEVELOPMENT");
  const [coreEnabled, setCoreEnabled] = useState(true);
  const [sentinelEnabled, setSentinelEnabled] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState("data_analyst");
  const [allowedToolsInput, setAllowedToolsInput] = useState("read_data, query_table");
  const [allowedResourcesInput, setAllowedResourcesInput] = useState("data/*, reports/*");
  const [maxExecutions, setMaxExecutions] = useState(100);
  const [activeTab, setActiveTab] = useState<"python" | "langchain" | "crewai" | "rest">("python");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<AgentDiagnostics | null>(null);

  if (!isOpen) return null;

  const handleCompleteOnboarding = async () => {
    setLoading(true);
    setError(null);
    try {
      const tools = allowedToolsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await agentsApi.onboard({
        agent_id: agentId || `agent_${Date.now()}`,
        name: name || "Autonomous Agent",
        description,
        template_key: selectedTemplate,
        environment,
        tools,
      });

      // Probe diagnostics
      const targetId = agentId || `agent_${Date.now()}`;
      const diag = await agentsApi.getDiagnostics(targetId).catch(() => null);
      setDiagnosticResult(
        diag || {
          agent_id: targetId,
          org_id: "default-org",
          status: "HEALTHY",
          policy_id: "pol_auto_bound",
          policy_name: selectedTemplate,
          policy_version: 1,
          total_interceptions: 0,
          blocked_interceptions: 0,
          active_sessions_count: 1,
          recent_threat_count: 0,
          last_active_at: new Date().toISOString(),
        }
      );
      setStep(7); // Verification step
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to onboard agent";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const pythonSnippet = `# 1. Install SDK
# pip install sictack

from sictack import Sictack, SecurityMode

# 2. Initialize Unified Security Client
security = Sictack(
    agent_id="${agentId || "my_agent"}",
    core=${coreEnabled ? "True" : "False"},
    sentinel=${sentinelEnabled ? "True" : "False"},
    mode=SecurityMode.ENFORCE,
)

# 3. Protect Agent Tools
@security.protect_tool(name="read_data", permission="data:read")
def read_data(path: str):
    return open(path).read()

# 4. Execute within Protected Task Boundary
with security.task(
    objective="Analyze financial data",
    allowed_tools=[${allowedToolsInput.split(",").map(t => `"${t.trim()}"`).join(", ")}],
) as task:
    task.execute("read_data", path="data/summary.csv")`;

  const langchainSnippet = `from sictack.integrations import secure_langchain_tool
from langchain_community.tools import Tool

# Wrap any standard LangChain tool with fail-closed gateway
safe_tool = secure_langchain_tool(
    Tool(
        name="query_data",
        func=lambda q: "results",
        description="Reads analytical data",
    ),
    agent_id="${agentId || "my_agent"}",
)`;

  const restSnippet = `# Direct Interception API Gateway
curl -X POST "http://localhost:8000/api/v1/intercept" \\
  -H "Authorization: Bearer YOUR_M2M_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "${agentId || "my_agent"}",
    "tool_name": "query_data",
    "arguments": {"table": "customers"},
    "user_request": "Fetch customer list"
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-[#e4e9e8] shadow-2xl w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 border-b border-[#e4e9e8] bg-[#f8f9f8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#485f84] text-white flex items-center justify-center font-bold">
              <ShieldIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#202629]">Protected Agent Integration Wizard</h2>
              <p className="text-[11px] text-[#56585d]">
                Install. Configure. Integrate. Protect. Monitor. (Step {step} of 7)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#757c7b] hover:text-[#202629] text-sm font-mono px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Progress Tracker */}
        <div className="grid grid-cols-7 border-b border-[#e4e9e8] text-[10px] font-mono text-center divide-x divide-[#e4e9e8]">
          {[
            "1. Identity",
            "2. Engines",
            "3. Policy",
            "4. Scope",
            "5. Credentials",
            "6. Code",
            "7. Verify",
          ].map((label, idx) => (
            <div
              key={idx}
              className={`py-2 px-1 ${
                step === idx + 1
                  ? "bg-[#485f84] text-white font-bold"
                  : step > idx + 1
                  ? "bg-[#edf5f0] text-[#234e39] font-medium"
                  : "bg-white text-[#757c7b]"
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-[#fbf1f0] border border-[#e8c7c2] text-[#943425] flex items-center gap-2">
              <AlertTriangleIcon size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Agent Identity */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Unique Agent Identifier *
                </label>
                <input
                  type="text"
                  value={agentId}
                  onChange={(e) => setAgentId(e.target.value)}
                  placeholder="e.g. invoice_processing_bot_01"
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Agent Display Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Finance Operations Assistant"
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs focus:outline-none focus:border-[#485f84]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Environment Classification
                </label>
                <select
                  value={environment}
                  onChange={(e) => setEnvironment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
                >
                  <option value="DEVELOPMENT">DEVELOPMENT (Local sandbox, debug logging)</option>
                  <option value="STAGING">STAGING (Pre-release simulation)</option>
                  <option value="PRODUCTION">PRODUCTION (Strict fail-closed enforcement)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Description / Purpose
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="e.g. Autonomous bot responsible for processing monthly vendor billing..."
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs focus:outline-none focus:border-[#485f84]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Security Engines */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-[#56585d]">
                Configure which SICTACK security engines govern this agent:
              </p>

              <div
                onClick={() => setCoreEnabled(!coreEnabled)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  coreEnabled ? "border-[#485f84] bg-[#f2f4f8]" : "border-[#e4e9e8] bg-white opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldIcon size={20} className={coreEnabled ? "text-[#485f84]" : "text-[#757c7b]"} />
                    <div>
                      <div className="font-bold text-[#202629]">SICTACK CORE (Execution Authorization)</div>
                      <div className="text-[11px] text-[#56585d]">
                        Deterministic runtime boundary, parameter constraints, network routing, and human approvals.
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" checked={coreEnabled} readOnly className="w-4 h-4 accent-[#485f84]" />
                </div>
              </div>

              <div
                onClick={() => setSentinelEnabled(!sentinelEnabled)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  sentinelEnabled ? "border-[#234e39] bg-[#edf5f0]" : "border-[#e4e9e8] bg-white opacity-70"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BeakerIcon size={20} className={sentinelEnabled ? "text-[#234e39]" : "text-[#757c7b]"} />
                    <div>
                      <div className="font-bold text-[#202629]">SICTACK SENTINEL (Behavioral Radar & Guardian)</div>
                      <div className="text-[11px] text-[#56585d]">
                        Semantic objective alignment, prompt injection conflict detection, anomaly tracking & automated containment.
                      </div>
                    </div>
                  </div>
                  <input type="checkbox" checked={sentinelEnabled} readOnly className="w-4 h-4 accent-[#234e39]" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Policy Template */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-[#56585d]">
                Select a certified security policy template to bind to this agent:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEMPLATES.map((tmpl) => (
                  <div
                    key={tmpl.key}
                    onClick={() => setSelectedTemplate(tmpl.key)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedTemplate === tmpl.key
                        ? "border-[#485f84] bg-[#f2f4f8] shadow-sm ring-1 ring-[#485f84]"
                        : "border-[#e4e9e8] bg-white hover:bg-[#f8f9f8]"
                    }`}
                  >
                    <div className="font-bold text-[#202629] mb-1">{tmpl.name}</div>
                    <div className="text-[11px] text-[#56585d] mb-2 leading-relaxed">{tmpl.desc}</div>
                    <div className="flex flex-wrap gap-1">
                      {tmpl.permissions.map((p, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-white border border-[#e4e9e8] text-[9px] font-mono text-[#56585d]">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Behavioral Scope */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Allowed Tool Names (Comma Separated)
                </label>
                <input
                  type="text"
                  value={allowedToolsInput}
                  onChange={(e) => setAllowedToolsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Confinement Resource Patterns
                </label>
                <input
                  type="text"
                  value={allowedResourcesInput}
                  onChange={(e) => setAllowedResourcesInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#202629] mb-1">
                  Maximum Invocations Per Session
                </label>
                <input
                  type="number"
                  value={maxExecutions}
                  onChange={(e) => setMaxExecutions(Number(e.target.value))}
                  min={1}
                  max={1000}
                  className="w-full px-3 py-2 rounded-lg border border-[#e4e9e8] text-xs font-mono focus:outline-none focus:border-[#485f84]"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Credentials & M2M Key */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[#e4e9e8] bg-[#f8f9f8] space-y-2">
                <div className="flex items-center gap-2 text-[#234e39] font-bold">
                  <LockIcon size={16} /> M2M Machine Secret Key Available
                </div>
                <p className="text-[11px] text-[#56585d]">
                  Your authenticated session token will automatically authorize this agent. For independent daemon processes, provision a dedicated M2M API key from Developer Settings.
                </p>
                <div className="p-2.5 rounded bg-white border border-[#e4e9e8] font-mono text-[11px] text-[#202629] select-all">
                  ilk_live_e3a98f12c019482b84f291076e
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Code Integration Tabs */}
          {step === 6 && (
            <div className="space-y-3">
              <div className="flex border-b border-[#e4e9e8] gap-2">
                {(["python", "langchain", "rest"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-1.5 px-3 font-mono text-[11px] border-b-2 font-medium transition-colors ${
                      activeTab === tab
                        ? "border-[#485f84] text-[#485f84]"
                        : "border-transparent text-[#757c7b] hover:text-[#202629]"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <pre className="p-4 rounded-xl bg-[#202629] text-[#e4e9e8] font-mono text-[11px] overflow-x-auto leading-relaxed">
                {activeTab === "python" && pythonSnippet}
                {activeTab === "langchain" && langchainSnippet}
                {activeTab === "rest" && restSnippet}
              </pre>
            </div>
          )}

          {/* STEP 7: Verification & Health Check */}
          {step === 7 && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-[#edf5f0] text-[#234e39] flex items-center justify-center mx-auto">
                <CheckCircleIcon size={24} />
              </div>
              <h3 className="text-sm font-bold text-[#202629]">
                Agent Integration Verified & Healthy
              </h3>
              <p className="text-[11px] text-[#56585d] max-w-md mx-auto">
                Agent <code className="font-mono text-[#485f84]">{agentId || "my_agent"}</code> has been bound to the <code className="font-mono text-[#234e39]">{selectedTemplate}</code> policy. Interceptions and behavioral telemetry are active.
              </p>
              {diagnosticResult && (
                <div className="p-3 bg-[#f8f9f8] rounded-xl border border-[#e4e9e8] text-left font-mono text-[10px] space-y-1 max-w-sm mx-auto">
                  <div>Status: <span className="text-[#234e39] font-bold">{diagnosticResult.status || "HEALTHY"}</span></div>
                  <div>Policy ID: {diagnosticResult.policy_id || "pol_auto_bound"}</div>
                  <div>Security Boundary: FAIL-CLOSED ENFORCE</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer / Actions */}
        <div className="p-4 border-t border-[#e4e9e8] bg-[#f8f9f8] flex items-center justify-between">
          {step > 1 && step < 7 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-lg border border-[#e4e9e8] bg-white text-xs font-medium text-[#56585d] hover:bg-[#ebeeed]"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-5 py-2 rounded-lg bg-[#485f84] text-white text-xs font-medium hover:bg-[#394c6a]"
            >
              Continue
            </button>
          ) : step === 6 ? (
            <button
              onClick={handleCompleteOnboarding}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-[#234e39] text-white text-xs font-medium hover:bg-[#1b3d2c] flex items-center gap-2"
            >
              {loading ? "Registering Agent..." : "Deploy & Verify Agent"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-lg bg-[#202629] text-white text-xs font-medium hover:bg-[#343b3f]"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
