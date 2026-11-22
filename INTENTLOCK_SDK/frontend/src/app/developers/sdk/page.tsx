// SICTACK 1.0 – Python SDK Overview Page
import Link from "next/link";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function SdkOverviewPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Python SDK", href: "/developers/sdk" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Overview", level: 2 },
    { id: "exports", title: "Public Module Exports", level: 2 },
    { id: "comparison", title: "In-Process vs Remote Gateway", level: 2 },
    { id: "architecture", title: "Package Organization", level: 2 },
    { id: "guides", title: "SDK Documentation Guides", level: 2 },
  ];

  const topLevelImportCode = `from intentlock import (
    # Core In-Process Security Agent
    SecureAgent,

    # Centralized Remote Authorization Client
    SictackClient,

    # Data Models
    ToolCall,
    Decision,

    # Configuration & Policy
    Config,
    Policy,

    # Package Version
    __version__,
)`;

  const integrationsImportCode = `# Optional Agentic Framework Adapters
from sictack.integrations.langchain import SecureTool, secure_langchain_tool
from sictack.integrations.langgraph import SecureGraphNode
from sictack.integrations.mcp import MCPSecurityProxy`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Python SDK
            </span>
            <span className="text-xs text-[#787A80]">v1.0.0 Reference</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Python SDK Overview
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            The <code className="text-[#234E39] font-mono text-sm">sictack</code> package provides deterministic boundary control, policy enforcement, approval management, and immutable audit logs for Python-based AI agents.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Architecture
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            The SDK is designed to be lightweight, fail-closed, and non-intrusive. It wraps native Python tool functions, LangChain tools, LangGraph state graph nodes, and Model Context Protocol (MCP) clients with zero code changes required to the underlying tool implementations.
          </p>
        </section>

        {/* Section: Public Module Exports */}
        <section id="exports" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Public Module Exports
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            All primary classes and models are directly importable from the top-level <code className="text-[#234E39] font-mono">intentlock</code> namespace:
          </p>

          <CodeBlock code={topLevelImportCode} language="python" filename="sdk_imports.py" />

          <p className="text-sm text-[#56585D] leading-relaxed pt-2">
            Framework adapters are located in their respective submodules under <code className="text-[#234E39] font-mono">intentlock.integrations</code>:
          </p>

          <CodeBlock code={integrationsImportCode} language="python" filename="integrations.py" />
        </section>

        {/* Section: Comparison */}
        <section id="comparison" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            In-Process (SecureAgent) vs Remote Gateway (SictackClient)
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Choose the pattern that matches your deployment topology:
          </p>

          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">SecureAgent (In-Process)</th>
                  <th className="py-3 px-4">SictackClient (Remote)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">Execution Location</td>
                  <td className="py-3 px-4 text-[#234E39]">Directly in Python memory</td>
                  <td className="py-3 px-4 text-[#1D3557]">FastAPI backend over HTTPS</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">Network Latency</td>
                  <td className="py-3 px-4 text-[#234E39]">Sub-millisecond (&lt; 0.5ms)</td>
                  <td className="py-3 px-4 text-[#56585D]">10ms – 50ms depending on region</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">Tool Invocation</td>
                  <td className="py-3 px-4 text-[#234E39]">Executes the registered Python function</td>
                  <td className="py-3 px-4 text-[#8D5B18]">Returns decision; caller runs tool</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">Policy Storage</td>
                  <td className="py-3 px-4 text-[#56585D]">Local in-memory Policy instance</td>
                  <td className="py-3 px-4 text-[#1D3557]">PostgreSQL database with versioning</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">SOC Dashboard Telemetry</td>
                  <td className="py-3 px-4 text-[#56585D]">Local memory audit logs</td>
                  <td className="py-3 px-4 text-[#1D3557]">Real-time centralized SOC dashboard</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-[#18191B]">Authentication</td>
                  <td className="py-3 px-4 text-[#56585D]">Local agent_id &amp; permissions list</td>
                  <td className="py-3 px-4 text-[#1D3557]">API Key header (X-API-Key)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Guides */}
        <section id="guides" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            SDK Documentation Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/developers/sdk/initialization"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#234E39]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#234E39]">
                Initialization &amp; Config &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Learn constructors, parameters, policies, and configuration options.
              </p>
            </Link>

            <Link
              href="/developers/sdk/tool-protection"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#234E39]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#234E39]">
                Tool Protection &amp; Adapters &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Register tools and wrap LangChain, LangGraph, and MCP tools.
              </p>
            </Link>

            <Link
              href="/developers/sdk/decisions"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#234E39]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#234E39]">
                Decisions &amp; Approvals &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Understand DecisionVerdict, RiskLevel, and human-in-the-loop workflows.
              </p>
            </Link>

            <Link
              href="/developers/sdk/errors"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#234E39]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#234E39]">
                Error Handling &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Comprehensive guide to the IntentLockError exception hierarchy.
              </p>
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "Core Concepts", href: "/developers/concepts" }}
          next={{ title: "Initialization & Config", href: "/developers/sdk/initialization" }}
        />
      </div>
    </DeveloperLayout>
  );
}
