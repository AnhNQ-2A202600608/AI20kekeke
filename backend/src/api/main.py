"""FastAPI application entry point."""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.api import health, files, runs
from src.capabilities.registry import CapabilityRegistry
from src.capabilities.example_transform import ExampleTransformCapability
from src.core.config import get_settings
from src.core.errors import AppError
from src.core.logging import setup_logging
from src.models.responses import error_response


def create_app() -> FastAPI:
    settings = get_settings()
    logger = setup_logging(settings.log_level)

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_origin],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Capability registry
    registry = CapabilityRegistry()
    registry.register(ExampleTransformCapability())
    app.state.capability_registry = registry

    # Routes
    app.include_router(health.router, prefix="/api/v1")
    app.include_router(files.router, prefix="/api/v1")
    app.include_router(runs.router, prefix="/api/v1")

    # Global error handler
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc.code, exc.message, exc.retryable, exc.details),
        )

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        logger.error("Unhandled error: %s", exc, exc_info=True)
        return JSONResponse(
            status_code=500,
            content=error_response("INTERNAL_ERROR", "An unexpected error occurred"),
        )

    logger.info(
        "App started: %s (env=%s, debug=%s)", settings.app_name, settings.app_env, settings.debug
    )
    return app


app = create_app()
