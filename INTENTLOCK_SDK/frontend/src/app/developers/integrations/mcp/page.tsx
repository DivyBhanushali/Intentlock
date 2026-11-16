// INTENTLOCK 2.0 – Model Context Protocol (MCP) Integration Guide
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function McpIntegrationPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Integrations", href: "/developers/integrations" },
    { label: "Model Context Protocol", href: "/developers/integrations/mcp" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Overview & Zero Dependencies", level: 2 },
    { id: "proxy-setup", title: "Configuring MCPSecurityProxy", level: 2 },
    { id: "jsonrpc-interception", title: "JSON-RPC 2.0 Message Handling", level: 2 },
    { id: "direct-call", title: "Direct handle_call_tool Invocation", level: 2 },
    { id: "approvals", title: "Approval Handling in MCP", level: 2 },
    { id: "boundaries", title: "Supported Capabilities & Boundaries", level: 2 },
  ];

  const mcpSetupCode = `from intentlock import SecureAgent, Config, Policy
from intentlock.integrations.mcp import MCPSecurityProxy

# 1. Define deterministic policy
policy = Policy(
    name="mcp-server-policy",
    allowed_permissions=["read_metric"],
    denied_permissions=["drop_schema"],
    require_approval_permissions=["restart_service"],
)

# 2. Initialize SecureAgent
agent = SecureAgent(
    agent_id="mcp-server-agent",
    permissions=["read_metric", "drop_schema", "restart_service"],
    config=Config(default_policy=policy),
)

# 3. Instantiate MCPSecurityProxy
proxy = MCPSecurityProxy(agent=agent, agent_id="mcp-server-agent")

# 4. Register server tools with parameter schemas
def read_system_metric(metric_id: str) -> dict:
    return {"metric": metric_id, "value": 98.4}

def drop_database_schema(schema_name: str) -> str:
    return f"Dropped {schema_name}"

proxy.register_mcp_tool(
    name="read_metric",
    handler=read_system_metric,
    permission="read_metric",
    description="Reads real-time host metric values",
)
proxy.register_mcp_tool(
    name="drop_schema",
    handler=drop_database_schema,
    permission="drop_schema",
    description="Drops database schema",
)`;

  const jsonRpcCode = `# Processing a standard JSON-RPC tools/call packet
allowed_request = {
    "jsonrpc": "2.0",
    "id": "req-1",
    "method": "tools/call",
    "params": {
        "name": "read_metric",
        "arguments": {"metric_id": "cpu_load"}
    }
}
response = proxy.handle_jsonrpc(allowed_request)
print("Allowed Output:", response)
# -> Allowed Output: {
#      'jsonrpc': '2.0',
#      'id': 'req-1',
#      'result': {
#        'content': [{'type': 'text', 'text': '{"metric": "cpu_load", "value": 98.4}'}],
#        'isError': False,
#        '_intentlock': {'verdict': 'ALLOW', 'allowed': True}
#      }
#    }

# Processing an unauthorized tools/call packet
denied_request = {
    "jsonrpc": "2.0",
    "id": "req-2",
    "method": "tools/call",
    "params": {
        "name": "drop_schema",
        "arguments": {"schema_name": "production"}
    }
}
denied_response = proxy.handle_jsonrpc(denied_request)
print("Denied Output:", denied_response["result"])
# -> Denied Output: {
#      'content': [{'type': 'text', 'text': "[INTENTLOCK_SECURITY_BLOCK] Tool 'drop_schema' was blocked by security policy."}],
#      'isError': True,
#      '_intentlock': {'verdict': 'DENY', 'allowed': False}
#    }`;

  const toolsListCode = `# Listing registered tools in MCP standard format
list_request = {
    "jsonrpc": "2.0",
    "id": "req-3",
    "method": "tools/list",
    "params": {}
}
tools_response = proxy.handle_jsonrpc(list_request)
print("Tools:", tools_response["result"]["tools"])
# -> Tools: [{'name': 'read_metric', 'description': '...', 'inputSchema': {...}}, ...]`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs font-mono font-medium text-emerald-400">
              Integrations
            </span>
            <span className="text-xs text-slate-500">Model Context Protocol</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Model Context Protocol (MCP) Security Proxy
          </h1>
          <p className="mt-3 text-base text-slate-400 leading-relaxed">
            Secure Model Context Protocol JSON-RPC 2.0 tool execution boundaries against prompt injection, unauthorized tool escalation, and data exfiltration using <code className="text-emerald-300 font-mono text-sm">MCPSecurityProxy</code>.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Overview &amp; Zero External Dependencies
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            <code className="text-emerald-300 font-mono">MCPSecurityProxy</code> is built directly into <code className="text-emerald-300 font-mono">intentlock-sdk</code>. It requires <strong>zero external MCP libraries</strong>, allowing it to sit transparently between any MCP client (such as Claude Desktop or custom MCP hosts) and MCP tool servers over standard stdio or HTTP SSE transports.
          </p>
        </section>

        {/* Section: Proxy Setup */}
        <section id="proxy-setup" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Configuring MCPSecurityProxy
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Initialize the proxy with an authenticated <code className="text-emerald-300 font-mono">SecureAgent</code> and register server tools:
          </p>
          <CodeBlock code={mcpSetupCode} language="python" filename="mcp_proxy_setup.py" />
        </section>

        {/* Section: JSON-RPC Interception */}
        <section id="jsonrpc-interception" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            JSON-RPC 2.0 Message Handling
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Pass JSON-RPC 2.0 message dictionaries into <code className="text-emerald-300 font-mono">proxy.handle_jsonrpc()</code>. INTENTLOCK verifies policies and returns standardized MCP responses:
          </p>
          <CodeBlock code={jsonRpcCode} language="python" filename="handle_jsonrpc.py" />
        </section>

        {/* Section: Direct Call */}
        <section id="direct-call" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Listing MCP Tools (tools/list)
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            The proxy responds to standard <code className="text-slate-200 font-mono">tools/list</code> requests, exporting tool schemas for LLM context:
          </p>
          <CodeBlock code={toolsListCode} language="python" filename="tools_list.py" />
        </section>

        {/* Section: Boundaries */}
        <section id="boundaries" className="space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-white border-b border-slate-800/80 pb-2">
            Supported Capabilities &amp; Boundaries
          </h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0e1420] text-slate-200 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-4">MCP Method</th>
                  <th className="py-2.5 px-4">Support Status</th>
                  <th className="py-2.5 px-4">Security Behavior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">tools/call</td>
                  <td className="py-2.5 px-4 font-sans text-emerald-300 font-semibold">Fully Enforced</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Policy verified, action hashed, audit logged.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-emerald-400">tools/list</td>
                  <td className="py-2.5 px-4 font-sans text-emerald-300 font-semibold">Supported</td>
                  <td className="py-2.5 px-4 font-sans text-slate-400">Returns list of registered MCP tools and JSON schemas.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-400">resources/*</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Out of Scope</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Resource URI resolution is handled by host transport.</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 text-slate-400">prompts/*</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Out of Scope</td>
                  <td className="py-2.5 px-4 font-sans text-slate-500">Prompt templates belong to client LLM configuration.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <Callout type="info" title="Execution Boundary Focus">
            <p className="text-xs leading-relaxed">
              INTENTLOCK focuses strictly on the <strong>execution boundary</strong>. In MCP architectures, prompt and resource messages are data transfers; the actual security hazard occurs when a tool is called to enact side effects on host systems.
            </p>
          </Callout>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "LangGraph Integration", href: "/developers/integrations/langgraph" }}
          next={{ title: "Complete Code Examples", href: "/developers/examples" }}
        />
      </div>
    </DeveloperLayout>
  );
}
