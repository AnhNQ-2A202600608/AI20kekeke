"""HTTP Integration Client.

Wraps httpx.AsyncClient with timeout settings, retry limits, error mapping,
and automatic secret/authorization header redaction.
"""

from __future__ import annotations

import asyncio
from typing import Any

import httpx

from src.core.errors import ProviderError
from src.core.logging import get_logger

logger = get_logger("core.http_client")

# Secret redaction pattern (common headers/keys)
_SECRET_REDACT_KEYS = {"authorization", "api-key", "x-api-key", "token", "password", "secret"}


def redact_headers(headers: dict[str, str]) -> dict[str, str]:
    """Return a copy of headers with sensitive values redacted."""
    redacted = {}
    for k, v in headers.items():
        if k.lower() in _SECRET_REDACT_KEYS:
            redacted[k] = "[REDACTED]"
        else:
            redacted[k] = v
    return redacted


class HttpIntegrationClient:
    """Standard HTTP Client with built-in retry logic and error mapping."""

    def __init__(
        self, base_url: str = "", timeout_seconds: float = 10.0, max_retries: int = 3
    ) -> None:
        self.base_url = base_url
        self.timeout = timeout_seconds
        self.max_retries = max_retries

    async def request(
        self,
        method: str,
        url_path: str,
        headers: dict[str, str] | None = None,
        json_data: Any = None,
        params: dict[str, Any] | None = None,
    ) -> httpx.Response:
        """Execute request with retries, timeout configuration, and safety mappings."""
        full_url = (
            f"{self.base_url.rstrip('/')}/{url_path.lstrip('/')}" if self.base_url else url_path
        )
        req_headers = headers or {}
        redacted_headers = redact_headers(req_headers)

        attempt = 0
        backoff = 0.5  # initial sleep backoff seconds

        while True:
            attempt += 1
            try:
                logger.info(
                    "HTTP Request (attempt %d/%d): %s %s | Headers: %s",
                    attempt,
                    self.max_retries,
                    method,
                    full_url,
                    redacted_headers,
                )
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(
                        method=method,
                        url=full_url,
                        headers=req_headers,
                        json=json_data,
                        params=params,
                    )

                # Raise for 4xx/5xx to go to the exception handler
                response.raise_for_status()
                return response

            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                logger.error(
                    "HTTP Error response (%d): %s | Body: %s", status_code, exc, exc.response.text
                )

                # Non-retryable status codes (validation or bad request)
                if status_code in (400, 401, 403, 404, 422) or attempt >= self.max_retries:
                    raise ProviderError(
                        provider="HTTPClient", reason=f"Status {status_code}: {exc.response.text}"
                    ) from exc

            except (httpx.RequestError, asyncio.TimeoutError) as exc:
                logger.error("HTTP Request Exception (attempt %d): %s", attempt, exc)
                if attempt >= self.max_retries:
                    raise ProviderError(
                        provider="HTTPClient", reason=f"Connection/Timeout failure: {exc}"
                    ) from exc

            # Exponential backoff sleep
            await asyncio.sleep(backoff)
            backoff *= 2.0
