"""Source reference models — tracks provenance of data in responses."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class SourceReference:
    """A reference to the origin of a piece of data."""

    source_type: str = "mock_api"
    tool_name: str = ""
    record_ids: list[str] = field(default_factory=list)
    fields_used: list[str] = field(default_factory=list)
    retrieved_at: str = field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_type": self.source_type,
            "tool_name": self.tool_name,
            "record_ids": self.record_ids,
            "fields_used": self.fields_used,
            "retrieved_at": self.retrieved_at,
        }
