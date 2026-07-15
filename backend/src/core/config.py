"""Application configuration loaded from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

# Load .env from project root (two levels up from this file)
_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(_ENV_PATH, override=False)

# Also try workspace root
_WORKSPACE_ENV = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(_WORKSPACE_ENV, override=False)


@dataclass(frozen=True)
class Settings:
    """Immutable application settings."""

    # Application
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    app_debug: bool = field(
        default_factory=lambda: os.getenv("APP_DEBUG", "true").lower() == "true"
    )
    log_level: str = field(default_factory=lambda: os.getenv("APP_LOG_LEVEL", "INFO"))

    # Server
    host: str = field(default_factory=lambda: os.getenv("BACKEND_HOST", "0.0.0.0"))
    port: int = field(default_factory=lambda: int(os.getenv("BACKEND_PORT", "8000")))
    cors_origins: list[str] = field(
        default_factory=lambda: os.getenv("BACKEND_CORS_ORIGINS", "http://localhost:3000").split(
            ","
        )
    )

    # LLM
    llm_provider: str = field(default_factory=lambda: os.getenv("LLM_PROVIDER", "stub"))

    # Database
    database_url: str = field(
        default_factory=lambda: os.getenv("DATABASE_URL", "sqlite:///./data/vaic_agent.db")
    )

    # Audit
    audit_dir: str = field(
        default_factory=lambda: os.getenv(
            "AUDIT_DIR", str(Path(__file__).resolve().parents[2] / "data" / "audit")
        )
    )

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


def get_settings() -> Settings:
    """Factory function — returns a new Settings instance each time (safe for testing)."""
    return Settings()
