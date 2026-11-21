"""
INTENTLOCK SENTINEL – Task Session Manager (Phase 1B).
Manages lifecycle states, valid state transitions, suspension,
and execution accounting for tenant-isolated agent task sessions.
"""

from __future__ import annotations

import copy
import threading
from datetime import datetime, timezone
from typing import Dict, List, Optional, Set

from sictack.exceptions import SessionSuspendedError
from sictack.sentinel.models import (
    TaskSession,
    TaskSessionState,
    TaskScope,
    VALID_STATE_TRANSITIONS,
)


class InvalidStateTransitionError(ValueError):
    """Raised when an illegal lifecycle transition is attempted on a TaskSession."""
    pass


class TaskSessionSuspendedError(SessionSuspendedError, PermissionError):
    """Raised when an execution is attempted on a suspended TaskSession."""
    pass


class TaskSessionTerminalError(RuntimeError):
    """Raised when an operation is attempted on a terminated/completed TaskSession."""
    pass


class TaskSessionManager:
    """
    Manages tenant-isolated TaskSession lifecycles with strict transition rules
    and cascading multi-agent containment.
    """

    _sessions: Dict[str, TaskSession] = {}
    _lock = threading.RLock()

    @classmethod
    def create_session(
        cls,
        org_id: str,
        agent_id: str,
        task_objective: str,
        authorized_scope: Optional[TaskScope] = None,
        auto_activate: bool = True,
    ) -> TaskSession:
        """
        Initializes a new TaskSession in CREATED or ACTIVE state.
        """
        scope = authorized_scope or TaskScope()
        initial_state = TaskSessionState.ACTIVE if auto_activate else TaskSessionState.CREATED
        
        session = TaskSession(
            org_id=org_id,
            agent_id=agent_id,
            task_objective=task_objective,
            authorized_scope=scope,
            state=initial_state,
        )
        with cls._lock:
            cls._sessions[session.session_id] = session
        return session

    @classmethod
    def get_session(cls, session_id: str) -> Optional[TaskSession]:
        with cls._lock:
            return cls._sessions.get(session_id)

    @classmethod
    def create_child_session(
        cls,
        parent_session: TaskSession,
        child_agent_id: str,
        task_objective: str,
        authorized_scope: Optional[TaskScope] = None,
        delegation_id: Optional[str] = None,
        auto_activate: bool = True,
    ) -> TaskSession:
        """
        Initializes a child TaskSession bound to a parent session and delegation token.
        """
        child = cls.create_session(
            org_id=parent_session.org_id,
            agent_id=child_agent_id,
            task_objective=task_objective,
            authorized_scope=authorized_scope,
            auto_activate=auto_activate,
        )
        child = child.model_copy(update={
            "parent_session_id": parent_session.session_id,
            "parent_agent_id": parent_session.agent_id,
            "delegation_id": delegation_id,
            "delegation_depth": parent_session.delegation_depth + 1,
        })
        with cls._lock:
            cls._sessions[child.session_id] = child
            if parent_session.session_id in cls._sessions:
                p = cls._sessions[parent_session.session_id]
                updated_children = list(p.child_session_ids) + [child.session_id]
                cls._sessions[parent_session.session_id] = p.model_copy(update={"child_session_ids": updated_children})
        parent_session.child_session_ids.append(child.session_id)
        return child

    @classmethod
    def cascade_containment(cls, session: TaskSession, reason: str) -> List[TaskSession]:
        """
        Cascades suspension to all active descendant child sessions when a parent session is suspended.
        """
        quarantined_descendants = []
        with cls._lock:
            active_session = cls._sessions.get(session.session_id, session)
            for child_id in list(active_session.child_session_ids):
                child = cls._sessions.get(child_id)
                if child and not child.is_suspended() and not child.is_terminal():
                    now = datetime.now(timezone.utc)
                    child.state = TaskSessionState.SUSPENDED
                    child.suspension_reason = f"CASCADING_CONTAINMENT: Parent session '{session.session_id}' suspended ({reason})"
                    child.suspended_at = now
                    child.updated_at = now
                    quarantined_descendants.append(child)
                    quarantined_descendants.extend(cls.cascade_containment(child, reason))
        return quarantined_descendants

    @staticmethod
    def transition_state(
        session: TaskSession,
        new_state: TaskSessionState,
        reason: Optional[str] = None,
    ) -> TaskSession:
        """
        Transitions a TaskSession to a new state if valid.
        Raises InvalidStateTransitionError if transition is disallowed.
        """
        current_state = session.state
        if new_state == current_state:
            return session

        allowed_targets = VALID_STATE_TRANSITIONS.get(current_state, set())
        if new_state not in allowed_targets:
            raise InvalidStateTransitionError(
                f"Illegal state transition from {current_state.value} to {new_state.value}. "
                f"Allowed target states: {[s.value for s in allowed_targets]}"
            )

        now = datetime.now(timezone.utc)
        session.state = new_state
        session.updated_at = now

        if new_state == TaskSessionState.SUSPENDED:
            session.suspension_reason = reason or "Execution suspended by security policy or anomaly"
            session.suspended_at = now
        elif current_state == TaskSessionState.SUSPENDED and new_state == TaskSessionState.ACTIVE:
            session.suspension_reason = None
            session.suspended_at = None

        return session

    @classmethod
    def suspend_session(
        cls,
        session: TaskSession,
        reason: str,
        cascade: bool = True,
    ) -> TaskSession:
        """
        Explicitly suspends an active session and cascades to descendant child sessions.
        """
        suspended = cls.transition_state(session, TaskSessionState.SUSPENDED, reason=reason)
        with cls._lock:
            cls._sessions[suspended.session_id] = suspended
        if cascade and suspended.child_session_ids:
            cls.cascade_containment(suspended, reason)
        return suspended

    @classmethod
    def resume_session(
        cls,
        session: TaskSession,
    ) -> TaskSession:
        """
        Resumes a suspended session back to ACTIVE.
        """
        return cls.transition_state(session, TaskSessionState.ACTIVE)

    @classmethod
    def terminate_session(
        cls,
        session: TaskSession,
        reason: Optional[str] = None,
    ) -> TaskSession:
        """
        Enters permanent terminal state TERMINATED.
        """
        return cls.transition_state(session, TaskSessionState.TERMINATED, reason=reason)

    @classmethod
    def complete_session(
        cls,
        session: TaskSession,
    ) -> TaskSession:
        """
        Enters terminal state COMPLETED.
        """
        return cls.transition_state(session, TaskSessionState.COMPLETED)

    @classmethod
    def fail_session(
        cls,
        session: TaskSession,
        reason: Optional[str] = None,
    ) -> TaskSession:
        """
        Enters terminal state FAILED.
        """
        return cls.transition_state(session, TaskSessionState.FAILED, reason=reason)

    @staticmethod
    def record_execution_metric(
        session: TaskSession,
        verdict: str,
        is_scope_violation: bool = False,
    ) -> TaskSession:
        """
        Updates session counters immutably.
        """
        total = session.total_executions + 1
        blocked = session.blocked_executions + (1 if verdict in {"DENY", "BLOCK", "SUSPEND"} else 0)
        violations = session.scope_violations + (1 if is_scope_violation else 0)

        return session.model_copy(
            update={
                "total_executions": total,
                "blocked_executions": blocked,
                "scope_violations": violations,
                "updated_at": datetime.now(timezone.utc),
            }
        )
