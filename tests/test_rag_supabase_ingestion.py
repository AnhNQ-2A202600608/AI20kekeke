from __future__ import annotations

import importlib
import sys
from pathlib import Path

import pytest


class _GuardedStream:
    def reconfigure(self, **_kwargs):
        raise AssertionError("RAG modules must not mutate process stdio during import")


def test_legacy_rag_ingestion_import_does_not_reconfigure_stdio(monkeypatch):
    monkeypatch.setattr(sys, "stdout", _GuardedStream())
    monkeypatch.setattr(sys, "stderr", _GuardedStream())
    sys.modules.pop("src.pipeline.ingest.rag_ingestion", None)

    importlib.import_module("src.pipeline.ingest.rag_ingestion")


def test_parse_markdown_pages_reports_missing_page_75(tmp_path: Path):
    from src.services.rag_ingestion_service import parse_markdown_pages

    markdown = "\n".join(
        f"<!-- page: {page} -->\nNội dung trang {page}."
        for page in range(1, 115)
        if page != 75
    )
    path = tmp_path / "toan-6-tap-2.md"
    path.write_text(markdown, encoding="utf-8")

    parsed = parse_markdown_pages(path, expected_pages=114)

    assert parsed.missing_pages == [75]
    assert parsed.pages[74].page_number == 74
    assert parsed.pages[76].text == "Nội dung trang 76."


def test_chunk_pages_never_crosses_page_boundaries():
    from src.services.rag_ingestion_service import ParsedPage, chunk_pages

    pages = {
        1: ParsedPage(page_number=1, text="A" * 90, extraction_method="markdown"),
        2: ParsedPage(page_number=2, text="B" * 90, extraction_method="markdown"),
    }

    chunks = chunk_pages(pages, chunk_chars=60, overlap_chars=10)

    assert {chunk.page_number for chunk in chunks} == {1, 2}
    assert all(set(chunk.text) <= {"A"} for chunk in chunks if chunk.page_number == 1)
    assert all(set(chunk.text) <= {"B"} for chunk in chunks if chunk.page_number == 2)
    assert [chunk.chunk_index for chunk in chunks] == list(range(len(chunks)))


def test_build_document_pages_only_ocrs_missing_markdown_pages(tmp_path: Path):
    from src.services.rag_ingestion_service import build_document_pages

    markdown = tmp_path / "book.md"
    markdown.write_text(
        "<!-- page: 1 -->\nTrang một.\n<!-- page: 3 -->\nTrang ba.",
        encoding="utf-8",
    )
    calls: list[int] = []

    def ocr_page(page_number: int) -> str:
        calls.append(page_number)
        return f"OCR trang {page_number}."

    pages = build_document_pages(markdown, expected_pages=3, ocr_page=ocr_page)

    assert calls == [2]
    assert pages[1].extraction_method == "markdown"
    assert pages[2].text == "OCR trang 2."
    assert pages[2].extraction_method == "ocr"


def test_build_document_pages_without_markdown_ocrs_every_page():
    from src.services.rag_ingestion_service import build_document_pages

    calls: list[int] = []

    def ocr_page(page_number: int) -> str:
        calls.append(page_number)
        return "" if page_number == 1 else f"Nội dung {page_number}"

    pages = build_document_pages(None, expected_pages=3, ocr_page=ocr_page)

    assert calls == [1, 2, 3]
    assert pages[1].extraction_method == "non_text"
    assert pages[2].extraction_method == "ocr"


def test_manifest_rejects_duplicate_scope_and_title(tmp_path: Path):
    from pydantic import ValidationError

    from src.services.rag_ingestion_service import CorpusManifest

    pdf = tmp_path / "book.pdf"
    pdf.write_bytes(b"%PDF-fixture")
    payload = {
        "version": 1,
        "course_id": "00000000-0000-0000-0000-000000000001",
        "documents": [
            {
                "title": "Toán 6",
                "pdf_path": str(pdf),
                "grade_level": 6,
                "subject_code": "mathematics",
                "expected_pages": 1,
            },
            {
                "title": "Toán 6",
                "pdf_path": str(pdf),
                "grade_level": 6,
                "subject_code": "mathematics",
                "expected_pages": 1,
            },
        ],
    }

    with pytest.raises(ValidationError, match="duplicate document"):
        CorpusManifest.model_validate(payload)


def test_vaic_grade6_manifest_maps_three_source_pdfs():
    from src.services.rag_ingestion_service import load_corpus_manifest

    manifest = load_corpus_manifest(Path("config/rag/corpus.vaic-grade6.yaml"))

    assert len(manifest.documents) == 3
    assert [document.grade_level for document in manifest.documents] == [6, 6, 6]
    assert [document.subject_code for document in manifest.documents] == [
        "mathematics",
        "mathematics",
        "history-geography",
    ]
    assert manifest.documents[0].markdown_path is None
    assert manifest.documents[1].markdown_path == Path(
        "D:/VAIC/md/sach-giao-khoa-toan-6-tap-2-ket-noi-tri-thuc-voi-cuoc-song.md"
    )


class _FakeRepository:
    def __init__(self):
        self.events: list[str] = []
        self.failed = False

    def resolve_scope(self, **_kwargs):
        return "scope-1"

    def find_published_material(self, **_kwargs):
        return None

    def start_ingestion(self, **_kwargs):
        self.events.append("start")
        return "material-1", "job-1"

    def update_job(self, _job_id, *, stage, **_kwargs):
        self.events.append(f"stage:{stage}")

    def upload_source(self, *_args, **_kwargs):
        self.events.append("source")

    def reset_draft(self, *_args, **_kwargs):
        self.events.append("reset")

    def upload_preview(self, _material_id, page_number, _content):
        self.events.append(f"preview:{page_number}")
        return f"materials/material-1/pages/{page_number}.webp"

    def insert_pages(self, _material_id, records):
        self.events.append("pages")
        return {record["page_number"]: f"page-{record['page_number']}" for record in records}

    def insert_chunks(self, _material_id, _course_id, records):
        self.events.append(f"chunks:{len(records)}")

    def mark_ready(self, *_args, **_kwargs):
        self.events.append("ready")

    def publish_material(self, *_args, **_kwargs):
        self.events.append("publish")

    def fail_ingestion(self, *_args, **_kwargs):
        self.failed = True
        self.events.append("failed")


class _FakeEmbedder:
    def __init__(self, *, fail: bool = False):
        self.fail = fail

    def embed_documents(self, texts):
        if self.fail:
            raise RuntimeError("embedding unavailable")
        return [[0.1] * 1536 for _ in texts]


def _fixture_document(tmp_path: Path):
    import fitz

    from src.services.rag_ingestion_service import CorpusDocument

    pdf = tmp_path / "book.pdf"
    document = fitz.open()
    document.new_page()
    document.new_page()
    document.save(pdf)
    document.close()
    markdown = tmp_path / "book.md"
    markdown.write_text(
        "<!-- page: 1 -->\nNội dung trang một.\n<!-- page: 2 -->\nNội dung trang hai.",
        encoding="utf-8",
    )
    return CorpusDocument(
        title="Sách thử nghiệm",
        pdf_path=pdf,
        markdown_path=markdown,
        grade_level=6,
        subject_code="mathematics",
        expected_pages=2,
    )


def test_runner_publishes_only_after_pages_and_chunks(tmp_path: Path):
    from src.services.rag_ingestion_service import RagIngestionRunner

    repository = _FakeRepository()
    runner = RagIngestionRunner(
        repository=repository,
        embedder=_FakeEmbedder(),
        page_extractor=lambda _path, page: f"OCR {page}",
        preview_renderer=lambda _path, page: f"preview-{page}".encode(),
        chunk_chars=1200,
        overlap_chars=200,
    )

    result = runner.ingest_document(
        _fixture_document(tmp_path),
        course_id="00000000-0000-0000-0000-000000000001",
    )

    assert result.status == "published"
    assert result.page_count == 2
    assert repository.events.index("publish") > repository.events.index("pages")
    assert repository.events.index("publish") > next(
        index for index, event in enumerate(repository.events) if event.startswith("chunks:")
    )


def test_runner_does_not_publish_when_embedding_fails(tmp_path: Path):
    from src.services.rag_ingestion_service import RagIngestionRunner

    repository = _FakeRepository()
    runner = RagIngestionRunner(
        repository=repository,
        embedder=_FakeEmbedder(fail=True),
        page_extractor=lambda _path, page: f"OCR {page}",
        preview_renderer=lambda _path, page: f"preview-{page}".encode(),
    )

    with pytest.raises(RuntimeError, match="embedding unavailable"):
        runner.ingest_document(
            _fixture_document(tmp_path),
            course_id="00000000-0000-0000-0000-000000000001",
        )

    assert repository.failed is True
    assert "publish" not in repository.events


class _FakeResponse:
    def __init__(self, payload=None, *, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = "" if payload is None else str(payload)

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class _RecordingSession:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append((method, url, kwargs))
        return self.responses.pop(0)


def test_supabase_repository_uses_app_profile_and_service_key():
    from src.services.rag_supabase_repository import SupabaseRagRepository

    session = _RecordingSession(
        [_FakeResponse([{"id": "subject-1"}]), _FakeResponse([{"id": "scope-1"}])]
    )
    repository = SupabaseRagRepository(
        url="https://example.supabase.co",
        secret_key="sb_secret_test",
        session=session,
    )

    scope_id = repository.resolve_scope(
        course_id="course-1", grade_level=6, subject_code="mathematics"
    )

    assert scope_id == "scope-1"
    _, subject_url, subject_kwargs = session.calls[0]
    assert subject_url.endswith("/rest/v1/subjects")
    assert subject_kwargs["headers"]["Accept-Profile"] == "public"
    assert subject_kwargs["params"]["code"] == "eq.mathematics"
    _, url, kwargs = session.calls[1]
    assert url.endswith("/rest/v1/rag_scopes")
    assert kwargs["headers"]["Accept-Profile"] == "app"
    assert kwargs["headers"]["Authorization"] == "Bearer sb_secret_test"
    assert kwargs["params"]["subject_id"] == "eq.subject-1"


def test_supabase_repository_signs_private_preview_for_five_minutes():
    from src.services.rag_supabase_repository import SupabaseRagRepository

    session = _RecordingSession([_FakeResponse({"signedURL": "/object/sign/rag-materials/x?token=y"})])
    repository = SupabaseRagRepository(
        url="https://example.supabase.co",
        secret_key="sb_secret_test",
        session=session,
    )

    url = repository.create_signed_preview_url("materials/m1/pages/1.webp")

    assert url == "https://example.supabase.co/storage/v1/object/sign/rag-materials/x?token=y"
    _, request_url, kwargs = session.calls[0]
    assert request_url.endswith("/storage/v1/object/sign/rag-materials/materials/m1/pages/1.webp")
    assert kwargs["json"] == {"expiresIn": 300}


def test_webp_preview_is_bounded_and_uses_webp(tmp_path: Path):
    import fitz
    from PIL import Image

    from src.services.rag_ingestion_adapters import render_page_preview

    pdf_path = tmp_path / "preview.pdf"
    document = fitz.open()
    document.new_page(width=2400, height=3200)
    document.save(pdf_path)
    document.close()

    content = render_page_preview(pdf_path, 1, max_width=960)
    image = Image.open(__import__("io").BytesIO(content))

    assert image.format == "WEBP"
    assert image.width <= 960
