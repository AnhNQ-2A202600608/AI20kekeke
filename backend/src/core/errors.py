"""Application error types."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AppError(Exception):
    code: str = "INTERNAL_ERROR"
    message: str = "An unexpected error occurred"
    retryable: bool = False
    details: dict[str, Any] = field(default_factory=dict)
    status_code: int = 500

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"


class ValidationError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            retryable=False,
            details=details or {},
            status_code=422,
        )


class NotFoundError(AppError):
    def __init__(self, resource: str, resource_id: str):
        super().__init__(
            code="NOT_FOUND",
            message=f"{resource} '{resource_id}' not found",
            retryable=False,
            details={"resource": resource, "id": resource_id},
            status_code=404,
        )


class CapabilityError(AppError):
    def __init__(self, capability: str, reason: str):
        super().__init__(
            code="CAPABILITY_ERROR",
            message=f"Capability '{capability}' failed: {reason}",
            retryable=True,
            details={"capability": capability, "reason": reason},
            status_code=500,
        )


class ProviderError(AppError):
    def __init__(self, provider: str, reason: str, retryable: bool = True):
        super().__init__(
            code="PROVIDER_ERROR",
            message=f"Integration provider '{provider}' failed: {reason}",
            retryable=retryable,
            details={"provider": provider, "reason": reason},
            status_code=502,
        )
