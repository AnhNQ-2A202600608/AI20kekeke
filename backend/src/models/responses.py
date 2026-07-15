"""Standard API response envelope."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Any


@dataclass
class ResponseMeta:
    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    duration_ms: float = 0.0


@dataclass
class ErrorDetail:
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    retryable: bool = False
    details: dict[str, Any] = field(default_factory=dict)


def success_response(data: Any, request_id: str = "", duration_ms: float = 0.0) -> dict:
    return {
        "success": True,
        "data": data,
        "error": None,
        "meta": {"request_id": request_id or str(uuid.uuid4()), "duration_ms": duration_ms},
    }


def error_response(
    code: str,
    message: str,
    retryable: bool = False,
    details: dict[str, Any] | None = None,
    request_id: str = "",
) -> dict:
    return {
        "success": False,
        "data": None,
        "error": {
            "code": code,
            "message": message,
            "retryable": retryable,
            "details": details or {},
        },
        "meta": {"request_id": request_id or str(uuid.uuid4()), "duration_ms": 0.0},
    }
