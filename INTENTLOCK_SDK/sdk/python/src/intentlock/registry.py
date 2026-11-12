"""
INTENTLOCK – Tool Registry.

Manages the mapping between tool names, their metadata descriptors, and
their callable handler functions.  The registry enforces uniqueness by
name and validates that handlers are actually callable.
"""

from __future__ import annotations

import threading
from typing import Any, Callable

from intentlock.exceptions import IntentLockError, ToolNotRegisteredError
from intentlock.logger import get_logger
from intentlock.models import RegisteredTool

_log = get_logger(__name__)


class ToolRegistry:
    """
    Thread-safe registry of tools available to AI agents.

    Each tool is stored as a :class:`RegisteredTool` descriptor paired with
    a callable handler.  The handler is never exposed publicly – consumers
    must go through the :class:`ActionGateway` for execution.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._tools: dict[str, RegisteredTool] = {}
        self._handlers: dict[str, Callable[..., Any]] = {}

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register(
        self,
        name: str,
        handler: Callable[..., Any],
        permission: str,
        description: str = "",
        sensitivity: int = 0,
        schema: dict[str, Any] | None = None,
    ) -> RegisteredTool:
        """
        Register a tool with the given *name*.

        Parameters
        ----------
        name:
            Unique tool name (no spaces).
        handler:
            The callable to invoke when this tool is executed.
        permission:
            Permission string required by policy to invoke this tool.
        description:
            Human-readable description of the tool.
        sensitivity:
            Default sensitivity level (0–10).
        schema:
            Optional JSON-schema dict for argument validation.

        Returns
        -------
        RegisteredTool
            The created descriptor.

        Raises
        ------
        ValueError
            If *name* is already registered or *handler* is not callable.
        """
        if not callable(handler):
            raise ValueError(f"handler for tool '{name}' must be callable")

        descriptor = RegisteredTool(
            name=name,
            permission=permission,
            description=description,
            sensitivity=sensitivity,
            schema=schema,
        )

        with self._lock:
            if name in self._tools:
                raise IntentLockError(
                    f"Tool '{name}' is already registered; unregister it first",
                    tool_name=name,
                )
            self._tools[name] = descriptor
            self._handlers[name] = handler

        _log.info(
            "Tool registered",
            extra={"tool_name": name, "permission": permission, "sensitivity": sensitivity},
        )
        return descriptor

    # ------------------------------------------------------------------
    # Lookup
    # ------------------------------------------------------------------

    def get(self, name: str) -> tuple[RegisteredTool, Callable[..., Any]]:
        """
        Return the descriptor and handler for *name*.

        Raises
        ------
        ToolNotRegisteredError
            If no tool with *name* exists.
        """
        with self._lock:
            try:
                return self._tools[name], self._handlers[name]
            except KeyError:
                raise ToolNotRegisteredError(
                    f"Tool '{name}' is not registered",
                    tool_name=name,
                ) from None

    def has(self, name: str) -> bool:
        """Return ``True`` if a tool with *name* is registered."""
        with self._lock:
            return name in self._tools

    def list_tools(self) -> list[RegisteredTool]:
        """Return descriptors for all registered tools."""
        with self._lock:
            return list(self._tools.values())

    # ------------------------------------------------------------------
    # Removal
    # ------------------------------------------------------------------

    def unregister(self, name: str) -> None:
        """
        Remove the tool with *name* from the registry.

        Raises
        ------
        ToolNotRegisteredError
            If no tool with *name* exists.
        """
        with self._lock:
            if name not in self._tools:
                raise ToolNotRegisteredError(
                    f"Tool '{name}' is not registered",
                    tool_name=name,
                )
            del self._tools[name]
            del self._handlers[name]

        _log.info("Tool unregistered", extra={"tool_name": name})
