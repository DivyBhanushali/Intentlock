"""
INTENTLOCK Network Destination Security Validator.

Provides canonicalization, ambiguous IP resolution, CIDR matching, protocol
restriction, and private/loopback/cloud-metadata detection for network egress
destinations.

Important Architectural Note:
This module performs application-layer destination validation. It does not replace
kernel-level egress filtering (eBPF/iptables) or socket-level DNS rebinding pinning.
"""

from __future__ import annotations

import fnmatch
import ipaddress
import re
from dataclasses import dataclass
from typing import Optional, Sequence, Tuple
from urllib.parse import unquote, urlsplit

DANGEROUS_SCHEMES = {
    "file", "gopher", "ftp", "tftp", "data", "javascript", "vbscript",
    "ldap", "ldaps", "dict", "telnet", "ssh", "git",
}

CLOUD_METADATA_IPS = {
    "169.254.169.254",
    "169.254.170.2",
    "fd00:ec2::254",
}


@dataclass(frozen=True)
class CanonicalDestination:
    """Canonicalized network destination descriptor."""
    raw_input: str
    scheme: Optional[str]
    host: str
    port: Optional[int]
    ip: Optional[ipaddress.IPv4Address | ipaddress.IPv6Address]
    is_ip: bool
    is_loopback: bool
    is_private: bool
    is_link_local: bool
    is_cloud_metadata: bool
    has_userinfo: bool
    is_dangerous_scheme: bool


def _parse_ambiguous_ip(host: str) -> Optional[ipaddress.IPv4Address | ipaddress.IPv6Address]:
    """
    Parses IPv4, IPv6, and ambiguous IP encodings (hex, octal, integer).
    Returns canonical IPv4Address or IPv6Address, or None if host is a domain name.
    """
    cleaned = host.strip("[]").strip()

    # 1. Standard ipaddress parse (covers decimal dotted IPv4 and standard IPv6)
    try:
        return ipaddress.ip_address(cleaned)
    except ValueError:
        pass

    # 2. Integer / DWORD IP (e.g. 2130706433 -> 127.0.0.1)
    if cleaned.isdigit():
        try:
            val = int(cleaned)
            if 0 <= val <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(val)
        except (ValueError, OverflowError):
            pass

    # 3. Hexadecimal IP (e.g. 0x7f000001 or 0x7f.0x0.0x0.0x1)
    if cleaned.lower().startswith("0x"):
        try:
            val = int(cleaned, 16)
            if 0 <= val <= 0xFFFFFFFF:
                return ipaddress.IPv4Address(val)
        except (ValueError, OverflowError):
            pass

    # 4. Octal / Mixed Dotted IP (e.g. 0177.0.0.1 or 0177.1)
    if "." in cleaned and all(part.isdigit() or part.lower().startswith("0x") for part in cleaned.split(".")):
        parts = cleaned.split(".")
        if len(parts) <= 4:
            try:
                num_parts = []
                for p in parts:
                    if p.lower().startswith("0x"):
                        num_parts.append(int(p, 16))
                    elif p.startswith("0") and len(p) > 1:
                        num_parts.append(int(p, 8))
                    else:
                        num_parts.append(int(p, 10))
                
                # Reconstruct IPv4 32-bit integer
                if len(num_parts) == 4:
                    if all(0 <= p <= 255 for p in num_parts):
                        val = (num_parts[0] << 24) | (num_parts[1] << 16) | (num_parts[2] << 8) | num_parts[3]
                        return ipaddress.IPv4Address(val)
                elif len(num_parts) == 2:  # A.B format (e.g. 127.1)
                    val = (num_parts[0] << 24) | num_parts[1]
                    return ipaddress.IPv4Address(val)
            except (ValueError, OverflowError):
                pass

    return None


def canonicalize_destination(dest: str) -> CanonicalDestination:
    """
    Parses and canonicalizes any raw network destination string:
    domain, IP, host:port, or full URL.
    """
    raw = (dest or "").strip()
    if not raw:
        return CanonicalDestination(
            raw_input=raw,
            scheme=None,
            host="",
            port=None,
            ip=None,
            is_ip=False,
            is_loopback=False,
            is_private=False,
            is_link_local=False,
            is_cloud_metadata=False,
            has_userinfo=False,
            is_dangerous_scheme=False,
        )

    # Check for scheme
    scheme: Optional[str] = None
    has_userinfo = False
    port: Optional[int] = None

    if "://" in raw:
        parts = urlsplit(raw)
        scheme = (parts.scheme or "").lower()
        has_userinfo = bool(parts.username or parts.password)
        host_str = parts.hostname or ""
        port = parts.port
    else:
        # Check dangerous schemes without :// like file:/etc or javascript:...
        colon_idx = raw.find(":")
        if colon_idx != -1 and raw[:colon_idx].isalpha() and raw[:colon_idx].lower() in DANGEROUS_SCHEMES:
            scheme = raw[:colon_idx].lower()
            return CanonicalDestination(
                raw_input=raw,
                scheme=scheme,
                host="",
                port=None,
                ip=None,
                is_ip=False,
                is_loopback=False,
                is_private=False,
                is_link_local=False,
                is_cloud_metadata=False,
                has_userinfo=False,
                is_dangerous_scheme=True,
            )

        # Handle host or host:port
        host_str = raw
        if "@" in host_str:
            has_userinfo = True
            host_str = host_str.split("@")[-1]

        if ":" in host_str and not host_str.startswith("[") and host_str.count(":") == 1:
            h, p = host_str.split(":", 1)
            host_str = h
            if p.isdigit():
                port = int(p)

    # Normalize hostname (URL decode, lowercase, strip trailing dots)
    host_str = unquote(host_str).strip().rstrip(".").lower()

    # Ambiguous / Canonical IP Parsing
    ip_obj = _parse_ambiguous_ip(host_str)
    is_ip = ip_obj is not None

    canonical_host = str(ip_obj) if ip_obj else host_str

    # Classification
    is_loopback = False
    is_private = False
    is_link_local = False
    is_cloud_metadata = False

    if ip_obj:
        is_loopback = ip_obj.is_loopback
        is_private = ip_obj.is_private
        is_link_local = ip_obj.is_link_local
        is_cloud_metadata = str(ip_obj) in CLOUD_METADATA_IPS
    elif canonical_host in {"localhost", "localhost.localdomain"}:
        is_loopback = True

    is_dangerous_scheme = bool(scheme and scheme in DANGEROUS_SCHEMES)

    return CanonicalDestination(
        raw_input=raw,
        scheme=scheme,
        host=canonical_host,
        port=port,
        ip=ip_obj,
        is_ip=is_ip,
        is_loopback=is_loopback,
        is_private=is_private,
        is_link_local=is_link_local,
        is_cloud_metadata=is_cloud_metadata,
        has_userinfo=has_userinfo,
        is_dangerous_scheme=is_dangerous_scheme,
    )


def validate_network_destination(
    destination: str,
    allowed_destinations: Sequence[str],
    denied_destinations: Sequence[str],
) -> Tuple[bool, str]:
    """
    Validates *destination* against allowed and denied patterns.
    Enforces:
    1. Protocol restrictions (dangerous schemes rejected immediately).
    2. Explicit deny precedence over allowed patterns.
    3. Canonical IP / CIDR block matching.
    4. Domain wildcard matching.
    5. Special keywords: 'block:loopback', 'block:private', 'block:metadata'.
    """
    canon = canonicalize_destination(destination)

    # 1. Reject dangerous protocol schemes
    if canon.is_dangerous_scheme:
        return False, f"DANGEROUS_URI_SCHEME_BLOCKED: {canon.scheme}"

    # 2. Check explicit denials
    for pat in denied_destinations:
        pat_clean = pat.strip().lower()

        # Keyword checks
        if pat_clean == "block:loopback" and canon.is_loopback:
            return False, "NETWORK_DESTINATION_DENIED: Loopback addresses are blocked"
        if pat_clean == "block:private" and (canon.is_private or canon.is_loopback):
            return False, "NETWORK_DESTINATION_DENIED: Private and loopback addresses are blocked"
        if pat_clean == "block:metadata" and canon.is_cloud_metadata:
            return False, "NETWORK_DESTINATION_DENIED: Cloud metadata endpoint access blocked"

        # CIDR block matching
        if "/" in pat_clean and canon.ip:
            try:
                net = ipaddress.ip_network(pat_clean, strict=False)
                if canon.ip in net:
                    return False, f"NETWORK_DESTINATION_DENIED: Matches denied CIDR block {pat}"
            except ValueError:
                pass

        # IP or Domain pattern matching
        if fnmatch.fnmatch(canon.host, pat_clean) or fnmatch.fnmatch(canon.raw_input.lower(), pat_clean):
            return False, f"NETWORK_DESTINATION_DENIED: Matches denied pattern {pat}"

    # 3. Check allowed patterns (if any specified)
    if not allowed_destinations:
        # If no allowlist is configured, destination is permitted (subject to denials)
        return True, ""

    for pat in allowed_destinations:
        pat_clean = pat.strip().lower()

        # Wildcard all
        if pat_clean == "*":
            return True, ""

        # CIDR block matching
        if "/" in pat_clean and canon.ip:
            try:
                net = ipaddress.ip_network(pat_clean, strict=False)
                if canon.ip in net:
                    return True, ""
            except ValueError:
                pass

        # Domain or IP pattern matching
        if fnmatch.fnmatch(canon.host, pat_clean):
            return True, ""

    return False, "NETWORK_DESTINATION_NOT_PERMITTED: Destination does not match allowed patterns"


def validate_dns_resolution(
    host_or_url: str,
    block_private: bool = True,
    block_loopback: bool = True,
    block_metadata: bool = True,
) -> Tuple[bool, str, List[str]]:
    """
    Performs DNS resolution check for domain destinations to detect DNS-based
    SSRF attempts pointing to internal/loopback/cloud metadata services.

    Important Security Limitation (BLK-002):
    Resolving DNS ahead of time detects basic DNS-pinning to localhost, but does
    NOT guarantee socket-level protection against dynamic DNS rebinding (where the
    DNS server returns a public IP on lookup #1 and 127.0.0.1 on connect #2).
    Transport-level socket pinning remains required for complete mitigation.
    """
    import socket

    canon = canonicalize_destination(host_or_url)
    target_host = canon.host

    # If already an IP address
    if canon.is_ip and canon.ip:
        if block_metadata and canon.is_cloud_metadata:
            return False, f"Resolved IP {canon.ip} is cloud metadata endpoint", [str(canon.ip)]
        if block_loopback and canon.is_loopback:
            return False, f"Resolved IP {canon.ip} is loopback address", [str(canon.ip)]
        if block_private and (canon.is_private or canon.is_loopback):
            return False, f"Resolved IP {canon.ip} is private address", [str(canon.ip)]
        return True, "", [str(canon.ip)]

    # Domain name resolution
    resolved_ips: List[str] = []
    try:
        addrinfo = socket.getaddrinfo(target_host, None)
        for entry in addrinfo:
            sockaddr = entry[4]
            ip_str = sockaddr[0]
            if ip_str not in resolved_ips:
                resolved_ips.append(ip_str)
                try:
                    ip_obj = ipaddress.ip_address(ip_str)
                    if block_loopback and ip_obj.is_loopback:
                        return False, f"Domain '{target_host}' resolves to loopback IP {ip_str}", resolved_ips
                    if block_private and (ip_obj.is_private or ip_obj.is_loopback):
                        return False, f"Domain '{target_host}' resolves to private network IP {ip_str}", resolved_ips
                    if block_metadata and ip_str in CLOUD_METADATA_IPS:
                        return False, f"Domain '{target_host}' resolves to cloud metadata endpoint {ip_str}", resolved_ips
                except ValueError:
                    pass
    except socket.gaierror:
        # Unresolvable domains fail safely if DNS validation is required
        return False, f"Unable to resolve domain '{target_host}'", []
    except Exception as e:
        return False, f"DNS resolution error for '{target_host}': {e}", []

    return True, "", resolved_ips
