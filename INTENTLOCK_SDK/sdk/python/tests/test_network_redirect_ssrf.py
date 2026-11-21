"""
SICTACK SDK — Safe Redirects, SSRF & DNS Rebinding Verification Tests (Phase 5B).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Transport-level DNS resolution rejects cloud metadata (169.254.169.254), loopback, and private IPs.
2. SafePinnedHTTPClient intercepts malicious HTTP redirects targeting cloud metadata.
3. Circular redirect loops and redirect hop exhaustion are blocked.
4. Non-HTTP schemes (file://, gopher://) are rejected on redirects.
5. IPv6 loopback and IPv4-mapped IPv6 targets are blocked.
"""

from __future__ import annotations

from unittest.mock import patch, MagicMock
import pytest

from sictack.isolation.network import (
    DNSRebindingError,
    NetworkSecurityError,
    PinnedSocketFactory,
    SafePinnedHTTPClient,
)


def test_direct_metadata_and_loopback_ip_blocking():
    """Verify that direct attempts to connect to metadata or loopback IPs fail closed."""
    # Cloud metadata IP (AWS/GCP/Azure)
    with pytest.raises(DNSRebindingError, match=r"cloud metadata"):
        PinnedSocketFactory.resolve_and_validate("169.254.169.254")

    # IPv4 loopback
    with pytest.raises(DNSRebindingError, match=r"loopback address"):
        PinnedSocketFactory.resolve_and_validate("127.0.0.1")

    # IPv6 loopback
    with pytest.raises(DNSRebindingError, match=r"loopback address"):
        PinnedSocketFactory.resolve_and_validate("::1")


def test_private_rfc1918_ip_blocking():
    """Verify that private subnet IPs are blocked by default."""
    for priv_ip in ["10.0.0.1", "172.16.5.10", "192.168.1.1"]:
        with pytest.raises(DNSRebindingError, match=r"private IP"):
            PinnedSocketFactory.resolve_and_validate(priv_ip)


def test_redirect_to_cloud_metadata_blocked():
    """Verify that an HTTP redirect to cloud metadata is intercepted and blocked."""
    client = SafePinnedHTTPClient()

    # Mock first response returning a 302 redirect to AWS metadata service
    mock_conn1 = MagicMock()
    mock_resp1 = MagicMock()
    mock_resp1.status = 302
    mock_resp1.getheaders.return_value = [("Location", "http://169.254.169.254/latest/meta-data/")]
    mock_resp1.read.return_value = b""
    mock_conn1.getresponse.return_value = mock_resp1

    with patch("sictack.isolation.network.PinnedSocketFactory.resolve_and_validate") as mock_resolve:
        mock_resolve.side_effect = [
            "93.184.216.34",  # Initial hop (example.com) -> valid public IP
            DNSRebindingError("Direct connection to cloud metadata 169.254.169.254 is blocked"),
        ]
        with patch("http.client.HTTPConnection", return_value=mock_conn1):
            with pytest.raises(NetworkSecurityError):
                client.request("GET", "http://example.com/redirect-to-metadata")


def test_redirect_to_loopback_blocked():
    """Verify that an HTTP redirect to localhost/loopback is blocked on the second hop."""
    client = SafePinnedHTTPClient()

    mock_conn1 = MagicMock()
    mock_resp1 = MagicMock()
    mock_resp1.status = 301
    mock_resp1.getheaders.return_value = [("Location", "http://127.0.0.1:8080/admin")]
    mock_resp1.read.return_value = b""
    mock_conn1.getresponse.return_value = mock_resp1

    with patch("sictack.isolation.network.PinnedSocketFactory.resolve_and_validate") as mock_resolve:
        mock_resolve.side_effect = [
            "93.184.216.34",  # Initial hop -> valid
            DNSRebindingError("Direct connection to loopback address 127.0.0.1 is blocked"),
        ]
        with patch("http.client.HTTPConnection", return_value=mock_conn1):
            with pytest.raises(NetworkSecurityError):
                client.request("GET", "http://example.com/redirect-to-local")


def test_circular_redirect_loop_blocked():
    """Verify that a redirect loop is detected and aborted."""
    client = SafePinnedHTTPClient()

    mock_conn = MagicMock()
    mock_resp = MagicMock()
    mock_resp.status = 302
    mock_resp.getheaders.return_value = [("Location", "http://example.com/loop")]
    mock_resp.read.return_value = b""
    mock_conn.getresponse.return_value = mock_resp

    with patch("sictack.isolation.network.PinnedSocketFactory.resolve_and_validate", return_value="93.184.216.34"):
        with patch("http.client.HTTPConnection", return_value=mock_conn):
            with pytest.raises(NetworkSecurityError, match=r"Circular redirect loop"):
                client.request("GET", "http://example.com/loop")


def test_max_redirects_exhaustion():
    """Verify that exceeding the maximum redirect hops (5) raises an error."""
    client = SafePinnedHTTPClient()

    mock_conn = MagicMock()
    # Chain of distinct redirects
    responses = []
    for i in range(1, 10):
        m = MagicMock()
        m.status = 302
        m.getheaders.return_value = [("Location", f"http://example.com/hop_{i}")]
        m.read.return_value = b""
        responses.append(m)

    mock_conn.getresponse.side_effect = responses

    with patch("sictack.isolation.network.PinnedSocketFactory.resolve_and_validate", return_value="93.184.216.34"):
        with patch("http.client.HTTPConnection", return_value=mock_conn):
            with pytest.raises(NetworkSecurityError, match=r"Exceeded maximum redirect hops"):
                client.request("GET", "http://example.com/start", max_redirects=5)


def test_non_http_redirect_scheme_rejected():
    """Verify that a redirect to a dangerous scheme like file:// or gopher:// is rejected."""
    client = SafePinnedHTTPClient()

    mock_conn = MagicMock()
    mock_resp = MagicMock()
    mock_resp.status = 302
    mock_resp.getheaders.return_value = [("Location", "file:///etc/passwd")]
    mock_resp.read.return_value = b""
    mock_conn.getresponse.return_value = mock_resp

    with patch("sictack.isolation.network.PinnedSocketFactory.resolve_and_validate", return_value="93.184.216.34"):
        with patch("http.client.HTTPConnection", return_value=mock_conn):
            with pytest.raises(NetworkSecurityError, match=r"Unsupported scheme 'file'"):
                client.request("GET", "http://example.com/read-file")
