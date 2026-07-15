"""Tool registry — central place to register, discover, and execute tools."""

from __future__ import annotations

from src.core.errors import ToolExecutionError
from src.core.logging import get_logger
from src.tools.base import BaseTool, ToolResult

logger = get_logger("tools.registry")


class ToolRegistry:
    """Registry that holds all available tools for the agent."""

    def __init__(self) -> None:
        self._tools: dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool. Raises ValueError on duplicate name."""
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' is already registered")
        self._tools[tool.name] = tool
        logger.info("Registered tool: %s", tool.name)

    def get(self, name: str) -> BaseTool | None:
        """Get a tool by name, or None if not found."""
        return self._tools.get(name)

    def list_tools(self) -> list[dict]:
        """Return metadata of all registered tools."""
        return [t.to_dict() for t in self._tools.values()]

    def list_names(self) -> list[str]:
        """Return names of all registered tools."""
        return list(self._tools.keys())

    def execute(self, name: str, **kwargs) -> ToolResult:
        """Execute a tool by name. Raises ToolExecutionError on failure."""
        tool = self._tools.get(name)
        if tool is None:
            raise ToolExecutionError(name, f"Tool '{name}' not found in registry")
        try:
            result = tool.execute(**kwargs)
            logger.info("Tool '%s' executed successfully", name)
            return result
        except ToolExecutionError:
            raise
        except Exception as exc:
            logger.error("Tool '%s' failed: %s", name, exc)
            raise ToolExecutionError(name, str(exc)) from exc
