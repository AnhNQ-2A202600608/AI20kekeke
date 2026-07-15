"""Generic Integration Provider Registry.

Enables decoupling capabilities from specific concrete vendor services
(like LLMs, speech, vision models, etc.) through interface registration.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ProviderResponse:
    success: bool = True
    content: str = ""
    data: Any = None
    provider: str = "unknown"
    model: str = "unknown"
    error: str | None = None


class BaseProvider(ABC):
    """Abstract base for all third-party integration providers."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        ...

    @property
    @abstractmethod
    def provider_type(self) -> str:
        """Category type (e.g. llm, speech, vision, optimizer)."""
        ...

    @abstractmethod
    def health_check(self) -> bool:
        ...


class ProviderRegistry:
    """Registry managing active integration providers."""

    def __init__(self) -> None:
        self._providers: dict[str, BaseProvider] = {}

    def register(self, provider: BaseProvider) -> None:
        key = f"{provider.provider_type}:{provider.provider_id}"
        if key in self._providers:
            raise ValueError(f"Provider '{key}' already registered")
        self._providers[key] = provider

    def get(self, provider_type: str, provider_id: str) -> BaseProvider | None:
        key = f"{provider_type}:{provider_id}"
        return self._providers.get(key)

    def list_by_type(self, provider_type: str) -> list[BaseProvider]:
        return [p for p in self._providers.values() if p.provider_type == provider_type]


class DeterministicMockProvider(BaseProvider):
    """Local deterministic mock provider for testing core logic without vendor APIs."""

    def __init__(self, provider_id: str = "local_mock", provider_type: str = "llm") -> None:
        self._id = provider_id
        self._type = provider_type

    @property
    def provider_id(self) -> str:
        return self._id

    @property
    def provider_type(self) -> str:
        return self._type

    def health_check(self) -> bool:
        return True

    def process(self, payload: str) -> ProviderResponse:
        """Deterministic echo processor."""
        return ProviderResponse(
            success=True,
            content=f"[MOCK_PROVIDER:{self.provider_id}] Echo payload: {payload}",
            data={"length": len(payload)},
            provider=self.provider_id,
            model="deterministic-echo"
        )
