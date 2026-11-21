"""
INTENTLOCK Unified Security Client (Phase 3D).

Single unified entry point providing:
- CORE contextual authorization (allow/deny/require_approval)
- SENTINEL Semantic Objective Guardian & behavioral monitoring
- Thread-safe task context manager (`with security.task(...) as task:`)
- Decorator-based tool interception (`@security.protect_tool(...)`)
- Seamless transition between local zero-dependency and remote API gateway
"""

from __future__ import annotations

import asyncio
import contextvars
import functools
import inspect
import os
import threading
import uuid
from typing import Any, Callable, Dict, List, Optional, Set, Union

from sictack.approval import ApprovalService
from sictack.audit import AuditService
from sictack.client import IntentLockClient
from sictack.exceptions import (
    ApprovalRequiredError,
    IntentLockError,
    PermissionDeniedError,
    ExecutionBudgetExceededError,
    SessionSuspendedError,
    SessionTerminalError,
)
from sictack.delegation import DelegationEngine
from sictack.gateway import ActionGateway
from sictack.models import (
    AgentIdentity,
    Config,
    Decision,
    DecisionVerdict,
    DelegationToken,
    Policy,
    RegisteredTool,
    RiskLevel,
    SecurityMode,
    ToolCall,
)
from sictack.policy_engine import PolicyEngine
from sictack.registry import ToolRegistry
from sictack.risk_engine import RiskEngine
from sictack.sentinel.containment import AutomatedContainmentEngine
from sictack.sentinel.detectors import BehavioralIntelligenceEngine
from sictack.sentinel.models import (
    DetectionSeverity,
    TaskScope,
    TaskSession,
    TaskSessionState,
)
from sictack.sentinel.objective_guardian import (
    ObjectiveAlignmentStatus,
    SemanticAssessment,
    SemanticObjectiveGuardian,
)
from sictack.sentinel.risk_engine import ExplainableRiskEngine
from sictack.sentinel.session import TaskSessionManager
from sictack.communication import AgentCommunicationBroker, MessageEnvelope
from sictack.sentinel.correlation import MultiAgentCorrelationEngine
from sictack.sentinel.hierarchical_guardian import HierarchicalObjectiveGuardian
from sictack.sentinel.incidents import SecurityIncidentManager
from sictack.sentinel.multi_agent_models import (
    AgentRiskScore,
    IncidentSeverity,
    IncidentStatus,
    MultiAgentDetectionResult,
    ObjectiveAlignmentAssessment,
    SecurityIncident,
)
from sictack.provenance.models import (
    DataProvenanceRecord,
    ProvenanceLineageNode,
    SourceType,
    TrustLevel,
)
from sictack.provenance.graph import ProvenanceTracker
from sictack.provenance.trust import TrustPolicyEngine
from sictack.sentinel.tool_output_analyzer import (
    ToolOutputSecurityAnalyzer,
    ToolOutputThreatDetection,
    ToolOutputThreatType,
)
from sictack.integrity.models import (
    ExecutionIntegrityDigest,
    ExecutionIntegrityResult,
)
from sictack.integrity.validator import ExecutionIntegrityValidator
from sictack.isolation.models import (
    ExecutionLimits,
    IsolatedExecutionResult,
    IsolationMode,
)
from sictack.isolation.sandbox import RuntimeSandbox
from sictack.audit import EvidenceChainVerificationResult


_current_task_context: contextvars.ContextVar[Optional[TaskContext]] = (
    contextvars.ContextVar("current_task_context", default=None)
)


class TaskContext:
    """
    Task-scoped runtime execution and objective boundary context.
    Provides async and thread-safe task isolation via contextvars.
    Created via `with security.task(...) as task:` or `async with security.task(...) as task:`.
    """

    def __init__(
        self,
        security: "IntentLock",
        objective: str,
        allowed_tools: Optional[List[str]] = None,
        allowed_resources: Optional[List[str]] = None,
        max_executions: int = 100,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        delegation_token: Optional[DelegationToken] = None,
        parent_policy: Optional[Policy] = None,
        parent_task_context: Optional["TaskContext"] = None,
    ) -> None:
        self.security = security
        self.objective = objective.strip()
        self.allowed_tools = allowed_tools or []
        self.allowed_resources = allowed_resources or []
        self.max_executions = max_executions
        self.session_id = session_id or f"sess_{uuid.uuid4().hex[:16]}"
        self.metadata = metadata or {}
        self.executions_count = 0
        self.delegation_token = delegation_token
        self.parent_policy = parent_policy
        self.parent_task_context = parent_task_context
        self._session: Optional[TaskSession] = None
        self._token: Optional[contextvars.Token] = None
        self._lock = threading.Lock()

    def __enter__(self) -> TaskContext:
        if self.security.sentinel and self._session is None:
            scope = TaskScope(
                allowed_tools=self.allowed_tools,
                allowed_resources=self.allowed_resources,
                max_executions=self.max_executions,
                enforce_strict_scope=bool(self.allowed_tools),
            )
            self._session = self.security.session_manager.create_session(
                org_id=self.security.org_id,
                agent_id=self.security.agent_id,
                task_objective=self.objective,
                authorized_scope=scope,
                auto_activate=True,
            )
        self._token = _current_task_context.set(self)
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        try:
            if self._session and not self._session.is_terminal():
                if self._session.is_suspended():
                    # Session is under containment; preserve suspended state
                    pass
                elif exc_type is not None:
                    self.security.session_manager.fail_session(
                        self._session, reason=f"Task exited with exception: {exc_val}"
                    )
                else:
                    self.security.session_manager.complete_session(self._session)
        finally:
            if self._token is not None:
                try:
                    _current_task_context.reset(self._token)
                except (ValueError, RuntimeError):
                    _current_task_context.set(None)
                self._token = None
            else:
                _current_task_context.set(None)

    async def __aenter__(self) -> TaskContext:
        return self.__enter__()

    async def __aexit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.__exit__(exc_type, exc_val, exc_tb)

    def execute(
        self,
        tool: Union[Callable[..., Any], str],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """Execute a tool synchronously within this task boundary."""
        return self.security.execute(
            tool=tool,
            args=args,
            kwargs=kwargs,
            task_context=self,
        )

    async def execute_async(
        self,
        tool: Union[Callable[..., Any], str],
        *args: Any,
        **kwargs: Any,
    ) -> Any:
        """Execute a tool asynchronously within this task boundary."""
        return await self.security.execute_async(
            tool=tool,
            args=args,
            kwargs=kwargs,
            task_context=self,
        )

    def record_provenance(
        self,
        source_type: SourceType,
        source_identifier: str,
        data: Any,
        trust_level: Optional[TrustLevel] = None,
        parent_provenance_ids: Optional[List[str]] = None,
        transformation_type: Optional[str] = None,
        data_classification: str = "INTERNAL",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DataProvenanceRecord:
        """Records data provenance scoped to this task context."""
        return self.security.record_provenance(
            source_type=source_type,
            source_identifier=source_identifier,
            data=data,
            trust_level=trust_level,
            parent_provenance_ids=parent_provenance_ids,
            transformation_type=transformation_type,
            agent_id=self.security.agent_id,
            session_id=self.session_id,
            data_classification=data_classification,
            metadata=metadata,
        )

    def analyze_tool_output(
        self,
        output: Any,
        source_type: SourceType = SourceType.TOOL_OUTPUT,
        source_identifier: str = "",
    ) -> ToolOutputThreatDetection:
        """Analyzes tool output for prompt injections or malicious directives within this task."""
        return self.security.analyze_tool_output(
            output=output,
            source_type=source_type,
            source_identifier=source_identifier,
            agent_id=self.security.agent_id,
            session_id=self.session_id,
        )

    def spawn_child_task(
        self,
        child_agent_id: str,
        objective: str,
        allowed_tools: Optional[List[str]] = None,
        delegated_permissions: Optional[List[str]] = None,
        budget: Optional[int] = None,
        allocated_budget: int = 50,
        ttl_seconds: int = 3600,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> TaskContext:
        """
        Spawns a child task execution context bound by least-privilege delegation
        and cascading containment.
        """
        effective_budget = budget if budget is not None else allocated_budget
        perms = list(delegated_permissions or [])
        tools = list(allowed_tools or [])
        if not perms and tools:
            for t_name in tools:
                if self.security.registry.has(t_name):
                    desc, _ = self.security.registry.get(t_name)
                    perms.append(desc.permission)

        token = self.security.delegation_engine.create_delegation(
            parent_agent_id=self.security.agent_id,
            child_agent_id=child_agent_id,
            org_id=self.security.org_id,
            parent_policy=self.security.policy,
            delegated_permissions=perms,
            delegated_tools=tools,
            allocated_budget=effective_budget,
            parent_session_id=self.session_id,
            depth=(self.delegation_token.depth + 1) if self.delegation_token else 1,
            ttl_seconds=ttl_seconds,
            metadata=metadata,
        )

        child_scope = TaskScope(
            allowed_tools=tools,
            max_executions=effective_budget,
            enforce_strict_scope=bool(tools),
        )

        child_ctx = TaskContext(
            security=self.security,
            objective=objective,
            allowed_tools=tools,
            max_executions=effective_budget,
            metadata=metadata,
            delegation_token=token,
            parent_policy=self.security.policy,
            parent_task_context=self,
        )

        if self._session and self.security.sentinel:
            child_session = self.security.session_manager.create_child_session(
                parent_session=self._session,
                child_agent_id=child_agent_id,
                task_objective=objective,
                authorized_scope=child_scope,
                delegation_id=token.delegation_id,
                auto_activate=True,
            )
            child_ctx._session = child_session
            child_ctx.session_id = child_session.session_id
            self.security.correlation_engine.register_relationship(self.security.agent_id, child_agent_id)
            self.security.correlation_engine.record_session(self.security.org_id, child_session)


        return child_ctx


class Sictack:
    """
    Unified high-level entry point for SICTACK Global AI Agent Security Infrastructure.

    Usage:
        security = Sictack(api_key="sck_...", mode="ENFORCE")

        @security.protect_tool(name="read_pdf", permission="pdf:read")
        def read_pdf(path: str):
            ...

        with security.task(objective="Process invoice", allowed_tools=["read_pdf"]) as task:
            task.execute("read_pdf", path="inv.pdf")
    """

    def __init__(
        self,
        api_key: str = "",
        base_url: str = "",
        agent_id: str = "default-agent",
        org_id: str = "default-org",
        core: bool = True,
        sentinel: bool = True,
        mode: Union[str, SecurityMode] = SecurityMode.ENFORCE,
        security_mode: Optional[Union[str, SecurityMode]] = None,
        policy: Optional[Policy] = None,
        config: Optional[Config] = None,
        broker: Optional[AgentCommunicationBroker] = None,
        correlation_engine: Optional[MultiAgentCorrelationEngine] = None,
        incident_manager: Optional[SecurityIncidentManager] = None,
    ) -> None:
        resolved_api_key = api_key or os.getenv("SICTACK_API_KEY") or os.getenv("INTENTLOCK_API_KEY") or ""
        resolved_base_url = (
            base_url
            or os.getenv("SICTACK_BASE_URL")
            or os.getenv("INTENTLOCK_BASE_URL")
            or ""
        )
        self.api_key = resolved_api_key.strip()
        self.base_url = resolved_base_url.rstrip("/") if resolved_base_url else ""
        self.agent_id = agent_id
        self.org_id = org_id
        self.core = core
        self.sentinel = sentinel

        effective_mode = security_mode if security_mode is not None else mode
        if isinstance(effective_mode, str):
            self.mode = SecurityMode(effective_mode.upper())
        else:
            self.mode = effective_mode

        # Core engines
        self.config = config or Config()
        self.registry = ToolRegistry()
        self.policy_engine = PolicyEngine()
        self.risk_engine = RiskEngine()
        self.approval_service = ApprovalService()
        self.audit_service = AuditService()
        self.gateway = ActionGateway(
            registry=self.registry,
            policy_engine=self.policy_engine,
            risk_engine=self.risk_engine,
            approval_service=self.approval_service,
            audit_service=self.audit_service,
            config=self.config,
        )

        # Sentinel engines
        self.session_manager = TaskSessionManager()
        self.intelligence_engine = BehavioralIntelligenceEngine()
        self.explainable_risk_engine = ExplainableRiskEngine()
        self.containment_engine = AutomatedContainmentEngine(session_manager=self.session_manager)
        self.objective_guardian = SemanticObjectiveGuardian()

        # Multi-agent delegation engine (Phase 4B)
        self.delegation_engine = DelegationEngine()

        # Multi-agent communication, correlation, hierarchical guardian, incidents (Phase 4C)
        self.broker = broker or AgentCommunicationBroker()
        self.correlation_engine = correlation_engine or MultiAgentCorrelationEngine()
        self.hierarchical_guardian = HierarchicalObjectiveGuardian()
        self.incident_manager = incident_manager or SecurityIncidentManager()

        # Provenance, Tool Output Analyzer, Integrity Validator, Runtime Sandbox (Phase 4D)
        self.provenance_tracker = ProvenanceTracker()
        self.tool_output_analyzer = ToolOutputSecurityAnalyzer()
        self.integrity_validator = ExecutionIntegrityValidator()
        self.sandbox = RuntimeSandbox()


        # Policy setup
        self.policy = policy or getattr(self.config, "default_policy", None) or Policy(
            security_mode=self.mode,
            allowed_permissions=["*"] if self.mode == SecurityMode.MONITOR else [],
        )
        if self.policy:
            self.policy.security_mode = self.mode
            self.config.default_policy = self.policy

        # Remote client (optional)
        self._remote_client: Optional[IntentLockClient] = None
        if self.base_url or self.api_key:
            self._remote_client = IntentLockClient(
                api_key=self.api_key,
                base_url=self.base_url or "https://intentlock-backend-ze2i.onrender.com",
                agent_id=self.agent_id,
            )

    def set_policy(self, policy: Policy) -> None:
        """Update active policy on Sictack instance and underlying gateway."""
        self.policy = policy
        self.policy.security_mode = self.mode
        self.config.default_policy = policy

    def approve(
        self,
        approval_id: str,
        approver_id: str = "human",
    ) -> ApprovalRequest:
        """Mark an approval request as APPROVED."""
        return self.approval_service.approve(approval_id, approver_id)

    def reject(
        self,
        approval_id: str,
        approver_id: str = "human",
    ) -> ApprovalRequest:
        """Mark an approval request as REJECTED."""
        return self.approval_service.reject(approval_id, approver_id)

    def get_pending_approvals(self) -> List[ApprovalRequest]:
        """Return all pending, non-expired approval requests."""
        return self.approval_service.list_pending()

    def get_audit_events(self, limit: int = 100) -> List[AuditEvent]:
        """Return the most recent audit events."""
        return self.audit_service.get_events(limit=limit)

    def get_audit_log(self, limit: int = 100) -> List[AuditEvent]:
        """Alias for get_audit_events."""
        return self.get_audit_events(limit=limit)

    def task(
        self,
        objective: str,
        allowed_tools: Optional[List[str]] = None,
        allowed_resources: Optional[List[str]] = None,
        max_executions: int = 100,
        session_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        delegation_token: Optional[DelegationToken] = None,
        parent_policy: Optional[Policy] = None,
        budget: Optional[int] = None,
    ) -> TaskContext:
        """Create a new task-scoped execution and security context."""
        effective_max = budget if budget is not None else max_executions
        return TaskContext(
            security=self,
            objective=objective,
            allowed_tools=allowed_tools,
            allowed_resources=allowed_resources,
            max_executions=effective_max,
            session_id=session_id,
            metadata=metadata,
            delegation_token=delegation_token,
            parent_policy=parent_policy,
        )

    def delegate(
        self,
        child_agent_id: str,
        permissions: List[str],
        tools: Optional[List[str]] = None,
        resources: Optional[List[str]] = None,
        budget: int = 50,
        ttl_seconds: int = 3600,
        parent_session_id: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DelegationToken:
        """Issue a cryptographically signed DelegationToken authorizing child_agent_id."""
        return self.delegation_engine.create_delegation(
            parent_agent_id=self.agent_id,
            child_agent_id=child_agent_id,
            org_id=self.org_id,
            parent_policy=self.policy,
            delegated_permissions=permissions,
            delegated_tools=tools,
            delegated_resources=resources,
            allocated_budget=budget,
            parent_session_id=parent_session_id,
            ttl_seconds=ttl_seconds,
            metadata=metadata,
        )

    def revoke_delegation(self, delegation_id: str, reason: str = "Operator revoked delegation") -> None:
        """Revoke a previously issued delegation token across all runtime contexts."""
        self.delegation_engine.revoke_delegation(delegation_id=delegation_id, reason=reason)

    def agent(
        self,
        agent_id: str,
        policy: Optional[Policy] = None,
        mode: Optional[Union[str, SecurityMode]] = None,
        role: str = "worker",
    ) -> IntentLock:
        """Create a child or sibling agent client sharing the core registries and delegation engine."""
        self.delegation_engine.register_agent(
            agent_id=agent_id,
            org_id=self.org_id,
            parent_agent_id=self.agent_id,
            role=role,
        )
        child = IntentLock(
            api_key=self.api_key,
            base_url=self.base_url,
            agent_id=agent_id,
            org_id=self.org_id,
            core=self.core,
            sentinel=self.sentinel,
            mode=mode or self.mode,
            policy=policy or self.policy,
            config=self.config,
        )
        child.registry = self.registry
        child.gateway = self.gateway
        child.session_manager = self.session_manager
        child.containment_engine = self.containment_engine
        child.delegation_engine = self.delegation_engine
        child.broker = self.broker
        child.correlation_engine = self.correlation_engine
        child.hierarchical_guardian = self.hierarchical_guardian
        child.incident_manager = self.incident_manager
        self.correlation_engine.register_relationship(self.agent_id, agent_id)
        return child

    def send_message(
        self,
        sender_id: Optional[str] = None,
        recipient_id: Optional[str] = None,
        payload: Optional[Dict[str, Any]] = None,
        message_type: str = "TASK_DELEGATION",
        ttl_seconds: int = 300,
    ) -> MessageEnvelope:
        """Send an authenticated message between agents, ingesting into SENTINEL correlation."""
        actual_sender = sender_id or self.agent_id or "agent"
        if not recipient_id:
            raise ValueError("recipient_id must be provided to send_message")
        envelope = self.broker.send_message(
            sender_id=actual_sender,
            recipient_id=recipient_id,
            payload=payload or {},
            message_type=message_type,
            ttl_seconds=ttl_seconds,
        )
        if self.sentinel:
            self.correlation_engine.record_message(self.org_id, envelope)
            detections = self.correlation_engine.evaluate(self.org_id)
            for det in detections:
                if det.severity in (DetectionSeverity.HIGH, DetectionSeverity.CRITICAL):
                    self.incident_manager.create_incident_from_detection(self.org_id, det)
        return envelope

    def receive_messages(self, recipient_id: Optional[str] = None) -> List[MessageEnvelope]:
        """Retrieve verified pending messages for an agent."""
        actual_recipient = recipient_id or self.agent_id or "agent"
        return self.broker.receive_messages(actual_recipient)

    def evaluate_hierarchy(
        self,
        *,
        user_objective: str,
        supervisor_objective: str,
        worker_objective: str,
        proposed_action: Optional[str] = None,
    ) -> ObjectiveAlignmentAssessment:
        """Evaluate semantic and policy alignment across multi-tiered agent delegation."""
        return self.hierarchical_guardian.evaluate_hierarchy(
            user_objective=user_objective,
            supervisor_objective=supervisor_objective,
            worker_objective=worker_objective,
            proposed_action=proposed_action,
        )

    def get_fleet_risk(self) -> Dict[str, Any]:
        """Calculate and return real-time fleet risk posture across all monitored agents."""
        return self.correlation_engine.get_fleet_risk(self.org_id)

    def list_incidents(
        self,
        status: Optional[IncidentStatus] = None,
        severity: Optional[IncidentSeverity] = None,
        agent_id: Optional[str] = None,
    ) -> List[SecurityIncident]:
        """List active and historical security incidents for the organization."""
        return self.incident_manager.list_incidents(self.org_id, status, severity, agent_id)

    def create_incident(
        self,
        title: str,
        trigger_rule_id: str,
        severity: IncidentSeverity = IncidentSeverity.HIGH,
        affected_agent_ids: Optional[List[str]] = None,
        session_ids: Optional[List[str]] = None,
        summary: str = "",
        evidence: Optional[Dict[str, Any]] = None,
    ) -> SecurityIncident:
        """Create a new managed security incident."""
        return self.incident_manager.create_incident(
            org_id=self.org_id,
            title=title,
            trigger_rule_id=trigger_rule_id,
            severity=severity,
            affected_agent_ids=affected_agent_ids,
            session_ids=session_ids,
            summary=summary,
            evidence=evidence,
        )

    def contain_incident(
        self,
        incident_id: str,
        action: str = "SUSPEND_AGENT",
        operator: Optional[str] = None,
    ) -> Optional[SecurityIncident]:
        """Apply containment remediation to an incident."""
        return self.incident_manager.contain_incident(self.org_id, incident_id, action, operator)

    def resolve_incident(
        self,
        incident_id: str,
        resolved_by: str,
        notes: str,
    ) -> Optional[SecurityIncident]:
        """Resolve and close a security incident."""
        return self.incident_manager.resolve_incident(self.org_id, incident_id, resolved_by, notes)

    # ------------------------------------------------------------------
    # Data Provenance, Output Analysis & Execution Integrity (Phase 4D)
    # ------------------------------------------------------------------

    def record_provenance(
        self,
        source_type: SourceType,
        source_identifier: str,
        data: Any = None,
        output_data: Any = None,
        trust_level: Optional[TrustLevel] = None,
        parent_provenance_ids: Optional[List[str]] = None,
        transformation_type: Optional[str] = None,
        agent_id: Optional[str] = None,
        session_id: Optional[str] = None,
        data_classification: str = "CONFIDENTIAL",
        authorization_decision_id: Optional[str] = None,
        incident_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> DataProvenanceRecord:
        """Records cryptographically signed data provenance record with cycle and boundary checking."""
        record = self.provenance_tracker.record_provenance(
            org_id=self.org_id,
            session_id=session_id or "",
            agent_id=agent_id or self.agent_id,
            source_type=source_type,
            source_identifier=source_identifier,
            input_content=data,
            output_content=output_data if output_data is not None else data,
            parent_provenance_ids=parent_provenance_ids,
            transformation_type=transformation_type,
            data_classification=data_classification,
            explicit_trust_level=trust_level,
            authorization_decision_id=authorization_decision_id,
            incident_id=incident_id,
        )
        self.audit_service.evidence_chain.append(
            event_type="PROVENANCE_RECORD",
            payload={
                "record_id": record.record_id,
                "source_type": record.source_type.value,
                "trust_level": record.trust_level.value,
                "input_hash": record.input_hash,
                "output_hash": record.output_hash,
            },
            agent_id=record.agent_id,
            provenance_id=record.record_id,
            decision_id=authorization_decision_id,
            incident_id=incident_id,
            metadata={"source_identifier": record.source_identifier},
        )
        return record

    def get_provenance_lineage(self, record_id: str, max_depth: int = 15) -> Optional[ProvenanceLineageNode]:
        """Traverse provenance DAG with cycle protection."""
        return self.provenance_tracker.get_lineage(org_id=self.org_id, record_id=record_id, max_depth=max_depth)

    def analyze_tool_output(
        self,
        output: Any,
        source_type: SourceType = SourceType.TOOL_OUTPUT,
        source_identifier: str = "",
        agent_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> ToolOutputThreatDetection:
        """Scans retrieved or tool output content for injections, prompt injection, and credential dumping."""
        res = self.tool_output_analyzer.analyze_output(
            output=output,
            source_type=source_type,
            source_identifier=source_identifier,
            agent_id=agent_id or self.agent_id,
            session_id=session_id,
        )
        if res.threat_detected:
            self.audit_service.evidence_chain.append(
                event_type="THREAT_DETECTION",
                payload={
                    "threat_types": [t.value for t in res.threat_types],
                    "confidence": res.confidence,
                    "reason": res.reason,
                },
                agent_id=agent_id or self.agent_id,
                metadata={"source_identifier": source_identifier},
            )
        return res

    def validate_execution_integrity(
        self,
        tool_name: str,
        arguments: Dict[str, Any],
        approved_digest: Optional[str] = None,
        nonce: Optional[str] = None,
        policy_version: int = 1,
        approval_token: Optional[str] = None,
        approval_expiry: Optional[datetime] = None,
        agent_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> ExecutionIntegrityResult:
        """Validates execution arguments against cryptographic digest, anti-replay nonce, and policy version."""
        res = self.integrity_validator.validate_execution(
            tool_name=tool_name,
            arguments=arguments,
            approved_digest=approved_digest,
            nonce=nonce,
            policy_version=policy_version,
            approval_token=approval_token,
            approval_expiry=approval_expiry,
            agent_id=agent_id or self.agent_id,
            session_id=session_id,
        )
        if not res.is_valid:
            self.audit_service.evidence_chain.append(
                event_type="INTEGRITY_VIOLATION",
                payload={
                    "tool_name": tool_name,
                    "rejection_reason": res.rejection_reason,
                },
                agent_id=agent_id or self.agent_id,
            )
        return res

    def execute_isolated(
        self,
        command: List[str],
        limits: Optional[ExecutionLimits] = None,
        mode: IsolationMode = IsolationMode.PROCESS,
    ) -> IsolatedExecutionResult:
        """Executes a tool/command within runtime sandbox with fail-closed non-downgrade guarantees."""
        res = self.sandbox.execute(command=command, limits=limits, mode=mode)
        self.audit_service.evidence_chain.append(
            event_type="ISOLATED_EXECUTION",
            payload={
                "command": command,
                "mode": res.mode.value,
                "exit_code": res.exit_code,
                "timed_out": res.timed_out,
            },
            agent_id=self.agent_id,
        )
        return res

    def verify_audit_chain(self) -> EvidenceChainVerificationResult:
        """Verifies the complete tamper-evident audit evidence chain."""
        return self.audit_service.verify_integrity()


    def protect_tool(
        self,
        name: Optional[str] = None,
        permission: Optional[str] = None,
        sensitivity: int = 0,
        description: str = "",
        operation_type: str = "execute",
    ) -> Callable:
        """
        Decorator wrapping a tool function with INTENTLOCK interception,
        CORE authorization, and SENTINEL behavioral verification.
        Transparently supports both synchronous and asynchronous (async def) tool functions.
        """
        def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
            tool_name = name or func.__name__
            perm = permission or tool_name
            if not self.registry.has(tool_name):
                self.registry.register(
                    name=tool_name,
                    handler=func,
                    permission=perm,
                    sensitivity=sensitivity,
                    description=description or (func.__doc__ or ""),
                )

            if inspect.iscoroutinefunction(func):
                @functools.wraps(func)
                async def async_wrapper(*args: Any, **kwargs: Any) -> Any:
                    active_ctx = _current_task_context.get()
                    try:
                        sig = inspect.signature(func)
                        bound = sig.bind(*args, **kwargs)
                        bound.apply_defaults()
                        call_kwargs = dict(bound.arguments)
                    except (TypeError, ValueError):
                        call_kwargs = dict(kwargs)
                    return await self.execute_async(
                        tool=tool_name,
                        args=(),
                        kwargs=call_kwargs,
                        task_context=active_ctx,
                        operation_type=operation_type,
                    )
                return async_wrapper
            else:
                @functools.wraps(func)
                def sync_wrapper(*args: Any, **kwargs: Any) -> Any:
                    active_ctx = _current_task_context.get()
                    try:
                        sig = inspect.signature(func)
                        bound = sig.bind(*args, **kwargs)
                        bound.apply_defaults()
                        call_kwargs = dict(bound.arguments)
                    except (TypeError, ValueError):
                        call_kwargs = dict(kwargs)
                    return self.execute(
                        tool=tool_name,
                        args=(),
                        kwargs=call_kwargs,
                        task_context=active_ctx,
                        operation_type=operation_type,
                    )
                return sync_wrapper
        return decorator

    def execute(
        self,
        tool: Union[Callable[..., Any], str],
        args: tuple = (),
        kwargs: Optional[Dict[str, Any]] = None,
        task_context: Optional[TaskContext] = None,
        operation_type: str = "execute",
    ) -> Any:
        """
        Primary execution entry point evaluating all CORE and SENTINEL security boundaries.
        """
        kw = dict(kwargs or {})
        handler = None
        # 1. Resolve tool name and callable handler
        if callable(tool):
            tool_name = getattr(tool, "__name__", "anonymous_tool")
            handler = tool
            if not self.registry.has(tool_name):
                self.registry.register(
                    name=tool_name,
                    handler=tool,
                    permission=tool_name,
                )
        else:
            tool_name = str(tool)
            if self.registry.has(tool_name):
                _, handler = self.registry.get(tool_name)

        if args and handler and callable(handler):
            try:
                sig = inspect.signature(handler)
                bound = sig.bind(*args, **kw)
                bound.apply_defaults()
                kw = dict(bound.arguments)
            except (TypeError, ValueError):
                pass

        # Check execution budget if task context is active
        if task_context:
            with task_context._lock:
                if task_context.executions_count >= task_context.max_executions:
                    raise ExecutionBudgetExceededError(
                        f"Task execution budget exceeded ({task_context.executions_count}/{task_context.max_executions})",
                        tool_name=tool_name,
                        reason="EXECUTION_BUDGET_EXCEEDED",
                    )
                task_context.executions_count += 1

        # 2. SENTINEL Objective Guardian check (if task context is active)
        if self.sentinel and task_context:
            assessment = self.objective_guardian.assess(
                objective=task_context.objective,
                tool_name=tool_name,
                arguments=kw,
                allowed_tools=task_context.allowed_tools,
                session_id=task_context.session_id,
            )
            # If critical deviation or prompt injection
            if assessment.severity == DetectionSeverity.CRITICAL:
                if self.mode in (SecurityMode.ENFORCE, SecurityMode.STRICT):
                    if task_context._session:
                        task_context._session = self.session_manager.suspend_session(
                            task_context._session,
                            reason=f"CRITICAL_OBJECTIVE_DEVIATION: {assessment.reason_codes}",
                        )
                    raise PermissionDeniedError(
                        f"Action blocked by Semantic Objective Guardian: {assessment.reason_codes}",
                        tool_name=tool_name,
                        reason="OBJECTIVE_DEVIATION_CRITICAL",
                    )

        # 3. Form ToolCall
        session_id = task_context.session_id if task_context else ""
        resource_id = str(kw.get("path") or kw.get("url") or kw.get("resource_id") or "")
        recipient = str(kw.get("recipient") or kw.get("email") or "")
        parent_agent_id = task_context.delegation_token.parent_agent_id if (task_context and task_context.delegation_token) else ""
        delegation_id = task_context.delegation_token.delegation_id if (task_context and task_context.delegation_token) else ""
        delegation_depth = task_context.delegation_token.depth if (task_context and task_context.delegation_token) else 0

        tc = ToolCall(
            tool_name=tool_name,
            arguments=kw,
            agent_id=self.agent_id,
            session_id=session_id,
            operation_type=operation_type,
            security_mode=self.mode,
            resource_id=resource_id,
            recipient=recipient,
            parent_agent_id=parent_agent_id,
            delegation_id=delegation_id,
            delegation_depth=delegation_depth,
        )

        # 3.1 Multi-Agent Delegated Authorization Check
        if task_context and task_context.delegation_token:
            parent_pol = task_context.parent_policy or self.policy
            is_allowed, del_reason = self.delegation_engine.evaluate_delegated_call(
                tool_call=tc,
                delegation_token=task_context.delegation_token,
                parent_policy=parent_pol,
                child_policy=self.policy,
                registry=self.registry,
            )
            if not is_allowed:
                raise PermissionDeniedError(
                    f"Delegated action denied: {del_reason}",
                    tool_name=tool_name,
                    reason="DELEGATION_VIOLATION",
                )
            if task_context.parent_task_context:
                with task_context.parent_task_context._lock:
                    if task_context.parent_task_context.executions_count >= task_context.parent_task_context.max_executions:
                        raise ExecutionBudgetExceededError(
                            f"Parent task execution budget exceeded ({task_context.parent_task_context.executions_count}/{task_context.parent_task_context.max_executions})",
                            tool_name=tool_name,
                            reason="EXECUTION_BUDGET_EXCEEDED",
                        )
                    task_context.parent_task_context.executions_count += 1

        # 4. Dispatch through ActionGateway
        session = task_context._session if task_context else None
        res = self.gateway.execute(tc, policy=self.policy, session=session)
        if session:
            session.total_executions += 1
        return res

    async def execute_async(
        self,
        tool: Union[Callable[..., Any], str],
        args: tuple = (),
        kwargs: Optional[Dict[str, Any]] = None,
        task_context: Optional[TaskContext] = None,
        operation_type: str = "execute",
    ) -> Any:
        """
        Asynchronous execution entry point evaluating all CORE and SENTINEL security boundaries.
        Awaits asynchronous tool handlers directly while preserving full gateway security evaluation.
        """
        kw = dict(kwargs or {})
        handler = None
        if callable(tool):
            tool_name = getattr(tool, "__name__", "anonymous_tool")
            handler = tool
            if not self.registry.has(tool_name):
                self.registry.register(
                    name=tool_name,
                    handler=tool,
                    permission=tool_name,
                )
        else:
            tool_name = str(tool)
            if self.registry.has(tool_name):
                _, handler = self.registry.get(tool_name)

        if args and handler and callable(handler):
            try:
                sig = inspect.signature(handler)
                bound = sig.bind(*args, **kw)
                bound.apply_defaults()
                kw = dict(bound.arguments)
            except (TypeError, ValueError):
                pass

        # Check execution budget if task context is active
        if task_context:
            with task_context._lock:
                if task_context.executions_count >= task_context.max_executions:
                    raise ExecutionBudgetExceededError(
                        f"Task execution budget exceeded ({task_context.executions_count}/{task_context.max_executions})",
                        tool_name=tool_name,
                        reason="EXECUTION_BUDGET_EXCEEDED",
                    )
                task_context.executions_count += 1

        # 2. SENTINEL Objective Guardian check
        if self.sentinel and task_context:
            assessment = self.objective_guardian.assess(
                objective=task_context.objective,
                tool_name=tool_name,
                arguments=kw,
                allowed_tools=task_context.allowed_tools,
                session_id=task_context.session_id,
            )
            if assessment.severity == DetectionSeverity.CRITICAL:
                if self.mode in (SecurityMode.ENFORCE, SecurityMode.STRICT):
                    if task_context._session:
                        task_context._session = self.session_manager.suspend_session(
                            task_context._session,
                            reason=f"CRITICAL_OBJECTIVE_DEVIATION: {assessment.reason_codes}",
                        )
                    raise PermissionDeniedError(
                        f"Action blocked by Semantic Objective Guardian: {assessment.reason_codes}",
                        tool_name=tool_name,
                        reason="OBJECTIVE_DEVIATION_CRITICAL",
                    )

        # 3. Form ToolCall
        session_id = task_context.session_id if task_context else ""
        resource_id = str(kw.get("path") or kw.get("url") or kw.get("resource_id") or "")
        recipient = str(kw.get("recipient") or kw.get("email") or "")
        parent_agent_id = task_context.delegation_token.parent_agent_id if (task_context and task_context.delegation_token) else ""
        delegation_id = task_context.delegation_token.delegation_id if (task_context and task_context.delegation_token) else ""
        delegation_depth = task_context.delegation_token.depth if (task_context and task_context.delegation_token) else 0

        tc = ToolCall(
            tool_name=tool_name,
            arguments=kw,
            agent_id=self.agent_id,
            session_id=session_id,
            operation_type=operation_type,
            security_mode=self.mode,
            resource_id=resource_id,
            recipient=recipient,
            parent_agent_id=parent_agent_id,
            delegation_id=delegation_id,
            delegation_depth=delegation_depth,
        )

        # 3.1 Multi-Agent Delegated Authorization Check
        if task_context and task_context.delegation_token:
            parent_pol = task_context.parent_policy or self.policy
            is_allowed, del_reason = self.delegation_engine.evaluate_delegated_call(
                tool_call=tc,
                delegation_token=task_context.delegation_token,
                parent_policy=parent_pol,
                child_policy=self.policy,
                registry=self.registry,
            )
            if not is_allowed:
                raise PermissionDeniedError(
                    f"Delegated action denied: {del_reason}",
                    tool_name=tool_name,
                    reason="DELEGATION_VIOLATION",
                )
            if task_context.parent_task_context:
                with task_context.parent_task_context._lock:
                    if task_context.parent_task_context.executions_count >= task_context.parent_task_context.max_executions:
                        raise ExecutionBudgetExceededError(
                            f"Parent task execution budget exceeded ({task_context.parent_task_context.executions_count}/{task_context.parent_task_context.max_executions})",
                            tool_name=tool_name,
                            reason="EXECUTION_BUDGET_EXCEEDED",
                        )
                    task_context.parent_task_context.executions_count += 1

        session = task_context._session if task_context else None

        # Check if handler is an async coroutine
        if handler and inspect.iscoroutinefunction(handler):
            # Evaluate session containment
            if session is not None:
                if session.is_suspended():
                    raise PermissionDeniedError(
                        f"Session is suspended: execution blocked at boundary ({session.suspension_reason or 'Policy suspension'})",
                        tool_name=tc.tool_name,
                        reason="SESSION_SUSPENDED",
                    )
                if session.is_terminal():
                    raise PermissionDeniedError(
                        f"Session is in terminal state: {session.state.value}",
                        tool_name=tc.tool_name,
                        reason="SESSION_TERMINAL",
                    )
                if session.authorized_scope.enforce_strict_scope and session.authorized_scope.allowed_tools:
                    if tc.tool_name not in session.authorized_scope.allowed_tools:
                        raise PermissionDeniedError(
                            f"Tool '{tc.tool_name}' not permitted in session authorized scope",
                            tool_name=tc.tool_name,
                            reason="SCOPE_VIOLATION",
                        )

            # Evaluate policy
            decision = self.policy_engine.evaluate(tc, self.policy, self.registry)
            if decision.verdict == DecisionVerdict.DENY:
                raise PermissionDeniedError(
                    f"Action denied: {decision.reason}",
                    tool_name=tc.tool_name,
                    policy_id=decision.policy_id,
                    action_hash=decision.action_hash,
                    reason=decision.reason,
                )
            if decision.verdict == DecisionVerdict.REQUIRE_APPROVAL:
                approval_req = self.approval_service.create_request(
                    tc,
                    policy_version=getattr(self.policy, "version", 1) if self.policy else 1,
                    task_id=getattr(tc, "intent_id", ""),
                )
                raise ApprovalRequiredError(
                    "Action requires human approval",
                    approval_id=approval_req.approval_id,
                    action_hash=decision.action_hash,
                    tool_name=tc.tool_name,
                )

            # Handler execution
            try:
                res = await handler(**tc.arguments)
            except Exception:
                raise

            if session:
                session.total_executions += 1
            return res
        else:
            # Sync handler delegated through ActionGateway
            res = self.gateway.execute(tc, policy=self.policy, session=session)
            if session:
                session.total_executions += 1
            return res


# Backward compatibility alias
IntentLock = Sictack
