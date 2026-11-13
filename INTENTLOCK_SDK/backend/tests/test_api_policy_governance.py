"""
INTENTLOCK 2.0 – Policy Governance API Integration Tests.
Tests policy versioning snapshots, rollback, dry-run simulation,
conflict detection, and enterprise template instantiation.
"""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.session import Base
from app.db.models import OrganizationModel, UserModel, PolicyModel
from app.api.deps import TenantContext
from app.schemas.schemas import PolicyCreate, PolicyUpdate
from app.api.v1.policies import (
    create_policy,
    update_policy,
    list_policy_versions,
    rollback_policy_version,
    simulate_policy,
    detect_policy_conflicts,
    list_policy_templates,
    create_from_template,
    SimulationRequest,
)
from intentlock.models import DecisionVerdict


@pytest.fixture
def gov_db():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    db = Session()

    org = OrganizationModel(id="org_gov", name="Governance Org", slug="gov-org")
    admin = UserModel(id="usr_gov_admin", org_id="org_gov", email="admin@gov.io", role="ADMIN", password_hash="hash")
    db.add_all([org, admin])
    db.commit()

    try:
        yield db
    finally:
        db.close()


def test_policy_versioning_and_rollback(gov_db):
    admin = gov_db.query(UserModel).filter(UserModel.id == "usr_gov_admin").first()
    tenant = TenantContext(org_id="org_gov", org_name="Governance Org", plan="ENTERPRISE", user=admin)

    # 1. Create policy -> version 1 created
    pol = create_policy(
        policy_in=PolicyCreate(
            name="Versioned Policy",
            allowed_permissions=["file:read"],
            max_sensitivity=3,
        ),
        db=gov_db,
        tenant=tenant,
    )
    versions = list_policy_versions(policy_id=pol.id, db=gov_db)
    assert len(versions) == 1
    assert versions[0].version == 1

    # 2. Update policy -> version 2 created
    updated = update_policy(
        policy_id=pol.id,
        policy_in=PolicyUpdate(allowed_permissions=["file:read", "file:write"], max_sensitivity=7),
        db=gov_db,
        tenant=tenant,
    )
    assert updated.max_sensitivity == 7
    versions_after = list_policy_versions(policy_id=pol.id, db=gov_db)
    assert len(versions_after) == 2
    assert versions_after[0].version == 2

    # 3. Rollback to version 1
    rolled_back = rollback_policy_version(
        policy_id=pol.id,
        version_number=1,
        tenant=tenant,
        user=admin,
        db=gov_db,
    )
    assert rolled_back.max_sensitivity == 3
    assert rolled_back.allowed_permissions == ["file:read"]


def test_policy_simulation_mode(gov_db):
    admin = gov_db.query(UserModel).filter(UserModel.id == "usr_gov_admin").first()
    tenant = TenantContext(org_id="org_gov", org_name="Governance Org", plan="ENTERPRISE", user=admin)

    pol = create_policy(
        policy_in=PolicyCreate(
            name="Sim Policy",
            allowed_permissions=["db:query"],
            denied_permissions=["db:drop"],
            require_approval_permissions=["db:export"],
            max_sensitivity=5,
        ),
        db=gov_db,
        tenant=tenant,
    )

    # A: Allowed simulation
    sim_a = simulate_policy(
        sim_req=SimulationRequest(policy_id=pol.id, tool_name="db:query", sensitivity=2),
        tenant=tenant,
        db=gov_db,
    )
    assert sim_a.verdict == DecisionVerdict.ALLOW
    assert sim_a.would_allow is True

    # B: Denied simulation
    sim_b = simulate_policy(
        sim_req=SimulationRequest(policy_id=pol.id, tool_name="db:drop"),
        tenant=tenant,
        db=gov_db,
    )
    assert sim_b.verdict == DecisionVerdict.DENY
    assert sim_b.would_allow is False
    assert sim_b.reason == "PERMISSION_DENIED"

    # C: Approval simulation
    sim_c = simulate_policy(
        sim_req=SimulationRequest(policy_id=pol.id, tool_name="db:export"),
        tenant=tenant,
        db=gov_db,
    )
    assert sim_c.verdict == DecisionVerdict.REQUIRE_APPROVAL
    assert sim_c.requires_approval is True


def test_policy_conflict_detection(gov_db):
    admin = gov_db.query(UserModel).filter(UserModel.id == "usr_gov_admin").first()
    tenant = TenantContext(org_id="org_gov", org_name="Governance Org", plan="ENTERPRISE", user=admin)

    # Create policy with deliberate contradictions
    conflict_pol = create_policy(
        policy_in=PolicyCreate(
            name="Contradictory Policy",
            allowed_permissions=["admin:reset", "file:read"],
            denied_permissions=["admin:reset"],
            require_approval_permissions=["database:drop"],
        ),
        db=gov_db,
        tenant=tenant,
    )

    report = detect_policy_conflicts(policy_id=conflict_pol.id, db=gov_db)
    assert report.has_conflicts is True
    assert len(report.conflicts) >= 1
    assert any("CONTRADICTORY_PERMISSION" in c["type"] for c in report.conflicts)


def test_policy_templates(gov_db):
    admin = gov_db.query(UserModel).filter(UserModel.id == "usr_gov_admin").first()
    tenant = TenantContext(org_id="org_gov", org_name="Governance Org", plan="ENTERPRISE", user=admin)

    # 1. List templates
    templates = list_policy_templates()
    assert len(templates) >= 6
    assert any(t["key"] == "data_analyst" for t in templates)

    # 2. Instantiate from template
    created = create_from_template(template_key="data_analyst", tenant=tenant, user=admin, db=gov_db)
    assert created.name == "Read-Only Data Analyst"
    assert "database:read" in created.allowed_permissions
    assert "database:drop" in created.denied_permissions
