"""Run execution service — orchestrates capability runs."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from src.capabilities.registry import CapabilityRegistry
from src.core.errors import CapabilityError, NotFoundError
from src.core.logging import get_logger
from src.storage import local as storage

logger = get_logger("services.run")


def execute_run(run_id: str, registry: CapabilityRegistry) -> dict[str, Any]:
    """Execute a pending run synchronously and return updated run metadata.

    Steps:
      1. Load run metadata.
      2. Look up the capability.
      3. Execute it.
      4. Save artifacts.
      5. Update run status.
    """
    run = storage.get_run(run_id)

    if run["status"] != "pending":
        raise CapabilityError(run["capability"], f"Run is already '{run['status']}'")

    cap_name = run["capability"]
    cap = registry.get(cap_name)
    if cap is None:
        storage.update_run(run_id, {
            "status": "failed",
            "error": f"Unknown capability: {cap_name}",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
        raise NotFoundError("capability", cap_name)

    # Mark as running
    storage.update_run(run_id, {
        "status": "running",
        "started_at": datetime.now(timezone.utc).isoformat(),
    })

    try:
        result = cap.execute(
            parameters=run.get("parameters", {}),
            input_file_ids=run.get("input_file_ids", []),
        )
    except Exception as exc:
        logger.error("Capability '%s' raised: %s", cap_name, exc)
        return storage.update_run(run_id, {
            "status": "failed",
            "error": str(exc),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })

    if not result.success:
        return storage.update_run(run_id, {
            "status": "failed",
            "error": result.error,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })

    # Save artifacts
    artifact_ids = []
    for art in result.artifacts or []:
        meta = storage.save_artifact(
            run_id=run_id,
            filename=art["filename"],
            content=art["content"],
            artifact_type=art.get("type", "text"),
        )
        artifact_ids.append(meta["artifact_id"])

    return storage.update_run(run_id, {
        "status": "completed",
        "artifact_ids": artifact_ids,
        "completed_at": datetime.now(timezone.utc).isoformat(),
    })
