"""
INTENTLOCK Backend – Application Configuration.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from pydantic import BaseModel, Field

# Ensure SDK is importable from backend
_SDK_SRC = Path(__file__).resolve().parent.parent.parent.parent / "sdk" / "python" / "src"
if str(_SDK_SRC) not in sys.path:
    sys.path.insert(0, str(_SDK_SRC))


def normalize_database_url(url: str | None) -> str:
    """
    Normalizes database URL schemes for SQLAlchemy compatibility.
    Replaces legacy 'postgres://' with 'postgresql://'.
    """
    if not url:
        return ""
    trimmed = url.strip()
    if trimmed.startswith("postgres://"):
        return "postgresql://" + trimmed[len("postgres://"):]
    return trimmed


def mask_database_url(url: str | None) -> str:
    """
    Returns the database URL with the password redacted for secure logging and telemetry.
    """
    if not url:
        return "<empty>"
    try:
        parts = urlsplit(url)
        if parts.password:
            user = parts.username or ""
            host = parts.hostname or ""
            port = f":{parts.port}" if parts.port else ""
            netloc = f"{user}:***@{host}{port}"
            return urlunsplit((parts.scheme, netloc, parts.path, parts.query, parts.fragment))
        return url
    except Exception:
        return "***"


def _resolve_database_url() -> str:
    """
    Resolves the active DATABASE_URL based on environment.
    Prevents production from silently falling back to SQLite.
    """
    env = os.getenv("ENVIRONMENT", "development").strip().lower()
    raw_url = os.getenv("DATABASE_URL", "").strip()

    if env in ("production", "prod", "staging"):
        if not raw_url:
            raise RuntimeError(
                "CRITICAL CONFIGURATION ERROR: DATABASE_URL environment variable is required in production. "
                "Silent SQLite fallback is prohibited."
            )
        normalized = normalize_database_url(raw_url)
        if normalized.startswith("sqlite"):
            raise RuntimeError(
                "CRITICAL CONFIGURATION ERROR: SQLite database URL is prohibited in production. "
                "A valid PostgreSQL DATABASE_URL must be configured."
            )
        return normalized

    # In development or testing, fallback to local SQLite is permitted
    if not raw_url:
        return "sqlite:///./intentlock.db"
    return normalize_database_url(raw_url)


class Settings(BaseModel):
    PROJECT_NAME: str = "INTENTLOCK Security API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(
        default_factory=lambda: os.getenv("ENVIRONMENT", "development").lower()
    )
    
    # Database
    DATABASE_URL: str = Field(default_factory=_resolve_database_url)
    
    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "https://intentlock-wheat.vercel.app",
    ]
    
    # Security
    SECRET_KEY: str = Field(
        default_factory=lambda: os.getenv("SECRET_KEY", "intentlock-insecure-dev-secret-key-change-in-prod")
    )
    DEFAULT_APPROVAL_TIMEOUT_SECONDS: int = 300
    FAIL_CLOSED: bool = True

    @property
    def masked_database_url(self) -> str:
        """Safe database URL with credentials redacted for logging."""
        return mask_database_url(self.DATABASE_URL)


settings = Settings()
