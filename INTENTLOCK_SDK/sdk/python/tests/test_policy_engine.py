"""Security-critical unit tests for INTENTLOCK PolicyEngine."""

import pytest
from intentlock.models import Policy, ToolCall, DecisionVerdict
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry


def test_allow_permitted_action(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="read_email", arguments={"folder": "inbox"})
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.ALLOW
    assert decision.reason == "POLICY_MATCH"
    assert decision.tool_name == "read_email"


def test_deny_missing_policy(policy_engine: PolicyEngine, registry: ToolRegistry):
    tc = ToolCall(tool_name="read_email")
    decision = policy_engine.evaluate(tc, None, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "POLICY_MISSING"


def test_deny_unregistered_tool(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="unregistered_tool")
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "TOOL_NOT_REGISTERED"


def test_deny_explicit_denied_permission(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="delete_email", arguments={"email_id": "123"})
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "PERMISSION_DENIED"


def test_deny_permission_not_granted_deny_by_default(policy_engine: PolicyEngine, registry: ToolRegistry):
    # Empty policy allows nothing
    empty_policy = Policy(policy_id="empty-policy", allowed_permissions=[])
    tc = ToolCall(tool_name="read_email")
    decision = policy_engine.evaluate(tc, empty_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "PERMISSION_NOT_GRANTED"


def test_require_approval(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="export_user_data", arguments={"format": "json"})
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.REQUIRE_APPROVAL
    assert decision.reason == "APPROVAL_REQUIRED"


def test_deny_sensitivity_too_high(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    # Max sensitivity in sample_policy is 8. Action sensitivity is 9.
    tc = ToolCall(tool_name="read_email", sensitivity=9)
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "SENSITIVITY_TOO_HIGH"


def test_deny_recipient_not_allowed(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="read_email", recipient="attacker@evil.com")
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "RECIPIENT_NOT_ALLOWED"


def test_allow_recipient_in_allowlist(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="read_email", recipient="admin@company.com")
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.ALLOW


def test_deny_resource_out_of_scope(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="read_email", resource_id="secrets/passwords.txt")
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "RESOURCE_OUT_OF_SCOPE"


def test_allow_resource_glob_match(policy_engine: PolicyEngine, registry: ToolRegistry, sample_policy: Policy):
    tc = ToolCall(tool_name="read_email", resource_id="inbox/unread/msg1.eml")
    decision = policy_engine.evaluate(tc, sample_policy, registry)

    assert decision.verdict == DecisionVerdict.ALLOW


def test_denied_takes_precedence_over_allowed(policy_engine: PolicyEngine, registry: ToolRegistry):
    # If permission is present in BOTH allowed and denied, DENY must win!
    conflicting_policy = Policy(
        policy_id="conflict-policy",
        allowed_permissions=["read_email"],
        denied_permissions=["read_email"]
    )
    tc = ToolCall(tool_name="read_email")
    decision = policy_engine.evaluate(tc, conflicting_policy, registry)

    assert decision.verdict == DecisionVerdict.DENY
    assert decision.reason == "PERMISSION_DENIED"

