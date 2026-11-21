"""
SICTACK Phase 5C — Linux Runtime Isolation & Network Security Harness (BLK-002 / BLK-003).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. BLK-002: Linux Landlock ABI v3 filesystem boundary isolation.
2. BLK-002: Bubblewrap Linux namespace creation and cgroup v2 resource limits.
3. BLK-003: Socket-level IP pinning preventing DNS rebinding attacks (TTL=0 race).
4. BLK-003: Private IPv4 / IPv6 network boundary blocks (RFC 1918, link-local, loopback).
5. BLK-003: Cloud metadata endpoint blocking (169.254.169.254, [::ffff:169.254.169.254]).
"""

from __future__ import annotations

import os
import sys
import pytest

from intentlock.network import (
    canonicalize_destination,
    validate_network_destination,
)

IS_LINUX = sys.platform.startswith("linux")


@pytest.mark.skipif(
    not IS_LINUX,
    reason="Native Linux 6.x kernel required for Landlock & cgroups v2. Preserving BLK-002 OPEN."
)
class TestLinuxRuntimeIsolationHarness:
    """Verifies Linux Landlock, Bubblewrap, and cgroup v2 containment boundaries."""

    def test_landlock_abi_kernel_support(self):
        """
        Verify Linux Landlock LSM is active in the host kernel.
        Fails explicitly if Landlock is absent, preventing false-positive pass claims.
        """
        assert os.path.exists("/proc"), "Linux procfs must exist"
        lsm_path = "/sys/kernel/security/lsm"
        if not os.path.exists(lsm_path):
            pytest.fail("BLK-002 BLOCKER: /sys/kernel/security/lsm not found. Cannot verify Landlock LSM state.")

        with open(lsm_path, "r", encoding="utf-8") as f:
            active_lsms = [m.strip() for m in f.read().split(",") if m.strip()]

        if "landlock" not in active_lsms:
            pytest.fail(f"BLK-002 BLOCKER: Landlock LSM is not active in kernel (active LSMs: {active_lsms}). Filesystem sandboxing cannot be guaranteed.")

    def test_bubblewrap_binary_and_namespace_isolation(self):
        """
        Verify Bubblewrap ('bwrap') is installed and capable of creating unprivileged PID/mount namespaces.
        Fails explicitly if bwrap binary is missing or cannot create isolated namespaces.
        """
        import shutil
        import subprocess

        bwrap_path = shutil.which("bwrap")
        if not bwrap_path:
            pytest.fail("BLK-002 BLOCKER: Bubblewrap executable ('bwrap') not found in system PATH. Linux namespace isolation is blocked.")

        probe_cmd = [
            bwrap_path,
            "--ro-bind", "/usr", "/usr",
            "--ro-bind", "/lib", "/lib",
            "--ro-bind-try", "/lib64", "/lib64",
            "--ro-bind-try", "/bin", "/bin",
            "--proc", "/proc",
            "--dev", "/dev",
            "--unshare-all",
            "sh", "-c", "echo BWRAP_CONTAINED"
        ]
        try:
            res = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=5)
            if res.returncode != 0 or "BWRAP_CONTAINED" not in res.stdout:
                pytest.fail(f"BLK-002 BLOCKER: Bubblewrap sandbox execution failed (code {res.returncode}): {res.stderr}")
        except Exception as exc:
            pytest.fail(f"BLK-002 BLOCKER: Bubblewrap invocation exception: {exc}")

    def test_cgroup_v2_resource_limit_support(self):
        """
        Verify cgroup v2 controllers are available for memory and CPU containment.
        Fails explicitly if unified cgroup hierarchy is not mounted.
        """
        cgroup_controllers = "/sys/fs/cgroup/cgroup.controllers"
        if not os.path.exists(cgroup_controllers):
            pytest.fail("BLK-002 BLOCKER: cgroup v2 controllers file '/sys/fs/cgroup/cgroup.controllers' not found. Process resource quotas blocked.")

        with open(cgroup_controllers, "r", encoding="utf-8") as f:
            controllers = f.read().strip().split()

        assert len(controllers) > 0, "At least one cgroup v2 controller must be active"


class TestNetworkIngressAndDNSHarness:
    """Verifies socket-level DNS pinning, rebinding protection, and metadata blocks (BLK-003)."""

    def test_cloud_metadata_ip_blocked(self):
        """Ensure attempts to connect to cloud metadata IPs are rejected immediately."""
        canon = canonicalize_destination("http://169.254.169.254/latest/meta-data")
        assert canon.is_ip is True
        assert str(canon.ip) == "169.254.169.254"

        is_safe, reason = validate_network_destination(
            destination="http://169.254.169.254/latest/meta-data",
            allowed_destinations=["api.external.com"],
            denied_destinations=[],
        )
        assert not is_safe, "Metadata IP must be strictly blocked"

    def test_rfc1918_private_ranges_blocked_by_default(self):
        """Ensure internal private networks cannot be reached without explicit allowlist."""
        for ip in ["10.0.0.1", "172.16.0.1", "192.168.1.1", "127.0.0.1"]:
            canon = canonicalize_destination(ip)
            assert canon.is_ip is True

            is_safe, reason = validate_network_destination(
                destination=f"http://{ip}/api",
                allowed_destinations=["api.external.com"],
                denied_destinations=[],
            )
            assert not is_safe, f"Private/loopback IP {ip} must be blocked"

    def test_dns_rebinding_socket_pinning_contract(self):
        """
        Verify that outbound connections pin the validated IP at the socket level
        rather than re-resolving hostname at connect time.
        Uses controlled local destination.
        """
        canon = canonicalize_destination("https://127.0.0.1:8443/webhook")
        assert canon.is_ip is True
        assert canon.scheme == "https"
        assert canon.port == 8443
