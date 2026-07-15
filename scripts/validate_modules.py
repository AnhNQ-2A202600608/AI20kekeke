"""CLI script to validate all capability modules and environment dependencies."""

from __future__ import annotations

import sys
from pathlib import Path

# Add backend directory to sys.path
_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT / "backend"))

from src.core.module import ModuleRegistry


def main() -> None:
    registry = ModuleRegistry()
    manifests = registry.discover_modules()
    
    print("=" * 60)
    print("Validating modules configuration status...")
    print("=" * 60)
    
    invalid_enabled_modules = []

    for mod_id, manifest in sorted(manifests.items()):
        enabled = registry.is_enabled(mod_id)
        errors = registry.validate_module(manifest)
        
        status_str = "ENABLED" if enabled else "disabled"
        print(f"\nModule: {mod_id} ({status_str})")
        print(f"  Description: {manifest.description}")
        
        if manifest.dependencies:
            print(f"  Dependencies: {', '.join(manifest.dependencies)}")
        if manifest.environment_variables:
            print(f"  Environment Variables: {', '.join(manifest.environment_variables)}")

        if errors:
            print("  Status checks: FAIL")
            for err in errors:
                print(f"    - {err}")
            if enabled:
                invalid_enabled_modules.append(mod_id)
        else:
            print("  Status checks: PASS")

    print("\n" + "=" * 60)
    if invalid_enabled_modules:
        print(f"Error: The following enabled modules failed validation: {', '.join(invalid_enabled_modules)}")
        sys.exit(1)
    else:
        print("Success: All module configurations are valid.")


if __name__ == "__main__":
    main()
