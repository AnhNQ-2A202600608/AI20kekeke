"""Capability registry and base interface.

A 'capability' is a named processing unit that:
  - Accepts parameters and optional input files.
  - Produces artifacts as output.
  - Is domain-neutral — could be anything from text transform to model training.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

from src.core.logging import get_logger

logger = get_logger("capabilities")


@dataclass
class CapabilityResult:
    """Result of running a capability."""

    success: bool = True
    artifacts: list[dict[str, Any]] | None = None
    error: str | None = None


class BaseCapability(ABC):
    """Abstract base for all capabilities."""

    @property
    @abstractmethod
    def name(self) -> str:
        ...

    @property
    @abstractmethod
    def description(self) -> str:
        ...

    @property
    def parameters_schema(self) -> dict[str, Any]:
        """JSON-Schema-style description of accepted parameters."""
        return {}

    @abstractmethod
    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        """Run the capability and return a result."""
        ...

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters_schema": self.parameters_schema,
        }


class CapabilityRegistry:
    """Registry of available capabilities."""

    def __init__(self) -> None:
        self._caps: dict[str, BaseCapability] = {}

    def register(self, cap: BaseCapability) -> None:
        if cap.name in self._caps:
            raise ValueError(f"Capability '{cap.name}' already registered")
        self._caps[cap.name] = cap
        logger.info("Registered capability: %s", cap.name)

    def get(self, name: str) -> BaseCapability | None:
        return self._caps.get(name)

    def list_all(self) -> list[dict[str, Any]]:
        return [c.to_dict() for c in self._caps.values()]

    def names(self) -> list[str]:
        return list(self._caps.keys())
