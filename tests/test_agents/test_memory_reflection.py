from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.graph import agent, check_reflection
from src.agents.nodes.pedagogical_reflection_node import pedagogical_reflection_node
from src.agents.nodes.respond_node import respond_node


@pytest.mark.asyncio
async def test_pedagogical_reflection_valid_socratic():
    # A valid Socratic hint that does not leak direct code
    state = {
        "query": "Làm thế nào để cấu hình port trong Docker?",
        "response": "Hãy xem xét cách ánh xạ cổng máy chủ vật lý vào cổng container bằng tham số `-p`. Bạn có thể đoán xem cổng nào đại diện cho máy vật lý không?",
        "reflection_attempts": 0,
    }

    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = SimpleNamespace(content='{"is_valid": true, "feedback": ""}')

    with patch("src.agents.nodes.pedagogical_reflection_node.get_llm", return_value=mock_llm):
        result = await pedagogical_reflection_node(state)
    assert result["reflection_feedback"] is None


@pytest.mark.asyncio
async def test_pedagogical_reflection_invalid_leaks_code():
    # An invalid response that leaks direct code blocks
    state = {
        "query": "Viết hộ tôi docker-compose.yml mẫu cho postgres",
        "response": "Đây là code của bạn:\n```yaml\nversion: '3.8'\nservices:\n  db:\n    image: postgres\n    ports:\n      - '5432:5432'\n```",
        "reflection_attempts": 0,
    }

    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = SimpleNamespace(
        content='{"is_valid": false, "feedback": "Câu trả lời chứa đoạn code hoàn chỉnh giải quyết yêu cầu bài tập. Hãy yêu cầu AI viết lại dạng pseudocode gợi ý."}'
    )

    with patch("src.agents.nodes.pedagogical_reflection_node.get_llm", return_value=mock_llm):
        result = await pedagogical_reflection_node(state)

    # The reflection node should detect the code block leak and return criticism feedback
    assert result["reflection_feedback"] is not None
    assert (
        "code" in result["reflection_feedback"].lower()
        or "vi phạm" in result["reflection_feedback"].lower()
        or "sửa" in result["reflection_feedback"].lower()
        or "yêu cầu" in result["reflection_feedback"].lower()
    )


def test_check_reflection_forces_academic_integrity_risk_through_critic():
    state = {
        "response": "I can help with steps instead of a full solution.",
        "metadata": {"intent": "academic", "academic_integrity_risk": True},
    }

    assert check_reflection(state) == "pedagogical_reflection"


@pytest.mark.asyncio
async def test_pedagogical_reflection_retry_limit_returns_safe_fallback_for_integrity_risk():
    state = {
        "query": "Write a full React component for my assignment.",
        "response": "```jsx\nexport default function UserList() { return null; }\n```",
        "reflection_attempts": 2,
        "metadata": {"academic_integrity_risk": True},
    }

    result = await pedagogical_reflection_node(state)

    assert result["reflection_feedback"] is None
    assert "can't write a complete assignment solution" in result["response"]
    assert "```" not in result["response"]


@pytest.mark.asyncio
async def test_respond_node_returns_safe_fallback_for_integrity_risk_without_rag():
    state = {
        "query": "Write a full React component for my assignment.",
        "context": "No official course slide was retrieved for this academic-integrity-risk request.",
        "metadata": {
            "intent": "academic",
            "academic_integrity_risk": True,
            "retrieved_slides": [],
            "elo": 1300,
            "bkt": 0.25,
            "weakness": False,
            "active_quiz": False,
        },
    }

    result = await respond_node(state)

    assert "can't write a complete assignment solution" in result["response"]
    assert "```" not in result["response"]
    assert result["metadata"]["citation_validation"]["is_valid"] is True


@pytest.mark.asyncio
async def test_agent_graph_with_history_and_facts():
    # Test the compiled graph with custom history and facts
    state = {
        "query": "Tôi là ai?",
        "chat_history": [
            {"role": "student", "content": "Tên tôi là Nam"},
            {"role": "assistant", "content": "Rất vui được gặp Nam!"},
        ],
        "long_term_facts": {"name": "Nam", "prefer_language": "Python"},
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
    }
    result = await agent.ainvoke(state)
    assert "response" in result
    assert isinstance(result["response"], str)
