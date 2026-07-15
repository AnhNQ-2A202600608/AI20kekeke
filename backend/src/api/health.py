"""Health and readiness routes."""

from __future__ import annotations

from fastapi import APIRouter

from src.models.responses import success_response

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    return success_response({"status": "healthy"})


@router.get("/ready")
async def ready():
    return success_response({"status": "ready"})
