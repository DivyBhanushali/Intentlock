"""
INTENTLOCK 2.0 — Adversarial Benchmark & Penetration Simulation API
Executes real-time 25-vector attack simulations, validates deterministic fail-closed guarantees,
and records historical benchmark runs.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_current_tenant, get_db, TenantContext
from app.db.models import BenchmarkRunModel
from app.core.benchmark_runner import AdversarialBenchmarkRunner
from app.schemas.schemas import BenchmarkRunResponse

router = APIRouter(prefix="/benchmarks", tags=["Security Benchmarks"])


@router.post("/run", response_model=BenchmarkRunResponse)
def execute_benchmark_suite(
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """
    Executes the full 25-vector adversarial penetration and intent evasion test suite.
    Records execution report, latency telemetry, and block rates.
    """
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    report = AdversarialBenchmarkRunner.run_full_suite(org_id=tenant.org_id)

    run_record = BenchmarkRunModel(
        id=f"bmk_{uuid.uuid4().hex[:12]}",
        org_id=tenant.org_id,
        total_scenarios=report["total_scenarios"],
        passed_scenarios=report["passed_scenarios"],
        failed_scenarios=report["failed_scenarios"],
        block_rate=report["block_rate"],
        average_latency_ms=report["average_latency_ms"],
        report_json=report,
    )

    db.add(run_record)
    db.commit()
    db.refresh(run_record)
    return run_record


@router.get("", response_model=List[BenchmarkRunResponse])
def list_benchmark_runs(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """List historical benchmark runs for the authenticated organization."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    runs = (
        db.query(BenchmarkRunModel)
        .filter(BenchmarkRunModel.org_id == tenant.org_id)
        .order_by(desc(BenchmarkRunModel.created_at))
        .offset(offset)
        .limit(limit)
        .all()
    )
    return runs


@router.get("/latest", response_model=BenchmarkRunResponse)
def get_latest_benchmark_run(
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Returns the latest benchmark run for the organization, or executes one on demand."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    latest = (
        db.query(BenchmarkRunModel)
        .filter(BenchmarkRunModel.org_id == tenant.org_id)
        .order_by(desc(BenchmarkRunModel.created_at))
        .first()
    )

    if latest:
        return latest

    # If none exists yet, execute baseline run
    return execute_benchmark_suite(db=db, tenant=tenant)


@router.get("/{run_id}", response_model=BenchmarkRunResponse)
def get_benchmark_run(
    run_id: str,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Retrieve full breakdown and scenario details of a specific benchmark run."""
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")

    run_record = (
        db.query(BenchmarkRunModel)
        .filter(
            BenchmarkRunModel.id == run_id,
            BenchmarkRunModel.org_id == tenant.org_id,
        )
        .first()
    )

    if not run_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Benchmark run '{run_id}' not found for tenant",
        )

    return run_record

