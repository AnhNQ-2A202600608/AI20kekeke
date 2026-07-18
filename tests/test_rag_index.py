"""Tests for chunking OCR'd Markdown and the local TF-IDF vector index/query."""

from __future__ import annotations

from src.modules.rag import pdf_ingest
from src.modules.rag.chunking import chunk_markdown_text, chunk_page_file, collect_chunks
from src.modules.rag.index import build_index, load_index, query_index, save_index


def _write_page(processed_dir, slug, page_number, book_title, grade, text, source="text_layer"):
    pages_dir = processed_dir / slug / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)
    md = pdf_ingest.page_to_markdown(
        book_title=book_title, grade=grade, page_number=page_number, text=text, source=source
    )
    (pages_dir / f"page_{page_number:03d}.md").write_text(md, encoding="utf-8")


class TestChunkMarkdownText:
    def test_short_text_stays_a_single_chunk(self):
        chunks = chunk_markdown_text("Một đoạn văn ngắn.", chunk_chars=1000, overlap_chars=100)
        assert chunks == ["Một đoạn văn ngắn."]

    def test_empty_text_produces_no_chunks(self):
        assert chunk_markdown_text("", chunk_chars=1000, overlap_chars=100) == []

    def test_long_text_is_split_with_overlap(self):
        paragraph = "Việt Nam là một quốc gia có bề dày lịch sử. " * 50
        chunks = chunk_markdown_text(paragraph, chunk_chars=200, overlap_chars=50)
        assert len(chunks) > 1
        assert all(len(c) <= 250 for c in chunks)  # boundary search may slightly exceed target


class TestChunkPageFile:
    def test_extracts_metadata_from_front_matter(self, tmp_path):
        _write_page(tmp_path, "sgk-6", 3, "SGK Lịch sử 6", 6, "Nội dung bài học chương một.")
        page_path = tmp_path / "sgk-6" / "pages" / "page_003.md"

        chunks = chunk_page_file(page_path, book_slug="sgk-6", chunk_chars=1000, overlap_chars=100)

        assert len(chunks) == 1
        assert chunks[0].book_slug == "sgk-6"
        assert chunks[0].book_title == "SGK Lịch sử 6"
        assert chunks[0].grade == 6
        assert chunks[0].page == 3
        assert "Nội dung bài học" in chunks[0].text

    def test_empty_page_produces_no_chunks(self, tmp_path):
        _write_page(tmp_path, "sgk-6", 1, "SGK Lịch sử 6", 6, "")
        page_path = tmp_path / "sgk-6" / "pages" / "page_001.md"
        chunks = chunk_page_file(page_path, book_slug="sgk-6", chunk_chars=1000, overlap_chars=100)
        assert chunks == []


class TestCollectChunks:
    def test_walks_all_books_and_pages(self, tmp_path):
        _write_page(tmp_path, "sgk-6", 1, "SGK 6", 6, "Chương một lớp sáu.")
        _write_page(tmp_path, "sgk-7", 1, "SGK 7", 7, "Chương một lớp bảy.")

        chunks = collect_chunks(tmp_path, chunk_chars=1000, overlap_chars=100)
        slugs = {c.book_slug for c in chunks}
        assert slugs == {"sgk-6", "sgk-7"}

    def test_missing_processed_dir_returns_empty(self, tmp_path):
        missing_dir = tmp_path / "does-not-exist"
        assert collect_chunks(missing_dir, chunk_chars=1000, overlap_chars=100) == []


class TestVectorIndexQuery:
    def test_query_ranks_relevant_chunk_first(self, tmp_path):
        _write_page(
            tmp_path,
            "sgk-6",
            10,
            "SGK Lịch sử 6",
            6,
            "Vua Hùng Vương là người sáng lập nhà nước Văn Lang thời kỳ dựng nước.",
        )
        _write_page(
            tmp_path,
            "sgk-6",
            20,
            "SGK Lịch sử 6",
            6,
            "Dãy núi Trường Sơn trải dài qua nhiều tỉnh miền Trung Việt Nam.",
        )
        chunks = collect_chunks(tmp_path, chunk_chars=1000, overlap_chars=100)
        index = build_index(chunks)

        results = query_index(index, "Văn Lang do ai sáng lập?", top_k=2)

        assert results
        assert results[0]["page"] == 10
        assert results[0]["score"] > 0

    def test_query_with_no_matching_terms_returns_empty(self, tmp_path):
        _write_page(tmp_path, "sgk-6", 1, "SGK 6", 6, "Nội dung về Vua Hùng Vương.")
        chunks = collect_chunks(tmp_path, chunk_chars=1000, overlap_chars=100)
        index = build_index(chunks)

        results = query_index(index, "xyzxyz khongtontai", top_k=5)
        assert results == []

    def test_save_and_load_round_trip(self, tmp_path):
        _write_page(tmp_path, "sgk-6", 1, "SGK 6", 6, "Nội dung về Vua Hùng Vương dựng nước.")
        chunks = collect_chunks(tmp_path, chunk_chars=1000, overlap_chars=100)
        index = build_index(chunks)

        index_path = tmp_path / "index.json"
        save_index(index, index_path)
        loaded = load_index(index_path)

        results = query_index(loaded, "Hùng Vương", top_k=1)
        assert results
        assert results[0]["book_slug"] == "sgk-6"
