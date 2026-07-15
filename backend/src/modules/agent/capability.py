"""Skeleton AI Agent capability using LangGraph.

This is a disabled-by-default optional skeleton capability.
It will only load if `langgraph` and `langchain_core` are available.
"""

from __future__ import annotations

from typing import Any

from src.capabilities.registry import BaseCapability, CapabilityResult


class AgentCapability(BaseCapability):
    @property
    def id(self) -> str:
        return "agent"

    @property
    def name(self) -> str:
        return "AI Agent"

    @property
    def description(self) -> str:
        return "Multi-turn reasoning and tool use AI agent using LangGraph orchestration."

    @property
    def category(self) -> str:
        return "agent"

    @property
    def required_dependencies(self) -> list[str]:
        return ["langgraph", "langchain_core"]

    @property
    def required_environment(self) -> list[str]:
        return ["OPENAI_API_KEY"]

    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        # Skeleton implementation
        return CapabilityResult(
            success=False,
            error="Agent capability is in skeleton status and has not been implemented yet."
        )
