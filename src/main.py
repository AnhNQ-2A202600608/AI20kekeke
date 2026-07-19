import logging
import time
from contextlib import asynccontextmanager
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.middleware import SlowAPIMiddleware
from slowapi.errors import RateLimitExceeded

from src.config import get_settings
from src.api.rate_limit import limiter
from src.services.braintrust_observability import configure_braintrust_observability

configure_braintrust_observability()

from src.api.routes import router  # noqa: E402


def configure_logging() -> None:
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("httpcore").setLevel(logging.WARNING)


configure_logging()
request_logger = logging.getLogger("api.request")


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logging.getLogger("main").info(
        "Starting %s in %s mode (log_level=%s)",
        settings.app_name,
        settings.app_env,
        settings.log_level,
    )
    yield
    logging.getLogger("main").info("Shutting down...")


app = FastAPI(
    title="AI20K Agent",
    description="AI Agent built with LangGraph",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter

# SlowAPIMiddleware
app.add_middleware(SlowAPIMiddleware)

# Custom middleware to parse email body for login rate limiting
@app.middleware("http")
async def parse_body_for_rate_limit(request: Request, call_next):
    if request.url.path.endswith("/login") and request.method == "POST":
        try:
            body = await request.json()
            if isinstance(body, dict):
                request.state.login_email = body.get("email", "").strip().lower()
        except Exception:
            pass
    return await call_next(request)

@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    retry_after = 60
    view_rate_limit = getattr(request.state, "view_rate_limit", None)
    if view_rate_limit:
        try:
            limiter_instance = request.app.state.limiter
            window_stats = limiter_instance.limiter.get_window_stats(
                view_rate_limit[0], *view_rate_limit[1]
            )
            reset_in = 1 + window_stats[0]
            retry_after = max(0, int(reset_in - time.time()))
        except Exception:
            pass

    response = JSONResponse(
        status_code=429,
        content={"detail": f"Too Many Requests: {exc.detail}"},
        headers={"Retry-After": str(retry_after)}
    )
    try:
        limiter_instance = request.app.state.limiter
        response = limiter_instance._inject_headers(response, view_rate_limit)
    except Exception:
        pass
    return response

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.cors_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api/v1")


logger = logging.getLogger("main")


def sanitize_validation_errors(errors):
    sanitized = []
    for error in errors:
        if isinstance(error, dict):
            sanitized.append(
                {
                    key: value
                    for key, value in error.items()
                    if key not in {"input", "ctx"} and not key.endswith("_input")
                }
            )
        else:
            sanitized.append(error)
    return sanitized


@app.middleware("http")
async def log_dev_requests(request: Request, call_next):
    if settings.app_env != "development":
        return await call_next(request)

    request_id = request.headers.get("x-request-id") or uuid4().hex[:12]
    start = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        response.headers["x-request-id"] = request_id
        return response
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        request_logger.info(
            "REQ %s %s -> %s %.0fms rid=%s",
            request.method,
            request.url.path,
            status_code,
            elapsed_ms,
            request_id,
        )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    errors = sanitize_validation_errors(exc.errors())
    logger.error(
        "Validation error for %s %s: %s field error(s)",
        request.method,
        request.url.path,
        len(errors),
    )
    logger.error("Validation error fields: %s", [error.get("loc") for error in errors if isinstance(error, dict)])
    return JSONResponse(status_code=422, content={"detail": errors})


@app.get("/health")
async def health():
    # Trigger reload comment
    return {"status": "ok", "env": settings.app_env}


@app.get("/ready")
async def ready():
    from src.api.adaptive_routes import get_adaptive_db
    from src.services.cache import get_cache_store

    db_status = "ok"
    cache_status = "ok"

    # Check Database
    try:
        db = get_adaptive_db()
        if db._stub_mode:
            db_status = "stub"
        else:
            # Ping Supabase to verify connection
            db.app_client.table("concepts").select("id").limit(1).execute()
    except Exception as e:
        logger.error("Readiness database check failed: %s", e, exc_info=True)
        db_status = "error"

    # Check Cache
    try:
        cache_store = get_cache_store()
        if hasattr(cache_store, "client") and cache_store.client is not None:
            cache_store.client.ping()
        else:
            cache_status = "in_memory"
    except Exception as e:
        logger.error("Readiness cache check failed: %s", e, exc_info=True)
        cache_status = "error"

    if db_status == "error" or cache_status == "error":
        return JSONResponse(
            content={"status": "unavailable", "database": db_status, "cache": cache_status, "env": settings.app_env},
            status_code=503,
        )

    return {"status": "ready", "database": db_status, "cache": cache_status, "env": settings.app_env}
