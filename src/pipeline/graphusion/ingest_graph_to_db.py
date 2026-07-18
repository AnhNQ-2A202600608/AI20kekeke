import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from supabase import Client, create_client

# Set project root path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from src.services.supabase_config import get_backend_supabase_config  # noqa: E402

# Load environment variables
load_dotenv(os.path.join(project_root, ".env"))

COURSE_ID = "00000000-0000-0000-0000-000000000001"


def get_concept_uuid(code: str) -> str:
    # Use deterministic UUID based on code (matching migrate_quizzes.py)
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"concept.{code}"))


def get_relation_uuid(source_code: str, relation_type: str, target_code: str) -> str:
    # Use deterministic UUID for relations
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"relation.{source_code}.{relation_type}.{target_code}"))


def ingest_graph():
    config = get_backend_supabase_config(allow_stub=True)

    if config.is_stub:
        print("[!] Lỗi: Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong file .env")
        sys.exit(1)

    fused_graph_path = Path(project_root) / "outputs" / "fused_graph.json"
    if not fused_graph_path.exists():
        print(f"[!] Không tìm thấy file đồ thị tại: {fused_graph_path}. Vui lòng chạy các Phase trước.")
        sys.exit(1)

    with open(fused_graph_path, encoding="utf-8") as f:
        graph_data = json.load(f)

    concepts = graph_data.get("concepts", [])
    relations = graph_data.get("relations", [])

    print(f"[*] Đang kết nối tới Supabase tại: {config.url}...")
    supabase: Client = create_client(config.url, config.secret_key)

    try:
        # Disable RLS temporarily for dev safety (matching migrate_quizzes.py)
        try:
            supabase.rpc("disable_rls_dev", {}).execute()
            print("[*] Đã tạm thời tắt RLS cho môi trường phát triển qua RPC.")
        except Exception as rls_err:
            print(f"[Warning] Bỏ qua lỗi RPC disable_rls_dev (có thể RLS đã tắt): {rls_err}")

        # 1. Đảm bảo course mặc định tồn tại
        print("[*] Đang đảm bảo Course tồn tại...")
        supabase.schema("app").table("courses").upsert(
            {"id": COURSE_ID, "code": "ai-bootcamp", "title": "AI & LLM Bootcamp", "status": "active"}
        ).execute()

        # 2. Nạp toàn bộ Concepts
        print("[*] Đang nạp Concepts...")
        concept_code_to_uuid = {}
        for c in concepts:
            concept_uuid = get_concept_uuid(c["code"])
            concept_code_to_uuid[c["code"]] = concept_uuid

            payload = {
                "id": concept_uuid,
                "course_id": COURSE_ID,
                "code": c["code"],
                "name": c["name"],
                "description": c["description"],
                "status": "active",
            }
            supabase.schema("app").table("concepts").upsert(payload).execute()

        print(f"  [+] Đã nạp/cập nhật thành công {len(concepts)} concepts.")

        # 3. Nạp toàn bộ Relations
        print("[*] Đang nạp Relations...")
        relations_inserted = 0
        for r in relations:
            source_code = r["source"]
            target_code = r["target"]
            relation_type = r["relation"]

            source_id = concept_code_to_uuid.get(source_code)
            target_id = concept_code_to_uuid.get(target_code)

            if not source_id or not target_id:
                print(f"  [Warning] Bỏ qua quan hệ {source_code} -> {target_code} vì thiếu UUID.")
                continue

            relation_uuid = get_relation_uuid(source_code, relation_type, target_code)

            payload = {
                "id": relation_uuid,
                "course_id": COURSE_ID,
                "source_concept_id": source_id,
                "target_concept_id": target_id,
                "relation_type": relation_type,
                "weight": 1.0,
                "status": "approved",
            }
            supabase.schema("app").table("concept_relations").upsert(payload).execute()
            relations_inserted += 1

        print(f"  [+] Đã nạp/cập nhật thành công {relations_inserted} relations.")
        print("\n[+] Đồng bộ hóa đồ thị với database Supabase thành công!")

    except Exception as e:
        print(f"\n[!] Lỗi khi nạp dữ liệu đồ thị lên Supabase: {e}")
        sys.exit(1)


if __name__ == "__main__":
    ingest_graph()
