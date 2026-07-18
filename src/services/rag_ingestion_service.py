from __future__ import annotations

import hashlib
import re
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from collections.abc import Callable
from typing import Any, Literal, Protocol
from uuid import UUID

from pydantic import BaseModel, Field, model_validator
import yaml


PAGE_MARKER = re.compile(r"<!--\s*page:\s*(\d+)\s*-->", re.IGNORECASE)


class CorpusDocument(BaseModel):
    title: str = Field(min_length=1, max_length=240)
    pdf_path: Path
    markdown_path: Path | None = None
    grade_level: int = Field(ge=1, le=6)
    subject_code: str = Field(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    expected_pages: int = Field(gt=0)
    edition: str = "Kết nối tri thức với cuộc sống"


class CorpusManifest(BaseModel):
    version: Literal[1]
    course_id: UUID
    documents: list[CorpusDocument] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_unique_documents(self) -> "CorpusManifest":
        seen: set[tuple[int, str, str]] = set()
        for document in self.documents:
            key = (document.grade_level, document.subject_code, document.title.casefold())
            if key in seen:
                raise ValueError(f"duplicate document in corpus manifest: {document.title}")
            seen.add(key)
        return self


def load_corpus_manifest(path: Path) -> CorpusManifest:
    payload = yaml.safe_load(path.read_text(encoding="utf-8"))
    return CorpusManifest.model_validate(payload)


@dataclass(frozen=True)
class ParsedPage:
    page_number: int
    text: str
    extraction_method: Literal["markdown", "ocr", "non_text"]


@dataclass(frozen=True)
class ParsedMarkdown:
    pages: dict[int, ParsedPage]
    missing_pages: list[int]


@dataclass(frozen=True)
class PageChunk:
    chunk_index: int
    page_number: int
    text: str
    checksum: str


@dataclass(frozen=True)
class IngestionResult:
    material_id: str
    job_id: str | None
    status: Literal["published", "skipped"]
    page_count: int
    chunk_count: int


class EmbeddingProvider(Protocol):
    def embed_documents(self, texts: list[str]) -> list[list[float]]: ...


class IngestionRepository(Protocol):
    def resolve_scope(self, *, course_id: str, grade_level: int, subject_code: str) -> str: ...

    def find_published_material(self, *, scope_id: str, checksum: str) -> dict[str, Any] | None: ...

    def start_ingestion(self, **values: Any) -> tuple[str, str]: ...

    def update_job(self, job_id: str, *, stage: str, **values: Any) -> None: ...

    def upload_source(self, material_id: str, pdf_path: Path) -> str: ...

    def reset_draft(self, material_id: str) -> None: ...

    def upload_preview(self, material_id: str, page_number: int, content: bytes) -> str: ...

    def insert_pages(self, material_id: str, records: list[dict[str, Any]]) -> dict[int, str]: ...

    def insert_chunks(
        self, material_id: str, course_id: str, records: list[dict[str, Any]]
    ) -> None: ...

    def mark_ready(self, material_id: str, *, page_count: int) -> None: ...

    def publish_material(self, material_id: str) -> None: ...

    def fail_ingestion(self, material_id: str, job_id: str, *, error: str) -> None: ...


def normalize_rag_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value)
    normalized = "".join(
        char for char in normalized if char in "\n\t" or not unicodedata.category(char).startswith("C")
    )
    lines = [re.sub(r"[ \t]+", " ", line).strip() for line in normalized.splitlines()]
    return "\n".join(line for line in lines if line).strip()


def parse_markdown_pages(path: Path, *, expected_pages: int) -> ParsedMarkdown:
    text = path.read_text(encoding="utf-8")
    matches = list(PAGE_MARKER.finditer(text))
    pages: dict[int, ParsedPage] = {}
    for index, match in enumerate(matches):
        page_number = int(match.group(1))
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        page_text = normalize_rag_text(text[match.end() : end])
        pages[page_number] = ParsedPage(
            page_number=page_number,
            text=page_text,
            extraction_method="markdown" if page_text else "non_text",
        )
    missing_pages = [page for page in range(1, expected_pages + 1) if page not in pages]
    return ParsedMarkdown(pages=pages, missing_pages=missing_pages)


def build_document_pages(
    markdown_path: Path | None,
    *,
    expected_pages: int,
    ocr_page: Callable[[int], str],
    ocr_workers: int = 1,
) -> dict[int, ParsedPage]:
    parsed = (
        parse_markdown_pages(markdown_path, expected_pages=expected_pages)
        if markdown_path is not None
        else ParsedMarkdown(pages={}, missing_pages=list(range(1, expected_pages + 1)))
    )
    pages = dict(parsed.pages)
    missing_pages = parsed.missing_pages
    if ocr_workers > 1 and len(missing_pages) > 1:
        from concurrent.futures import ThreadPoolExecutor

        with ThreadPoolExecutor(max_workers=ocr_workers) as executor:
            extracted = dict(zip(missing_pages, executor.map(ocr_page, missing_pages), strict=True))
    else:
        extracted = {page_number: ocr_page(page_number) for page_number in missing_pages}
    for page_number in missing_pages:
        text = normalize_rag_text(extracted[page_number])
        pages[page_number] = ParsedPage(
            page_number=page_number,
            text=text,
            extraction_method="ocr" if text else "non_text",
        )
    return dict(sorted(pages.items()))


def chunk_pages(
    pages: dict[int, ParsedPage],
    *,
    chunk_chars: int,
    overlap_chars: int,
) -> list[PageChunk]:
    if chunk_chars <= 0:
        raise ValueError("chunk_chars must be positive")
    if overlap_chars < 0 or overlap_chars >= chunk_chars:
        raise ValueError("overlap_chars must be between 0 and chunk_chars - 1")

    chunks: list[PageChunk] = []
    step = chunk_chars - overlap_chars
    for page_number in sorted(pages):
        page_text = pages[page_number].text
        if not page_text:
            continue
        start = 0
        while start < len(page_text):
            chunk_text = page_text[start : start + chunk_chars]
            chunks.append(
                PageChunk(
                    chunk_index=len(chunks),
                    page_number=page_number,
                    text=chunk_text,
                    checksum=hashlib.sha256(chunk_text.encode("utf-8")).hexdigest(),
                )
            )
            if start + chunk_chars >= len(page_text):
                break
            start += step
    return chunks


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


class RagIngestionRunner:
    def __init__(
        self,
        *,
        repository: IngestionRepository,
        embedder: EmbeddingProvider,
        page_extractor: Callable[[Path, int], str],
        preview_renderer: Callable[[Path, int], bytes],
        chunk_chars: int = 1200,
        overlap_chars: int = 200,
        embedding_batch_size: int = 64,
        ocr_workers: int = 1,
    ):
        self.repository = repository
        self.embedder = embedder
        self.page_extractor = page_extractor
        self.preview_renderer = preview_renderer
        self.chunk_chars = chunk_chars
        self.overlap_chars = overlap_chars
        self.embedding_batch_size = embedding_batch_size
        self.ocr_workers = max(1, ocr_workers)

    def ingest_document(
        self,
        document: CorpusDocument,
        *,
        course_id: str,
        existing_ingestion: tuple[str, str] | None = None,
    ) -> IngestionResult:
        import fitz

        if not document.pdf_path.is_file():
            raise FileNotFoundError(document.pdf_path)
        if document.markdown_path is not None and not document.markdown_path.is_file():
            raise FileNotFoundError(document.markdown_path)

        with fitz.open(document.pdf_path) as pdf:
            page_count = pdf.page_count
        if page_count != document.expected_pages:
            raise RuntimeError(
                f"PDF page count mismatch for {document.title}: "
                f"expected {document.expected_pages}, got {page_count}"
            )
        checksum = sha256_file(document.pdf_path)
        scope_id = self.repository.resolve_scope(
            course_id=course_id,
            grade_level=document.grade_level,
            subject_code=document.subject_code,
        )
        published = self.repository.find_published_material(scope_id=scope_id, checksum=checksum)
        if published:
            return IngestionResult(
                material_id=str(published["id"]),
                job_id=None,
                status="skipped",
                page_count=int(published.get("page_count") or page_count),
                chunk_count=int(published.get("chunk_count") or 0),
            )

        material_id, job_id = existing_ingestion or self.repository.start_ingestion(
            course_id=course_id,
            scope_id=scope_id,
            title=document.title,
            source_filename=document.pdf_path.name,
            source_checksum=checksum,
            edition=document.edition,
            page_count=page_count,
        )
        try:
            self.repository.update_job(job_id, stage="extracting", status="processing", total_pages=page_count)
            self.repository.upload_source(material_id, document.pdf_path)
            pages = build_document_pages(
                document.markdown_path,
                expected_pages=page_count,
                ocr_page=lambda page: self.page_extractor(document.pdf_path, page),
                ocr_workers=self.ocr_workers,
            )
            if len(pages) != page_count:
                raise RuntimeError(f"page coverage mismatch: expected {page_count}, got {len(pages)}")

            self.repository.reset_draft(material_id)
            self.repository.update_job(job_id, stage="rendering")
            page_records: list[dict[str, Any]] = []
            for page_number, page in pages.items():
                preview = self.preview_renderer(document.pdf_path, page_number)
                preview_path = self.repository.upload_preview(material_id, page_number, preview)
                page_records.append(
                    {
                        "page_number": page_number,
                        "extracted_text": page.text,
                        "extraction_method": page.extraction_method,
                        "preview_storage_path": preview_path,
                        "content_checksum": hashlib.sha256(page.text.encode("utf-8")).hexdigest(),
                    }
                )
                self.repository.update_job(job_id, stage="rendering", processed_pages=page_number)

            page_ids = self.repository.insert_pages(material_id, page_records)
            self.repository.update_job(job_id, stage="chunking")
            chunks = chunk_pages(
                pages,
                chunk_chars=self.chunk_chars,
                overlap_chars=self.overlap_chars,
            )
            if not chunks:
                raise RuntimeError("document produced no indexable text chunks")

            self.repository.update_job(job_id, stage="embedding")
            chunk_records: list[dict[str, Any]] = []
            for batch_start in range(0, len(chunks), self.embedding_batch_size):
                batch = chunks[batch_start : batch_start + self.embedding_batch_size]
                embeddings = self.embedder.embed_documents([chunk.text for chunk in batch])
                if len(embeddings) != len(batch) or any(len(vector) != 1536 for vector in embeddings):
                    raise RuntimeError("embedding provider returned an invalid 1536-dimension batch")
                for chunk, embedding in zip(batch, embeddings, strict=True):
                    chunk_records.append(
                        {
                            "page_id": page_ids[chunk.page_number],
                            "chunk_index": chunk.chunk_index,
                            "page_number": chunk.page_number,
                            "text_excerpt": chunk.text,
                            "embedding": embedding,
                            "embedding_status": "indexed",
                            "chunk_checksum": chunk.checksum,
                            "embedding_model": "text-embedding-3-small",
                        }
                    )
            self.repository.insert_chunks(material_id, course_id, chunk_records)
            self.repository.mark_ready(material_id, page_count=page_count)
            self.repository.update_job(job_id, stage="publishing")
            self.repository.publish_material(material_id)
            return IngestionResult(
                material_id=material_id,
                job_id=job_id,
                status="published",
                page_count=page_count,
                chunk_count=len(chunk_records),
            )
        except Exception as exc:
            self.repository.fail_ingestion(material_id, job_id, error=str(exc))
            raise
