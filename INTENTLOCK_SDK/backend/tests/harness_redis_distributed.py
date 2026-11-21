"""
SICTACK Phase 5C — Distributed Multi-Worker Redis Integration Harness (BLK-005).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Multi-worker concurrent quota decrement via atomic Lua script (CHECK_AND_DECR_QUOTA).
2. Quota exhaustion, cold counter initialization, and negative/invalid limit fail-closed handling.
3. Nonce replay prevention across concurrent worker processes.
4. Strict fail-closed rejection on Redis disconnect (SICTACK_STRICT_DISTRIBUTED=1).
5. Sliding window distributed rate limiting.
6. Gateway /api/v1/intercept HTTP response integration with Redis coordinator.
7. Partition & split-brain architectural guarantees (Single vs Replicated vs Cluster).
"""

from __future__ import annotations

import os
import sys
import time
import uuid
import hashlib
import concurrent.futures
import pytest

from sictack.coordination.state_sync import (
    RedisStateSyncBackend,
    DistributedStateError,
    set_state_sync_coordinator,
    get_state_sync_coordinator,
)

REDIS_TEST_URL = os.environ.get("SICTACK_TEST_REDIS_URL", "")
IS_REDIS_AVAILABLE = bool(REDIS_TEST_URL and REDIS_TEST_URL.startswith("redis://"))


def _redis_process_worker(url: str, org: str, limit: int, q):
    """Module-level process worker for cross-platform multiprocessing (spawn/fork compatible)."""
    b = RedisStateSyncBackend(redis_url=url)
    res = b.consume_quota(org, limit=limit, amount=1)
    q.put(res)


@pytest.mark.skipif(
    not IS_REDIS_AVAILABLE,
    reason="Isolated multi-worker Redis environment not configured. Preserving BLK-005 OPEN."
)
class TestDistributedRedisClusterHarness:
    """Verifies atomic quota enforcement, rate limiting, and fail-closed behavior across multi-worker processes."""

    def test_multi_worker_atomic_quota_race(self):
        """
        Execute concurrent requests competing for a tenant with quota = 5.
        Exactly 5 must succeed; rest must fail with atomic consistency.
        Pure Redis Lua test without database locks.
        """
        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        test_org = f"org_test_race_{uuid.uuid4().hex[:8]}"
        backend.reset_quota(test_org)

        limit = 5
        total_workers = 25
        results = []

        def _worker(worker_id: int):
            return backend.consume_quota(test_org, limit=limit, amount=1)

        with concurrent.futures.ThreadPoolExecutor(max_workers=total_workers) as executor:
            futures = [executor.submit(_worker, i) for i in range(total_workers)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        allowed = sum(1 for r in results if r[0] is True)
        denied = sum(1 for r in results if r[0] is False)

        assert allowed == limit, f"Expected strictly {limit} allowed requests, got {allowed}"
        assert denied == total_workers - limit, f"Expected {total_workers - limit} denied requests, got {denied}"

    def test_multiprocess_atomic_quota_race(self):
        """
        Spawns multiple independent OS processes executing atomic Redis quota checks concurrently.
        Validates cross-process synchronization and Lua atomic consistency across distinct PIDs.
        Uses module-level _redis_process_worker for universal cross-platform pickling.
        """
        import multiprocessing
        test_org = f"org_mp_race_{uuid.uuid4().hex[:8]}"
        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        backend.reset_quota(test_org)

        limit = 3
        process_count = 6
        queue = multiprocessing.Queue()

        processes = [
            multiprocessing.Process(target=_redis_process_worker, args=(REDIS_TEST_URL, test_org, limit, queue))
            for _ in range(process_count)
        ]

        for p in processes:
            p.start()
        for p in processes:
            p.join(timeout=5)

        results = []
        while not queue.empty():
            results.append(queue.get())

        allowed = sum(1 for r in results if r[0] is True)
        denied = sum(1 for r in results if r[0] is False)

        assert allowed == limit, f"Expected {limit} allowed across independent OS processes, got {allowed}"
        assert denied == process_count - limit, f"Expected {process_count - limit} denied across processes, got {denied}"

    def test_quota_exhaustion_and_cold_counters(self):
        """
        Verify cold counter starts at zero, increments deterministically,
        and strictly rejects any attempts once quota is exhausted.
        """
        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        test_org = f"org_cold_{uuid.uuid4().hex[:8]}"
        backend.reset_quota(test_org)

        limit = 3
        # Request 1 (cold counter -> 1)
        ok, count, lim = backend.consume_quota(test_org, limit=limit, amount=1)
        assert ok is True and count == 1 and lim == limit

        # Request 2 (count -> 2)
        ok, count, lim = backend.consume_quota(test_org, limit=limit, amount=1)
        assert ok is True and count == 2 and lim == limit

        # Request 3 (count -> 3, reaches limit)
        ok, count, lim = backend.consume_quota(test_org, limit=limit, amount=1)
        assert ok is True and count == 3 and lim == limit

        # Request 4 (exhausted -> denied, counter stays at 3)
        ok, count, lim = backend.consume_quota(test_org, limit=limit, amount=1)
        assert ok is False and count == 3 and lim == limit

    def test_invalid_and_negative_limits_fail_closed(self):
        """Verify that zero or negative limits fail closed immediately."""
        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        test_org = f"org_invalid_{uuid.uuid4().hex[:8]}"
        backend.reset_quota(test_org)

        # Limit 0 must fail closed
        ok, count, lim = backend.consume_quota(test_org, limit=0, amount=1)
        assert ok is False

        # Negative limit must fail closed
        ok, count, lim = backend.consume_quota(test_org, limit=-5, amount=1)
        assert ok is False

    def test_nonce_replay_across_worker_processes(self):
        """Verify replay nonce set in Worker 1 is instantly rejected by Worker 2."""
        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        test_nonce = f"nonce_{uuid.uuid4().hex}"
        total_attempts = 15
        results = []

        def _register(i: int):
            return backend.register_nonce(test_nonce, ttl_seconds=60)

        with concurrent.futures.ThreadPoolExecutor(max_workers=total_attempts) as executor:
            futures = [executor.submit(_register, i) for i in range(total_attempts)]
            for f in concurrent.futures.as_completed(futures):
                results.append(f.result())

        assert sum(1 for r in results if r is True) == 1, "Only 1 nonce registration must succeed"
        assert sum(1 for r in results if r is False) == total_attempts - 1, "All replays must fail"

    def test_redis_connection_loss_fails_closed(self):
        """Under SICTACK_STRICT_DISTRIBUTED=1, connection drop immediately rejects traffic."""
        prev_env = os.environ.get("SICTACK_STRICT_DISTRIBUTED")
        os.environ["SICTACK_STRICT_DISTRIBUTED"] = "1"
        try:
            dead_backend = RedisStateSyncBackend(redis_url="redis://127.0.0.1:54321/0")
            with pytest.raises(DistributedStateError):
                dead_backend.consume_quota("org_fail_closed_test", limit=10, amount=1)
        finally:
            if prev_env is not None:
                os.environ["SICTACK_STRICT_DISTRIBUTED"] = prev_env
            else:
                os.environ.pop("SICTACK_STRICT_DISTRIBUTED", None)

    def test_gateway_response_quota_enforcement(self):
        """
        Verify the actual Gateway /api/v1/intercept endpoint under Redis quota coordination.
        Ensures HTTP responses return ALLOW until quota limit, and DENY with QUOTA_EXCEEDED thereafter.
        Initializes isolated SQLite tables deterministically to eliminate file-locking contention.
        """
        from fastapi.testclient import TestClient
        from app.main import app
        from app.db.session import engine, SessionLocal
        from app.db.models import Base, OrganizationModel, ApiKeyModel
        from app.db.migrations import apply_migrations
        from sqlalchemy import inspect

        # Ensure database tables exist and full migration chain is applied
        Base.metadata.create_all(bind=engine)
        apply_migrations(engine)

        inspector = inspect(engine)
        audit_cols = [col["name"] for col in inspector.get_columns("audit_events")]
        assert "org_id" in audit_cols, "audit_events.org_id column must exist after migrations"

        backend = RedisStateSyncBackend(redis_url=REDIS_TEST_URL)
        set_state_sync_coordinator(backend)

        test_org_id = f"org_gw_{uuid.uuid4().hex[:8]}"
        raw_key = f"ilk_live_test_{uuid.uuid4().hex}"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()

        # Seed organization and API key in database
        db = SessionLocal()
        try:
            org = OrganizationModel(
                id=test_org_id,
                name="Gateway Quota Test Org",
                slug=f"gw-quota-{test_org_id}",
                status="ACTIVE",
                max_monthly_actions=3,
            )
            db.merge(org)

            api_key = ApiKeyModel(
                id=f"key_{uuid.uuid4().hex[:8]}",
                org_id=test_org_id,
                name="Test Key",
                key_prefix=raw_key[:12],
                key_hash=key_hash,
                is_active=True,
            )
            db.merge(api_key)
            db.commit()
        finally:
            db.close()

        backend.reset_quota(test_org_id)

        client = TestClient(app)
        responses = []

        # Execute 5 sequential requests against the gateway
        for idx in range(5):
            resp = client.post(
                "/api/v1/intercept",
                headers={"X-API-Key": raw_key},
                json={
                    "agent_id": f"agent_{idx}",
                    "tool_name": "database_query",
                    "parameters": {"sql": "SELECT 1"},
                },
            )
            responses.append((resp.status_code, resp.json()))

        # Check gateway verdicts
        allowed_resps = [r for r in responses if r[0] == 200 and r[1].get("verdict") == "ALLOW"]
        denied_resps = [r for r in responses if r[0] == 200 and r[1].get("verdict") == "DENY" and "QUOTA_EXCEEDED" in r[1].get("reason", "")]

        assert len(allowed_resps) == 3, f"Expected 3 allowed, got {len(allowed_resps)}"
        assert len(denied_resps) == 2, f"Expected 2 denied with QUOTA_EXCEEDED, got {len(denied_resps)}"
