"""
INTENTLOCK API Server.

Production-grade FastAPI application providing REST API endpoints for:
- Declarative security policy management
- Human-in-the-loop approval triage
- Tamper-evident security audit trail
- AI agent registration
- Remote tool-call security interception gateway
"""

from __future__ import annotations

import sys
from pathlib import Path
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Ensure app package and SDK are importable
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

sdk_dir = Path(__file__).resolve().parent.parent.parent / "sdk" / "python" / "src"
if str(sdk_dir) not in sys.path:
    sys.path.insert(0, str(sdk_dir))

from app.core.config import settings
from app.db.session import engine, Base, SessionLocal
from app.db.models import PolicyModel, AgentModel
from app.db.migrations import apply_migrations
from app.api.v1.router import api_router

logger = logging.getLogger("intentlock.server")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook: initialize database tables, apply migrations, and seed initial sample policy."""
    Base.metadata.create_all(bind=engine)
    apply_migrations(engine)

    # Seed default policy if none exists
    db = SessionLocal()
    try:
        policy_count = db.query(PolicyModel).count()
        if policy_count == 0:
            default_policy = PolicyModel(
                id="default-email-assistant-policy",
                name="Email Assistant Standard Policy",
                description="Default policy allowing email reading and summarization, requiring approval for data export, and denying deletions.",
                allowed_permissions=["read_email", "email:read", "summarize_email", "fetch_inbox"],
                denied_permissions=["delete_email", "email:delete", "delete_all", "drop_table", "database:drop"],
                require_approval_permissions=["export_user_data", "send_external_email", "email:send"],
                allowed_resources=["inbox/*", "reports/*"],
                allowed_recipients=["admin@company.com", "support@company.com", "*@company.com"],
                max_risk_level="HIGH",
                max_sensitivity=8,
            )
            db.add(default_policy)
            
            sample_agent = AgentModel(
                id="support-agent-alpha",
                name="Customer Support Assistant",
                description="Autonomous customer support agent with email tools.",
                policy_id="default-email-assistant-policy",
            )
            db.add(sample_agent)
            db.commit()
    finally:
        db.close()

    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="The security enforcement layer for AI agents. Validates, intercepts, and audits tool calls before execution.",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    """
    Top-level exception handler to ensure unhandled 500 errors do not expose
    stack traces or internal exceptions to clients, while enforcing security headers.
    """
    logger.error(
        f"Unhandled server error on {request.method} {request.url.path}: {exc}",
        exc_info=True,
    )
    response = JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Enforce defense-in-depth HTTP security response headers across all responses."""
    try:
        response = await call_next(request)
    except Exception as exc:
        logger.error(f"Unhandled exception in request pipeline: {exc}", exc_info=True)
        response = JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint for container orchestrators and monitoring."""
    return {
        "status": "healthy",
        "service": "INTENTLOCK API",
        "version": settings.VERSION,
        "database": settings.DATABASE_URL.split("://")[0],
    }


@app.get("/", tags=["Root"])
def root():
    """Root info endpoint redirecting users to interactive Swagger documentation."""
    return {
        "message": "Welcome to INTENTLOCK Security API",
        "documentation": "/docs",
        "health": "/health",
        "api_v1": settings.API_V1_STR,
    }

