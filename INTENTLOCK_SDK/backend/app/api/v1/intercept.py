"""
INTENTLOCK Backend – Remote Tool-Call Interception Gateway Endpoint.

Allows external AI agents (LangChain, AutoGen, CrewAI, Custom) to route
tool calls over HTTP through the INTENTLOCK security enforcement layer.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AgentModel, PolicyModel, ApprovalModel, AuditEventModel
from app.schemas.schemas import InterceptRequest, InterceptResponse
from app.core.config import settings

from intentlock.models import (
    ToolCall,
    Policy,
    RiskLevel,
    DecisionVerdict,
    ApprovalStatus,
    RegisteredTool,
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


@router.post("", response_model=InterceptResponse)
def intercept_tool_call(
    request: InterceptRequest,
    db: Session = Depends(get_db),
):
    """
    Authoritative enforcement endpoint.
    Evaluates proposed tool call, validates permissions/approvals, and records audit.
    """
    now = datetime.now(timezone.utc)

    # 1. Update agent last_active timestamp if registered
    agent = db.query(AgentModel).filter(AgentModel.id == request.agent_id).first()
    if agent:
        agent.last_active_at = now
        db.commit()

    # 2. Resolve policy
    db_policy = None
    if agent and agent.policy_id:
        db_policy = db.query(PolicyModel).filter(PolicyModel.id == agent.policy_id).first()

    # If no agent-specific policy, look for a default or fallback policy
    if not db_policy:
        db_policy = db.query(PolicyModel).first()

    if not db_policy:
        # Fail closed: No policy in system -> DENY
        decision_id = str(uuid.uuid4())
        action_hash = ToolCall(tool_name=request.tool_name).canonical_hash()

        # Log audit
        audit = AuditEventModel(
            id=str(uuid.uuid4()),
            timestamp=now,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.DENY.value,
            reason="POLICY_MISSING_FAIL_CLOSED",
            policy_id="",
            action_hash=action_hash,
            risk_score=1.0,
            execution_success=False,
            execution_error="No active policy found in system",
        )
        db.add(audit)
        db.commit()

        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason="POLICY_MISSING_FAIL_CLOSED",
            decision_id=decision_id,
            action_hash=action_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
        )

    sdk_policy = _build_sdk_policy(db_policy)

    # 3. Build SDK ToolCall
    tool_call = ToolCall(
        tool_name=request.tool_name,
        arguments=request.arguments,
        agent_id=request.agent_id,
        user_request=request.user_request,
        sensitivity=request.sensitivity,
        resource_id=request.resource_id,
        recipient=request.recipient,
    )
    action_hash = tool_call.canonical_hash()

    # 4. Synthesize ephemeral registry for permission mapping (permission name = tool name)
    ephemeral_registry = ToolRegistry()
    ephemeral_registry.register(
        name=request.tool_name,
        handler=lambda **kw: None,
        permission=request.tool_name,
        sensitivity=request.sensitivity,
    )

    # 5. Assess Risk
    desc, _ = ephemeral_registry.get(request.tool_name)
    risk_score, risk_level = _risk_engine.assess(tool_call, desc)

    # 6. Check if executing with a pre-approved token
    if request.approval_id:
        approval = db.query(ApprovalModel).filter(ApprovalModel.id == request.approval_id).first()
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Approval token '{request.approval_id}' not found",
            )
        if approval.status != ApprovalStatus.APPROVED.value:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Approval token is in status '{approval.status}', not APPROVED",
            )
        if approval.consumed:
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

        # Mark consumed
        approval.consumed = True
        db.commit()

        # Audit ALLOW
        decision_id = str(uuid.uuid4())
        audit = AuditEventModel(
            id=str(uuid.uuid4()),
            timestamp=now,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.ALLOW.value,
            reason="APPROVED_BY_HUMAN",
            policy_id=sdk_policy.policy_id,
            action_hash=action_hash,
            approval_id=request.approval_id,
            risk_score=risk_score,
            execution_success=True,
        )
        db.add(audit)
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
        )

    # 7. Evaluate Policy
    decision = _policy_engine.evaluate(tool_call, sdk_policy, ephemeral_registry)

    # 8. Handle Outcomes
    created_approval_id = None
    if decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
        created_approval_id = str(uuid.uuid4())
        expires_at = now + timedelta(seconds=settings.DEFAULT_APPROVAL_TIMEOUT_SECONDS)
        db_approval = ApprovalModel(
            id=created_approval_id,
            action_hash=action_hash,
            tool_name=request.tool_name,
            agent_id=request.agent_id,
            status=ApprovalStatus.PENDING.value,
            created_at=now,
            expires_at=expires_at,
            arguments_json=request.arguments,
        )
        db.add(db_approval)

    # Log Audit
    audit = AuditEventModel(
        id=str(uuid.uuid4()),
        timestamp=now,
        agent_id=request.agent_id,
        tool_name=request.tool_name,
        verdict=decision.verdict.value,
        reason=decision.reason,
        policy_id=sdk_policy.policy_id,
        action_hash=action_hash,
        approval_id=created_approval_id or "",
        risk_score=risk_score,
        execution_success=(decision.verdict == DecisionVerdict.ALLOW),
    )
    db.add(audit)
    db.commit()

    return InterceptResponse(
        verdict=decision.verdict,
        allowed=(decision.verdict == DecisionVerdict.ALLOW),
        reason=decision.reason,
        decision_id=decision.decision_id,
        action_hash=action_hash,
        risk_score=risk_score,
        risk_level=risk_level,
        approval_id=created_approval_id,
    )

