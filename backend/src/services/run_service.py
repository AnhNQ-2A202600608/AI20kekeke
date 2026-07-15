import time
from datetime import datetime, timezone
from typing import Any

from src.capabilities.registry import CapabilityRegistry
from src.core.errors import NotFoundError, ValidationError
from src.core.logging import get_logger
from src.core.run_manager import RunState, RunStateManger
from src.storage import local as storage

logger = get_logger("services.run")


def execute_run(run_id: str, registry: CapabilityRegistry) -> dict[str, Any]:
    """Execute a pending run synchronously and return updated run metadata.

    Steps:
      1. Load run metadata.
      2. Validate transition to running.
      3. Look up the capability.
      4. Execute capability.
      5. Save artifacts.
      6. Validate transition to terminal state (completed/failed).
      7. Print structured audit log.
    """
    run = storage.get_run(run_id)

    # Initial state map
    current_status: RunState = "queued" if run["status"] == "pending" else run["status"]
    RunStateManger.validate_transition(current_status, "running")

    cap_name = run["capability"]
    cap = registry.get(cap_name)
    if cap is None:
        RunStateManger.validate_transition("running", "failed")
        updated = storage.update_run(
            run_id,
            {
                "status": "failed",
                "error": f"Unknown capability: {cap_name}",
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        logger.info(
            "AUDIT LOG: Run ID: %s | Capability: %s | Input Artifacts: %s "
            "| Output Artifacts: [] | Status: failed | Duration: 0.00ms "
            "| Error: Unknown capability",
            run_id,
            cap_name,
            run.get("input_file_ids", []),
        )
        raise NotFoundError("capability", cap_name)

    # Mark as running
    t0 = time.perf_counter()
    storage.update_run(
        run_id,
        {
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    try:
        # Validate dynamic capability inputs first
        validation_errors = cap.validate_input(run.get("parameters", {}))
        if validation_errors:
            raise ValidationError(f"Parameters validation failed: {', '.join(validation_errors)}")

        result = cap.execute(
            parameters=run.get("parameters", {}),
            input_file_ids=run.get("input_file_ids", []),
        )
    except Exception as exc:
        duration_ms = (time.perf_counter() - t0) * 1000.0
        logger.error("Capability '%s' raised: %s", cap_name, exc)
        RunStateManger.validate_transition("running", "failed")
        updated = storage.update_run(
            run_id,
            {
                "status": "failed",
                "error": str(exc),
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        logger.info(
            "AUDIT LOG: Run ID: %s | Capability: %s | Input Artifacts: %s "
            "| Output Artifacts: [] | Status: failed | Duration: %.2fms | Error: %s",
            run_id,
            cap_name,
            run.get("input_file_ids", []),
            duration_ms,
            exc,
        )
        return updated

    duration_ms = (time.perf_counter() - t0) * 1000.0

    if not result.success:
        RunStateManger.validate_transition("running", "failed")
        updated = storage.update_run(
            run_id,
            {
                "status": "failed",
                "error": result.error,
                "completed_at": datetime.now(timezone.utc).isoformat(),
            },
        )
        logger.info(
            "AUDIT LOG: Run ID: %s | Capability: %s | Input Artifacts: %s "
            "| Output Artifacts: [] | Status: failed | Duration: %.2fms | Error: %s",
            run_id,
            cap_name,
            run.get("input_file_ids", []),
            duration_ms,
            result.error,
        )
        return updated

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

    RunStateManger.validate_transition("running", "completed")
    updated = storage.update_run(
        run_id,
        {
            "status": "completed",
            "artifact_ids": artifact_ids,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        },
    )

    logger.info(
        "AUDIT LOG: Run ID: %s | Capability: %s | Input Artifacts: %s "
        "| Output Artifacts: %s | Status: completed | Duration: %.2fms | Error: None",
        run_id,
        cap_name,
        run.get("input_file_ids", []),
        artifact_ids,
        duration_ms,
    )
    return updated
