"""
SICTACK Distributed State Synchronization & Cluster Coordination Package (Phase 4G).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."
"""

from sictack.coordination.state_sync import (
    DistributedLock,
    StateSyncCoordinator,
    ThreadLockStateSyncBackend,
    RedisStateSyncBackend,
    get_state_sync_coordinator,
)

__all__ = [
    "DistributedLock",
    "StateSyncCoordinator",
    "ThreadLockStateSyncBackend",
    "RedisStateSyncBackend",
    "get_state_sync_coordinator",
]
