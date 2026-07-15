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
    """Abstract base for all capabilities conforming to the Capability Contract."""

    @property
    @abstractmethod
    def id(self) -> str:
        """Unique ID of the capability (often matching module ID)."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable name."""
        ...

    @property
    def version(self) -> str:
        """Version of the capability."""
        return "0.1.0"

    @property
    @abstractmethod
    def description(self) -> str:
        """Description of the capability."""
        ...

    @property
    def category(self) -> str:
        """Category of the capability (e.g. transform, agent, prediction)."""
        return "general"

    @property
    def enabled(self) -> bool:
        """Flag indicating if this capability is currently enabled."""
        return True

    @property
    def input_schema(self) -> dict[str, Any]:
        """JSON-Schema-style description of accepted parameters."""
        return {}

    @property
    def output_schema(self) -> dict[str, Any]:
        """JSON-Schema-style description of output parameters/artifacts."""
        return {}

    @property
    def required_dependencies(self) -> list[str]:
        """List of required third-party Python packages."""
        return []

    @property
    def required_environment(self) -> list[str]:
        """List of required environment variable names."""
        return []

    @property
    def supported_file_types(self) -> list[str]:
        """List of supported input file extensions (e.g. ['.txt', '.csv'])."""
        return []

    def health_check(self) -> bool:
        """Self-test capability execution health. Returns True if healthy."""
        return True

    def validate_input(self, parameters: dict[str, Any]) -> list[str]:
        """Validate input parameters. Returns a list of error messages (empty if valid)."""
        return []

    @abstractmethod
    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        """Run the capability and return a result."""
        ...

    def evaluate(self, run_result: CapabilityResult, expected_output: Any) -> dict[str, Any]:
        """Evaluate run quality metrics. Returns dictionary of scores."""
        return {"success": run_result.success}

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "version": self.version,
            "description": self.description,
            "category": self.category,
            "enabled": self.enabled,
            "input_schema": self.input_schema,
            "output_schema": self.output_schema,
            "required_dependencies": self.required_dependencies,
            "required_environment": self.required_environment,
            "supported_file_types": self.supported_file_types,
        }


class CapabilityRegistry:
    """Registry of available capabilities."""

    def __init__(self) -> None:
        self._caps: dict[str, BaseCapability] = {}

    def register(self, cap: BaseCapability) -> None:
        if cap.id in self._caps:
            raise ValueError(f"Capability '{cap.id}' already registered")
        self._caps[cap.id] = cap
        logger.info("Registered capability: %s (id: %s)", cap.name, cap.id)

    def get(self, capability_id: str) -> BaseCapability | None:
        return self._caps.get(capability_id)

    def list_all(self) -> list[dict[str, Any]]:
        return [c.to_dict() for c in self._caps.values() if c.enabled]

    def names(self) -> list[str]:
        return [c.id for c in self._caps.values() if c.enabled]
