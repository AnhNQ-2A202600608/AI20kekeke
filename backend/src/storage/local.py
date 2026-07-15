"""File and artifact storage service.

Manages uploads, artifacts, and run metadata on the local filesystem.
All data is stored under STORAGE_PATH (default: ./data/).
Includes security allowlists, path traversal protection, and SHA-256 checksums.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.core.config import get_settings
from src.core.errors import NotFoundError, ValidationError
from src.core.logging import get_logger

logger = get_logger("storage")

# Security Allowlist for file uploads/artifacts
ALLOWED_EXTENSIONS = {
    ".txt", ".csv", ".json", ".pdf", ".png", ".jpg", ".jpeg", ".zip", ".xlsx", ".md"
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def calculate_sha256(content: bytes) -> str:
    """Calculate SHA-256 checksum of file contents."""
    return hashlib.sha256(content).hexdigest()


def _assert_safe_path(path: Path, base_dir: Path) -> None:
    """Assert path resolved value is within base_dir to protect against path traversal."""
    try:
        # If file doesn't exist, resolve() might not trace symlinks fully,
        # but absolute path comparison handles standard traversals safely.
        resolved_path = path.absolute().resolve()
        resolved_base = base_dir.absolute().resolve()
        # Checks if resolved_path is relative to resolved_base
        resolved_path.relative_to(resolved_base)
    except (ValueError, RuntimeError) as exc:
        raise ValidationError(f"Access denied: Path traversal detected on path '{path}'") from exc


# ── Files ────────────────────────────────────────────────────────────────────


def save_upload(filename: str, content: bytes) -> dict[str, Any]:
    """Save uploaded file and return metadata with SHA-256 checksum."""
    settings = get_settings()
    file_id = str(uuid.uuid4())
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f"File extension '{ext}' is not allowed by security policy.")

    stored_name = f"{file_id}{ext}"
    dest = settings.uploads_dir / stored_name
    
    # Assert path safety
    _assert_safe_path(dest, settings.uploads_dir)
    dest.write_bytes(content)

    checksum = calculate_sha256(content)

    meta = {
        "file_id": file_id,
        "original_name": filename,
        "stored_name": stored_name,
        "size_bytes": len(content),
        "content_type": _guess_content_type(ext),
        "checksum_sha256": checksum,
        "uploaded_at": _now_iso(),
    }
    
    meta_path = settings.uploads_dir / f"{file_id}.json"
    _assert_safe_path(meta_path, settings.uploads_dir)
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    
    logger.info("Saved upload: %s → %s (%d bytes) [sha256=%s]", filename, file_id, len(content), checksum)
    return meta


def get_file_meta(file_id: str) -> dict[str, Any]:
    """Get file metadata by ID."""
    settings = get_settings()
    meta_path = settings.uploads_dir / f"{file_id}.json"
    
    # Protect against path traversal (e.g. if file_id contains "../../")
    try:
        _assert_safe_path(meta_path, settings.uploads_dir)
    except ValidationError:
        raise NotFoundError("file", file_id)

    if not meta_path.exists():
        raise NotFoundError("file", file_id)
    return json.loads(meta_path.read_text(encoding="utf-8"))


def get_file_path(file_id: str) -> Path:
    """Get the actual file path for a file ID."""
    meta = get_file_meta(file_id)
    settings = get_settings()
    path = settings.uploads_dir / meta["stored_name"]
    _assert_safe_path(path, settings.uploads_dir)
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
    
    _assert_safe_path(run_dir, settings.runs_dir)
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
    
    run_path = run_dir / "run.json"
    _assert_safe_path(run_path, settings.runs_dir)
    run_path.write_text(json.dumps(run_meta, indent=2), encoding="utf-8")
    
    logger.info("Created run: %s (capability=%s)", run_id, capability)
    return run_meta


def get_run(run_id: str) -> dict[str, Any]:
    """Get run metadata."""
    settings = get_settings()
    run_path = settings.runs_dir / run_id / "run.json"
    
    try:
        _assert_safe_path(run_path, settings.runs_dir)
    except ValidationError:
        raise NotFoundError("run", run_id)

    if not run_path.exists():
        raise NotFoundError("run", run_id)
    return json.loads(run_path.read_text(encoding="utf-8"))


def update_run(run_id: str, updates: dict[str, Any]) -> dict[str, Any]:
    """Update run metadata fields."""
    meta = get_run(run_id)
    meta.update(updates)
    settings = get_settings()
    run_path = settings.runs_dir / run_id / "run.json"
    _assert_safe_path(run_path, settings.runs_dir)
    run_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    return meta


# ── Artifacts ────────────────────────────────────────────────────────────────


def save_artifact(
    run_id: str,
    filename: str,
    content: str | bytes,
    artifact_type: str = "text",
) -> dict[str, Any]:
    """Save an artifact produced by a run with SHA-256 checksum."""
    settings = get_settings()
    artifact_id = str(uuid.uuid4())
    ext = Path(filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError(f"Artifact extension '{ext}' is not allowed by security policy.")

    stored_name = f"{artifact_id}{ext}"
    dest = settings.artifacts_dir / stored_name
    _assert_safe_path(dest, settings.artifacts_dir)

    if isinstance(content, str):
        content_bytes = content.encode("utf-8")
        dest.write_text(content, encoding="utf-8")
    else:
        content_bytes = content
        dest.write_bytes(content)

    size = len(content_bytes)
    checksum = calculate_sha256(content_bytes)

    meta = {
        "artifact_id": artifact_id,
        "run_id": run_id,
        "filename": filename,
        "stored_name": stored_name,
        "artifact_type": artifact_type,
        "size_bytes": size,
        "checksum_sha256": checksum,
        "created_at": _now_iso(),
    }
    
    meta_path = settings.artifacts_dir / f"{artifact_id}.json"
    _assert_safe_path(meta_path, settings.artifacts_dir)
    meta_path.write_text(json.dumps(meta, indent=2), encoding="utf-8")
    
    logger.info("Saved artifact: %s for run %s (%d bytes) [sha256=%s]", artifact_id, run_id, size, checksum)
    return meta


def get_artifact_meta(artifact_id: str) -> dict[str, Any]:
    """Get artifact metadata."""
    settings = get_settings()
    meta_path = settings.artifacts_dir / f"{artifact_id}.json"
    
    try:
        _assert_safe_path(meta_path, settings.artifacts_dir)
    except ValidationError:
        raise NotFoundError("artifact", artifact_id)

    if not meta_path.exists():
        raise NotFoundError("artifact", artifact_id)
    return json.loads(meta_path.read_text(encoding="utf-8"))


def get_artifact_content(artifact_id: str) -> str:
    """Read artifact content as text."""
    meta = get_artifact_meta(artifact_id)
    settings = get_settings()
    path = settings.artifacts_dir / meta["stored_name"]
    _assert_safe_path(path, settings.artifacts_dir)
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
