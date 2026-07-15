"""Response envelope models for the API."""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any
import uuid


@dataclass
class ResponseMeta:
    """Metadata attached to every API response."""

    request_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str = ""
    trace_id: str = ""
    duration_ms: float = 0.0


@dataclass
class ErrorDetail:
    """Structured error detail."""

    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    retryable: bool = False
    details: dict[str, Any] = field(default_factory=dict)


@dataclass
class ApiResponse:
    """Standard API response envelope."""

    success: bool = True
    data: Any = None
    error: ErrorDetail | None = None
    meta: ResponseMeta = field(default_factory=ResponseMeta)

    def to_dict(self) -> dict[str, Any]:
        """Serialize to dict for JSON response."""
        result: dict[str, Any] = {
            "success": self.success,
            "data": self.data,
            "error": None,
            "meta": {
                "request_id": self.meta.request_id,
                "session_id": self.meta.session_id,
                "trace_id": self.meta.trace_id,
                "duration_ms": self.meta.duration_ms,
            },
        }
        if self.error:
            result["error"] = {
                "code": self.error.code,
                "message": self.error.message,
                "retryable": self.error.retryable,
                "details": self.error.details,
            }
        return result


def success_response(
    data: Any,
    request_id: str = "",
    session_id: str = "",
    trace_id: str = "",
    duration_ms: float = 0.0,
) -> dict[str, Any]:
    """Shortcut to create a success response dict."""
    return ApiResponse(
        success=True,
        data=data,
        meta=ResponseMeta(
            request_id=request_id or str(uuid.uuid4()),
            session_id=session_id,
            trace_id=trace_id,
            duration_ms=duration_ms,
        ),
    ).to_dict()


def error_response(
    code: str,
    message: str,
    retryable: bool = False,
    details: dict[str, Any] | None = None,
    request_id: str = "",
    session_id: str = "",
    trace_id: str = "",
) -> dict[str, Any]:
    """Shortcut to create an error response dict."""
    return ApiResponse(
        success=False,
        data=None,
        error=ErrorDetail(
            code=code,
            message=message,
            retryable=retryable,
            details=details or {},
        ),
        meta=ResponseMeta(
            request_id=request_id or str(uuid.uuid4()),
            session_id=session_id,
            trace_id=trace_id,
        ),
    ).to_dict()
