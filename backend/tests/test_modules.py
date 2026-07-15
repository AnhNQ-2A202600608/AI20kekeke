"""Unit tests for the pluggable Module Registry and capability dynamic loading."""

from __future__ import annotations

import json
import os
import shutil
import tempfile
from pathlib import Path

import pytest

from src.core.config import Settings
from src.core.errors import ValidationError
from src.core.module import ModuleRegistry


@pytest.fixture
def temp_modules_dir():
    """Create a temporary modules directory with dummy manifests."""
    temp_dir = Path(tempfile.mkdtemp(prefix="vaic_modules_"))

    # 1. Valid enabled module
    mod1_dir = temp_dir / "mod_valid"
    mod1_dir.mkdir()
    (mod1_dir / "module.json").write_text(
        json.dumps(
            {
                "id": "mod_valid",
                "name": "Valid Module",
                "version": "0.1.0",
                "category": "test",
                "enabled_by_default": True,
                "description": "A valid test module",
                "dependencies": [],
                "environment_variables": [],
                "backend_entrypoint": (
                    "src.modules.example_transform.capability.ExampleTransformCapability"
                ),
            }
        ),
        encoding="utf-8",
    )

    # 2. Module with missing python dependency
    mod2_dir = temp_dir / "mod_missing_dep"
    mod2_dir.mkdir()
    (mod2_dir / "module.json").write_text(
        json.dumps(
            {
                "id": "mod_missing_dep",
                "name": "Missing Dep Module",
                "version": "0.1.0",
                "category": "test",
                "enabled_by_default": False,
                "description": "Module with missing package",
                "dependencies": ["nonexistent_package_xyz"],
                "environment_variables": [],
                "backend_entrypoint": (
                    "src.modules.example_transform.capability.ExampleTransformCapability"
                ),
            }
        ),
        encoding="utf-8",
    )

    # 3. Module with missing env var
    mod3_dir = temp_dir / "mod_missing_env"
    mod3_dir.mkdir()
    (mod3_dir / "module.json").write_text(
        json.dumps(
            {
                "id": "mod_missing_env",
                "name": "Missing Env Module",
                "version": "0.1.0",
                "category": "test",
                "enabled_by_default": False,
                "description": "Module with missing environment variable",
                "dependencies": [],
                "environment_variables": ["NONEXISTENT_VAR_XYZ"],
                "backend_entrypoint": (
                    "src.modules.example_transform.capability.ExampleTransformCapability"
                ),
            }
        ),
        encoding="utf-8",
    )

    yield temp_dir
    shutil.rmtree(temp_dir)


def test_registry_load_manifest(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)
    manifests = registry.discover_modules()

    assert "mod_valid" in manifests
    assert "mod_missing_dep" in manifests
    assert manifests["mod_valid"].name == "Valid Module"
    assert manifests["mod_missing_dep"].dependencies == ["nonexistent_package_xyz"]


def test_module_disabled_by_default(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)

    # Check that initially only example_transform might be enabled by config defaults,
    # but the custom ones here default to disabled in registry config check
    assert registry.is_enabled("mod_missing_dep") is False
    assert registry.is_enabled("mod_missing_env") is False


def test_enable_disable_module(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)

    registry.set_enabled("mod_valid", True)
    assert registry.is_enabled("mod_valid") is True

    registry.set_enabled("mod_valid", False)
    assert registry.is_enabled("mod_valid") is False


def test_missing_dependency_validation(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)
    manifests = registry.discover_modules()

    errors = registry.validate_module(manifests["mod_missing_dep"])
    assert len(errors) == 1
    assert "Missing required python dependency" in errors[0]


def test_missing_environment_validation(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)
    manifests = registry.discover_modules()

    if "NONEXISTENT_VAR_XYZ" in os.environ:
        del os.environ["NONEXISTENT_VAR_XYZ"]

    errors = registry.validate_module(manifests["mod_missing_env"])
    assert len(errors) == 1
    assert "Missing required environment variable" in errors[0]


def test_load_capability_checks_dependencies(temp_modules_dir):
    config_path = temp_modules_dir / "modules_config.json"
    registry = ModuleRegistry(modules_dir=temp_modules_dir, config_path=config_path)
    manifests = registry.discover_modules()

    # Should throw ValidationError because package is missing
    with pytest.raises(ValidationError) as exc:
        registry.load_capability(manifests["mod_missing_dep"])
    assert "validation failed" in str(exc.value)


def test_active_challenge_selects_workspace_module_config(tmp_path, monkeypatch):
    challenge_dir = tmp_path / "challenge"
    challenge_dir.mkdir()
    config_path = challenge_dir / "modules_config.json"
    config_path.write_text('{"example_transform": false, "analytics": true}', encoding="utf-8")
    monkeypatch.setenv("ACTIVE_CHALLENGE", str(challenge_dir))

    settings = Settings()

    assert settings.modules_config_path == config_path.resolve()
    registry = ModuleRegistry(modules_dir=tmp_path / "modules")
    assert registry.config_path == config_path.resolve()
    assert registry.is_enabled("analytics") is True


def test_active_challenge_requires_existing_module_config(tmp_path, monkeypatch):
    missing_challenge = tmp_path / "missing-challenge"
    monkeypatch.setenv("ACTIVE_CHALLENGE", str(missing_challenge))

    with pytest.raises(ValueError, match="ACTIVE_CHALLENGE"):
        Settings().modules_config_path
