from types import SimpleNamespace

import pytest

from src.config import get_settings
from src.services import llm as llm_service


@pytest.fixture(autouse=True)
def clear_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_get_llm_rejects_unconfigured_provider_outside_test(monkeypatch):
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.delenv("LLM_ALLOW_MOCK", raising=False)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setattr(
        llm_service,
        "get_settings",
        lambda: SimpleNamespace(
            app_env="development",
            openai_api_key="",
            model_name="gpt-4o-mini",
            llm_temperature=0.7,
        ),
    )

    with pytest.raises(RuntimeError, match="LLM provider is not configured"):
        llm_service.get_llm()


@pytest.mark.asyncio
async def test_get_llm_mock_requires_explicit_flag_outside_test(monkeypatch):
    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("LLM_ALLOW_MOCK", "true")
    monkeypatch.setattr(
        llm_service,
        "get_settings",
        lambda: SimpleNamespace(
            app_env="development",
            openai_api_key="",
            model_name="gpt-4o-mini",
            llm_temperature=0.7,
        ),
    )

    model = llm_service.get_llm()
    response = await model.ainvoke("hello")

    assert response.content == "Mocked LLM response"
