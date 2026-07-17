from __future__ import annotations

import logging
import os
import time
from typing import Any
from urllib.parse import urlparse

import jwt
from jwt import PyJWKClient

logger = logging.getLogger(__name__)

_JWKS_CLIENTS: dict[str, tuple[float, PyJWKClient]] = {}
_JWKS_CLIENT_TTL_SECONDS = 3600
_ALLOWED_ASYMMETRIC_ALGS = {"RS256", "RS384", "RS512"}


def _jwt_verification_mode() -> str:
    return os.getenv("SUPABASE_JWT_VERIFICATION", "auto").strip().lower()


def _jwks_url(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/auth/v1/.well-known/jwks.json"


def _issuer(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/auth/v1"


def _is_valid_supabase_url(supabase_url: str) -> bool:
    if not isinstance(supabase_url, str):
        return False
    parsed = urlparse(supabase_url)
    return bool(parsed.scheme and parsed.netloc and parsed.scheme in {"http", "https"})


def _validate_jwt_header(header: dict[str, Any], mode: str) -> None:
    alg = str(header.get("alg") or "")
    kid = header.get("kid")

    if not kid or not isinstance(kid, str) or len(kid) > 128:
        if mode == "local":
            raise jwt.InvalidTokenError("JWT missing or invalid `kid`.")
        return

    if alg not in _ALLOWED_ASYMMETRIC_ALGS:
        if mode == "local":
            raise jwt.InvalidTokenError("Supabase local JWT verification requires RS256/RS384/RS512.")
        return


def _get_jwks_client(supabase_url: str) -> PyJWKClient:
    now = time.monotonic()
    cached = _JWKS_CLIENTS.get(supabase_url)
    if cached and now - cached[0] < _JWKS_CLIENT_TTL_SECONDS:
        return cached[1]
    client = PyJWKClient(_jwks_url(supabase_url))
    _JWKS_CLIENTS[supabase_url] = (now, client)
    return client


def reset_jwks_cache() -> None:
    _JWKS_CLIENTS.clear()


def verify_supabase_jwt_locally(token: str, supabase_url: str) -> dict[str, Any] | None:
    mode = _jwt_verification_mode()
    if mode == "live":
        return None
    if not supabase_url:
        return None
    if not _is_valid_supabase_url(supabase_url):
        logger.warning("Invalid Supabase URL configured for JWT verification; skipping local verification.")
        return None

    try:
        header = jwt.get_unverified_header(token)
    except jwt.PyJWTError:
        if mode == "local":
            raise
        return None
    _validate_jwt_header(header, mode)
    alg = str(header.get("alg") or "")

    try:
        signing_key = _get_jwks_client(supabase_url).get_signing_key_from_jwt(token)
        audience = os.getenv("SUPABASE_JWT_AUDIENCE", "authenticated")
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=[alg],
            audience=audience,
            issuer=_issuer(supabase_url),
            options={"require": ["exp", "sub"]},
        )
    except jwt.PyJWTError:
        if mode == "local":
            raise
        return None
    except Exception as exc:
        logger.warning("Supabase JWKS verification unavailable; falling back to live Auth verification: %s", exc)
        if mode == "local":
            raise
        return None
