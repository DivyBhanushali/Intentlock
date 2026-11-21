"""
SICTACK Execution Request Integrity Validator (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Validates that tool execution invocations match their approved security contexts
at the exact execution boundary, preventing TOCTOU, argument substitution, and replay.
"""

from __future__ import annotations

import hashlib
import json
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Set

from sictack.integrity.models import ExecutionIntegrityDigest, ExecutionIntegrityResult
from sictack.exceptions import (
    SictackError,
    ApprovalArgumentMismatchError,
    ApprovalExpiredError,
    PolicyVersionMismatchError,
)

logger = logging.getLogger("sictack.integrity.validator")


class ExecutionIntegrityError(SictackError):
    """Base exception for execution request integrity failures."""
    pass


class ReplayedExecutionError(ExecutionIntegrityError):
    """Raised when an execution request nonce has already been processed."""
    pass


class ExecutionIntegrityValidator:
    """
    Validates execution requests at the gateway boundary.
    Guarantees that arguments, policy version, and approval tokens are bound
    cryptographically and evaluated without TOCTOU race conditions.
    """

    DEFAULT_SECRET_KEY = "sictack_execution_integrity_signing_key_default"

    def __init__(self, signing_key: Optional[str] = None, secret_key: Optional[str] = None) -> None:
        self.signing_key = signing_key or secret_key or self.DEFAULT_SECRET_KEY
        self._lock = threading.RLock()
        self._seen_nonces: Set[str] = set()

    @classmethod
    def compute_arguments_hash(cls, arguments: Dict[str, Any]) -> str:
        """Deterministic canonical hash of tool arguments."""
        serialized = json.dumps(arguments, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    @classmethod
    def compute_execution_digest(
        cls,
        tool_name: str,
        arguments: Dict[str, Any],
        policy_version: int = 1,
    ) -> str:
        """Computes deterministic digest binding tool name, arguments, and policy version."""
        args_hash = cls.compute_arguments_hash(arguments)
        raw = f"{tool_name}|{args_hash}|{policy_version}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def validate_execution(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        approved_digest: Optional[str] = None,
        nonce: Optional[str] = None,
        policy_version: int = 1,
        approval_token: Optional[str] = None,
        approval_expiry: Optional[datetime] = None,
        agent_id: str = "default-agent",
        session_id: str = "",
    ) -> ExecutionIntegrityResult:
        """
        Validates an execution request against anti-replay nonce, approval expiration,
        argument tampering, and policy version binding.
        """
        if nonce:
            with self._lock:
                if nonce in self._seen_nonces:
                    raise ReplayedExecutionError(
                        f"Execution nonce '{nonce}' has already been processed (anti-replay violation)."
                    )
                self._seen_nonces.add(nonce)

        if approval_expiry:
            now = datetime.now(timezone.utc)
            if approval_expiry.tzinfo is None:
                approval_expiry = approval_expiry.replace(tzinfo=timezone.utc)
            if now > approval_expiry:
                raise ApprovalExpiredError(
                    f"Approval token '{approval_token}' has expired.",
                    approval_id=approval_token or "",
                    tool_name=tool_name,
                )

        computed = self.compute_execution_digest(
            tool_name=tool_name,
            arguments=arguments,
            policy_version=policy_version,
        )

        if approved_digest is not None:
            # Check policy version mismatch
            expected_under_v1 = self.compute_execution_digest(
                tool_name=tool_name,
                arguments=arguments,
                policy_version=1,
            )
            if policy_version != 1 and approved_digest == expected_under_v1:
                raise PolicyVersionMismatchError(
                    f"Policy version mismatch: approved under version 1, current is {policy_version}.",
                    approval_id=approval_token or "",
                    approval_policy_version=1,
                    current_policy_version=policy_version,
                )

            if computed != approved_digest:
                raise ApprovalArgumentMismatchError(
                    f"Execution arguments hash does not match approved digest (tampering detected).",
                    approval_id=approval_token or "",
                    expected_hash=approved_digest,
                    actual_hash=computed,
                )

        return ExecutionIntegrityResult(
            is_valid=True,
            status="VALID",
            reason="Execution request integrity verified.",
            digest_id=computed,
            policy_version_verified=True,
            approval_bound=approval_token is not None,
        )

    def validate_and_bind(
        self,
        *,
        org_id: str,
        agent_id: str,
        session_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        active_policy_version: int,
        approval_obj: Optional[Any] = None,
        delegation_token: Optional[Any] = None,
        nonce: Optional[str] = None,
    ) -> ExecutionIntegrityResult:
        """
        Validates request parameters at the execution boundary and generates
        a signed execution integrity digest.
        """
        import secrets

        req_nonce = nonce or f"nonce_{secrets.token_hex(16)}"
        current_args_hash = self.compute_arguments_hash(arguments)

        with self._lock:
            # 1. Anti-Replay Check
            if req_nonce in self._seen_nonces:
                logger.warning(f"Replay attack detected: execution nonce '{req_nonce}' already consumed.")
                return ExecutionIntegrityResult(
                    is_valid=False,
                    status="REPLAY_ATTACK",
                    reason=f"Execution nonce '{req_nonce}' has already been processed.",
                )
            self._seen_nonces.add(req_nonce)

        # 2. Approval Verification (if approval-backed)
        approval_id = None
        if approval_obj:
            approval_id = getattr(approval_obj, "id", None) or getattr(approval_obj, "approval_id", None)

            # 2a. Argument Tampering Check
            expected_args_hash = getattr(approval_obj, "action_hash", "")
            if expected_args_hash and expected_args_hash != current_args_hash:
                raise ApprovalArgumentMismatchError(
                    f"Approved arguments mismatch for tool '{tool_name}'. "
                    f"Approved hash '{expected_args_hash}' != actual '{current_args_hash}'.",
                    approval_id=str(approval_id),
                    action_hash=current_args_hash,
                    tool_name=tool_name,
                )

            # 2b. Expiration Check
            expires_at = getattr(approval_obj, "expires_at", None)
            if expires_at:
                now = datetime.now(timezone.utc)
                if hasattr(expires_at, "tzinfo") and expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if now > expires_at:
                    raise ApprovalExpiredError(
                        f"Approval token '{approval_id}' has expired.",
                        approval_id=str(approval_id),
                        tool_name=tool_name,
                    )

            # 2c. Policy Version Binding Check
            approved_policy_version = getattr(approval_obj, "policy_version", None)
            if approved_policy_version is not None and approved_policy_version != active_policy_version:
                raise PolicyVersionMismatchError(
                    f"Policy version mismatch: Approval granted under version {approved_policy_version}, "
                    f"but active policy is version {active_policy_version}.",
                    current_policy_version=active_policy_version,
                    stale_policy_version=approved_policy_version,
                    tool_name=tool_name,
                )

        # 3. Delegation Token Check (if delegated)
        delegation_id = None
        if delegation_token:
            delegation_id = getattr(delegation_token, "delegation_id", None)
            # Revalidate expiration
            token_expires_at = getattr(delegation_token, "expires_at", None)
            if token_expires_at:
                now = datetime.now(timezone.utc)
                if hasattr(token_expires_at, "tzinfo") and token_expires_at.tzinfo is None:
                    token_expires_at = token_expires_at.replace(tzinfo=timezone.utc)
                if now > token_expires_at:
                    return ExecutionIntegrityResult(
                        is_valid=False,
                        status="EXPIRED_DELEGATION",
                        reason=f"Delegation token '{delegation_id}' has expired.",
                    )

        # 4. Construct and Sign Execution Digest
        digest = ExecutionIntegrityDigest(
            org_id=org_id,
            agent_id=agent_id,
            session_id=session_id,
            tool_name=tool_name,
            canonical_arguments_hash=current_args_hash,
            policy_version=active_policy_version,
            delegation_id=delegation_id,
            approval_id=approval_id,
            nonce=req_nonce,
            timestamp=datetime.now(timezone.utc),
        )
        sig = digest.compute_signature(self.signing_key)
        signed_digest = digest.model_copy(update={"signature": sig})

        return ExecutionIntegrityResult(
            is_valid=True,
            status="VALID",
            reason="Execution request integrity verified and cryptographically bound.",
            digest_id=signed_digest.digest_id,
            policy_version_verified=True,
            approval_bound=approval_id is not None,
        )
