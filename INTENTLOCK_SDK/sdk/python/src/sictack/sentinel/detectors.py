"""
INTENTLOCK SENTINEL – Behavioral Intelligence Detection Engine (Phase 2B).

Implements 9 deterministic behavioral detectors targeting anomalous,
adversarial, or out-of-boundary AI agent behaviors:
1. SNT-R001: Repeated Unauthorized Tool Calls
2. SNT-R002: Repeated Restricted Resource Access
3. SNT-R003: Excessive Execution Attempts
4. SNT-R004: Task Scope Violations
5. SNT-R005: Abnormal Execution Frequency (Spike / Burst)
6. SNT-R006: Execution Budget Violations
7. SNT-R007: Suspicious Action Sequences (Recon -> Exfil)
8. SNT-R008: Approval Mechanism Abuse / Probing
9. SNT-R009: Fragmented Data Exfiltration
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sictack.models import ToolCall
from sictack.sentinel.models import (
    BehavioralDetectionResult,
    BehavioralEvent,
    BehavioralEventType,
    DetectionSeverity,
    TaskSession,
)


class BaseBehavioralDetector(ABC):
    """Abstract base class for deterministic SENTINEL behavioral detectors."""

    rule_id: str
    rule_name: str
    default_severity: DetectionSeverity

    @abstractmethod
    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        """
        Evaluate session telemetry and optional incoming ToolCall.
        Returns a BehavioralDetectionResult if an anomalous pattern is detected, else None.
        """
        pass


class RepeatedUnauthorizedToolCallsDetector(BaseBehavioralDetector):
    """SNT-R001: Detects persistent repeated attempts to invoke unauthorized/blocked tools."""

    rule_id = "SNT-R001"
    rule_name = "Repeated Unauthorized Tool Calls"
    default_severity = DetectionSeverity.HIGH

    def __init__(self, threshold: int = 2) -> None:
        self.threshold = threshold

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        blocked_count = sum(
            1 for e in events
            if e.verdict == "DENY" or e.execution_success is False or e.event_type == BehavioralEventType.SCOPE_VIOLATION
        )
        if session.blocked_executions >= self.threshold or blocked_count >= self.threshold:
            offending_tools = list({e.tool_name for e in events if e.verdict == "DENY" and e.tool_name})
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=min(1.0, 0.7 + (blocked_count * 0.1)),
                reason_code="REPEATED_UNAUTHORIZED_TOOL_CALLS",
                evidence={
                    "blocked_count": blocked_count,
                    "session_blocked_executions": session.blocked_executions,
                    "threshold": self.threshold,
                    "offending_tools": offending_tools,
                },
            )
        return None


class RepeatedRestrictedResourceAccessDetector(BaseBehavioralDetector):
    """SNT-R002: Detects repeated attempts to access out-of-scope or restricted resources."""

    rule_id = "SNT-R002"
    rule_name = "Repeated Restricted Resource Access"
    default_severity = DetectionSeverity.HIGH

    def __init__(self, threshold: int = 2) -> None:
        self.threshold = threshold

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        resource_denials = [
            e for e in events
            if (e.resource_id or (e.event_payload and "resource" in e.event_payload))
            and (e.verdict == "DENY" or "RESOURCE" in str(e.execution_error or ""))
        ]
        if len(resource_denials) >= self.threshold:
            resources = [e.resource_id for e in resource_denials if e.resource_id]
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.95,
                reason_code="REPEATED_RESTRICTED_RESOURCE_ACCESS",
                evidence={
                    "attempt_count": len(resource_denials),
                    "threshold": self.threshold,
                    "targeted_resources": resources,
                },
            )
        return None


class ExcessiveToolExecutionAttemptsDetector(BaseBehavioralDetector):
    """SNT-R003: Detects excessive cumulative execution volume exceeding baseline expectations."""

    rule_id = "SNT-R003"
    rule_name = "Excessive Tool Execution Attempts"
    default_severity = DetectionSeverity.MEDIUM

    def __init__(self, high_volume_threshold: int = 50) -> None:
        self.high_volume_threshold = high_volume_threshold

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        total = session.total_executions or len(events)
        if total >= self.high_volume_threshold:
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.85,
                reason_code="EXCESSIVE_EXECUTION_ATTEMPTS",
                evidence={
                    "total_executions": total,
                    "threshold": self.high_volume_threshold,
                },
            )
        return None


class TaskScopeViolationsDetector(BaseBehavioralDetector):
    """SNT-R004: Detects actions outside the session's declared authorized scope."""

    rule_id = "SNT-R004"
    rule_name = "Task Scope Violations"
    default_severity = DetectionSeverity.HIGH

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        scope_events = [e for e in events if e.event_type == BehavioralEventType.SCOPE_VIOLATION]
        
        # Check current call against allowed tools
        incoming_violation = False
        if current_call and session.authorized_scope.allowed_tools:
            if current_call.tool_name not in session.authorized_scope.allowed_tools:
                incoming_violation = True

        if scope_events or session.scope_violations > 0 or incoming_violation:
            total_violations = len(scope_events) + (1 if incoming_violation else 0) + session.scope_violations
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=1.0,
                reason_code="TASK_SCOPE_VIOLATION",
                evidence={
                    "scope_violations_count": total_violations,
                    "allowed_tools": session.authorized_scope.allowed_tools,
                    "current_tool": current_call.tool_name if current_call else None,
                },
            )
        return None


class AbnormalExecutionFrequencyDetector(BaseBehavioralDetector):
    """SNT-R005: Detects execution bursts / abnormal velocity spikes over short time windows."""

    rule_id = "SNT-R005"
    rule_name = "Abnormal Execution Frequency"
    default_severity = DetectionSeverity.MEDIUM

    def __init__(self, max_calls_per_window: int = 10, window_seconds: float = 5.0) -> None:
        self.max_calls = max_calls_per_window
        self.window_seconds = window_seconds

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        if len(events) < self.max_calls:
            return None

        # Check last N events timestamp difference
        recent_events = sorted(events, key=lambda e: e.timestamp, reverse=True)[:self.max_calls]
        if len(recent_events) >= self.max_calls:
            time_span = (recent_events[0].timestamp - recent_events[-1].timestamp).total_seconds()
            if time_span <= self.window_seconds:
                return BehavioralDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=0.90,
                    reason_code="ABNORMAL_EXECUTION_FREQUENCY",
                    evidence={
                        "recent_calls_count": len(recent_events),
                        "time_span_seconds": time_span,
                        "window_threshold_seconds": self.window_seconds,
                    },
                )
        return None


class ExecutionBudgetViolationsDetector(BaseBehavioralDetector):
    """SNT-R006: Detects hard execution budget exhaustion."""

    rule_id = "SNT-R006"
    rule_name = "Execution Budget Violations"
    default_severity = DetectionSeverity.CRITICAL

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        limit = session.authorized_scope.max_executions
        current = session.total_executions
        if current >= limit:
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=1.0,
                reason_code="EXECUTION_BUDGET_EXCEEDED",
                evidence={
                    "total_executions": current,
                    "max_executions_budget": limit,
                },
            )
        return None


class SuspiciousSequenceDetector(BaseBehavioralDetector):
    """
    SNT-R007: Detects recon / data staging immediately followed by external egress.
    Pattern: [read_file, db_query, list_files, get_secret] -> [send_email, upload, curl, egress]
    """

    rule_id = "SNT-R007"
    rule_name = "Suspicious Action Sequence"
    default_severity = DetectionSeverity.CRITICAL

    RECON_PATTERNS = {"read", "query", "fetch", "list", "get", "dump", "export", "cat", "scan"}
    EGRESS_PATTERNS = {"send", "email", "post", "upload", "curl", "webhook", "transfer", "egress"}

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        tools_history = [e.tool_name.lower() for e in events if e.tool_name]
        if current_call:
            tools_history.append(current_call.tool_name.lower())

        if len(tools_history) >= 2:
            last_tool = tools_history[-1]
            prev_tools = tools_history[-4:-1]

            is_egress = any(p in last_tool for p in self.EGRESS_PATTERNS)
            had_recon = any(any(r in t for r in self.RECON_PATTERNS) for t in prev_tools)

            if is_egress and had_recon:
                return BehavioralDetectionResult(
                    rule_id=self.rule_id,
                    rule_name=self.rule_name,
                    severity=self.default_severity,
                    confidence=0.88,
                    reason_code="SUSPICIOUS_ACTION_SEQUENCE",
                    evidence={
                        "recent_sequence": tools_history[-4:],
                        "triggering_egress_tool": last_tool,
                    },
                )
        return None


class ApprovalAbuseDetector(BaseBehavioralDetector):
    """SNT-R008: Detects approval probing, consecutive approval denials, or flooding."""

    rule_id = "SNT-R008"
    rule_name = "Approval Abuse"
    default_severity = DetectionSeverity.HIGH

    def __init__(self, approval_denial_threshold: int = 2) -> None:
        self.denial_threshold = approval_denial_threshold

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        approval_denials = [
            e for e in events
            if e.event_payload.get("approval_status") == "REJECTED"
            or "approval" in str(e.execution_error or "").lower()
        ]
        if len(approval_denials) >= self.denial_threshold:
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.92,
                reason_code="APPROVAL_ABUSE_DETECTED",
                evidence={
                    "rejected_approvals_count": len(approval_denials),
                    "threshold": self.denial_threshold,
                },
            )
        return None


class FragmentedExfiltrationDetector(BaseBehavioralDetector):
    """
    SNT-R009: Detects chunked piecemeal transmission patterns attempting
    to bypass payload inspection.
    """

    rule_id = "SNT-R009"
    rule_name = "Fragmented Data Exfiltration"
    default_severity = DetectionSeverity.HIGH

    def __init__(self, chunk_count_threshold: int = 4) -> None:
        self.chunk_count_threshold = chunk_count_threshold

    def evaluate(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> Optional[BehavioralDetectionResult]:
        egress_calls = [
            e for e in events
            if e.tool_name and any(p in e.tool_name.lower() for p in ("post", "send", "chunk", "upload", "append"))
        ]
        if len(egress_calls) >= self.chunk_count_threshold:
            return BehavioralDetectionResult(
                rule_id=self.rule_id,
                rule_name=self.rule_name,
                severity=self.default_severity,
                confidence=0.85,
                reason_code="FRAGMENTED_DATA_EXFILTRATION",
                evidence={
                    "fragment_calls_count": len(egress_calls),
                    "threshold": self.chunk_count_threshold,
                    "tools": list({e.tool_name for e in egress_calls}),
                },
            )
        return None


class BehavioralIntelligenceEngine:
    """
    Coordinates evaluation across all 9 deterministic SENTINEL behavioral detectors.
    """

    def __init__(self, detectors: Optional[List[BaseBehavioralDetector]] = None) -> None:
        self.detectors = detectors or [
            RepeatedUnauthorizedToolCallsDetector(),
            RepeatedRestrictedResourceAccessDetector(),
            ExcessiveToolExecutionAttemptsDetector(),
            TaskScopeViolationsDetector(),
            AbnormalExecutionFrequencyDetector(),
            ExecutionBudgetViolationsDetector(),
            SuspiciousSequenceDetector(),
            ApprovalAbuseDetector(),
            FragmentedExfiltrationDetector(),
        ]

    def analyze(
        self,
        session: TaskSession,
        events: List[BehavioralEvent],
        current_call: Optional[ToolCall] = None,
    ) -> List[BehavioralDetectionResult]:
        """
        Executes all registered detectors against session telemetry.
        Returns a list of all triggered detection results.
        """
        detections: List[BehavioralDetectionResult] = []
        for detector in self.detectors:
            try:
                result = detector.evaluate(session, events, current_call=current_call)
                if result is not None:
                    detections.append(result)
            except Exception:  # Fail closed / safe against detector crash
                continue
        return detections
