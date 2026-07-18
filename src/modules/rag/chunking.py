"""Split OCR'd page Markdown into overlapping retrieval chunks.

Reads the front-matter metadata written by `pdf_ingest.page_to_markdown` (book,
grade, page, source) so each chunk keeps enough provenance to cite back to a
specific SGK page in query results.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

_FRONT_MATTER = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
_LEADING_HEADING = re.compile(r"^#[^\n]*\n+")


@dataclass
class Chunk:
    chunk_id: str
    book_slug: str
    book_title: str
    grade: int | None
    page: int | None
    text: str


def parse_front_matter(markdown: str) -> dict[str, str]:
    match = _FRONT_MATTER.match(markdown)
    if not match:
        return {}
    meta: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip().strip('"')
    return meta


def chunk_markdown_text(text: str, *, chunk_chars: int, overlap_chars: int) -> list[str]:
    """Split text into overlapping chunks, preferring paragraph/word boundaries over hard cuts."""
    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_chars:
        return [text]

    chunks: list[str] = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + chunk_chars, n)
        if end < n:
            boundary = text.rfind("\n\n", start, end)
            if boundary <= start:
                boundary = text.rfind(" ", start, end)
            if boundary > start:
                end = boundary
        piece = text[start:end].strip()
        if piece:
            chunks.append(piece)
        if end >= n:
            break
        start = max(end - overlap_chars, start + 1)
    return chunks


def chunk_page_file(page_path: Path, *, book_slug: str, chunk_chars: int, overlap_chars: int) -> list[Chunk]:
    markdown = page_path.read_text(encoding="utf-8")
    meta = parse_front_matter(markdown)
    # Front-matter substitution leaves a leading "\n" before the heading, so strip it
    # first — otherwise the "^#" heading-strip regex (start-of-string anchored) never matches.
    body = _FRONT_MATTER.sub("", markdown, count=1).lstrip("\n")
    body = _LEADING_HEADING.sub("", body, count=1)

    grade_raw = meta.get("grade")
    grade = int(grade_raw) if grade_raw and grade_raw != "null" else None
    page_raw = meta.get("page")
    page = int(page_raw) if page_raw else None
    book_title = meta.get("book", book_slug)

    pieces = chunk_markdown_text(body, chunk_chars=chunk_chars, overlap_chars=overlap_chars)
    return [
        Chunk(
            chunk_id=f"{book_slug}:p{page or 0}:{i}",
            book_slug=book_slug,
            book_title=book_title,
            grade=grade,
            page=page,
            text=piece,
        )
        for i, piece in enumerate(pieces)
    ]


def collect_chunks(processed_dir: Path, *, chunk_chars: int, overlap_chars: int) -> list[Chunk]:
    """Walk data/processed/<book_slug>/pages/*.md and chunk every page."""
    chunks: list[Chunk] = []
    if not processed_dir.exists():
        return chunks
    for book_dir in sorted(p for p in processed_dir.iterdir() if p.is_dir()):
        pages_dir = book_dir / "pages"
        if not pages_dir.exists():
            continue
        for page_path in sorted(pages_dir.glob("page_*.md")):
            chunks.extend(
                chunk_page_file(
                    page_path,
                    book_slug=book_dir.name,
                    chunk_chars=chunk_chars,
                    overlap_chars=overlap_chars,
                )
            )
    return chunks
