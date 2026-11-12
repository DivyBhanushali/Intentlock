"""
INTENTLOCK Backend – Application Configuration.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from pydantic import BaseModel, Field

# Ensure SDK is importable from backend
_SDK_SRC = Path(__file__).resolve().parent.parent.parent.parent / "sdk" / "python" / "src"
if str(_SDK_SRC) not in sys.path:
    sys.path.insert(0, str(_SDK_SRC))


class Settings(BaseModel):
    PROJECT_NAME: str = "INTENTLOCK Security API"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./intentlock.db")
    )
    
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


settings = Settings()

