"""Request models for the API."""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ChatRequest:
    """Incoming chat request."""

    message: str
    session_id: str | None = None
    user_id: str = "anonymous"

    def validate(self) -> list[str]:
        """Return list of validation error messages, empty if valid."""
        errors: list[str] = []
        if not self.message or not self.message.strip():
            errors.append("message must not be empty")
        if len(self.message) > 4000:
            errors.append("message must not exceed 4000 characters")
        return errors
