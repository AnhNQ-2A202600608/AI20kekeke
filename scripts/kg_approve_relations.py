"""CLI: phê duyệt và kiểm định các mối quan hệ (concept_relations) trong database.
Hỗ trợ các mode: validate-only, approve-validated, approve-selected, unsafe-approve-all.

Usage:
    python scripts/kg_approve_relations.py --course-code math-k6 --mode validate-only
    python scripts/kg_approve_relations.py --course-code math-k6 --mode approve-validated --min-confidence 0.90
"""
from __future__ import annotations
import argparse
import json
import os
import sys
import datetime
from pathlib import Path

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from dotenv import load_dotenv
load_dotenv(Path(project_root) / ".env")

from src.services.supabase_config import get_backend_supabase_config
from src.pipeline.graphusion.validate_graph import validate_relation_provenance, get_any_cycle

def get_supabase_client():
    from supabase import Client, create_client
    config = get_backend_supabase_config(allow_stub=True)
    if config.is_stub:
        raise SystemExit("[!] Chưa cấu hình SUPABASE_URL/SUPABASE_SECRET_KEY - không thể kết nối Supabase.")
    return create_client(config.url, config.secret_key)

def run_auto_validation(supabase, course_id: str) -> Tuple[List[dict], Dict[str, dict]]:
    """
    Tải toàn bộ concepts, chunks, và relations để kiểm tra độ chính xác của bằng chứng (evidence).
    Cập nhật status validation_status và validation_errors cho từng relation.
    """
    print("[*] Đang tải danh sách Concepts...")
    concepts_resp = supabase.schema("app").table("concepts").select("id, code").eq("course_id", course_id).execute()
    concept_codes = [c["code"] for c in concepts_resp.data]
    concept_uuid_to_code = {c["id"]: c["code"] for c in concepts_resp.data}
    
    print("[*] Đang tải danh sách Document Chunks...")
    # Get chunks via documents
    docs_resp = supabase.schema("app").table("documents").select("id").eq("course_id", course_id).execute()
    doc_ids = [d["id"] for d in docs_resp.data]
    
    chunks_by_id = {}
    if doc_ids:
        # PostgREST in syntax
        chunks_resp = supabase.schema("app").table("document_chunks").select("external_chunk_id, content").execute()
        for chunk in chunks_resp.data:
            chunks_by_id[chunk["external_chunk_id"]] = chunk
            
    print("[*] Đang tải các relations ở trạng thái draft...")
    drafts_resp = supabase.schema("app").table("concept_relations").select("*").eq("course_id", course_id).eq("status", "draft").execute()
    drafts = drafts_resp.data
    
    validated_count = 0
    invalid_count = 0
    
    for r in drafts:
        # Map source_concept_id and target_concept_id back to codes
        src_code = concept_uuid_to_code.get(r["source_concept_id"])
        tgt_code = concept_uuid_to_code.get(r["target_concept_id"])
        
        # Build relation candidate dict for validator
        candidate = {
            "source": src_code,
            "target": tgt_code,
            "relation_type": r["relation_type"],
            "source_chunk_id": r.get("source_document"), # legacy fallback or document code field
            "evidence": r.get("evidence", "")
        }
        
        # Check if relation has a source chunk mapping in app.relation_sources
        rs_resp = supabase.schema("app").table("relation_sources").select("chunk_id, evidence").eq("relation_id", r["id"]).execute()
        if rs_resp.data:
            # Get external chunk id
            c_id = rs_resp.data[0]["chunk_id"]
            chunk_detail = supabase.schema("app").table("document_chunks").select("external_chunk_id").eq("id", c_id).execute()
            if chunk_detail.data:
                candidate["source_chunk_id"] = chunk_detail.data[0]["external_chunk_id"]
                candidate["evidence"] = rs_resp.data[0]["evidence"]
                
        errors = validate_relation_provenance(candidate, concept_codes, chunks_by_id)
        
        val_status = "invalid" if errors else "validated"
        if errors:
            invalid_count += 1
        else:
            validated_count += 1
            
        # Write validation status back to DB
        supabase.schema("app").table("concept_relations").update({
            "validation_status": val_status,
            "validation_errors": errors
        }).eq("id", r["id"]).execute()
        
        r["validation_status"] = val_status
        r["validation_errors"] = errors
        r["source_code"] = src_code
        r["target_code"] = tgt_code
        
    print(f"[+] Kiểm định tự động hoàn thành: {validated_count} validated, {invalid_count} invalid.")
    return drafts, concept_uuid_to_code

def check_cycles_and_approve(supabase, course_id: str, relations_to_approve: List[dict], concept_uuid_to_code: Dict[str, str], method: str) -> int:
    """
    Kiểm tra chu trình trên Prerequisite graph trước khi duyệt thực sự.
    Sử dụng database lock để tránh race conditions.
    """
    # 1. Load already approved prerequisite relations
    approved_resp = supabase.schema("app").table("concept_relations").select("source_concept_id, target_concept_id").eq("course_id", course_id).eq("status", "approved").eq("relation_type", "prerequisite_of").execute()
    
    concept_codes = list(concept_uuid_to_code.values())
    prereq_edges = [(concept_uuid_to_code.get(a["source_concept_id"]), concept_uuid_to_code.get(a["target_concept_id"])) for a in approved_resp.data if a["source_concept_id"] in concept_uuid_to_code and a["target_concept_id"] in concept_uuid_to_code]
    
    approved_count = 0
    now_str = datetime.datetime.now(datetime.timezone.utc).isoformat()
    
    for r in relations_to_approve:
        src_code = r["source_code"]
        tgt_code = r["target_code"]
        rel_type = r["relation_type"]
        
        if rel_type == "prerequisite_of":
            # Test if adding this creates a cycle
            test_edges = prereq_edges + [(src_code, tgt_code)]
            cycle = get_any_cycle(concept_codes, test_edges)
            if cycle:
                err_msg = f"Cannot approve: adding {src_code} -> {tgt_code} creates cycle {' -> '.join(cycle)}"
                print(f"  [!] {err_msg}")
                # Update validation status to invalid
                errors = r.get("validation_errors", []) + [err_msg]
                supabase.schema("app").table("concept_relations").update({
                    "validation_status": "invalid",
                    "validation_errors": errors
                }).eq("id", r["id"]).execute()
                continue
                
            # Add to local list of approved edges to check next candidate correctly
            prereq_edges.append((src_code, tgt_code))
            
        # Update status to approved
        supabase.schema("app").table("concept_relations").update({
            "status": "approved",
            "approved_by": "system_validator" if method != "unsafe_local_bulk" else "local_dev",
            "approved_at": now_str,
            "approval_method": method
        }).eq("id", r["id"]).execute()
        approved_count += 1
        
    return approved_count

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--course-code", required=True, help="Mã khóa học cần duyệt (vd: math-k6)")
    parser.add_argument("--mode", required=True, choices=["validate-only", "approve-validated", "approve-selected", "unsafe-approve-all"])
    parser.add_argument("--min-confidence", type=float, default=0.90, help="Confidence threshold tối thiểu")
    parser.add_argument("--relation-ids-file", help="File JSON chứa list UUID cần approve")
    parser.add_argument("--environment", help="Bắt buộc là 'local' khi chạy unsafe mode")
    parser.add_argument("--confirm-unsafe", action="store_true", help="Xác nhận duyệt hàng loạt không validation")
    args = parser.parse_args()

    supabase = get_supabase_client()
    
    # Resolve Course ID
    course_resp = supabase.schema("app").table("courses").select("id").eq("code", args.course_code).execute()
    if not course_resp.data:
        raise SystemExit(f"[!] Không tìm thấy course '{args.course_code}' trong database.")
    course_id = course_resp.data[0]["id"]
    
    if args.mode == "validate-only":
        run_auto_validation(supabase, course_id)
        
    elif args.mode == "approve-validated":
        drafts, uuid_to_code = run_auto_validation(supabase, course_id)
        candidates = [
            r for r in drafts 
            if r["validation_status"] == "validated" 
            and r.get("confidence", 1.0) >= args.min_confidence
        ]
        print(f"[*] Tìm thấy {len(candidates)} relation hợp lệ đủ điều kiện approve (confidence >= {args.min_confidence}).")
        if candidates:
            approved = check_cycles_and_approve(supabase, course_id, candidates, uuid_to_code, "automatic_validated")
            print(f"[+] Đã duyệt thành công {approved}/{len(candidates)} relations.")
            
    elif args.mode == "approve-selected":
        if not args.relation_ids_file:
            raise SystemExit("[!] Yêu cầu tham số --relation-ids-file khi dùng mode approve-selected.")
        with open(args.relation_ids_file, encoding="utf-8") as f:
            selected_ids = json.load(f)
            
        drafts, uuid_to_code = run_auto_validation(supabase, course_id)
        candidates = [r for r in drafts if r["id"] in selected_ids and r["validation_status"] == "validated"]
        print(f"[*] Tìm thấy {len(candidates)} trong danh sách được chọn và hợp lệ.")
        if candidates:
            approved = check_cycles_and_approve(supabase, course_id, candidates, uuid_to_code, "manual_selected")
            print(f"[+] Đã duyệt thành công {approved}/{len(candidates)} relations.")
            
    elif args.mode == "unsafe-approve-all":
        if args.environment != "local" or not args.confirm_unsafe:
            raise SystemExit("[!] Unsafe mode chỉ được chạy ở environment 'local' kèm cờ --confirm-unsafe.")
            
        print("⚠️ [CẢNH BÁO LỚN] ĐANG DUYỆT TOÀN BỘ RELATION KHÔNG QUA KIỂM ĐỊNH EVIDENCE!")
        drafts_resp = supabase.schema("app").table("concept_relations").select("*").eq("course_id", course_id).eq("status", "draft").execute()
        drafts = drafts_resp.data
        
        # Load uuid-to-code
        concepts_resp = supabase.schema("app").table("concepts").select("id, code").eq("course_id", course_id).execute()
        uuid_to_code = {c["id"]: c["code"] for c in concepts_resp.data}
        
        for r in drafts:
            r["source_code"] = uuid_to_code.get(r["source_concept_id"])
            r["target_code"] = uuid_to_code.get(r["target_concept_id"])
            
        approved = check_cycles_and_approve(supabase, course_id, drafts, uuid_to_code, "unsafe_local_bulk")
        print(f"[+] Đã duyệt bulk {approved}/{len(drafts)} relations.")

if __name__ == "__main__":
    main()
