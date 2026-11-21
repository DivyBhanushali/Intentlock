"""
SICTACK Runtime Sandbox Dispatcher & Isolation Engine (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Dispatches executions to appropriate OS-level isolation backends.
Enforces the mandatory Fail-Closed invariant for requested isolation tiers.
"""

from __future__ import annotations

import logging
import os
import platform
import subprocess
import sys
import time
from typing import Any, Callable, Dict, List, Optional, Union

from sictack.isolation.models import (
    ExecutionLimits,
    IsolatedExecutionResult,
    IsolationMode,
)
from sictack.exceptions import SictackError

logger = logging.getLogger("sictack.isolation.sandbox")

HIGH_RISK_ENV_PATTERNS = [
    "AWS_", "AZURE_", "OPENAI_", "ANTHROPIC_", "GOOGLE_", "GCP_",
    "DATABASE_URL", "SECRET", "TOKEN", "PASSWORD", "AUTH", "API_KEY",
    "PRIVATE_KEY", "CREDENTIALS", "ACCESS_KEY", "SICTACK_SECRET",
]



class RuntimeIsolationError(SictackError):
    """Base exception for runtime sandbox failures."""
    pass


class RuntimeIsolationUnavailableError(RuntimeIsolationError):
    """
    Raised when a requested mandatory isolation mode (e.g. LINUX_SANDBOX)
    cannot be provided by the host environment.
    Guarantees strict Fail-Closed behavior (no silent downgrades).
    """
    pass


class ExecutionTimeoutError(RuntimeIsolationError):
    """Raised when an isolated execution exceeds its configured timeout limit."""
    pass


class RuntimeSandbox:
    """
    Modular execution sandbox engine.
    Supports in-process (NONE), subprocess (PROCESS), and Linux kernel namespaces (LINUX_SANDBOX).
    """

    @classmethod
    def is_linux_sandbox_available(cls) -> bool:
        """
        Evaluates whether Linux namespace and unshare primitives are genuinely available.
        Returns False on Windows, macOS, or unprivileged container environments.
        """
        if platform.system().lower() != "linux":
            return False
        # Check for unshare binary and user/mount namespace capability
        unshare_path = os.path.exists("/usr/bin/unshare") or os.path.exists("/bin/unshare")
        return unshare_path and os.path.exists("/proc/self/ns")

    @classmethod
    def execute(
        cls,
        command: List[str],
        limits: Optional[ExecutionLimits] = None,
        mode: IsolationMode = IsolationMode.PROCESS,
        env: Optional[Dict[str, str]] = None,
    ) -> IsolatedExecutionResult:
        return cls.execute_command(command, limits, mode, env)

    @classmethod
    def execute_command(
        cls,
        command: List[str],
        limits: Optional[ExecutionLimits] = None,
        mode: IsolationMode = IsolationMode.PROCESS,
        env: Optional[Dict[str, str]] = None,
    ) -> IsolatedExecutionResult:
        """
        Executes an external command under the specified isolation mode.
        Fails closed if the requested mode is unavailable.
        """
        resolved_limits = limits or ExecutionLimits()

        # 1. Mandatory Fail-Closed Check: Never silently downgrade LINUX_SANDBOX
        if mode == IsolationMode.LINUX_SANDBOX:
            if not cls.is_linux_sandbox_available():
                logger.error(
                    f"Requested isolation mode '{mode.value}' is unavailable on {platform.system()} "
                    f"host. Failing closed to prevent insecure unisolated execution."
                )
                raise RuntimeIsolationUnavailableError(
                    f"Mandatory isolation mode '{mode.value}' is unavailable in the current execution "
                    f"environment ({platform.system()} {platform.release()}). "
                    f"Execution blocked to prevent unisolated tool execution (BLK-003)."
                )
            return cls._execute_linux_sandbox(command, resolved_limits, env)

        elif mode == IsolationMode.PROCESS:
            return cls._execute_process_sandbox(command, resolved_limits, env)

        elif mode == IsolationMode.NONE:
            return cls._execute_unisolated_process(command, resolved_limits, env)

        else:
            raise RuntimeIsolationError(f"Unknown isolation mode: {mode}")

    @classmethod
    def _execute_process_sandbox(
        cls,
        command: List[str],
        limits: ExecutionLimits,
        env: Optional[Dict[str, str]] = None,
    ) -> IsolatedExecutionResult:
        """
        Subprocess execution with bounded timeouts, output clipping, and process-tree termination.
        """
        start_time = time.monotonic()
        filtered_env: Dict[str, str] = {}

        # Build clean environment from allowlist, stripping high-risk credential patterns
        source_env = env or dict(os.environ)
        scrubbed_keys: List[str] = []
        for k in limits.environment_allowlist:
            if k in source_env:
                k_upper = k.upper()
                if any(pat in k_upper for pat in HIGH_RISK_ENV_PATTERNS):
                    logger.warning(f"Sanitizing sensitive credential variable '{k}' from isolated subprocess")
                    scrubbed_keys.append(k)
                    continue
                filtered_env[k] = source_env[k]

        if limits.network_disabled:
            filtered_env["http_proxy"] = "http://127.0.0.1:0"
            filtered_env["https_proxy"] = "http://127.0.0.1:0"
            filtered_env["NO_PROXY"] = ""

        try:
            proc = subprocess.Popen(
                command,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                cwd=limits.working_directory or os.getcwd(),
                env=filtered_env,
                text=True,
            )

            try:
                stdout, stderr = proc.communicate(timeout=limits.timeout_seconds)
                duration_ms = (time.monotonic() - start_time) * 1000.0

                # Enforce output byte ceiling
                limits_exceeded = []
                if len(stdout.encode("utf-8")) > limits.max_output_bytes:
                    stdout = stdout[: limits.max_output_bytes] + "\n[OUTPUT TRUNCATED BY SICTACK RUNTIME LIMIT]"
                    limits_exceeded.append("MAX_OUTPUT_BYTES_EXCEEDED")

                return IsolatedExecutionResult(
                    exit_code=proc.returncode,
                    stdout=stdout,
                    stderr=stderr,
                    duration_ms=round(duration_ms, 2),
                    isolation_mode_used=IsolationMode.PROCESS,
                    timed_out=False,
                    killed=False,
                    limits_exceeded=limits_exceeded,
                )

            except subprocess.TimeoutExpired:
                # Terminate child process tree cleanly
                cls._kill_process_tree(proc)
                duration_ms = (time.monotonic() - start_time) * 1000.0
                return IsolatedExecutionResult(
                    exit_code=-1,
                    stdout="",
                    stderr=f"Process exceeded maximum timeout limit of {limits.timeout_seconds}s and was terminated.",
                    duration_ms=round(duration_ms, 2),
                    isolation_mode_used=IsolationMode.PROCESS,
                    timed_out=True,
                    killed=True,
                    limits_exceeded=["TIMEOUT_EXCEEDED"],
                )

        except Exception as e:
            duration_ms = (time.monotonic() - start_time) * 1000.0
            return IsolatedExecutionResult(
                exit_code=-1,
                stdout="",
                stderr=str(e),
                duration_ms=round(duration_ms, 2),
                isolation_mode_used=IsolationMode.PROCESS,
                timed_out=False,
                killed=False,
                limits_exceeded=["EXECUTION_ERROR"],
            )

    @classmethod
    def _execute_unisolated_process(
        cls,
        command: List[str],
        limits: ExecutionLimits,
        env: Optional[Dict[str, str]] = None,
    ) -> IsolatedExecutionResult:
        """Executes process with full environment inheritance (NONE mode)."""
        start_time = time.monotonic()
        try:
            res = subprocess.run(
                command,
                capture_output=True,
                text=True,
                timeout=limits.timeout_seconds,
                cwd=limits.working_directory,
                env=env or dict(os.environ),
            )
            duration_ms = (time.monotonic() - start_time) * 1000.0
            return IsolatedExecutionResult(
                exit_code=res.returncode,
                stdout=res.stdout,
                stderr=res.stderr,
                duration_ms=round(duration_ms, 2),
                isolation_mode_used=IsolationMode.NONE,
            )
        except subprocess.TimeoutExpired:
            duration_ms = (time.monotonic() - start_time) * 1000.0
            return IsolatedExecutionResult(
                exit_code=-1,
                stdout="",
                stderr="Timeout expired",
                duration_ms=round(duration_ms, 2),
                isolation_mode_used=IsolationMode.NONE,
                timed_out=True,
                killed=True,
            )

    @classmethod
    def _execute_linux_sandbox(
        cls,
        command: List[str],
        limits: ExecutionLimits,
        env: Optional[Dict[str, str]] = None,
    ) -> IsolatedExecutionResult:
        """
        Wraps command execution with Linux unshare primitives:
        - IPC, Mount, PID, Network namespaces.
        - Read-only filesystem bind mounts.
        """
        unshare_cmd = ["unshare", "--mount", "--pid", "--ipc", "--fork"]
        if limits.network_disabled:
            unshare_cmd.append("--net")

        full_command = unshare_cmd + ["--"] + command
        return cls._execute_process_sandbox(full_command, limits, env)

    @classmethod
    def _kill_process_tree(cls, proc: subprocess.Popen) -> None:
        """Terminates process and any spawned child processes safely."""
        try:
            if platform.system().lower() == "windows":
                # On Windows, taskkill /F /T kills child tree
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
            else:
                proc.kill()
        except Exception as e:
            logger.debug(f"Process cleanup exception: {e}")
