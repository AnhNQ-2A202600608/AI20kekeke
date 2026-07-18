"""PDF (scanned SGK) -> per-page Markdown ingestion pipeline.

Strategy per page:
  1. Try the embedded PDF text layer first (fast, no OCR, works for the ~digital pages).
  2. If the text layer is too short or watermark-only, render the page to an image
     and OCR it in Vietnamese instead.
  3. Clean the result either way (watermark removal + Unicode/whitespace normalization).
  4. Emit one Markdown file per page, a combined book.md, and a manifest.json recording
     per-page provenance (text_layer vs ocr vs empty) for auditability.

This module never runs from the synchronous POST /runs request path — OCR-ing an
800+ page textbook is exactly the kind of long job that belongs offline. Use
`scripts/ingest_pdfs.py` to run it. `src/modules/rag/index.py` then builds the
(fast) vector index from the resulting Markdown separately.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from src.modules.rag.ocr import OCRUnavailableError, ocr_pdf_page
from src.modules.rag.text_clean import clean_page_text, is_text_sufficient, slugify

logger = logging.getLogger("src.modules.rag.pdf_ingest")

_GRADE_PATTERN = re.compile(r"\b([6-9])\b")
_PAGE_FILE_PATTERN = re.compile(r"page_(\d+)\.md$")
_SOURCE_PATTERN = re.compile(r"^source:\s*(\S+)\s*$", re.MULTILINE)
_FRONT_MATTER_BLOCK = re.compile(r"^---\n.*?\n---\n", re.DOTALL)
_LEADING_HEADING = re.compile(r"^#[^\n]*\n+")


def parse_book_metadata(pdf_path: Path) -> tuple[str, int | None]:
    """Best-effort extraction of a human title and grade (6-9) from the filename."""
    title = re.sub(r"\s+", " ", pdf_path.stem).strip()
    match = _GRADE_PATTERN.search(title)
    grade = int(match.group(1)) if match else None
    return title, grade


def _sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_text_layer(pdf_path: Path, page_number: int) -> str:
    """Extract embedded text for a single 1-indexed page via PyMuPDF."""
    import fitz  # PyMuPDF

    with fitz.open(pdf_path) as doc:
        return doc[page_number - 1].get_text("text") or ""


def get_page_count(pdf_path: Path) -> int:
    import fitz

    with fitz.open(pdf_path) as doc:
        return doc.page_count


def page_to_markdown(*, book_title: str, grade: int | None, page_number: int, text: str, source: str) -> str:
    """Render a single extracted/OCR'd page as Markdown with YAML front-matter metadata."""
    grade_label = f"lớp {grade}" if grade is not None else "không xác định"
    front_matter = (
        "---\n"
        f'book: "{book_title}"\n'
        f"grade: {grade if grade is not None else 'null'}\n"
        f"page: {page_number}\n"
        f"source: {source}\n"
        "---\n"
    )
    heading = f"# {book_title} ({grade_label}) — Trang {page_number}"
    body = text.strip()
    return f"{front_matter}\n{heading}\n\n{body}\n" if body else f"{front_matter}\n{heading}\n"


def process_page(
    pdf_path: Path,
    page_number: int,
    *,
    min_chars: int,
    ocr_lang: str,
    ocr_dpi: int,
    tesseract_cmd: str | None,
) -> dict[str, Any]:
    """Text-layer-first, OCR-fallback extraction + cleanup for a single page.

    Returns a dict with: text, source ("text_layer" | "ocr" | "empty"), char_count, ocr_error.
    """
    raw_text = ""
    try:
        raw_text = extract_text_layer(pdf_path, page_number)
    except Exception as exc:  # corrupt page, etc. — fall through to OCR
        logger.warning("Text layer extraction failed on page %d: %s", page_number, exc)

    if is_text_sufficient(raw_text, min_chars=min_chars):
        cleaned = clean_page_text(raw_text)
        return {
            "text": cleaned,
            "source": "text_layer",
            "char_count": len(cleaned),
            "ocr_error": None,
        }

    try:
        ocr_text = ocr_pdf_page(pdf_path, page_number, dpi=ocr_dpi, lang=ocr_lang, tesseract_cmd=tesseract_cmd)
    except OCRUnavailableError as exc:
        # Không có backend OCR khả dụng: giữ tạm text layer (có thể rỗng) và ghi rõ lỗi
        # vào manifest để người vận hành biết trang này cần chạy lại khi có Tesseract.
        cleaned = clean_page_text(raw_text)
        logger.error("OCR unavailable for page %d: %s", page_number, exc)
        return {
            "text": cleaned,
            "source": "text_layer" if cleaned else "empty",
            "char_count": len(cleaned),
            "ocr_error": str(exc),
        }

    cleaned = clean_page_text(ocr_text)
    return {
        "text": cleaned,
        "source": "ocr" if cleaned else "empty",
        "char_count": len(cleaned),
        "ocr_error": None,
    }


def build_manifest(
    *,
    source_filename: str,
    title: str,
    grade: int | None,
    checksum_sha256: str,
    page_count: int,
    pages: list[dict[str, Any]],
) -> dict[str, Any]:
    return {
        "source_filename": source_filename,
        "title": title,
        "grade": grade,
        "checksum_sha256": checksum_sha256,
        "page_count": page_count,
        "pages_processed": len(pages),
        "ocr_pages": sum(1 for p in pages if p.get("source") == "ocr"),
        "text_layer_pages": sum(1 for p in pages if p.get("source") == "text_layer"),
        "empty_pages": sum(1 for p in pages if p.get("status") != "ok"),
        "processed_at": datetime.now(UTC).isoformat(),
        "pages": pages,
    }


def build_book_markdown(pages_dir: Path, page_numbers: list[int]) -> str:
    parts = []
    for page_number in page_numbers:
        page_path = pages_dir / f"page_{page_number:03d}.md"
        if page_path.exists():
            parts.append(page_path.read_text(encoding="utf-8"))
    return "\n\n---\n\n".join(parts)


def _infer_page_record_from_markdown(page_path: Path) -> dict[str, Any] | None:
    """Recover a manifest page record from an existing page_NNN.md.

    This protects long OCR runs from losing progress when the process is interrupted
    before the final manifest write.
    """
    match = _PAGE_FILE_PATTERN.match(page_path.name)
    if not match:
        return None
    markdown = page_path.read_text(encoding="utf-8")
    source_match = _SOURCE_PATTERN.search(markdown)
    source = source_match.group(1) if source_match else "text_layer"
    body = _FRONT_MATTER_BLOCK.sub("", markdown, count=1).lstrip("\n")
    body = _LEADING_HEADING.sub("", body, count=1).strip()
    return {
        "page_number": int(match.group(1)),
        "source": source,
        "char_count": len(body),
        "status": "ok" if source != "empty" and body else "empty",
        "ocr_error": None,
    }


def _load_orphaned_page_records(pages_dir: Path) -> dict[int, dict[str, Any]]:
    records: dict[int, dict[str, Any]] = {}
    for page_path in sorted(pages_dir.glob("page_*.md")):
        record = _infer_page_record_from_markdown(page_path)
        if record:
            records[record["page_number"]] = record
    return records


def _write_manifest(
    manifest_path: Path,
    *,
    source_filename: str,
    title: str,
    grade: int | None,
    checksum_sha256: str,
    page_count: int,
    page_records: dict[int, dict[str, Any]],
) -> dict[str, Any]:
    manifest = build_manifest(
        source_filename=source_filename,
        title=title,
        grade=grade,
        checksum_sha256=checksum_sha256,
        page_count=page_count,
        pages=[page_records[n] for n in sorted(page_records)],
    )
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    return manifest


def ingest_pdf(
    pdf_path: Path,
    output_root: Path,
    *,
    min_chars: int = 40,
    ocr_lang: str = "vie",
    ocr_dpi: int = 300,
    tesseract_cmd: str | None = None,
    start_page: int | None = None,
    end_page: int | None = None,
    force: bool = False,
    progress: Callable[[int, int], None] | None = None,
) -> dict[str, Any]:
    """Run the full OCR pipeline for one PDF, writing pages/*.md, book.md and manifest.json.

    Resumable: pages already recorded as "ok" in an existing manifest.json (matching the
    PDF's checksum) are skipped unless `force=True`, so an interrupted run over an
    800-page book can pick up where it left off. `start_page`/`end_page` (1-indexed,
    inclusive) allow chunked runs to avoid any single invocation timing out.
    """
    title, grade = parse_book_metadata(pdf_path)
    slug = slugify(title)
    book_dir = output_root / slug
    pages_dir = book_dir / "pages"
    pages_dir.mkdir(parents=True, exist_ok=True)

    checksum = _sha256_file(pdf_path)
    total_pages = get_page_count(pdf_path)

    manifest_path = book_dir / "manifest.json"
    existing_pages: dict[int, dict[str, Any]] = {}
    if manifest_path.exists() and not force:
        try:
            existing = json.loads(manifest_path.read_text(encoding="utf-8"))
            if existing.get("checksum_sha256") == checksum:
                existing_pages = {p["page_number"]: p for p in existing.get("pages", [])}
        except Exception:
            existing_pages = {}
    elif not force:
        existing_pages = _load_orphaned_page_records(pages_dir)

    first = max(start_page or 1, 1)
    last = min(end_page or total_pages, total_pages)
    page_records: dict[int, dict[str, Any]] = dict(existing_pages)
    manifest: dict[str, Any] | None = None
    if page_records:
        manifest = _write_manifest(
            manifest_path,
            source_filename=pdf_path.name,
            title=title,
            grade=grade,
            checksum_sha256=checksum,
            page_count=total_pages,
            page_records=page_records,
        )

    for page_number in range(first, last + 1):
        page_md_path = pages_dir / f"page_{page_number:03d}.md"
        prior = existing_pages.get(page_number)
        if prior and prior.get("status") == "ok" and page_md_path.exists():
            if progress:
                progress(page_number, total_pages)
            continue

        result = process_page(
            pdf_path,
            page_number,
            min_chars=min_chars,
            ocr_lang=ocr_lang,
            ocr_dpi=ocr_dpi,
            tesseract_cmd=tesseract_cmd,
        )
        markdown = page_to_markdown(
            book_title=title,
            grade=grade,
            page_number=page_number,
            text=result["text"],
            source=result["source"],
        )
        page_md_path.write_text(markdown, encoding="utf-8")

        page_records[page_number] = {
            "page_number": page_number,
            "source": result["source"],
            "char_count": result["char_count"],
            "status": "ok" if result["source"] != "empty" else "empty",
            "ocr_error": result["ocr_error"],
        }
        manifest = _write_manifest(
            manifest_path,
            source_filename=pdf_path.name,
            title=title,
            grade=grade,
            checksum_sha256=checksum,
            page_count=total_pages,
            page_records=page_records,
        )
        if progress:
            progress(page_number, total_pages)

    sorted_numbers = sorted(page_records)
    if manifest is None:
        manifest = _write_manifest(
            manifest_path,
            source_filename=pdf_path.name,
            title=title,
            grade=grade,
            checksum_sha256=checksum,
            page_count=total_pages,
            page_records=page_records,
        )

    book_md = build_book_markdown(pages_dir, sorted_numbers)
    (book_dir / "book.md").write_text(book_md, encoding="utf-8")

    return manifest
