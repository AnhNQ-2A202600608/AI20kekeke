"""Example transform capability — deterministic text transformation.

This exists solely to validate the run/artifact infrastructure.
It does NOT use any AI, ML, or external API.
"""

from __future__ import annotations

import re
from collections import Counter
from typing import Any

from src.capabilities.registry import BaseCapability, CapabilityResult
from src.core.logging import get_logger
from src.storage import local as storage

logger = get_logger("capabilities.example_transform")


class ExampleTransformCapability(BaseCapability):
    """Deterministic text analysis and transformation."""

    @property
    def name(self) -> str:
        return "example_transform"

    @property
    def description(self) -> str:
        return (
            "Analyzes text input and produces a structured summary: "
            "word count, character count, frequency analysis, "
            "and reversed text. Useful for validating the pipeline."
        )

    @property
    def parameters_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "text": {
                    "type": "string",
                    "description": "Text to transform. Either supply this or an input file.",
                },
                "uppercase": {
                    "type": "boolean",
                    "description": "If true, also produce an uppercase version.",
                    "default": False,
                },
            },
        }

    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        # Get text from parameters or from first input file
        text = parameters.get("text", "")
        if not text and input_file_ids:
            try:
                file_path = storage.get_file_path(input_file_ids[0])
                text = file_path.read_text(encoding="utf-8")
            except Exception as exc:
                return CapabilityResult(success=False, error=f"Failed to read input file: {exc}")

        if not text.strip():
            return CapabilityResult(success=False, error="No text provided (parameter or file)")

        do_uppercase = parameters.get("uppercase", False)

        # ── Deterministic analysis ───────────────────────────────────
        words = re.findall(r"\w+", text, re.UNICODE)
        word_freq = Counter(w.lower() for w in words).most_common(20)

        lines = [
            "# Text Analysis Report",
            "",
            f"- **Characters**: {len(text)}",
            f"- **Words**: {len(words)}",
            f"- **Lines**: {text.count(chr(10)) + 1}",
            f"- **Unique words**: {len(set(w.lower() for w in words))}",
            "",
            "## Top Word Frequencies",
            "",
        ]
        for word, count in word_freq:
            lines.append(f"| {word} | {count} |")

        lines.extend(["", "## Reversed Text", "", text[::-1][:500]])

        if do_uppercase:
            lines.extend(["", "## Uppercase", "", text.upper()[:500]])

        output = "\n".join(lines)
        return CapabilityResult(success=True, artifacts=[{"filename": "analysis.md", "content": output}])
