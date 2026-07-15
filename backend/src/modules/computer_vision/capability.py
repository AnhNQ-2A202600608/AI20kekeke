"""Skeleton Computer Vision capability.

This is a disabled-by-default optional skeleton capability.
It will only load if `cv2` is available.
"""

from __future__ import annotations

from typing import Any

from src.capabilities.registry import BaseCapability, CapabilityResult


class CVCapability(BaseCapability):
    @property
    def id(self) -> str:
        return "computer_vision"

    @property
    def name(self) -> str:
        return "Computer Vision"

    @property
    def description(self) -> str:
        return "Image processing and object detection module using OpenCV."

    @property
    def category(self) -> str:
        return "computer_vision"

    @property
    def required_dependencies(self) -> list[str]:
        return ["cv2"]

    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        # Skeleton implementation
        return CapabilityResult(
            success=False,
            error="CV capability is in skeleton status and has not been implemented yet.",
        )
