"""Run and capability routes."""

from __future__ import annotations

import time
import uuid
from typing import Any

from fastapi import APIRouter, Request

from src.models.responses import error_response, success_response
from src.storage import local as storage
from src.services.run_service import execute_run

router = APIRouter(tags=["runs"])


@router.get("/capabilities")
async def list_capabilities(request: Request):
    registry = request.app.state.capability_registry
    return success_response(registry.list_all())


@router.post("/runs")
async def create_run(request: Request):
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()

    body = await request.json()
    capability = body.get("capability", "")
    parameters = body.get("parameters", {})
    input_file_ids = body.get("input_file_ids", [])

    if not capability:
        return error_response("VALIDATION_ERROR", "capability is required", request_id=request_id)

    registry = request.app.state.capability_registry
    if registry.get(capability) is None:
        return error_response(
            "NOT_FOUND",
            f"Capability '{capability}' not found",
            request_id=request_id,
        )

    run_meta = storage.create_run(capability, parameters, input_file_ids)

    # Execute synchronously for now (Phase 1 simplicity)
    run_meta = execute_run(run_meta["run_id"], registry)

    duration = (time.perf_counter() - t0) * 1000
    return success_response(run_meta, request_id=request_id, duration_ms=round(duration, 2))


@router.get("/runs/{run_id}")
async def get_run(run_id: str):
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    run_meta = storage.get_run(run_id)
    duration = (time.perf_counter() - t0) * 1000
    return success_response(run_meta, request_id=request_id, duration_ms=round(duration, 2))


@router.get("/artifacts/{artifact_id}")
async def get_artifact(artifact_id: str):
    request_id = str(uuid.uuid4())
    t0 = time.perf_counter()
    meta = storage.get_artifact_meta(artifact_id)
    content = storage.get_artifact_content(artifact_id)
    data = {**meta, "content": content}
    duration = (time.perf_counter() - t0) * 1000
    return success_response(data, request_id=request_id, duration_ms=round(duration, 2))
