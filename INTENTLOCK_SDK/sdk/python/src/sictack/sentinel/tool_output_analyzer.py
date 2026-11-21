"""
SICTACK Tool-Output & Retrieved Content Security Analyzer (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Analyzes content returned by external tools, retrieved documents, web scrapers,
database fields, and MCP servers to detect embedded prompt injection, credential
harvesting, role impersonation, and provenance laundering attempts.
"""

from __future__ import annotations

import enum
import json
import logging
import re
import unicodedata
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from sictack.sentinel.models import DetectionSeverity
from sictack.provenance.models import SourceType

logger = logging.getLogger("sictack.sentinel.tool_output_analyzer")


class ToolOutputThreatType(str, enum.Enum):
    """Observable security threat categories detected in tool outputs."""
    PROMPT_INJECTION_IN_OUTPUT = "PROMPT_INJECTION_IN_OUTPUT"
    CREDENTIAL_DISCLOSURE_REQUEST = "CREDENTIAL_DISCLOSURE_REQUEST"
    UNAUTHORIZED_TOOL_INVOCATION = "UNAUTHORIZED_TOOL_INVOCATION"
    SUSPICIOUS_ROLE_IMPERSONATION = "SUSPICIOUS_ROLE_IMPERSONATION"
    DELEGATION_OVERRIDE = "DELEGATION_OVERRIDE"
    PROVENANCE_LAUNDERING = "PROVENANCE_LAUNDERING"
    # Threat category aliases
    INDIRECT_PROMPT_INJECTION = "PROMPT_INJECTION_IN_OUTPUT"
    CREDENTIAL_DUMPING = "CREDENTIAL_DISCLOSURE_REQUEST"
    SYSTEM_PROMPT_EXTRACTION = "CREDENTIAL_DISCLOSURE_REQUEST"



class ToolOutputThreatDetection(BaseModel):
    """Structured detection emitted when an anomaly is observed in tool output."""
    detection_id: str
    threat_type: ToolOutputThreatType
    severity: DetectionSeverity
    confidence: float = Field(default=0.95, ge=0.0, le=1.0)
    pattern_matched: str
    snippet: str
    explanation: str
    source_type: SourceType
    source_identifier: str
    recommended_containment: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ToolOutputDetectionList(list):
    """List of threat detections with convenience attributes."""
    @property
    def threat_detected(self) -> bool:
        return len(self) > 0

    @property
    def threat_types(self) -> List[ToolOutputThreatType]:
        return [d.threat_type for d in self]

    @property
    def threat_type(self) -> Optional[ToolOutputThreatType]:
        return self[0].threat_type if len(self) > 0 else None


    @property
    def confidence(self) -> float:
        return max((d.confidence for d in self), default=0.0)

    @property
    def reason(self) -> str:
        return "; ".join(d.explanation for d in self)


class ToolOutputSecurityAnalyzer:
    """
    Deterministic behavioral analyzer for tool and retrieved content.
    Prevents indirect prompt injection and provenance laundering at the execution boundary.
    """

    # Pre-compiled regex heuristics
    INJECTION_PATTERNS = [
        re.compile(r"ignore\s+(all\s+)?(previous|prior|above|existing)\s+(instructions|rules|prompts|policies|policy\s+constraints)", re.IGNORECASE),
        re.compile(r"new\s+(system\s+prompt|operating\s+mode|identity)\s*[:=]", re.IGNORECASE),
        re.compile(r"(system\s+update|system\s+override|admin\s+mode|root\s+access)", re.IGNORECASE),
        re.compile(r"(disregard|bypass)\s+security\s+(policy|rules|controls)", re.IGNORECASE),
        re.compile(r"you\s+are\s+now\s+(unrestricted|in\s+developer\s+mode|dan)", re.IGNORECASE),
    ]

    CREDENTIAL_EXTRACTION_PATTERNS = [
        re.compile(r"(reveal|dump|leak|exfiltrate|send|echo)\s+(all\s+)?([a-zA-Z_-]+\s+)?(api[\s_-]?keys?|secrets?|passwords?|tokens?|credentials?)", re.IGNORECASE),
        re.compile(r"cat\s+/etc/passwd", re.IGNORECASE),
        re.compile(r"print\s+os\.environ", re.IGNORECASE),
    ]

    UNAUTHORIZED_TOOL_PATTERNS = [
        re.compile(r"(execute|call|invoke)\s+tool\s*[:=\s]+['\"]?([a-zA-Z0-9_\-:]+)", re.IGNORECASE),
        re.compile(r"<tool_call>.*?</tool_call>", re.IGNORECASE | re.DOTALL),
        re.compile(r"\[TOOL_CALL\]", re.IGNORECASE),
    ]

    ROLE_IMPERSONATION_PATTERNS = [
        re.compile(r"<\|im_start\|>\s*system", re.IGNORECASE),
        re.compile(r"\[SYSTEM\]\s*:", re.IGNORECASE),
        re.compile(r"###\s*Instruction\s*:", re.IGNORECASE),
        re.compile(r"\[ADMIN\]\s*:", re.IGNORECASE),
    ]

    DELEGATION_OVERRIDE_PATTERNS = [
        re.compile(r"override\s+(budget|spending\s+limit|delegation\s+depth)", re.IGNORECASE),
        re.compile(r"unlimited\s+(budget|tokens|executions)", re.IGNORECASE),
    ]

    PROVENANCE_LAUNDERING_PATTERNS = [
        re.compile(r"\"trusted_control\"\s*:\s*(true|1)", re.IGNORECASE),
        re.compile(r"verified_system_instruction\s*=\s*true", re.IGNORECASE),
        re.compile(r"security_clearance\s*:\s*\"trusted\"", re.IGNORECASE),
        re.compile(r"(trusted_control|verified_internal_data)", re.IGNORECASE),
    ]

    @classmethod
    def analyze_output(
        cls,
        output_content: Any = None,
        source_type: SourceType = SourceType.RETRIEVED_DOCUMENT,
        source_identifier: str = "",
        session_id: str = "",
        agent_id: str = "",
        output: Any = None,
        **kwargs: Any,
    ) -> ToolOutputDetectionList:
        """
        Inspects tool or retrieved content for adversarial patterns.
        Returns a list of structured detections.
        """
        import secrets

        target_payload = output if output is not None else output_content
        # Convert content to normalized search string
        if isinstance(target_payload, (dict, list)):
            try:
                raw_str = json.dumps(target_payload)
            except Exception:
                raw_str = str(target_payload)
        else:
            raw_str = str(target_payload)

        norm_text = unicodedata.normalize("NFKC", raw_str)
        detections: List[ToolOutputThreatDetection] = []

        # 1. Prompt Injection in Output
        for pat in cls.INJECTION_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.PROMPT_INJECTION_IN_OUTPUT,
                        severity=DetectionSeverity.CRITICAL,
                        confidence=0.98,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"Indirect prompt injection pattern detected in tool output from '{source_identifier}'.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="QUARANTINE_SESSION_AND_DISCARD_OUTPUT",
                    )
                )
                break

        # 2. Credential Extraction Probing
        for pat in cls.CREDENTIAL_EXTRACTION_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.CREDENTIAL_DISCLOSURE_REQUEST,
                        severity=DetectionSeverity.CRITICAL,
                        confidence=0.97,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"Credential extraction attempt detected in content from '{source_identifier}'.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="SANITIZE_OUTPUT_AND_STEP_UP_MONITORING",
                    )
                )
                break

        # 3. Unauthorized Tool Invocation Directives
        for pat in cls.UNAUTHORIZED_TOOL_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.UNAUTHORIZED_TOOL_INVOCATION,
                        severity=DetectionSeverity.HIGH,
                        confidence=0.95,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"Tool output contains unauthorized embedded invocation instructions.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="DROP_EMBEDDED_TOOL_INVOCATIONS",
                    )
                )
                break

        # 4. Suspicious Role Impersonation
        for pat in cls.ROLE_IMPERSONATION_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.SUSPICIOUS_ROLE_IMPERSONATION,
                        severity=DetectionSeverity.HIGH,
                        confidence=0.94,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"Content masquerading as system role prompt or privileged delimiter.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="STRIP_ROLE_DELIMITERS",
                    )
                )
                break

        # 5. Delegation Override Probing
        for pat in cls.DELEGATION_OVERRIDE_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.DELEGATION_OVERRIDE,
                        severity=DetectionSeverity.HIGH,
                        confidence=0.92,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"Tool output attempts to tamper with delegation limits or budgets.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="ENFORCE_PARENT_BUDGET_CEILING",
                    )
                )
                break

        # 6. Provenance Laundering
        for pat in cls.PROVENANCE_LAUNDERING_PATTERNS:
            match = pat.search(norm_text)
            if match:
                start = max(0, match.start() - 30)
                end = min(len(norm_text), match.end() + 30)
                detections.append(
                    ToolOutputThreatDetection(
                        detection_id=f"tot_{secrets.token_hex(8)}",
                        threat_type=ToolOutputThreatType.PROVENANCE_LAUNDERING,
                        severity=DetectionSeverity.CRITICAL,
                        confidence=0.99,
                        pattern_matched=pat.pattern,
                        snippet=norm_text[start:end],
                        explanation=f"External data claims internal security clearance or trust level elevation.",
                        source_type=source_type,
                        source_identifier=source_identifier,
                        recommended_containment="RECLASSIFY_AS_UNTRUSTED_AND_LOG",
                    )
                )
                break

        return ToolOutputDetectionList(detections)

    def analyze(
        self,
        output_content: Any,
        source_type: SourceType = SourceType.TOOL_OUTPUT,
        source_identifier: str = "",
    ) -> ToolOutputDetectionList:
        """Instance alias for analyze_output."""
        return self.analyze_output(
            output_content=output_content,
            source_type=source_type,
            source_identifier=source_identifier,
        )

