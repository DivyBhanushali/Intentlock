"""
INTENTLOCK 2.0 – Intent Authorization Context Unit Tests.
Tests task-scoped intent authorization, expiration, revocation,
scope confinement, agent binding, and deterministic fail-closed evaluation.
"""

from datetime import datetime, timezone, timedelta
import pytest

from intentlock.models import (
    DecisionVerdict,
    IntentContext,
    Policy,
    ToolCall,
)
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry


@pytest.fixture
def registry():
    reg = ToolRegistry()
    reg.register(
        name="read_sales_report",
        handler=lambda **kw: "sales data",
        permission="database:read",
        sensitivity=3,
    )
    reg.register(
        name="drop_sales_table",
        handler=lambda **kw: "dropped",
        permission="database:drop",
        sensitivity=9,
    )
    reg.register(
        name="send_summary_email",
        handler=lambda **kw: "sent",
        permission="email:send",
        sensitivity=2,
    )
    return reg


@pytest.fixture
def broad_policy():
    return Policy(
        policy_id="pol-enterprise-broad",
        allowed_permissions=["database:read", "database:drop", "email:send"],
        allowed_resources=["sales/*", "reports/*"],
        allowed_recipients=["*@company.com"],
        max_sensitivity=10,
        description="Broad organizational policy (delegated authority)",
    )


@pytest.fixture
def engine():
    return PolicyEngine()


def test_intent_context_valid_within_scope_allows(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_sales_analysis_01",
        org_id="org_acme",
        user_id="usr_manager_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Analyze Q3 sales performance",
        allowed_actions=["read_sales_report"],
        allowed_resources=["sales/q3/*"],
        sensitivity_ceiling=5,
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=2),
    )

    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="finance_bot_alpha",
        resource_id="sales/q3/october.csv",
        sensitivity=3,
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.ALLOW
    assert decision.reason == "POLICY_MATCH"
    assert decision.intent_id == "itc_sales_analysis_01"


def test_intent_context_explicit_denial_overrides_policy(registry, broad_policy, engine):
    # Even though broad_policy allows "database:drop", the task-scoped intent explicitly denies it
    intent = IntentContext(
        intent_id="itc_sales_analysis_02",
        org_id="org_acme",
        user_id="usr_manager_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Read-only analysis",
        allowed_actions=["read_sales_report"],
        denied_actions=["drop_sales_table", "database:drop"],
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    tc = ToolCall(
        tool_name="drop_sales_table",
        agent_id="finance_bot_alpha",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_ACTION_DENIED"


def test_intent_context_unauthorized_action_denied(registry, broad_policy, engine):
    # Action not in allowed_actions
    intent = IntentContext(
        intent_id="itc_sales_analysis_03",
        org_id="org_acme",
        user_id="usr_manager_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Analyze sales only",
        allowed_actions=["read_sales_report"],
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    tc = ToolCall(
        tool_name="send_summary_email",
        agent_id="finance_bot_alpha",
        recipient="ceo@company.com",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_ACTION_NOT_PERMITTED"


def test_intent_context_expired_fails_closed(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_expired",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Expired task",
        allowed_actions=["read_sales_report"],
        expiration_timestamp=datetime.now(timezone.utc) - timedelta(seconds=10),
    )

    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="finance_bot_alpha",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_EXPIRED"


def test_intent_context_revoked_fails_closed(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_revoked",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Revoked task",
        allowed_actions=["read_sales_report"],
        context_status="REVOKED",
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="finance_bot_alpha",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_REVOKED"


def test_intent_context_agent_mismatch_denied(registry, broad_policy, engine):
    # Context was authorized for "finance_bot_alpha", but invoked by "malicious_bot_beta"
    intent = IntentContext(
        intent_id="itc_agent_binding",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Scoped to Alpha only",
        allowed_actions=["read_sales_report"],
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="malicious_bot_beta",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_AGENT_MISMATCH"


def test_intent_context_resource_out_of_scope_denied(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_scope",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Read sales only",
        allowed_actions=["read_sales_report"],
        allowed_resources=["sales/public/*"],
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    # Attempting to read confidential salaries
    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="finance_bot_alpha",
        resource_id="sales/confidential/salaries.csv",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_RESOURCE_OUT_OF_SCOPE"


def test_intent_context_recipient_out_of_scope_denied(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_recipients",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Email internal team",
        allowed_actions=["send_summary_email"],
        allowed_recipients=["*@internal-sales.company.com"],
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    # Sending to general address outside strict intent recipient boundary
    tc = ToolCall(
        tool_name="send_summary_email",
        agent_id="finance_bot_alpha",
        recipient="external-auditor@thirdparty.com",
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_RECIPIENT_NOT_ALLOWED"


def test_intent_context_sensitivity_exceeded_denied(registry, broad_policy, engine):
    intent = IntentContext(
        intent_id="itc_sensitivity",
        org_id="org_acme",
        user_id="usr_alice",
        agent_id="finance_bot_alpha",
        authorized_objective="Low sensitivity task",
        allowed_actions=["read_sales_report"],
        sensitivity_ceiling=2,  # Ceiling is 2, but tool sensitivity is 3
        expiration_timestamp=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    tc = ToolCall(
        tool_name="read_sales_report",
        agent_id="finance_bot_alpha",
        sensitivity=3,
        intent_id=intent.intent_id,
    )

    decision = engine.evaluate(tc, broad_policy, registry, intent_context=intent)
    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "INTENT_SENSITIVITY_EXCEEDED"

