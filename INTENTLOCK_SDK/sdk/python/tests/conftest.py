"""Shared pytest fixtures for INTENTLOCK SDK tests."""

import pytest
import sys
from pathlib import Path

# Ensure src/ is on sys.path
src_dir = str(Path(__file__).parent.parent / "src")
if src_dir not in sys.path:
    sys.path.insert(0, src_dir)

from intentlock.models import Policy, ToolCall, Config, RiskLevel
from intentlock.registry import ToolRegistry
from intentlock.policy_engine import PolicyEngine
from intentlock.risk_engine import RiskEngine
from intentlock.approval import ApprovalService
from intentlock.audit import AuditService
from intentlock.gateway import ActionGateway
from intentlock.agent import SecureAgent


# Mock tool callables
def mock_read_email(folder: str = "inbox", limit: int = 10) -> list[dict]:
    return [{"id": "1", "subject": "Test", "body": "Hello World"}]


def mock_summarize_email(email_id: str = "1") -> str:
    return "Summary of email 1: All tasks completed."


def mock_delete_email(email_id: str) -> dict:
    return {"status": "deleted", "id": email_id}


def mock_export_user_data(format: str = "json") -> dict:
    return {"format": format, "data": "CONFIDENTIAL_EXPORT"}


@pytest.fixture
def sample_policy() -> Policy:
    return Policy(
        policy_id="email-agent-policy",
        allowed_permissions=["read_email", "summarize_email"],
        denied_permissions=["delete_email"],
        require_approval_permissions=["export_user_data"],
        max_risk_level=RiskLevel.HIGH,
        allowed_resources=["inbox/*", "reports/*"],
        allowed_recipients=["admin@company.com", "user@company.com"],
        max_sensitivity=8,
        description="Test policy for email assistant agent"
    )


@pytest.fixture
def sample_config(sample_policy: Policy) -> Config:
    return Config(
        default_policy=sample_policy,
        fail_closed=True,
        approval_timeout_seconds=300,
        audit_enabled=True,
    )


@pytest.fixture
def registry() -> ToolRegistry:
    reg = ToolRegistry()
    reg.register(
        name="read_email",
        handler=mock_read_email,
        permission="read_email",
        description="Reads emails from a folder",
        sensitivity=2
    )
    reg.register(
        name="summarize_email",
        handler=mock_summarize_email,
        permission="summarize_email",
        description="Summarizes an email",
        sensitivity=2
    )
    reg.register(
        name="delete_email",
        handler=mock_delete_email,
        permission="delete_email",
        description="Permanently deletes an email",
        sensitivity=8
    )
    reg.register(
        name="export_user_data",
        handler=mock_export_user_data,
        permission="export_user_data",
        description="Exports user data",
        sensitivity=9
    )
    return reg


@pytest.fixture
def policy_engine() -> PolicyEngine:
    return PolicyEngine()


@pytest.fixture
def risk_engine() -> RiskEngine:
    return RiskEngine()


@pytest.fixture
def approval_service() -> ApprovalService:
    return ApprovalService(timeout_seconds=300)


@pytest.fixture
def audit_service() -> AuditService:
    service = AuditService(enabled=True)
    service.clear()
    return service


@pytest.fixture
def gateway(
    registry: ToolRegistry,
    policy_engine: PolicyEngine,
    risk_engine: RiskEngine,
    approval_service: ApprovalService,
    audit_service: AuditService,
    sample_config: Config,
) -> ActionGateway:
    return ActionGateway(
        registry=registry,
        policy_engine=policy_engine,
        risk_engine=risk_engine,
        approval_service=approval_service,
        audit_service=audit_service,
        config=sample_config,
    )


@pytest.fixture
def agent(sample_config: Config) -> SecureAgent:
    agt = SecureAgent(
        agent_id="test-agent",
        config=sample_config,
    )
    # Register mock tools
    agt.register_tool(
        name="read_email",
        handler=mock_read_email,
        permission="read_email"
    )
    agt.register_tool(
        name="summarize_email",
        handler=mock_summarize_email,
        permission="summarize_email"
    )
    agt.register_tool(
        name="delete_email",
        handler=mock_delete_email,
        permission="delete_email"
    )
    agt.register_tool(
        name="export_user_data",
        handler=mock_export_user_data,
        permission="export_user_data"
    )
    return agt

