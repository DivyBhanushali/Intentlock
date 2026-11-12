"""
INTENTLOCK – Approval Service.

Manages the lifecycle of human-approval requests.  Each request is bound
to a specific action hash and is single-use: once consumed by
:meth:`consume`, it cannot be reused.

Thread safety is ensured via a :class:`threading.Lock`.
"""

from __future__ import annotations

import threading
from datetime import datetime, timedelta, timezone

from intentlock.exceptions import (
    ApprovalExpiredError,
    ApprovalMismatchError,
    ApprovalReplayError,
    IntentLockError,
)
from intentlock.logger import get_logger
from intentlock.models import ApprovalRequest, ApprovalStatus, ToolCall

_log = get_logger(__name__)


class ApprovalService:
    """In-memory, thread-safe approval request manager."""

    def __init__(self, timeout_seconds: int = 300) -> None:
        if timeout_seconds < 1:
            raise ValueError("timeout_seconds must be positive")
        self._timeout_seconds: int = timeout_seconds
        self._lock = threading.Lock()
        self._requests: dict[str, ApprovalRequest] = {}

    # ------------------------------------------------------------------
    # Create
    # ------------------------------------------------------------------

    def create_request(self, tool_call: ToolCall) -> ApprovalRequest:
        """
        Generate a new pending approval request for *tool_call*.

        Returns the :class:`ApprovalRequest` with a unique ``approval_id``
        and an ``expires_at`` computed from the configured timeout.
        """
        now = datetime.now(timezone.utc)
        request = ApprovalRequest(
            action_hash=tool_call.canonical_hash(),
            tool_name=tool_call.tool_name,
            agent_id=tool_call.agent_id,
            status=ApprovalStatus.PENDING,
            created_at=now,
            expires_at=now + timedelta(seconds=self._timeout_seconds),
        )

        with self._lock:
            self._requests[request.approval_id] = request

        _log.info(
            "Approval request created",
            extra={
                "approval_id": request.approval_id,
                "tool_name": tool_call.tool_name,
                "agent_id": tool_call.agent_id,
                "expires_at": request.expires_at.isoformat(),
            },
        )
        return request

    def get_request(self, approval_id: str) -> ApprovalRequest | None:
        """Return the approval request with the given ID, or None if not found."""
        with self._lock:
            return self._requests.get(approval_id)

    # ------------------------------------------------------------------
    # Resolve
    # ------------------------------------------------------------------

    def approve(self, approval_id: str, approver_id: str) -> ApprovalRequest:
        """
        Mark a pending request as APPROVED.

        Raises
        ------
        IntentLockError
            If the request does not exist.
        ApprovalExpiredError
            If the request has expired.
        IntentLockError
            If the request is not in PENDING state.
        """
        return self._resolve(approval_id, approver_id, ApprovalStatus.APPROVED)

    def reject(self, approval_id: str, approver_id: str) -> ApprovalRequest:
        """
        Mark a pending request as REJECTED.

        Same error conditions as :meth:`approve`.
        """
        return self._resolve(approval_id, approver_id, ApprovalStatus.REJECTED)

    # ------------------------------------------------------------------
    # Consume (single-use enforcement)
    # ------------------------------------------------------------------

    def consume(
        self,
        approval_id: str,
        expected_action_hash: str,
    ) -> ApprovalRequest:
        """
        Consume an approved request, marking it as used.

        Raises
        ------
        IntentLockError
            If *approval_id* does not exist.
        ApprovalExpiredError
            If the request has expired.
        ApprovalReplayError
            If the request has already been consumed.
        ApprovalMismatchError
            If *expected_action_hash* does not match the stored hash.
        IntentLockError
            If the request is not APPROVED.
        """
        with self._lock:
            request = self._get_locked(approval_id)

            # Expiry check.
            if datetime.now(timezone.utc) >= request.expires_at:
                request.status = ApprovalStatus.EXPIRED
                raise ApprovalExpiredError(
                    f"Approval '{approval_id}' has expired",
                    approval_id=approval_id,
                )

            # Replay check.
            if request.consumed:
                raise ApprovalReplayError(
                    f"Approval '{approval_id}' has already been consumed",
                    approval_id=approval_id,
                )

            # Hash-binding check.
            if request.action_hash != expected_action_hash:
                raise ApprovalMismatchError(
                    f"Approval '{approval_id}' action hash mismatch",
                    approval_id=approval_id,
                    expected_hash=request.action_hash,
                    actual_hash=expected_action_hash,
                )

            # Status check.
            if request.status != ApprovalStatus.APPROVED:
                raise IntentLockError(
                    f"Approval '{approval_id}' is not approved (status={request.status.value})"
                )

            # Mark consumed.
            request.consumed = True
            _log.info(
                "Approval consumed",
                extra={"approval_id": approval_id},
            )
            return request

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def get(self, approval_id: str) -> ApprovalRequest:
        """
        Return the request with *approval_id*.

        Raises :class:`IntentLockError` if not found.
        """
        with self._lock:
            return self._get_locked(approval_id)

    def list_pending(self) -> list[ApprovalRequest]:
        """Return all requests that are still PENDING and not expired."""
        now = datetime.now(timezone.utc)
        with self._lock:
            result: list[ApprovalRequest] = []
            for req in self._requests.values():
                if req.status == ApprovalStatus.PENDING and now < req.expires_at:
                    result.append(req)
            return result

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_locked(self, approval_id: str) -> ApprovalRequest:
        """Return the request or raise.  Caller MUST hold ``self._lock``."""
        try:
            return self._requests[approval_id]
        except KeyError:
            raise IntentLockError(
                f"Approval request '{approval_id}' not found"
            ) from None

    def _resolve(
        self,
        approval_id: str,
        approver_id: str,
        target_status: ApprovalStatus,
    ) -> ApprovalRequest:
        """Shared logic for approve / reject."""
        now = datetime.now(timezone.utc)
        with self._lock:
            request = self._get_locked(approval_id)

            if now >= request.expires_at:
                request.status = ApprovalStatus.EXPIRED
                raise ApprovalExpiredError(
                    f"Approval '{approval_id}' has expired",
                    approval_id=approval_id,
                )

            if request.status != ApprovalStatus.PENDING:
                raise IntentLockError(
                    f"Approval '{approval_id}' is not pending (status={request.status.value})"
                )

            request.status = target_status
            request.resolved_at = now
            request.resolved_by = approver_id

            _log.info(
                f"Approval {target_status.value.lower()}",
                extra={
                    "approval_id": approval_id,
                    "approver_id": approver_id,
                },
            )
            return request
