"""Tests for RAGCapability (index build + query actions over already-processed Markdown).

Deliberately does not touch PDFs/OCR — that's covered in test_rag_pdf_ingest.py — this
exercises the fast, synchronous-safe half of the `rag` module that runs through /runs.
"""

from __future__ import annotations

import json

import pytest

from src.modules.rag import pdf_ingest
from src.modules.rag.capability import RAGCapability


@pytest.fixture
def processed_dir(tmp_path, monkeypatch):
    monkeypatch.setenv("SGK_DATA_DIR", str(tmp_path))
    pages_dir = tmp_path / "processed" / "sgk-6" / "pages"
    pages_dir.mkdir(parents=True)
    md = pdf_ingest.page_to_markdown(
        book_title="SGK Lịch sử 6",
        grade=6,
        page_number=5,
        text="Vua Hùng Vương lập ra nhà nước Văn Lang, kinh đô đặt tại Phong Châu.",
        source="text_layer",
    )
    (pages_dir / "page_005.md").write_text(md, encoding="utf-8")
    return tmp_path


class TestValidateInput:
    def test_rejects_unknown_action(self):
        cap = RAGCapability()
        errors = cap.validate_input({"action": "delete_everything"})
        assert errors

    def test_query_requires_question(self):
        cap = RAGCapability()
        errors = cap.validate_input({"action": "query"})
        assert any("question" in e for e in errors)

    def test_ingest_index_needs_no_question(self):
        cap = RAGCapability()
        assert cap.validate_input({"action": "ingest_index"}) == []


class TestIngestIndexAction:
    def test_builds_index_artifact_with_stats(self, processed_dir):
        cap = RAGCapability()
        result = cap.execute({"action": "ingest_index"}, [])

        assert result.success is True
        assert result.artifacts[0]["filename"] == "rag_index_stats.json"
        stats = json.loads(result.artifacts[0]["content"])
        assert stats["documents_indexed"] == 1

        index_path = processed_dir / "rag_index" / "index.json"
        assert index_path.exists()

    def test_fails_gracefully_when_nothing_processed_yet(self, tmp_path, monkeypatch):
        monkeypatch.setenv("SGK_DATA_DIR", str(tmp_path))
        cap = RAGCapability()
        result = cap.execute({"action": "ingest_index"}, [])
        assert result.success is False
        assert "ingest_pdfs.py" in result.error


class TestQueryAction:
    def test_query_before_index_built_fails_with_helpful_error(self, processed_dir):
        cap = RAGCapability()
        result = cap.execute({"action": "query", "question": "Văn Lang là gì?"}, [])
        assert result.success is False
        assert "ingest_index" in result.error

    def test_query_returns_relevant_chunk_after_indexing(self, processed_dir):
        cap = RAGCapability()
        cap.execute({"action": "ingest_index"}, [])

        result = cap.execute({"action": "query", "question": "Vua Hùng Vương lập nước gì?"}, [])

        assert result.success is True
        content = result.artifacts[0]["content"]
        assert "Văn Lang" in content
        assert "Trang 5" in content

    def test_query_respects_top_k(self, processed_dir):
        cap = RAGCapability()
        cap.execute({"action": "ingest_index"}, [])
        result = cap.execute({"action": "query", "question": "Vua Hùng Vương", "top_k": 1}, [])
        assert result.success is True
