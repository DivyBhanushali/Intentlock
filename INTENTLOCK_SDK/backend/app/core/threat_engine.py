"""
INTENTLOCK 2.0 — Real-Time Threat Intelligence & Deterministic Anomaly Engine
Detects rapid authorization escalation, repeated traversal/denials, data exfiltration probing,
and intent context tampering. Enforces containment protocols without LLM non-determinism.
"""

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.db.models import AuditEventModel, SecurityThreatEventModel


class ThreatDetector:
    """
    Deterministic security pattern analyzer that processes interception outcomes
    and identifies attack vectors in real-time.
    """

    @staticmethod
    def inspect_and_record(
        db: Session,
        org_id: str,
        agent_id: str,
        verdict: str,
        reason: str,
        trace_id: str,
        tool_name: str,
        now: Optional[datetime] = None,
    ) -> Optional[SecurityThreatEventModel]:
        """
        Inspects the intercept decision and records any triggered security threat event.
        Guarantees tenant isolation and idempotency within short detection windows.
        """
        if verdict != "DENY":
            return None

        current_time = now or datetime.now(timezone.utc)
        threat_model: Optional[SecurityThreatEventModel] = None

        # --- Rule 1: Data Exfiltration Probing ---
        if "RECIPIENT" in reason.upper() or "EXFILTRATION" in reason.upper():
            threat_model = SecurityThreatEventModel(
                id=f"thr_{uuid.uuid4().hex[:12]}",
                org_id=org_id,
                agent_id=agent_id,
                threat_category="DATA_EXFILTRATION",
                severity="CRITICAL",
                description=f"Attempted unauthorized data exfiltration via tool '{tool_name}' blocked by recipient policy.",
                detection_rule="RULE_EXFILTRATION_ATTEMPT",
                related_trace_id=trace_id,
                recommended_response="ALERT_ADMIN",
                mitigation_status="ACTIVE",
                created_at=current_time,
            )

        # --- Rule 2: Intent Boundary Violation / Tampering ---
        elif reason in (
            "TOOL_IN_DENIED_ACTIONS",
            "ACTION_NOT_IN_INTENT_SCOPE",
            "RESOURCE_NOT_IN_INTENT_SCOPE",
            "INTENT_CONTEXT_EXPIRED",
            "INTENT_CONTEXT_REVOKED",
            "AGENT_NOT_AUTHORIZED_FOR_INTENT",
        ):
            threat_model = SecurityThreatEventModel(
                id=f"thr_{uuid.uuid4().hex[:12]}",
                org_id=org_id,
                agent_id=agent_id,
                threat_category="INTENT_VIOLATION",
                severity="HIGH",
                description=f"Agent breached active IntentContext confinement boundary: {reason} on tool '{tool_name}'.",
                detection_rule="RULE_INTENT_TAMPERING",
                related_trace_id=trace_id,
                recommended_response="ALERT_ADMIN",
                mitigation_status="ACTIVE",
                created_at=current_time,
            )

        # --- Rule 3: Privilege / Sensitivity Ceiling Escalation ---
        elif "SENSITIVITY" in reason.upper() or "CEILING" in reason.upper():
            threat_model = SecurityThreatEventModel(
                id=f"thr_{uuid.uuid4().hex[:12]}",
                org_id=org_id,
                agent_id=agent_id,
                threat_category="PRIVILEGE_ESCALATION",
                severity="CRITICAL",
                description=f"Privilege escalation attempt: tool '{tool_name}' exceeded sensitivity ceiling ({reason}).",
                detection_rule="RULE_SENSITIVITY_ESCALATION",
                related_trace_id=trace_id,
                recommended_response="ALERT_ADMIN",
                mitigation_status="ACTIVE",
                created_at=current_time,
            )

        # --- Rule 4: Rapid Repeated Denials (Brute-Force / Probing) ---
        if not threat_model:
            sixty_secs_ago = current_time - timedelta(seconds=60)
            denial_count = (
                db.query(AuditEventModel)
                .filter(
                    AuditEventModel.org_id == org_id,
                    AuditEventModel.agent_id == agent_id,
                    AuditEventModel.verdict == "DENY",
                    AuditEventModel.timestamp >= sixty_secs_ago,
                )
                .count()
            )
            # denial_count includes prior events in the last 60 seconds
            if denial_count >= 2:  # current event is the 3rd+
                threat_model = SecurityThreatEventModel(
                    id=f"thr_{uuid.uuid4().hex[:12]}",
                    org_id=org_id,
                    agent_id=agent_id,
                    threat_category="ANOMALOUS_BEHAVIOR",
                    severity="HIGH",
                    description=f"Agent exceeded denial threshold with {denial_count + 1} policy rejections in 60s.",
                    detection_rule="RULE_RAPID_DENIALS",
                    related_trace_id=trace_id,
                    recommended_response="SUSPEND_AGENT",
                    mitigation_status="ACTIVE",
                    created_at=current_time,
                )

        if threat_model:
            # Dedup: Check if an identical active threat was already logged for this agent in last 30s
            thirty_secs_ago = current_time - timedelta(seconds=30)
            existing = (
                db.query(SecurityThreatEventModel)
                .filter(
                    SecurityThreatEventModel.org_id == org_id,
                    SecurityThreatEventModel.agent_id == agent_id,
                    SecurityThreatEventModel.detection_rule == threat_model.detection_rule,
                    SecurityThreatEventModel.mitigation_status == "ACTIVE",
                    SecurityThreatEventModel.created_at >= thirty_secs_ago,
                )
                .first()
            )
            if not existing:
                db.add(threat_model)
                db.commit()
                db.refresh(threat_model)
                return threat_model

        return None
