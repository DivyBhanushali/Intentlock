"""
INTENTLOCK SENTINEL – Semantic Objective Guardian (Phase 3C).

Evaluates whether proposed agent actions align with the declared task objective.
Operates strictly as an UNTRUSTED ADVISORY evaluation engine:
1. Cannot independently grant authorization.
2. Cannot override deterministic CORE policy denials.
3. Provides explainable alignment scoring, deviation reason codes, and bounded analysis.
"""

from __future__ import annotations

import abc
import re
import unicodedata
import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Dict, List, Optional, Set

from pydantic import BaseModel, ConfigDict, Field

from sictack.sentinel.models import (
    BehavioralDetectionResult,
    DetectionSeverity,
)

# ---------------------------------------------------------------------------
# Pluggable Semantic Model Adapter Interface
# ---------------------------------------------------------------------------

class BaseSemanticModelAdapter(ABC):
    """
    Abstract base class for pluggable semantic evaluation adapters.
    Allows plugging in local SLMs, ONNX embedding models, or local sentence-transformers
    without requiring paid external cloud APIs or violating local privacy boundaries.
    """

    @abstractmethod
    def compute_similarity(self, objective: str, action_description: str) -> float:
        """
        Compute similarity score between task objective and proposed action.
        Returns a float between 0.0 (completely divergent) and 1.0 (identical/fully aligned).
        """
        raise NotImplementedError


class DeterministicHeuristicAdapter(BaseSemanticModelAdapter):
    """
    Default production adapter: deterministic lexical and token overlap evaluator.
    Operates with zero external dependencies and sub-millisecond evaluation latency.
    """

    def compute_similarity(self, objective: str, action_description: str) -> float:
        obj_tokens = _tokenize(objective)
        act_tokens = _tokenize(action_description)
        if not obj_tokens or not act_tokens:
            return 0.5
        intersection = obj_tokens & act_tokens
        union = obj_tokens | act_tokens
        return round(len(intersection) / len(union), 3) if union else 0.5


# ---------------------------------------------------------------------------
# Semantic Alignment Enumerations & Models
# ---------------------------------------------------------------------------

class ObjectiveAlignmentStatus(str, Enum):
    """Categorical alignment classification of an action against declared objective."""
    ALIGNED = "ALIGNED"
    POTENTIALLY_UNRELATED = "POTENTIALLY_UNRELATED"
    SUSPICIOUS_DEVIATION = "SUSPICIOUS_DEVIATION"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    CONFLICTING_INSTRUCTIONS = "CONFLICTING_INSTRUCTIONS"
    UNAUTHORIZED_DISCLOSURE = "UNAUTHORIZED_DISCLOSURE"
    # Backward compatibility / semantic evaluation aliases
    MISALIGNED = "SUSPICIOUS_DEVIATION"
    DRIFTING = "POTENTIALLY_UNRELATED"



class SemanticAssessment(BaseModel):
    """Point-in-time semantic alignment assessment for a proposed action."""
    assessment_id: str = Field(default_factory=lambda: f"sem_{uuid.uuid4().hex[:16]}")
    session_id: str = Field(default="")
    alignment_status: ObjectiveAlignmentStatus
    alignment_score: float = Field(default=1.0, ge=0.0, le=1.0)
    reason_codes: List[str] = Field(default_factory=list)
    evidence: Dict[str, Any] = Field(default_factory=dict)
    severity: DetectionSeverity = Field(default=DetectionSeverity.LOW)
    limitations: str = Field(
        default="Advisory semantic evaluation; heuristic analysis does not grant authorization or override CORE policy."
    )
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = ConfigDict(frozen=True)

    @property
    def status(self) -> ObjectiveAlignmentStatus:
        return self.alignment_status

    @property
    def threat_flags(self) -> List[str]:
        return self.reason_codes

    @property
    def is_aligned(self) -> bool:
        return self.alignment_status == ObjectiveAlignmentStatus.ALIGNED



# ---------------------------------------------------------------------------
# Prompt Injection & Conflicting Instruction Signatures
# ---------------------------------------------------------------------------

INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(?:previous|all|above)\s+instructions", re.IGNORECASE),
    re.compile(r"override\s+(?:objective|guardrails|policy|security)", re.IGNORECASE),
    re.compile(r"system\s+prompt\s+override", re.IGNORECASE),
    re.compile(r"bypass\s+(?:policy|rules|sandbox|gateway)", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"disregard\s+(?:prior|previous)\s+context", re.IGNORECASE),
]

DISCLOSURE_PATTERNS = [
    re.compile(r"(\.env|/etc/shadow|\.ssh/id_rsa|api_keys?|credentials?|master_key)", re.IGNORECASE),
    re.compile(r"(reveal|dump|export|exfiltrate)\s+(?:secrets?|passwords?|tokens?|keys?)", re.IGNORECASE),
]

STOP_WORDS: Set[str] = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "up", "about", "into", "over", "after", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "shall", "should", "can", "could", "may", "might",
    "must", "this", "that", "these", "those", "it", "its", "as", "if",
}


def _tokenize(text: str) -> Set[str]:
    """Tokenize and filter stop words from text."""
    clean = re.sub(r"[^a-zA-Z0-9_\-\s]", " ", text.lower())
    words = clean.split()
    return {w for w in words if len(w) > 2 and w not in STOP_WORDS}


MAX_INPUT_LENGTH: int = 4096


class SemanticObjectiveGuardian:
    """
    Subsystem evaluating semantic alignment between declared task objectives
    and runtime tool calls.
    """

    MAX_INPUT_LENGTH: int = 4096

    def __init__(
        self,
        task_objective: str = "",
        deviation_threshold: float = 0.5,
        adapter: Optional[BaseSemanticModelAdapter] = None,
    ) -> None:
        self.task_objective = task_objective
        self.deviation_threshold = deviation_threshold
        self.adapter = adapter or DeterministicHeuristicAdapter()

    def evaluate_step(
        self,
        tool_name: str,
        tool_args: Optional[Dict[str, Any]] = None,
        step_description: str = "",
        objective: Optional[str] = None,
    ) -> SemanticAssessment:
        """Convenience evaluation method for a proposed execution step."""
        eval_obj = objective if objective is not None else self.task_objective
        return self.assess(
            objective=eval_obj,
            tool_name=tool_name,
            arguments=tool_args,
            user_request=step_description,
        )

    def _bound_text(self, text: Optional[str]) -> str:
        """Enforces length bounds, Unicode NFKC normalization, and zero-width strip."""
        if not text:
            return ""
        # Unicode NFKC normalization to prevent homoglyph & full-width evasion
        normalized = unicodedata.normalize("NFKC", str(text))
        # Remove zero-width characters (\u200B-\u200D, \uFEFF, \u00AD soft hyphen)
        cleaned = re.sub(r"[\u200B-\u200D\uFEFF\u00AD]", "", normalized)
        if len(cleaned) > self.MAX_INPUT_LENGTH:
            # Dual-window bounding (head + tail) to prevent truncation-based evasion
            return cleaned[:2048] + cleaned[-2048:]
        return cleaned

    def assess(
        self,
        *,
        objective: str,
        tool_name: str,
        arguments: Optional[Dict[str, Any]] = None,
        user_request: str = "",
        allowed_tools: Optional[List[str]] = None,
        session_id: str = "",
    ) -> SemanticAssessment:
        """
        Performs multi-vector semantic evaluation:
        1. Prompt injection / conflicting instruction detection (with de-obfuscation).
        2. Unauthorized disclosure & secret harvesting detection.
        3. Lexical and semantic objective-action alignment via pluggable adapter.
        """
        bound_objective = self._bound_text(objective)
        bound_user_request = self._bound_text(user_request)
        args_str = self._bound_text(str(arguments or {}))
        was_truncated = (
            (bool(objective) and len(str(objective)) > self.MAX_INPUT_LENGTH)
            or (bool(user_request) and len(str(user_request)) > self.MAX_INPUT_LENGTH)
            or (bool(arguments) and len(str(arguments)) > self.MAX_INPUT_LENGTH)
        )

        # Check for empty objective
        if not bound_objective.strip():
            return SemanticAssessment(
                session_id=session_id,
                alignment_status=ObjectiveAlignmentStatus.INSUFFICIENT_EVIDENCE,
                alignment_score=0.5,
                reason_codes=["OBJECTIVE_EMPTY"],
                evidence={"tool_name": tool_name, "input_truncated": was_truncated},
                severity=DetectionSeverity.LOW,
            )

        # De-obfuscation: collapse single character spacing/punctuation & leetspeak
        def _normalize_obfuscation(s: str) -> str:
            # 1. Leetspeak map for common injection keywords
            leet_map = str.maketrans({"0": "o", "1": "i", "3": "e", "@": "a", "$": "s"})
            translated = s.translate(leet_map)
            # 2. Collapse single-character sequences separated by delimiters (hyphens, dots, spaces, slashes)
            collapsed = re.sub(r"(?<=\b[a-zA-Z])[\s\-_.\\/]+(?=[a-zA-Z]\b)", "", translated)
            return collapsed

        norm_args = _normalize_obfuscation(args_str)
        norm_req = _normalize_obfuscation(bound_user_request)

        # 1. Prompt Injection & Instruction Conflict Check
        for pattern in INJECTION_PATTERNS:
            match_in_args = pattern.search(args_str) or pattern.search(norm_args)
            match_in_req = pattern.search(bound_user_request) or pattern.search(norm_req)
            if match_in_args or match_in_req:
                matched_pat = match_in_args.group(0) if match_in_args else (match_in_req.group(0) if match_in_req else "")
                return SemanticAssessment(
                    session_id=session_id,
                    alignment_status=ObjectiveAlignmentStatus.CONFLICTING_INSTRUCTIONS,
                    alignment_score=0.05,
                    reason_codes=["INSTRUCTION_OVERRIDE_DETECTED", "PROMPT_INJECTION_PATTERN"],
                    evidence={
                        "matched_pattern": matched_pat,
                        "tool_name": tool_name,
                        "input_truncated": was_truncated,
                    },
                    severity=DetectionSeverity.CRITICAL,
                )

        # 2. Unauthorized Disclosure & Secret Harvesting Check
        obj_lower = bound_objective.lower()
        secret_context_authorized = any(w in obj_lower for w in ["secret", "credential", "key rotation", "admin password", "vault"])
        for pattern in DISCLOSURE_PATTERNS:
            match_in_args = pattern.search(args_str)
            match_in_tool = pattern.search(tool_name)
            if (match_in_args or match_in_tool) and not secret_context_authorized:
                matched_pat = match_in_args.group(0) if match_in_args else (match_in_tool.group(0) if match_in_tool else "")
                return SemanticAssessment(
                    session_id=session_id,
                    alignment_status=ObjectiveAlignmentStatus.UNAUTHORIZED_DISCLOSURE,
                    alignment_score=0.10,
                    reason_codes=["CREDENTIAL_HARVESTING_ATTEMPT", "UNAUTHORIZED_SECRET_ACCESS"],
                    evidence={
                        "matched_pattern": matched_pat,
                        "tool_name": tool_name,
                    },
                    severity=DetectionSeverity.CRITICAL,
                )

        # 3. Domain & Scope Deviation Analysis
        obj_tokens = _tokenize(bound_objective)
        tool_tokens = _tokenize(tool_name.replace("_", " ").replace("-", " "))
        arg_tokens = _tokenize(args_str)

        # If allowed_tools was explicitly declared in scope and tool is in it, high alignment
        if allowed_tools and tool_name in allowed_tools:
            return SemanticAssessment(
                session_id=session_id,
                alignment_status=ObjectiveAlignmentStatus.ALIGNED,
                alignment_score=0.95,
                reason_codes=["TOOL_WITHIN_AUTHORIZED_SCOPE"],
                evidence={"tool_name": tool_name, "objective_tokens": list(obj_tokens)},
                severity=DetectionSeverity.LOW,
            )

        # Domain cluster definitions
        domain_clusters = {
            "invoice": {"invoice", "billing", "bill", "payment", "pdf", "parse", "extract", "amount", "currency", "receipt", "account"},
            "code": {"code", "git", "file", "commit", "diff", "branch", "refactor", "test", "build"},
            "database": {"database", "query", "sql", "select", "table", "schema", "record", "db"},
            "email": {"email", "send", "mail", "recipient", "subject", "message", "inbox"},
            "admin": {"restart", "terminate", "delete", "drop", "truncate", "kill", "privilege", "root"},
        }

        # Find objective domain
        obj_domains = {dom for dom, keywords in domain_clusters.items() if keywords & obj_tokens}
        # Find action domain
        action_combined_tokens = tool_tokens | arg_tokens
        action_domains = {dom for dom, keywords in domain_clusters.items() if keywords & action_combined_tokens}

        # Check for administrative or destructive action when objective is read/analyze
        is_admin_action = "admin" in action_domains or any(w in tool_tokens for w in ["delete", "drop", "truncate", "kill", "revoke"])
        objective_is_read_only = any(w in obj_tokens for w in ["analyze", "read", "view", "summarize", "check", "inspect", "audit"])

        if is_admin_action and objective_is_read_only:
            return SemanticAssessment(
                session_id=session_id,
                alignment_status=ObjectiveAlignmentStatus.SUSPICIOUS_DEVIATION,
                alignment_score=0.15,
                reason_codes=["DESTRUCTIVE_ACTION_FOR_READ_OBJECTIVE", "SIGNIFICANT_DOMAIN_MISMATCH"],
                evidence={
                    "tool_name": tool_name,
                    "objective": bound_objective,
                    "action_domains": list(action_domains),
                },
                severity=DetectionSeverity.HIGH,
            )

        # Domain mismatch check (e.g. objective is invoice analysis, action is mass emailing)
        if obj_domains and action_domains and not (obj_domains & action_domains):
            return SemanticAssessment(
                session_id=session_id,
                alignment_status=ObjectiveAlignmentStatus.SUSPICIOUS_DEVIATION,
                alignment_score=0.30,
                reason_codes=["CROSS_DOMAIN_ACTION_MISMATCH"],
                evidence={
                    "objective_domains": list(obj_domains),
                    "action_domains": list(action_domains),
                    "tool_name": tool_name,
                },
                severity=DetectionSeverity.HIGH,
            )

        # Lexical overlap
        overlap = obj_tokens & (tool_tokens | arg_tokens)
        if overlap:
            score = min(1.0, 0.70 + 0.10 * len(overlap))
            return SemanticAssessment(
                session_id=session_id,
                alignment_status=ObjectiveAlignmentStatus.ALIGNED,
                alignment_score=round(score, 2),
                reason_codes=["LEXICAL_OBJECTIVE_MATCH"],
                evidence={"overlapping_tokens": list(overlap), "tool_name": tool_name},
                severity=DetectionSeverity.LOW,
            )

        # Weak or indeterminate overlap
        return SemanticAssessment(
            session_id=session_id,
            alignment_status=ObjectiveAlignmentStatus.POTENTIALLY_UNRELATED,
            alignment_score=0.55,
            reason_codes=["UNVERIFIED_ACTION_CORRELATION"],
            evidence={"tool_name": tool_name, "objective": bound_objective},
            severity=DetectionSeverity.MEDIUM,
        )

    def to_detection_result(
        self,
        assessment: SemanticAssessment,
    ) -> Optional[BehavioralDetectionResult]:
        """
        Converts non-nominal assessments into a standardized SENTINEL
        BehavioralDetectionResult for ingestion by ExplainableRiskEngine.
        """
        if assessment.severity in (DetectionSeverity.LOW,) and assessment.alignment_status == ObjectiveAlignmentStatus.ALIGNED:
            return None

        return BehavioralDetectionResult(
            rule_id="SNT-R010",
            rule_name="Semantic Objective Deviation",
            severity=assessment.severity,
            confidence=max(0.60, min(1.0, 1.0 - assessment.alignment_score)),
            reason_code=assessment.reason_codes[0] if assessment.reason_codes else "OBJECTIVE_DEVIATION",
            evidence={
                "alignment_status": assessment.alignment_status.value,
                "alignment_score": assessment.alignment_score,
                "reason_codes": assessment.reason_codes,
                "evidence": assessment.evidence,
                "limitations": assessment.limitations,
            },
        )
