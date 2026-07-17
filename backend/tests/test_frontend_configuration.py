"""Static regression tests for deploy-safe frontend configuration."""

from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def test_workspace_upload_uses_shared_api_client() -> None:
    workspace = (PROJECT_ROOT / "frontend" / "app" / "workspace" / "page.tsx").read_text(
        encoding="utf-8"
    )

    assert 'fetch("http://localhost:8000/api/v1/files"' not in workspace
    assert 'fetchApi<UploadMeta>("/files"' in workspace


def test_next_config_proxies_same_origin_api() -> None:
    next_config = (PROJECT_ROOT / "frontend" / "next.config.ts").read_text(encoding="utf-8")

    assert 'source: "/api/v1/:path*"' in next_config
    assert "BACKEND_API_URL" in next_config


def test_frontend_dockerfile_does_not_copy_missing_public_directory() -> None:
    dockerfile = (PROJECT_ROOT / "frontend" / "Dockerfile").read_text(encoding="utf-8")

    assert "pnpm install" in dockerfile
    assert "/app/public" not in dockerfile
