"""
INTENTLOCK SENTINEL Package (Phase 2).
Behavioral Security & Autonomous Runtime Protection.
"""

from sictack.sentinel.models import (
    BehavioralDetectionResult,
    BehavioralEvent,
    BehavioralEventType,
    ContainmentAction,
    ContainmentActionType,
    DetectionSeverity,
    RiskAssessment,
    RiskFactorContribution,
    RiskTier,
    TaskScope,
    TaskSession,
    TaskSessionState,
    VALID_STATE_TRANSITIONS,
)
from sictack.sentinel.session import (
    InvalidStateTransitionError,
    TaskSessionManager,
    TaskSessionSuspendedError,
    TaskSessionTerminalError,
)
from sictack.sentinel.collector import (
    BehavioralEventCollector,
    redact_sensitive_data,
)
from sictack.sentinel.detectors import (
    AbnormalExecutionFrequencyDetector,
    ApprovalAbuseDetector,
    BaseBehavioralDetector,
    BehavioralIntelligenceEngine,
    ExcessiveToolExecutionAttemptsDetector,
    ExecutionBudgetViolationsDetector,
    FragmentedExfiltrationDetector,
    RepeatedRestrictedResourceAccessDetector,
    RepeatedUnauthorizedToolCallsDetector,
    SuspiciousSequenceDetector,
    TaskScopeViolationsDetector,
)
from sictack.sentinel.risk_engine import (
    ExplainableRiskEngine,
    SEVERITY_WEIGHTS,
)
from sictack.sentinel.containment import (
    AutomatedContainmentEngine,
    ContainmentPolicy,
)
from sictack.sentinel.objective_guardian import (
    ObjectiveAlignmentStatus,
    SemanticAssessment,
    SemanticObjectiveGuardian,
)

__all__ = [
    "TaskSessionState",
    "VALID_STATE_TRANSITIONS",
    "BehavioralEventType",
    "TaskScope",
    "BehavioralEvent",
    "TaskSession",
    "InvalidStateTransitionError",
    "TaskSessionSuspendedError",
    "TaskSessionTerminalError",
    "TaskSessionManager",
    "BehavioralEventCollector",
    "redact_sensitive_data",
    # Phase 2 Models
    "DetectionSeverity",
    "RiskTier",
    "ContainmentActionType",
    "BehavioralDetectionResult",
    "RiskFactorContribution",
    "RiskAssessment",
    "ContainmentAction",
    # Detectors & Engines
    "BaseBehavioralDetector",
    "RepeatedUnauthorizedToolCallsDetector",
    "RepeatedRestrictedResourceAccessDetector",
    "ExcessiveToolExecutionAttemptsDetector",
    "TaskScopeViolationsDetector",
    "AbnormalExecutionFrequencyDetector",
    "ExecutionBudgetViolationsDetector",
    "SuspiciousSequenceDetector",
    "ApprovalAbuseDetector",
    "FragmentedExfiltrationDetector",
    "BehavioralIntelligenceEngine",
    # Risk Engine
    "ExplainableRiskEngine",
    "SEVERITY_WEIGHTS",
    # Containment
    "ContainmentPolicy",
    "AutomatedContainmentEngine",
    # Objective Guardian (Phase 3)
    "ObjectiveAlignmentStatus",
    "SemanticAssessment",
    "SemanticObjectiveGuardian",
    # Phase 4C Multi-Agent Intelligence & Incident Management
    "IncidentStatus",
    "IncidentSeverity",
    "MultiAgentDetectionResult",
    "SecurityIncident",
    "ObjectiveAlignmentAssessment",
    "AgentRiskScore",
    "MultiAgentCorrelationEngine",
    "HierarchicalObjectiveGuardian",
    "SecurityIncidentManager",
    "get_default_multi_agent_detectors",
]

from sictack.sentinel.multi_agent_models import (
    AgentRiskScore,
    IncidentSeverity,
    IncidentStatus,
    MultiAgentDetectionResult,
    ObjectiveAlignmentAssessment,
    SecurityIncident,
)
from sictack.sentinel.multi_agent_detectors import (
    BaseMultiAgentDetector,
    get_default_multi_agent_detectors,
)
from sictack.sentinel.correlation import MultiAgentCorrelationEngine
from sictack.sentinel.hierarchical_guardian import HierarchicalObjectiveGuardian
from sictack.sentinel.incidents import SecurityIncidentManager

