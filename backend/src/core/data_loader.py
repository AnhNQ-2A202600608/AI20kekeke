"""Data Loader utility.

Supports loading and basic profiling of JSON, CSV, and plain text formats
with schema validation hooks.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from src.core.errors import ValidationError


def load_txt(path: Path) -> str:
    """Load plain text file."""
    if not path.exists():
        raise ValidationError(f"File not found: {path}")
    try:
        return path.read_text(encoding="utf-8")
    except Exception as exc:
        raise ValidationError(f"Failed to read text file: {exc}") from exc


def load_json(path: Path, required_keys: list[str] | None = None) -> Any:
    """Load JSON file and validate mandatory top-level keys."""
    if not path.exists():
        raise ValidationError(f"JSON file not found: {path}")
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValidationError(f"Failed to parse JSON file: {exc}") from exc

    if required_keys:
        if isinstance(data, dict):
            missing = [k for k in required_keys if k not in data]
            if missing:
                raise ValidationError(f"Missing required JSON keys: {', '.join(missing)}")
        elif isinstance(data, list):
            for i, item in enumerate(data):
                if isinstance(item, dict):
                    missing = [k for k in required_keys if k not in item]
                    if missing:
                        raise ValidationError(
                            f"Missing required JSON keys in item index {i}: {', '.join(missing)}"
                        )
                else:
                    raise ValidationError(
                        f"JSON data is a list containing non-object items at index {i}"
                    )

    return data


def load_csv(path: Path, required_headers: list[str] | None = None) -> list[dict[str, str]]:
    """Load CSV file and validate mandatory columns."""
    if not path.exists():
        raise ValidationError(f"CSV file not found: {path}")

    try:
        with open(path, mode="r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            headers = reader.fieldnames or []

            if required_headers:
                missing = [h for h in required_headers if h not in headers]
                if missing:
                    raise ValidationError(f"Missing required CSV columns: {', '.join(missing)}")

            rows = list(reader)
            return rows
    except ValidationError:
        raise
    except Exception as exc:
        raise ValidationError(f"Failed to parse CSV file: {exc}") from exc


def profile_data(records: list[dict[str, Any]]) -> dict[str, Any]:
    """Generate basic profile statistics from a list of record dictionaries."""
    if not records:
        return {"row_count": 0, "columns": [], "missing_values": {}, "data_types": {}}

    row_count = len(records)
    columns = list(records[0].keys())

    missing_counts = {col: 0 for col in columns}
    type_samples = {col: set() for col in columns}

    for row in records:
        for col in columns:
            val = row.get(col)
            # Check empty/null/blank strings
            if val is None or (isinstance(val, str) and not val.strip()):
                missing_counts[col] += 1
            else:
                # Basic sample type detection
                type_samples[col].add(type(val).__name__)

    # Summarize data types
    data_types = {}
    for col in columns:
        types = type_samples[col]
        if not types:
            data_types[col] = "None"
        elif len(types) == 1:
            data_types[col] = list(types)[0]
        else:
            data_types[col] = "mixed"

    return {
        "row_count": row_count,
        "columns": columns,
        "missing_values": missing_counts,
        "data_types": data_types,
    }
