import base64
import json

import pytest

from src.api.adaptive_routes import get_adaptive_db, reset_adaptive_db_cache
from src.services.supabase_config import classify_supabase_key, get_backend_supabase_config, is_public_supabase_key


def _legacy_key(role: str) -> str:
    def part(payload: dict) -> str:
        raw = json.dumps(payload, separators=(",", ":")).encode("utf-8")
        return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")

    return f"{part({'alg': 'HS256', 'typ': 'JWT'})}.{part({'role': role})}.signature"


def test_classifies_new_and_legacy_supabase_keys():
    assert classify_supabase_key("sb_secret_example") == "secret"
    assert classify_supabase_key("sb_publishable_example") == "publishable"
    assert classify_supabase_key(_legacy_key("service_role")) == "legacy_service_role"
    assert classify_supabase_key(_legacy_key("anon")) == "legacy_anon"
    assert is_public_supabase_key("sb_publishable_example") is True
    assert is_public_supabase_key(_legacy_key("anon")) is True


def test_backend_config_prefers_secret_key(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_live")
    monkeypatch.setenv("SUPABASE_KEY", "sb_publishable_should_not_win")

    config = get_backend_supabase_config(allow_stub=False)

    assert config.url == "https://project.supabase.co"
    assert config.secret_key == "sb_secret_live"
    assert config.key_source == "SUPABASE_SECRET_KEY"
    assert config.is_stub is False


def test_backend_config_rejects_public_key_alias(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.delenv("SUPABASE_SECRET_KEY", raising=False)
    monkeypatch.setenv("SUPABASE_KEY", "sb_publishable_public")

    with pytest.raises(RuntimeError, match="must be a backend secret key"):
        get_backend_supabase_config(allow_stub=False)


def test_backend_config_rejects_legacy_anon_alias(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.delenv("SUPABASE_SECRET_KEY", raising=False)
    monkeypatch.setenv("SUPABASE_KEY", _legacy_key("anon"))

    with pytest.raises(RuntimeError, match="legacy_anon"):
        get_backend_supabase_config(allow_stub=False)


def test_backend_config_disables_stub_in_production(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL", raising=False)
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL_DEV", raising=False)
    monkeypatch.delenv("NEXT_PUBLIC_SUPABASE_URL_PROD", raising=False)
    monkeypatch.delenv("SUPABASE_SECRET_KEY", raising=False)
    monkeypatch.delenv("SUPABASE_KEY", raising=False)

    with pytest.raises(RuntimeError, match="stub mode is disabled"):
        get_backend_supabase_config(allow_stub=True)


def test_get_adaptive_db_uses_cached_secret_client(monkeypatch):
    reset_adaptive_db_cache()
    monkeypatch.setenv("SUPABASE_URL", "https://project.supabase.co")
    monkeypatch.setenv("SUPABASE_SECRET_KEY", "sb_secret_live")
    monkeypatch.delenv("SUPABASE_KEY", raising=False)

    first = get_adaptive_db()
    second = get_adaptive_db()

    assert first is second
    assert getattr(first, "_stub_mode", None) is False
    reset_adaptive_db_cache()
