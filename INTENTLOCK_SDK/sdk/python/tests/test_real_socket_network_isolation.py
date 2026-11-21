"""
SICTACK Phase 5C — Real Loopback Socket Network Isolation & SSRF Pinning Tests (BLK-003).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Real TCP socket connection establishment strictly bound to pre-validated IP.
2. Direct rejection of private, loopback, link-local, and cloud metadata IPs.
3. Live HTTP redirect interception where initial hop succeeds on loopback but second hop targeting metadata is blocked.
4. Circular redirect loop detection over real HTTP sockets.
5. Strict isolation ensuring zero external network egress during test execution.
"""

from __future__ import annotations

import http.server
import socket
import sys
import threading
import time
from typing import Generator
import pytest

from sictack.isolation.network import (
    DNSRebindingError,
    NetworkSecurityError,
    PinnedSocketFactory,
    SafePinnedHTTPClient,
)
from sictack.network import (
    canonicalize_destination,
    validate_network_destination,
)


class EphemeralTestHandler(http.server.BaseHTTPRequestHandler):
    """Minimal HTTP handler serving isolated loopback test endpoints."""

    def log_message(self, format: str, *args: object) -> None:
        """Suppress standard HTTP server stderr logging in test output."""
        pass

    def do_GET(self) -> None:
        if self.path == "/status":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", "2")
            self.end_headers()
            self.wfile.write(b"OK")
        elif self.path == "/redirect-safe":
            self.send_response(302)
            self.send_header("Location", "/status")
            self.end_headers()
        elif self.path == "/redirect-metadata":
            self.send_response(302)
            self.send_header("Location", "http://169.254.169.254/latest/meta-data")
            self.end_headers()
        elif self.path == "/redirect-private":
            self.send_response(302)
            self.send_header("Location", "http://10.0.0.1/admin")
            self.end_headers()
        elif self.path == "/redirect-loop":
            self.send_response(302)
            self.send_header("Location", "/redirect-loop")
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()


@pytest.fixture(scope="module")
def loopback_http_server() -> Generator[tuple[str, int], None, None]:
    """Spins up an ephemeral HTTP server strictly bound to 127.0.0.1 on a random available port."""
    try:
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), EphemeralTestHandler)
    except PermissionError as exc:
        pytest.skip(f"Loopback socket binding restricted by environment: {exc}")

    host, port = server.server_address
    server_thread = threading.Thread(target=server.serve_forever, daemon=True)
    server_thread.start()

    yield host, port

    server.shutdown()
    server.server_close()
    server_thread.join(timeout=2.0)


def test_real_tcp_socket_connection_pinning(loopback_http_server: tuple[str, int]):
    """
    Verifies that PinnedSocketFactory opens a real TCP socket strictly pinned
    to the target loopback IP, transmits an HTTP request, and reads the response.
    """
    host, port = loopback_http_server

    try:
        # Create real socket directly via factory with loopback permitted for test
        sock = PinnedSocketFactory.create_pinned_connection(
            host=host,
            port=port,
            timeout=5.0,
            block_private=False,
            block_loopback=False,
            block_metadata=True,
        )
    except PermissionError as exc:
        if sys.platform == "win32":
            pytest.skip(f"Windows sandbox environment restricts outbound socket connection: {exc}")
        raise

    try:
        # Confirm socket is physically connected to the expected IP and port
        peer_ip, peer_port = sock.getpeername()
        assert peer_ip == "127.0.0.1", f"Peer IP must be strictly pinned to 127.0.0.1, got {peer_ip}"
        assert peer_port == port, f"Peer port must match {port}, got {peer_port}"

        # Send HTTP GET over the pinned socket
        req = f"GET /status HTTP/1.1\r\nHost: {host}:{port}\r\nConnection: close\r\n\r\n".encode()
        sock.sendall(req)

        # Read response
        resp = b""
        while True:
            chunk = sock.recv(1024)
            if not chunk:
                break
            resp += chunk

        assert b"200 OK" in resp
        assert b"OK" in resp
    finally:
        sock.close()


def test_default_client_rejects_loopback_socket():
    """Verify that SafePinnedHTTPClient rejects loopback destinations by default before socket connect."""
    client = SafePinnedHTTPClient()
    with pytest.raises(NetworkSecurityError):
        client.request("GET", "http://127.0.0.1:8080/status")


def test_real_socket_client_get_request(loopback_http_server: tuple[str, int]):
    """Verify SafePinnedHTTPClient successfully executes request over real socket when allowed."""
    host, port = loopback_http_server
    client = SafePinnedHTTPClient(
        allowed_destinations=[f"127.0.0.1:{port}", "127.0.0.1"],
        denied_destinations=["block:metadata"],  # Only block metadata, permitting loopback for this isolated test
    )

    try:
        status, headers, body = client.request("GET", f"http://127.0.0.1:{port}/status")
    except PermissionError as exc:
        if sys.platform == "win32":
            pytest.skip(f"Windows sandbox environment restricts outbound socket connection: {exc}")
        raise

    assert status == 200
    assert body == b"OK"


def test_real_socket_redirect_to_metadata_intercepted(loopback_http_server: tuple[str, int]):
    """
    Verify real-socket redirect to cloud metadata is blocked at the second hop.
    First hop completes over real socket (receives 302); second hop evaluates 169.254.169.254 and halts.
    """
    host, port = loopback_http_server
    client = SafePinnedHTTPClient(
        allowed_destinations=[f"127.0.0.1:{port}", "127.0.0.1"],
        denied_destinations=["block:metadata"],
    )

    try:
        with pytest.raises(NetworkSecurityError):
            client.request("GET", f"http://127.0.0.1:{port}/redirect-metadata")
    except PermissionError as exc:
        if sys.platform == "win32":
            pytest.skip(f"Windows sandbox environment restricts outbound socket connection: {exc}")
        raise


def test_real_socket_redirect_to_private_ip_intercepted(loopback_http_server: tuple[str, int]):
    """Verify real-socket redirect to private RFC 1918 IP (10.0.0.1) is blocked at the second hop."""
    host, port = loopback_http_server
    client = SafePinnedHTTPClient(
        allowed_destinations=[f"127.0.0.1:{port}", "127.0.0.1"],
        denied_destinations=["block:metadata", "10.0.0.0/8"],
    )

    try:
        with pytest.raises(NetworkSecurityError):
            client.request("GET", f"http://127.0.0.1:{port}/redirect-private")
    except PermissionError as exc:
        if sys.platform == "win32":
            pytest.skip(f"Windows sandbox environment restricts outbound socket connection: {exc}")
        raise


def test_real_socket_circular_redirect_loop_intercepted(loopback_http_server: tuple[str, int]):
    """Verify circular redirect loop over real HTTP socket is detected and halted."""
    host, port = loopback_http_server
    client = SafePinnedHTTPClient(
        allowed_destinations=[f"127.0.0.1:{port}", "127.0.0.1"],
        denied_destinations=["block:metadata"],
    )

    try:
        with pytest.raises(NetworkSecurityError, match=r"Circular redirect loop"):
            client.request("GET", f"http://127.0.0.1:{port}/redirect-loop")
    except PermissionError as exc:
        if sys.platform == "win32":
            pytest.skip(f"Windows sandbox environment restricts outbound socket connection: {exc}")
        raise


def test_comprehensive_prohibited_destinations_validation():
    """Verify destination canonicalization and security validation across IPv4, IPv6, and metadata."""
    prohibited = [
        "169.254.169.254",
        "127.0.0.1",
        "10.0.0.1",
        "172.16.0.1",
        "192.168.1.1",
        "[::1]",
        "[::ffff:169.254.169.254]",
        "[::ffff:127.0.0.1]",
    ]

    for dest in prohibited:
        canon = canonicalize_destination(f"http://{dest}/api")
        assert canon.is_ip is True

        is_safe, reason = validate_network_destination(
            destination=f"http://{dest}/api",
            allowed_destinations=["api.external.com"],
            denied_destinations=[],
        )
        assert not is_safe, f"Destination {dest} must be rejected by security policy"
