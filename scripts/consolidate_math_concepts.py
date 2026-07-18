import sys
import os
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

# Mapping: main_concept_code -> list of concept_codes to merge into aliases and archive
CONSOLIDATION_MAP = {
    # 1. 12 cặp gom nhóm trùng lặp
    "mo-ta-tap-hop": ["cach-mo-ta-tap-hop"],
    "chia-het": ["phep-chia-het", "thuc-hien-phep-chia-het"],
    "tinh-chat-giao-hoan": ["tinh-chat-giao-hoan-cua-phep-cong"],
    "tinh-chat-ket-hop": ["tinh-chat-ket-hop-cua-phep-cong"],
    "phan-so-bang-nhau": ["quy-tac-bang-nhau"],
    "rut-gon-phan-so": ["phan-so-toi-gian"],
    "quy-tac-dau-ngoc": ["bo-dau-ngoc"],
    "so-nguyen": ["so-nguyen-duong"],
    "phep-cong-hai-phan-so-cung-mau": ["tinh-chat-cua-phep-cong-phan-so"],
    "dau-hieu-chia-het": ["tong-gia-tri-chu-so"],
    "quy-tac-chia-hai-phan-so": ["luu-y-khi-tinh-phan-so"],

    # 2. 48 skill concepts
    "phep-cong": ["cong-hai-so-tu-nhien"],
    "phep-tru": ["tru-hai-so-tu-nhien"],
    "phep-nhan": ["thuc-hien-phep-nhan"],
    "phep-chia": ["thuc-hien-phep-chia"],
    "so-lien-truoc-so-lien-sau": ["so-lien-truoc-so-lien-sau-bai-tap"],
    "khai-niem-so-tu-nhien": ["so-sanh-hai-so-tu-nhien"],
    "uoc": ["nhan-biet-uoc-boi"],
    "boi-chung-nho-nhat": ["tinh-boi-chung-nho-nhat"],
    "so-doi": ["tim-so-doi"],
    "cong-hai-so-nguyen-cung-dau": ["thuc-hien-phep-cong-tru-hai-so-nguyen"],
    "quy-dong-mau-so": ["quy-dong-mau-nhieu-phan-so", "nhan-bang-thua-so-phu"],
    "so-sanh-phan-so": ["so-sanh-phan-so-cung-mau"],
    "quy-tac-chia-hai-phan-so": ["tinh-gia-tri-bieu-thuc-voi-phan-so", "luu-y-khi-tinh-phan-so"],
    "hon-so-duong": ["viet-phan-so-duoi-dang-hon-so"],
    "phan-so-thap-phan": ["phan-so-thap-phan-sang-so-thap-phan"],
    "so-thap-phan-duong": ["so-sanh-hai-so-thap-phan"],
    "lam-tron-so-thap-phan": ["lam-tron-den-hang-chuc", "lam-tron-den-hang-phan-mười"],
    "phep-cong-so-thap-phan": ["tinh-gia-tri-bieu-thuc-so-thap-phan"],
    "do-dai-doan-thang": ["do-do-dai", "so-sanh-do-dai", "tinh-do-dai-doan-thang"],
    "trung-diem-cua-doan-thang": ["kiem-tra-trung-diem"],
    "so-do-goc": ["do-goc"],
    "hinh-vuong": ["mo-ta-yeu-to-hinh", "nhan-dang-hinh"],
    "hinh-co-tam-doi-xung": ["nhan-biet-hinh-co-tam-doi-xung"],
    "tam-doi-xung": ["nhan-biet-tam-doi-xung"],
    "hinh-luc-giac-deu": ["tao-lap-hinh-luc-giac"],
    "bang-thong-ke": ["lap-bang-thong-ke", "bieu-dien-du-lieu"],
    "bieu-do-cot": ["ve-bieu-do-cot", "thuc-hanh-ve-bieu-do-cot", "doc-phan-tich-du-lieu", "doc-va-mo-ta-du-lieu", "nhan-ra-van-de-tu-bieu-do"],
    "bieu-do-cot-kep": ["nhan-ra-quy-luat-tu-bieu-do", "ve-bieu-do-cot-kep"],
    "ket-qua-co-the": ["liet-ke-ket-qua-co-the"],
    "su-kien": ["nhan-biet-su-kien", "nhan-biet-tinh-khong-doan-truoc"],
    "xac-suat-thuc-nghiem": ["thong-ke-ket-qua-thi-nghiem", "tinh-xac-suat-thuc-nghiem"],
    "ti-so-phan-tram": ["tim-gia-tri-phan-tram", "tim-mot-so-khi-biet-phan-tram", "tinh-gia-tri-phan-tram", "tinh-ti-so-phan-tram"]
}

def main():
    print("[*] Fetching all active concepts for the Math course...")
    res = supabase.schema("app").table("concepts").select("id, code, aliases, status").eq("course_id", COURSE_ID).eq("status", "active").execute()
    concepts = res.data or []
    
    concept_map = {c["code"]: c for c in concepts}
    print(f"[+] Loaded {len(concepts)} active concepts.")

    archived_count = 0
    updated_main_count = 0

    for main_code, aliases in CONSOLIDATION_MAP.items():
        if main_code not in concept_map:
            print(f"[WARNING] Main concept '{main_code}' not found in active concepts.")
            continue
        
        main_concept = concept_map[main_code]
        existing_aliases = main_concept.get("aliases") or []
        new_aliases = list(existing_aliases)
        
        concepts_to_archive = []
        
        for alias_code in aliases:
            if alias_code not in concept_map:
                print(f"  [INFO] Alias concept '{alias_code}' not found (or already processed).")
                continue
            
            alias_concept = concept_map[alias_code]
            concepts_to_archive.append(alias_concept)
            
            if alias_code not in new_aliases:
                new_aliases.append(alias_code)
                
        if concepts_to_archive:
            # 1. Update main concept's aliases in DB
            print(f"[*] Updating main concept '{main_code}' aliases to {new_aliases}...")
            supabase.schema("app").table("concepts").update({"aliases": new_aliases}).eq("id", main_concept["id"]).execute()
            updated_main_count += 1
            
            # 2. Update status of alias concepts to 'archived'
            for ac in concepts_to_archive:
                print(f"  [+] Archiving alias concept '{ac['code']}'...")
                supabase.schema("app").table("concepts").update({"status": "archived"}).eq("id", ac["id"]).execute()
                archived_count += 1

    print(f"\n[SUCCESS] Consolidation finished.")
    print(f"  - Updated {updated_main_count} main concepts with new aliases.")
    print(f"  - Archived {archived_count} redundant concepts.")

if __name__ == "__main__":
    main()
