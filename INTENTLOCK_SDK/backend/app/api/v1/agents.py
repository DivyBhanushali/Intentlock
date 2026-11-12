"""
INTENTLOCK Backend – Agent Registration and Management Endpoints.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import AgentModel, PolicyModel
from app.schemas.schemas import AgentCreate, AgentResponse

router = APIRouter(prefix="/agents", tags=["Agents"])


@router.get("", response_model=List[AgentResponse])
def list_agents(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """List all registered AI agents."""
    agents = db.query(AgentModel).offset(skip).limit(limit).all()
    return agents


@router.post("", response_model=AgentResponse, status_code=status.HTTP_201_CREATED)
def register_agent(agent_in: AgentCreate, db: Session = Depends(get_db)):
    """Register an AI agent and optionally bind it to a security policy."""
    existing = db.query(AgentModel).filter(AgentModel.id == agent_in.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Agent '{agent_in.id}' is already registered",
        )

    if agent_in.policy_id:
        policy = db.query(PolicyModel).filter(PolicyModel.id == agent_in.policy_id).first()
        if not policy:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Policy '{agent_in.policy_id}' does not exist",
            )

    now = datetime.now(timezone.utc)
    db_agent = AgentModel(
        id=agent_in.id,
        name=agent_in.name,
        description=agent_in.description,
        policy_id=agent_in.policy_id,
        created_at=now,
        last_active_at=now,
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific registered agent."""
    agent = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent '{agent_id}' not found",
        )
    return agent

