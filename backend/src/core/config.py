"""Application configuration from environment variables."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

_PROJECT_ROOT = Path(__file__).resolve().parents[2]
# Ưu tiên đọc env theo thứ tự gần backend trước, rồi mới đến env ở root repo.
# Cách này giúp backend chạy độc lập nhưng vẫn tận dụng được cấu hình chung.
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
    # ACTIVE_CHALLENGE cho phép đổi "workspace đề thi đang active" mà không cần sửa code.
    active_challenge: str = field(default_factory=lambda: os.getenv("ACTIVE_CHALLENGE", "").strip())

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

    @property
    def modules_config_path(self) -> Path:
        default_path = _PROJECT_ROOT / "src" / "core" / "modules_config.json"
        if not self.active_challenge:
            return default_path

        # Chấp nhận cả slug dưới challenges/ lẫn đường dẫn tuyệt đối,
        # để team có thể dùng linh hoạt trong local, CI hoặc máy demo.
        challenge_path = Path(self.active_challenge).expanduser()
        if not challenge_path.is_absolute():
            challenge_path = _PROJECT_ROOT.parent / "challenges" / challenge_path
        config_path = (
            challenge_path
            if challenge_path.name == "modules_config.json"
            else challenge_path / "modules_config.json"
        )
        resolved_path = config_path.resolve()
        if not resolved_path.is_file():
            # Fail sớm ở giai đoạn boot để tránh tình trạng app chạy lên
            # nhưng capability bị sai cấu hình mà khó truy vết.
            raise ValueError(
                "ACTIVE_CHALLENGE must reference a workspace containing modules_config.json: "
                f"{resolved_path}"
            )
        return resolved_path


def get_settings() -> Settings:
    return Settings()
