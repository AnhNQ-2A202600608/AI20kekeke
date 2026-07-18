"""Ghi concept/relation Sử-Địa đã trích xuất vào Supabase.
"""
# ruff: noqa: E402
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.pipeline.graphusion.document_chunker import DocumentChunk
from src.pipeline.graphusion.ingest_graph_to_db import IngestionService
from src.pipeline.graphusion.normalize_concepts import normalize_and_deduplicate
from src.pipeline.graphusion.run_context import RunContext
from src.pipeline.graphusion.validate_graph import validate_prerequisite_dag

DEFAULT_COURSE_CODE = "hist-geo-k6"
DEFAULT_COURSE_TITLE = "Lịch sử và Địa lí lớp 6"

def merge_lesson_files(paths: list[Path]) -> dict:
    concepts_by_code: dict[str, dict] = {}
    relations = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        for c in data.get("concepts", []):
            concepts_by_code[c["code"]] = c
        relations.extend(data.get("relations", []))
    return {"concepts": list(concepts_by_code.values()), "relations": relations}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson_files", nargs="+", help="1 hoặc nhiều file history_geo_lesson_knowledge.json")
    parser.add_argument("--course-code", default=DEFAULT_COURSE_CODE)
    parser.add_argument("--course-title", default=DEFAULT_COURSE_TITLE)
    parser.add_argument("--dry-run", action="store_true", help="Validate nhưng không ghi Supabase")
    args = parser.parse_args()

    paths = [Path(p) for p in args.lesson_files]
    for p in paths:
        if not p.exists():
            print(f"[!] Không tìm thấy file: {p}")
            sys.exit(1)

    merged = merge_lesson_files(paths)

    # Setup Run Context
    os.environ["SUPABASE_URL_STUB"] = "true" if args.dry_run else "false"
    run_ctx = RunContext.create("history_geo", 6, args.course_code)

    # Normalize & Validate
    concepts, relations, norm_report = normalize_and_deduplicate(merged["concepts"], merged["relations"])

    # Build dummy chunks representing the evidence for provenance integrity
    chunks = []
    chunk_seen = set()
    for c in concepts:
        for chunk_id in c.get("source_chunk_ids", []):
            if chunk_id not in chunk_seen:
                chunk_seen.add(chunk_id)
                chunks.append(DocumentChunk(
                    chunk_id=chunk_id,
                    document_id="hist-geo-k6-sgk",
                    chunk_index=0,
                    content=c.get("evidence", [""])[0] if c.get("evidence") else c.get("description", ""),
                    content_hash=c["code"],
                    source_type="SGK"
                ))
    for r in relations:
        chunk_id = r.get("source_chunk_id")
        if chunk_id and chunk_id not in chunk_seen:
            chunk_seen.add(chunk_id)
            chunks.append(DocumentChunk(
                chunk_id=chunk_id,
                document_id="hist-geo-k6-sgk",
                chunk_index=0,
                content=r.get("evidence", ""),
                content_hash=r["source"] + r["target"],
                source_type="SGK"
            ))

    chunks_by_id = {c.chunk_id: c.model_dump() for c in chunks}
    concept_codes = [c["code"] for c in concepts]
    clean_relations, val_report = validate_prerequisite_dag(concept_codes, relations, chunks_by_id)

    # Ingest using unified service
    service = IngestionService()
    if not args.dry_run:
        service.create_extraction_run(run_ctx)

    doc_manifest = [{"document_code": "hist-geo-k6-sgk", "source_type": "SGK", "checksum": "legacy"}]
    res = service.ingest_graph(
        run_ctx=run_ctx,
        documents=doc_manifest,
        chunks=chunks,
        concepts=concepts,
        relations=clean_relations
    )

    if not args.dry_run:
        service.update_extraction_run_status(run_ctx, "completed", {"concepts": len(concepts), "relations": len(clean_relations)})

    print(f"[+] Hoàn thành nạp {res['concepts_written']} concepts và {res['relations_written']} relations.")

if __name__ == "__main__":
    main()
