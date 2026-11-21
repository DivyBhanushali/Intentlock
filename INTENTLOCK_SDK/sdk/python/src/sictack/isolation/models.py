"""
SICTACK Runtime Isolation Architecture — Models & Specifications (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."
"""

from __future__ import annotations

import enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class IsolationMode(str, enum.Enum):
    """Execution sandbox isolation levels."""
    NONE = "NONE"                     # Direct execution within agent process space
    PROCESS = "PROCESS"               # Dedicated subprocess with timeouts and stream limits
    LINUX_SANDBOX = "LINUX_SANDBOX"   # Kernel namespaces, seccomp, and unprivileged user sandbox


class ExecutionLimits(BaseModel):
    """Resource constraints enforced upon isolated execution targets."""
    timeout_seconds: float = 30.0
    max_memory_mb: int = 512
    max_cpu_percent: float = 80.0
    max_output_bytes: int = 1_048_576  # 1 MB maximum stdout/stderr capture
    network_disabled: bool = False
    working_directory: Optional[str] = None
    environment_allowlist: List[str] = Field(default_factory=lambda: ["PATH", "LANG", "TZ", "PYTHONPATH"])


class IsolatedExecutionResult(BaseModel):
    """Outcome of isolated tool invocation."""
    exit_code: int
    stdout: str
    stderr: str
    duration_ms: float
    isolation_mode_used: IsolationMode
    timed_out: bool = False
    killed: bool = False
    limits_exceeded: List[str] = Field(default_factory=list)

    @property
    def mode(self) -> IsolationMode:
        return self.isolation_mode_used
