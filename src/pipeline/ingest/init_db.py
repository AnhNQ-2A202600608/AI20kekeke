import os
import sys

import psycopg2
from dotenv import load_dotenv

# Thêm parent dir vào sys.path để import src
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(current_dir)))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load env
load_dotenv(os.path.join(project_root, ".env"))


def initialize_database():
    # Lấy URL kết nối từ env. Ưu tiên SUPABASE_DATABASE_URL hoặc DATABASE_URL
    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not db_url or "user:password" in db_url:
        print("[!] Lỗi: Chưa cấu hình SUPABASE_DATABASE_URL hoặc DATABASE_URL hợp lệ trong file .env")
        sys.exit(1)

    print("[*] Đang kết nối tới database để khởi tạo schema...")

    # Đọc schema.sql
    schema_path = os.path.join(os.path.dirname(current_dir), "data", "schema.sql")
    if not os.path.exists(schema_path):
        print(f"[!] Lỗi: Không tìm thấy file schema tại {schema_path}")
        sys.exit(1)

    with open(schema_path, encoding="utf-8") as f:
        sql_commands = f.read()

    try:
        # Kết nối và thực thi sql
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cursor:
            print("[*] Đang chạy schema.sql...")
            cursor.execute(sql_commands)
            print("[+] Khởi tạo database schema thành công!")
        conn.close()
    except Exception as e:
        print(f"[!] Lỗi khi kết nối hoặc thực thi SQL: {e}")
        sys.exit(1)


if __name__ == "__main__":
    initialize_database()
