"""CLI script to disable an optional capability module."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT / "backend"))

from src.core.module import ModuleRegistry  # noqa: E402


def main() -> None:
    parser = argparse.ArgumentParser(description="Disable an optional module.")
    parser.add_argument("module", help="ID of the module to disable (e.g. agent, rag)")
    args = parser.parse_args()

    registry = ModuleRegistry()
    manifests = registry.discover_modules()

    if args.module not in manifests:
        print(f"Error: Module '{args.module}' not found.")
        sys.exit(1)

    registry.set_enabled(args.module, False)
    print(f"Success: Module '{args.module}' has been disabled.")


if __name__ == "__main__":
    main()
