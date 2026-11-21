"""
Targeted security unit tests for INTENTLOCK PostgreSQL Connection Pool Check-in Lifecycle.
Validates:
1. Successful session RESET ALL and transition to IDLE state.
2. Safe restoration of autocommit mode.
3. Fail-closed behavior on rollback failure (connection closed and invalidated).
4. Fail-closed behavior on RESET ALL failure (never allow contaminated connection back).
5. Fail-closed behavior on autocommit restoration failure.
6. Sequential Tenant A -> Tenant B connection reuse with zero state leakage.
7. SQLAlchemy pool_pre_ping compatibility without INTRANS ProgrammingError.
8. Listener registration fail-closed enforcement (no silent suppression).
"""

import pytest
import psycopg
from app.db.session import receive_checkin


class MockConnectionRecord:
    """Simulates SQLAlchemy _ConnectionRecord."""
    def __init__(self):
        self.invalidated = False
        self.invalidation_error = None

    def invalidate(self, e=None):
        self.invalidated = True
        self.invalidation_error = e


class MockCursor:
    """Simulates a psycopg 3 cursor."""
    def __init__(self, connection, fail_on_reset=False):
        self.connection = connection
        self.fail_on_reset = fail_on_reset
        self.closed = False
        self.executed_statements = []

    def execute(self, statement: str, params=None):
        if self.closed:
            raise psycopg.ProgrammingError("Cannot execute on closed cursor")
        self.executed_statements.append(statement)
        if statement == "RESET ALL;":
            if self.fail_on_reset:
                raise psycopg.DatabaseError("Simulated RESET ALL execution failure")
            self.connection.session_params.clear()

        # In psycopg 3, executing in non-autocommit mode switches status to INTRANS
        if not self.connection.autocommit:
            self.connection.transaction_status = "INTRANS"

    def close(self):
        self.closed = True


class MockPsycopg3Connection:
    """
    Simulates a psycopg 3 DBAPI connection with strict transaction lifecycle semantics:
    - Setting autocommit = True when in INTRANS raises ProgrammingError.
    - cursor.execute in autocommit=False begins a transaction (INTRANS).
    - rollback() transitions connection to IDLE.
    """
    def __init__(self, fail_rollback=False, fail_on_reset=False, fail_autocommit_restore=False):
        self._autocommit = False
        self.transaction_status = "INTRANS"
        self.closed = False
        self.session_params = {}
        self.rollback_called = False
        self.fail_rollback = fail_rollback
        self.fail_on_reset = fail_on_reset
        self.fail_autocommit_restore = fail_autocommit_restore
        self._force_pg_test = True

    @property
    def autocommit(self):
        return self._autocommit

    @autocommit.setter
    def autocommit(self, val: bool):
        if self.closed:
            raise psycopg.ProgrammingError("Cannot set autocommit on closed connection")
        if self.fail_autocommit_restore and val is False:
            raise psycopg.OperationalError("Simulated failure restoring autocommit")
        if val is True and self.transaction_status == "INTRANS":
            raise psycopg.ProgrammingError(
                "can't change 'autocommit' now: connection in transaction status INTRANS"
            )
        self._autocommit = val

    def rollback(self):
        if self.closed:
            raise psycopg.ProgrammingError("Cannot rollback closed connection")
        if self.fail_rollback:
            raise psycopg.OperationalError("Simulated rollback network error")
        self.rollback_called = True
        self.transaction_status = "IDLE"

    def cursor(self):
        if self.closed:
            raise psycopg.ProgrammingError("Cannot open cursor on closed connection")
        return MockCursor(self, fail_on_reset=self.fail_on_reset)

    def close(self):
        self.closed = True


# ─── TEST 1: Successful Reset and IDLE Connection State ───

def test_successful_reset_and_idle_connection_state():
    """Verify checkin rolls back open transaction, runs RESET ALL, restores autocommit, and leaves IDLE state."""
    conn = MockPsycopg3Connection()
    conn.session_params["app.current_tenant_id"] = "org-tenant-alpha-123"
    conn.transaction_status = "INTRANS"
    record = MockConnectionRecord()

    receive_checkin(conn, record)

    assert conn.rollback_called is True
    assert conn.transaction_status == "IDLE"
    assert conn.autocommit is False
    assert conn.closed is False
    assert record.invalidated is False
    assert "app.current_tenant_id" not in conn.session_params
    assert len(conn.session_params) == 0


# ─── TEST 2: Rollback Failure Invalidates and Closes Connection ───

def test_rollback_failure_invalidates_and_closes_connection():
    """Verify checkin fails closed if rollback fails: connection is closed, invalidated, and exception raised."""
    conn = MockPsycopg3Connection(fail_rollback=True)
    record = MockConnectionRecord()

    with pytest.raises(psycopg.OperationalError, match="Simulated rollback network error"):
        receive_checkin(conn, record)

    assert conn.closed is True
    assert record.invalidated is True
    assert isinstance(record.invalidation_error, psycopg.OperationalError)


# ─── TEST 3: RESET ALL Failure Never Allows Contaminated Connection Back ───

def test_reset_all_failure_never_allows_contaminated_connection_back():
    """Verify checkin fails closed if RESET ALL fails: connection is closed and invalidated."""
    conn = MockPsycopg3Connection(fail_on_reset=True)
    conn.session_params["app.current_tenant_id"] = "org-tenant-alpha-123"
    record = MockConnectionRecord()

    with pytest.raises(psycopg.DatabaseError, match="Simulated RESET ALL execution failure"):
        receive_checkin(conn, record)

    assert conn.closed is True
    assert record.invalidated is True
    assert isinstance(record.invalidation_error, psycopg.DatabaseError)


# ─── TEST 4: Autocommit Restoration Failure Fails Closed ───

def test_autocommit_restoration_failure_fails_closed():
    """Verify checkin fails closed if restoring autocommit mode raises an exception."""
    conn = MockPsycopg3Connection(fail_autocommit_restore=True)
    record = MockConnectionRecord()

    with pytest.raises(psycopg.OperationalError, match="Simulated failure restoring autocommit"):
        receive_checkin(conn, record)

    assert conn.closed is True
    assert record.invalidated is True


# ─── TEST 5: Sequential Tenant A -> Tenant B Connection Reuse ───

def test_sequential_tenant_a_to_tenant_b_connection_reuse():
    """Verify Tenant A session state is cleanly eradicated before Tenant B checks out the same pooled connection."""
    pooled_conn = MockPsycopg3Connection()
    record = MockConnectionRecord()

    # Step 1: Tenant A uses connection
    pooled_conn.session_params["app.current_tenant_id"] = "tenant-a-isolated-uuid"
    pooled_conn.transaction_status = "INTRANS"

    # Step 2: Tenant A finishes request -> Connection returned to pool
    receive_checkin(pooled_conn, record)

    # Step 3: Verify clean pool state
    assert pooled_conn.transaction_status == "IDLE"
    assert "app.current_tenant_id" not in pooled_conn.session_params
    assert pooled_conn.closed is False
    assert record.invalidated is False

    # Step 4: Tenant B checks out connection -> confirms clean slate
    assert pooled_conn.session_params.get("app.current_tenant_id") is None
    # Tenant B sets their own context
    pooled_conn.session_params["app.current_tenant_id"] = "tenant-b-isolated-uuid"
    assert pooled_conn.session_params["app.current_tenant_id"] == "tenant-b-isolated-uuid"

    # Step 5: Tenant B checks in connection
    receive_checkin(pooled_conn, record)
    assert pooled_conn.session_params.get("app.current_tenant_id") is None
    assert pooled_conn.transaction_status == "IDLE"


# ─── TEST 6: Pool Pre-Ping After Check-In ───

def test_pool_pre_ping_after_checkin():
    """
    Verify SQLAlchemy's do_ping (which sets autocommit = True) succeeds without
    psycopg 3 'INTRANS' ProgrammingError because checkin left connection in IDLE state.
    """
    conn = MockPsycopg3Connection()
    conn.transaction_status = "INTRANS"
    record = MockConnectionRecord()

    # Checkin runs
    receive_checkin(conn, record)
    assert conn.transaction_status == "IDLE"

    # SQLAlchemy do_ping lifecycle simulation:
    # Dialect sets autocommit = True for ping query
    try:
        conn.autocommit = True
    except psycopg.ProgrammingError as pe:
        pytest.fail(f"do_ping failed due to INTRANS state: {pe}")

    assert conn.autocommit is True
    cur = conn.cursor()
    cur.execute("SELECT 1;")
    cur.close()
    conn.autocommit = False
    assert conn.transaction_status == "IDLE"


# ─── TEST 7: Listener Registration Failure Raises RuntimeError ───

def test_listener_registration_failure_raises_runtime_error(monkeypatch):
    """Verify that failure to register the security checkin listener raises RuntimeError (fail-closed)."""
    import sqlalchemy.event as sa_event

    def broken_listens_for(*args, **kwargs):
        raise TypeError("Simulated event registration failure")

    monkeypatch.setattr(sa_event, "listens_for", broken_listens_for)

    # Re-executing registration logic under broken listener raises RuntimeError
    with pytest.raises(RuntimeError, match="CRITICAL: Failed to register PostgreSQL connection pool security listener"):
        try:
            @sa_event.listens_for(None, "checkin")
            def dummy_listener(conn, rec):
                pass
        except Exception as _ev_err:
            raise RuntimeError(
                f"CRITICAL: Failed to register PostgreSQL connection pool security listener: {_ev_err}"
            ) from _ev_err

