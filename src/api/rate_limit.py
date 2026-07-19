import logging
import os
from collections.abc import Callable
from typing import Any

from fastapi import Request
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from src.config import get_settings

logger = logging.getLogger("api.rate_limit")

# Module level flag to prevent log spam when Redis is down
_redis_warning_logged = False

def get_limiter_key(request: Request) -> str:
    """Default key generator for limiter: JWT sub if logged in, fallback to IP."""
    user = getattr(request.state, "user", None)
    if user and hasattr(user, "id"):
        return str(user.id)

    # Fallback to authorization header parse to get sub if state.user is not set yet
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        if token.startswith("fake-jwt-token-"):
            return token.replace("fake-jwt-token-", "")
        # If it's a JWT
        if "." in token:
            try:
                import base64
                import json
                payload_b64 = token.split(".")[1]
                payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
                payload_json = json.loads(base64.b64decode(payload_b64).decode("utf-8"))
                uid = payload_json.get("sub") or payload_json.get("id")
                if uid:
                    return str(uid)
            except Exception:
                pass
        else:
            # Maybe it's a raw UUID (dev token)
            try:
                from uuid import UUID
                UUID(token)
                return token
            except ValueError:
                pass

    return get_remote_address(request)

def get_login_key(request: Request) -> str:
    """Key for /auth/login: IP + email from body, fallback to IP."""
    ip = get_remote_address(request)
    email = getattr(request.state, "login_email", "")
    if email:
        return f"{ip}:{email}"
    return ip

class FailOpenLimiter(Limiter):
    @property
    def enabled(self) -> bool:
        # Dynamic check so monkeypatch in tests works
        return os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "true"

    @enabled.setter
    def enabled(self, value):
        pass

    def _check_request_limit(self, request: Request, endpoint_func: Callable[..., Any] | None, in_middleware: bool = True) -> None:
        global _redis_warning_logged
        if not hasattr(request.state, "view_rate_limit"):
            request.state.view_rate_limit = None
        try:
            return super()._check_request_limit(request, endpoint_func, in_middleware)
        except Exception as exc:
            if isinstance(exc, RateLimitExceeded):
                raise
            if not _redis_warning_logged:
                logger.warning(f"Rate limit storage unreachable (Error: {exc}). Failing open.")
                _redis_warning_logged = True
            return None  # Fail-open: allow request

# Construct Limiter
settings = get_settings()

# Force memory storage in test env or when explicitly disabled to avoid connecting to redis
if settings.app_env == "test" or os.getenv("RATE_LIMIT_ENABLED", "true").lower() == "false":
    storage_uri = "memory://"
elif settings.cache_type == "redis" and settings.redis_url:
    storage_uri = settings.redis_url
else:
    storage_uri = "memory://"

limiter = FailOpenLimiter(
    key_func=get_limiter_key,
    storage_uri=storage_uri,
    default_limits=[settings.rate_limit_default],
    swallow_errors=True
)

# Intercept and wrap internal limits strategies to fail-open
if hasattr(limiter, "_limiter") and limiter._limiter:
    original_hit = limiter._limiter.hit
    original_test = limiter._limiter.test

    def safe_hit(*args, **kwargs):
        global _redis_warning_logged
        try:
            return original_hit(*args, **kwargs)
        except Exception as exc:
            if not _redis_warning_logged:
                logger.warning(f"Rate limit storage unreachable (Redis error: {exc}). Failing open.")
                _redis_warning_logged = True
            return True  # Fail-open

    def safe_test(*args, **kwargs):
        global _redis_warning_logged
        try:
            return original_test(*args, **kwargs)
        except Exception as exc:
            if not _redis_warning_logged:
                logger.warning(f"Rate limit storage unreachable (Redis error: {exc}). Failing open.")
                _redis_warning_logged = True
            return True  # Fail-open

    limiter._limiter.hit = safe_hit
    limiter._limiter.test = safe_test
