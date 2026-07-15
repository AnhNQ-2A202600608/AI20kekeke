"""File and artifact storage service.

Manages uploads, artifacts, and run metadata on the local filesystem.
All data is stored under STORAGE_PATH (default: ./data/).
"""

from __future__ import annotations

import json
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.core.config import get_settings
from src.core.errors import NotFoundError
from src.core.logging import get_logger

logger = get_logger("storage")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Files ────────────────────────────────────────────────────────────────────


def save_upload(filename: str, content: bytes) -> dict[str, Any]:
    """Save uploaded file and return metadata."""
    settings = get_settings()
    file_id = str(uuid.uuid4())
    ext = Path(filename).suffix
    stored_name = f"{file_id}{ext}"
    dest = settings.uploads_dir / stored_name
    dest.write_bytes(content)

    meta = {
        "file_id": file_id,
        "original_name": filename,
        "stored_name": stored_name,
        "size_bytes": len(content),
        "content_type": _guess_content_type(ext),
        "uploaded_at": _now_iso(),
    }
    (settings.uploads_dir / f"{file_id}.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )
    logger.info("Saved upload: %s → %s (%d bytes)", filename, file_id, len(content))
    return meta


def get_file_meta(file_id: str) -> dict[str, Any]:
    """Get file metadata by ID."""
    settings = get_settings()
    meta_path = settings.uploads_dir / f"{file_id}.json"
    if not meta_path.exists():
        raise NotFoundError("file", file_id)
    return json.loads(meta_path.read_text(encoding="utf-8"))


def get_file_path(file_id: str) -> Path:
    """Get the actual file path for a file ID."""
    meta = get_file_meta(file_id)
    settings = get_settings()
    path = settings.uploads_dir / meta["stored_name"]
    if not path.exists():
        raise NotFoundError("file", file_id)
    return path


# ── Runs ─────────────────────────────────────────────────────────────────────


def create_run(
    capability: str,
    parameters: dict[str, Any],
    input_file_ids: list[str] | None = None,
) -> dict[str, Any]:
    """Create a new run record."""
    settings = get_settings()
    run_id = str(uuid.uuid4())
    run_dir = settings.runs_dir / run_id
    run_dir.mkdir(parents=True, exist_ok=True)

    run_meta = {
        "run_id": run_id,
        "capability": capability,
        "parameters": parameters,
        "input_file_ids": input_file_ids or [],
        "status": "pending",
        "created_at": _now_iso(),
        "started_at": None,
        "completed_at": None,
        "artifact_ids": [],
        "error": None,
    }
    (run_dir / "run.json").write_text(json.dumps(run_meta, indent=2), encoding="utf-8")
    logger.info("Created run: %s (capability=%s)", run_id, capability)
    return run_meta


def get_run(run_id: str) -> dict[str, Any]:
    """Get run metadata."""
    settings = get_settings()
    run_path = settings.runs_dir / run_id / "run.json"
    if not run_path.exists():
        raise NotFoundError("run", run_id)
    return json.loads(run_path.read_text(encoding="utf-8"))


def update_run(run_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update run metadata fields."""
    meta = get_run(run_id)
    meta.update(updates)
    settings = get_settings()
    run_path = settings.runs_dir / run_id / "run.json"
    run_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


# ── Artifacts ────────────────────────────────────────────────────────────────


def save_artifact(
    run_id: str,
    filename: str,
    content: str | bytes,
    artifact_type: str = "text",
) -> dict[str, Any]:
    """Save an artifact produced by a run."""
    settings = get_settings()
    artifact_id = str(uuid.uuid4())
    ext = Path(filename).suffix
    stored_name = f"{artifact_id}{ext}"
    dest = settings.artifacts_dir / stored_name

    if isinstance(content, str):
        dest.write_text(content, encoding="utf-8")
        size = len(content.encode("utf-8"))
    else:
        dest.write_bytes(content)
        size = len(content)

    meta = {
        "artifact_id": artifact_id,
        "run_id": run_id,
        "filename": filename,
        "stored_name": stored_name,
        "artifact_type": artifact_type,
        "size_bytes": size,
        "created_at": _now_iso(),
    }
    (settings.artifacts_dir / f"{artifact_id}.json").write_text(
        json.dumps(meta, indent=2), encoding="utf-8"
    )
    logger.info("Saved artifact: %s for run %s (%d bytes)", artifact_id, run_id, size)
    return meta


def get_artifact_meta(artifact_id: str) -> dict[str, Any]:
    """Get artifact metadata."""
    settings = get_settings()
    meta_path = settings.artifacts_dir / f"{artifact_id}.json"
    if not meta_path.exists():
        raise NotFoundError("artifact", artifact_id)
    return json.loads(meta_path.read_text(encoding="utf-8"))


def get_artifact_content(artifact_id: str) -> str:
    """Read artifact content as text."""
    meta = get_artifact_meta(artifact_id)
    settings = get_settings()
    path = settings.artifacts_dir / meta["stored_name"]
    if not path.exists():
        raise NotFoundError("artifact", artifact_id)
    return path.read_text(encoding="utf-8")


# ── Helpers ──────────────────────────────────────────────────────────────────


def _guess_content_type(ext: str) -> str:
    mapping = {
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".json": "application/json",
        ".pdf": "application/pdf",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
    }
    return mapping.get(ext.lower(), "application/octet-stream")
