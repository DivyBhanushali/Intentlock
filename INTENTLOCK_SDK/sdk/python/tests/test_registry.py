"""Unit tests for INTENTLOCK ToolRegistry."""

import pytest
from intentlock.registry import ToolRegistry
from intentlock.exceptions import ToolNotRegisteredError, IntentLockError


def test_register_and_get():
    reg = ToolRegistry()

    def my_tool(x: int) -> int:
        return x * 2

    reg.register(
        name="double",
        handler=my_tool,
        permission="calc:double",
        description="Doubles an integer",
        sensitivity=1
    )

    desc, handler = reg.get("double")
    assert desc.name == "double"
    assert desc.permission == "calc:double"
    assert desc.sensitivity == 1
    assert handler(5) == 10


def test_register_duplicate_raises():
    reg = ToolRegistry()
    reg.register(name="tool1", handler=lambda: None, permission="p1")

    with pytest.raises(IntentLockError, match="already registered"):
        reg.register(name="tool1", handler=lambda: None, permission="p2")


def test_get_nonexistent_raises():
    reg = ToolRegistry()
    with pytest.raises(ToolNotRegisteredError, match="not registered"):
        reg.get("unknown_tool")


def test_list_tools():
    reg = ToolRegistry()
    reg.register(name="t1", handler=lambda: 1, permission="p1")
    reg.register(name="t2", handler=lambda: 2, permission="p2")

    tools = reg.list_tools()
    assert len(tools) == 2
    names = {t.name for t in tools}
    assert names == {"t1", "t2"}


def test_has():
    reg = ToolRegistry()
    reg.register(name="t1", handler=lambda: 1, permission="p1")
    assert reg.has("t1") is True
    assert reg.has("t2") is False


def test_unregister():
    reg = ToolRegistry()
    reg.register(name="t1", handler=lambda: 1, permission="p1")
    assert reg.has("t1") is True

    reg.unregister("t1")
    assert reg.has("t1") is False


def test_register_non_callable_raises():
    reg = ToolRegistry()
    with pytest.raises(ValueError, match="must be callable"):
        reg.register(name="bad_tool", handler="not_callable", permission="p1")

