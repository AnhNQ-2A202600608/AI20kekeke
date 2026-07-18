from __future__ import annotations

import base64
import json
import logging
import os
from dataclasses import dataclass

logger = logging.getLogger(__name__)
_warned_deprecated_supabase_key = False


@dataclass(frozen=True)
class SupabaseBackendConfig:
    url: str
    secret_key: str
    key_source: str
    is_stub: bool = False


def _decode_jwt_payload_unverified(token: str) -> dict:
    try:
        payload_b64 = token.split(".")[1]
        payload_b64 += "=" * ((4 - len(payload_b64) % 4) % 4)
        return json.loads(base64.urlsafe_b64decode(payload_b64.encode("utf-8")).decode("utf-8"))
    except Exception:
        return {}


def classify_supabase_key(key: str) -> str:
    stripped = key.strip()
    if not stripped:
        return "missing"
    if stripped.startswith("sb_secret_"):
        return "secret"
    if stripped.startswith("sb_publishable_"):
        return "publishable"
    if stripped.count(".") == 2:
        role = _decode_jwt_payload_unverified(stripped).get("role")
        if role == "service_role":
            return "legacy_service_role"
        if role == "anon":
            return "legacy_anon"
        return "legacy_jwt"
    return "unknown"


def is_public_supabase_key(key: str) -> bool:
    return classify_supabase_key(key) in {"publishable", "legacy_anon"}


def get_backend_supabase_config(*, allow_stub: bool = True) -> SupabaseBackendConfig:
    global _warned_deprecated_supabase_key

    url = (
        os.environ.get("SUPABASE_URL")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL_DEV")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_URL_PROD")
        or ""
    ).strip()

    secret_key = (os.environ.get("SUPABASE_SECRET_KEY") or "").strip()
    key_source = "SUPABASE_SECRET_KEY"
    if not secret_key:
        secret_key = (os.environ.get("SUPABASE_KEY") or "").strip()
        key_source = "SUPABASE_KEY"
        if secret_key and not _warned_deprecated_supabase_key:
            logger.warning("SUPABASE_KEY is deprecated for backend Supabase access; use SUPABASE_SECRET_KEY.")
            _warned_deprecated_supabase_key = True

    if not url or not secret_key:
        app_env = os.environ.get("APP_ENV", "").strip().lower()
        if app_env == "production":
            raise RuntimeError(
                "Production backend requires SUPABASE_URL and SUPABASE_SECRET_KEY; stub mode is disabled."
            )
        if allow_stub:
            logger.warning("SUPABASE_URL or SUPABASE_SECRET_KEY is not configured; using Supabase stub mode.")
            return SupabaseBackendConfig(url=url, secret_key="", key_source=key_source, is_stub=True)
        raise RuntimeError("Backend requires SUPABASE_URL and SUPABASE_SECRET_KEY.")

    key_kind = classify_supabase_key(secret_key)
    if key_kind in {"publishable", "legacy_anon"}:
        logger.warning(
            f"{key_source} is a public Supabase {key_kind} key, but using it as fallback for local testing."
        )
    elif key_kind == "unknown":
        logger.warning("%s has an unrecognized Supabase key shape; treating it as server-only.", key_source)
    if key_kind == "legacy_service_role":
        logger.warning(
            "%s is a legacy service_role JWT; migrate to SUPABASE_SECRET_KEY with sb_secret_ prefix.", key_source
        )

    return SupabaseBackendConfig(url=url, secret_key=secret_key, key_source=key_source, is_stub=False)
