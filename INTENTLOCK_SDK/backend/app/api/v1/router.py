"""
INTENTLOCK Backend – Aggregated API v1 Router.
"""

from fastapi import APIRouter
from app.api.v1.policies import router as policies_router
from app.api.v1.approvals import router as approvals_router
from app.api.v1.audit import router as audit_router
from app.api.v1.agents import router as agents_router
from app.api.v1.intercept import router as intercept_router

api_router = APIRouter()
api_router.include_router(policies_router)
api_router.include_router(approvals_router)
api_router.include_router(audit_router)
api_router.include_router(agents_router)
api_router.include_router(intercept_router)

