from unittest.mock import MagicMock
from uuid import UUID

from src.api import adaptive_routes
from src.api.adaptive_routes import get_current_user
from src.services.auth.supabase_jwt import verify_supabase_jwt_locally


def live_db():
    db = MagicMock()
    db._stub_mode = False
    db.supabase_url = "https://project.supabase.co"
    db.app_client = MagicMock()
    db.app_client.table.return_value.select.return_value.eq.return_value.execute.return_value.data = []
    return db


def test_local_jwt_claims_skip_supabase_get_user(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()
    monkeypatch.setattr(
        adaptive_routes,
        "verify_supabase_jwt_locally",
        lambda token, url: {"sub": "d3b07384-d113-4ec5-a58e-0f2d87e07661", "email": "student@mentora.vn"},
    )

    user = get_current_user("Bearer header.payload.signature", db)

    assert user.id == UUID("d3b07384-d113-4ec5-a58e-0f2d87e07661")
    assert user.email == "student@mentora.vn"
    db.app_client.auth.get_user.assert_not_called()


def test_live_auth_fallback_still_accepts_supabase_get_user(monkeypatch):
    monkeypatch.delenv("AUTH_ALLOW_DEV_TOKENS", raising=False)
    db = live_db()
    monkeypatch.setattr(adaptive_routes, "verify_supabase_jwt_locally", lambda token, url: None)
    db.app_client.auth.get_user.return_value.user.id = "d3b07384-d113-4ec5-a58e-0f2d87e07661"
    db.app_client.auth.get_user.return_value.user.email = "student@mentora.vn"

    user = get_current_user("Bearer header.payload.signature", db)

    assert user.id == UUID("d3b07384-d113-4ec5-a58e-0f2d87e07661")
    db.app_client.auth.get_user.assert_called_once_with("header.payload.signature")


def test_symmetric_or_legacy_jwt_does_not_use_local_jwks(monkeypatch):
    monkeypatch.setenv("SUPABASE_JWT_VERIFICATION", "auto")
    token = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJkM2IwNzM4NC1kMTEzLTRlYzUtYTU4ZS0wZjJkODdlMDc2NjEifQ.signature"  # nosemgrep

    assert verify_supabase_jwt_locally(token, "https://project.supabase.co") is None
