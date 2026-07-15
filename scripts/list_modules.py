"""CLI script to list all optional modules and their enablement status."""

from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT / "backend"))

from src.core.module import ModuleRegistry  # noqa: E402


def main() -> None:
    registry = ModuleRegistry()
    manifests = registry.discover_modules()

    print("=" * 60)
    print(f"{'Module ID':<20} | {'Status':<10} | {'Category':<15}")
    print("-" * 60)

    for mod_id in sorted(manifests.keys()):
        manifest = manifests[mod_id]
        status = "ENABLED" if registry.is_enabled(mod_id) else "disabled"
        print(f"{mod_id:<20} | {status:<10} | {manifest.category:<15}")

    print("=" * 60)


if __name__ == "__main__":
    main()
