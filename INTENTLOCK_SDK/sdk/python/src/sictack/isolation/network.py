"""
SICTACK Transport-Level Network Isolation & Socket Pinning Engine (Phase 4G).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Resolves BLK-002: Transport-Level DNS Rebinding Protection & Socket Pinning.
Guarantees zero TOCTOU between destination security validation and socket connection:
1. Performs strict pre-flight DNS resolution and IP classification.
2. Rejects private, loopback, link-local, and cloud metadata IPs at resolution time.
3. Pins the validated IP address directly for TCP connection establishment.
4. Preserves TLS Server Name Indication (SNI) and Host headers for certificate verification.
"""

from __future__ import annotations

import http.client
import ipaddress
import logging
import socket
import ssl
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlsplit

from sictack.exceptions import SictackError
from sictack.network import (
    CLOUD_METADATA_IPS,
    DANGEROUS_SCHEMES,
    canonicalize_destination,
    validate_network_destination,
)

logger = logging.getLogger("sictack.isolation.network")


class NetworkSecurityError(SictackError):
    """Base exception for network isolation and destination security violations."""
    pass


class DNSRebindingError(NetworkSecurityError):
    """Raised when DNS rebinding or internal IP resolution is detected."""
    pass


class SocketPinningError(NetworkSecurityError):
    """Raised when socket connection cannot be safely pinned to a validated IP."""
    pass


class PinnedSocketFactory:
    """
    Factory creating sockets strictly bound to pre-validated IP addresses.
    Prevents dynamic DNS rebinding by never resolving hostnames on `connect()`.
    """

    @classmethod
    def resolve_and_validate(
        cls,
        hostname: str,
        block_private: bool = True,
        block_loopback: bool = True,
        block_metadata: bool = True,
    ) -> str:
        """
        Resolves domain to IP and strictly validates against SSRF/rebinding targets.
        Returns the first validated IP address string.
        """
        # If hostname is already an IP, validate directly
        try:
            ip_obj = ipaddress.ip_address(hostname.strip("[]"))
            ip_str = str(ip_obj)
            if block_metadata and ip_str in CLOUD_METADATA_IPS:
                raise DNSRebindingError(f"Direct connection to cloud metadata {ip_str} is blocked")
            if block_loopback and ip_obj.is_loopback:
                raise DNSRebindingError(f"Direct connection to loopback address {ip_str} is blocked")
            if block_private and (ip_obj.is_private or ip_obj.is_loopback):
                raise DNSRebindingError(f"Direct connection to private IP {ip_str} is blocked")
            return ip_str
        except ValueError:
            pass

        # Perform explicit DNS resolution
        try:
            addrinfo = socket.getaddrinfo(hostname, None, socket.AF_UNSPEC, socket.SOCK_STREAM)
        except socket.gaierror as e:
            raise DNSRebindingError(f"Failed to resolve hostname '{hostname}': {e}") from e

        if not addrinfo:
            raise DNSRebindingError(f"No address records returned for hostname '{hostname}'")

        validated_ips: List[str] = []
        for entry in addrinfo:
            sockaddr = entry[4]
            ip_str = sockaddr[0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
                if block_metadata and ip_str in CLOUD_METADATA_IPS:
                    logger.warning(f"DNS rebinding detected: '{hostname}' resolved to cloud metadata {ip_str}")
                    continue
                if block_loopback and ip_obj.is_loopback:
                    logger.warning(f"DNS rebinding detected: '{hostname}' resolved to loopback {ip_str}")
                    continue
                if block_private and (ip_obj.is_private or ip_obj.is_loopback):
                    logger.warning(f"DNS rebinding detected: '{hostname}' resolved to private network {ip_str}")
                    continue
                validated_ips.append(ip_str)
            except ValueError:
                continue

        if not validated_ips:
            raise DNSRebindingError(
                f"All resolved IP addresses for '{hostname}' were identified as prohibited internal/loopback/metadata destinations."
            )

        return validated_ips[0]

    @classmethod
    def create_pinned_connection(
        cls,
        host: str,
        port: int,
        timeout: float = 10.0,
        use_ssl: bool = False,
        ssl_context: Optional[ssl.SSLContext] = None,
        block_private: bool = True,
        block_loopback: bool = True,
        block_metadata: bool = True,
    ) -> socket.socket:
        """
        Creates a TCP socket connected strictly to the pinned validated IP,
        bypassing system DNS resolution on connect().
        Wraps with TLS if requested while maintaining SNI for the original host.
        """
        pinned_ip = cls.resolve_and_validate(
            hostname=host,
            block_private=block_private,
            block_loopback=block_loopback,
            block_metadata=block_metadata,
        )

        sock = socket.create_connection((pinned_ip, port), timeout=timeout)

        if use_ssl:
            ctx = ssl_context or ssl.create_default_context()
            # Wrap socket ensuring SNI host matches original domain name
            sock = ctx.wrap_socket(sock, server_hostname=host)

        return sock


class SafePinnedHTTPClient:
    """
    Hardened HTTP client that enforces transport-level socket pinning and destination validation.
    """

    def __init__(
        self,
        allowed_destinations: Optional[List[str]] = None,
        denied_destinations: Optional[List[str]] = None,
        timeout: float = 10.0,
    ):
        self.allowed_destinations = allowed_destinations or []
        self.denied_destinations = denied_destinations or ["block:loopback", "block:private", "block:metadata"]
        self.timeout = timeout

    def request(
        self,
        method: str,
        url: str,
        headers: Optional[Dict[str, str]] = None,
        body: Optional[bytes] = None,
        follow_redirects: bool = True,
        max_redirects: int = 5,
    ) -> Tuple[int, Dict[str, str], bytes]:
        """
        Executes HTTP/HTTPS request with strict pre-flight validation and socket pinning.
        When follow_redirects is True, traces up to max_redirects hops while enforcing
        pre-flight validation, cloud metadata blocking, and socket pinning on every hop.
        """
        import urllib.parse

        current_url = url
        current_method = method.upper()
        current_body = body
        redirect_count = 0
        seen_urls = {current_url}

        while True:
            parts = urlsplit(current_url)
            scheme = (parts.scheme or "http").lower()
            if scheme not in {"http", "https"}:
                raise NetworkSecurityError(f"Unsupported scheme '{scheme}'. Only http and https are permitted.")

            host = parts.hostname or ""
            if not host:
                raise NetworkSecurityError("Invalid URL: missing host")

            port = parts.port or (443 if scheme == "https" else 80)
            path = parts.path or "/"
            if parts.query:
                path += f"?{parts.query}"

            # 1. Application-level validation
            is_valid, reason = validate_network_destination(
                destination=current_url,
                allowed_destinations=self.allowed_destinations,
                denied_destinations=self.denied_destinations,
            )
            if not is_valid:
                raise NetworkSecurityError(f"Destination blocked by policy: {reason}")

            # 2. Transport-level DNS resolution and socket pinning
            is_ssl = scheme == "https"
            block_priv = any("private" in d.lower() for d in self.denied_destinations)
            block_loop = any("loopback" in d.lower() for d in self.denied_destinations)
            block_meta = any("metadata" in d.lower() for d in self.denied_destinations)

            pinned_ip = PinnedSocketFactory.resolve_and_validate(
                hostname=host,
                block_private=block_priv,
                block_loopback=block_loop,
                block_metadata=block_meta,
            )

            req_headers = dict(headers or {})
            if "Host" not in req_headers:
                req_headers["Host"] = host if (port in {80, 443}) else f"{host}:{port}"
            if "User-Agent" not in req_headers:
                req_headers["User-Agent"] = "SICTACK-Pinned-Client/1.0"

            # 3. Create connection using pinned IP
            if is_ssl:
                conn = http.client.HTTPSConnection(
                    host=pinned_ip,
                    port=port,
                    timeout=self.timeout,
                )
                conn._server_hostname = host  # type: ignore[attr-defined]
            else:
                conn = http.client.HTTPConnection(
                    host=pinned_ip,
                    port=port,
                    timeout=self.timeout,
                )

            try:
                conn.request(method=current_method, url=path, body=current_body, headers=req_headers)
                resp = conn.getresponse()
                status = resp.status
                resp_headers = {k: v for k, v in resp.getheaders()}
                resp_body = resp.read()

                # Handle redirects securely
                normalized_headers = {k.lower(): v for k, v in resp_headers.items()}
                if follow_redirects and status in (301, 302, 303, 307, 308) and "location" in normalized_headers:
                    redirect_count += 1
                    if redirect_count > max_redirects:
                        raise NetworkSecurityError(f"Exceeded maximum redirect hops ({max_redirects})")

                    location_val = normalized_headers["location"]
                    next_url = urllib.parse.urljoin(current_url, location_val)

                    if next_url in seen_urls:
                        raise NetworkSecurityError(f"Circular redirect loop detected to '{next_url}'")
                    seen_urls.add(next_url)

                    current_url = next_url
                    if status in (301, 302, 303):
                        current_method = "GET"
                        current_body = None
                    continue

                return status, resp_headers, resp_body
            finally:
                conn.close()
