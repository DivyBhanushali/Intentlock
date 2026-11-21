"""
SICTACK Data Provenance Engine — Models & Data Structures (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."
"""

from __future__ import annotations

import enum
import hashlib
import json
import secrets
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class SourceType(str, enum.Enum):
    """Classification of data origin for agent-visible information."""
    USER_INPUT = "USER_INPUT"
    SYSTEM_INSTRUCTION = "SYSTEM_INSTRUCTION"
    RETRIEVED_DOCUMENT = "RETRIEVED_DOCUMENT"
    WEB_CONTENT = "WEB_CONTENT"
    EXTERNAL_API = "EXTERNAL_API"
    DATABASE_RESULT = "DATABASE_RESULT"
    FILE_SYSTEM = "FILE_SYSTEM"
    TOOL_OUTPUT = "TOOL_OUTPUT"
    MCP_TOOL_RESPONSE = "MCP_TOOL_RESPONSE"
    INTER_AGENT_MESSAGE = "INTER_AGENT_MESSAGE"
    DERIVED_CONTENT = "DERIVED_CONTENT"


class TrustLevel(str, enum.Enum):
    """
    Explicit Trust Classification Hierarchy.
    Ordering represents security authority (highest to lowest).
    """
    TRUSTED_CONTROL = "TRUSTED_CONTROL"                     # System instructions, validated policies
    AUTHENTICATED_USER_INPUT = "AUTHENTICATED_USER_INPUT"   # Direct from authenticated user session
    VERIFIED_INTERNAL_DATA = "VERIFIED_INTERNAL_DATA"       # Organization internal datastores (read-only)
    UNTRUSTED_EXTERNAL_DATA = "UNTRUSTED_EXTERNAL_DATA"     # Scraped web, public APIs, untrusted docs
    UNKNOWN_OR_UNVERIFIED = "UNKNOWN_OR_UNVERIFIED"         # Default for unclassified or missing provenance


# Precedence ranking for deterministic trust propagation (higher number = higher trust)
TRUST_RANKING: Dict[TrustLevel, int] = {
    TrustLevel.TRUSTED_CONTROL: 5,
    TrustLevel.AUTHENTICATED_USER_INPUT: 4,
    TrustLevel.VERIFIED_INTERNAL_DATA: 3,
    TrustLevel.UNTRUSTED_EXTERNAL_DATA: 2,
    TrustLevel.UNKNOWN_OR_UNVERIFIED: 1,
}


def compute_content_hash(content: Any) -> str:
    """Compute deterministic SHA-256 digest of arbitrary content."""
    if isinstance(content, (dict, list)):
        payload_bytes = json.dumps(content, sort_keys=True, default=str).encode("utf-8")
    elif isinstance(content, str):
        payload_bytes = content.encode("utf-8")
    elif isinstance(content, bytes):
        payload_bytes = content
    else:
        payload_bytes = str(content).encode("utf-8")
    return hashlib.sha256(payload_bytes).hexdigest()


class DataProvenanceRecord(BaseModel):
    """
    Immutable cryptographic provenance record tracking agent-visible data.
    Sensitive raw content is never stored; only cryptographic SHA-256 digests.
    """
    model_config = ConfigDict(frozen=True)

    record_id: str = Field(default_factory=lambda: f"prv_{secrets.token_hex(12)}")
    org_id: str = "default-org"
    session_id: str = ""
    agent_id: str = "default-agent"
    source_type: SourceType = SourceType.USER_INPUT
    source_identifier: str = ""  # URI, path, API endpoint, prompt ID
    tool_invocation_id: Optional[str] = None
    input_content_hash: str = ""
    output_content_hash: str = ""
    data_classification: str = "CONFIDENTIAL"
    trust_level: TrustLevel = TrustLevel.UNKNOWN_OR_UNVERIFIED
    parent_provenance_ids: List[str] = Field(default_factory=list)
    transformation_type: Optional[str] = None  # SUMMARIZATION, EXTRACTION, FORWARDING, etc.
    authorization_decision_id: Optional[str] = None
    incident_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    signature: str = ""

    @property
    def input_hash(self) -> str:
        return self.input_content_hash

    @property
    def output_hash(self) -> str:
        return self.output_content_hash

    @classmethod
    def create(
        cls,
        org_id: str = "default-org",
        session_id: str = "",
        agent_id: str = "default-agent",
        source_type: SourceType = SourceType.USER_INPUT,
        source_identifier: str = "",
        input_content: Any = None,
        output_content: Any = None,
        trust_level: TrustLevel = TrustLevel.UNKNOWN_OR_UNVERIFIED,
        parent_provenance_ids: Optional[List[str]] = None,
        transformation_type: Optional[str] = None,
        secret_key: Optional[str] = None,
    ) -> DataProvenanceRecord:
        inp_hash = compute_content_hash(input_content) if input_content is not None else ""
        out_hash = compute_content_hash(output_content) if output_content is not None else inp_hash
        parents = parent_provenance_ids or []
        rec = cls(
            org_id=org_id,
            session_id=session_id,
            agent_id=agent_id,
            source_type=source_type,
            source_identifier=source_identifier,
            input_content_hash=inp_hash,
            output_content_hash=out_hash,
            trust_level=trust_level,
            parent_provenance_ids=parents,
            transformation_type=transformation_type,
        )
        if secret_key:
            sig = rec.compute_signature(secret_key)
            rec = rec.model_copy(update={"signature": sig})
        return rec

    def canonical_string(self) -> str:
        """Deterministic string representation for cryptographic integrity signing."""
        iso_ts = self.timestamp.isoformat() if hasattr(self.timestamp, "isoformat") else str(self.timestamp)
        parents = ",".join(sorted(self.parent_provenance_ids))
        return (
            f"record_id={self.record_id}|org_id={self.org_id}|session_id={self.session_id}|"
            f"agent_id={self.agent_id}|source_type={self.source_type.value}|"
            f"source_identifier={self.source_identifier}|input_hash={self.input_content_hash}|"
            f"output_hash={self.output_content_hash}|trust_level={self.trust_level.value}|"
            f"parents={parents}|transformation={self.transformation_type or ''}|"
            f"timestamp={iso_ts}"
        )

    def compute_signature(self, secret_key: str) -> str:
        """Sign canonical string with HMAC-SHA256."""
        import hmac
        return hmac.new(
            secret_key.encode("utf-8"),
            self.canonical_string().encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def verify_signature(self, secret_key: str) -> bool:
        """Verify HMAC-SHA256 signature against canonical string."""
        import hmac
        expected = self.compute_signature(secret_key)
        return hmac.compare_digest(self.signature, expected)


class ProvenanceLineageNode(BaseModel):
    """Node in the causal provenance DAG tree."""
    record: DataProvenanceRecord
    ancestors: List[ProvenanceLineageNode] = Field(default_factory=list)
    effective_trust_level: TrustLevel = TrustLevel.UNKNOWN_OR_UNVERIFIED

    @property
    def record_id(self) -> str:
        return self.record.record_id

    @property
    def parent_nodes(self) -> List[ProvenanceLineageNode]:
        return self.ancestors
