"""
INTENTLOCK 2.0 — Adversarial Benchmark API Tests
Verifies automated 25-vector attack suite execution, quantitative block rates, and tenant isolation.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.models import Base, BenchmarkRunModel
from app.api.v1.benchmarks import execute_benchmark_suite, list_benchmark_runs, get_latest_benchmark_run, get_benchmark_run
from app.api.deps import TenantContext


@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_execute_benchmark_suite(db_session):
    tenant = TenantContext(org_id="org-bmk-test", org_name="Benchmark Org", plan="ENTERPRISE")

    run_record = execute_benchmark_suite(db=db_session, tenant=tenant)

    assert run_record.org_id == "org-bmk-test"
    assert run_record.total_scenarios == 25
    assert run_record.passed_scenarios == 25
    assert run_record.failed_scenarios == 0
    assert run_record.block_rate == 1.0
    assert run_record.average_latency_ms >= 0.0

    report = run_record.report_json
    assert len(report["scenarios"]) == 25
    # Verify presence of key attack vectors
    vector_ids = [s["vector_id"] for s in report["scenarios"]]
    assert "T-01" in vector_ids
    assert "T-16" in vector_ids
    assert "T-25" in vector_ids


def test_list_and_get_latest_benchmarks(db_session):
    tenant = TenantContext(org_id="org-bmk-multi", org_name="Multi Org", plan="ENTERPRISE")

    # Initially empty, get_latest will trigger on-demand run
    latest = get_latest_benchmark_run(db=db_session, tenant=tenant)
    assert latest is not None
    assert latest.total_scenarios == 25

    # Run another benchmark
    second_run = execute_benchmark_suite(db=db_session, tenant=tenant)

    # Listing should return 2 runs
    all_runs = list_benchmark_runs(limit=20, offset=0, db=db_session, tenant=tenant)
    assert len(all_runs) == 2

    # Get specific run
    retrieved = get_benchmark_run(run_id=second_run.id, db=db_session, tenant=tenant)
    assert retrieved.id == second_run.id

