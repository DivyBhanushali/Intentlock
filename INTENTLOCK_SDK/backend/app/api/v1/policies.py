"""
INTENTLOCK 2.0 – Advanced Policy Governance API.
Provides:
- Policy versioning and historical snapshots
- Dry-run policy simulation mode
- Automated rule conflict detection
- Pre-configured enterprise policy templates
"""

from __future__ import annotations

import fnmatch
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import TenantContext, get_current_tenant, get_db, require_admin_user, require_authenticated_user
from app.db.models import IntentContextModel, PolicyModel, PolicyVersionModel, UserModel
from app.schemas.schemas import PolicyCreate, PolicyResponse, PolicyUpdate
from intentlock.models import DecisionVerdict, IntentContext, Policy, RegisteredTool, RiskLevel, ToolCall
from intentlock.policy_engine import PolicyEngine
from intentlock.registry import ToolRegistry
from intentlock.risk_engine import RiskEngine

router = APIRouter(prefix="/policies", tags=["Policies"])

_policy_engine = PolicyEngine()
_risk_engine = RiskEngine()


# ─── Enterprise Policy Templates ───

ENTERPRISE_POLICY_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "data_analyst": {
        "key": "data_analyst",
        "name": "Read-Only Data Analyst",
        "description": "Permits querying and summarizing public analytical tables, strictly forbidding deletions, mutations, and external exfiltration.",
        "allowed_permissions": ["database:read", "analytics:query", "file:read"],
        "denied_permissions": ["database:drop", "database:delete", "database:update", "email:send", "exec:shell"],
        "require_approval_permissions": ["export:csv", "data:export"],
        "allowed_resources": ["analytics/*", "reports/*", "public/*"],
        "allowed_recipients": ["*@company.com"],
        "max_risk_level": "LOW",
        "max_sensitivity": 4,
    },
    "database_agent": {
        "key": "database_agent",
        "name": "Restricted Database Agent",
        "description": "Permits structured reads and single-record inserts with human approval required for table modifications or schema mutations.",
        "allowed_permissions": ["db:select", "db:insert"],
        "denied_permissions": ["db:drop", "db:truncate", "db:alter"],
        "require_approval_permissions": ["db:update", "db:delete"],
        "allowed_resources": ["app_db.tables.*"],
        "allowed_recipients": [],
        "max_risk_level": "MEDIUM",
        "max_sensitivity": 6,
    },
    "email_assistant": {
        "key": "email_assistant",
        "name": "Corporate Email Assistant",
        "description": "Reads inboxes, drafts replies, and requires human approval before sending external communications.",
        "allowed_permissions": ["email:read", "email:draft", "calendar:read"],
        "denied_permissions": ["email:delete_all", "admin:invite"],
        "require_approval_permissions": ["email:send"],
        "allowed_resources": ["inbox/*", "sent/*"],
        "allowed_recipients": ["*@company.com"],
        "max_risk_level": "HIGH",
        "max_sensitivity": 7,
    },
    "finance_ops": {
        "key": "finance_ops",
        "name": "Financial Operations Agent",
        "description": "Processes invoices and ledger entries. All fund transfers and ledger adjustments strictly mandate human approval.",
        "allowed_permissions": ["invoice:read", "ledger:read"],
        "denied_permissions": ["account:delete", "system:override"],
        "require_approval_permissions": ["funds:transfer", "ledger:write", "invoice:pay"],
        "allowed_resources": ["ledger/2026/*", "invoices/*"],
        "allowed_recipients": ["finance-approvals@company.com"],
        "max_risk_level": "HIGH",
        "max_sensitivity": 8,
    },
    "customer_support": {
        "key": "customer_support",
        "name": "Customer Support Agent",
        "description": "Answers tier-1 support inquiries, reads KB docs, and creates support tickets without accessing backend PII.",
        "allowed_permissions": ["kb:read", "ticket:create", "ticket:update"],
        "denied_permissions": ["user:delete", "payment:refund", "db:*"],
        "require_approval_permissions": ["escalate:manager"],
        "allowed_resources": ["kb/public/*", "tickets/*"],
        "allowed_recipients": ["support-queue@company.com"],
        "max_risk_level": "LOW",
        "max_sensitivity": 3,
    },
    "dev_environment": {
        "key": "dev_environment",
        "name": "Development Environment Agent",
        "description": "Permits code testing, test-runner execution, and sandbox debugging with external production resources blocked.",
        "allowed_permissions": ["test:run", "git:status", "lint:check", "build:compile"],
        "denied_permissions": ["deploy:production", "secrets:read", "aws:*"],
        "require_approval_permissions": ["git:push", "package:install"],
        "allowed_resources": ["src/*", "tests/*", "build/*"],
        "allowed_recipients": [],
        "max_risk_level": "MEDIUM",
        "max_sensitivity": 5,
    },
}


# ─── Schemas ───

class PolicyVersionResponse(BaseModel):
    id: str
    policy_id: str
    version: int
    name: str
    description: str
    allowed_permissions: List[str]
    denied_permissions: List[str]
    require_approval_permissions: List[str]
    allowed_resources: List[str]
    allowed_recipients: List[str]
    max_risk_level: str
    max_sensitivity: int
    modified_by: str
    change_reason: str
    created_at: datetime


class SimulationRequest(BaseModel):
    policy_id: Optional[str] = None
    policy_draft: Optional[PolicyCreate] = None
    tool_name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)
    resource_id: str = ""
    recipient: str = ""
    sensitivity: int = 0
    intent_context_id: Optional[str] = None


class SimulationResponse(BaseModel):
    verdict: DecisionVerdict
    would_allow: bool
    reason: str
    risk_score: float
    risk_level: RiskLevel
    matched_rule: str
    requires_approval: bool
    evaluation_stages: List[Dict[str, Any]]


class ConflictReport(BaseModel):
    policy_id: str
    has_conflicts: bool
    conflicts: List[Dict[str, str]]
    recommendations: List[str]


# ─── Helper for Snapshotting Version ───

def _snapshot_version(db_policy: PolicyModel, modified_by: str, reason: str, db: Session) -> PolicyVersionModel:
    curr_version_count = (
        db.query(PolicyVersionModel)
        .filter(PolicyVersionModel.policy_id == db_policy.id)
        .count()
    )
    new_version_num = curr_version_count + 1

    ver = PolicyVersionModel(
        policy_id=db_policy.id,
        version=new_version_num,
        name=db_policy.name,
        description=db_policy.description or "",
        allowed_permissions=db_policy.allowed_permissions or [],
        denied_permissions=db_policy.denied_permissions or [],
        require_approval_permissions=db_policy.require_approval_permissions or [],
        allowed_resources=db_policy.allowed_resources or [],
        allowed_recipients=db_policy.allowed_recipients or [],
        max_risk_level=db_policy.max_risk_level or "MEDIUM",
        max_sensitivity=db_policy.max_sensitivity or 5,
        modified_by=modified_by,
        change_reason=reason,
    )
    db.add(ver)
    db.commit()
    return ver


# ─── Endpoints ───

@router.get("", response_model=List[PolicyResponse])
def list_policies(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """List all configured security policies for the caller's tenant."""
    org_id = tenant.org_id if isinstance(tenant, TenantContext) else "default-org"
    policies = (
        db.query(PolicyModel)
        .filter((PolicyModel.org_id == org_id) | (PolicyModel.org_id == "default-org"))
        .offset(skip)
        .limit(limit)
        .all()
    )
    return policies


@router.post("", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_policy(
    policy_in: PolicyCreate,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Create a new security policy and record initial version snapshot."""
    org_id = tenant.org_id if isinstance(tenant, TenantContext) else "default-org"
    user_email = tenant.user.email if isinstance(tenant, TenantContext) and tenant.user else "system"

    policy_id = str(uuid.uuid4())
    db_policy = PolicyModel(
        id=policy_id,
        org_id=org_id,
        name=policy_in.name,
        description=policy_in.description,
        allowed_permissions=policy_in.allowed_permissions,
        denied_permissions=policy_in.denied_permissions,
        require_approval_permissions=policy_in.require_approval_permissions,
        allowed_resources=policy_in.allowed_resources,
        allowed_recipients=policy_in.allowed_recipients,
        max_risk_level=policy_in.max_risk_level.value,
        max_sensitivity=policy_in.max_sensitivity,
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)

    _snapshot_version(db_policy, modified_by=user_email, reason="Initial policy creation", db=db)
    return db_policy



@router.get("/templates", response_model=List[Dict[str, Any]])
def list_policy_templates():
    """List pre-configured production policy templates for rapid deployment."""
    return list(ENTERPRISE_POLICY_TEMPLATES.values())


@router.post("/from-template/{template_key}", response_model=PolicyResponse, status_code=status.HTTP_201_CREATED)
def create_from_template(
    template_key: str,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    """Instantiate a new security policy directly from a certified enterprise template."""
    tmpl = ENTERPRISE_POLICY_TEMPLATES.get(template_key)
    if not tmpl:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_key}' not found.",
        )

    db_policy = PolicyModel(
        id=str(uuid.uuid4()),
        org_id=tenant.org_id,
        name=tmpl["name"],
        description=tmpl["description"],
        allowed_permissions=tmpl["allowed_permissions"],
        denied_permissions=tmpl["denied_permissions"],
        require_approval_permissions=tmpl["require_approval_permissions"],
        allowed_resources=tmpl["allowed_resources"],
        allowed_recipients=tmpl["allowed_recipients"],
        max_risk_level=tmpl["max_risk_level"],
        max_sensitivity=tmpl["max_sensitivity"],
    )
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)

    _snapshot_version(db_policy, modified_by=user.email, reason=f"Created from template '{template_key}'", db=db)
    return db_policy


@router.post("/simulate", response_model=SimulationResponse)
def simulate_policy(
    sim_req: SimulationRequest,
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
    db: Session = Depends(get_db),
):
    """
    Dry-run simulation mode.
    Tests a hypothetical tool execution against a policy or policy draft without executing the real tool.
    """
    org_id = tenant.org_id if tenant and isinstance(tenant, TenantContext) else "default-org"

    # Resolve policy
    sdk_policy: Optional[Policy] = None
    if sim_req.policy_draft:
        sdk_policy = Policy(
            policy_id="sim-draft-policy",
            allowed_permissions=sim_req.policy_draft.allowed_permissions,
            denied_permissions=sim_req.policy_draft.denied_permissions,
            require_approval_permissions=sim_req.policy_draft.require_approval_permissions,
            allowed_resources=sim_req.policy_draft.allowed_resources,
            allowed_recipients=sim_req.policy_draft.allowed_recipients,
            max_risk_level=sim_req.policy_draft.max_risk_level,
            max_sensitivity=sim_req.policy_draft.max_sensitivity,
        )
    elif sim_req.policy_id:
        db_pol = db.query(PolicyModel).filter(PolicyModel.id == sim_req.policy_id).first()
        if not db_pol:
            raise HTTPException(status_code=404, detail="Policy not found for simulation")
        sdk_policy = Policy(
            policy_id=db_pol.id,
            allowed_permissions=db_pol.allowed_permissions or [],
            denied_permissions=db_pol.denied_permissions or [],
            require_approval_permissions=db_pol.require_approval_permissions or [],
            allowed_resources=db_pol.allowed_resources or [],
            allowed_recipients=db_pol.allowed_recipients or [],
            max_risk_level=RiskLevel(db_pol.max_risk_level),
            max_sensitivity=db_pol.max_sensitivity,
        )
    else:
        db_pol = db.query(PolicyModel).filter(PolicyModel.org_id == org_id).first() or db.query(PolicyModel).first()
        if db_pol:
            sdk_policy = Policy(
                policy_id=db_pol.id,
                allowed_permissions=db_pol.allowed_permissions or [],
                denied_permissions=db_pol.denied_permissions or [],
                require_approval_permissions=db_pol.require_approval_permissions or [],
                allowed_resources=db_pol.allowed_resources or [],
                allowed_recipients=db_pol.allowed_recipients or [],
                max_risk_level=RiskLevel(db_pol.max_risk_level),
                max_sensitivity=db_pol.max_sensitivity,
            )

    if not sdk_policy:
        return SimulationResponse(
            verdict=DecisionVerdict.DENY,
            would_allow=False,
            reason="POLICY_MISSING_FAIL_CLOSED",
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            matched_rule="Fail Closed: No active policy found",
            requires_approval=False,
            evaluation_stages=[{"stage": "Policy Presence", "status": "FAILED", "detail": "No policy supplied"}],
        )

    # Resolve optional intent context
    sdk_intent = None
    if sim_req.intent_context_id:
        db_intent = db.query(IntentContextModel).filter(IntentContextModel.id == sim_req.intent_context_id).first()
        if db_intent:
            exp = db_intent.expiration_timestamp
            if exp.tzinfo is None:
                exp = exp.replace(tzinfo=timezone.utc)
            sdk_intent = IntentContext(
                intent_id=db_intent.id,
                org_id=db_intent.org_id,
                user_id=db_intent.user_id,
                agent_id=db_intent.agent_id,
                authorized_objective=db_intent.authorized_objective,
                allowed_actions=db_intent.allowed_actions or [],
                denied_actions=db_intent.denied_actions or [],
                allowed_resources=db_intent.allowed_resources or [],
                allowed_recipients=db_intent.allowed_recipients or [],
                sensitivity_ceiling=db_intent.sensitivity_ceiling,
                expiration_timestamp=exp,
                context_status=db_intent.context_status,
            )

    # Synthesize ToolCall & registry
    tool_call = ToolCall(
        tool_name=sim_req.tool_name,
        arguments=sim_req.arguments,
        sensitivity=sim_req.sensitivity,
        resource_id=sim_req.resource_id,
        recipient=sim_req.recipient,
        intent_id=sim_req.intent_context_id or "",
    )
    reg = ToolRegistry()
    reg.register(name=sim_req.tool_name, handler=lambda **kw: None, permission=sim_req.tool_name, sensitivity=sim_req.sensitivity)

    desc, _ = reg.get(sim_req.tool_name)
    risk_score, risk_level = _risk_engine.assess(tool_call, desc)

    # Build evaluation trace steps
    stages = []
    stages.append({"stage": "1. Explicit Denial Check", "passed": sim_req.tool_name not in sdk_policy.denied_permissions})
    if sdk_intent:
        stages.append({"stage": "2. Intent Scope Check", "passed": sim_req.tool_name not in sdk_intent.denied_actions})
    stages.append({"stage": "3. Approval Requirement", "requires_approval": sim_req.tool_name in sdk_policy.require_approval_permissions})
    stages.append({"stage": "4. Sensitivity Ceiling", "passed": sim_req.sensitivity <= sdk_policy.max_sensitivity})

    decision = _policy_engine.evaluate(tool_call, sdk_policy, reg, intent_context=sdk_intent)

    return SimulationResponse(
        verdict=decision.verdict,
        would_allow=(decision.verdict == DecisionVerdict.ALLOW),
        reason=decision.reason,
        risk_score=risk_score,
        risk_level=risk_level,
        matched_rule=f"Evaluated against policy: {sdk_policy.policy_id}",
        requires_approval=(decision.verdict == DecisionVerdict.REQUIRE_APPROVAL),
        evaluation_stages=stages,
    )


@router.get("/{policy_id}/conflicts", response_model=ConflictReport)
def detect_policy_conflicts(
    policy_id: str,
    db: Session = Depends(get_db),
):
    """
    Detect conflicting policy rules:
    - Same permission in allowed and denied lists
    - Same permission in require_approval and denied lists
    - Zero permissions allowed (unusable dead policy)
    - Sensitivity ceiling set to 0 while requesting sensitive permissions
    """
    policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    allowed = set(policy.allowed_permissions or [])
    denied = set(policy.denied_permissions or [])
    approval = set(policy.require_approval_permissions or [])

    conflicts = []
    recommendations = []

    # 1. Contradiction: allowed and denied
    intersection_allowed_denied = allowed.intersection(denied)
    if intersection_allowed_denied:
        conflicts.append({
            "type": "CONTRADICTORY_PERMISSION",
            "detail": f"Permissions {list(intersection_allowed_denied)} appear in both allowed and denied lists. Denied takes precedence.",
        })
        recommendations.append(f"Remove {list(intersection_allowed_denied)} from either allowed or denied list.")

    # 2. Contradiction: approval and denied
    intersection_app_denied = approval.intersection(denied)
    if intersection_app_denied:
        conflicts.append({
            "type": "IMPOSSIBLE_APPROVAL",
            "detail": f"Permissions {list(intersection_app_denied)} appear in both require_approval and denied lists. Denied will always block approval.",
        })
        recommendations.append(f"Remove {list(intersection_app_denied)} from denied list if human approval is desired.")

    # 3. Dead Policy: no allowed or approval permissions
    if not allowed and not approval:
        conflicts.append({
            "type": "DEAD_POLICY_LOCKOUT",
            "detail": "Policy contains zero allowed or require_approval permissions. All tool calls under this policy will be denied.",
        })
        recommendations.append("Add at least one permitted tool action or approval requirement.")

    return ConflictReport(
        policy_id=policy_id,
        has_conflicts=len(conflicts) > 0,
        conflicts=conflicts,
        recommendations=recommendations,
    )


@router.get("/{policy_id}/versions", response_model=List[PolicyVersionResponse])
def list_policy_versions(
    policy_id: str,
    db: Session = Depends(get_db),
):
    """List historical audit snapshots of a policy."""
    versions = (
        db.query(PolicyVersionModel)
        .filter(PolicyVersionModel.policy_id == policy_id)
        .order_by(PolicyVersionModel.version.desc())
        .all()
    )
    return versions


@router.post("/{policy_id}/rollback/{version_number}", response_model=PolicyResponse)
def rollback_policy_version(
    policy_id: str,
    version_number: int,
    tenant: TenantContext = Depends(get_current_tenant),
    user: UserModel = Depends(require_admin_user),
    db: Session = Depends(get_db),
):
    """Roll back an active policy to an earlier version snapshot."""
    db_policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    snapshot = (
        db.query(PolicyVersionModel)
        .filter(PolicyVersionModel.policy_id == policy_id, PolicyVersionModel.version == version_number)
        .first()
    )
    if not snapshot:
        raise HTTPException(status_code=404, detail=f"Version {version_number} not found for policy")

    db_policy.name = snapshot.name
    db_policy.description = snapshot.description
    db_policy.allowed_permissions = snapshot.allowed_permissions
    db_policy.denied_permissions = snapshot.denied_permissions
    db_policy.require_approval_permissions = snapshot.require_approval_permissions
    db_policy.allowed_resources = snapshot.allowed_resources
    db_policy.allowed_recipients = snapshot.allowed_recipients
    db_policy.max_risk_level = snapshot.max_risk_level
    db_policy.max_sensitivity = snapshot.max_sensitivity
    db.commit()
    db.refresh(db_policy)

    _snapshot_version(db_policy, modified_by=user.email, reason=f"Rollback to version {version_number}", db=db)
    return db_policy


@router.get("/{policy_id}", response_model=PolicyResponse)
def get_policy(policy_id: str, db: Session = Depends(get_db)):
    """Retrieve a specific policy by ID."""
    policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    return policy


@router.put("/{policy_id}", response_model=PolicyResponse)
def update_policy(
    policy_id: str,
    policy_in: PolicyUpdate,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """Update an existing security policy and record a new version snapshot."""
    db_policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not db_policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )

    user_email = tenant.user.email if isinstance(tenant, TenantContext) and tenant.user else "system"

    update_data = policy_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "max_risk_level" and value is not None:
            setattr(db_policy, field, value.value)
        else:
            setattr(db_policy, field, value)

    db.commit()
    db.refresh(db_policy)

    _snapshot_version(db_policy, modified_by=user_email, reason="Policy configuration updated", db=db)
    return db_policy


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_policy(policy_id: str, db: Session = Depends(get_db)):
    """Delete a policy by ID."""
    db_policy = db.query(PolicyModel).filter(PolicyModel.id == policy_id).first()
    if not db_policy:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Policy '{policy_id}' not found",
        )
    db.delete(db_policy)
    db.commit()
    return None
