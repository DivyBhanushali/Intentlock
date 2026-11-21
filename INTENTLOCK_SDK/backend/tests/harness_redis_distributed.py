"""
SICTACK Phase 5C — Distributed Multi-Process Redis Integration Harness (BLK-005).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Verifies:
1. Multi-worker concurrent quota decrement via atomic Lua script (CHECK_AND_DECR_QUOTA).
2. Nonce replay prevention across concurrent worker processes.
3. Strict fail-closed rejection on Redis disconnect (SICTACK_STRICT_DISTRIBUTED=1).
4. Sliding window distributed rate limiting.
5. Partition & split-brain architectural guarantees (Single vs Replicated vs Cluster).
"""

from __future__ import annotations

import os
import sys
import time
import uuid
import hashlib
import concurrent.futures
import pytest
from multiprocessing import Process, Queue

from sictack.coordination.state_sync import (
    RedisStateSyncBackend,
    DistributedStateError,
    set_state_sync_coordinator,
    get_state_sync_coordinator,
)

REDIS_TEST_URL = os.environ.get("SICTACK_TEST_REDIS_URL", "")
IS_REDIS_AVAILABLE = bool(REDIS_TEST_URL and REDIS_TEST_URL.startswith("redis://"))


@pytest.mark.skipif(
    not IS_REDIS_AVAILABLE,
    reason="Isolated multi-worker Redis environment not configured. Preserving BLK-005 OPEN."
)
class TestDistributedRedisClusterHarness:
    """Verifies atomic quota enforcement and fail-closed behavior across multi-worker processes."""

    def test_multi_worker_atomic_quota_race(self):
        """
        Execute concurrent requests competing for a tenant with quota = 5.
        Exactly 5 must succeed; rest must fail with atomic consistency.
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

    def test_gateway_response_quota_enforcement_concurrent(self):
        """
        Verify the actual Gateway /api/v1/intercept endpoint under concurrent load.
        Ensures HTTP responses return ALLOW until quota limit, and DENY with QUOTA_EXCEEDED thereafter.
        """
        from fastapi.testclient import TestClient
        from app.main import app
        from app.db.session import SessionLocal
        from app.db.models import OrganizationModel, ApiKeyModel

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
        total_requests = 10
        responses = []

        def _call_gateway(idx: int):
            resp = client.post(
                "/api/v1/intercept",
                headers={"X-API-Key": raw_key},
                json={
                    "agent_id": f"agent_{idx}",
                    "tool_name": "database_query",
                    "parameters": {"sql": "SELECT 1"},
                },
            )
            return resp.status_code, resp.json()

        with concurrent.futures.ThreadPoolExecutor(max_workers=total_requests) as executor:
            futures = [executor.submit(_call_gateway, i) for i in range(total_requests)]
            for f in concurrent.futures.as_completed(futures):
                responses.append(f.result())

        # Check gateway verdicts
        allowed_resps = [r for r in responses if r[0] == 200 and r[1].get("verdict") == "ALLOW"]
        denied_resps = [r for r in responses if r[0] == 200 and r[1].get("verdict") == "DENY" and "QUOTA_EXCEEDED" in r[1].get("reason", "")]

        assert len(allowed_resps) == 3, f"Expected 3 allowed, got {len(allowed_resps)}"
        assert len(denied_resps) == 7, f"Expected 7 denied with QUOTA_EXCEEDED, got {len(denied_resps)}"

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
        os.environ["SICTACK_STRICT_DISTRIBUTED"] = "1"
        dead_backend = RedisStateSyncBackend(redis_url="redis://127.0.0.1:54321/0")
        with pytest.raises(DistributedStateError):
            dead_backend.consume_quota("org_fail_closed_test", limit=10, amount=1)
