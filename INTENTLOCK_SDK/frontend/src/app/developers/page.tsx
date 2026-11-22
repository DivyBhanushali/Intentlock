// SICTACK 1.0 – Developer Portal Landing Page
// Direction A: Warm Editorial Software (Human-Centered Design)

import Link from "next/link";
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { CodeTabs } from "@/components/developers/CodeTabs";
import { Callout } from "@/components/developers/Callout";

export default function DevelopersLandingPage() {
  const breadcrumbs = [{ label: "Overview", href: "/developers" }];

  const toc = [
    { id: "hero", title: "Overview", level: 2 as const },
    { id: "why-sictack", title: "Why SICTACK?", level: 2 as const },
    { id: "how-it-works", title: "How SICTACK Works", level: 2 as const },
    { id: "integration-pathways", title: "Integration Pathways", level: 2 as const },
    { id: "core-capabilities", title: "Core Capabilities", level: 2 as const },
    { id: "developer-resources", title: "Developer Resources", level: 2 as const },
    { id: "getting-started-flow", title: "5-Step Onboarding Flow", level: 2 as const },
  ];

  const inProcessSdkCode = `from sictack import SecureAgent, Policy

# 1. Initialize SecureAgent with strict permission scopes
agent = SecureAgent(
    agent_id="support-agent-v1",
    permissions=["file:read", "email:send"]
)

# 2. Register tools with permission bindings
agent.register_tool(
    name="read_customer_data",
    handler=lambda file_path: open(file_path).read(),
    permission="file:read",
    description="Reads authorized customer files safely"
)

# 3. Intercept execution at the runtime boundary
result = agent.execute(
    tool_name="read_customer_data",
    arguments={"file_path": "/data/customers/1042.json"},
    user_request="Summarize account for user 1042"
)
print("Execution Result:", result)`;

  const remoteGatewayCode = `from sictack import SictackClient, DecisionVerdict

# 1. Initialize gateway client with M2M machine key
client = SictackClient(
    api_key="sck_live_your_api_key_here",
    base_url="https://intentlock-backend-ze2i.onrender.com",
    agent_id="support-agent-v1"
)

# 2. Request authorization decision from centralized gateway
decision = client.intercept(
    tool_name="send_refund_email",
    arguments={"recipient": "user@example.com", "amount": 120.00},
    user_request="Process partial refund for ticket #409"
)

# 3. Handle deterministic verdict
if decision.verdict == DecisionVerdict.ALLOW:
    # Safely proceed with tool execution
    print("Action authorized. Action Hash:", decision.action_hash)
elif decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
    # Await human-in-the-loop review
    print("Action paused for approval. Token ID:", decision.metadata.get("approval_id"))
else:
    # Abort tool invocation immediately (fail-closed)
    print(f"Action blocked by policy: {decision.reason}")`;

  const curlCode = `curl -X POST "https://intentlock-backend-ze2i.onrender.com/api/v1/intercept" \\
  -H "X-API-Key: sck_live_your_api_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{
    "agent_id": "support-agent-v1",
    "tool_name": "read_customer_data",
    "arguments": {
      "file_path": "/data/customers/1042.json"
    },
    "user_request": "Summarize account for user 1042"
  }'`;

  const integrationTabs = [
    {
      id: "in-process",
      label: "In-Process SDK (SecureAgent)",
      language: "python",
      code: inProcessSdkCode,
    },
    {
      id: "remote-gateway",
      label: "Remote Gateway (SictackClient)",
      language: "python",
      code: remoteGatewayCode,
    },
    {
      id: "curl",
      label: "Direct REST API (cURL)",
      language: "bash",
      code: curlCode,
    },
  ];

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      {/* ─── Hero Section ─── */}
      <section id="hero" className="scroll-mt-20 space-y-5">
        <div className="inline-flex items-center gap-2 rounded-md border border-[#D4E8DC] bg-[#EDF5F0] px-2.5 py-1 text-xs font-mono text-[#234E39]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#234E39]" />
          <span>DEVELOPER PORTAL &middot; SICTACK 1.0</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#18191B] leading-tight">
          Secure AI agent execution at the runtime boundary.
        </h1>

        <p className="text-sm text-[#56585D] leading-relaxed max-w-2xl">
          SICTACK is a deterministic security middleware and Python developer SDK that intercepts
          AI agent tool calls before invocation. It enforces explicit permission policies, intent
          contexts, and human approvals with fail-closed mathematical guarantees.
        </p>

        {/* Primary Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
          <Link
            href="/developers/quickstart"
            className="rounded-lg border border-[#1D3557] bg-[#FFFFFF] px-4 py-2 font-semibold text-[#18191B] hover:bg-[#FFFFFF] transition-all shadow-xs"
          >
            Quickstart Tutorial &rarr;
          </Link>

          <Link
            href="/developers/sdk"
            className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-4 py-2 font-medium text-[#56585D] hover:border-[#CECBC0] hover:text-[#18191B] transition-colors shadow-xs"
          >
            Python SDK Guide
          </Link>

          <Link
            href="/developers/api/reference"
            className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-4 py-2 font-medium text-[#56585D] hover:border-[#CECBC0] hover:text-[#18191B] transition-colors shadow-xs"
          >
            REST API Reference
          </Link>

          <Link
            href="/test"
            className="rounded-lg border border-[#E2E0D8] bg-[#FFFFFF] px-4 py-2 font-medium text-[#56585D] hover:text-[#18191B] hover:border-[#CECBC0] transition-colors shadow-xs"
          >
            Live Playground
          </Link>
        </div>
      </section>

      {/* ─── Section A: Why SICTACK? ─── */}
      <section id="why-sictack" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          Why SICTACK?
        </h2>
        <p className="text-xs text-[#56585D] leading-relaxed max-w-3xl">
          Autonomous AI agents interact with production systems by dispatching tool calls: querying
          relational databases, reading customer files, dispatching emails, or invoking external APIs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="rounded-xl border border-[#F8D5D0] bg-[#FDF1EF] p-4 space-y-2 shadow-[0_1px_3px_rgba(24,25,27,0.03)]">
            <div className="text-xs font-semibold text-[#943425]">
              The Problem: Non-Deterministic Execution
            </div>
            <p className="text-xs text-[#56585D] leading-relaxed">
              Prompt injections, indirect instruction poisoning, and multi-step reasoning failures
              can trick an LLM into calling destructive or unauthorized tools. Text-based guardrails
              and model self-reflection are probabilistic and easily bypassed.
            </p>
          </div>

          <div className="rounded-xl border border-[#D4E8DC] bg-[#EDF5F0] p-4 space-y-2 shadow-[0_1px_3px_rgba(24,25,27,0.03)]">
            <div className="text-xs font-semibold text-[#234E39]">
              The Solution: Deterministic Boundary Control
            </div>
            <p className="text-xs text-[#56585D] leading-relaxed">
              SICTACK inserts an immutable, code-level execution guard between the agent and its
              tools. Invocations are intercepted before invocation, evaluated against strict
              mathematical policies, and aborted instantly if unauthorized.
            </p>
          </div>
        </div>
      </section>

      {/* ─── Section B: How SICTACK Works ─── */}
      <section id="how-it-works" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          How SICTACK Works
        </h2>
        <p className="text-xs text-[#56585D] leading-relaxed max-w-3xl">
          SICTACK enforces security decisions through a 5-step lifecycle. Importantly,{" "}
          <strong className="text-[#18191B]">authorization is strictly decoupled from tool execution</strong>:
        </p>

        {/* Visual Lifecycle Pipeline */}
        <div className="my-6 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-left text-xs">
            <div className="rounded-lg border border-[#E2E0D8] bg-[#F4F3EE] p-3 flex-1 w-full">
              <span className="font-mono text-[10px] text-[#787A80] block">STEP 1</span>
              <span className="font-semibold text-[#18191B]">AI Agent</span>
              <span className="text-[11px] text-[#56585D] block mt-0.5">Plans action payload</span>
            </div>

            <span className="text-[#787A80] font-mono hidden md:inline">&rarr;</span>

            <div className="rounded-lg border border-[#E2E0D8] bg-[#F4F3EE] p-3 flex-1 w-full">
              <span className="font-mono text-[10px] text-[#787A80] block">STEP 2</span>
              <span className="font-semibold text-[#18191B]">Tool Call</span>
              <span className="text-[11px] text-[#56585D] block mt-0.5">Intercepted at boundary</span>
            </div>

            <span className="text-[#787A80] font-mono hidden md:inline">&rarr;</span>

            <div className="rounded-lg border border-[#CFDEEB] bg-[#EEF4F8] p-3 flex-1 w-full">
              <span className="font-mono text-[10px] text-[#1D3557] block">STEP 3</span>
              <span className="font-semibold text-[#18191B]">SICTACK Guard</span>
              <span className="text-[11px] text-[#56585D] block mt-0.5">Evaluates policy & intent</span>
            </div>

            <span className="text-[#787A80] font-mono hidden md:inline">&rarr;</span>

            <div className="rounded-lg border border-[#D4E8DC] bg-[#EDF5F0] p-3 flex-1 w-full">
              <span className="font-mono text-[10px] text-[#234E39] block">STEP 4</span>
              <span className="font-semibold text-[#18191B]">Verdict Decision</span>
              <span className="text-[10px] font-mono text-[#234E39] block mt-0.5 font-semibold">
                ALLOW &middot; DENY &middot; APPROVE
              </span>
            </div>

            <span className="text-[#787A80] font-mono hidden md:inline">&rarr;</span>

            <div className="rounded-lg border border-[#E2E0D8] bg-[#F4F3EE] p-3 flex-1 w-full">
              <span className="font-mono text-[10px] text-[#787A80] block">STEP 5</span>
              <span className="font-semibold text-[#18191B]">Execution / Abort</span>
              <span className="text-[11px] text-[#56585D] block mt-0.5">Action executed or aborted</span>
            </div>
          </div>
        </div>

        <Callout type="warning" title="Separation of Concerns">
          SICTACK does not execute untrusted tools directly inside its policy engine. It acts as an
          authoritative authorization engine: returning a cryptographic verdict and canonical action
          hash, allowing your host application runtime to safely execute or abort execution.
        </Callout>
      </section>

      {/* ─── Section C: Choose Your Integration ─── */}
      <section id="integration-pathways" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          Integration Pathways
        </h2>
        <p className="text-xs text-[#56585D] leading-relaxed max-w-3xl">
          SICTACK provides two complementary operational models. Select the architecture suited to
          your deployment model:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-3 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#18191B]">In-Process Python SDK</h3>
              <span className="rounded border border-[#D4E8DC] bg-[#EDF5F0] px-2 py-0.5 text-[10px] font-mono text-[#234E39] font-semibold">
                Local Guardrails
              </span>
            </div>
            <p className="text-xs text-[#56585D] leading-relaxed">
              Uses <code className="text-[#234E39] font-mono font-semibold">SecureAgent</code> to wrap tools
              directly inside your Python application process. Evaluates policies in-memory with
              sub-millisecond latency and zero external network calls.
            </p>
            <ul className="text-xs text-[#56585D] space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="text-[#234E39] font-semibold">&check;</span> Zero network overhead (&lt; 0.2ms)
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#234E39] font-semibold">&check;</span> Direct callable tool registration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#234E39] font-semibold">&check;</span> Ideal for microservices, CLI agents,
                and air-gapped jobs
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/developers/sdk"
                className="text-xs text-[#1D3557] hover:underline font-medium"
              >
                View Python SDK Guide &rarr;
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-5 space-y-3 shadow-[0_1px_3px_rgba(24,25,27,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm text-[#18191B]">Remote Gateway Client</h3>
              <span className="rounded border border-[#CFDEEB] bg-[#EEF4F8] px-2 py-0.5 text-[10px] font-mono text-[#1D3557] font-semibold">
                Centralized Governance
              </span>
            </div>
            <p className="text-xs text-[#56585D] leading-relaxed">
              Uses <code className="text-[#1D3557] font-mono font-semibold">SictackClient</code> to query the
              centralized FastAPI backend over HTTPS using machine-to-machine API keys (
              <code className="text-[#18191B] font-mono">ilk_live_...</code>).
            </p>
            <ul className="text-xs text-[#56585D] space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="text-[#1D3557] font-semibold">&check;</span> Organization-wide declarative
                policies
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#1D3557] font-semibold">&check;</span> Cross-service Intent Authorization
                Contexts
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[#1D3557] font-semibold">&check;</span> Centralized audit ledger and live
                SOC telemetry
              </li>
            </ul>
            <div className="pt-2">
              <Link
                href="/developers/api"
                className="text-xs text-[#1D3557] hover:underline font-medium"
              >
                View REST API Guide &rarr;
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <CodeTabs tabs={integrationTabs} defaultTabId="in-process" />
        </div>
      </section>

      {/* ─── Section D: Core Capabilities ─── */}
      <section id="core-capabilities" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          Core Capabilities (Verified by Automated Test Suite)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
          {[
            {
              title: "Execution-Boundary Enforcement",
              desc: "Wraps callable handlers at the runtime interface so unauthorized actions cannot invoke real system APIs.",
              tag: "Core",
            },
            {
              title: "Deterministic Policy Evaluation",
              desc: "Evaluates explicit allow/deny sets, sensitivity limits, and glob resource paths with zero model hallucination.",
              tag: "Deterministic",
            },
            {
              title: "Task-Scoped Intent Contexts",
              desc: "Time-limited cryptographic tokens restricting an agent's authority strictly to an approved objective.",
              tag: "Intent IAM",
            },
            {
              title: "Human-in-the-Loop Approvals",
              desc: "Requires explicit operator confirmation for high-risk operations with nonce verification against token replay.",
              tag: "Governance",
            },
            {
              title: "Tamper-Evident Audit Ledger",
              desc: "SHA-256 hash-chained event records that can be cryptographically verified to guarantee audit integrity.",
              tag: "Audit",
            },
            {
              title: "Python SDK (sictack)",
              desc: "Ergonomic, lightweight Python package (Python >= 3.12, Pydantic v2) for in-process or remote gateway usage.",
              tag: "SDK",
            },
            {
              title: "REST API Gateway",
              desc: "FastAPI-powered enterprise gateway providing 42 REST endpoints with multi-tenant RBAC and M2M API keys.",
              tag: "REST API",
            },
            {
              title: "LangChain & LangGraph",
              desc: "SecureTool and SecureGraphNode wrappers enabling drop-in protection for popular agent orchestration frameworks.",
              tag: "Integrations",
            },
            {
              title: "Model Context Protocol (MCP)",
              desc: "MCPSecurityProxy inspecting JSON-RPC tool lists and call requests across external MCP server connections.",
              tag: "MCP",
            },
          ].map((cap, i) => (
            <div
              key={i}
              className="rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 space-y-2 hover:border-[#CECBC0] transition-colors shadow-[0_1px_3px_rgba(24,25,27,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#18191B]">{cap.title}</span>
                <span className="rounded bg-[#F4F3EE] px-1.5 py-0.5 text-[9px] font-mono text-[#1D3557] border border-[#E2E0D8] font-semibold">
                  {cap.tag}
                </span>
              </div>
              <p className="text-[11px] text-[#56585D] leading-relaxed">{cap.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section E: Developer Resources ─── */}
      <section id="developer-resources" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          Developer Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-3">
          {[
            {
              title: "5-Minute Quickstart",
              href: "/developers/quickstart",
              desc: "Step-by-step tutorial to protect your first Python agent tool.",
              badge: "Tutorial",
            },
            {
              title: "Python SDK Reference",
              href: "/developers/sdk",
              desc: "Class methods, parameters, return types, and lifecycle exceptions.",
              badge: "SDK v1.0.0",
            },
            {
              title: "REST Endpoints Reference",
              href: "/developers/api/reference",
              desc: "Interactive catalog of all 42 REST API endpoints with request schemas.",
              badge: "OpenAPI",
            },
            {
              title: "Security & Threat Model",
              href: "/developers/security",
              desc: "Detailed threat vectors, SHA-256 audit chaining, and least-privilege IAM.",
              badge: "Security",
            },
            {
              title: "Ecosystem Integrations",
              href: "/developers/sdk/tool-protection",
              desc: "Guides for LangChain SecureTool, LangGraph nodes, and MCP security proxies.",
              badge: "Frameworks",
            },
            {
              title: "Interactive Playground",
              href: "/test",
              desc: "Simulate live tool calls, payload attacks, and approval triggers in your browser.",
              badge: "Live Test",
            },
          ].map((res, i) => (
            <Link
              key={i}
              href={res.href}
              className="group rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 transition-all hover:border-[#CECBC0] hover:shadow-[0_2px_8px_rgba(24,25,27,0.06)] shadow-[0_1px_3px_rgba(24,25,27,0.04)]"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#18191B] group-hover:text-[#1D3557] transition-colors">
                  {res.title}
                </span>
                <span className="text-[10px] font-mono text-[#787A80] group-hover:text-[#18191B]">
                  {res.badge}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-[#56585D] leading-relaxed">{res.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Section F: Getting Started Flow ─── */}
      <section id="getting-started-flow" className="scroll-mt-20 mt-14 space-y-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
          5-Step Developer Onboarding Flow
        </h2>
        <div className="space-y-3 mt-3 text-xs">
          <div className="flex items-start gap-3 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(24,25,27,0.04)] min-w-0 overflow-hidden">
            <span className="rounded bg-[#EDF5F0] px-2 py-1 font-mono font-bold text-[#234E39] text-xs border border-[#D4E8DC] shrink-0">
              01
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="font-semibold text-[#18191B]">Install the Python SDK</div>
                <a
                  href="https://pypi.org/project/sictack/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono font-medium text-[#234E39] hover:underline"
                >
                  PyPI: sictack v1.0.0 ↗
                </a>
              </div>
              <p className="text-[#56585D] text-[11px]">
                Install the official <code className="text-[#18191B] font-mono font-medium">sictack</code> distribution from PyPI into your Python &ge; 3.12 environment:
              </p>
              <CodeBlock
                code="pip install sictack"
                language="bash"
              />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(24,25,27,0.04)] min-w-0">
            <span className="rounded bg-[#EDF5F0] px-2 py-1 font-mono font-bold text-[#234E39] text-xs border border-[#D4E8DC] shrink-0">
              02
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-semibold text-[#18191B]">Configure Security Policies</div>
              <p className="text-[#56585D] text-[11px]">
                Define permitted permissions, disallowed dangerous actions, sensitivity thresholds,
                and required human approvals.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(24,25,27,0.04)] min-w-0">
            <span className="rounded bg-[#EDF5F0] px-2 py-1 font-mono font-bold text-[#234E39] text-xs border border-[#D4E8DC] shrink-0">
              03
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-semibold text-[#18191B]">Protect Your Agent Tools</div>
              <p className="text-[#56585D] text-[11px]">
                Wrap Python functions with <code className="text-[#18191B] font-mono font-medium">agent.register_tool()</code> or LangChain tools with <code className="text-[#18191B] font-mono font-medium">SecureTool()</code>.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(24,25,27,0.04)] min-w-0">
            <span className="rounded bg-[#EDF5F0] px-2 py-1 font-mono font-bold text-[#234E39] text-xs border border-[#D4E8DC] shrink-0">
              04
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-semibold text-[#18191B]">Evaluate Interception Decisions</div>
              <p className="text-[#56585D] text-[11px]">
                Handle deterministic verdicts (<code className="text-[#234E39] font-mono font-semibold">ALLOW</code>, <code className="text-[#943425] font-mono font-semibold">DENY</code>, <code className="text-[#8D5B18] font-mono font-semibold">REQUIRE_APPROVAL</code>) before executing any real system code.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl border border-[#E2E0D8] bg-[#FFFFFF] p-4 shadow-[0_1px_3px_rgba(24,25,27,0.04)] min-w-0">
            <span className="rounded bg-[#EDF5F0] px-2 py-1 font-mono font-bold text-[#234E39] text-xs border border-[#D4E8DC] shrink-0">
              05
            </span>
            <div className="space-y-1 flex-1 min-w-0">
              <div className="font-semibold text-[#18191B]">Inspect Cryptographic Audit Trail</div>
              <p className="text-[#56585D] text-[11px]">
                Review tamper-evident SHA-256 chained audit logs in the local log or via the
                centralized Audit Ledger endpoint.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-between items-center border-t border-[#E2E0D8] text-xs">
          <span className="text-[#787A80]">Ready to begin?</span>
          <Link
            href="/developers/quickstart"
            className="rounded-lg border border-[#1D3557] bg-[#FFFFFF] px-4 py-2 font-semibold text-[#18191B] hover:bg-[#FFFFFF] transition-all shadow-xs"
          >
            Start with Quickstart &rarr;
          </Link>
        </div>
      </section>
    </DeveloperLayout>
  );
}
