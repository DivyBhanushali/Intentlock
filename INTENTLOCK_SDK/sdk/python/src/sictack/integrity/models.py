"""
SICTACK Execution Request Integrity — Models & Digest Specification (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."
"""

from __future__ import annotations

import hashlib
import hmac
import json
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class ExecutionIntegrityDigest(BaseModel):
    """
    Cryptographic digest binding an approved tool execution request to its exact
    runtime execution context, eliminating Time-of-Check/Time-of-Use (TOCTOU) vectors.
    """
    digest_id: str = Field(default_factory=lambda: f"eid_{secrets.token_hex(12)}")
    org_id: str
    agent_id: str
    session_id: str
    tool_name: str
    canonical_arguments_hash: str
    policy_version: int
    delegation_id: Optional[str] = None
    approval_id: Optional[str] = None
    nonce: str = Field(default_factory=lambda: secrets.token_hex(16))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    signature: str = ""

    def canonical_string(self) -> str:
        """Deterministic canonical representation for cryptographic integrity."""
        iso_ts = self.timestamp.isoformat() if hasattr(self.timestamp, "isoformat") else str(self.timestamp)
        return (
            f"org={self.org_id}|agent={self.agent_id}|sess={self.session_id}|"
            f"tool={self.tool_name}|args_hash={self.canonical_arguments_hash}|"
            f"pol_v={self.policy_version}|delg={self.delegation_id or ''}|"
            f"appr={self.approval_id or ''}|nonce={self.nonce}|ts={iso_ts}"
        )

    def compute_signature(self, secret_key: str) -> str:
        """Compute HMAC-SHA256 signature over the canonical representation."""
        return hmac.new(
            secret_key.encode("utf-8"),
            self.canonical_string().encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def verify_signature(self, secret_key: str) -> bool:
        """Verify HMAC-SHA256 signature."""
        expected = self.compute_signature(secret_key)
        return hmac.compare_digest(self.signature, expected)


class ExecutionIntegrityResult(BaseModel):
    """Outcome of execution boundary integrity verification."""
    is_valid: bool
    status: str  # VALID, TAMPERED_ARGUMENTS, STALE_POLICY, REPLAY_ATTACK, EXPIRED_APPROVAL, SCOPE_MISMATCH
    reason: str
    digest_id: Optional[str] = None
    policy_version_verified: bool = False
    approval_bound: bool = False
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
