"""Application error types and global error handler."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AppError(Exception):
    """Base application error with structured fields."""

    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    retryable: bool = False
    details: dict[str, Any] = field(default_factory=dict)
    status_code: int = 500

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"


class ValidationError(AppError):
    """Request validation error."""

    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            retryable=False,
            details=details or {},
            status_code=422,
        )


class ToolExecutionError(AppError):
    """Tool failed to execute."""

    def __init__(self, tool_name: str, reason: str):
        super().__init__(
            code="TOOL_EXECUTION_ERROR",
            message=f"Tool '{tool_name}' failed: {reason}",
            retryable=True,
            details={"tool_name": tool_name, "reason": reason},
            status_code=500,
        )


class ProviderError(AppError):
    """LLM provider error."""

    def __init__(self, provider: str, reason: str):
        super().__init__(
            code="PROVIDER_ERROR",
            message=f"Provider '{provider}' error: {reason}",
            retryable=True,
            details={"provider": provider, "reason": reason},
            status_code=502,
        )
