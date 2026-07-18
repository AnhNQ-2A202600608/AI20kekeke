from __future__ import annotations

import os
from collections.abc import AsyncIterator
from types import SimpleNamespace

from langchain_openai import ChatOpenAI

from src.config import get_settings


class _MockChatModel:
    def __init__(self, content: str = "Mocked LLM response") -> None:
        self.content = content

    async def ainvoke(self, messages):
        return SimpleNamespace(content=self.content)

    async def astream(self, messages) -> AsyncIterator[SimpleNamespace]:
        yield SimpleNamespace(content=self.content)


def allow_mock_llm() -> bool:
    return os.getenv("LLM_ALLOW_MOCK", "").strip().lower() in {"1", "true", "yes", "on"}


def get_llm() -> ChatOpenAI | _MockChatModel:
    settings = get_settings()
    if settings.app_env == "test" or os.getenv("PYTEST_CURRENT_TEST"):
        return _MockChatModel()

    provider = os.getenv("LLM_PROVIDER", "openai").strip().lower()
    if provider != "openrouter" and settings.openai_api_key and "your-key" not in settings.openai_api_key:
        return ChatOpenAI(
            model=settings.model_name,
            api_key=settings.openai_api_key,
            temperature=settings.llm_temperature,
        )

    openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_api_key and "your-key" not in openrouter_api_key:
        model_name = settings.model_name
        if "/" not in model_name:
            model_name = f"openai/{model_name}"
        return ChatOpenAI(
            model=model_name,
            api_key=openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
            temperature=settings.llm_temperature,
        )

    if allow_mock_llm():
        return _MockChatModel()

    raise RuntimeError("LLM provider is not configured. Set OPENAI_API_KEY or OPENROUTER_API_KEY.")
