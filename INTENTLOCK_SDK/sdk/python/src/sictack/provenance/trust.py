"""
SICTACK Trust Boundary Enforcement Engine (Phase 4D).
Product: SICTACK — Global AI Agent Runtime Security Infrastructure
Tagline: "Secure the action. Protect the intention."

Enforces deterministic trust classification and propagation rules across
agent tool executions, derived content transformations, and delegation trees.
"""

from __future__ import annotations

import logging
from typing import List, Optional

from sictack.provenance.models import (
    DataProvenanceRecord,
    SourceType,
    TrustLevel,
    TRUST_RANKING,
)
from sictack.exceptions import SictackError

logger = logging.getLogger("sictack.provenance.trust")


class TrustBoundaryViolationError(SictackError):
    """Raised when an operation violates mandatory trust boundary invariants."""
    pass


class UntrustedInstructionElevationError(TrustBoundaryViolationError):
    """
    Raised when untrusted or external data attempts to elevate to
    a TRUSTED_CONTROL instruction or override active security policies.
    """
    pass


class TrustPolicyEngine:
    """
    Deterministic trust boundary and lineage evaluation engine.
    Ensures that untrusted content can never be laundered into higher-trust
    control directives through copying, summarization, or forwarding.
    """

    @classmethod
    def resolve_effective_trust(
        cls,
        parent_records: List[DataProvenanceRecord],
        source_type: SourceType,
        explicit_trust: Optional[TrustLevel] = None,
        is_authoritative_component: bool = False,
    ) -> TrustLevel:
        """
        Calculates the effective trust level for derived or newly ingested content.
        
        Rules:
        1. TRUSTED_CONTROL can only be assigned by an authoritative internal component
           (e.g., ActionGateway, system configuration loader). Unauthoritative callers
           requesting TRUSTED_CONTROL are downgraded to UNKNOWN_OR_UNVERIFIED.
        2. If parent records are provided (derived/summarized content), the effective trust
           level cannot exceed the minimum trust ranking among all parent inputs.
        3. Untrusted external data (UNTRUSTED_EXTERNAL_DATA) is contagious: any derived
           content that incorporates external data inherits at most UNTRUSTED_EXTERNAL_DATA.
        4. In the absence of provenance or parents, default to UNKNOWN_OR_UNVERIFIED.
        """
        # Determine candidate trust
        if explicit_trust is not None:
            candidate = explicit_trust
        elif source_type == SourceType.SYSTEM_INSTRUCTION and is_authoritative_component:
            candidate = TrustLevel.TRUSTED_CONTROL
        elif source_type == SourceType.USER_INPUT:
            candidate = TrustLevel.AUTHENTICATED_USER_INPUT
        elif source_type in (SourceType.DATABASE_RESULT, SourceType.FILE_SYSTEM) and is_authoritative_component:
            candidate = TrustLevel.VERIFIED_INTERNAL_DATA
        elif source_type in (SourceType.WEB_CONTENT, SourceType.EXTERNAL_API, SourceType.RETRIEVED_DOCUMENT, SourceType.MCP_TOOL_RESPONSE):
            candidate = TrustLevel.UNTRUSTED_EXTERNAL_DATA
        else:
            candidate = TrustLevel.UNKNOWN_OR_UNVERIFIED

        # Defense-in-depth: Block unauthorized TRUSTED_CONTROL assertion
        if candidate == TrustLevel.TRUSTED_CONTROL and not is_authoritative_component:
            logger.warning("Unauthorized assertion of TRUSTED_CONTROL rejected; downgrading.")
            candidate = TrustLevel.UNKNOWN_OR_UNVERIFIED

        # If deriving from parents, enforce minimum-trust ceiling
        if parent_records:
            parent_min_rank = min(TRUST_RANKING[p.trust_level] for p in parent_records)
            candidate_rank = TRUST_RANKING[candidate]
            if candidate_rank > parent_min_rank:
                # Find corresponding enum for parent_min_rank
                for level, rank in TRUST_RANKING.items():
                    if rank == parent_min_rank:
                        candidate = level
                        break

        return candidate

    @classmethod
    def assert_executable_instruction(
        cls,
        provenance_record: DataProvenanceRecord,
        instruction_intent: str = "SYSTEM_CONFIGURATION",
    ) -> None:
        """
        Validates that a piece of information possesses sufficient trust to be
        treated as an actionable directive or policy input.
        
        Raises UntrustedInstructionElevationError if untrusted or external data
        attempts to act as an authoritative instruction.
        """
        if provenance_record.trust_level in (
            TrustLevel.UNTRUSTED_EXTERNAL_DATA,
            TrustLevel.UNKNOWN_OR_UNVERIFIED,
        ):
            raise UntrustedInstructionElevationError(
                f"Trust boundary violation: Content from '{provenance_record.source_type.value}' "
                f"({provenance_record.source_identifier}) has trust level "
                f"'{provenance_record.trust_level.value}' and cannot be executed as a "
                f"{instruction_intent} instruction."
            )

    @classmethod
    def validate_trust_propagation(
        cls,
        claimed_trust_level: TrustLevel,
        parent_trust_levels: List[TrustLevel],
        is_authoritative_component: bool = False,
    ) -> None:
        """
        Validates whether claimed trust level satisfies strict non-elevation invariants.
        Raises UntrustedInstructionElevationError if untrusted data elevates to TRUSTED_CONTROL or AUTHENTICATED_USER_INPUT.
        """
        if not parent_trust_levels:
            return

        has_untrusted_parent = any(
            p in (TrustLevel.UNTRUSTED_EXTERNAL_DATA, TrustLevel.UNKNOWN_OR_UNVERIFIED)
            for p in parent_trust_levels
        )
        if has_untrusted_parent and claimed_trust_level in (TrustLevel.TRUSTED_CONTROL, TrustLevel.AUTHENTICATED_USER_INPUT):
            raise UntrustedInstructionElevationError(
                f"Trust boundary violation: Untrusted external ancestry cannot elevate to {claimed_trust_level.value}."
            )

        min_parent_rank = min(TRUST_RANKING[p] for p in parent_trust_levels)
        claimed_rank = TRUST_RANKING[claimed_trust_level]
        if claimed_rank > min_parent_rank and not is_authoritative_component:
            raise TrustBoundaryViolationError(
                f"Trust elevation violation: Claimed {claimed_trust_level.value} exceeds parent trust limit."
            )

    @classmethod
    def derive_effective_trust(cls, parent_trust_levels: List[TrustLevel]) -> TrustLevel:
        """Returns the minimum trust level among parents."""
        if not parent_trust_levels:
            return TrustLevel.UNKNOWN_OR_UNVERIFIED
        min_rank = min(TRUST_RANKING[p] for p in parent_trust_levels)
        for level, rank in TRUST_RANKING.items():
            if rank == min_rank:
                return level
        return TrustLevel.UNKNOWN_OR_UNVERIFIED
