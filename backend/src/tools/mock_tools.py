"""Mock tools that read from sample_records.json.

Tools:
  - search_records: Search profiles by name, segment, status, or tag.
  - get_record_details: Get full details for a profile including interactions and opportunities.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from src.models.sources import SourceReference
from src.tools.base import BaseTool, ToolResult

# Load sample data once at module level
_DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_records.json"


def _load_data() -> dict[str, Any]:
    """Load sample records from JSON file."""
    with open(_DATA_PATH, encoding="utf-8") as f:
        return json.load(f)


class SearchRecordsTool(BaseTool):
    """Search profiles by name, segment, status, or tag keyword."""

    @property
    def name(self) -> str:
        return "search_records"

    @property
    def description(self) -> str:
        return (
            "Search customer profiles by keyword. "
            "Matches against name, email, segment, status, and tags. "
            "Returns a list of matching profile summaries."
        )

    @property
    def parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search keyword to match against profile fields",
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default 10)",
                },
            },
            "required": ["query"],
        }

    def execute(self, **kwargs: Any) -> ToolResult:
        query = kwargs.get("query", "").lower().strip()
        limit = kwargs.get("limit", 10)

        if not query:
            return ToolResult(
                success=False,
                error="query parameter is required",
                source=self._make_source([]).to_dict(),
            )

        data = _load_data()
        profiles = data.get("profiles", [])

        matches = []
        for p in profiles:
            searchable = " ".join(
                [
                    p.get("name", ""),
                    p.get("email", ""),
                    p.get("segment", ""),
                    p.get("status", ""),
                    " ".join(p.get("tags", [])),
                    p.get("metadata", {}).get("region", ""),
                ]
            ).lower()

            if query in searchable:
                matches.append(
                    {
                        "id": p["id"],
                        "name": p["name"],
                        "segment": p["segment"],
                        "status": p["status"],
                        "region": p.get("metadata", {}).get("region", ""),
                    }
                )

        matches = matches[:limit]
        record_ids = [m["id"] for m in matches]

        return ToolResult(
            success=True,
            data={"total_matches": len(matches), "query": query},
            records=matches,
            source=self._make_source(record_ids).to_dict(),
        )

    def _make_source(self, record_ids: list[str]) -> SourceReference:
        return SourceReference(
            source_type="mock_api",
            tool_name=self.name,
            record_ids=record_ids,
            fields_used=["name", "segment", "status", "region"],
            retrieved_at=datetime.now(timezone.utc).isoformat(),
        )


class GetRecordDetailsTool(BaseTool):
    """Get full profile details including interactions and opportunities."""

    @property
    def name(self) -> str:
        return "get_record_details"

    @property
    def description(self) -> str:
        return (
            "Get detailed information for a specific customer profile by ID. "
            "Returns the full profile, related interactions, and opportunities."
        )

    @property
    def parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "record_id": {
                    "type": "string",
                    "description": "The profile ID (e.g., 'PRF-001')",
                },
            },
            "required": ["record_id"],
        }

    def execute(self, **kwargs: Any) -> ToolResult:
        record_id = kwargs.get("record_id", "").strip()

        if not record_id:
            return ToolResult(
                success=False,
                error="record_id parameter is required",
                source=self._make_source(record_id, []).to_dict(),
            )

        data = _load_data()

        # Find profile
        profile = None
        for p in data.get("profiles", []):
            if p["id"] == record_id:
                profile = p
                break

        if profile is None:
            return ToolResult(
                success=False,
                error=f"No profile found with ID '{record_id}'",
                source=self._make_source(record_id, []).to_dict(),
            )

        # Find related interactions
        interactions = [
            i for i in data.get("interactions", []) if i.get("profile_id") == record_id
        ]

        # Find related opportunities
        opportunities = [
            o for o in data.get("opportunities", []) if o.get("profile_id") == record_id
        ]

        fields_used = [
            "id", "name", "email", "segment", "status", "tags", "metadata",
            "interactions", "opportunities",
        ]

        interaction_ids = [i["id"] for i in interactions]
        opportunity_ids = [o["id"] for o in opportunities]

        return ToolResult(
            success=True,
            data={
                "profile": profile,
                "interactions": interactions,
                "opportunities": opportunities,
            },
            records=[profile],
            source=self._make_source(
                record_id,
                [record_id] + interaction_ids + opportunity_ids,
                fields_used,
            ).to_dict(),
        )

    def _make_source(
        self,
        record_id: str,
        record_ids: list[str],
        fields_used: list[str] | None = None,
    ) -> SourceReference:
        return SourceReference(
            source_type="mock_api",
            tool_name=self.name,
            record_ids=record_ids,
            fields_used=fields_used or ["id"],
            retrieved_at=datetime.now(timezone.utc).isoformat(),
        )


def create_default_registry():
    """Create a ToolRegistry pre-loaded with mock tools."""
    from src.tools.registry import ToolRegistry

    registry = ToolRegistry()
    registry.register(SearchRecordsTool())
    registry.register(GetRecordDetailsTool())
    return registry
