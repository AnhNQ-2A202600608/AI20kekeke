"""Local TF-IDF vector index over the OCR'd Markdown corpus.

Deliberately stdlib-only (no chromadb/sentence-transformers/numpy): term
frequencies and cosine similarity are plain Python. This keeps `rag`
ingest_index/query fully offline and safe to run in CI — unlike the OCR step
in `pdf_ingest.py`, which needs a real Tesseract install and must stay off the
synchronous request path (see `scripts/ingest_pdfs.py`).
"""

from __future__ import annotations

import json
import math
import re
from collections import Counter
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

from src.modules.rag.chunking import Chunk, collect_chunks

_TOKEN_PATTERN = re.compile(r"\w+", re.UNICODE)


def tokenize(text: str) -> list[str]:
    return [t.lower() for t in _TOKEN_PATTERN.findall(text)]


@dataclass
class IndexedDocument:
    chunk_id: str
    book_slug: str
    book_title: str
    grade: int | None
    page: int | None
    text: str
    term_freq: dict[str, int]


@dataclass
class VectorIndex:
    documents: list[IndexedDocument]
    idf: dict[str, float]

    def to_dict(self) -> dict[str, Any]:
        return {"idf": self.idf, "documents": [asdict(d) for d in self.documents]}

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> VectorIndex:
        docs = [IndexedDocument(**d) for d in data.get("documents", [])]
        return cls(documents=docs, idf=data.get("idf", {}))


def build_index(chunks: list[Chunk]) -> VectorIndex:
    doc_term_freqs: list[Counter[str]] = []
    doc_freq: Counter[str] = Counter()
    for chunk in chunks:
        tf = Counter(tokenize(chunk.text))
        doc_term_freqs.append(tf)
        doc_freq.update(set(tf))

    n_docs = max(len(chunks), 1)
    # Smoothed idf (sklearn-style) so a term appearing in every doc still gets weight > 0.
    idf = {term: math.log((n_docs + 1) / (count + 1)) + 1.0 for term, count in doc_freq.items()}

    documents = [
        IndexedDocument(
            chunk_id=chunk.chunk_id,
            book_slug=chunk.book_slug,
            book_title=chunk.book_title,
            grade=chunk.grade,
            page=chunk.page,
            text=chunk.text,
            term_freq=dict(tf),
        )
        for chunk, tf in zip(chunks, doc_term_freqs)
    ]
    return VectorIndex(documents=documents, idf=idf)


def build_index_from_processed(processed_dir: Path, *, chunk_chars: int, overlap_chars: int) -> VectorIndex:
    chunks = collect_chunks(processed_dir, chunk_chars=chunk_chars, overlap_chars=overlap_chars)
    return build_index(chunks)


def _vector_norm(term_freq: dict[str, int], idf: dict[str, float]) -> float:
    return math.sqrt(sum((count * idf.get(term, 0.0)) ** 2 for term, count in term_freq.items()))


def _cosine_similarity(
    query_tf: dict[str, int], query_norm: float, doc: IndexedDocument, idf: dict[str, float]
) -> float:
    if query_norm == 0:
        return 0.0
    dot = 0.0
    for term, q_count in query_tf.items():
        d_count = doc.term_freq.get(term)
        if not d_count:
            continue
        weight = idf.get(term, 0.0)
        dot += (q_count * weight) * (d_count * weight)
    if dot == 0:
        return 0.0
    doc_norm = _vector_norm(doc.term_freq, idf)
    if doc_norm == 0:
        return 0.0
    return dot / (doc_norm * query_norm)


def query_index(index: VectorIndex, question: str, top_k: int = 5) -> list[dict[str, Any]]:
    query_tf = Counter(tokenize(question))
    query_norm = _vector_norm(query_tf, index.idf)
    scored = [
        (score, doc)
        for doc in index.documents
        if (score := _cosine_similarity(query_tf, query_norm, doc, index.idf)) > 0
    ]
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "chunk_id": doc.chunk_id,
            "book_slug": doc.book_slug,
            "book_title": doc.book_title,
            "grade": doc.grade,
            "page": doc.page,
            "text": doc.text,
            "score": round(score, 4),
        }
        for score, doc in scored[:top_k]
    ]


def save_index(index: VectorIndex, path: Path) -> None:
    path.write_text(json.dumps(index.to_dict(), ensure_ascii=False), encoding="utf-8")


def load_index(path: Path) -> VectorIndex:
    data = json.loads(path.read_text(encoding="utf-8"))
    return VectorIndex.from_dict(data)
