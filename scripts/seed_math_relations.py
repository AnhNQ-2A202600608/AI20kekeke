import sys
import os
import uuid
from pathlib import Path
from collections import defaultdict
from dotenv import load_dotenv
from supabase import Client, create_client

# Add root folder to python path to resolve config
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

# Reconfigure stdout/stderr to support Vietnamese Unicode printing on Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

from src.services.supabase_config import get_backend_supabase_config  # noqa: E402

# Load environment variables
load_dotenv(dotenv_path=root_dir / ".env")

SUPABASE_CONFIG = get_backend_supabase_config(allow_stub=True)
SUPABASE_URL = SUPABASE_CONFIG.url
SUPABASE_KEY = SUPABASE_CONFIG.secret_key

if SUPABASE_CONFIG.is_stub:
    print("[ERROR] SUPABASE_URL or SUPABASE_SECRET_KEY is missing.")
    sys.exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Constants
COURSE_ID = "cf76850d-0738-50c3-bf34-1c464fa3b4d3"
COURSE_CODE = "math-k6"
RELATION_TYPE = "Prerequisite_of"

# Define prerequisite relations (source -> target)
RAW_EDGES = [
    # Mạch 1: Số tự nhiên (15 edges gốc + 8 edges bổ sung)
    ("tap-hop", "khai-niem-so-tu-nhien"),
    ("khai-niem-so-tu-nhien", "phep-cong"),
    ("khai-niem-so-tu-nhien", "phep-tru"),
    ("phep-cong", "phep-nhan"),
    ("phep-nhan", "phep-chia"),
    ("phep-chia", "phep-chia-co-du"),
    ("phep-nhan", "chia-het"),
    ("chia-het", "dau-hieu-chia-het"),
    ("chia-het", "so-nguyen-to"),
    ("so-nguyen-to", "hop-so"),
    ("chia-het", "uoc"),
    ("chia-het", "boi"),
    ("uoc", "ucln"),
    ("boi", "boi-chung"),
    ("boi-chung", "boi-chung-nho-nhat"),
    ("tap-hop", "phan-tu-cua-tap-hop"),
    ("tap-hop", "mo-ta-tap-hop"),
    ("tap-hop", "giao-cua-hai-tap-hop"),
    ("phep-cong", "tinh-chat-giao-hoan"),
    ("phep-cong", "tinh-chat-ket-hop"),
    ("phep-nhan", "tinh-chat-phan-phoi"),
    ("chia-het", "tinh-chat-chia-het"),
    ("khai-niem-so-tu-nhien", "so-lien-truoc-so-lien-sau"),

    # Mạch 2: Số nguyên (8 edges gốc + 4 edges bổ sung)
    ("khai-niem-so-tu-nhien", "so-nguyen-am"),
    ("so-nguyen-am", "so-nguyen"),
    ("so-nguyen", "cong-hai-so-nguyen-cung-dau"),
    ("so-nguyen", "cong-hai-so-nguyen-khac-dau"),
    ("so-nguyen", "quy-tac-tru-hai-so-nguyen"),
    ("so-nguyen", "nhan-hai-so-nguyen-cung-dau"),
    ("so-nguyen", "nhan-hai-so-nguyen-khac-dau"),
    ("so-nguyen", "so-sanh-hai-so-nguyen"),
    ("so-nguyen-am", "truc-so"),
    ("so-nguyen", "tap-hop-so-nguyen"),
    ("so-nguyen", "quy-tac-dau-ngoc"),
    ("so-nguyen-am", "so-doi"),
    ("so-doi", "cong-hai-so-nguyen-khac-dau"),

    # Mạch 3: Phân số (18 edges gốc + 4 edges bổ sung)
    ("phep-chia", "phan-so"),
    ("phan-so", "tu-so-mau-so"),
    ("phan-so", "phan-so-bang-nhau"),
    ("phan-so-bang-nhau", "rut-gon-phan-so"),
    ("ucln", "rut-gon-phan-so"),
    ("boi-chung-nho-nhat", "quy-dong-mau-so"),
    ("quy-dong-mau-so", "so-sanh-phan-so"),
    ("quy-dong-mau-so", "phep-cong-hai-phan-so-cung-mau"),
    ("phep-cong-hai-phan-so-cung-mau", "phep-tru-hai-phan-so"),
    ("phan-so", "quy-tac-nhan-hai-phan-so"),
    ("quy-tac-nhan-hai-phan-so", "phan-so-nghich-dao"),
    ("phan-so-nghich-dao", "quy-tac-chia-hai-phan-so"),
    ("phan-so", "hon-so-duong"),
    ("phan-so", "ti-so"),
    ("ti-so", "ti-so-phan-tram"),
    ("phan-so", "phan-so-thap-phan"),
    ("ti-so-phan-tram", "tim-gia-tri-phan-so-cua-mot-so-cho-truoc"),
    ("ti-so-phan-tram", "tim-mot-so-biet-gia-tri-phan-so-cua-no"),
    ("phan-so-bang-nhau", "tinh-chat-phan-so"),
    ("boi-chung-nho-nhat", "mau-so-chung"),
    ("phan-so", "so-doi-cua-phan-so"),
    ("so-doi-cua-phan-so", "phep-tru-hai-phan-so"),

    # Mạch 4: Số thập phân (8 edges gốc + 2 edges bổ sung)
    ("phan-so-thap-phan", "so-thap-phan-duong"),
    ("so-thap-phan-duong", "lam-tron-so-thap-phan"),
    ("so-thap-phan-duong", "phep-cong-so-thap-phan"),
    ("so-thap-phan-duong", "phep-tru-so-thap-phan"),
    ("so-thap-phan-duong", "phep-nhan-so-thap-phan"),
    ("so-thap-phan-duong", "phep-chia-so-thap-phan"),
    ("so-thap-phan-duong", "so-thap-phan-am"),
    ("so-thap-phan-duong", "tinh-chat-bac-cau"),  # Đã sửa typo ở đây
    ("so-thap-phan-duong", "uoc-luong-ket-qua"),

    # Mạch 5: Hình học phẳng (23 edges gốc + 10 edges bổ sung)
    ("khai-niem-so-tu-nhien", "doan-thang"),
    ("doan-thang", "do-dai-doan-thang"),
    ("doan-thang", "duong-thang-di-qua-hai-diem"),
    ("doan-thang", "ba-diem-thang-hang"),
    ("doan-thang", "trung-diem-cua-doan-thang"),
    ("duong-thang-di-qua-hai-diem", "duong-thang-cat-nhau"),
    ("duong-thang-di-qua-hai-diem", "duong-thang-song-song"),
    ("duong-thang-di-qua-hai-diem", "duong-thang-trung-nhau"),
    ("doan-thang", "tia"),
    ("tia", "goc"),
    ("goc", "so-do-goc"),
    ("so-do-goc", "goc-vuong"),
    ("so-do-goc", "goc-nhon"),
    ("so-do-goc", "goc-tu"),
    ("so-do-goc", "goc-bet"),
    ("goc-vuong", "hinh-vuong"),
    ("hinh-vuong", "dien-tich-hinh-vuong"),
    ("hinh-vuong", "chu-vi-hinh-vuong"),
    ("doan-thang", "chu-vi-hinh-chu-nhat"),
    ("chu-vi-hinh-chu-nhat", "dien-tich-hinh-chu-nhat"),
    ("dien-tich-hinh-binh-hanh", "dien-tich-hinh-thang"),
    ("hinh-vuong", "tam-doi-xung"),
    ("tam-doi-xung", "hinh-co-tam-doi-xung"),
    ("duong-thang-di-qua-hai-diem", "diem-thuoc-duong-thang"),
    ("duong-thang-di-qua-hai-diem", "diem-khong-thuoc-duong-thang"),
    ("doan-thang", "diem-nam-giua-hai-diem"),
    ("doan-thang", "chu-vi-hinh-thang"),
    ("doan-thang", "chu-vi-hinh-thoi"),
    ("tia", "hai-tia-doi-nhau"),
    ("goc", "dinh-cua-goc"),
    ("goc", "canh-cua-goc"),
    ("dien-tich-hinh-binh-hanh", "chu-vi-hinh-binh-hanh"),
    ("dien-tich-hinh-binh-hanh", "dien-tich-hinh-thoi"),
    ("tam-doi-xung", "hinh-tam-giac-deu"),

    # Mạch 6: Thống kê & Xác suất (8 edges gốc + 1 edge bổ sung)
    ("du-lieu", "thu-thap-du-lieu"),
    ("thu-thap-du-lieu", "bang-thong-ke"),
    ("bang-thong-ke", "bieu-do-tranh"),
    ("bang-thong-ke", "bieu-do-cot"),
    ("bieu-do-cot", "bieu-do-cot-kep"),
    ("ket-qua-co-the", "su-kien"),
    ("su-kien", "ti-so-xac-suat-thuc-nghiem"),
    ("ti-so-xac-suat-thuc-nghiem", "xac-suat-thuc-nghiem"),
    ("du-lieu", "so-lieu")
]

def get_relation_uuid(course_code: str, source_code: str, relation_type: str, target_code: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, f"relation.{course_code}.{source_code}.{relation_type}.{target_code}"))

def detect_cycles(edges):
    """DFS cycle detection for security validation."""
    adj = defaultdict(list)
    for src, dst in edges:
        adj[src].append(dst)
        
    visited = {}
    
    def dfs(node):
        visited[node] = 1 # Visiting
        for neighbor in adj[node]:
            if visited.get(neighbor) == 1:
                return True # Cycle detected
            if visited.get(neighbor) != 2:
                if dfs(neighbor):
                    return True
        visited[node] = 2 # Visited
        return False

    all_nodes = set(src for src, _ in edges).union(dst for _, dst in edges)
    for node in all_nodes:
        if visited.get(node) != 2:
            if dfs(node):
                return True
    return False

def main():
    # 1. Cycle detection pre-flight check
    print("[*] Running pre-flight cycle detection on the defined DAG edges...")
    if detect_cycles(RAW_EDGES):
        print("[ERROR] Cycle detected in the proposed DAG! Aborting seed operation.")
        sys.exit(1)
    print("[+] No cycles found. Proposed DAG is a valid directed acyclic graph.")

    # 2. Get active concepts mapping code -> ID
    print("[*] Loading active concepts from DB...")
    res = supabase.schema("app").table("concepts").select("id, code, status").eq("course_id", COURSE_ID).eq("status", "active").execute()
    concepts = res.data or []
    concept_map = {c["code"]: c["id"] for c in concepts}
    print(f"[+] Loaded {len(concepts)} active concepts.")

    # 3. Clean existing relations for this course
    print("[*] Cleaning existing concept relations for the course...")
    del_res = supabase.schema("app").table("concept_relations").delete().eq("course_id", COURSE_ID).execute()
    print(f"[+] Deleted existing relations from DB.")

    # 4. Insert new relations
    relations_to_insert = []
    skipped_count = 0

    for src_code, dst_code in RAW_EDGES:
        src_id = concept_map.get(src_code)
        dst_id = concept_map.get(dst_code)
        
        if not src_id:
            print(f"[WARNING] Skipping relation: source concept '{src_code}' not found or archived in DB.")
            skipped_count += 1
            continue
        if not dst_id:
            print(f"[WARNING] Skipping relation: target concept '{dst_code}' not found or archived in DB.")
            skipped_count += 1
            continue
            
        rel_id = get_relation_uuid(COURSE_CODE, src_code, RELATION_TYPE, dst_code)
        
        payload = {
            "id": rel_id,
            "course_id": COURSE_ID,
            "source_concept_id": src_id,
            "target_concept_id": dst_id,
            "relation_type": RELATION_TYPE,
            "weight": 1.0,
            "status": "approved"
        }
        relations_to_insert.append(payload)

    if not relations_to_insert:
        print("[ERROR] No valid relations to insert. Check warnings above.")
        sys.exit(1)

    print(f"[*] Inserting {len(relations_to_insert)} approved relations to Supabase...")
    supabase.schema("app").table("concept_relations").upsert(relations_to_insert).execute()
    print(f"[SUCCESS] Successfully seeded {len(relations_to_insert)} relations (skipped {skipped_count}).")

    # 5. Post-seed checks
    print("\n[*] Running post-seed checks...")
    # Count check
    check_res = supabase.schema("app").table("concept_relations").select("id").eq("course_id", COURSE_ID).execute()
    db_count = len(check_res.data or [])
    print(f"  - Relations count in DB: {db_count} (Expected: {len(relations_to_insert)})")
    
    # Orphan check
    all_active_codes = set(concept_map.keys())
    connected_codes = set()
    for s, t in RAW_EDGES:
        if s in concept_map and t in concept_map:
            connected_codes.add(s)
            connected_codes.add(t)
            
    orphans = all_active_codes - connected_codes
    print(f"  - Active concepts: {len(all_active_codes)}")
    print(f"  - Connected concepts: {len(connected_codes)}")
    print(f"  - Orphan concepts not in DAG: {len(orphans)}")
    if orphans:
        print("  - List of orphan concept codes:")
        for o in sorted(orphans):
            print(f"    * {o}")

if __name__ == "__main__":
    main()
