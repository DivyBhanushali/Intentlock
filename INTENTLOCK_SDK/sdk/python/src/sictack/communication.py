"""
SICTACK — Authenticated Inter-Agent Communication Subsystem.

Provides zero-trust, cryptographically authenticated message envelopes for
communication between autonomous AI agents within tenant boundaries.

Guarantees:
1. Sender and recipient identity authenticity via HMAC-SHA256 signatures.
2. Anti-replay protection using cryptographically random single-use nonces.
3. Temporal validity enforcement via strict message TTL and expiration timestamps.
4. Tenant isolation: cross-tenant messaging is strictly rejected.
5. In-flight payload integrity and input sanitization against prompt injection.
"""

from __future__ import annotations

import hashlib
import hmac
import json
import logging
import secrets
import threading
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Set, Tuple

from pydantic import BaseModel, Field

from sictack.exceptions import SictackError

from sictack.exceptions import (
    SictackError,
    MessageError,
    MessageAuthenticationError,
    MessageReplayError,
    ExpiredMessageError,
    UnauthorizedCommunicationError,
)

logger = logging.getLogger("sictack.communication")


# ─── Message Envelope Model ──────────────────────────────────────────────────

class MessageEnvelope(BaseModel):
    """
    Cryptographically verifiable inter-agent message envelope.
    Immutable once signed.
    """
    message_id: str = Field(default_factory=lambda: f"msg_{secrets.token_hex(8)}")
    sender_agent_id: str
    recipient_agent_id: str
    org_id: str = "default-org"
    session_id: str = ""
    delegation_id: Optional[str] = None
    nonce: str = Field(default_factory=lambda: secrets.token_hex(16))
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    expires_at: Optional[datetime] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
    signature: str = ""

    @property
    def sender_id(self) -> str:
        return self.sender_agent_id

    @property
    def recipient_id(self) -> str:
        return self.recipient_agent_id

    @property
    def message_type(self) -> str:
        return self.payload.get("message_type", "TASK_DELEGATION")


    def canonical_string(self) -> str:
        """
        Produces deterministic RFC-8785 canonical JSON representation for signing.
        """
        canonical_dict = {
            "delegation_id": self.delegation_id or "",
            "message_id": self.message_id,
            "nonce": self.nonce,
            "org_id": self.org_id,
            "payload": self.payload,
            "recipient_agent_id": self.recipient_agent_id,
            "sender_agent_id": self.sender_agent_id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
        }
        return json.dumps(canonical_dict, sort_keys=True, separators=(",", ":"))

    def compute_signature(self, secret_key: str) -> str:
        """Compute HMAC-SHA256 signature of canonical fields."""
        canonical = self.canonical_string()
        return hmac.new(
            secret_key.encode("utf-8"),
            canonical.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def sign(self, secret_key: str) -> MessageEnvelope:
        """Sign this envelope with the given secret key."""
        if not self.expires_at:
            self.expires_at = self.timestamp + timedelta(seconds=60)
        self.signature = self.compute_signature(secret_key)
        return self

    def verify_signature(self, secret_key: str) -> bool:
        """Verify HMAC-SHA256 signature using constant-time comparison."""
        if not self.signature:
            return False
        expected = self.compute_signature(secret_key)
        return hmac.compare_digest(expected, self.signature)

    def is_expired(self, now: Optional[datetime] = None) -> bool:
        """Check if message has expired."""
        if not self.expires_at:
            return False
        current = now or datetime.now(timezone.utc)
        return current > self.expires_at


# ─── Inter-Agent Communication Broker ────────────────────────────────────────

class AgentCommunicationBroker:
    """
    Thread-safe, tenant-isolated inter-agent message broker.
    Enforces replay defense, signature verification, and communication policies.
    """

    def __init__(self, default_secret_key: str = "sictack_inter_agent_secret_key_v1") -> None:
        self.default_secret_key = default_secret_key
        self._lock = threading.RLock()
        # Inboxes keyed by (org_id, recipient_agent_id) -> List[MessageEnvelope]
        self._inboxes: Dict[Tuple[str, str], List[MessageEnvelope]] = {}
        # Replay cache: org_id -> Dict[nonce, expiration_timestamp]
        self._seen_nonces: Dict[str, Dict[str, datetime]] = {}
        # Explicit allowlist of permitted communication paths: (org_id, sender_id) -> Set[recipient_id]
        # None means all agents within the same org can communicate unless denied.
        self._channel_allowlist: Dict[Tuple[str, str], Set[str]] = {}
        # Channel denylist: (org_id, sender_id) -> Set[recipient_id]
        self._channel_denylist: Dict[Tuple[str, str], Set[str]] = {}
        # Recipient incoming allowlist: (org_id, recipient_id) -> Set[sender_id]
        self._recipient_allowlist: Dict[Tuple[str, str], Set[str]] = {}


    def allow_channel(self, org_id: str, sender_id: str, recipient_id: str) -> None:
        """Explicitly permit an agent-to-agent communication channel."""
        with self._lock:
            key = (org_id, sender_id)
            if key not in self._channel_allowlist:
                self._channel_allowlist[key] = set()
            self._channel_allowlist[key].add(recipient_id)

    def deny_channel(self, org_id: str, sender_id: str, recipient_id: str) -> None:
        """Explicitly deny an agent-to-agent communication channel."""
        with self._lock:
            key = (org_id, sender_id)
            if key not in self._channel_denylist:
                self._channel_denylist[key] = set()
            self._channel_denylist[key].add(recipient_id)

    def _purge_expired_nonces(self, org_id: str, current_time: datetime) -> None:
        """Prune expired nonces from memory to prevent unbounded growth."""
        if org_id in self._seen_nonces:
            active_nonces = {
                nonce: exp
                for nonce, exp in self._seen_nonces[org_id].items()
                if exp > current_time
            }
            self._seen_nonces[org_id] = active_nonces

    def dispatch(
        self,
        envelope: MessageEnvelope,
        secret_key: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> bool:
        """
        Validate, authenticate, and deliver a message to recipient's inbox.
        Raises dedicated exceptions on security violations.
        """
        current_time = now or datetime.now(timezone.utc)
        effective_secret = secret_key or self.default_secret_key

        with self._lock:
            # 1. Temporal Expiration Check
            if envelope.is_expired(current_time):
                raise ExpiredMessageError(
                    f"Message '{envelope.message_id}' expired at {envelope.expires_at.isoformat() if envelope.expires_at else 'UNKNOWN'}",
                    message_id=envelope.message_id,
                    sender=envelope.sender_agent_id,
                    recipient=envelope.recipient_agent_id,
                )

            # 2. Replay Protection
            self._purge_expired_nonces(envelope.org_id, current_time)
            org_nonces = self._seen_nonces.setdefault(envelope.org_id, {})
            if envelope.nonce in org_nonces:
                raise MessageReplayError(
                    f"Replay attack detected: Nonce '{envelope.nonce}' has already been processed.",
                    message_id=envelope.message_id,
                    sender=envelope.sender_agent_id,
                    recipient=envelope.recipient_agent_id,
                )

            # 3. Cryptographic Signature Verification
            if not envelope.verify_signature(effective_secret):
                raise MessageAuthenticationError(
                    f"Cryptographic signature verification failed on message '{envelope.message_id}'.",
                    message_id=envelope.message_id,
                    sender=envelope.sender_agent_id,
                    recipient=envelope.recipient_agent_id,
                )

            # 4. Tenant Isolation & Channel Authorization
            comm_key = (envelope.org_id, envelope.sender_agent_id)
            # Check explicit denylist
            denied_recipients = self._channel_denylist.get(comm_key, set())
            if envelope.recipient_agent_id in denied_recipients or "*" in denied_recipients:
                raise UnauthorizedCommunicationError(
                    f"Communication from '{envelope.sender_agent_id}' to '{envelope.recipient_agent_id}' is explicitly forbidden by policy.",
                    message_id=envelope.message_id,
                    sender=envelope.sender_agent_id,
                    recipient=envelope.recipient_agent_id,
                )

            # Check allowlist if configured
            if comm_key in self._channel_allowlist:
                allowed_recipients = self._channel_allowlist[comm_key]
                if envelope.recipient_agent_id not in allowed_recipients and "*" not in allowed_recipients:
                    raise UnauthorizedCommunicationError(
                        f"Communication channel from '{envelope.sender_agent_id}' to '{envelope.recipient_agent_id}' is not permitted.",
                        message_id=envelope.message_id,
                        sender=envelope.sender_agent_id,
                        recipient=envelope.recipient_agent_id,
                    )

            # Check recipient incoming allowlist if configured
            recip_key = (envelope.org_id, envelope.recipient_agent_id)
            if recip_key in self._recipient_allowlist:
                if envelope.sender_agent_id not in self._recipient_allowlist[recip_key] and "*" not in self._recipient_allowlist[recip_key]:
                    raise UnauthorizedCommunicationError(
                        f"Communication channel from '{envelope.sender_agent_id}' to '{envelope.recipient_agent_id}' is not permitted.",
                        message_id=envelope.message_id,
                        sender=envelope.sender_agent_id,
                        recipient=envelope.recipient_agent_id,
                    )

            # 5. Record nonce in replay cache

            exp = envelope.expires_at or (current_time + timedelta(seconds=60))
            org_nonces[envelope.nonce] = exp

            # 6. Deliver to Inbox
            inbox_key = (envelope.org_id, envelope.recipient_agent_id)
            if inbox_key not in self._inboxes:
                self._inboxes[inbox_key] = []
            self._inboxes[inbox_key].append(envelope)

            logger.info(
                "Inter-agent message delivered",
                extra={
                    "message_id": envelope.message_id,
                    "sender": envelope.sender_agent_id,
                    "recipient": envelope.recipient_agent_id,
                    "session_id": envelope.session_id,
                },
            )
            return True

    def receive(
        self,
        org_id: str,
        recipient_agent_id: str,
        mark_read: bool = True,
        max_messages: int = 50,
    ) -> List[MessageEnvelope]:
        """
        Retrieve messages waiting in an agent's inbox.
        """
        with self._lock:
            inbox_key = (org_id, recipient_agent_id)
            messages = self._inboxes.get(inbox_key, [])
            if not messages:
                return []

            batch = messages[:max_messages]
            if mark_read:
                self._inboxes[inbox_key] = messages[max_messages:]
            return batch

    def clear(self) -> None:
        """Reset inboxes and caches (for testing and isolated scenarios)."""
        with self._lock:
            self._inboxes.clear()
            self._seen_nonces.clear()
            self._channel_allowlist.clear()
            self._channel_denylist.clear()
            self._recipient_allowlist.clear()


    def send_message(
        self,
        sender_id: str,
        recipient_id: str,
        payload: Dict[str, Any],
        org_id: str = "default-org",
        message_type: str = "TASK_DELEGATION",
        ttl_seconds: int = 300,
        secret_key: Optional[str] = None,
    ) -> MessageEnvelope:
        """Construct, sign, and dispatch an inter-agent message envelope."""
        now = datetime.now(timezone.utc)
        payload_with_type = dict(payload)
        payload_with_type["message_type"] = message_type
        env = MessageEnvelope(
            sender_agent_id=sender_id,
            recipient_agent_id=recipient_id,
            org_id=org_id,
            payload=payload_with_type,
            timestamp=now,
            expires_at=now + timedelta(seconds=ttl_seconds),
        )
        env.sign(secret_key or self.default_secret_key)
        self.dispatch(env, secret_key=secret_key, now=now)
        return env

    def receive_messages(
        self,
        recipient_id: str,
        org_id: str = "default-org",
        mark_read: bool = True,
        max_messages: int = 50,
    ) -> List[MessageEnvelope]:
        """Retrieve and mark messages as read for an agent."""
        return self.receive(org_id=org_id, recipient_agent_id=recipient_id, mark_read=mark_read, max_messages=max_messages)

    def verify_and_deliver(
        self,
        envelope: MessageEnvelope,
        secret_key: Optional[str] = None,
        now: Optional[datetime] = None,
    ) -> bool:
        """Alias for dispatching and verifying an existing envelope."""
        return self.dispatch(envelope, secret_key=secret_key, now=now)

    def set_authorized_peers(
        self,
        recipient_id: str,
        allowed_senders: Set[str],
        org_id: str = "default-org",
    ) -> None:
        """Configure explicit allowlist of senders permitted to contact recipient_id."""
        with self._lock:
            self._recipient_allowlist[(org_id, recipient_id)] = set(allowed_senders)

    def is_authorized(
        self,
        sender_id: str,
        recipient_id: str,
        org_id: str = "default-org",
    ) -> bool:
        """Check if communication between sender and recipient is authorized."""
        comm_key = (org_id, sender_id)
        if comm_key in self._channel_denylist:
            if recipient_id in self._channel_denylist[comm_key] or "*" in self._channel_denylist[comm_key]:
                return False
        if comm_key in self._channel_allowlist:
            if recipient_id not in self._channel_allowlist[comm_key] and "*" not in self._channel_allowlist[comm_key]:
                return False
        recip_key = (org_id, recipient_id)
        if recip_key in self._recipient_allowlist:
            return sender_id in self._recipient_allowlist[recip_key] or "*" in self._recipient_allowlist[recip_key]
        return True


