"""Application configuration from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(_PROJECT_ROOT / ".env", override=False)
load_dotenv(_PROJECT_ROOT.parent / ".env", override=False)


@dataclass(frozen=True)
class Settings:
    """Immutable application settings."""

    app_name: str = field(default_factory=lambda: os.getenv("APP_NAME", "vaic-universal-starter"))
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    debug: bool = field(default_factory=lambda: os.getenv("DEBUG", "true").lower() == "true")
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))

    api_host: str = field(default_factory=lambda: os.getenv("API_HOST", "0.0.0.0"))
    api_port: int = field(default_factory=lambda: int(os.getenv("API_PORT", "8000")))
    frontend_origin: str = field(
        default_factory=lambda: os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
    )

    storage_path: str = field(
        default_factory=lambda: os.getenv("STORAGE_PATH", str(_PROJECT_ROOT / "data"))
    )
    max_upload_size_mb: int = field(
        default_factory=lambda: int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.max_upload_size_mb * 1024 * 1024

    @property
    def uploads_dir(self) -> Path:
        p = Path(self.storage_path) / "uploads"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def artifacts_dir(self) -> Path:
        p = Path(self.storage_path) / "artifacts"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def runs_dir(self) -> Path:
        p = Path(self.storage_path) / "runs"
        p.mkdir(parents=True, exist_ok=True)
        return p


def get_settings() -> Settings:
    return Settings()
