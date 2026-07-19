from unittest.mock import patch

import pytest

from src.agents.nodes.respond_general_node import respond_general_node
from src.services.chat_fast_path import load_fast_path_rules, static_general_response


def test_static_general_response_capability_question():
    response = static_general_response("xin chào bạn có thể giúp gì cho tôi")

    assert response is not None
    assert "giúp bạn học" in response


def test_static_general_response_is_policy_backed():
    rules = load_fast_path_rules()

    assert rules
    assert all("response" in rule for rule in rules)


@pytest.mark.asyncio
async def test_respond_general_static_response_bypasses_llm():
    state = {
        "query": "xin chào bạn có thể giúp gì cho tôi",
        "metadata": {"intent": "general"},
    }

    with patch("src.agents.nodes.respond_general_node.get_llm") as mock_get_llm:
        result = await respond_general_node(state)

    mock_get_llm.assert_not_called()
    assert result["metadata"]["intent"] == "general"
    assert result["timings_ms"]["llm_first_token"] == 0.0
    assert result["timings_ms"]["llm_total"] == 0.0
    assert "giúp bạn học" in result["response"]


@pytest.mark.asyncio
async def test_respond_general_hybrid_calls_llm():
    # Trường hợp đã có lịch sử trò chuyện
    state_with_history = {
        "query": "xin chào",
        "chat_history": [{"role": "user", "content": "hi"}],
        "metadata": {"intent": "general"},
    }

    # Trường hợp đã có Elo tùy chỉnh
    state_with_custom_elo = {
        "query": "xin chào",
        "student_profile": {"elo_score": 1300.0},
        "metadata": {"intent": "general"},
    }

    with patch("src.agents.nodes.respond_general_node.get_llm") as mock_get_llm:
        from unittest.mock import AsyncMock
        mock_llm_instance = AsyncMock()
        # Mocking astream to return chunks
        async def mock_astream(*args, **kwargs):
            class Chunk:
                content = "Chào bạn! Tôi có thể giúp gì cho bạn?"
            yield Chunk()
        mock_llm_instance.astream = mock_astream
        mock_get_llm.return_value = mock_llm_instance

        # Test với lịch sử chat
        result_history = await respond_general_node(state_with_history)
        assert "Chào bạn" in result_history["response"]
        
        # Test với Elo tùy chỉnh
        result_elo = await respond_general_node(state_with_custom_elo)
        assert "Chào bạn" in result_elo["response"]

        assert mock_get_llm.call_count == 2
