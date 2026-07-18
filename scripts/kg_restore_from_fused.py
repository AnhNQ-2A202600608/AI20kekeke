"""Restore script: Nạp lại dữ liệu đồ thị tri thức từ các file fused graph đã lưu
(outputs/kg_fused/fused_math.json và outputs/kg_fused/fused_history_geo.json)
vào Supabase để hoàn tác việc xóa nhầm dữ liệu.
"""
from __future__ import annotations
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

_PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(_PROJECT_ROOT))

load_dotenv(_PROJECT_ROOT / ".env")

from src.pipeline.graphusion.run_context import RunContext
from src.pipeline.graphusion.ingest_graph_to_db import IngestionService
from src.pipeline.graphusion.document_chunker import DocumentChunk

def restore_subject(subject: str, course_code: str, fused_json_path: Path):
    if not fused_json_path.exists():
        print(f"[x] Không tìm thấy file fused graph: {fused_json_path}")
        return

    print(f"\n=== Restoring {subject} ({course_code}) từ {fused_json_path.name} ===")
    with open(fused_json_path, encoding="utf-8") as f:
        graph_data = json.load(f)

    concepts = graph_data.get("concepts", [])
    relations = graph_data.get("relations", [])
    print(f"[*] Đọc từ file: {len(concepts)} concepts, {len(relations)} relations.")

    run_ctx = RunContext.create(subject, 6, course_code)
    service = IngestionService()
    
    # 1. Đăng ký extraction run
    service.create_extraction_run(run_ctx)

    # 2. Tạo document manifest
    doc_code = f"{course_code}-sgk"
    doc_title = "Toán lớp 6 SGK" if subject == "math" else "Lịch sử và Địa lí lớp 6 SGK"
    documents = [{
        "document_code": doc_code,
        "title": doc_title,
        "source_type": "SGK",
        "checksum": "legacy_restore",
        "status": "success"
    }]

    # 3. Tạo mock chunks cho concepts & relations để đảm bảo tính toàn vẹn khóa ngoại (FK)
    chunks = []
    chunk_seen = set()

    # Thêm chunk cho concepts
    for c in concepts:
        page = c.get("source_page") or c.get("page_start") or 0
        chunk_id = f"{course_code}-sgk-page-{page}"
        c["source_chunk_ids"] = [chunk_id]
        c["evidence"] = [c.get("description", "")]
        c["page_start"] = page
        c["page_end"] = page
        c["concept_type"] = c.get("concept_type") or "knowledge"
        
        if chunk_id not in chunk_seen:
            chunk_seen.add(chunk_id)
            chunks.append(DocumentChunk(
                chunk_id=chunk_id,
                document_id=doc_code,
                chunk_index=page,
                content=c.get("description", ""),
                content_hash=c["code"],
                source_type="SGK",
                page_start=page,
                page_end=page
            ))

    # Thêm chunk cho relations
    for r in relations:
        page = r.get("source_page") or 0
        chunk_id = f"{course_code}-sgk-page-{page}"
        r["source_chunk_id"] = chunk_id
        r["relation_type"] = r.get("relation") or r.get("relation_type") or "Prerequisite_of"
        r["confidence"] = r.get("confidence") or 1.0
        
        if chunk_id not in chunk_seen:
            chunk_seen.add(chunk_id)
            chunks.append(DocumentChunk(
                chunk_id=chunk_id,
                document_id=doc_code,
                chunk_index=page,
                content=r.get("evidence", ""),
                content_hash=r["source"] + r["target"],
                source_type="SGK",
                page_start=page,
                page_end=page
            ))

    # 4. Ingest vào database bằng bulk upsert (đã được tối ưu)
    res = service.ingest_graph(
        run_ctx=run_ctx,
        documents=documents,
        chunks=chunks,
        concepts=concepts,
        relations=relations
    )

    # 5. Cập nhật trạng thái run hoàn tất
    service.update_extraction_run_status(
        run_ctx,
        "completed",
        {"concepts": len(concepts), "relations": len(relations)}
    )

    print(f"[+] Đã khôi phục hoàn tất {res['concepts_written']} concepts và {res['relations_written']} relations vào database.")

def main():
    fused_math = _PROJECT_ROOT / "outputs" / "kg_fused" / "fused_math.json"
    fused_hg = _PROJECT_ROOT / "outputs" / "kg_fused" / "fused_history_geo.json"

    restore_subject("math", "math-k6", fused_math)
    restore_subject("history_geo", "hist-geo-k6", fused_hg)

if __name__ == "__main__":
    main()
