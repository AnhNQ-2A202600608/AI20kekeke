"""Cross-platform lifecycle commands for the VAIC starter."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ARCHIVE = PROJECT_ROOT / "vaic-starter-submission.tar.gz"

# Những thư mục này đều là sản phẩm sinh ra khi cài/chạy/test,
# có thể xóa an toàn khi cần "làm sạch" repo trước lúc bàn giao.
_GENERATED_DIR_NAMES = {
    ".mypy_cache",
    ".next",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "__pycache__",
    "node_modules",
}


def _remove_path(path: Path) -> None:
    if path.is_dir() and not path.is_symlink():
        shutil.rmtree(path)
    elif path.exists() or path.is_symlink():
        path.unlink()


def clean_project(root: Path = PROJECT_ROOT) -> list[Path]:
    """Remove generated state while always preserving challenge workspaces."""
    root = root.resolve()
    # Chỉ dọn dependency/cache/data runtime. Phần challenges/ phải được giữ lại
    # để không làm mất bài làm của team khi reset môi trường.
    candidates = {
        root / "backend" / ".venv",
        root / "backend" / ".pytest_cache",
        root / "backend" / ".ruff_cache",
        root / "backend" / ".mypy_cache",
        root / "backend" / "data",
        root / "frontend" / "node_modules",
        root / "frontend" / ".next",
        root / "data",
    }
    candidates.update(root.rglob("__pycache__"))
    candidates.update(root.rglob("*.egg-info"))

    removed: list[Path] = []
    for path in sorted(candidates, key=lambda item: len(item.parts), reverse=True):
        if path.exists() or path.is_symlink():
            _remove_path(path)
            removed.append(path)
    return removed


def _is_excluded(relative_path: Path, output_relative: Path | None) -> bool:
    # Khi đóng gói submission, ưu tiên loại bỏ secret, VCS và dữ liệu sinh ra
    # để archive gọn, sạch và không rò rỉ môi trường local.
    parts = relative_path.parts
    if not parts:
        return False
    if parts[0] == ".git" or any(part in _GENERATED_DIR_NAMES for part in parts):
        return True
    if parts[0] == "data" or parts[:2] == ("backend", "data"):
        return True
    if relative_path.name == ".env" or relative_path.name == ".env.local":
        return True
    if relative_path.name.startswith(".env.") and relative_path.name.endswith(".local"):
        return True
    return output_relative is not None and relative_path == output_relative


def package_project(root: Path = PROJECT_ROOT, output: Path = DEFAULT_ARCHIVE) -> Path:
    """Create a clean archive that includes challenge source and documentation."""
    root = root.resolve()
    output = output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    output_relative = output.relative_to(root) if output.is_relative_to(root) else None

    with tarfile.open(output, "w:gz") as archive:
        for path in sorted(root.rglob("*")):
            relative = path.relative_to(root)
            if _is_excluded(relative, output_relative):
                continue
            archive.add(path, arcname=relative.as_posix(), recursive=False)
    return output


def _venv_python(root: Path = PROJECT_ROOT) -> Path:
    if os.name == "nt":
        return root / "backend" / ".venv" / "Scripts" / "python.exe"
    return root / "backend" / ".venv" / "bin" / "python"


def _run(command: list[str], cwd: Path = PROJECT_ROOT) -> None:
    # Dùng shutil.which để tương thích Windows/Linux/macOS
    # (ví dụ npm trên Windows thực tế là npm.cmd).
    executable = shutil.which(command[0])
    if executable is None:
        raise FileNotFoundError(f"Required executable '{command[0]}' was not found on PATH.")
    subprocess.run([executable, *command[1:]], cwd=cwd, check=True)


def bootstrap(root: Path = PROJECT_ROOT) -> None:
    # Tạo file env local từ mẫu để teammate clone repo về có thể chạy ngay
    # mà không cần tự nhớ phải copy những file nào.
    env_pairs = [
        (root / ".env.example", root / ".env"),
        (root / "frontend" / ".env.example", root / "frontend" / ".env.local"),
    ]
    for source, destination in env_pairs:
        if source.exists() and not destination.exists():
            shutil.copyfile(source, destination)
            print(f"Created {destination.relative_to(root)}")

    python_path = _venv_python(root)
    if not python_path.exists():
        _run([sys.executable, "-m", "venv", str(root / "backend" / ".venv")], root)


def _python(root: Path = PROJECT_ROOT) -> str:
    python_path = _venv_python(root)
    return str(python_path) if python_path.exists() else sys.executable


def run_command(command: str, root: Path = PROJECT_ROOT) -> None:
    python = _python(root)
    backend = root / "backend"
    frontend = root / "frontend"

    if command == "bootstrap":
        bootstrap(root)
    elif command == "install":
        # Install được gom về một lệnh để onboarding nhanh:
        # chuẩn bị env, cài backend và frontend theo đúng repo hiện tại.
        bootstrap(root)
        python = _python(root)
        _run([python, "-m", "pip", "install", "--upgrade", "pip"], root)
        _run([python, "-m", "pip", "install", "-e", ".[dev]"], backend)
        _run(["npm", "ci"], frontend)
    elif command == "dev":
        print("Run dev-backend and dev-frontend in separate terminals.")
    elif command == "dev-backend":
        _run(
            [
                python,
                "-m",
                "uvicorn",
                "src.api.main:create_app",
                "--reload",
                "--host",
                "0.0.0.0",
                "--port",
                "8000",
                "--factory",
            ],
            backend,
        )
    elif command == "dev-frontend":
        _run(["npm", "run", "dev"], frontend)
    elif command == "docker-up":
        # Chạy full stack bằng Docker khi muốn mô phỏng môi trường bàn giao/demo.
        _run(["docker", "compose", "up", "--build", "-d"], root)
    elif command == "docker-down":
        _run(["docker", "compose", "down"], root)
    elif command == "lint":
        _run([python, "-m", "ruff", "check", "src", "tests", "../scripts"], backend)
        _run(["npm", "run", "lint"], frontend)
    elif command == "format":
        _run([python, "-m", "ruff", "format", "src", "tests", "../scripts"], backend)
    elif command == "typecheck":
        _run(["npm", "run", "typecheck"], frontend)
    elif command in {"test", "test-backend"}:
        _run([python, "-m", "pytest", "tests", "-v"], backend)
    elif command == "smoke":
        _run([python, "-m", "pytest", "tests/test_smoke.py", "-v"], backend)
    elif command == "eval":
        eval_code = (
            "from src.core.evaluation import EvaluationRunner; import json; "
            "from pathlib import Path; runner = EvaluationRunner(); "
            "runs = list(Path('data/runs').glob('**/run.json')); "
            "records = [json.loads(p.read_text(encoding='utf-8')) for p in runs]; "
            "report = runner.generate_report(records); "
            "runner.write_reports(report, Path('data/evals')); "
            "print('Evaluation report written under data/evals/')"
        )
        _run([python, "-c", eval_code], backend)
    elif command == "validate":
        # Validate tách riêng để team có thể kiểm tra module optional trước demo.
        _run([python, "scripts/validate_modules.py"], root)
    elif command == "clean":
        removed = clean_project(root)
        print(f"Removed {len(removed)} generated paths; challenges/ was preserved.")
    elif command == "package":
        archive = package_project(root, DEFAULT_ARCHIVE)
        print(f"Created {archive}")
    else:
        raise ValueError(f"Unknown command: {command}")


def main() -> None:
    commands = [
        "bootstrap",
        "install",
        "dev",
        "dev-backend",
        "dev-frontend",
        "docker-up",
        "docker-down",
        "lint",
        "format",
        "typecheck",
        "test",
        "test-backend",
        "smoke",
        "eval",
        "validate",
        "clean",
        "package",
    ]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=commands)
    args = parser.parse_args()
    run_command(args.command)


if __name__ == "__main__":
    main()
