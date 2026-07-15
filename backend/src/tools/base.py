"""Base tool interface for the agent tool system."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ToolResult:
    """Standard result returned by every tool execution."""

    success: bool = True
    data: Any = None
    records: list[dict[str, Any]] = field(default_factory=list)
    source: dict[str, Any] = field(default_factory=dict)
    error: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "success": self.success,
            "data": self.data,
            "records": self.records,
            "source": self.source,
            "error": self.error,
        }


class BaseTool(ABC):
    """Abstract base for all agent tools."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Unique tool name."""
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        """Human-readable description of what this tool does."""
        ...

    @property
    def parameters_schema(self) -> dict[str, Any]:
        """JSON Schema for the tool's parameters. Override in subclasses."""
        return {}

    @abstractmethod
    def execute(self, **kwargs: Any) -> ToolResult:
        """Execute the tool with given parameters and return a ToolResult."""
        ...

    def to_dict(self) -> dict[str, Any]:
        """Serialize tool metadata for API / LLM consumption."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters_schema,
        }
