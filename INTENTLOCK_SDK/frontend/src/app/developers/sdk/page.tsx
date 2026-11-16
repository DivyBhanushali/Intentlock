// INTENTLOCK 2.0 – Python SDK Overview Page
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
    IntentLockClient,

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
from intentlock.integrations.langchain import SecureTool, secure_langchain_tool
from intentlock.integrations.langgraph import SecureGraphNode
from intentlock.integrations.mcp import MCPSecurityProxy`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Python SDK
            </span>
            <span className="text-xs text-slate-500">v0.1.0 Reference</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Python SDK Overview
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            The <code className="text-emerald-300 font-mono text-sm">intentlock-sdk</code> package provides deterministic boundary control, policy enforcement, approval management, and immutable audit logs for Python-based AI agents.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Architecture
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The SDK is designed to be lightweight, fail-closed, and non-intrusive. It wraps native Python tool functions, LangChain tools, LangGraph state graph nodes, and Model Context Protocol (MCP) clients with zero code changes required to the underlying tool implementations.
          </p>
        </section>

        {/* Section: Public Module Exports */}
        <section id="exports" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Public Module Exports
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            All primary classes and models are directly importable from the top-level <code className="text-emerald-300 font-mono">intentlock</code> namespace:
          </p>

          <CodeBlock code={topLevelImportCode} language="python" filename="sdk_imports.py" />

          <p className="text-sm text-slate-300 leading-relaxed pt-2">
            Framework adapters are located in their respective submodules under <code className="text-emerald-300 font-mono">intentlock.integrations</code>:
          </p>

          <CodeBlock code={integrationsImportCode} language="python" filename="integrations.py" />
        </section>

        {/* Section: Comparison */}
        <section id="comparison" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            In-Process (SecureAgent) vs Remote Gateway (IntentLockClient)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Choose the pattern that matches your deployment topology:
          </p>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4">SecureAgent (In-Process)</th>
                  <th className="py-3 px-4">IntentLockClient (Remote)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">Execution Location</td>
                  <td className="py-3 px-4 text-emerald-400">Directly in Python memory</td>
                  <td className="py-3 px-4 text-sky-400">FastAPI backend over HTTPS</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">Network Latency</td>
                  <td className="py-3 px-4 text-emerald-400">Sub-millisecond (&lt; 0.5ms)</td>
                  <td className="py-3 px-4 text-slate-300">10ms – 50ms depending on region</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">Tool Invocation</td>
                  <td className="py-3 px-4 text-emerald-400">Executes the registered Python function</td>
                  <td className="py-3 px-4 text-amber-400">Returns decision; caller runs tool</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">Policy Storage</td>
                  <td className="py-3 px-4 text-slate-300">Local in-memory Policy instance</td>
                  <td className="py-3 px-4 text-sky-400">PostgreSQL database with versioning</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">SOC Dashboard Telemetry</td>
                  <td className="py-3 px-4 text-slate-400">Local memory audit logs</td>
                  <td className="py-3 px-4 text-sky-400">Real-time centralized SOC dashboard</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-sans font-medium text-white">Authentication</td>
                  <td className="py-3 px-4 text-slate-300">Local agent_id &amp; permissions list</td>
                  <td className="py-3 px-4 text-sky-400">API Key header (X-API-Key)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Guides */}
        <section id="guides" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            SDK Documentation Guides
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/developers/sdk/initialization"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                Initialization &amp; Config &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Learn constructors, parameters, policies, and configuration options.
              </p>
            </Link>

            <Link
              href="/developers/sdk/tool-protection"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                Tool Protection &amp; Adapters &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Register tools and wrap LangChain, LangGraph, and MCP tools.
              </p>
            </Link>

            <Link
              href="/developers/sdk/decisions"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                Decisions &amp; Approvals &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Understand DecisionVerdict, RiskLevel, and human-in-the-loop workflows.
              </p>
            </Link>

            <Link
              href="/developers/sdk/errors"
              className="group rounded-xl border border-slate-800/80 bg-[#0a0e17] p-4 transition-all hover:border-emerald-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">
                Error Handling &rarr;
              </div>
              <p className="mt-1 text-xs text-slate-400">
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
