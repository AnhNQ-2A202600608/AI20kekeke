import os
from unittest.mock import MagicMock, patch

import pytest

from src.pipeline.ingest.rag_ingestion import parse_pdf_slides
from src.services.citation_validator import CitationValidator


@patch("fitz.open")
def test_parse_pdf_slides(mock_fitz_open):
    # Mock fitz document and pages
    mock_doc = MagicMock()
    mock_page1 = MagicMock()
    mock_page1.get_text.return_value = "Page 1 Text Content"
    mock_page1.get_pixmap.return_value.tobytes.return_value = b"mock_png_bytes_1"

    mock_page2 = MagicMock()
    mock_page2.get_text.return_value = "Page 2 Text Content"
    mock_page2.get_pixmap.return_value.tobytes.return_value = b"mock_png_bytes_2"

    mock_doc.__len__.return_value = 2
    mock_doc.__getitem__.side_effect = [mock_page1, mock_page2]
    mock_fitz_open.return_value = mock_doc

    slides = parse_pdf_slides("dummy.pdf")
    assert len(slides) == 2
    assert slides[0]["slide_number"] == 1
    assert slides[0]["content"] == "Page 1 Text Content"
    assert slides[0]["image_bytes"] == b"mock_png_bytes_1"
    assert slides[1]["slide_number"] == 2
    assert slides[1]["content"] == "Page 2 Text Content"
    assert slides[1]["image_bytes"] == b"mock_png_bytes_2"


def test_citation_extraction():
    text = "Theo tài liệu [Day10 Data Observability, Slide 5], data quality rất quan trọng. Xem thêm tại [Intro to AI, slide 12]."
    citations = CitationValidator.extract_citations(text)

    assert len(citations) == 2
    assert citations[0] == ("Day10 Data Observability", 5)
    assert citations[1] == ("Intro to AI", 12)


def test_citation_validation_valid():
    text = "Freshness là một pillar quan trọng [Day10 Data Observability, Slide 5]."
    retrieved_slides = [
        {"document_name": "Day10 Data Observability.md", "slide_number": 5, "content": "Freshness - Data is up to date"}
    ]

    result = CitationValidator.validate_citations(text, retrieved_slides)
    assert result["is_valid"] is True
    assert len(result["invalid_citations"]) == 0
    assert len(result["valid_citations"]) == 1
    assert "[Day10 Data Observability, Slide 5]" in result["cleaned_text"]


def test_citation_validation_invalid():
    text = "Freshness là một pillar quan trọng [Day10 Data Observability, Slide 5], nhưng cũng cần xem [Intro to AI, Slide 12]."
    retrieved_slides = [
        {"document_name": "Day10 Data Observability.md", "slide_number": 5, "content": "Freshness - Data is up to date"}
    ]

    result = CitationValidator.validate_citations(text, retrieved_slides)
    assert result["is_valid"] is False
    assert len(result["invalid_citations"]) == 1
    assert result["invalid_citations"][0] == ("Intro to AI", 12)
    assert len(result["valid_citations"]) == 1

    # Check that invalid citation is cleaned/removed from text
    assert "[Intro to AI, Slide 12]" not in result["cleaned_text"]
    assert "[Day10 Data Observability, Slide 5]" in result["cleaned_text"]
    assert "lược bỏ do không trùng khớp" in result["cleaned_text"]


def test_citation_validation_pdf():
    text = "Freshness là một pillar quan trọng [Day10 Data Observability, Slide 5]."
    retrieved_slides = [
        {
            "document_name": "Day10 Data Observability.pdf",
            "slide_number": 5,
            "content": "Freshness - Data is up to date",
        }
    ]

    result = CitationValidator.validate_citations(text, retrieved_slides)
    assert result["is_valid"] is True
    assert len(result["invalid_citations"]) == 0
    assert len(result["valid_citations"]) == 1
    assert "[Day10 Data Observability, Slide 5]" in result["cleaned_text"]


@pytest.mark.asyncio
async def test_keyword_search_slides_no_keywords():
    from src.services.rag import RAGService

    service = RAGService()
    results = await service._keyword_search_slides("và hoặc thì", 2)
    assert results == []


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_keyword_search_slides_success(mock_get):
    from src.services.rag import RAGService

    service = RAGService()
    service.supabase_url = "https://mock.supabase.co"
    service.supabase_anon_key = "mock_key"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "document_name": "Day 3 React.pdf",
            "slide_number": 5,
            "content": "React state and hooks discussion",
            "image_url": "https://image.url/5.png",
        }
    ]
    mock_get.return_value = mock_response

    results = await service._keyword_search_slides("hỏi về React state", 2)
    assert len(results) == 1
    assert results[0]["document_name"] == "Day 3 React.pdf"
    assert results[0]["slide_number"] == 5
    assert results[0]["similarity"] == 0.35


@pytest.mark.asyncio
@patch("httpx.AsyncClient.get")
async def test_fetch_neighboring_slides(mock_get):
    from src.services.rag import RAGService

    service = RAGService()
    service.supabase_url = "https://mock.supabase.co"
    service.supabase_anon_key = "mock_key"

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = [
        {
            "document_name": "Day 3 React.pdf",
            "slide_number": 4,
            "content": "React introduction",
            "image_url": "https://image.url/4.png",
        },
        {
            "document_name": "Day 3 React.pdf",
            "slide_number": 6,
            "content": "React hooks in depth",
            "image_url": "https://image.url/6.png",
        },
    ]
    mock_get.return_value = mock_response

    results = await service._fetch_neighboring_slides([("Day 3 React.pdf", 4), ("Day 3 React.pdf", 6)])
    assert len(results) == 2
    assert results[0]["slide_number"] == 4
    assert results[0]["is_neighbor"] is True
    assert results[1]["slide_number"] == 6
    assert results[1]["is_neighbor"] is True


def test_dedupe_logical_document_versions():
    from src.services.rag import RAGService

    service = RAGService()
    slides = [
        {
            "document_name": "1-day08-rag-pipeline-v2.pdf",
            "slide_number": 10,
            "content": "RAG v2",
            "similarity": 0.473,
        },
        {
            "document_name": "day08-rag-pipeline-v3.pdf",
            "slide_number": 10,
            "content": "RAG v3 duplicate",
            "similarity": 0.472,
        },
        {
            "document_name": "day08-rag-pipeline-v3.pdf",
            "slide_number": 11,
            "content": "Neighbor",
            "similarity": 0.0,
        },
    ]

    results = service._dedupe_logical_versions(slides)

    assert [(item["document_name"], item["slide_number"]) for item in results] == [
        ("1-day08-rag-pipeline-v2.pdf", 10),
        ("day08-rag-pipeline-v3.pdf", 11),
    ]


def test_global_rag_fallback_is_explicit_opt_in(monkeypatch):
    from src.services.rag import RAGService

    monkeypatch.delenv("RAG_ENABLE_GLOBAL_FALLBACK", raising=False)

    service = RAGService()

    assert service._enable_global_fallback is False


def test_rag_cache_key_separates_fallback_modes(monkeypatch):
    from src.services.rag import RAGService

    monkeypatch.delenv("RAG_ENABLE_KEYWORD_FALLBACK", raising=False)
    monkeypatch.delenv("RAG_ENABLE_GLOBAL_FALLBACK", raising=False)
    service = RAGService()

    default_key = service._make_cache_key(
        "Explain RAG",
        course_id="course-1",
        concept_id="concept-1",
        mode="mentor",
    )
    service._enable_global_fallback = True
    global_fallback_key = service._make_cache_key(
        "Explain RAG",
        course_id="course-1",
        concept_id="concept-1",
        mode="mentor",
    )
    service._enable_keyword_fallback = False
    keyword_fallback_disabled_key = service._make_cache_key(
        "Explain RAG",
        course_id="course-1",
        concept_id="concept-1",
        mode="mentor",
    )

    assert default_key != global_fallback_key
    assert global_fallback_key != keyword_fallback_disabled_key


@pytest.mark.asyncio
async def test_rag_missing_supabase_config_fails_in_production(monkeypatch):
    from src.services.rag import RAGDependencyError, RAGService

    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    service = RAGService()
    service.settings.app_env = "production"
    service.supabase_url = ""
    service.supabase_api_key = ""

    with pytest.raises(RAGDependencyError, match="RAG retrieval is unavailable"):
        await service.aretrieve_relevant_slides("Explain RAG")


@pytest.mark.asyncio
@patch("httpx.AsyncClient.post")
@patch("langchain_openai.OpenAIEmbeddings.embed_query")
async def test_rag_vector_rpc_failure_is_dependency_error(mock_embed, mock_post, monkeypatch):
    from src.services.rag import RAGDependencyError, RAGService

    monkeypatch.delenv("PYTEST_CURRENT_TEST", raising=False)
    service = RAGService()
    service.settings.app_env = "development"
    service.supabase_url = "https://mock.supabase.co"
    service.supabase_api_key = "mock_key"
    mock_embed.return_value = [0.1] * 1536
    mock_response = MagicMock()
    mock_response.status_code = 503
    mock_response.text = "rpc unavailable"
    mock_post.return_value = mock_response

    with pytest.raises(RAGDependencyError, match="RAG vector search failed"):
        await service.aretrieve_relevant_slides("Explain vector search outage", match_count=2)


@pytest.mark.asyncio
@patch("src.services.rag.RAGService._keyword_search_slides")
@patch("src.services.rag.RAGService._fetch_neighboring_slides")
@patch("httpx.AsyncClient.post")
@patch("langchain_openai.OpenAIEmbeddings.embed_query")
async def test_aretrieve_relevant_slides_full_flow(mock_embed, mock_post, mock_fetch_neighbors, mock_keyword_search):
    from src.services.rag import RAGService

    with patch.dict(
        os.environ,
        {
            "RAG_ENABLE_KEYWORD_SEARCH": "true",
            "RAG_ENABLE_NEIGHBOR_SLIDES": "true",
        },
    ):
        service = RAGService()
        service.supabase_url = "https://mock.supabase.co"
        service.supabase_anon_key = "mock_key"

        # 1. Mock embedding query
        mock_embed.return_value = [0.1] * 1536

        # 2. Mock vector search post response
        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = [
            {
                "document_name": "Day 3 React.pdf",
                "slide_number": 5,
                "content": "React state and hooks discussion",
                "similarity": 0.80,
                "image_url": "https://image.url/5.png",
            }
        ]
        mock_post.return_value = mock_post_resp

        # 3. Mock keyword search results
        mock_keyword_search.return_value = [
            {
                "document_name": "Day 3 React.pdf",
                "slide_number": 5,
                "content": "React state and hooks discussion",
                "similarity": 0.35,
                "image_url": "https://image.url/5.png",
            },
            {
                "document_name": "Day 3 React.pdf",
                "slide_number": 10,
                "content": "Other keyword match",
                "similarity": 0.35,
                "image_url": "https://image.url/10.png",
            },
        ]

        # 4. Mock neighbor fetching
        mock_fetch_neighbors.return_value = [
            {
                "document_name": "Day 3 React.pdf",
                "slide_number": 4,
                "content": "React state neighbor prev",
                "similarity": 0.0,
                "image_url": "https://image.url/4.png",
                "is_neighbor": True,
            },
            {
                "document_name": "Day 3 React.pdf",
                "slide_number": 6,
                "content": "React state neighbor next",
                "similarity": 0.0,
                "image_url": "https://image.url/6.png",
                "is_neighbor": True,
            },
        ]

        if "PYTEST_CURRENT_TEST" in os.environ:
            del os.environ["PYTEST_CURRENT_TEST"]
        service.settings.app_env = "dev"
        results = await service.aretrieve_relevant_slides("React state", match_count=2)

    # Best matches are at the front: page 5 (boosted) and page 10
    # Neighbors appended at the end: page 4 and page 6
    assert len(results) == 4

    # Check best match (boosted similarity: 0.80 + 0.05 = 0.85)
    assert results[0]["slide_number"] == 5
    assert abs(results[0]["similarity"] - 0.85) < 1e-5
    assert "is_neighbor" not in results[0]

    # Check second best match
    assert results[1]["slide_number"] == 10
    assert results[1]["similarity"] == 0.35
    assert "is_neighbor" not in results[1]

    # Check neighbors appended at the end
    assert results[2]["slide_number"] == 4
    assert results[2]["is_neighbor"] is True
    assert results[3]["slide_number"] == 6
    assert results[3]["is_neighbor"] is True


@pytest.mark.asyncio
@patch("src.services.rag.RAGService._keyword_search_slides")
@patch("src.services.rag.RAGService._fetch_neighboring_slides")
@patch("httpx.AsyncClient.post")
@patch("langchain_openai.OpenAIEmbeddings.embed_query")
async def test_aretrieve_relevant_slides_skips_low_similarity_neighbors(
    mock_embed,
    mock_post,
    mock_fetch_neighbors,
    mock_keyword_search,
):
    from src.services.rag import RAGService

    with patch.dict(
        os.environ,
        {
            "RAG_ENABLE_KEYWORD_SEARCH": "false",
            "RAG_ENABLE_NEIGHBOR_SLIDES": "true",
            "RAG_NEIGHBOR_MIN_SIMILARITY": "0.65",
        },
    ):
        service = RAGService()
        service.supabase_url = "https://mock.supabase.co"
        service.supabase_anon_key = "mock_key"
        service.settings.app_env = "dev"
        mock_embed.return_value = [0.1] * 1536

        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = [
            {
                "document_name": "1-day08-rag-pipeline-v2.pdf",
                "slide_number": 10,
                "content": "RAG overview",
                "similarity": 0.473,
                "image_url": "https://image.url/10.png",
            }
        ]
        mock_post.return_value = mock_post_resp

        if "PYTEST_CURRENT_TEST" in os.environ:
            del os.environ["PYTEST_CURRENT_TEST"]
        results = await service.aretrieve_relevant_slides("rag là gì", match_count=2)

    assert len(results) == 1
    assert results[0]["slide_number"] == 10
    mock_fetch_neighbors.assert_not_awaited()


@pytest.mark.asyncio
@patch("src.services.rag.RAGService._keyword_search_slides")
@patch("src.services.rag.RAGService._fetch_neighboring_slides")
@patch("httpx.AsyncClient.post")
@patch("langchain_openai.OpenAIEmbeddings.embed_query")
async def test_aretrieve_relevant_slides_fetches_same_document_neighbors_after_dedupe(
    mock_embed,
    mock_post,
    mock_fetch_neighbors,
    mock_keyword_search,
):
    from src.services.rag import RAGService

    with patch.dict(
        os.environ,
        {
            "RAG_ENABLE_KEYWORD_SEARCH": "false",
            "RAG_ENABLE_NEIGHBOR_SLIDES": "true",
            "RAG_NEIGHBOR_MIN_SIMILARITY": "0.42",
        },
    ):
        service = RAGService()
        service.supabase_url = "https://mock.supabase.co"
        service.supabase_anon_key = "mock_key"
        service.settings.app_env = "dev"
        mock_embed.return_value = [0.1] * 1536

        mock_post_resp = MagicMock()
        mock_post_resp.status_code = 200
        mock_post_resp.json.return_value = [
            {
                "document_name": "1-day08-rag-pipeline-v2.pdf",
                "slide_number": 10,
                "content": "RAG overview",
                "similarity": 0.473,
                "image_url": "https://image.url/10.png",
            },
            {
                "document_name": "day08-rag-pipeline-v3.pdf",
                "slide_number": 10,
                "content": "Duplicate RAG overview",
                "similarity": 0.472,
                "image_url": "https://image.url/v3-10.png",
            },
        ]
        mock_post.return_value = mock_post_resp
        mock_fetch_neighbors.return_value = [
            {
                "document_name": "1-day08-rag-pipeline-v2.pdf",
                "slide_number": 9,
                "content": "Previous context",
                "similarity": 0.0,
                "image_url": "https://image.url/9.png",
                "is_neighbor": True,
            },
            {
                "document_name": "1-day08-rag-pipeline-v2.pdf",
                "slide_number": 11,
                "content": "Next context",
                "similarity": 0.0,
                "image_url": "https://image.url/11.png",
                "is_neighbor": True,
            },
        ]

        if "PYTEST_CURRENT_TEST" in os.environ:
            del os.environ["PYTEST_CURRENT_TEST"]
        results = await service.aretrieve_relevant_slides("rag là gì", match_count=2)

    assert [(item["document_name"], item["slide_number"]) for item in results] == [
        ("1-day08-rag-pipeline-v2.pdf", 10),
        ("1-day08-rag-pipeline-v2.pdf", 9),
        ("1-day08-rag-pipeline-v2.pdf", 11),
    ]
