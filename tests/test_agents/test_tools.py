from unittest.mock import patch

import pytest

from src.agents.tools.tutor_tools import calculate, retrieve_course_material


def test_calculate_success():
    assert calculate.run("2 + 3") == "5"
    assert calculate.run("2 * (3.5 + 4.5)") == "16.0"
    assert calculate.run("10 / 2") == "5.0"
    assert calculate.run("2 ** 3") == "8"


def test_calculate_invalid_expression():
    res = calculate.run("2 + ")
    assert "Lỗi tính toán" in res or "invalid syntax" in res.lower()


def test_calculate_unsafe_expression():
    # Attempting code execution or unsupported operations
    res = calculate.run("__import__('os').system('echo hello')")
    assert "Lỗi tính toán" in res or "không được hỗ trợ" in res.lower()

    res = calculate.run("import os; os.system('ls')")
    assert "Lỗi tính toán" in res

    res = calculate.run("x = 5")
    assert "Lỗi tính toán" in res


@pytest.mark.asyncio
async def test_retrieve_course_material_async_success():
    mock_slides = [
        {
            "document_name": "day01.pdf",
            "slide_number": 2,
            "content": "This is sample content for vector databases.",
            "similarity": 0.95,
        }
    ]

    with (
        patch("src.services.rag.RAGService.aretrieve_relevant_slides", return_value=mock_slides) as mock_aretrieve,
        patch("src.services.rag.RAGService.format_context", return_value="Formatted context from day01.pdf slide 2"),
    ):
        # Test retrieve_course_material
        res = retrieve_course_material.run(
            {"query": "vector databases", "concept_id": "concept-123", "course_id": "course-456"}
        )

        assert "Formatted context from day01.pdf slide 2" in res
        mock_aretrieve.assert_called_once_with("vector databases", concept_id="concept-123", course_id="course-456")


def test_retrieve_course_material_sync_fallback():
    mock_slides = [
        {
            "document_name": "day02.pdf",
            "slide_number": 5,
            "content": "This is sample content for LangGraph.",
            "similarity": 0.85,
        }
    ]

    # Force a running loop to be absent or simulate sync environment
    with (
        patch("src.services.rag.RAGService.retrieve_relevant_slides", return_value=mock_slides) as mock_retrieve,
        patch("src.services.rag.RAGService.format_context", return_value="Sync formatted context"),
        patch("asyncio.get_running_loop", side_effect=RuntimeError("No running event loop")),
    ):
        res = retrieve_course_material.run(
            {"query": "LangGraph", "concept_id": "concept-999", "course_id": "course-888"}
        )

        assert "Sync formatted context" in res
        mock_retrieve.assert_called_once_with("LangGraph", concept_id="concept-999", course_id="course-888")
