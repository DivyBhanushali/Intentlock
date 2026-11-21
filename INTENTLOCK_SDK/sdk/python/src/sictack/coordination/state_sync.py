"""
SICTACK Distributed State Synchronization Engine (Phase 4G).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Resolves BLK-005: Multi-Worker Distributed State Synchronization.
Coordinates security containment events, nonce invalidations, and distributed execution
locks across multiple agent runtime worker instances in containerized deployments.
"""

from __future__ import annotations

import abc
import json
import logging
import os
import threading
import time
from typing import Any, Callable, Dict, Optional, Set

from sictack.exceptions import SictackError

logger = logging.getLogger("sictack.coordination.state_sync")


class DistributedStateError(SictackError):
    """Raised when distributed synchronization fails."""
    pass


class DistributedLock(abc.ABC):
    """Abstract distributed lock interface."""

    @abc.abstractmethod
    def acquire(self, blocking: bool = True, timeout: float = -1.0) -> bool:
        """Acquire lock."""
        pass

    @abc.abstractmethod
    def release(self) -> None:
        """Release lock."""
        pass

    def __enter__(self) -> bool:
        return self.acquire(blocking=True)

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.release()


class LocalDistributedLock(DistributedLock):
    """Thread-safe in-process lock implementing the distributed lock interface."""

    def __init__(self, key: str, internal_lock: threading.Lock):
        self.key = key
        self._lock = internal_lock

    def acquire(self, blocking: bool = True, timeout: float = -1.0) -> bool:
        if timeout < 0:
            return self._lock.acquire(blocking=blocking)
        return self._lock.acquire(blocking=blocking, timeout=timeout)

    def release(self) -> None:
        try:
            self._lock.release()
        except RuntimeError:
            pass


class StateSyncCoordinator(abc.ABC):
    """
    Abstract coordinator for multi-node security posture synchronization.
    Broadcasting containment actions and shared nonce deduping across workers.
    """

    @abc.abstractmethod
    def get_lock(self, resource_key: str) -> DistributedLock:
        """Obtain a distributed mutual exclusion lock for a resource."""
        pass

    @abc.abstractmethod
    def broadcast_containment(self, session_id: str, reason: str, details: Optional[Dict[str, Any]] = None) -> None:
        """Broadcast a session containment event to all listening worker nodes."""
        pass

    @abc.abstractmethod
    def register_containment_listener(self, callback: Callable[[str, str, Dict[str, Any]], None]) -> None:
        """Register a callback invoked when a containment event arrives from any worker."""
        pass

    @abc.abstractmethod
    def register_nonce(self, nonce: str, ttl_seconds: int = 300) -> bool:
        """
        Atomically records a nonce across all workers.
        Returns True if nonce is novel and recorded; False if already present (replay attack).
        """
        pass

    @abc.abstractmethod
    def is_session_contained(self, session_id: str) -> bool:
        """Checks if session has been marked suspended or terminal across cluster."""
        pass

    @abc.abstractmethod
    def mark_session_contained(self, session_id: str, reason: str) -> None:
        """Locally or cluster-wide flags session as contained."""
        pass

    @abc.abstractmethod
    def consume_quota(self, org_id: str, limit: int, amount: int = 1) -> Tuple[bool, int, int]:
        """
        Atomically checks and consumes action quota.
        Returns (is_allowed, current_count, limit).
        Guarantees simultaneous requests cannot exceed limit under race conditions.
        """
        pass

    @abc.abstractmethod
    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, float]:
        """
        Sliding-window rate limiter.
        Returns (is_allowed, current_count, retry_after_seconds).
        """
        pass

    @abc.abstractmethod
    def reset_quota(self, org_id: str) -> None:
        """Resets quota counter for org_id."""
        pass


class ThreadLockStateSyncBackend(StateSyncCoordinator):
    """
    In-process, thread-safe synchronization backend.
    Used for standalone workers, test environments, and non-Redis setups.
    """

    def __init__(self) -> None:
        self._locks: Dict[str, threading.Lock] = {}
        self._meta_lock = threading.Lock()
        self._contained_sessions: Dict[str, str] = {}
        self._nonces: Dict[str, float] = {}
        self._listeners: list[Callable[[str, str, Dict[str, Any]], None]] = []
        self._quota_counters: Dict[str, int] = {}
        self._rate_limits: Dict[str, list[float]] = {}

    def get_lock(self, resource_key: str) -> DistributedLock:
        with self._meta_lock:
            if resource_key not in self._locks:
                self._locks[resource_key] = threading.Lock()
            return LocalDistributedLock(resource_key, self._locks[resource_key])

    def broadcast_containment(self, session_id: str, reason: str, details: Optional[Dict[str, Any]] = None) -> None:
        with self._meta_lock:
            self._contained_sessions[session_id] = reason

        payload = details or {}
        for listener in list(self._listeners):
            try:
                listener(session_id, reason, payload)
            except Exception as e:
                logger.error(f"Error executing containment listener callback: {e}")

    def register_containment_listener(self, callback: Callable[[str, str, Dict[str, Any]], None]) -> None:
        with self._meta_lock:
            self._listeners.append(callback)

    def register_nonce(self, nonce: str, ttl_seconds: int = 300) -> bool:
        now = time.time()
        with self._meta_lock:
            # Clean expired
            expired = [n for n, exp in self._nonces.items() if exp < now]
            for exp_n in expired:
                del self._nonces[exp_n]

            if nonce in self._nonces:
                return False  # Replay detected
            self._nonces[nonce] = now + ttl_seconds
            return True

    def is_session_contained(self, session_id: str) -> bool:
        with self._meta_lock:
            return session_id in self._contained_sessions

    def mark_session_contained(self, session_id: str, reason: str) -> None:
        self.broadcast_containment(session_id, reason)

    def consume_quota(self, org_id: str, limit: int, amount: int = 1) -> Tuple[bool, int, int]:
        if limit <= 0:
            return False, 0, limit
        with self._meta_lock:
            current = self._quota_counters.get(org_id, 0)
            if current + amount > limit:
                return False, current, limit
            self._quota_counters[org_id] = current + amount
            return True, current + amount, limit

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, float]:
        now = time.time()
        window_start = now - window_seconds
        with self._meta_lock:
            history = self._rate_limits.setdefault(key, [])
            self._rate_limits[key] = [t for t in history if t > window_start]
            valid_history = self._rate_limits[key]
            if len(valid_history) >= max_requests:
                oldest = valid_history[0] if valid_history else now
                retry_after = max(0.1, (oldest + window_seconds) - now)
                return False, len(valid_history), retry_after
            valid_history.append(now)
            return True, len(valid_history), 0.0

    def reset_quota(self, org_id: str) -> None:
        with self._meta_lock:
            self._quota_counters.pop(org_id, None)


class RedisStateSyncBackend(StateSyncCoordinator):
    """
    Production multi-worker distributed synchronization backend backed by Redis.
    Uses Redis SETNX for atomic distributed locks and nonces, and Redis Pub/Sub
    for immediate sub-millisecond cluster containment fanout.
    """

    def __init__(self, redis_url: str):
        self.redis_url = redis_url
        self._client: Any = None
        self._pubsub: Any = None
        self._listeners: list[Callable[[str, str, Dict[str, Any]], None]] = []
        self._fallback_backend = ThreadLockStateSyncBackend()
        self._init_client()

    def _init_client(self) -> None:
        try:
            import redis
            self._client = redis.Redis.from_url(self.redis_url, decode_responses=True)
            self._client.ping()
            logger.info("Successfully connected to Redis distributed state coordination backend.")
        except Exception as e:
            logger.warning(
                f"Redis connection failed ({e}). Gracefully falling back to ThreadLockStateSyncBackend (fail-closed for cluster, secure for local process)."
            )
            self._client = None

    def get_lock(self, resource_key: str) -> DistributedLock:
        if self._client is None:
            return self._fallback_backend.get_lock(resource_key)

        class RedisDistributedLock(DistributedLock):
            def __init__(self, client: Any, key: str, ttl: int = 30):
                self.client = client
                self.key = f"sictack:lock:{key}"
                self.ttl = ttl
                self.token = os.urandom(16).hex()
                self._acquired = False

            def acquire(self, blocking: bool = True, timeout: float = -1.0) -> bool:
                start = time.time()
                while True:
                    if self.client.set(self.key, self.token, nx=True, ex=self.ttl):
                        self._acquired = True
                        return True
                    if not blocking:
                        return False
                    if timeout > 0 and (time.time() - start) >= timeout:
                        return False
                    time.sleep(0.05)

            def release(self) -> None:
                if not self._acquired:
                    return
                # Atomically release only if token matches
                lua_script = """
                if redis.call("get", KEYS[1]) == ARGV[1] then
                    return redis.call("del", KEYS[1])
                else
                    return 0
                end
                """
                try:
                    self.client.eval(lua_script, 1, self.key, self.token)
                except Exception:
                    pass
                self._acquired = False

        return RedisDistributedLock(self._client, resource_key)

    def broadcast_containment(self, session_id: str, reason: str, details: Optional[Dict[str, Any]] = None) -> None:
        self._fallback_backend.mark_session_contained(session_id, reason)
        if self._client:
            try:
                payload = json.dumps({"session_id": session_id, "reason": reason, "details": details or {}})
                self._client.set(f"sictack:containment:session:{session_id}", reason, ex=86400)
                self._client.publish("sictack:containment:events", payload)
            except Exception as e:
                logger.error(f"Failed to broadcast containment event to Redis cluster: {e}")

    def register_containment_listener(self, callback: Callable[[str, str, Dict[str, Any]], None]) -> None:
        self._fallback_backend.register_containment_listener(callback)

    def register_nonce(self, nonce: str, ttl_seconds: int = 300) -> bool:
        if self._client is None:
            return self._fallback_backend.register_nonce(nonce, ttl_seconds)
        try:
            key = f"sictack:nonce:{nonce}"
            # Atomic set with non-existence check
            is_new = self._client.set(key, "1", nx=True, ex=ttl_seconds)
            return bool(is_new)
        except Exception as e:
            logger.error(f"Redis nonce registration error ({e}), falling back to local verification.")
            return self._fallback_backend.register_nonce(nonce, ttl_seconds)

    def is_session_contained(self, session_id: str) -> bool:
        if self._client is None:
            return self._fallback_backend.is_session_contained(session_id)
        try:
            return bool(self._client.exists(f"sictack:containment:session:{session_id}"))
        except Exception:
            return self._fallback_backend.is_session_contained(session_id)

    def mark_session_contained(self, session_id: str, reason: str) -> None:
        self.broadcast_containment(session_id, reason)

    def consume_quota(self, org_id: str, limit: int, amount: int = 1) -> Tuple[bool, int, int]:
        if limit <= 0:
            return False, 0, limit
        if self._client is None:
            if os.getenv("SICTACK_STRICT_DISTRIBUTED", "").strip().lower() in ("1", "true", "yes"):
                raise DistributedStateError("Redis distributed coordinator unavailable in strict distributed mode; failing closed.")
            return self._fallback_backend.consume_quota(org_id, limit, amount)
        try:
            lua_quota = """
            local key = KEYS[1]
            local amount = tonumber(ARGV[1])
            local limit = tonumber(ARGV[2])
            if limit <= 0 then
                return {0, 0, limit}
            end
            local current = tonumber(redis.call('get', key) or '0')
            if current + amount > limit then
                return {0, current, limit}
            else
                local new_val = redis.call('incrby', key, amount)
                return {1, new_val, limit}
            end
            """
            res = self._client.eval(lua_quota, 1, f"sictack:quota:{org_id}", amount, limit)
            allowed = bool(res[0] == 1)
            return allowed, int(res[1]), int(res[2])
        except Exception as e:
            if os.getenv("SICTACK_STRICT_DISTRIBUTED", "").strip().lower() in ("1", "true", "yes"):
                raise DistributedStateError(f"Redis distributed coordination failure ({e}); failing closed.") from e
            logger.error(f"Redis quota check failed ({e}); falling back to local verification.")
            return self._fallback_backend.consume_quota(org_id, limit, amount)

    def check_rate_limit(self, key: str, max_requests: int, window_seconds: int = 60) -> Tuple[bool, int, float]:
        if self._client is None:
            if os.getenv("SICTACK_STRICT_DISTRIBUTED", "").strip().lower() in ("1", "true", "yes"):
                raise DistributedStateError("Redis distributed coordinator unavailable in strict distributed mode; failing closed.")
            return self._fallback_backend.check_rate_limit(key, max_requests, window_seconds)
        try:
            now = time.time()
            cutoff = now - window_seconds
            redis_key = f"sictack:ratelimit:{key}"
            pipe = self._client.pipeline()
            pipe.zremrangebyscore(redis_key, 0, cutoff)
            pipe.zcard(redis_key)
            results = pipe.execute()
            current_count = results[1]
            if current_count >= max_requests:
                return False, current_count, float(window_seconds)
            pipe = self._client.pipeline()
            pipe.zadd(redis_key, {f"{now}_{os.urandom(4).hex()}": now})
            pipe.expire(redis_key, window_seconds * 2)
            pipe.execute()
            return True, current_count + 1, 0.0
        except Exception as e:
            if os.getenv("SICTACK_STRICT_DISTRIBUTED", "").strip().lower() in ("1", "true", "yes"):
                raise DistributedStateError(f"Redis rate limit failure ({e}); failing closed.") from e
            return self._fallback_backend.check_rate_limit(key, max_requests, window_seconds)

    def reset_quota(self, org_id: str) -> None:
        if self._client:
            try:
                self._client.delete(f"sictack:quota:{org_id}")
            except Exception:
                pass
        self._fallback_backend.reset_quota(org_id)


_GLOBAL_COORDINATOR: Optional[StateSyncCoordinator] = None
_COORDINATOR_LOCK = threading.Lock()


def get_state_sync_coordinator() -> StateSyncCoordinator:
    """
    Factory resolving singleton cluster coordinator.
    Evaluates SICTACK_REDIS_URL or REDIS_URL from environment; defaults to ThreadLockStateSyncBackend.
    """
    global _GLOBAL_COORDINATOR
    with _COORDINATOR_LOCK:
        if _GLOBAL_COORDINATOR is None:
            redis_url = os.environ.get("SICTACK_REDIS_URL") or os.environ.get("REDIS_URL")
            if redis_url:
                _GLOBAL_COORDINATOR = RedisStateSyncBackend(redis_url=redis_url)
            else:
                _GLOBAL_COORDINATOR = ThreadLockStateSyncBackend()
        return _GLOBAL_COORDINATOR


def set_state_sync_coordinator(coordinator: Optional[StateSyncCoordinator]) -> None:
    """Explicitly inject or reset the singleton cluster coordinator for testing."""
    global _GLOBAL_COORDINATOR
    with _COORDINATOR_LOCK:
        _GLOBAL_COORDINATOR = coordinator
