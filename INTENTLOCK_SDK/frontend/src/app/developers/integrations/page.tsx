// SICTACK 1.0 – Framework Integrations Overview Page
import Link from "next/link";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function IntegrationsOverviewPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Framework Integrations", href: "/developers/integrations" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Supported Frameworks", level: 2 },
    { id: "matrix", title: "Adapter Capabilities Matrix", level: 2 },
    { id: "design-philosophy", title: "Non-Intrusive Architecture", level: 2 },
    { id: "installation", title: "Installing Optional Dependencies", level: 2 },
    { id: "guides", title: "Integration Guides", level: 2 },
  ];

  const installCode = `# Install optional agent framework libraries as needed
pip install langchain-core   # For LangChain integration
pip install langgraph        # For LangGraph multi-agent workflows
# MCP is built into sictack with zero external dependencies!`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Integrations
            </span>
            <span className="text-xs text-[#787A80]">Ecosystem Adapters</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            Framework Integrations
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            SICTACK provides drop-in native adapters for modern AI agent frameworks. Wrap tools, nodes, and protocol proxies without altering underlying application business logic.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Supported Frameworks
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#234E39]">LANGCHAIN</span>
                <h3 className="text-base font-bold text-[#18191B] mt-1">SecureTool</h3>
                <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                  Wraps LangChain BaseTool, StructuredTool, and custom functions with automatic argument normalization, error handling, and approval tokens.
                </p>
              </div>
              <Link
                href="/developers/integrations/langchain"
                className="mt-4 text-xs font-semibold text-[#234E39] hover:text-[#234E39] transition-colors"
              >
                View LangChain Guide &rarr;
              </Link>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#1D3557]">LANGGRAPH</span>
                <h3 className="text-base font-bold text-[#18191B] mt-1">SecureGraphNode</h3>
                <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                  Secures stateful multi-agent graphs. Enforces node-level authorization and enables human-in-the-loop review branching without workflow crashes.
                </p>
              </div>
              <Link
                href="/developers/integrations/langgraph"
                className="mt-4 text-xs font-semibold text-[#1D3557] hover:text-[#1D3557] transition-colors"
              >
                View LangGraph Guide &rarr;
              </Link>
            </div>

            <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-indigo-400">MODEL CONTEXT PROTOCOL</span>
                <h3 className="text-base font-bold text-[#18191B] mt-1">MCPSecurityProxy</h3>
                <p className="mt-2 text-xs text-[#56585D] leading-relaxed">
                  Intercepts JSON-RPC 2.0 <code className="text-[#56585D]">tools/call</code> and <code className="text-[#56585D]">tools/list</code> messages between MCP clients and servers.
                </p>
              </div>
              <Link
                href="/developers/integrations/mcp"
                className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                View MCP Proxy Guide &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* Section: Matrix */}
        <section id="matrix" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Adapter Capabilities Matrix
          </h2>
          <div className="overflow-x-auto rounded-xl border border-[#E2E0D8]">
            <table className="w-full text-left text-xs text-[#56585D]">
              <thead className="bg-[#FFFFFF] text-[#18191B] border-b border-[#E2E0D8] font-semibold">
                <tr>
                  <th className="py-2.5 px-4">Adapter</th>
                  <th className="py-2.5 px-4">Target Framework</th>
                  <th className="py-2.5 px-4">Protocol / Method</th>
                  <th className="py-2.5 px-4">Approval Pattern</th>
                  <th className="py-2.5 px-4">Error Handling</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E0D8] font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-[#234E39] font-bold">SecureTool</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">LangChain Core</td>
                  <td className="py-2.5 px-4 text-[#56585D]">.run(), .invoke()</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Parameter <code className="text-[#56585D]">approval_id</code></td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Formats string or raises</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-[#1D3557] font-bold">SecureGraphNode</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">LangGraph</td>
                  <td className="py-2.5 px-4 text-[#56585D]">StateGraph node callable</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">State branching (`_intentlock_status`)</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Fails closed or branches state</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-indigo-400 font-bold">MCPSecurityProxy</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Model Context Protocol</td>
                  <td className="py-2.5 px-4 text-[#56585D]">JSON-RPC 2.0 tools/call</td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">RPC param <code className="text-[#56585D]">approval_id</code></td>
                  <td className="py-2.5 px-4 font-sans text-[#56585D]">Standard MCP error object</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section: Design Philosophy */}
        <section id="design-philosophy" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Non-Intrusive Architecture
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK adapters wrap existing callables without modifying your core business logic or forcing proprietary base classes:
          </p>
          <ul className="text-xs text-[#56585D] space-y-2 list-disc list-inside">
            <li><strong>Preserves Signatures</strong>: Argument names, default values, and type annotations remain untouched.</li>
            <li><strong>Transparent Audit</strong>: Downstream tool results pass back cleanly to the calling LLM or state machine.</li>
            <li><strong>Fail-Closed Guarantee</strong>: Any policy denial or unexpected exception halts tool execution before external side effects occur.</li>
          </ul>
        </section>

        {/* Section: Installation */}
        <section id="installation" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Installing Optional Dependencies
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            SICTACK keeps core dependencies minimal. Install framework libraries according to your stack:
          </p>
          <CodeBlock code={installCode} language="bash" filename="Terminal" />
        </section>

        {/* Section: Guides */}
        <section id="guides" className="scroll-mt-20 space-y-4 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/developers/integrations/langchain"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#234E39]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#234E39]">
                LangChain Guide &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Secure LangChain tools, agents, and Runnable sequences.
              </p>
            </Link>

            <Link
              href="/developers/integrations/langgraph"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#1D3557]/20 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-[#1D3557]">
                LangGraph Guide &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Node-level authorization and human-in-the-loop state branching.
              </p>
            </Link>

            <Link
              href="/developers/integrations/mcp"
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-indigo-500/30 hover:bg-slate-900/60"
            >
              <div className="text-sm font-semibold text-[#18191B] group-hover:text-indigo-400">
                MCP Proxy Guide &rarr;
              </div>
              <p className="mt-1 text-xs text-[#56585D]">
                Protect Model Context Protocol JSON-RPC tool endpoints.
              </p>
            </Link>
          </div>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "OpenAPI Endpoint Reference", href: "/developers/api/reference" }}
          next={{ title: "LangChain Integration", href: "/developers/integrations/langchain" }}
        />
      </div>
    </DeveloperLayout>
  );
}
