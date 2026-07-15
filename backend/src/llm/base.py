"""Abstract LLM provider interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class LLMResponse:
    """Structured response from an LLM provider."""

    content: str = ""
    intent: str = ""
    tool_plan: list[dict[str, Any]] = field(default_factory=list)
    provider: str = "unknown"
    model: str = "unknown"
    is_stub: bool = False
    metadata: dict[str, Any] = field(default_factory=dict)


class BaseLLMProvider(ABC):
    """Abstract base for all LLM providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider name."""
        ...

    @abstractmethod
    def analyze_intent(self, query: str, context: list[dict] | None = None) -> LLMResponse:
        """Analyze user query to determine intent and required tools."""
        ...

    @abstractmethod
    def compose_response(
        self,
        query: str,
        tool_results: list[dict[str, Any]],
        context: list[dict] | None = None,
    ) -> LLMResponse:
        """Compose a final response using tool results and context."""
        ...
