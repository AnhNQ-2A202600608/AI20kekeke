import pytest
from pydantic import ValidationError

from src.config import PromptsConfig, get_settings


def test_get_settings():
    settings = get_settings()
    assert settings is not None
    assert settings.app_name in {"AI20K Agent", "vaic-universal-starter"}
    assert settings.prompts is not None
    assert settings.prompts.system_prompt is not None


def test_system_prompt_validation_success():
    # Valid prompt with all expected variables
    valid_prompt = "Hello {active_quiz_session} {scaffolding_rules} {mode_instructions} {context} {diagnostic_summary}"
    prompt_config = PromptsConfig(system_prompt=valid_prompt)
    assert prompt_config.system_prompt == valid_prompt


def test_system_prompt_validation_missing_keys():
    # Missing diagnostic_summary and context
    invalid_prompt = "Hello {active_quiz_session} {scaffolding_rules} {mode_instructions}"
    with pytest.raises(ValidationError) as exc_info:
        PromptsConfig(system_prompt=invalid_prompt)
    assert "System prompt is missing required placeholder variables" in str(exc_info.value)


def test_settings_algorithm_scaffolding():
    settings = get_settings()
    assert settings.algorithm is not None
    assert len(settings.algorithm.scaffolding_rules) > 0

    # Check that Elo ranges resolve properly
    rules = settings.algorithm.scaffolding_rules
    # Test low ELO
    low_rules = [r for r in rules if r.min_elo <= 350 <= r.max_elo]
    assert len(low_rules) == 1
    assert "gặp khó khăn" in low_rules[0].instructions

    # Test high ELO
    high_rules = [r for r in rules if r.min_elo <= 900 <= r.max_elo]
    assert len(high_rules) == 1
    assert "xuất sắc" in high_rules[0].instructions

    # Test mid ELO
    mid_rules = [r for r in rules if r.min_elo <= 600 <= r.max_elo]
    assert len(mid_rules) == 1
    assert "trung bình" in mid_rules[0].instructions


def test_mode_instructions():
    settings = get_settings()
    assert settings.algorithm is not None
    assert "Explain" in settings.algorithm.mode_instructions
    assert "CHẾ ĐỘ: GIẢI THÍCH" in settings.algorithm.mode_instructions["Explain"]


def test_sgk_data_dir_relative_path_resolves_from_repo_root(monkeypatch):
    monkeypatch.setenv("SGK_DATA_DIR", "./data")
    from src.config import Settings

    settings = Settings()
    from pathlib import Path

    assert settings.sgk_data_path == Path(__file__).resolve().parent.parent / "data"
