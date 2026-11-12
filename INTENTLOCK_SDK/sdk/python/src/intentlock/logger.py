"""
INTENTLOCK – Structured JSON-lines logger with secret redaction.

Usage::

    from intentlock.logger import get_logger

    log = get_logger(__name__)
    log.info("tool evaluated", extra={"agent_id": "a1", "tool_name": "send_email"})

All log records are emitted as single-line JSON objects.  Values whose
keys contain any of the configured *redact substrings* (e.g. ``"token"``,
``"password"``) are replaced with ``"[REDACTED]"`` before serialisation.
"""

from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

# Default substrings that trigger redaction.
_DEFAULT_REDACT_SUBSTRINGS: list[str] = [
    "secret",
    "token",
    "key",
    "password",
    "credential",
]


class RedactingFormatter(logging.Formatter):
    """
    Formats a :class:`logging.LogRecord` as a single JSON line.

    Any value in the record's ``extra`` dict (or top-level record attributes)
    whose key contains a redact substring is replaced with ``"[REDACTED]"``.
    """

    REDACTED: str = "[REDACTED]"

    # Standard LogRecord attributes that should never be serialised as "extra".
    _BUILTIN_ATTRS: frozenset[str] = frozenset(
        {
            "args",
            "asctime",
            "created",
            "exc_info",
            "exc_text",
            "filename",
            "funcName",
            "levelname",
            "levelno",
            "lineno",
            "message",
            "module",
            "msecs",
            "msg",
            "name",
            "pathname",
            "process",
            "processName",
            "relativeCreated",
            "stack_info",
            "taskName",
            "thread",
            "threadName",
        }
    )

    def __init__(
        self,
        redact_substrings: list[str] | None = None,
    ) -> None:
        super().__init__()
        self._redact_substrings: list[str] = [
            s.lower() for s in (redact_substrings or _DEFAULT_REDACT_SUBSTRINGS)
        ]

    # ------------------------------------------------------------------
    # Redaction helpers
    # ------------------------------------------------------------------

    def _should_redact(self, key: str) -> bool:
        """Return True if *key* matches any redact substring (case-insensitive)."""
        lower = key.lower()
        return any(sub in lower for sub in self._redact_substrings)

    def _redact_value(self, obj: Any) -> Any:
        """Recursively redact values in dicts whose keys trigger redaction."""
        if isinstance(obj, dict):
            return {
                k: (self.REDACTED if self._should_redact(k) else self._redact_value(v))
                for k, v in obj.items()
            }
        if isinstance(obj, (list, tuple)):
            return [self._redact_value(item) for item in obj]
        return obj

    # ------------------------------------------------------------------
    # Formatting
    # ------------------------------------------------------------------

    def format(self, record: logging.LogRecord) -> str:
        """Produce a single-line JSON string for *record*."""
        # Build the base envelope.
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        # Collect extra fields added by the caller.
        for attr_name in dir(record):
            if attr_name.startswith("_"):
                continue
            if attr_name in self._BUILTIN_ATTRS:
                continue
            # Skip callables and properties.
            try:
                val = getattr(record, attr_name)
            except Exception:  # noqa: BLE001
                continue
            if callable(val):
                continue
            # Only include explicitly-added extras.
            if attr_name not in record.__dict__:
                continue
            if attr_name in self._BUILTIN_ATTRS:
                continue
            payload[attr_name] = val

        # Redact sensitive keys.
        payload = self._redact_value(payload)  # type: ignore[assignment]

        # Exception info.
        if record.exc_info and record.exc_info[1] is not None:
            payload["exception"] = self.formatException(record.exc_info)

        try:
            return json.dumps(payload, default=str, ensure_ascii=False)
        except (TypeError, ValueError):
            # Absolute last resort – emit something rather than crash the logger.
            return json.dumps(
                {"timestamp": payload.get("timestamp"), "level": "ERROR", "message": "LOG_SERIALISATION_ERROR"},
            )


def get_logger(
    name: str,
    *,
    level: int = logging.DEBUG,
    redact_substrings: list[str] | None = None,
) -> logging.Logger:
    """
    Return a :class:`logging.Logger` configured for JSON-line output.

    If the logger already has handlers (e.g. from a previous call with the
    same *name*) it is returned as-is to avoid duplicate output.

    Parameters
    ----------
    name:
        Logger name (typically ``__name__``).
    level:
        Minimum severity to emit.
    redact_substrings:
        Custom list of substrings triggering value redaction.  Defaults to
        ``["secret", "token", "key", "password", "credential"]``.
    """
    logger = logging.getLogger(name)

    if logger.handlers:
        # Already configured – return the existing instance.
        return logger

    logger.setLevel(level)
    logger.propagate = False

    handler = logging.StreamHandler(stream=sys.stderr)
    handler.setLevel(level)
    handler.setFormatter(RedactingFormatter(redact_substrings=redact_substrings))
    logger.addHandler(handler)

    return logger
