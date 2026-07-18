from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import pytest

from src.agents.nodes.analyze_node import (
    analyze_node,
    classify_query_intent,
    is_academic_integrity_risk,
    is_academic_query_heuristic,
    is_general_query_heuristic,
)


def test_is_general_query_heuristic():
    # General queries (should return True)
    assert is_general_query_heuristic("chào bạn") is True
    assert is_general_query_heuristic("bạn biết gì về tôi") is True
    assert is_general_query_heuristic("bạn có thể làm gì") is True
    assert is_general_query_heuristic("tôi là ai") is True
    assert is_general_query_heuristic("mình tên là gì") is True

    # Academic queries (should return False)
    assert is_general_query_heuristic("RAG là gì") is False
    assert is_general_query_heuristic("so sánh ETL và ELT") is False
    assert is_general_query_heuristic("Docker compose là gì") is False


def test_is_academic_query_heuristic():
    assert is_academic_query_heuristic("RAG khác fine-tuning thế nào?") is True
    assert is_academic_query_heuristic("giải thích vector database trong production RAG") is True
    assert is_academic_query_heuristic("nhắc lại embedding và retrieval") is True
    assert is_academic_query_heuristic("bạn tên là gì") is False


@pytest.mark.asyncio
async def test_classify_query_intent_academic():
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = SimpleNamespace(content="academic")

    with patch("src.services.llm.get_llm", return_value=mock_llm):
        intent = await classify_query_intent("giải thích Docker Compose", [])
    assert intent == "academic"


@pytest.mark.asyncio
async def test_classify_query_intent_general():
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = SimpleNamespace(content="general")

    with patch("src.services.llm.get_llm", return_value=mock_llm):
        intent = await classify_query_intent("bạn tên là gì", [])
    assert intent == "general"


def test_is_academic_integrity_risk_detects_assignment_code_request():
    query = (
        "Write a full React component that fetches data from API "
        "'https://api.example.com/users' and displays it in a list. "
        "I need this for my assignment."
    )

    assert is_academic_integrity_risk(query) is True
    assert is_academic_integrity_risk("What is React useEffect?") is False


@pytest.mark.asyncio
async def test_analyze_node_integrity_risk_does_not_fallback_to_general_when_rag_empty():
    state = {
        "query": (
            "Write a full React component that fetches data from API "
            "'https://api.example.com/users' and displays it in a list. "
            "I need this for my assignment."
        ),
        "student_profile": {
            "elo_score": 1300.0,
            "bkt_mastery_probability": 0.35,
            "weakness_flag": False,
            "mastery_state": "learning",
        },
        "concept_id": "general",
    }

    with (
        patch("src.agents.nodes.analyze_node.classify_query_intent", new_callable=AsyncMock) as mock_classifier,
        patch("src.services.rag.RAGService.aretrieve_relevant_slides", return_value=[]),
    ):
        result = await analyze_node(state)

    mock_classifier.assert_not_called()
    assert result["metadata"]["intent"] == "academic"
    assert result["metadata"]["academic_integrity_risk"] is True
    assert result["metadata"]["retrieved_slides"] == []
    assert "academic-integrity-risk" in result["context"]


@pytest.mark.asyncio
async def test_analyze_node_general_intent():
    # Test analyze_node with general query, should bypass RAG retrieval
    state = {
        "query": "chào sofi",
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
        "concept_id": "general",
    }

    # Run analyze_node, it should detect 'general' intent and set empty slides
    result = await analyze_node(state)
    assert result["metadata"]["intent"] == "general"
    assert result["metadata"]["retrieved_slides"] == []
    assert result["context"] == ""


@pytest.mark.asyncio
async def test_analyze_node_academic_heuristic_bypasses_llm_classifier():
    state = {
        "query": "RAG khác fine-tuning thế nào?",
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
        "concept_id": "general",
    }
    mock_slides = [
        {
            "document_name": "day05-rag.pdf",
            "slide_number": 7,
            "content": "RAG retrieves external context while fine-tuning changes model weights.",
            "similarity": 0.8,
        }
    ]

    with (
        patch("src.agents.nodes.analyze_node.classify_query_intent", new_callable=AsyncMock) as mock_classifier,
        patch("src.services.rag.RAGService.aretrieve_relevant_slides", return_value=mock_slides),
    ):
        result = await analyze_node(state)

    mock_classifier.assert_not_called()
    assert result["metadata"]["intent"] == "academic"
    assert result["metadata"]["retrieved_slides"] == mock_slides
    assert "RAG retrieves external context" in result["context"]


@pytest.mark.asyncio
async def test_analyze_node_selected_concept_bypasses_llm_classifier():
    state = {
        "query": "giải thích lại nội dung bài này",
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
        "concept_id": "day05-rag",
    }
    mock_slides = [
        {
            "document_name": "day05-rag.pdf",
            "slide_number": 3,
            "content": "Selected concept content should be retrieved without intent classification.",
            "similarity": 0.82,
        }
    ]

    with (
        patch("src.agents.nodes.analyze_node.classify_query_intent", new_callable=AsyncMock) as mock_classifier,
        patch("src.services.rag.RAGService.aretrieve_relevant_slides", return_value=mock_slides),
    ):
        result = await analyze_node(state)

    mock_classifier.assert_not_called()
    assert result["metadata"]["intent"] == "academic"
    assert result["metadata"]["retrieved_slides"] == mock_slides


@pytest.mark.asyncio
async def test_analyze_node_ambiguous_general_concept_uses_llm_classifier():
    state = {
        "query": "giải thích mô hình này theo cách dễ hiểu",
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
        "concept_id": "general",
    }

    with patch(
        "src.agents.nodes.analyze_node.classify_query_intent", new_callable=AsyncMock, return_value="general"
    ) as mock_classifier:
        result = await analyze_node(state)

    mock_classifier.assert_awaited_once()
    assert result["metadata"]["intent"] == "general"
    assert result["metadata"]["retrieved_slides"] == []


def test_citation_validation_general_intent():
    from src.services.citation_validator import CitationValidator

    text = "Xin chào! Mình có thể trả lời bình thường mà không cần tài liệu."
    retrieved_slides = []

    result = CitationValidator.validate_citations(text, retrieved_slides, query="bạn có thể làm gì", intent="general")
    assert result["is_valid"] is True
    assert result["cleaned_text"] == text
    assert len(result["invalid_citations"]) == 0


@pytest.mark.asyncio
async def test_analyze_node_low_similarity_fallback():
    # Test analyze_node with academic query but RAG returns low similarity slides.
    # It should downgrade intent to 'general' and clear slides.
    state = {
        "query": "Phân biệt sự khác nhau giữa cơ sở dữ liệu đồ thị và cơ sở dữ liệu quan hệ",
        "student_profile": {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "mastery_state": "not_started",
        },
        "concept_id": "day2-basics",
    }

    mock_slides = [
        {
            "document_name": "day02-basics.pdf",
            "slide_number": 5,
            "content": "PostgreSQL database overview",
            "similarity": 0.35,
        }
    ]

    with patch("src.services.rag.RAGService.aretrieve_relevant_slides", return_value=mock_slides):
        result = await analyze_node(state)

    assert result["metadata"]["intent"] == "general"
    assert result["metadata"]["retrieved_slides"] == []
    assert result["context"] == ""


@pytest.mark.asyncio
async def test_classify_query_intent_out_of_syllabus():
    mock_llm = AsyncMock()
    mock_llm.ainvoke.return_value = SimpleNamespace(content="general")

    with patch("src.services.llm.get_llm", return_value=mock_llm):
        intent = await classify_query_intent("Phân biệt Graph Database và Relational Database", [])
    assert intent == "general"
