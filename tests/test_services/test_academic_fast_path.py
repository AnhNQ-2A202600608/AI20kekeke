from src.services.academic_fast_path import extractive_definition_response


def test_extractive_definition_response_uses_top_slide_citation():
    slides = [
        {
            "document_name": "1-day08-rag-pipeline-v2.pdf",
            "slide_number": 10,
            "content": "RAG — Retrieval-Augmented Generation — kỹ thuật kết hợp truy xuất thông tin với sinh ngôn ngữ.",
            "similarity": 0.47,
        }
    ]

    response = extractive_definition_response("rag là gì", slides)

    assert response is not None
    assert "RAG là Retrieval-Augmented Generation" in response
    assert "kỹ thuật" in response
    assert "trả lời" in response
    assert "[1-day08-rag-pipeline-v2, Slide 10]" in response


def test_extractive_definition_response_requires_relevant_source():
    slides = [
        {
            "document_name": "day08.pdf",
            "slide_number": 10,
            "content": "RAG overview",
            "similarity": 0.2,
        }
    ]

    assert extractive_definition_response("rag là gì", slides) is None


def test_extractive_definition_response_rejects_diagram_like_slide_text():
    slides = [
        {
            "document_name": "Day 10 Data Pipeline and Data Observability.pdf",
            "slide_number": 12,
            "content": (
                "Data pipeline là gì trong AI stack? Sources → Pipeline → Storage → Serving → Agent "
                "Sources DB API Files Streams → Pipeline ingest transform ETL ELT"
            ),
            "similarity": 0.47,
        }
    ]

    assert extractive_definition_response("data pipeline là gì", slides) is None
