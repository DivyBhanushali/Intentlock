"""
INTENTLOCK Enterprise Security & Authentication Utilities.
Standard-library cryptographic utilities for PBKDF2 password hashing,
HMAC-SHA256 JWT generation/verification, and API key management.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

from app.core.config import settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7-day session token


def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64url_decode(data_str: str) -> bytes:
    padding = 4 - (len(data_str) % 4)
    if padding and padding < 4:
        data_str += "=" * padding
    return base64.urlsafe_b64decode(data_str.encode("utf-8"))


# ─── Password Hashing (PBKDF2-HMAC-SHA256) ──────────────────────────────────

def hash_password(password: str) -> str:
    """Generate secure salted PBKDF2-HMAC-SHA256 hash."""
    salt = secrets.token_bytes(16)
    iterations = 100_000
    derived = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return f"pbkdf2:sha256:{iterations}${_b64url_encode(salt)}${_b64url_encode(derived)}"


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Constant-time verification of password against stored hash."""
    try:
        parts = password_hash.split("$")
        if len(parts) != 3:
            return False
        header, salt_b64, derived_b64 = parts
        _, _, iterations_str = header.split(":")
        iterations = int(iterations_str)
        salt = _b64url_decode(salt_b64)
        stored_derived = _b64url_decode(derived_b64)

        candidate_derived = hashlib.pbkdf2_hmac(
            "sha256", plain_password.encode("utf-8"), salt, iterations
        )
        return hmac.compare_digest(candidate_derived, stored_derived)
    except Exception:
        return False


# ─── JWT Token Management (HS256) ──────────────────────────────────────────

def create_access_token(
    payload: Dict[str, Any],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Generate a standard HS256 signed JSON Web Token."""
    now = datetime.now(timezone.utc)
    exp = now + (expires_delta or timedelta(hours=JWT_EXPIRATION_HOURS))

    claims = dict(payload)
    claims["iat"] = int(now.timestamp())
    claims["exp"] = int(exp.timestamp())

    header = {"alg": JWT_ALGORITHM, "typ": "JWT"}
    header_bytes = json.dumps(header, separators=(",", ":")).encode("utf-8")
    payload_bytes = json.dumps(claims, separators=(",", ":")).encode("utf-8")

    encoded_header = _b64url_encode(header_bytes)
    encoded_payload = _b64url_encode(payload_bytes)

    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
    signature = hmac.new(
        settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
    ).digest()
    encoded_signature = _b64url_encode(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify signature and expiration of a JWT token, returning claims dict."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        encoded_header, encoded_payload, encoded_signature = parts

        signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")
        expected_sig = hmac.new(
            settings.SECRET_KEY.encode("utf-8"), signing_input, hashlib.sha256
        ).digest()
        actual_sig = _b64url_decode(encoded_signature)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64url_decode(encoded_payload)
        claims = json.loads(payload_bytes.decode("utf-8"))

        now_ts = int(datetime.now(timezone.utc).timestamp())
        if claims.get("exp", 0) < now_ts:
            return None  # Expired

        return claims
    except Exception:
        return None


# ─── API Key Management (Stripe-Style `ilk_live_...`) ────────────────────────

def generate_api_key() -> Tuple[str, str, str]:
    """
    Generate an enterprise API key for AI agent integration.
    Returns: (raw_key, key_prefix, key_hash)
    """
    secret = secrets.token_hex(20)
    raw_key = f"ilk_live_{secret}"
    key_prefix = raw_key[:12] + "..."  # e.g. ilk_live_1234...
    key_hash = hash_api_key(raw_key)
    return raw_key, key_prefix, key_hash


def hash_api_key(raw_key: str) -> str:
    """Deterministic hash of API key for storage in database."""
    return hashlib.sha256(f"ilk:{raw_key}:{settings.SECRET_KEY}".encode("utf-8")).hexdigest()

