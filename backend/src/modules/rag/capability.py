"""Skeleton RAG capability.

This is a disabled-by-default optional skeleton capability.
It will only load if `chromadb` is available.
"""

from __future__ import annotations

from typing import Any

from src.capabilities.registry import BaseCapability, CapabilityResult


class RAGCapability(BaseCapability):
    @property
    def id(self) -> str:
        return "rag"

    @property
    def name(self) -> str:
        return "RAG System"

    @property
    def description(self) -> str:
        return "Retrieval Augmented Generation system utilizing a local vector store."

    @property
    def category(self) -> str:
        return "rag"

    @property
    def required_dependencies(self) -> list[str]:
        return ["chromadb"]

    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        # Skeleton implementation
        return CapabilityResult(
            success=False,
            error="RAG capability is in skeleton status and has not been implemented yet.",
        )
