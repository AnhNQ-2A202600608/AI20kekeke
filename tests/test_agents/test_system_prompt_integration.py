"""Tests for system prompt integration with diagnostic engine.

Validates:
1. LLM prompt does NOT contain self-diagnosis when engine returns no weakness.
2. LLM prompt correctly includes engine output (root_cause, confidence, suggested_path).
3. Low-confidence diagnosis triggers tentative language in prompt.
4. Citation format instruction is present.
5. Offline socratic hints fallback works.
"""

from unittest.mock import patch

import pytest

from src.agents.nodes.respond_node import build_offline_response
from src.services.chat_optimization import (
    _build_diagnostic_summary,
    build_prompt_profile,
    build_system_prompt,
)


class TestNoSelfDiagnosis:
    """Việc 3 — When weakness_flag=false or diagnostic is None, prompt must not contain diagnosis."""

    def test_prompt_no_diagnosis_when_none(self):
        """When diagnostic is None, prompt should not contain root_cause or lỗ hổng."""
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": False,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": None,
        }
        prompt = build_system_prompt("Some context", profile, "Explain")
        assert "CHẨN ĐOÁN TỪ ENGINE" not in prompt
        assert "root_cause" not in prompt.lower()

    def test_prompt_no_diagnosis_when_empty_dict(self):
        """When diagnostic is empty dict, prompt should not contain diagnosis."""
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": False,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": {},
        }
        prompt = build_system_prompt("Some context", profile, "Explain")
        assert "CHẨN ĐOÁN TỪ ENGINE" not in prompt

    def test_diagnostic_summary_empty_for_none(self):
        """_build_diagnostic_summary returns '' for None."""
        assert _build_diagnostic_summary(None) == ""

    def test_diagnostic_summary_empty_for_empty_dict(self):
        """_build_diagnostic_summary returns '' for empty dict."""
        assert _build_diagnostic_summary({}) == ""


class TestDiagnosisInPrompt:
    """Việc 2 — When engine returns DIAGNOSIS_COMPLETE, prompt must include structured info."""

    DIAGNOSIS = {
        "status": "DIAGNOSIS_COMPLETE",
        "weakness_flag": True,
        "root_cause": {
            "id": "M7.SDS.03",
            "mo_ta": "Phân số và quy đồng mẫu số",
            "lop": 7,
        },
        "surface_node": {
            "id": "M7.SDS.05",
            "mo_ta": "Tỉ lệ thức",
            "lop": 7,
        },
        "confidence": 0.85,
        "suggested_path": ["M7.SDS.03", "M7.SDS.04", "M7.SDS.05"],
    }

    def test_prompt_contains_root_cause(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": True,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": self.DIAGNOSIS,
        }
        prompt = build_system_prompt("Context here", profile, "Explain")
        assert "Phân số và quy đồng mẫu số" in prompt
        assert "M7.SDS.03" in prompt

    def test_prompt_contains_suggested_path(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": True,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": self.DIAGNOSIS,
        }
        prompt = build_system_prompt("Context here", profile, "Explain")
        assert "M7.SDS.03 → M7.SDS.04 → M7.SDS.05" in prompt

    def test_prompt_contains_confidence(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": True,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": self.DIAGNOSIS,
        }
        prompt = build_system_prompt("Context here", profile, "Explain")
        assert "85%" in prompt

    def test_no_override_instruction(self):
        """Prompt must tell LLM not to add extra weaknesses."""
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": True,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": self.DIAGNOSIS,
        }
        prompt = build_system_prompt("Context here", profile, "Explain")
        assert "KHÔNG tự thêm bớt lỗ hổng" in prompt


class TestLowConfidenceDiagnosis:
    """Việc 3 — Low confidence triggers tentative language."""

    def test_low_confidence_tentative(self):
        diagnosis = {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {"id": "M7.SDS.03", "mo_ta": "Phân số", "lop": 7},
            "confidence": 0.3,
            "suggested_path": ["M7.SDS.03", "M7.SDS.05"],
        }
        summary = _build_diagnostic_summary(diagnosis)
        assert "THẤP" in summary
        assert "dè dặt" in summary

    def test_high_confidence_positive(self):
        diagnosis = {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {"id": "M7.SDS.03", "mo_ta": "Phân số", "lop": 7},
            "confidence": 0.9,
            "suggested_path": ["M7.SDS.03", "M7.SDS.05"],
        }
        summary = _build_diagnostic_summary(diagnosis)
        assert "ôn lại phần nền" in summary


class TestProbeStatus:
    """When engine returns PROBE, prompt should not conclude weakness."""

    def test_probe_teaches_normally(self):
        diagnosis = {
            "status": "PROBE",
            "probe_node": "M7.SDS.03",
            "surface_node": "M7.SDS.05",
            "questions": ["q_m7_3"],
            "message": "Hệ thống cần kiểm tra thêm kiến thức.",
        }
        summary = _build_diagnostic_summary(diagnosis)
        assert "ĐANG THU THẬP" in summary
        assert "KHÔNG tự kết luận lỗ hổng" in summary


class TestCitationFormatInPrompt:
    """Việc 5 — Prompt must contain citation format instruction."""

    def test_citation_format_present(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": False,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": None,
        }
        prompt = build_system_prompt("Context", profile, "Explain")
        assert "[Tên tài liệu, Slide X]" in prompt or "Slide X" in prompt


class TestSafetyActivation:
    """Việc 5 — Safety instructions present in prompt."""

    def test_safety_immediate_activation(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": False,
            "active_quiz_session": False,
            "intent": "academic",
            "diagnostic": None,
        }
        prompt = build_system_prompt("Context", profile, "Explain")
        # The prompt must contain immediate safety activation language
        assert "bất kỳ lượt nào" in prompt or "NGAY" in prompt


class TestBuildPromptProfileDiagnostic:
    """Verify build_prompt_profile passes diagnostic_summary through."""

    def test_diagnostic_summary_key_present(self):
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": False,
            "active_quiz_session": False,
            "diagnostic": None,
        }
        result = build_prompt_profile(profile, "Explain")
        assert "diagnostic_summary" in result
        assert result["diagnostic_summary"] == ""

    def test_diagnostic_summary_filled(self):
        diagnosis = {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {"id": "M7.SDS.03", "mo_ta": "Test", "lop": 7},
            "confidence": 0.8,
            "suggested_path": ["M7.SDS.03"],
        }
        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.5,
            "weakness_flag": True,
            "active_quiz_session": False,
            "diagnostic": diagnosis,
        }
        result = build_prompt_profile(profile, "Explain")
        assert "CHẨN ĐOÁN TỪ ENGINE" in result["diagnostic_summary"]


class TestOfflineSocraticFallback:
    """Việc 4 — When LLM is offline or error happens, socratic hints should be returned."""

    @patch("src.config.get_settings")
    def test_build_offline_response_probe(self, mock_get_settings):
        from src.config import Settings

        settings = Settings()
        mock_get_settings.return_value = settings

        diagnostic = {
            "status": "PROBE",
            "probe_node": "M7.SDS.05",
            "questions": ["q_m7_1"],
            "message": "Kiểm tra thêm",
        }
        res = build_offline_response("student_123", diagnostic)
        assert "chế độ offline" in res
        assert "Vận dụng tính chất" in res
        assert "Tìm x trong tỉ lệ thức" in res
        assert "Gợi ý" in res

    @patch("src.config.get_settings")
    def test_build_offline_response_complete(self, mock_get_settings):
        from src.config import Settings

        settings = Settings()
        mock_get_settings.return_value = settings

        diagnostic = {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {
                "id": "M7.SDS.05",
                "mo_ta": "Tỉ lệ thức",
                "lop": 7,
            },
            "confidence": 0.9,
            "suggested_path": ["M7.SDS.05"],
        }
        res = build_offline_response("student_123", diagnostic)
        assert "chế độ offline" in res
        assert "Tỉ lệ thức" in res
        assert "Tìm x trong tỉ lệ thức" in res

    @pytest.mark.asyncio
    @patch("src.agents.nodes.respond_node.get_llm")
    @patch("src.config.get_settings")
    async def test_respond_node_offline_fallback(self, mock_get_settings, mock_get_llm):
        from src.config import Settings

        settings = Settings()
        mock_get_settings.return_value = settings

        mock_get_llm.side_effect = RuntimeError("LLM connection timeout")

        diagnostic = {
            "status": "DIAGNOSIS_COMPLETE",
            "weakness_flag": True,
            "root_cause": {
                "id": "M7.SDS.05",
                "mo_ta": "Tỉ lệ thức",
                "lop": 7,
            },
            "confidence": 0.9,
            "suggested_path": ["M7.SDS.05"],
        }
        state = {
            "query": "giúp em với",
            "context": "Context",
            "metadata": {
                "intent": "academic",
                "diagnostic": diagnostic,
            },
            "student_profile": {
                "student_id": "student_123",
            },
        }

        from src.agents.nodes.respond_node import respond_node

        res = await respond_node(state)
        assert "response" in res
        assert "chế độ offline" in res.get("response", "")
        assert res.get("metadata", {}).get("offline_fallback") is True
