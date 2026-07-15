"""Pluggable Capability Module System.

Manages scanning, validation, dynamic loading, and enabling/disabling of
optional capability modules.
"""

from __future__ import annotations

import importlib
import json
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from src.capabilities.registry import BaseCapability
from src.core.config import get_settings
from src.core.errors import ValidationError
from src.core.logging import get_logger

logger = get_logger("core.module")


@dataclass
class ModuleManifest:
    id: str
    name: str
    version: str
    category: str
    enabled_by_default: bool
    description: str
    dependencies: list[str] = field(default_factory=list)
    environment_variables: list[str] = field(default_factory=list)
    input_types: list[str] = field(default_factory=list)
    output_types: list[str] = field(default_factory=list)
    evaluation_metrics: list[str] = field(default_factory=list)
    frontend_component: str = "DefaultForm"
    backend_entrypoint: str | None = None
    limitations: str = ""

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> ModuleManifest:
        # Filter fields matching manifest structure
        manifest_fields = {
            "id",
            "name",
            "version",
            "category",
            "enabled_by_default",
            "description",
            "dependencies",
            "environment_variables",
            "input_types",
            "output_types",
            "evaluation_metrics",
            "frontend_component",
            "backend_entrypoint",
            "limitations",
        }
        filtered = {k: v for k, v in data.items() if k in manifest_fields}
        return cls(**filtered)


class ModuleRegistry:
    """Manages discoverable optional modules and dynamic capability loading."""

    def __init__(self, modules_dir: Path | None = None, config_path: Path | None = None) -> None:
        settings = get_settings()
        # Default to backend/src/modules/
        self.modules_dir = modules_dir or Path(__file__).resolve().parent.parent / "modules"
        self.config_path = config_path or Path(__file__).resolve().parent / "modules_config.json"

        # Ensure directories exist
        self.modules_dir.mkdir(parents=True, exist_ok=True)
        self._config = self._load_config()
        self._manifests: dict[str, ModuleManifest] = {}

    def _load_config(self) -> dict[str, bool]:
        if not self.config_path.exists():
            # Initially, only example_transform is enabled, everything else is disabled by default
            default_config = {
                "example_transform": True,
                "agent": False,
                "rag": False,
                "computer_vision": False,
                "prediction": False,
                "optimization": False,
                "analytics": False,
            }
            self.config_path.write_text(json.dumps(default_config, indent=2), encoding="utf-8")
            return default_config

        try:
            return json.loads(self.config_path.read_text(encoding="utf-8"))
        except Exception as exc:
            logger.error("Failed to parse modules config, resetting to default: %s", exc)
            return {"example_transform": True}

    def save_config(self) -> None:
        self.config_path.write_text(json.dumps(self._config, indent=2), encoding="utf-8")

    def discover_modules(self) -> dict[str, ModuleManifest]:
        """Scan modules directory for module.json manifests."""
        self._manifests.clear()

        # Also support finding the sample example_transform if it's placed in capabilities for Phase 1
        # but we will move it under modules/ shortly.
        for item in self.modules_dir.iterdir():
            if item.is_dir():
                manifest_file = item / "module.json"
                if manifest_file.exists():
                    try:
                        data = json.loads(manifest_file.read_text(encoding="utf-8"))
                        manifest = ModuleManifest.from_dict(data)
                        self._manifests[manifest.id] = manifest
                    except Exception as exc:
                        logger.error("Failed to parse module manifest in %s: %s", item.name, exc)

        return self._manifests

    def is_enabled(self, module_id: str) -> bool:
        return self._config.get(module_id, False)

    def set_enabled(self, module_id: str, enabled: bool) -> None:
        self._config[module_id] = enabled
        self.save_config()

    def validate_module(self, manifest: ModuleManifest) -> list[str]:
        """Check requirements: environment variables and python package dependencies.

        Returns list of validation errors (empty if completely valid).
        """
        errors = []

        # 1. Check Python dependencies
        for dep in manifest.dependencies:
            try:
                importlib.import_module(dep)
            except ImportError:
                errors.append(f"Missing required python dependency: '{dep}'")

        # 2. Check Environment variables
        for env_var in manifest.environment_variables:
            if not os.getenv(env_var):
                errors.append(f"Missing required environment variable: '{env_var}'")

        return errors

    def load_capability(self, manifest: ModuleManifest) -> BaseCapability:
        """Dynamically load and instantiate the capability class from entrypoint."""
        if not manifest.backend_entrypoint:
            raise ValidationError(f"Module '{manifest.id}' has no backend entrypoint defined.")

        errors = self.validate_module(manifest)
        if errors:
            raise ValidationError(
                f"Module '{manifest.id}' validation failed:\n" + "\n".join(errors)
            )

        try:
            parts = manifest.backend_entrypoint.split(".")
            module_name = ".".join(parts[:-1])
            class_name = parts[-1]

            # Dynamically import module
            mod = importlib.import_module(module_name)
            cap_class = getattr(mod, class_name)

            # Instantiate capability
            cap = cap_class()
            return cap
        except Exception as exc:
            logger.error(
                "Failed to dynamically import entrypoint %s: %s", manifest.backend_entrypoint, exc
            )
            raise ValidationError(
                f"Failed to load entrypoint for module '{manifest.id}': {exc}"
            ) from exc
