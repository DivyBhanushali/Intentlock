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
    OrganizationModel,
    PolicyModel,
    SentinelTaskSessionModel,
    SentinelBehavioralEventModel,
)
from app.schemas.schemas import InterceptRequest, InterceptResponse
from app.core.config import settings
from app.core.audit_chain import append_audit_event
from app.core.threat_engine import ThreatDetector
from sictack.coordination.state_sync import get_state_sync_coordinator

from sictack.models import (
    ApprovalStatus,
    DecisionVerdict,
    IntentContext,
    Policy,
    RegisteredTool,
    RiskLevel,
    ToolCall,
)
from sictack.policy_engine import PolicyEngine
from sictack.risk_engine import RiskEngine
from sictack.registry import ToolRegistry
from sictack.sentinel.collector import redact_sensitive_data

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
        version=getattr(db_policy, "version", 1) or 1,
        parameter_constraints=getattr(db_policy, "parameter_constraints", {}) or {},
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
    tenant: TenantContext = Depends(get_current_tenant),
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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please provide a valid Bearer JWT session token or X-API-Key.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    now = datetime.now(timezone.utc)
    trace_id = request.trace_id or str(uuid.uuid4())
    coordinator = get_state_sync_coordinator()

    # Replay protection via distributed nonce registration
    # Note: Early security denial risk_score=1.0 represents conservative fail-closed enforcement severity, not a measured threat probability.
    if getattr(request, "nonce", None):
        if not coordinator.register_nonce(request.nonce):
            act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason="REPLAY_DETECTED: Action nonce has already been consumed or duplicated",
                decision_id=str(uuid.uuid4()),
                action_hash=act_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                policy_id="",
                requires_approval=False,
                trace_id=trace_id,
            )

    # 0. Entitlement & Quota Enforcement (Atomic, Concurrency-Safe, Fail Closed)
    org = db.query(OrganizationModel).filter(OrganizationModel.id == tenant.org_id).first()
    if org and getattr(org, "status", "ACTIVE") != "ACTIVE":
        act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason=f"TENANT_SUSPENDED: Organization status is {org.status}",
            decision_id=str(uuid.uuid4()),
            action_hash=act_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            policy_id="",
            requires_approval=False,
            trace_id=trace_id,
        )

    max_monthly = org.max_monthly_actions if (org and org.max_monthly_actions is not None) else 100000
    thirty_days_ago = now - timedelta(days=30)
    current_monthly_count = (
        db.query(AuditEventModel)
        .filter(
            AuditEventModel.org_id == tenant.org_id,
            AuditEventModel.timestamp >= thirty_days_ago,
        )
        .count()
    )
    is_allowed, current_sync, limit = coordinator.consume_quota(tenant.org_id, max_monthly)
    if current_monthly_count >= max_monthly or not is_allowed:
        act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason="QUOTA_EXCEEDED: Monthly action entitlement exhausted",
            decision_id=str(uuid.uuid4()),
            action_hash=act_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            policy_id="",
            requires_approval=False,
            trace_id=trace_id,
        )

    # 1. Update agent last_active timestamp if registered and verify agent status
    # 1A. Check if API key is restricted to specific agent identity
    if tenant.api_key:
        key_scopes = getattr(tenant.api_key, "scopes", []) or []
        if isinstance(key_scopes, str):
            key_scopes = [key_scopes]
        agent_scopes = [s.split("agent:", 1)[1] for s in key_scopes if s.startswith("agent:") and len(s) > 6]
        if agent_scopes and request.agent_id not in agent_scopes:
            act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
            audit = append_audit_event(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                tool_name=request.tool_name,
                verdict=DecisionVerdict.DENY.value,
                reason="API_KEY_AGENT_MISMATCH",
                policy_id="",
                action_hash=act_hash,
                trace_id=trace_id,
                intent_id=request.intent_id or "",
                risk_score=1.0,
                execution_success=False,
                execution_error=f"API key is restricted to agent(s) {agent_scopes}, but request specified '{request.agent_id}'",
                timestamp=now,
            )
            db.commit()

            try:
                ThreatDetector.inspect_and_record(
                    db=db,
                    org_id=tenant.org_id,
                    agent_id=request.agent_id,
                    verdict="DENY",
                    reason="API_KEY_AGENT_MISMATCH",
                    trace_id=trace_id,
                    tool_name=request.tool_name,
                    now=now,
                )
            except Exception:
                pass  # Threat recording failure must not convert DENY to ALLOW

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason=f"API_KEY_AGENT_MISMATCH: API key is not authorized for agent '{request.agent_id}'",
                decision_id=str(uuid.uuid4()),
                action_hash=act_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                policy_id="",
                requires_approval=False,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )

    # 1B. Check for cross-tenant agent reference
    other_tenant_agent = db.query(AgentModel).filter(AgentModel.id == request.agent_id).first()
    if other_tenant_agent and other_tenant_agent.org_id != tenant.org_id:
        act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
        audit = append_audit_event(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.DENY.value,
            reason="CROSS_TENANT_AGENT_UNAUTHORIZED",
            policy_id="",
            action_hash=act_hash,
            trace_id=trace_id,
            intent_id=request.intent_id or "",
            risk_score=1.0,
            execution_success=False,
            execution_error=f"Agent '{request.agent_id}' belongs to organization '{other_tenant_agent.org_id}', not '{tenant.org_id}'",
            timestamp=now,
        )
        db.commit()

        try:
            ThreatDetector.inspect_and_record(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                verdict="DENY",
                reason="CROSS_TENANT_AGENT_UNAUTHORIZED",
                trace_id=trace_id,
                tool_name=request.tool_name,
                now=now,
            )
        except Exception:
            pass  # Threat recording failure must not convert DENY to ALLOW

        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason=f"CROSS_TENANT_AGENT_UNAUTHORIZED: Agent '{request.agent_id}' does not belong to authenticated tenant",
            decision_id=str(uuid.uuid4()),
            action_hash=act_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            policy_id="",
            requires_approval=False,
            intent_id=request.intent_id,
            trace_id=trace_id,
        )

    agent = (
        db.query(AgentModel)
        .filter(AgentModel.id == request.agent_id, AgentModel.org_id == tenant.org_id)
        .first()
    )
    if agent:
        agent_status = getattr(agent, "status", "ACTIVE") or "ACTIVE"
        if agent_status.upper() in ("SUSPENDED", "DECOMMISSIONED"):
            act_hash = ToolCall(tool_name=request.tool_name, agent_id=request.agent_id).canonical_hash()
            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason=f"AGENT_{agent_status.upper()}: Agent is not in active operational state",
                decision_id=str(uuid.uuid4()),
                action_hash=act_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                policy_id=agent.policy_id or "",
                requires_approval=False,
                trace_id=trace_id,
            )
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

    # 2b. SENTINEL Task Session Enforcement (Phase 1B/1C)
    req_session_id = getattr(request, "session_id", None)
    sentinel_session = None
    if req_session_id:
        sentinel_session = (
            db.query(SentinelTaskSessionModel)
            .filter(
                SentinelTaskSessionModel.id == req_session_id,
                SentinelTaskSessionModel.org_id == tenant.org_id,
            )
            .first()
        )
        if not sentinel_session:
            # Session specified but not found in tenant -> Fail closed DENY
            action_hash = ToolCall(
                tool_name=request.tool_name,
                agent_id=request.agent_id,
                intent_id=request.intent_id or "",
            ).canonical_hash()

            audit = append_audit_event(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                tool_name=request.tool_name,
                verdict=DecisionVerdict.DENY.value,
                reason="SENTINEL_SESSION_NOT_FOUND_FOR_TENANT",
                policy_id="",
                action_hash=action_hash,
                trace_id=trace_id,
                intent_id=request.intent_id or "",
                risk_score=1.0,
                execution_success=False,
                execution_error=f"Task session '{req_session_id}' not found for tenant '{tenant.org_id}'",
                timestamp=now,
            )
            db.commit()

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason="SENTINEL_SESSION_NOT_FOUND_FOR_TENANT",
                decision_id=str(uuid.uuid4()),
                action_hash=action_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                session_id=req_session_id,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )

        # Check cross-agent authorization: session must belong to the requesting agent
        if sentinel_session.agent_id and sentinel_session.agent_id != request.agent_id:
            action_hash = ToolCall(
                tool_name=request.tool_name,
                agent_id=request.agent_id,
                intent_id=request.intent_id or "",
            ).canonical_hash()

            audit = append_audit_event(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                tool_name=request.tool_name,
                verdict=DecisionVerdict.DENY.value,
                reason="CROSS_AGENT_SESSION_UNAUTHORIZED",
                policy_id="",
                action_hash=action_hash,
                trace_id=trace_id,
                intent_id=request.intent_id or "",
                risk_score=1.0,
                execution_success=False,
                execution_error=f"Task session '{req_session_id}' belongs to agent '{sentinel_session.agent_id}', not '{request.agent_id}'",
                timestamp=now,
            )
            db.commit()

            try:
                ThreatDetector.inspect_and_record(
                    db=db,
                    org_id=tenant.org_id,
                    agent_id=request.agent_id,
                    verdict="DENY",
                    reason="CROSS_AGENT_SESSION_UNAUTHORIZED",
                    trace_id=trace_id,
                    tool_name=request.tool_name,
                    now=now,
                )
            except Exception:
                pass  # Threat recording failure must not convert DENY to ALLOW

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason=f"CROSS_AGENT_SESSION_UNAUTHORIZED: Task session '{req_session_id}' belongs to agent '{sentinel_session.agent_id}', not '{request.agent_id}'",
                decision_id=str(uuid.uuid4()),
                action_hash=action_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                session_id=req_session_id,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )

        # Check session suspension state
        if sentinel_session.session_state == "SUSPENDED":
            sentinel_session.blocked_executions = (sentinel_session.blocked_executions or 0) + 1
            sentinel_session.scope_violations = (sentinel_session.scope_violations or 0) + 1
            sentinel_session.updated_at = now

            suspension_event = SentinelBehavioralEventModel(
                id=f"bev_{uuid.uuid4().hex[:16]}",
                org_id=tenant.org_id,
                session_id=sentinel_session.id,
                correlation_id=trace_id,
                event_type="SCOPE_VIOLATION",
                tool_name=request.tool_name,
                resource_id=request.resource_id,
                verdict="DENY",
                execution_success=False,
                execution_error=f"Execution blocked: session is suspended ({sentinel_session.suspension_reason})",
                step_index=len(sentinel_session.events) + 1,
                event_payload={"suspension_reason": sentinel_session.suspension_reason},
                timestamp=now,
            )
            db.add(suspension_event)
            db.add(sentinel_session)
            db.commit()

            action_hash = ToolCall(
                tool_name=request.tool_name,
                agent_id=request.agent_id,
                intent_id=request.intent_id or "",
            ).canonical_hash()

            ThreatDetector.inspect_and_record(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                verdict="DENY",
                reason="SESSION_SUSPENDED_EXECUTION_BLOCKED",
                trace_id=trace_id,
                tool_name=request.tool_name,
                now=now,
            )

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason=f"Session is suspended: execution blocked at boundary ({sentinel_session.suspension_reason or 'Policy suspension'})",
                decision_id=str(uuid.uuid4()),
                action_hash=action_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                session_id=req_session_id,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )

        # Check terminal state
        if sentinel_session.session_state in {"COMPLETED", "FAILED", "TERMINATED"}:
            sentinel_session.blocked_executions = (sentinel_session.blocked_executions or 0) + 1
            sentinel_session.updated_at = now
            db.add(sentinel_session)
            db.commit()

            action_hash = ToolCall(
                tool_name=request.tool_name,
                agent_id=request.agent_id,
                intent_id=request.intent_id or "",
            ).canonical_hash()

            return InterceptResponse(
                verdict=DecisionVerdict.DENY,
                allowed=False,
                reason=f"Session is in terminal state: {sentinel_session.session_state}",
                decision_id=str(uuid.uuid4()),
                action_hash=action_hash,
                risk_score=1.0,
                risk_level=RiskLevel.CRITICAL,
                session_id=req_session_id,
                intent_id=request.intent_id,
                trace_id=trace_id,
            )

        # Scope enforcement (strict tools list)
        scope = sentinel_session.authorized_scope or {}
        if scope.get("enforce_strict_scope", True) and scope.get("allowed_tools"):
            if request.tool_name not in scope["allowed_tools"]:
                sentinel_session.blocked_executions = (sentinel_session.blocked_executions or 0) + 1
                sentinel_session.scope_violations = (sentinel_session.scope_violations or 0) + 1
                sentinel_session.updated_at = now

                violation_event = SentinelBehavioralEventModel(
                    id=f"bev_{uuid.uuid4().hex[:16]}",
                    org_id=tenant.org_id,
                    session_id=sentinel_session.id,
                    correlation_id=trace_id,
                    event_type="SCOPE_VIOLATION",
                    tool_name=request.tool_name,
                    resource_id=request.resource_id,
                    verdict="DENY",
                    execution_success=False,
                    execution_error=f"Tool '{request.tool_name}' not permitted in session authorized scope",
                    step_index=len(sentinel_session.events) + 1,
                    event_payload={"allowed_tools": scope["allowed_tools"], "invoked_tool": request.tool_name},
                    timestamp=now,
                )
                db.add(violation_event)
                db.add(sentinel_session)
                db.commit()

                action_hash = ToolCall(
                    tool_name=request.tool_name,
                    agent_id=request.agent_id,
                    intent_id=request.intent_id or "",
                ).canonical_hash()

                ThreatDetector.inspect_and_record(
                    db=db,
                    org_id=tenant.org_id,
                    agent_id=request.agent_id,
                    verdict="DENY",
                    reason="SCOPE_VIOLATION_UNAUTHORIZED_TOOL",
                    trace_id=trace_id,
                    tool_name=request.tool_name,
                    now=now,
                )

                return InterceptResponse(
                    verdict=DecisionVerdict.DENY,
                    allowed=False,
                    reason=f"Tool '{request.tool_name}' not permitted in session authorized scope",
                    decision_id=str(uuid.uuid4()),
                    action_hash=action_hash,
                    risk_score=1.0,
                    risk_level=RiskLevel.CRITICAL,
                    session_id=req_session_id,
                    intent_id=request.intent_id,
                    trace_id=trace_id,
                )

        # Record EXECUTION_ATTEMPT
        attempt_event = SentinelBehavioralEventModel(
            id=f"bev_{uuid.uuid4().hex[:16]}",
            org_id=tenant.org_id,
            session_id=sentinel_session.id,
            correlation_id=trace_id,
            event_type="EXECUTION_ATTEMPT",
            tool_name=request.tool_name,
            resource_id=request.resource_id,
            step_index=len(sentinel_session.events) + 1,
            event_payload=redact_sensitive_data(request.arguments or {}),
            timestamp=now,
        )
        db.add(attempt_event)
        db.commit()

    # 3. Resolve policy for tenant
    db_policy = None
    if agent and agent.policy_id:
        db_policy = (
            db.query(PolicyModel)
            .filter(PolicyModel.id == agent.policy_id, PolicyModel.org_id == tenant.org_id)
            .first()
        )

    # Fallback to organization-scoped policy
    if not db_policy:
        db_policy = (
            db.query(PolicyModel)
            .filter(PolicyModel.org_id == tenant.org_id)
            .first()
        )

    if not db_policy:
        # Fail closed: No policy in tenant -> DENY (never fallback to other tenants)
        decision_id = str(uuid.uuid4())
        action_hash = ToolCall(
            tool_name=request.tool_name,
            agent_id=request.agent_id,
            intent_id=request.intent_id or "",
        ).canonical_hash()

        audit = append_audit_event(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.DENY.value,
            reason="POLICY_NOT_FOUND_FOR_TENANT",
            policy_id="",
            action_hash=action_hash,
            trace_id=trace_id,
            intent_id=request.intent_id or "",
            risk_score=1.0,
            execution_success=False,
            execution_error="No active policy configured for tenant organization",
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

    # 3b. Mandatory Task Session Verification (if mandated by active policy)
    policy_constraints = getattr(db_policy, "parameter_constraints", {}) or {}
    if (
        isinstance(policy_constraints, dict)
        and (policy_constraints.get("require_session") or policy_constraints.get("mandatory_session"))
        and not req_session_id
    ):
        action_hash = ToolCall(
            tool_name=request.tool_name,
            agent_id=request.agent_id,
            intent_id=request.intent_id or "",
        ).canonical_hash()

        audit = append_audit_event(
            db=db,
            org_id=tenant.org_id,
            agent_id=request.agent_id,
            tool_name=request.tool_name,
            verdict=DecisionVerdict.DENY.value,
            reason="MANDATORY_SESSION_REQUIRED",
            policy_id=db_policy.id,
            action_hash=action_hash,
            trace_id=trace_id,
            intent_id=request.intent_id or "",
            risk_score=1.0,
            execution_success=False,
            execution_error=f"Policy '{db_policy.name}' mandates an active SENTINEL task session, but none was provided",
            timestamp=now,
        )
        db.commit()

        try:
            ThreatDetector.inspect_and_record(
                db=db,
                org_id=tenant.org_id,
                agent_id=request.agent_id,
                verdict="DENY",
                reason="MANDATORY_SESSION_REQUIRED",
                trace_id=trace_id,
                tool_name=request.tool_name,
                now=now,
            )
        except Exception:
            pass  # Threat recording failure must not convert DENY to ALLOW

        return InterceptResponse(
            verdict=DecisionVerdict.DENY,
            allowed=False,
            reason=f"MANDATORY_SESSION_REQUIRED: Policy '{db_policy.name}' mandates an active task session",
            decision_id=str(uuid.uuid4()),
            action_hash=action_hash,
            risk_score=1.0,
            risk_level=RiskLevel.CRITICAL,
            policy_id=db_policy.id,
            intent_id=request.intent_id,
            trace_id=trace_id,
        )

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
        # Atomic conditional consumption in authoritative database (must not be expired)
        updated_count = (
            db.query(ApprovalModel)
            .filter(
                ApprovalModel.id == request.approval_id,
                ApprovalModel.org_id == tenant.org_id,
                ApprovalModel.status == ApprovalStatus.APPROVED.value,
                ApprovalModel.consumed == False,
                ApprovalModel.action_hash == action_hash,
                ApprovalModel.expires_at > now,
            )
            .update(
                {
                    ApprovalModel.consumed: True,
                    ApprovalModel.consumed_at: now,
                },
                synchronize_session="fetch",
            )
        )
        db.commit()

        if updated_count == 0:
            # Query the reason for rejection to return accurate fail-closed HTTP error
            existing = (
                db.query(ApprovalModel)
                .filter(
                    ApprovalModel.id == request.approval_id,
                    ApprovalModel.org_id == tenant.org_id,
                )
                .first()
            )
            if not existing:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Approval token '{request.approval_id}' not found for tenant",
                )
            if existing.consumed:
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
            if existing.status != ApprovalStatus.APPROVED.value:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Approval token is in status '{existing.status}', not APPROVED",
                )
            if existing.action_hash != action_hash:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Action payload hash does not match approved token",
                )
            expires_at = existing.expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < now:
                existing.status = ApprovalStatus.EXPIRED.value
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_410_GONE,
                    detail="Approval token has expired",
                )
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Approval token could not be consumed atomically",
            )

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

        if sentinel_session:
            sentinel_session.total_executions = (sentinel_session.total_executions or 0) + 1
            sentinel_session.updated_at = now
            outcome_event = SentinelBehavioralEventModel(
                id=f"bev_{uuid.uuid4().hex[:16]}",
                org_id=tenant.org_id,
                session_id=sentinel_session.id,
                correlation_id=trace_id,
                event_type="EXECUTION_OUTCOME",
                tool_name=request.tool_name,
                resource_id=request.resource_id,
                verdict="ALLOW",
                execution_success=True,
                step_index=len(sentinel_session.events) + 1,
                timestamp=now,
            )
            db.add(outcome_event)
            db.add(sentinel_session)

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
            session_id=req_session_id,
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

    if sentinel_session:
        sentinel_session.total_executions = (sentinel_session.total_executions or 0) + 1
        if decision.verdict != DecisionVerdict.ALLOW:
            sentinel_session.blocked_executions = (sentinel_session.blocked_executions or 0) + 1
        sentinel_session.updated_at = now
        outcome_event = SentinelBehavioralEventModel(
            id=f"bev_{uuid.uuid4().hex[:16]}",
            org_id=tenant.org_id,
            session_id=sentinel_session.id,
            correlation_id=trace_id,
            event_type="EXECUTION_OUTCOME",
            tool_name=request.tool_name,
            resource_id=request.resource_id,
            verdict=decision.verdict.value,
            execution_success=(decision.verdict == DecisionVerdict.ALLOW),
            execution_error=decision.reason if decision.verdict != DecisionVerdict.ALLOW else None,
            step_index=len(sentinel_session.events) + 1,
            timestamp=now,
        )
        db.add(outcome_event)
        db.add(sentinel_session)

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
        requires_approval=(decision.verdict == DecisionVerdict.REQUIRE_APPROVAL),
        intent_id=request.intent_id,
        session_id=req_session_id,
        trace_id=trace_id,
        policy_version=getattr(sdk_policy, "version", 1),
    )


