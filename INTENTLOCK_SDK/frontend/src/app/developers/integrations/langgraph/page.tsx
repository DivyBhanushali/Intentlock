// SICTACK 1.0 – LangGraph Integration Guide
import { DeveloperLayout } from "@/components/developers/DeveloperLayout";
import { CodeBlock } from "@/components/developers/CodeBlock";
import { Callout } from "@/components/developers/Callout";
import { PreviousNextNavigation } from "@/components/developers/PreviousNextNavigation";
import { TocItem } from "@/components/developers/types";

export default function LangGraphIntegrationPage() {
  const breadcrumbs = [
    { label: "Developers", href: "/developers" },
    { label: "Integrations", href: "/developers/integrations" },
    { label: "LangGraph", href: "/developers/integrations/langgraph" },
  ];

  const toc: TocItem[] = [
    { id: "overview", title: "Overview & Multi-Agent State", level: 2 },
    { id: "secure-node", title: "SecureGraphNode Implementation", level: 2 },
    { id: "decorator", title: "Using @secure_langgraph_node Decorator", level: 2 },
    { id: "delegation-graph", title: "Multi-Agent Delegation State Propagation", level: 2 },
    { id: "approval-branching", title: "Human-in-the-Loop State Branching", level: 2 },
    { id: "fail-closed", title: "Fail-Closed Configuration", level: 2 },
  ];

  const installCode = `pip install "sictack>=1.0.0"
pip install "langgraph>=0.0.10"`;

  const delegationGraphCode = `from sictack.unified import Sictack
from sictack.integrations.langgraph import SecureGraphNode

security = Sictack(signing_key="production-secret")

# 1. Supervisor issues cryptographic delegation token
supervisor_token = security.delegate(
    parent_agent_id="supervisor-agent",
    child_agent_id="worker-analyst",
    allowed_capabilities=["analyze_sentiment"],
    allocated_budget=10,
)

# 2. Worker node wraps handler with Sictack security enforcement
def analyze_node(state: dict) -> dict:
    return {"insights": "Positive sentiment detected across 50 records"}

secure_worker_node = SecureGraphNode(
    name="worker_analysis",
    func=analyze_node,
    security=security,
    permission="analyze_sentiment",
)

# 3. Node extracts delegation token from graph state dictionary automatically
graph_state = {
    "text": "Market research batch 12",
    "_delegation_token": supervisor_token,
    "_agent_id": "worker-analyst",
}
output_state = secure_worker_node(graph_state)
print("Status:", output_state["_sictack_status"])  # dual-key: output_state["_intentlock_status"] also emitted
# -> APPROVED`;

  const langGraphCode = `from sictack import SecureAgent, Config, Policy
from sictack.integrations.langgraph import SecureGraphNode

# 1. Define multi-agent policy
policy = Policy(
    name="langgraph-multi-agent-policy",
    allowed_permissions=["analyze_sentiment", "extract_entities"],
    denied_permissions=["publish_tweet"],
    require_approval_permissions=["post_external_review"],
)

# 2. Initialize SecureAgent
agent = SecureAgent(
    agent_id="graph-analyst",
    permissions=["analyze_sentiment", "extract_entities", "publish_tweet", "post_external_review"],
    config=Config(default_policy=policy),
)

# 3. Define standard LangGraph state handler
def sentiment_node(state: dict) -> dict:
    text = state.get("text", "")
    return {"sentiment": "POSITIVE", "length": len(text)}

# 4. Wrap with SecureGraphNode
secure_sentiment = SecureGraphNode(
    name="analyze_sentiment",
    func=sentiment_node,
    agent=agent,
    permission="analyze_sentiment",
)

# Execute node with graph state
state = {"text": "Zero-trust architecture for AI workflows"}
output_state = secure_sentiment(state)
print("Output:", output_state)
# -> Output: {'sentiment': 'POSITIVE', 'length': 41, 'trace_id': '...', '_sictack_status': 'APPROVED'}`;

  const decoratorCode = `from sictack.integrations.langgraph import secure_langgraph_node

@secure_langgraph_node(
    name="extract_entities",
    agent=agent,
    permission="extract_entities",
)
def entity_node(state: dict) -> dict:
    return {"entities": ["SICTACK", "FastAPI"]}

result = entity_node({"text": "sample text"})
print(result["_sictack_status"])
# -> APPROVED`;

  const branchingCode = `def review_node(state: dict) -> dict:
    return {"reviewed": True, "feedback": "Ready for publication"}

secure_review = SecureGraphNode(
    name="post_external_review",
    func=review_node,
    agent=agent,
    permission="post_external_review",  # Requires human authorization
)

# Calling the node branches state gracefully without throwing an exception
pending_state = secure_review({"text": "Release draft v2"})

print("Status:", pending_state["_sictack_status"])
# -> Status: REQUIRE_APPROVAL

print("Pending Node:", pending_state["_pending_node"])
# -> Pending Node: post_external_review

print("Approval ID:", pending_state["_approval_id"])
# -> Approval ID: eba5b6a9-92d5-44ee-8fa9-...`;

  return (
    <DeveloperLayout breadcrumbs={breadcrumbs} toc={toc}>
      <div className="space-y-10">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-md bg-[#EDF5F0] border border-[#234E39]/20 px-2 py-0.5 text-xs font-mono font-medium text-[#234E39]">
              Integrations
            </span>
            <span className="text-xs text-[#787A80]">Multi-Agent Graphs</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#18191B] sm:text-4xl">
            LangGraph Multi-Agent Security
          </h1>
          <p className="mt-3 text-base text-[#56585D] leading-relaxed">
            Protect stateful LangGraph workflows with <code className="text-[#234E39] font-mono text-sm">SecureGraphNode</code>. Enforce node-level permissions, correlate task traces, and implement human-in-the-loop state branching.
          </p>
        </div>

        {/* Section: Overview */}
        <section id="overview" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Overview &amp; Multi-Agent State
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            In complex LangGraph graphs, individual nodes frequently represent different specialized agents (e.g. researcher, summarizer, executor). <code className="text-[#234E39] font-mono">SecureGraphNode</code> guarantees that each node only executes within its authorized security boundary.
          </p>
          <CodeBlock code={installCode} language="bash" filename="Terminal" />
        </section>

        {/* Section: SecureGraphNode */}
        <section id="secure-node" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            SecureGraphNode Implementation
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Wrap standard LangGraph node functions. The node intercepts execution and injects cryptographic trace IDs and status markers:
          </p>
          <CodeBlock code={langGraphCode} language="python" filename="langgraph_node_demo.py" />
        </section>

        {/* Section: Decorator */}
        <section id="decorator" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Using @secure_langgraph_node Decorator
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Use the convenience decorator for clean, declarative node registration:
          </p>
          <CodeBlock code={decoratorCode} language="python" filename="decorator_demo.py" />
        </section>

        {/* Section: Multi-Agent Delegation State Propagation */}
        <section id="delegation-graph" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Multi-Agent Delegation State Propagation
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            In supervisor-worker LangGraph architectures, the supervisor issues a delegation token that flows through graph state. <code className="text-[#234E39] font-mono">SecureGraphNode</code> inspects <code className="text-[#234E39] font-mono">_delegation_token</code> in the incoming state to enforce mathematical capability intersection:
          </p>
          <CodeBlock code={delegationGraphCode} language="python" filename="langgraph_delegation_flow.py" />
        </section>

        {/* Section: Approval Branching */}
        <section id="approval-branching" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Human-in-the-Loop State Branching
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            Unlike simple script execution where approvals crash or block synchronously, LangGraph workflows require state preservation. When a node triggers <code className="text-[#8D5B18] font-mono">require_approval</code>, <code className="text-[#234E39] font-mono">SecureGraphNode</code> returns a branched state dictionary rather than raising an unhandled exception:
          </p>
          <CodeBlock code={branchingCode} language="python" filename="branching_flow.py" />

          <Callout type="tip" title="LangGraph Conditional Routing">
            <p className="text-xs leading-relaxed">
              You can connect conditional edges in your LangGraph <code className="font-mono text-[#234E39]">StateGraph</code> using <code className="font-mono text-[#56585D]">state[&quot;_sictack_status&quot;]</code> (or legacy <code className="font-mono text-[#56585D]">state[&quot;_intentlock_status&quot;]</code>) to route pending actions directly to a human notification or review queue.
            </p>
          </Callout>
        </section>

        {/* Section: Fail-Closed */}
        <section id="fail-closed" className="scroll-mt-20 space-y-4">
          <h2 className="text-xl font-bold tracking-tight text-[#18191B] border-b border-[#E2E0D8] pb-2">
            Fail-Closed Configuration
          </h2>
          <p className="text-sm text-[#56585D] leading-relaxed">
            By default, <code className="text-[#234E39] font-mono">fail_closed=True</code> raises a <code className="text-[#943425] font-mono">PermissionDeniedError</code> when a prohibited tool is requested. If you prefer to handle denials as a state branch, configure <code className="text-[#18191B] font-mono">fail_closed=False</code> to return <code className="text-[#18191B] font-mono">_sictack_status = &quot;DENIED&quot;</code> in the output state.
          </p>
        </section>

        {/* Navigation */}
        <PreviousNextNavigation
          prev={{ title: "LangChain Integration", href: "/developers/integrations/langchain" }}
          next={{ title: "Model Context Protocol", href: "/developers/integrations/mcp" }}
        />
      </div>
    </DeveloperLayout>
  );
}
