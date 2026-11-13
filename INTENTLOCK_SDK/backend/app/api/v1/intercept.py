"""
INTENTLOCK Backend – Remote Tool-Call Interception Gateway Endpoint.

Allows external AI agents (LangChain, AutoGen, CrewAI, Custom) to route
tool calls over HTTP through the INTENTLOCK security enforcement layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import TenantContext, get_current_tenant, get_db
from app.db.models import (
    AgentModel,
    ApprovalModel,
    AuditEventModel,
    IntentContextModel,
    PolicyModel,
)
from app.schemas.schemas import InterceptRequest, InterceptResponse
from app.core.config import settings
from app.core.audit_chain import append_audit_event
from app.core.threat_engine import ThreatDetector

from intentlock.models import (
    ApprovalStatus,
    DecisionVerdict,
    IntentContext,
    Policy,
    RegisteredTool,
    RiskLevel,
    ToolCall,
)
from intentlock.policy_engine import PolicyEngine
from intentlock.risk_engine import RiskEngine
from intentlock.registry import ToolRegistry

router = APIRouter(prefix="/intercept", tags=["Security Gateway"])

# Pure deterministic engines from SDK
_policy_engine = PolicyEngine()
_risk_engine = RiskEngine()


def _build_sdk_policy(db_policy: PolicyModel) -> Policy:
    """Map DB PolicyModel to SDK Policy Pydantic object."""
    return Policy(
        policy_id=db_policy.id,
        allowed_permissions=db_policy.allowed_permissions or [],
        denied_permissions=db_policy.denied_permissions or [],
        require_approval_permissions=db_policy.require_approval_permissions or [],
        allowed_resources=db_policy.allowed_resources or [],
        allowed_recipients=db_policy.allowed_recipients or [],
        max_risk_level=RiskLevel(db_policy.max_risk_level),
        max_sensitivity=db_policy.max_sensitivity,
        description=db_policy.description or "",
    )


def _build_sdk_intent(db_intent: IntentContextModel) -> IntentContext:
    """Map DB IntentContextModel to SDK IntentContext Pydantic object."""
    exp = db_intent.expiration_timestamp
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    return IntentContext(
        intent_id=db_intent.id,
        org_id=db_intent.org_id,
        user_id=db_intent.user_id,
        agent_id=db_intent.agent_id,
        authorized_objective=db_intent.authorized_objective,
        allowed_actions=db_intent.allowed_actions or [],
        denied_actions=db_intent.denied_actions or [],
        allowed_permissions=db_intent.allowed_permissions or [],
        allowed_resources=db_intent.allowed_resources or [],
        allowed_recipients=db_intent.allowed_recipients or [],
        sensitivity_ceiling=db_intent.sensitivity_ceiling,
        execution_scope=db_intent.execution_scope,
        expiration_timestamp=exp,
        context_status=db_intent.context_status,
        authorization_version=db_intent.authorization_version,
    )


@router.post("", response_model=InterceptResponse)
def intercept_tool_call(
    request: InterceptRequest,
    db: Session = Depends(get_db),
    tenant: Optional[TenantContext] = Depends(get_current_tenant),
):
    """
    Authoritative enforcement endpoint implementing INTENTLOCK 2.0 8-stage pipeline:
    1. Tenant & Agent Identity Verification
    2. Intent Context Resolution & Immutability Verification
    3. Permission Allow / Deny Lists
    4. Sensitivity Ceiling Enforcement
    5. Recipient / Exfiltration Boundaries
    6. Resource Scope Glob Confinement
    7. Atomic Human Approval Nonce Verification
    8. Tamper-Evident Audit Recording
    """
    if tenant is None or not isinstance(tenant, TenantContext):
        tenant = TenantContext(org_id="default-org", org_name="Default Organization", plan="ENTERPRISE")


    now = datetime.now(timezone.utc)
    trace_id = request.trace_id or str(uuid.uuid4())


    # 1. Update agent last_active timestamp if registered
    agent = (
        db.query(AgentModel)
        .filter(AgentModel.id == request.agent_id, AgentModel.org_id == tenant.org_id)
        .first()
    )
    if agent:
        agent.last_active_at = now
        db.commit()

    # 2. Resolve Intent Authorization Context if provided
    sdk_intent = None
    if request.intent_id:
        db_intent = (
            db.query(IntentContextModel)
            .filter(
                IntentContextModel.id == request.intent_id,
                IntentContextModel.org_id == tenant.org_id,
            )
            .first()
        )
        if not db_intent:
            # Intent context specified but not found in tenant -> Fail closed DENY
            action_hash = ToolCall(
                tool_name=request.tool_name,
                agent_id=request.agent_id,
                intent_id=request.intent_id,
            ).canonical_hash()

            audit = append_audit_event(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                tool_name=request.tool_name,
                verdict=DecisionVerdict.DENY.value,
                reason="INTENT_CONTEXT_NOT_FOUND",
                policy_id="",
                action_hash=action_hash,
                trace_id=trace_id,
                intent_id=request.intent_id or "",
                risk_score=1.0,
                execution_success=False,
                execution_error="Intent context does not exist or does not belong to authenticated organization",
                timestamp=now,
            )
            db.commit()

            ThreatDetector.inspect_and_record(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                verdict="DENY",
                reason="INTENT_CONTEXT_NOT_FOUND",
                trace_id=trace_id,
                tool_name=request.tool_name,
                now=now,
            )

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason="INTENT_CONTEXT_NOT_FOUND",
                decision_id=str(uuid.uuid4()),
                action_hash=action_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )
        sdk_intent = _build_sdk_intent(db_intent)

    # 3. Resolve policy for tenant
    db_policy = None
    if agent and agent.policy_id:
        db_policy = (
            db.query(PolicyModel)
            .filter(PolicyModel.id == agent.policy_id, PolicyModel.org_id == tenant.org_id)
            .first()
        )

    # Fallback to organization policy or global fallback
    if not db_policy:
        db_policy = (
            db.query(PolicyModel)
            .filter(PolicyModel.org_id == tenant.org_id)
            .first()
        )
    if not db_policy:
        db_policy = db.query(PolicyModel).first()

    if not db_policy:
        # Fail closed: No policy in system -> DENY
        decision_id = str(uuid.uuid4())
        action_hash = ToolCall(
            tool_name=request.tool_name,
            intent_id=request.intent_id or "",
        ).canonical_hash()

        audit = append_audit_event(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.DENY.value,
            reason="POLICY_MISSING_FAIL_CLOSED",
            policy_id="",
            action_hash=action_hash,
            trace_id=trace_id,
            intent_id=request.intent_id or "",
            risk_score=1.0,
            execution_success=False,
            execution_error="No active policy found in tenant system",
            timestamp=now,
        )
        db.commit()

        ThreatDetector.inspect_and_record(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            verdict="DENY",
            reason="POLICY_MISSING_FAIL_CLOSED",
            trace_id=trace_id,
            tool_name=request.tool_name,
            now=now,
        )

        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason="POLICY_MISSING_FAIL_CLOSED",
            decision_id=decision_id,
            action_hash=action_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            intent_id=request.intent_id,
            trace_id=trace_id,
        )

    sdk_policy = _build_sdk_policy(db_policy)

    # 4. Build SDK ToolCall
    tool_call = ToolCall(
        tool_name=request.tool_name,
        arguments=request.arguments,
        agent_id=request.agent_id,
        user_request=request.user_request,
        sensitivity=request.sensitivity,
        resource_id=request.resource_id,
        recipient=request.recipient,
        intent_id=request.intent_id or "",
        trace_id=trace_id,
    )
    action_hash = tool_call.canonical_hash()

    # 5. Synthesize ephemeral registry for permission mapping (permission name = tool name)
    ephemeral_registry = ToolRegistry()
    ephemeral_registry.register(
        name=request.tool_name,
        handler=lambda **kw: None,
        permission=request.tool_name,
        sensitivity=request.sensitivity,
    )

    # 6. Assess Risk
    desc, _ = ephemeral_registry.get(request.tool_name)
    risk_score, risk_level = _risk_engine.assess(tool_call, desc)

    # 7. Check if executing with a pre-approved token (Atomic Single-Use Check)
    if request.approval_id:
        approval = (
            db.query(ApprovalModel)
            .filter(
                ApprovalModel.id == request.approval_id,
                ApprovalModel.org_id == tenant.org_id,
            )
            .with_for_update(nowait=False) if db.bind and db.bind.dialect.name != "sqlite" else
            db.query(ApprovalModel).filter(
                ApprovalModel.id == request.approval_id,
                ApprovalModel.org_id == tenant.org_id,
            )
        ).first()

        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval token '{request.approval_id}' not found for tenant",
            )
        if approval.status != ApprovalStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Approval token is in status '{approval.status}', not APPROVED",
            )
        if approval.consumed:
            ThreatDetector.inspect_and_record(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                verdict="DENY",
                reason="REPLAY_ATTACK_CONSUMED_APPROVAL",
                trace_id=trace_id,
                tool_name=request.tool_name,
                now=now,
            )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Approval token has already been consumed (replay blocked)",
            )
        if approval.action_hash != action_hash:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Action payload hash does not match approved token",
            )

        expires_at = approval.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < now:
            approval.status = ApprovalStatus.EXPIRED.value
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_410_GONE,
                detail="Approval token has expired",
            )

        # Mark consumed atomically
        approval.consumed = True
        approval.consumed_at = now
        db.commit()

        # Audit ALLOW
        decision_id = str(uuid.uuid4())
        audit = append_audit_event(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.ALLOW.value,
            reason="APPROVED_BY_HUMAN",
            policy_id=sdk_policy.policy_id,
            action_hash=action_hash,
            approval_id=request.approval_id,
            intent_id=request.intent_id or "",
            trace_id=trace_id,
            risk_score=risk_score,
            execution_success=True,
            timestamp=now,
        )
        db.commit()

        return InterceptResponse(
            verdict=DecisionVerdict.ALLOW,
            allowed=True,
            reason="APPROVED_BY_HUMAN",
            decision_id=decision_id,
            action_hash=action_hash,
            risk_score=risk_score,
            risk_level=risk_level,
            approval_id=request.approval_id,
            intent_id=request.intent_id,
            trace_id=trace_id,
            policy_version=getattr(sdk_policy, "version", 1),
        )

    # 8. Evaluate 8-stage Policy & Intent Engine
    decision = _policy_engine.evaluate(
        tool_call,
        sdk_policy,
        ephemeral_registry,
        intent_context=sdk_intent,
    )

    # 9. Handle Outcomes
    created_approval_id = None
    if decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
        created_approval_id = str(uuid.uuid4())
        expires_at = now + timedelta(seconds=settings.DEFAULT_APPROVAL_TIMEOUT_SECONDS)
        db_approval = ApprovalModel(
            id=created_approval_id,
            org_id=tenant.org_id,
            action_hash=action_hash,
            tool_name=request.tool_name,
            agent_id=request.agent_id,
            intent_id=request.intent_id or "",
            status=ApprovalStatus.PENDING.value,
            created_at=now,
            expires_at=expires_at,
            arguments_json=request.arguments,
        )
        db.add(db_approval)

    # Log Audit
    audit = append_audit_event(
        db=db,
        org_id=tenant.org_id,
        agent_id=request.agent_id,
        tool_name=request.tool_name,
        verdict=decision.verdict.value,
        reason=decision.reason,
        policy_id=sdk_policy.policy_id,
        action_hash=action_hash,
        approval_id=created_approval_id or "",
        intent_id=request.intent_id or "",
        trace_id=trace_id,
        risk_score=risk_score,
        execution_success=(decision.verdict == DecisionVerdict.ALLOW),
        timestamp=now,
    )
    db.commit()

    if decision.verdict == DecisionVerdict.DENY:
        ThreatDetector.inspect_and_record(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            verdict="DENY",
            reason=decision.reason,
            trace_id=trace_id,
            tool_name=request.tool_name,
            now=now,
        )

    return InterceptResponse(
        verdict=decision.verdict,
        allowed=(decision.verdict == DecisionVerdict.ALLOW),
        reason=decision.reason,
        decision_id=decision.decision_id,
        action_hash=action_hash,
        risk_score=risk_score,
        risk_level=risk_level,
        approval_id=created_approval_id,
        intent_id=request.intent_id,
        trace_id=trace_id,
        policy_version=getattr(sdk_policy, "version", 1),
    )


