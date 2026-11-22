"""
SICTACK API Contract Regression Protection Test Suite.

Validates:
1. InterceptRequest and InterceptResponse explicit field declarations.
2. AST-level verification that backend route handlers never access undeclared request attributes.
3. Pydantic v2 serialization/deserialization retention for session_id, agent_id, approval_token, nonce.
4. SDK-to-backend payload serialization compatibility.
5. Canonical 'sictack' and legacy 'intentlock' import parity and class identity.
6. Real FastAPI HTTP boundary contract retention.
"""

import ast
import inspect
import uuid
import pytest
from pydantic import BaseModel
from fastapi.testclient import TestClient

from app.main import app
from app.api.deps import get_db, TenantContext
from app.schemas.schemas import InterceptRequest, InterceptResponse, PolicyCreate
from app.api.v1.policies import create_policy
from app.api.v1.agents import register_agent
from app.schemas.schemas import AgentCreate
from app.core.security import hash_api_key
from app.db.models import OrganizationModel, ApiKeyModel, PolicyModel, AgentModel, SentinelTaskSessionModel

# SDK imports
import sictack
from sictack.models import (
    ToolCall,
    Decision,
    DecisionVerdict,
    RiskLevel,
    ApprovalStatus,
    Policy,
)
from sictack import Sictack, SictackClient, SictackError
import intentlock
from intentlock import IntentLock, IntentLockClient, IntentLockError
from intentlock.models import ToolCall as LegacyToolCall, DecisionVerdict as LegacyVerdict


# ─────────────────────────────────────────────────────────────────────────────
# 1. Pydantic Schema Declarations & AST Route-Handler Invariants
# ─────────────────────────────────────────────────────────────────────────────

def test_intercept_request_declares_critical_security_fields():
    """Verify that InterceptRequest explicitly declares all security-sensitive fields."""
    fields = InterceptRequest.model_fields
    expected_fields = {
        "agent_id",
        "tool_name",
        "arguments",
        "user_request",
        "sensitivity",
        "resource_id",
        "recipient",
        "approval_id",
        "intent_id",
        "trace_id",
        "session_id",
        "approval_token",
        "nonce",
    }
    missing = expected_fields - set(fields.keys())
    assert not missing, f"CONTRACT REGRESSION: InterceptRequest is missing critical fields: {missing}"


def test_intercept_response_declares_critical_security_fields():
    """Verify that InterceptResponse explicitly declares all required evaluation and telemetry fields."""
    fields = InterceptResponse.model_fields
    expected_fields = {
        "verdict",
        "allowed",
        "reason",
        "decision_id",
        "action_hash",
        "risk_score",
        "risk_level",
        "policy_id",
        "requires_approval",
        "approval_id",
        "intent_id",
        "session_id",
        "trace_id",
        "policy_version",
    }
    missing = expected_fields - set(fields.keys())
    assert not missing, f"CONTRACT REGRESSION: InterceptResponse is missing fields: {missing}"


def test_route_handler_ast_zero_undeclared_request_attribute_access():
    """
    AST Security Check: Parses intercept.py and statically verifies that every
    attribute accessed on 'request.<attr>' is explicitly declared in InterceptRequest.model_fields.
    Prevents recurrence of the Run 9 AttributeError on request.session_id.
    """
    from app.api.v1 import intercept
    source = inspect.getsource(intercept.intercept_tool_call)
    tree = ast.parse(source)

    accessed_attributes = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Attribute) and isinstance(node.value, ast.Name) and node.value.id == "request":
            accessed_attributes.add(node.attr)

    declared_fields = set(InterceptRequest.model_fields.keys())
    undeclared_access = accessed_attributes - declared_fields
    assert not undeclared_access, (
        f"CRITICAL DRIFT: intercept_tool_call accesses undeclared InterceptRequest attributes: {undeclared_access}!"
    )


def test_pydantic_roundtrip_preserves_security_identifiers():
    """Verify deserialization and serialization preserve security fields without silent stripping."""
    payload = {
        "agent_id": "test-agent-ast",
        "tool_name": "execute_query",
        "arguments": {"sql": "SELECT 1"},
        "session_id": "sess_pydantic_verify_12345",
        "approval_token": "appr_tok_67890",
        "nonce": "nonce_abcde_999",
        "intent_id": "intent_scope_001",
        "trace_id": "trace_corr_999",
    }
    req = InterceptRequest.model_validate(payload)
    assert req.session_id == "sess_pydantic_verify_12345"
    assert req.approval_token == "appr_tok_67890"
    assert req.nonce == "nonce_abcde_999"
    assert req.intent_id == "intent_scope_001"
    assert req.trace_id == "trace_corr_999"

    dumped = req.model_dump()
    assert dumped["session_id"] == "sess_pydantic_verify_12345"
    assert dumped["approval_token"] == "appr_tok_67890"
    assert dumped["nonce"] == "nonce_abcde_999"


# ─────────────────────────────────────────────────────────────────────────────
# 2. SDK-to-Backend Serialization Parity & Identity Verification
# ─────────────────────────────────────────────────────────────────────────────

def test_sdk_toolcall_serializes_to_compatible_intercept_request():
    """Verify that SDK ToolCall objects serialize to valid InterceptRequest schemas."""
    tc = ToolCall(
        tool_name="read_customer_record",
        arguments={"customer_id": "cust_42"},
        agent_id="agent-sdk-parity",
        sensitivity=3,
        resource_id="records/cust_42",
        recipient="support@company.com",
    )
    # Convert SDK tool call to gateway payload
    wire_payload = {
        "agent_id": tc.agent_id,
        "tool_name": tc.tool_name,
        "arguments": tc.arguments,
        "sensitivity": tc.sensitivity,
        "resource_id": tc.resource_id,
        "recipient": tc.recipient,
        "session_id": "sess_wire_123",
    }
    gateway_req = InterceptRequest.model_validate(wire_payload)
    assert gateway_req.agent_id == tc.agent_id
    assert gateway_req.tool_name == tc.tool_name
    assert gateway_req.arguments == tc.arguments
    assert gateway_req.session_id == "sess_wire_123"


def test_canonical_and_legacy_sdk_imports_identity():
    """Verify that 'sictack' and 'intentlock' imports reference identical in-memory classes."""
    # Class identity
    assert Sictack is IntentLock, "Sictack and IntentLock must be identical classes"
    assert SictackClient is IntentLockClient, "SictackClient and IntentLockClient must be identical"
    assert issubclass(IntentLockError, SictackError) or IntentLockError is SictackError

    # Models identity
    assert ToolCall is LegacyToolCall, "ToolCall must be shared between sictack and intentlock"
    assert DecisionVerdict is LegacyVerdict, "DecisionVerdict must be shared"
    assert DecisionVerdict.ALLOW.value == "ALLOW"
    assert DecisionVerdict.DENY.value == "DENY"
    assert DecisionVerdict.REQUIRE_APPROVAL.value == "REQUIRE_APPROVAL"


# ─────────────────────────────────────────────────────────────────────────────
# 3. FastAPI HTTP Boundary Contract Verification
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def http_client(db):
    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


def test_fastapi_http_boundary_preserves_session_id_and_security_fields(db, http_client):
    """
    Live HTTP Test: Confirms that FastAPI parses JSON over HTTP wire,
    preserves session_id and security attributes, and passes them to route handler.
    """
    org_id = f"org_contract_{uuid.uuid4().hex[:8]}"
    agent_id = f"agent_contract_{uuid.uuid4().hex[:8]}"
    sess_id = f"sess_contract_{uuid.uuid4().hex[:8]}"
    raw_key = f"sck_live_contract_{uuid.uuid4().hex}"

    db.merge(OrganizationModel(id=org_id, name="Contract Org", slug=f"slug-{org_id}", status="ACTIVE"))
    db.merge(ApiKeyModel(id=f"key_{uuid.uuid4().hex[:10]}", org_id=org_id, name="Contract Key", key_prefix=raw_key[:12], key_hash=hash_api_key(raw_key), is_active=True))
    pol = PolicyModel(id=f"pol_{uuid.uuid4().hex[:10]}", org_id=org_id, name="Contract Policy", allowed_permissions=["query_tool"], max_risk_level="HIGH", version=1)
    db.merge(pol)
    db.merge(AgentModel(id=agent_id, org_id=org_id, name="Contract Agent", policy_id=pol.id, status="ACTIVE"))
    db.merge(SentinelTaskSessionModel(id=sess_id, org_id=org_id, agent_id=agent_id, task_objective="Contract Test Objective", session_state="ACTIVE", authorized_scope={"enforce_strict_scope": False, "allowed_tools": ["query_tool"]}))
    db.commit()

    payload = {
        "agent_id": agent_id,
        "tool_name": "query_tool",
        "arguments": {"param": "val"},
        "session_id": sess_id,
        "nonce": "nonce_boundary_test_001",
    }
    resp = http_client.post("/api/v1/intercept", json=payload, headers={"X-API-Key": raw_key})
    assert resp.status_code == 200
    data = resp.json()
    assert data["verdict"] == "ALLOW"
    assert data["allowed"] is True
    assert data["session_id"] == sess_id
    assert "decision_id" in data
    assert "action_hash" in data
    assert data["risk_score"] is not None
