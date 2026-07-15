"""Run lifecycle state transition manager.

Governs state checks and transitions (queued, running, completed, failed, cancelled)
to avoid invalid pipeline updates.
"""

from __future__ import annotations

from typing import Literal

from src.core.errors import ValidationError

RunState = Literal["queued", "running", "completed", "failed", "cancelled"]

# Valid state transitions lookup
VALID_TRANSITIONS: dict[RunState, set[RunState]] = {
    "queued": {"running", "cancelled", "failed"},
    "running": {"completed", "failed", "cancelled"},
    "completed": set(),
    "failed": set(),
    "cancelled": set()
}


class RunStateManger:
    """State transition validator for capability execution runs."""

    @staticmethod
    def validate_transition(current: RunState, target: RunState) -> None:
        """Validate if a run transition is allowed. Raises ValidationError if forbidden."""
        if current == target:
            return  # identity transitions are safe

        allowed = VALID_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise ValidationError(
                f"Invalid state transition: Cannot update run from '{current}' to '{target}'"
            )
