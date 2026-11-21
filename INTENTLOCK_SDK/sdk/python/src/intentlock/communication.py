"""
INTENTLOCK (Backward Compatibility) — Authenticated Inter-Agent Communication Forwarder.

Re-exports communication models, brokers, and exceptions directly from `sictack.communication`.
"""

from __future__ import annotations

import sictack.communication as _sictack_comm
from sictack.communication import (
    MessageEnvelope,
    AgentCommunicationBroker,
    MessageError,
    MessageAuthenticationError,
    MessageReplayError,
    ExpiredMessageError,
    UnauthorizedCommunicationError,
)

# Compatibility aliases
AgentMessage = MessageEnvelope

__all__ = [
    "MessageEnvelope",
    "AgentMessage",
    "AgentCommunicationBroker",
    "MessageError",
    "MessageAuthenticationError",
    "MessageReplayError",
    "ExpiredMessageError",
    "UnauthorizedCommunicationError",
]
