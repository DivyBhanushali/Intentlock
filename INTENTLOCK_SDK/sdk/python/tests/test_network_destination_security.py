"""
Comprehensive Network Destination Security Test Suite.

Verifies:
1. IPv4 and IPv6 canonicalization.
2. Ambiguous IP encodings (octal, hex, dword).
3. Loopback address blocking across representations.
4. Private IP and link-local address classification.
5. Cloud metadata endpoint protection (169.254.169.254).
6. Protocol and URI scheme restrictions (file, gopher, ftp, data).
7. URL user-info parsing and extraction.
8. CIDR range matching.
9. Domain wildcard matching.
10. Explicit deny precedence over allowed destinations.
"""

import pytest

from intentlock.exceptions import PermissionDeniedError
from intentlock.models import DecisionVerdict, Policy, SecurityMode, ToolCall
from intentlock.network import (
    canonicalize_destination,
    validate_network_destination,
)
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry


# ---------------------------------------------------------------------------
# 1. Ambiguous IP & Canonicalization Unit Tests
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "ambiguous_dest,expected_ip",
    [
        ("127.0.0.1", "127.0.0.1"),
        ("0177.0.0.1", "127.0.0.1"),           # Octal first octet
        ("0x7f000001", "127.0.0.1"),           # Hex integer
        ("2130706433", "127.0.0.1"),           # Dword integer
        ("[::1]", "::1"),                      # IPv6 loopback
        ("::1", "::1"),                        # Raw IPv6 loopback
        ("169.254.169.254", "169.254.169.254"),# AWS/GCP/Azure metadata
        ("0x0a000001", "10.0.0.1"),            # 10.0.0.1 hex
        ("012.0.0.1", "10.0.0.1"),             # 10.0.0.1 octal
    ],
)
def test_ambiguous_ip_normalization(ambiguous_dest: str, expected_ip: str):
    canon = canonicalize_destination(ambiguous_dest)
    assert canon.is_ip is True
    assert str(canon.ip) == expected_ip


def test_url_userinfo_and_scheme_extraction():
    url = "https://admin:secret_pass@api.internal.corp:8443/v1/metrics?view=all"
    canon = canonicalize_destination(url)
    assert canon.scheme == "https"
    assert canon.host == "api.internal.corp"
    assert canon.port == 8443
    assert canon.has_userinfo is True
    assert canon.is_dangerous_scheme is False


@pytest.mark.parametrize(
    "dangerous_uri,expected_scheme",
    [
        ("file:///etc/passwd", "file"),
        ("gopher://127.0.0.1:6379/_INFO", "gopher"),
        ("ftp://attacker.com/leak", "ftp"),
        ("data:text/html,<html>alert(1)</html>", "data"),
        ("javascript:alert(document.cookie)", "javascript"),
        ("ldap://127.0.0.1:389/cn=admin", "ldap"),
    ],
)
def test_dangerous_protocol_schemes_blocked(dangerous_uri: str, expected_scheme: str):
    canon = canonicalize_destination(dangerous_uri)
    assert canon.is_dangerous_scheme is True
    assert canon.scheme == expected_scheme

    ok, reason = validate_network_destination(
        destination=dangerous_uri,
        allowed_destinations=["*"],
        denied_destinations=[],
    )
    assert ok is False
    assert "DANGEROUS_URI_SCHEME_BLOCKED" in reason


# ---------------------------------------------------------------------------
# 2. Private, Loopback & Cloud Metadata Protection
# ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "loopback_vector",
    [
        "127.0.0.1",
        "127.0.0.2",
        "127.255.255.254",
        "0177.0.0.1",
        "0x7f000001",
        "2130706433",
        "localhost",
        "localhost.localdomain",
        "[::1]",
        "http://127.0.0.1:8000",
        "http://localhost:3000",
    ],
)
def test_loopback_blocking_across_encodings(loopback_vector: str):
    ok, reason = validate_network_destination(
        destination=loopback_vector,
        allowed_destinations=["*"],
        denied_destinations=["block:loopback"],
    )
    assert ok is False
    assert "Loopback addresses are blocked" in reason


@pytest.mark.parametrize(
    "metadata_vector",
    [
        "169.254.169.254",
        "http://169.254.169.254/latest/meta-data/",
        "http://169.254.170.2/v2/credentials",
        "http://[fd00:ec2::254]/latest/meta-data/",
    ],
)
def test_cloud_metadata_blocking(metadata_vector: str):
    ok, reason = validate_network_destination(
        destination=metadata_vector,
        allowed_destinations=["*"],
        denied_destinations=["block:metadata"],
    )
    assert ok is False
    assert "Cloud metadata" in reason


@pytest.mark.parametrize(
    "private_ip",
    [
        "10.0.0.1",
        "10.254.0.1",
        "172.16.0.1",
        "172.31.255.255",
        "192.168.1.1",
        "192.168.100.50",
    ],
)
def test_private_network_blocking(private_ip: str):
    ok, reason = validate_network_destination(
        destination=private_ip,
        allowed_destinations=["*"],
        denied_destinations=["block:private"],
    )
    assert ok is False
    assert "Private and loopback" in reason


# ---------------------------------------------------------------------------
# 3. CIDR Block & Wildcard Domain Validation in PolicyEngine
# ---------------------------------------------------------------------------

def test_policy_engine_cidr_and_wildcard_allowlist():
    engine = PolicyEngine()
    registry = ToolRegistry()
    registry.register(name="fetch_data", handler=lambda: None, permission="net:fetch")

    policy = Policy(
        allowed_permissions=["net:fetch"],
        network_destinations=["10.10.0.0/16", "*.safe.org", "api.internal.corp"],
    )

    # 1. Allowed in CIDR block
    tc1 = ToolCall(tool_name="fetch_data", network_destination="10.10.5.22")
    d1 = engine.evaluate(tc1, policy, registry)
    assert d1.verdict == DecisionVerdict.ALLOW

    # 2. Denied outside CIDR block
    tc2 = ToolCall(tool_name="fetch_data", network_destination="10.11.0.1")
    d2 = engine.evaluate(tc2, policy, registry)
    assert d2.verdict == DecisionVerdict.DENY
    assert d2.reason == "NETWORK_DESTINATION_NOT_PERMITTED"

    # 3. Allowed domain wildcard
    tc3 = ToolCall(tool_name="fetch_data", network_destination="sub.safe.org")
    d3 = engine.evaluate(tc3, policy, registry)
    assert d3.verdict == DecisionVerdict.ALLOW

    # 4. Denied domain outside wildcard
    tc4 = ToolCall(tool_name="fetch_data", network_destination="evil.com")
    d4 = engine.evaluate(tc4, policy, registry)
    assert d4.verdict == DecisionVerdict.DENY


def test_explicit_deny_destination_overrides_wildcard():
    engine = PolicyEngine()
    registry = ToolRegistry()
    registry.register(name="fetch_data", handler=lambda: None, permission="net:fetch")

    policy = Policy(
        allowed_permissions=["net:fetch"],
        network_destinations=["*.safe.org"],
        denied_network_destinations=["leak.safe.org", "127.0.0.0/8"],
    )

    # Allowed general wildcard
    tc_allowed = ToolCall(tool_name="fetch_data", network_destination="api.safe.org")
    d_allow = engine.evaluate(tc_allowed, policy, registry)
    assert d_allow.verdict == DecisionVerdict.ALLOW

    # Explicit denied sub-domain
    tc_denied = ToolCall(tool_name="fetch_data", network_destination="leak.safe.org")
    d_deny = engine.evaluate(tc_denied, policy, registry)
    assert d_deny.verdict == DecisionVerdict.DENY
    assert d_deny.reason == "NETWORK_DESTINATION_DENIED"

    # Explicit denied CIDR
    tc_loopback = ToolCall(tool_name="fetch_data", network_destination="127.0.0.42")
    d_loopback = engine.evaluate(tc_loopback, policy, registry)
    assert d_loopback.verdict == DecisionVerdict.DENY
    assert d_loopback.reason == "NETWORK_DESTINATION_DENIED"
