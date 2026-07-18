import sys
from collections import defaultdict, deque
from pathlib import Path

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
    print("[ERROR] SUPABASE_URL or SUPABASE_SECRET_KEY is missing from environment variables.")
    sys.exit(1)

print(f"Connecting to Supabase at: {SUPABASE_URL}")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Course ID for Toán lớp 6
COURSE_ID = "cf76850d-0738-50c3-bf34-1c464fa3b4d3"

# 1. Redundant concepts to archive (Nhóm B + tinh-chat-phep-nhan)
CONCEPTS_TO_ARCHIVE = [
    "ky-hieu-so-tu-nhien",
    "diem-bieu-dien-so-tu-nhien",
    "so-la-ma",
    "cach-viet-so-la-ma",
    "gia-tri-chu-so",
    "luu-y-phep-chia",
    "luu-y-phep-nhan",
    "tinh-bieu-thuc",
    "canh-dinh-goc",
    "diem-trong-cua-goc",
    "khoang-cach",
    "gap-giay-cat-hinh-co-tam-doi-xung",
    "giai-quyet-van-de-thuc-tien",
    "du-lieu-khong-phai-la-so",
    "du-lieu-khong-hop-li",
    "tinh-chat-phep-nhan"  # Nhóm C: Trùng lặp
]

# 2. Detailed Mapping for all active concepts: code -> (chapter, order, type)
# Types: core, property, skill, application
CURRICULUM_MAP = {
    # --- CHƯƠNG 1: Tập hợp các số tự nhiên ---
    "tap-hop": (1, 1, "core"),
    "phan-tu-cua-tap-hop": (1, 2, "property"),
    "mo-ta-tap-hop": (1, 3, "skill"),
    "giao-cua-hai-tap-hop": (1, 4, "core"),
    "khai-niem-so-tu-nhien": (1, 5, "core"),
    "he-thap-phan": (1, 6, "core"),
    "so-lien-truoc-so-lien-sau": (1, 7, "core"),
    "phep-cong": (1, 8, "core"),
    "tinh-chat-giao-hoan": (1, 9, "property"),
    "tinh-chat-ket-hop": (1, 10, "property"),
    "phep-tru": (1, 11, "core"),
    "phep-nhan": (1, 12, "core"),
    "tinh-chat-phan-phoi": (1, 13, "property"),
    "phep-chia": (1, 14, "core"),
    "phep-chia-co-du": (1, 15, "core"),

    # --- CHƯƠNG 2: Tính chia hết ---
    "chia-het": (2, 1, "core"),
    "tinh-chat-chia-het": (2, 2, "property"),
    "dau-hieu-chia-het": (2, 3, "property"),
    "uoc": (2, 4, "core"),
    "boi": (2, 5, "core"),
    "so-nguyen-to": (2, 6, "core"),
    "hop-so": (2, 7, "core"),
    "ucln": (2, 8, "skill"),
    "boi-chung": (2, 9, "core"),
    "boi-chung-nho-nhat": (2, 10, "skill"),

    # --- CHƯƠNG 3: Số nguyên ---
    "so-nguyen-am": (3, 1, "core"),
    "truc-so": (3, 2, "core"),
    "so-doi": (3, 3, "core"),
    "so-nguyen": (3, 4, "core"),
    "tap-hop-so-nguyen": (3, 5, "core"),
    "so-sanh-hai-so-nguyen": (3, 6, "skill"),
    "cong-hai-so-nguyen-cung-dau": (3, 7, "skill"),
    "cong-hai-so-nguyen-khac-dau": (3, 8, "skill"),
    "quy-tac-tru-hai-so-nguyen": (3, 9, "skill"),
    "quy-tac-dau-ngoc": (3, 10, "property"),
    "nhan-hai-so-nguyen-khac-dau": (3, 11, "skill"),
    "nhan-hai-so-nguyen-cung-dau": (3, 12, "skill"),

    # --- CHƯƠNG 4 & 5: Một số hình phẳng & Đối xứng ---
    "hinh-tam-giac-deu": (4, 1, "core"),
    "hinh-vuong": (4, 2, "core"),
    "chu-vi-hinh-vuong": (4, 3, "skill"),
    "dien-tich-hinh-vuong": (4, 4, "skill"),
    "chu-vi-hinh-thoi": (4, 5, "skill"),
    "dien-tich-hinh-thoi": (4, 6, "skill"),
    "chu-vi-hinh-thang": (4, 7, "skill"),
    "dien-tich-hinh-thang": (4, 8, "skill"),
    "chu-vi-hinh-binh-hanh": (4, 9, "skill"),
    "dien-tich-hinh-binh-hanh": (4, 10, "skill"),
    "hinh-luc-giac-deu": (4, 11, "core"),
    "tam-doi-xung": (5, 1, "property"),
    "hinh-co-tam-doi-xung": (5, 2, "core"),

    # --- CHƯƠNG 6: Phân số ---
    "phan-so": (6, 1, "core"),
    "tu-so-mau-so": (6, 2, "core"),
    "phan-so-bang-nhau": (6, 3, "property"),
    "tinh-chat-phan-so": (6, 4, "property"),
    "rut-gon-phan-so": (6, 5, "skill"),
    "mau-so-chung": (6, 6, "core"),
    "quy-dong-mau-so": (6, 7, "skill"),
    "so-sanh-phan-so": (6, 8, "skill"),
    "phep-cong-hai-phan-so-cung-mau": (6, 9, "skill"),
    "so-doi-cua-phan-so": (6, 10, "core"),
    "phep-tru-hai-phan-so": (6, 11, "skill"),
    "quy-tac-nhan-hai-phan-so": (6, 12, "skill"),
    "phan-so-nghich-dao": (6, 13, "core"),
    "quy-tac-chia-hai-phan-so": (6, 14, "skill"),
    "hon-so-duong": (6, 15, "core"),
    "ti-so": (6, 16, "core"),
    "ti-so-phan-tram": (6, 17, "application"),
    "tim-gia-tri-phan-so-cua-mot-so-cho-truoc": (6, 18, "application"),
    "tim-mot-so-biet-gia-tri-phan-so-cua-no": (6, 19, "application"),

    # --- CHƯƠNG 7: Số thập phân ---
    "phan-so-thap-phan": (7, 1, "core"),
    "so-thap-phan-duong": (7, 2, "core"),
    "so-thap-phan-am": (7, 3, "core"),
    "tinh-chat-bac-cau": (7, 4, "property"),
    "lam-tron-so-thap-phan": (7, 5, "skill"),
    "phep-cong-so-thap-phan": (7, 6, "skill"),
    "phep-tru-so-thap-phan": (7, 7, "skill"),
    "phep-nhan-so-thap-phan": (7, 8, "skill"),
    "phep-chia-so-thap-phan": (7, 9, "skill"),
    "uoc-luong-ket-qua": (7, 10, "application"),

    # --- CHƯƠNG 8: Hình học cơ bản ---
    "duong-thang-di-qua-hai-diem": (8, 1, "core"),
    "diem-thuoc-duong-thang": (8, 2, "property"),
    "diem-khong-thuoc-duong-thang": (8, 3, "property"),
    "ba-diem-thang-hang": (8, 4, "core"),
    "duong-thang-song-song": (8, 5, "property"),
    "duong-thang-cat-nhau": (8, 6, "property"),
    "duong-thang-trung-nhau": (8, 7, "property"),
    "doan-thang": (8, 8, "core"),
    "do-dai-doan-thang": (8, 9, "skill"),
    "diem-nam-giua-hai-diem": (8, 10, "property"),
    "trung-diem-cua-doan-thang": (8, 11, "core"),
    "tia": (8, 12, "core"),
    "hai-tia-doi-nhau": (8, 13, "property"),
    "goc": (8, 14, "core"),
    "dinh-cua-goc": (8, 15, "property"),
    "canh-cua-goc": (8, 16, "property"),
    "so-do-goc": (8, 17, "skill"),
    "goc-vuong": (8, 18, "core"),
    "goc-nhon": (8, 19, "core"),
    "goc-tu": (8, 20, "core"),
    "goc-bet": (8, 21, "core"),
    "chu-vi-hinh-chu-nhat": (8, 22, "skill"),
    "dien-tich-hinh-chu-nhat": (8, 23, "skill"),

    # --- CHƯƠNG 9: Dữ liệu và xác suất ---
    "du-lieu": (9, 1, "core"),
    "so-lieu": (9, 2, "core"),
    "thu-thap-du-lieu": (9, 3, "skill"),
    "bang-thong-ke": (9, 4, "core"),
    "bieu-do-tranh": (9, 5, "core"),
    "bieu-do-cot": (9, 6, "core"),
    "bieu-do-cot-kep": (9, 7, "core"),
    "ket-qua-co-the": (9, 8, "core"),
    "su-kien": (9, 9, "core"),
    "ti-so-xac-suat-thuc-nghiem": (9, 10, "skill"),
    "xac-suat-thuc-nghiem": (9, 11, "skill"),
}

def archive_concepts():
    print("[*] Archiving redundant concepts...")
    res = supabase.schema("app").table("concepts")\
        .update({"status": "archived"})\
        .eq("course_id", COURSE_ID)\
        .in_("code", CONCEPTS_TO_ARCHIVE)\
        .execute()
    print(f"[+] Archived {len(res.data or [])} concepts.")

def calculate_dag_depths(concepts):
    print("[*] Fetching all approved concept relations...")
    res = supabase.schema("app").table("concept_relations")\
        .select("source_concept_id, target_concept_id")\
        .eq("course_id", COURSE_ID)\
        .eq("status", "approved")\
        .execute()
    relations = res.data or []
    # Build adjacency list
    adj = defaultdict(list)
    in_degree = defaultdict(int)
    all_node_ids = {c["id"] for c in concepts}

    for rel in relations:
        src = rel["source_concept_id"]
        tgt = rel["target_concept_id"]
        if src in all_node_ids and tgt in all_node_ids:
            adj[src].append(tgt)
            in_degree[tgt] += 1

    # BFS / Topological sort to calculate depth
    depths = {}
    queue = deque()

    # Find root nodes (in-degree is 0)
    for node_id in all_node_ids:
        if in_degree[node_id] == 0:
            depths[node_id] = 0
            queue.append(node_id)

    # Process level by level
    while queue:
        u = queue.popleft()
        curr_depth = depths[u]
        for v in adj[u]:
            # depth[v] is max depth of its predecessors + 1
            if v not in depths or depths[v] < curr_depth + 1:
                depths[v] = curr_depth + 1
            queue.append(v)

    return depths

def populate_metadata(verify_only=False):
    # Fetch all concepts after archiving
    res = supabase.schema("app").table("concepts")\
        .select("id, code, name, status")\
        .eq("course_id", COURSE_ID)\
        .execute()
    all_concepts = res.data or []
    active_concepts = [c for c in all_concepts if c["status"] == "active"]

    print(f"[+] Active concepts in DB: {len(active_concepts)}")

    # Check for unmapped active concepts
    unmapped = []
    for c in active_concepts:
        if c["code"] not in CURRICULUM_MAP:
            unmapped.append(c["code"])

    if unmapped:
        print("[WARNING] The following active concepts are not mapped in CURRICULUM_MAP:")
        for code in unmapped:
            print(f"  - {code}")

    if verify_only:
        print("[+] Verification complete. Map is valid.")
        return

    # Calculate depths
    depths = calculate_dag_depths(active_concepts)

    print("[*] Updating concept metadata in database...")
    updated_count = 0
    for c in active_concepts:
        code = c["code"]
        if code in CURRICULUM_MAP:
            chapter, order, c_type = CURRICULUM_MAP[code]
            depth = depths.get(c["id"], 0)

            # Map to DB constraint: knowledge, skill, subskill, misconception
            type_map = {
                "core": "knowledge",
                "property": "knowledge",
                "skill": "skill",
                "application": "skill"
            }
            db_type = type_map.get(c_type, "knowledge")

            # Update database
            supabase.schema("app").table("concepts")\
                .update({
                    "curriculum_chapter": chapter,
                    "curriculum_order": order,
                    "concept_type": db_type,
                    "concept_depth": depth
                })\
                .eq("id", c["id"])\
                .execute()
            updated_count += 1

    print(f"[+] Successfully updated metadata for {updated_count} active concepts.")

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--verify", action="store_true", help="Verify mappings only without DB write")
    args = parser.parse_args()

    if not args.verify:
        archive_concepts()
        populate_metadata(verify_only=False)
    else:
        populate_metadata(verify_only=True)

if __name__ == "__main__":
    main()
