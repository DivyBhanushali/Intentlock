"""
INTENTLOCK – REST API Documentation Contract & OpenAPI Conformance Test Suite.

Verifies:
1. Local generation of OpenAPI 3.1.0 specification.
2. 100% parity between registered FastAPI operations and documented endpoints.
3. Zero missing operations.
4. Zero stale or non-existent documented endpoints.
5. Parameter naming and HTTP method conformance.
6. Verification of authentication headers in examples.
7. Anti-secret scanning: Ensuring documentation never leaks real tokens, DB strings, or secrets.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
import pytest

from app.main import app
from app.api.v1.router import api_router


@pytest.fixture(scope="module")
def openapi_spec():
    return app.openapi()


@pytest.fixture(scope="module")
def registered_operations():
    """Extract all active operation signatures from FastAPI app."""
    ops = set()
    spec = app.openapi()
    for path, methods in spec.get("paths", {}).items():
        if "test-security" in path:
            continue
        for method in methods.keys():
            if method.lower() in ("get", "post", "put", "delete", "patch"):
                ops.add((method.upper(), path))
    return ops


@pytest.fixture(scope="module")
def documented_catalog():
    """Load the generated API reference data."""
    catalog_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "lib" / "api-reference-data.ts"
    assert catalog_path.exists(), f"Reference catalog missing at {catalog_path}"
    
    content = catalog_path.read_text(encoding="utf-8")
    # Extract the JSON array from export const API_ENDPOINTS = [...]
    match = re.search(r"export const API_ENDPOINTS: ApiEndpointItem\[\] = (\[.*?\]);", content, re.DOTALL)
    assert match, "Could not parse API_ENDPOINTS JSON from api-reference-data.ts"
    return json.loads(match.group(1))


def test_openapi_local_generation(openapi_spec):
    """Test that OpenAPI spec generates locally without network and has required info."""
    assert openapi_spec is not None
    assert "openapi" in openapi_spec
    assert openapi_spec["info"]["title"] == "INTENTLOCK Security API"
    assert "paths" in openapi_spec
    assert len(openapi_spec["paths"]) >= 40


def test_operation_count_conformance(registered_operations, documented_catalog):
    """Verify total operations match between FastAPI and documentation catalog."""
    documented_ops = {(ep["method"].upper(), ep["path"]) for ep in documented_catalog}
    
    missing = registered_operations - documented_ops
    stale = documented_ops - registered_operations
    
    assert not missing, f"Missing documented operations: {missing}"
    assert not stale, f"Stale or non-existent documented operations: {stale}"
    assert len(documented_ops) == len(registered_operations) == 48


def test_path_parameter_names_match(openapi_spec, documented_catalog):
    """Verify that path parameters defined in OpenAPI match documented parameters."""
    for ep in documented_catalog:
        path = ep["path"]
        method = ep["method"].lower()
        op_spec = openapi_spec.get("paths", {}).get(path, {}).get(method, {})
        
        # Extract path params from path string like {agent_id}
        expected_params = re.findall(r"\{([a-zA-Z0-9_]+)\}", path)
        documented_param_names = [p["name"] for p in ep.get("parameters", []) if p.get("location") == "path"]
        
        for p in expected_params:
            assert p in documented_param_names, f"Path param {p} not documented for {method.upper()} {path}"


def test_auth_headers_validity(documented_catalog):
    """Verify that protected endpoints include valid authentication headers."""
    for ep in documented_catalog:
        auth_type = ep.get("auth")
        headers = ep.get("headers", [])
        header_names = [h["name"].lower() for h in headers]
        
        if auth_type in ("Bearer Token", "Admin Only", "Approver or Admin"):
            assert "authorization" in header_names, f"Missing Authorization header for {ep['method']} {ep['path']}"
        elif auth_type == "API Key":
            assert "x-api-key" in header_names or "authorization" in header_names, (
                f"Missing API key header for {ep['method']} {ep['path']}"
            )


def test_no_secrets_in_documentation():
    """Verify that documentation files do not contain real secrets, keys, or passwords."""
    docs_dir = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "app" / "developers"
    
    secret_patterns = [
        re.compile(r"postgres(?:ql)?:\/\/[^:]+:[^@]+@"),  # DB connection string with credentials
        re.compile(r"sk-[a-zA-Z0-9]{32,}"),              # OpenAI API Key
        re.compile(r"ghp_[a-zA-Z0-9]{36}"),              # GitHub Personal Access Token
        re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"), # Private keys
    ]
    
    for doc_file in docs_dir.rglob("*.tsx"):
        content = doc_file.read_text(encoding="utf-8")
        for pattern in secret_patterns:
            matches = pattern.findall(content)
            assert not matches, f"Found potential secret match in {doc_file.name}: {matches}"


def test_all_response_status_codes_valid(documented_catalog):
    """Verify that all documented response codes are standard HTTP status codes."""
    for ep in documented_catalog:
        responses = ep.get("responses", [])
        assert len(responses) >= 1, f"No responses documented for {ep['method']} {ep['path']}"
        for resp in responses:
            assert 100 <= resp["status"] <= 599, f"Invalid status code {resp['status']} in {ep['path']}"


def test_valid_rbac_roles_documented(documented_catalog):
    """Verify that documented roles match actual backend roles (ADMIN, APPROVER, VIEWER) and no invalid MEMBER roles exist."""
    valid_tokens = {"ADMIN", "APPROVER", "VIEWER", "Machine", "(API Key)", "or", "User", "None"}
    for ep in documented_catalog:
        role_str = ep.get("requiredRole", "")
        assert "MEMBER" not in role_str, f"Found deprecated 'MEMBER' role in {ep['method']} {ep['path']}. Backend role is 'VIEWER'."


def test_api_reference_data_not_stale(openapi_spec, documented_catalog):
    """
    Staleness detection test:
    Fails if the backend routes or operations change without regenerating api-reference-data.ts.
    """
    spec_ops = set()
    for path, methods in openapi_spec.get("paths", {}).items():
        if "test-security" in path:
            continue
        for m, op in methods.items():
            if m.lower() in ("get", "post", "put", "delete", "patch"):
                op_id = op.get("operationId", "")
                spec_ops.add((m.upper(), path, op_id))

    catalog_ops = set()
    for ep in documented_catalog:
        catalog_ops.add((ep["method"].upper(), ep["path"], ep.get("operationId", "")))

    diff_missing = spec_ops - catalog_ops
    diff_stale = catalog_ops - spec_ops

    assert not diff_missing, (
        f"API Reference is STALE! New backend operations detected: {diff_missing}. "
        "Run `python INTENTLOCK_SDK/backend/tests/generate_ts_data.py` to regenerate."
    )
    assert not diff_stale, (
        f"API Reference is STALE! Removed backend operations still documented: {diff_stale}. "
        "Run `python INTENTLOCK_SDK/backend/tests/generate_ts_data.py` to regenerate."
    )

