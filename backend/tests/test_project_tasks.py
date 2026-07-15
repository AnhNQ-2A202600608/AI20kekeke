"""Regression tests for safe, cross-platform project lifecycle tasks."""

from __future__ import annotations

import importlib.util
import tarfile
from pathlib import Path
from types import ModuleType

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[2]
TASKS_SCRIPT = PROJECT_ROOT / "scripts" / "project_tasks.py"


def load_project_tasks() -> ModuleType:
    if not TASKS_SCRIPT.exists():
        pytest.fail("scripts/project_tasks.py has not been implemented")

    spec = importlib.util.spec_from_file_location("project_tasks", TASKS_SCRIPT)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_clean_preserves_challenge_work(tmp_path: Path) -> None:
    tasks = load_project_tasks()
    solution = tmp_path / "challenges" / "sample" / "solution.py"
    solution.parent.mkdir(parents=True)
    solution.write_text("print('keep me')", encoding="utf-8")

    generated_paths = [
        tmp_path / "backend" / ".pytest_cache" / "state",
        tmp_path / "backend" / "src" / "__pycache__" / "module.pyc",
        tmp_path / "frontend" / ".next" / "build.json",
        tmp_path / "data" / "runs" / "run.json",
    ]
    for path in generated_paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("generated", encoding="utf-8")

    tasks.clean_project(tmp_path)

    assert solution.exists()
    assert not (tmp_path / "backend" / ".pytest_cache").exists()
    assert not (tmp_path / "backend" / "src" / "__pycache__").exists()
    assert not (tmp_path / "frontend" / ".next").exists()
    assert not (tmp_path / "data").exists()


def test_package_includes_challenges_and_excludes_generated_content(tmp_path: Path) -> None:
    tasks = load_project_tasks()
    keep_files = [
        tmp_path / "README.md",
        tmp_path / "backend" / "src" / "main.py",
        tmp_path / "challenges" / "sample" / "solution.py",
    ]
    for path in keep_files:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("keep", encoding="utf-8")

    excluded_files = [
        tmp_path / ".env",
        tmp_path / ".git" / "config",
        tmp_path / "frontend" / "node_modules" / "pkg" / "index.js",
        tmp_path / "backend" / ".pytest_cache" / "state",
        tmp_path / "backend" / "src" / "__pycache__" / "main.pyc",
        tmp_path / "data" / "runs" / "run.json",
    ]
    for path in excluded_files:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("exclude", encoding="utf-8")

    archive = tmp_path / "submission.tar.gz"
    tasks.package_project(tmp_path, archive)

    with tarfile.open(archive, "r:gz") as package:
        names = set(package.getnames())

    assert "challenges/sample/solution.py" in names
    assert "backend/src/main.py" in names
    assert ".env" not in names
    assert not any("node_modules" in name for name in names)
    assert not any("__pycache__" in name for name in names)
    assert not any(".pytest_cache" in name for name in names)
    assert not any(name.startswith(".git/") for name in names)
    assert "submission.tar.gz" not in names


def test_run_resolves_platform_specific_executable(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    tasks = load_project_tasks()
    calls: list[list[str]] = []

    monkeypatch.setattr(tasks.shutil, "which", lambda executable: f"resolved/{executable}.cmd")
    monkeypatch.setattr(
        tasks.subprocess,
        "run",
        lambda command, cwd, check: calls.append(command),
    )

    tasks._run(["npx", "tsc", "--noEmit"], tmp_path)

    assert calls == [["resolved/npx.cmd", "tsc", "--noEmit"]]
