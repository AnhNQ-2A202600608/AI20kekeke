import importlib.util
import sys
from pathlib import Path

import httpx

ROOT = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT / "scripts" / "smoke_live_api.py"


def _load_smoke_module():
    spec = importlib.util.spec_from_file_location("smoke_live_api", SCRIPT_PATH)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def test_smoke_script_normalizes_urls() -> None:
    smoke = _load_smoke_module()

    assert smoke.normalize_url(" https://example.com/ ") == "https://example.com"


def test_smoke_script_requires_frontend_and_backend_urls(monkeypatch, capsys) -> None:
    smoke = _load_smoke_module()
    monkeypatch.delenv("FRONTEND_BASE_URL", raising=False)
    monkeypatch.delenv("BACKEND_BASE_URL", raising=False)

    assert smoke.main() == 2
    captured = capsys.readouterr()
    assert "FRONTEND_BASE_URL" in captured.err
    assert "BACKEND_BASE_URL" in captured.err


def test_smoke_script_accepts_only_auth_rejection_for_bad_tokens() -> None:
    smoke = _load_smoke_module()

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["authorization"].startswith("Bearer ")
        return httpx.Response(401, json={"error": "invalid_token"})

    client = httpx.Client(transport=httpx.MockTransport(handler))

    result = smoke.check_token_rejected(client, "https://frontend.example.com", "bad-token", "rejects_bad_token")

    assert result.ok is True
    assert result.status_code == 401


def test_smoke_script_fails_when_bad_token_check_hits_dependency_error() -> None:
    smoke = _load_smoke_module()

    client = httpx.Client(
        transport=httpx.MockTransport(lambda _request: httpx.Response(503, json={"error": "db_unavailable"}))
    )

    result = smoke.check_token_rejected(client, "https://backend.example.com", "bad-token", "rejects_bad_token")

    assert result.ok is False
    assert result.status_code == 503
    assert "db_unavailable" in result.detail
