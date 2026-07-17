"""Ghi concept/relation đã trích xuất (extract_math_knowledge.py) vào Supabase,
cho domain Toán - KHÔNG dùng chung course_id "ai-bootcamp" như
ingest_graph_to_db.py cũ.

Khác biệt quan trọng so với ingest_graph_to_db.py (đã xác nhận có lỗ hổng thật):
- status mặc định là "draft", KHÔNG tự "approved". Review dùng chính endpoint
  đã có sẵn: PATCH /api/v1/adaptive/graph/relations/{id} (role teacher/mentor),
  không cần xây review portal mới.
- Ghi kèm source_document/source_page (provenance) lấy từ extract_math_knowledge.py.

Yêu cầu SUPABASE_URL + SUPABASE_SECRET_KEY trong environment (không có trong
môi trường dev hiện tại tại thời điểm viết script này - xem README mục
Environment Variables).
"""

import argparse
import json
import os
import sys
import uuid
from pathlib import Path

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.pipeline.graphusion.fuse_graphs import enforce_dag  # noqa: E402

DEFAULT_MATH_COURSE_CODE = "math-k1-9"
DEFAULT_MATH_COURSE_TITLE = "Toán phổ thông lớp 1-9 (Kết Nối Tri Thức)"


def get_concept_uuid(course_code: str, concept_code: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"concept.{course_code}.{concept_code}"))


def get_relation_uuid(course_code: str, source_code: str, relation_type: str, target_code: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"relation.{course_code}.{source_code}.{relation_type}.{target_code}"))


def merge_lesson_files(paths: list[Path]) -> dict:
    """Gộp nhiều file math_lesson_knowledge.json (mỗi file = 1 bài học) thành
    1 danh sách concepts/relations, dedupe theo concept code."""
    concepts_by_code: dict[str, dict] = {}
    relations = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        for c in data.get("concepts", []):
            concepts_by_code[c["code"]] = c  # ghi đè nếu trùng code, giữ bản gần nhất
        relations.extend(data.get("relations", []))
    return {"concepts": list(concepts_by_code.values()), "relations": relations}


def ingest(
    lesson_files: list[Path],
    course_code: str = DEFAULT_MATH_COURSE_CODE,
    course_title: str = DEFAULT_MATH_COURSE_TITLE,
    dry_run: bool = False,
):
    merged = merge_lesson_files(lesson_files)
    concepts = merged["concepts"]
    relations = merged["relations"]
    print(f"[*] Đã gộp {len(concepts)} concepts, {len(relations)} relations từ {len(lesson_files)} file.")

    # DAG enforcement dùng lại đúng thuật toán generic từ fuse_graphs.py (không
    # phụ thuộc domain AI-bootcamp). Dùng grade thay cho "day" làm trục thời gian.
    concept_grade_map = {c["code"]: c.get("grade") or 1 for c in concepts}
    concept_codes = [c["code"] for c in concepts]
    clean_relations = enforce_dag(concept_codes, relations, concept_grade_map)
    print(f"[+] Sau DAG enforcement: {len(clean_relations)} relations (đã loại cycle/self-relation nếu có).")

    if dry_run:
        print("[*] --dry-run: không ghi Supabase, chỉ in kết quả đã fuse.")
        print(json.dumps({"concepts": concepts, "relations": clean_relations}, ensure_ascii=False, indent=2)[:4000])
        return {"concepts": concepts, "relations": clean_relations, "written": False}

    from supabase import Client, create_client

    from src.services.supabase_config import get_backend_supabase_config

    config = get_backend_supabase_config(allow_stub=True)
    if config.is_stub:
        print("[!] Chưa cấu hình SUPABASE_URL/SUPABASE_SECRET_KEY - không thể ghi DB.")
        print("[!] Dùng --dry-run để xem kết quả fuse mà không cần kết nối DB.")
        sys.exit(1)

    supabase: Client = create_client(config.url, config.secret_key)

    print(f"[*] Đang đảm bảo course '{course_code}' tồn tại...")
    course_uuid = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"course.{course_code}"))
    supabase.schema("app").table("courses").upsert(
        {"id": course_uuid, "code": course_code, "title": course_title, "status": "active"}
    ).execute()

    concept_code_to_uuid = {}
    for c in concepts:
        concept_uuid = get_concept_uuid(course_code, c["code"])
        concept_code_to_uuid[c["code"]] = concept_uuid
        payload = {
            "id": concept_uuid,
            "course_id": course_uuid,
            "code": c["code"],
            "name": c["name"],
            "description": c.get("description"),
            "status": "active",
            "source_document": c.get("source_document"),
            "source_page": c.get("source_page"),
        }
        supabase.schema("app").table("concepts").upsert(payload).execute()
    print(f"[+] Đã nạp/cập nhật {len(concepts)} concepts.")

    written_relations = 0
    for r in clean_relations:
        source_id = concept_code_to_uuid.get(r["source"])
        target_id = concept_code_to_uuid.get(r["target"])
        if not source_id or not target_id:
            print(f"  [!] Bỏ qua relation thiếu UUID: {r['source']} -> {r['target']}")
            continue
        relation_uuid = get_relation_uuid(course_code, r["source"], r["relation"], r["target"])
        payload = {
            "id": relation_uuid,
            "course_id": course_uuid,
            "source_concept_id": source_id,
            "target_concept_id": target_id,
            "relation_type": r["relation"],
            "weight": 1.0,
            "status": "draft",  # KHÁC ingest_graph_to_db.py cũ: không tự approve.
            "source_document": r.get("source_document"),
            "source_page": r.get("source_page"),
        }
        supabase.schema("app").table("concept_relations").upsert(payload).execute()
        written_relations += 1
    print(
        f"[+] Đã nạp {written_relations} relations với status='draft' (chờ mentor duyệt qua "
        f"PATCH /api/v1/adaptive/graph/relations/{{id}})."
    )

    return {"course_id": course_uuid, "concepts_written": len(concepts), "relations_written": written_relations}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("lesson_files", nargs="+", help="1 hoặc nhiều file math_lesson_knowledge.json")
    parser.add_argument("--course-code", default=DEFAULT_MATH_COURSE_CODE)
    parser.add_argument("--course-title", default=DEFAULT_MATH_COURSE_TITLE)
    parser.add_argument("--dry-run", action="store_true", help="Fuse + validate nhưng không ghi Supabase")
    args = parser.parse_args()

    paths = [Path(p) for p in args.lesson_files]
    for p in paths:
        if not p.exists():
            print(f"[!] Không tìm thấy file: {p}")
            sys.exit(1)

    ingest(paths, args.course_code, args.course_title, args.dry_run)


if __name__ == "__main__":
    main()
