"""
SICTACK Backend — Distributed Concurrency & Quota Enforcement Tests (Phase 5B).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Atomic, concurrency-safe quota enforcement preventing simultaneous requests from exceeding limits.
2. Distributed nonce deduplication preventing replay attacks across concurrent workers.
3. Sliding-window distributed rate limiting.
4. Strict fail-closed behavior when distributed infrastructure is unavailable.
"""

from __future__ import annotations

import concurrent.futures
import os
import pytest
from unittest.mock import patch, MagicMock

from sictack.coordination.state_sync import (
    DistributedStateError,
    RedisStateSyncBackend,
    ThreadLockStateSyncBackend,
    get_state_sync_coordinator,
)


def test_atomic_quota_enforcement_concurrency():
    """Verify that concurrent requests cannot exceed organization quota entitlement."""
    backend = ThreadLockStateSyncBackend()
    org_id = "org_concurrency_test_01"
    quota_limit = 5
    total_workers = 25

    backend.reset_quota(org_id)

    results = []

    def _worker(worker_id: int):
        allowed, count, limit = backend.consume_quota(org_id, limit=quota_limit, amount=1)
        return allowed, count, limit

    with concurrent.futures.ThreadPoolExecutor(max_workers=total_workers) as executor:
        futures = [executor.submit(_worker, i) for i in range(total_workers)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    allowed_count = sum(1 for res in results if res[0] is True)
    denied_count = sum(1 for res in results if res[0] is False)

    assert allowed_count == quota_limit, f"Expected exactly {quota_limit} allowed, got {allowed_count}"
    assert denied_count == total_workers - quota_limit, f"Expected {total_workers - quota_limit} denied, got {denied_count}"


def test_concurrent_nonce_replay_protection():
    """Verify that multiple concurrent submissions of the identical nonce allow strictly ONE."""
    backend = ThreadLockStateSyncBackend()
    test_nonce = "nonce_fixed_test_abc123xyz"
    total_attempts = 15

    results = []

    def _register():
        return backend.register_nonce(test_nonce, ttl_seconds=60)

    with concurrent.futures.ThreadPoolExecutor(max_workers=total_attempts) as executor:
        futures = [executor.submit(_register) for _ in range(total_attempts)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())

    # Exactly one should have returned True; all others False
    successes = sum(1 for r in results if r is True)
    replays = sum(1 for r in results if r is False)

    assert successes == 1, f"Expected exactly 1 nonce registration, got {successes}"
    assert replays == total_attempts - 1, f"Expected {total_attempts - 1} replays blocked, got {replays}"


def test_sliding_window_rate_limiting():
    """Verify sliding-window rate limit enforces maximum request frequency."""
    backend = ThreadLockStateSyncBackend()
    rate_key = "rate_limit_tenant_alpha"
    limit = 3

    # First 3 requests must pass
    for i in range(limit):
        allowed, count, retry = backend.check_rate_limit(rate_key, max_requests=limit, window_seconds=10)
        assert allowed is True
        assert count == i + 1
        assert retry == 0.0

    # 4th request must be rejected
    allowed, count, retry = backend.check_rate_limit(rate_key, max_requests=limit, window_seconds=10)
    assert allowed is False
    assert count == limit
    assert retry > 0.0


def test_redis_strict_distributed_fail_closed(monkeypatch):
    """Verify that when strict distributed mode is enabled and Redis is unavailable, operations fail closed."""
    monkeypatch.setenv("SICTACK_STRICT_DISTRIBUTED", "1")

    # Instantiate RedisStateSyncBackend with non-existent Redis URL
    backend = RedisStateSyncBackend(redis_url="redis://localhost:9999/0")

    # Quota check must fail closed with DistributedStateError
    with pytest.raises(DistributedStateError, match=r"unavailable in strict distributed mode"):
        backend.consume_quota("org_strict_test", limit=100)

    # Rate limit check must fail closed
    with pytest.raises(DistributedStateError, match=r"unavailable in strict distributed mode"):
        backend.check_rate_limit("key_strict_test", max_requests=10)
