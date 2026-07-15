"""CLI script to enable an optional capability module."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add backend directory to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT / "backend"))

from src.core.module import ModuleRegistry


def main() -> None:
    parser = argparse.ArgumentParser(description="Enable an optional module.")
    parser.add_argument("module", help="ID of the module to enable (e.g. agent, rag)")
    parser.add_argument("--force", action="store_true", help="Enable even if validation checks fail")
    args = parser.parse_args()

    registry = ModuleRegistry()
    manifests = registry.discover_modules()

    if args.module not in manifests:
        print(f"Error: Module '{args.module}' not found.")
        sys.exit(1)

    manifest = manifests[args.module]
    print(f"Validating requirements for '{args.module}'...")
    errors = registry.validate_module(manifest)

    if errors:
        print(f"\nValidation failed for '{args.module}':")
        for err in errors:
            print(f"  - {err}")
        
        if not args.force:
            print("\nError: Cannot enable module due to missing dependencies. Use --force to override.")
            sys.exit(1)
        else:
            print("\nWarning: Forcing enablement despite validation failures.")

    # Enable
    registry.set_enabled(args.module, True)
    print(f"\nSuccess: Module '{args.module}' has been ENABLED.")


if __name__ == "__main__":
    main()
