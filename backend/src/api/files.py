"""File upload and retrieval routes."""

from __future__ import annotations

import time
import uuid

from fastapi import APIRouter, UploadFile, File

from src.core.config import get_settings
from src.core.errors import ValidationError
from src.models.responses import error_response, success_response
from src.storage import local as storage

router = APIRouter(tags=["files"])


@router.post("/files")
async def upload_file(file: UploadFile = File(...)):
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()

    if not file.filename:
        return error_response("VALIDATION_ERROR", "Filename is required", request_id=request_id)

    content = await file.read()
    settings = get_settings()

    if len(content) > settings.max_upload_bytes:
        return error_response(
            "VALIDATION_ERROR",
            f"File exceeds {settings.max_upload_size_mb}MB limit",
            request_id=request_id,
        )

    meta = storage.save_upload(file.filename, content)
    duration = (time.perf_counter() - t0) * 1000
    return success_response(meta, request_id=request_id, duration_ms=round(duration, 2))


@router.get("/files/{file_id}")
async def get_file(file_id: str):
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    meta = storage.get_file_meta(file_id)
    duration = (time.perf_counter() - t0) * 1000
    return success_response(meta, request_id=request_id, duration_ms=round(duration, 2))
