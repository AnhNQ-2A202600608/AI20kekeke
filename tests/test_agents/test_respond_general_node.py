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
