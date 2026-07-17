"""RAG capability: chunk OCR'd SGK Markdown, build a local TF-IDF index, and query it.

OCR itself (`pdf_ingest.py` / `scripts/ingest_pdfs.py`) is a separate offline step —
this capability only ever reads already-processed Markdown under
`data/processed/<book_slug>/`, so both of its actions are fast enough to run
synchronously inside POST /runs.

Actions (selected via the `action` parameter):
  - "ingest_index": (re)build the vector index from data/processed/ and persist it.
  - "query": run a question against the persisted index and return the top matches.
"""

from __future__ import annotations

import json
from typing import Any

from src.capabilities.registry import BaseCapability, CapabilityResult
from src.core.config import get_settings
from src.core.logging import get_logger
from src.modules.rag.index import build_index_from_processed, load_index, query_index, save_index

logger = get_logger("modules.rag")

_ACTIONS = {"ingest_index", "query"}


class RAGCapability(BaseCapability):
    @property
    def id(self) -> str:
        return "rag"

    @property
    def name(self) -> str:
        return "RAG System"

    @property
    def description(self) -> str:
        return (
            "Retrieval over OCR'd SGK Markdown using a local TF-IDF vector index "
            "(no external services, fully offline)."
        )

    @property
    def category(self) -> str:
        return "rag"

    @property
    def required_dependencies(self) -> list[str]:
        # Indexing/query is pure stdlib. OCR ingestion has its own heavier
        # dependencies (fitz/pytesseract/PIL) but runs offline via scripts/ingest_pdfs.py,
        # not through this capability.
        return []

    @property
    def input_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "action": {
                    "type": "string",
                    "title": "Action",
                    "description": "ingest_index (rebuild index from data/processed/) or query",
                    "default": "query",
                },
                "question": {
                    "type": "string",
                    "title": "Question",
                    "description": "Câu hỏi cần tra cứu trong SGK (bắt buộc khi action=query)",
                },
                "top_k": {
                    "type": "integer",
                    "title": "Top K",
                    "description": "Số đoạn liên quan trả về (action=query)",
                },
            },
        }

    @property
    def output_schema(self) -> dict[str, Any]:
        return {
            "type": "object",
            "properties": {
                "artifacts": {"type": "array", "description": "Markdown/JSON artifact(s) produced"},
            },
        }

    @property
    def supported_file_types(self) -> list[str]:
        return [".md", ".txt"]

    def validate_input(self, parameters: dict[str, Any]) -> list[str]:
        errors = []
        action = parameters.get("action", "query")
        if action not in _ACTIONS:
            errors.append(f"action must be one of {sorted(_ACTIONS)}")
        if action == "query" and not parameters.get("question", "").strip():
            errors.append("question is required when action=query")
        return errors

    def execute(self, parameters: dict[str, Any], input_file_ids: list[str]) -> CapabilityResult:
        settings = get_settings()
        action = parameters.get("action", "query")
        index_path = settings.rag_index_dir / "index.json"

        try:
            if action == "ingest_index":
                return self._ingest_index(settings, index_path)
            return self._query(settings, index_path, parameters)
        except Exception as exc:
            logger.error("RAG capability failed (action=%s): %s", action, exc)
            return CapabilityResult(success=False, error=str(exc))

    def _ingest_index(self, settings, index_path) -> CapabilityResult:
        index = build_index_from_processed(
            settings.processed_dir,
            chunk_chars=settings.rag_chunk_chars,
            overlap_chars=settings.rag_chunk_overlap_chars,
        )
        if not index.documents:
            return CapabilityResult(
                success=False,
                error=(
                    "No processed Markdown found under data/processed/. "
                    "Run scripts/ingest_pdfs.py first to OCR the source PDFs in data/."
                ),
            )
        save_index(index, index_path)
        stats = {
            "documents_indexed": len(index.documents),
            "vocabulary_size": len(index.idf),
            "processed_dir": str(settings.processed_dir),
            "index_path": str(index_path),
        }
        return CapabilityResult(
            success=True,
            artifacts=[
                {
                    "filename": "rag_index_stats.json",
                    "content": json.dumps(stats, indent=2, ensure_ascii=False),
                    "type": "json",
                }
            ],
        )

    def _query(self, settings, index_path, parameters: dict[str, Any]) -> CapabilityResult:
        if not index_path.exists():
            return CapabilityResult(
                success=False,
                error="RAG index not found. Run action=ingest_index first.",
            )

        index = load_index(index_path)
        question = parameters["question"]
        top_k = int(parameters.get("top_k") or settings.rag_top_k)
        results = query_index(index, question, top_k=top_k)
        markdown = _render_answer_markdown(question, results)
        return CapabilityResult(
            success=True,
            artifacts=[
                {
                    "filename": "rag_query_result.md",
                    "content": markdown,
                    "type": "text",
                }
            ],
        )


def _render_answer_markdown(question: str, results: list[dict[str, Any]]) -> str:
    if not results:
        return f"# Truy vấn: {question}\n\nKhông tìm thấy đoạn nội dung liên quan trong index.\n"

    lines = [f"# Truy vấn: {question}\n"]
    for rank, result in enumerate(results, start=1):
        page = result["page"] if result["page"] is not None else "?"
        lines.append(
            f"## {rank}. {result['book_title']} — Trang {page} (score={result['score']})\n\n"
            f"{result['text']}\n"
        )
    return "\n".join(lines)
