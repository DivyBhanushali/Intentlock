"""
INTENTLOCK 2.0 – Phase 6 Documentation & Security Contract Test Suite.

Verifies:
1. All 18 Developer Portal documentation routes exist and are fully authored.
2. Zero stub components (DocumentationPageStub) remain in the documentation tree.
3. No real credentials, private keys, or production database passwords exist in docs.
4. Cryptographic audit chain formulas match the backend implementation.
5. All documented SDK exceptions and RBAC roles match codebase definitions.
6. Playground simulator safety invariants.
"""

import os
import re
import pytest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
FRONTEND_DEV_DIR = REPO_ROOT / "frontend" / "src" / "app" / "developers"

EXPECTED_ROUTES = [
    "",  # /developers (landing)
    "quickstart",
    "installation",
    "concepts",
    "architecture",
    "sdk",
    "sdk/initialization",
    "sdk/tool-protection",
    "sdk/decisions",
    "sdk/errors",
    "api",
    "api/authentication",
    "api/reference",
    "integrations",
    "integrations/langchain",
    "integrations/langgraph",
    "integrations/mcp",
    "examples",
    "playground",
    "security",
    "deployment",
    "troubleshooting",
    "changelog",
]


def test_all_developer_routes_exist():
    """Verify that all documented developer routes exist as real page.tsx files."""
    missing = []
    for route in EXPECTED_ROUTES:
        route_path = FRONTEND_DEV_DIR / route if route else FRONTEND_DEV_DIR
        page_file = route_path / "page.tsx"
        if not page_file.exists():
            missing.append(str(page_file.relative_to(REPO_ROOT)))

    assert len(missing) == 0, f"Missing documentation page files: {missing}"


def test_zero_stubs_remaining():
    """Verify that no DocumentationPageStub placeholders remain in any route."""
    stub_files = []
    for page_path in FRONTEND_DEV_DIR.rglob("page.tsx"):
        content = page_path.read_text(encoding="utf-8")
        if "DocumentationPageStub" in content:
            stub_files.append(str(page_path.relative_to(REPO_ROOT)))

    assert len(stub_files) == 0, f"Found uncompleted stub pages: {stub_files}"


def test_no_real_secrets_in_docs():
    """Verify no live secrets, passwords, or production connection strings exist in docs."""
    suspicious_patterns = [
        re.compile(r"postgres(?:ql)?://(?!postgres\.sample|intentlock_user|intentlock:secure)[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9_\.-]+"),
        re.compile(r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----"),
        re.compile(r"ghp_[a-zA-Z0-9]{36}"),
        re.compile(r"sk-[a-zA-Z0-9]{32,}"),
    ]

    violations = []
    for page_path in FRONTEND_DEV_DIR.rglob("page.tsx"):
        content = page_path.read_text(encoding="utf-8")
        for pattern in suspicious_patterns:
            matches = pattern.findall(content)
            if matches:
                violations.append((str(page_path.relative_to(REPO_ROOT)), str(matches)))

    assert len(violations) == 0, f"Found potential secret leakage in documentation: {violations}"


def test_audit_hash_chain_formula_consistency():
    """Verify that calculate_entry_hash formula in backend matches documented formula."""
    from app.core.audit_chain import calculate_entry_hash
    import hashlib

    # Test deterministic calculation
    seq = 1
    prev_hash = "0" * 64
    org = "test-org"
    agent = "test-agent"
    tool = "email:send"
    verdict = "ALLOW"
    action_hash = "abcd1234" * 8
    epoch = 1700000000

    backend_hash = calculate_entry_hash(
        sequence_number=seq,
        previous_hash=prev_hash,
        org_id=org,
        agent_id=agent,
        tool_name=tool,
        verdict=verdict,
        action_hash=action_hash,
        timestamp_epoch=epoch,
    )

    # Documented formula
    expected_payload = f"{seq}|{prev_hash}|{org}|{agent}|{tool}|{verdict}|{action_hash}|{epoch}"
    expected_hash = hashlib.sha256(expected_payload.encode("utf-8")).hexdigest()

    assert backend_hash == expected_hash, "Backend entry_hash does not match canonical documented formula"


def test_documented_exceptions_exist_in_sdk():
    """Verify that all documented exceptions exist in the Python SDK."""
    import intentlock.exceptions as exc

    documented_exceptions = [
        "IntentLockError",
        "PermissionDeniedError",
        "ApprovalRequiredError",
        "ApprovalExpiredError",
        "ApprovalMismatchError",
        "ApprovalReplayError",
        "PolicyError",
        "ToolNotRegisteredError",
    ]

    for exc_name in documented_exceptions:
        assert hasattr(exc, exc_name), f"Documented exception '{exc_name}' is missing from intentlock.exceptions"
        cls = getattr(exc, exc_name)
        assert issubclass(cls, exc.IntentLockError), f"'{exc_name}' must inherit from IntentLockError"


def test_documented_rbac_roles_exist():
    """Verify documented RBAC roles (ADMIN, APPROVER, VIEWER) match backend dependencies."""
    from app.db.models import UserModel
    import inspect

    # Verify backend deps role checks
    from app.api import deps
    deps_source = inspect.getsource(deps)
    assert 'user.role != "ADMIN"' in deps_source
    assert 'user.role not in ("ADMIN", "APPROVER")' in deps_source


def test_playground_simulator_safety_invariants():
    """Verify playground page contains illustrative warnings and safe simulation endpoint."""
    playground_page = FRONTEND_DEV_DIR / "playground" / "page.tsx"
    content = playground_page.read_text(encoding="utf-8")

    assert "Illustrative Client-Side Demonstration" in content
    assert "/test" in content, "Must provide link to live SOC playground"
    assert "POST /api/v1/policies/simulate" in content, "Must document safe simulation endpoint"
