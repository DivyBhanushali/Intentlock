"""
INTENTLOCK 2.0 — LangGraph Integration Tests
Verifies secure graph nodes, state propagation, human approval branching, and permission enforcement.
"""

import pytest
from intentlock.agent import SecureAgent
from intentlock.integrations.langgraph import SecureGraphNode, secure_langgraph_node
from intentlock.exceptions import PermissionDeniedError, ApprovalRequiredError
from intentlock.models import Policy, Config, RiskLevel


@pytest.fixture
def agent_with_graph_policy():
    policy = Policy(
        name="langgraph-policy",
        allowed_permissions=["node:research", "node:summarize"],
        denied_permissions=["node:deploy_prod"],
        require_approval_permissions=["node:financial_transfer"],
        max_risk_level=RiskLevel.HIGH,
        max_sensitivity=8,
    )
    config = Config(default_policy=policy)
    return SecureAgent(agent_id="test-langgraph-agent", config=config)


def test_secure_langgraph_node_execution_allowed(agent_with_graph_policy):
    def research_node(state):
        return {"summary": f"Researched topic: {state.get('topic')}"}

    node = SecureGraphNode(
        name="research_tool",
        func=research_node,
        agent=agent_with_graph_policy,
        permission="node:research",
    )

    state = {"topic": "AI Security", "intent_id": "int_graph_01"}
    out = node(state)

    assert out["summary"] == "Researched topic: AI Security"
    assert out["_intentlock_status"] == "APPROVED"
    assert out["intent_id"] == "int_graph_01"
    assert "trace_id" in out


def test_secure_langgraph_node_permission_denied(agent_with_graph_policy):
    def deploy_node(state):
        return {"status": "deployed"}

    node = SecureGraphNode(
        name="deploy_tool",
        func=deploy_node,
        agent=agent_with_graph_policy,
        permission="node:deploy_prod",
        fail_closed=True,
    )

    state = {"environment": "production"}
    with pytest.raises(PermissionDeniedError):
        node(state)


def test_secure_langgraph_node_human_approval_branching(agent_with_graph_policy):
    def transfer_node(state):
        return {"transferred": True}

    node = SecureGraphNode(
        name="transfer_tool",
        func=transfer_node,
        agent=agent_with_graph_policy,
        permission="node:financial_transfer",
        fail_closed=True,
    )

    state = {"amount": 50000, "currency": "USD"}
    out = node(state)

    # In LangGraph workflow, human-in-the-loop returns state branch rather than crashing
    assert out["_intentlock_status"] == "REQUIRE_APPROVAL"
    assert out["_pending_node"] == "transfer_tool"
    assert out["_approval_id"] is not None


def test_secure_langgraph_node_decorator(agent_with_graph_policy):
    @secure_langgraph_node(
        name="summarize_tool",
        agent=agent_with_graph_policy,
        permission="node:summarize",
    )
    def summarize_node(state):
        return {"result": "Executive Summary"}

    state = {"input": "Raw Document Data"}
    out = summarize_node(state)

    assert out["result"] == "Executive Summary"
    assert out["_intentlock_status"] == "APPROVED"
