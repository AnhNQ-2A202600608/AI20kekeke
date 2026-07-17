"""Tests for src.modules.rag.pdf_ingest: markdown formatting, manifest generation,
and the text-layer-first/OCR-fallback decision — using a tiny synthetic PDF built
with PyMuPDF so no real Tesseract OCR ever runs in CI (OCR calls are monkeypatched)."""

from __future__ import annotations

import json

import fitz
import pytest

from src.modules.rag import pdf_ingest
from src.modules.rag.ocr import OCRUnavailableError


def _make_pdf(tmp_path, pages_text: list[str | None]):
    """Build a tiny PDF where each entry is either real text (-> text layer) or
    None (-> blank page, i.e. no usable text layer, forcing the OCR fallback path)."""
    doc = fitz.open()
    for text in pages_text:
        page = doc.new_page()
        if text:
            page.insert_text((72, 72), text, fontsize=12)
    path = tmp_path / "SGK Lịch sử và địa lí 6 KNTT.pdf"
    doc.save(path)
    doc.close()
    return path


class TestParseBookMetadata:
    def test_extracts_title_and_grade_from_filename(self, tmp_path):
        pdf_path = _make_pdf(tmp_path, ["nội dung"])
        title, grade = pdf_ingest.parse_book_metadata(pdf_path)
        assert grade == 6
        assert "Lịch sử" in title

    def test_grade_none_when_no_digit_in_filename(self, tmp_path):
        pdf_path = tmp_path / "Sach khong co lop.pdf"
        pdf_path.write_bytes(b"%PDF-1.4\n")
        _, grade = pdf_ingest.parse_book_metadata(pdf_path)
        assert grade is None


class TestPageToMarkdown:
    def test_includes_front_matter_and_heading(self):
        md = pdf_ingest.page_to_markdown(
            book_title="SGK Lịch sử 6",
            grade=6,
            page_number=12,
            text="Nội dung bài học.",
            source="ocr",
        )
        assert 'book: "SGK Lịch sử 6"' in md
        assert "grade: 6" in md
        assert "page: 12" in md
        assert "source: ocr" in md
        assert "# SGK Lịch sử 6 (lớp 6) — Trang 12" in md
        assert "Nội dung bài học." in md

    def test_grade_none_renders_as_null_and_unspecified_label(self):
        md = pdf_ingest.page_to_markdown(
            book_title="Book", grade=None, page_number=1, text="text", source="text_layer"
        )
        assert "grade: null" in md
        assert "không xác định" in md

    def test_empty_body_still_produces_valid_markdown(self):
        md = pdf_ingest.page_to_markdown(
            book_title="Book", grade=6, page_number=1, text="", source="empty"
        )
        assert "# Book (lớp 6) — Trang 1" in md


class TestBuildManifest:
    def test_counts_pages_by_source_and_status(self):
        pages = [
            {"page_number": 1, "source": "text_layer", "char_count": 100, "status": "ok"},
            {"page_number": 2, "source": "ocr", "char_count": 80, "status": "ok"},
            {"page_number": 3, "source": "empty", "char_count": 0, "status": "empty"},
        ]
        manifest = pdf_ingest.build_manifest(
            source_filename="book.pdf",
            title="Book",
            grade=6,
            checksum_sha256="abc123",
            page_count=3,
            pages=pages,
        )
        assert manifest["source_filename"] == "book.pdf"
        assert manifest["checksum_sha256"] == "abc123"
        assert manifest["page_count"] == 3
        assert manifest["pages_processed"] == 3
        assert manifest["text_layer_pages"] == 1
        assert manifest["ocr_pages"] == 1
        assert manifest["empty_pages"] == 1
        assert manifest["pages"] == pages

    def test_manifest_is_json_serializable(self):
        manifest = pdf_ingest.build_manifest(
            source_filename="book.pdf",
            title="Book",
            grade=None,
            checksum_sha256="abc",
            page_count=0,
            pages=[],
        )
        json.dumps(manifest)  # must not raise


class TestProcessPageFallbackDecision:
    def test_uses_text_layer_when_sufficient(self, tmp_path, monkeypatch):
        # ASCII content here: PyMuPDF's base14 "helv" font (used by insert_text with no
        # embedded font) can't render Vietnamese diacritics, which is a test-fixture
        # rendering limitation, not a pipeline concern — that's covered by
        # test_rag_text_clean.py against real Vietnamese strings without any font involved.
        pdf_path = _make_pdf(tmp_path, ["Day la noi dung day du cua mot trang sach lich su."])

        def _fail_if_called(*args, **kwargs):
            raise AssertionError("OCR should not be called when text layer is sufficient")

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", _fail_if_called)

        result = pdf_ingest.process_page(
            pdf_path, 1, min_chars=10, ocr_lang="vie", ocr_dpi=100, tesseract_cmd=None
        )
        assert result["source"] == "text_layer"
        assert "noi dung day du" in result["text"]

    def test_falls_back_to_ocr_when_text_layer_empty(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, [None])  # blank page -> no text layer

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", lambda *a, **k: "Văn bản OCR từ ảnh trang.")

        result = pdf_ingest.process_page(
            pdf_path, 1, min_chars=40, ocr_lang="vie", ocr_dpi=100, tesseract_cmd=None
        )
        assert result["source"] == "ocr"
        assert "Văn bản OCR" in result["text"]

    def test_falls_back_to_ocr_when_text_layer_is_watermark_only(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, ["blogtailieu.com"])

        monkeypatch.setattr(
            pdf_ingest, "ocr_pdf_page", lambda *a, **k: "Nội dung OCR thật sự của trang."
        )

        result = pdf_ingest.process_page(
            pdf_path, 1, min_chars=40, ocr_lang="vie", ocr_dpi=100, tesseract_cmd=None
        )
        assert result["source"] == "ocr"

    def test_records_error_when_ocr_backend_unavailable(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, [None])

        def _raise_unavailable(*args, **kwargs):
            raise OCRUnavailableError("Tesseract binary not found")

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", _raise_unavailable)

        result = pdf_ingest.process_page(
            pdf_path, 1, min_chars=40, ocr_lang="vie", ocr_dpi=100, tesseract_cmd=None
        )
        assert result["source"] == "empty"
        assert result["ocr_error"] is not None
        assert "Tesseract" in result["ocr_error"]


class TestIngestPdfEndToEnd:
    """Full pipeline over a tiny synthetic PDF. OCR is monkeypatched — never real Tesseract."""

    def test_ingest_writes_pages_book_and_manifest(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(
            tmp_path,
            [
                "Chuong 1: Noi dung trang mot voi day du chu de vuot nguong text layer.",
                None,  # forces OCR fallback
            ],
        )
        monkeypatch.setattr(
            pdf_ingest, "ocr_pdf_page", lambda *a, **k: "Nội dung OCR của trang hai đủ dài."
        )

        output_root = tmp_path / "processed"
        manifest = pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=40)

        book_dir = output_root / "sgk-lich-su-va-dia-li-6-kntt"
        assert (book_dir / "book.md").exists()
        assert (book_dir / "pages" / "page_001.md").exists()
        assert (book_dir / "pages" / "page_002.md").exists()
        assert (book_dir / "manifest.json").exists()

        assert manifest["page_count"] == 2
        assert manifest["text_layer_pages"] == 1
        assert manifest["ocr_pages"] == 1
        assert manifest["grade"] == 6

        page2_text = (book_dir / "pages" / "page_002.md").read_text(encoding="utf-8")
        assert "source: ocr" in page2_text
        assert "Nội dung OCR" in page2_text

    def test_resumable_skips_already_processed_pages(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, ["Noi dung trang mot hoan chinh va du dai de giu nguyen."])
        output_root = tmp_path / "processed"

        calls = {"count": 0}

        def _tracked_ocr(*args, **kwargs):
            calls["count"] += 1
            return "should not be needed"

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", _tracked_ocr)

        pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=10)
        # Second run without --force should not reprocess the page (text layer was sufficient,
        # so OCR was never called in either run, but this also exercises the resume path).
        manifest = pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=10)

        assert manifest["pages_processed"] == 1
        assert calls["count"] == 0

    def test_resumable_recovers_existing_pages_when_manifest_is_missing(
        self, tmp_path, monkeypatch
    ):
        pdf_path = _make_pdf(tmp_path, [None, None])
        output_root = tmp_path / "processed"
        book_dir = output_root / "sgk-lich-su-va-dia-li-6-kntt"
        pages_dir = book_dir / "pages"
        pages_dir.mkdir(parents=True)
        existing_md = pdf_ingest.page_to_markdown(
            book_title="SGK Lịch sử và địa lí 6 KNTT",
            grade=6,
            page_number=1,
            text="Trang một đã OCR từ lần chạy trước.",
            source="ocr",
        )
        (pages_dir / "page_001.md").write_text(existing_md, encoding="utf-8")

        calls = {"count": 0}

        def _tracked_ocr(*args, **kwargs):
            calls["count"] += 1
            return "Nội dung OCR mới cho trang còn thiếu."

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", _tracked_ocr)

        manifest = pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=40)

        assert manifest["pages_processed"] == 2
        assert calls["count"] == 1
        page1_text = (pages_dir / "page_001.md").read_text(encoding="utf-8")
        assert "lần chạy trước" in page1_text

    def test_writes_manifest_checkpoint_after_each_processed_page(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, [None, None])
        output_root = tmp_path / "processed"

        def _process_page(_pdf_path, page_number, **kwargs):
            if page_number == 2:
                raise RuntimeError("boom")
            return {
                "text": "Trang một đã xử lý xong.",
                "source": "ocr",
                "char_count": 24,
                "ocr_error": None,
            }

        monkeypatch.setattr(pdf_ingest, "process_page", _process_page)

        with pytest.raises(RuntimeError):
            pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=40)

        manifest_path = (
            output_root / "sgk-lich-su-va-dia-li-6-kntt" / "manifest.json"
        )
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        assert manifest["pages_processed"] == 1
        assert manifest["pages"][0]["page_number"] == 1

    def test_force_reprocesses_even_if_manifest_exists(self, tmp_path, monkeypatch):
        pdf_path = _make_pdf(tmp_path, [None])
        output_root = tmp_path / "processed"

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", lambda *a, **k: "lần một")
        pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=40)

        monkeypatch.setattr(pdf_ingest, "ocr_pdf_page", lambda *a, **k: "lần hai sau khi force")
        manifest = pdf_ingest.ingest_pdf(pdf_path, output_root, min_chars=40, force=True)

        book_dir = output_root / "sgk-lich-su-va-dia-li-6-kntt"
        page1_text = (book_dir / "pages" / "page_001.md").read_text(encoding="utf-8")
        assert "lần hai" in page1_text
        assert manifest["ocr_pages"] == 1
