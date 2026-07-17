import os
import sys

import psycopg2
from dotenv import load_dotenv

# Set project root path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load env variables from root .env
load_dotenv(os.path.join(project_root, ".env"))


def seed_database():
    # Retrieve DB URL, support both SUPABASE_DATABASE_URL and DATABASE_URL
    db_url = os.getenv("SUPABASE_DATABASE_URL") or os.getenv("DATABASE_URL")

    if not db_url or "user:password" in db_url:
        print("[!] Lỗi: Chưa cấu hình SUPABASE_DATABASE_URL hoặc DATABASE_URL hợp lệ trong file .env")
        print("Vui lòng cập nhật thông tin kết nối PostgreSQL của Supabase trong file .env")
        sys.exit(1)

    sql_path = os.path.join(project_root, "db", "seed", "seed-questions.sql")
    if not os.path.exists(sql_path):
        print(f"[!] Lỗi: Không tìm thấy file SQL seed tại {sql_path}")
        sys.exit(1)

    print(f"[*] Đang đọc dữ liệu seed từ: {sql_path}")
    with open(sql_path, encoding="utf-8") as f:
        sql_commands = f.read()

    print("[*] Đang kết nối tới database PostgreSQL...")
    try:
        conn = psycopg2.connect(db_url)
        conn.autocommit = True
        with conn.cursor() as cursor:
            print("[*] Đang thực thi seed SQL...")
            cursor.execute(sql_commands)
            print("[+] Seed dữ liệu câu hỏi mẫu cho 10 ngày thành công!")
        conn.close()
    except Exception as e:
        print(f"[!] Lỗi khi kết nối hoặc thực thi SQL seed: {e}")
        print("Vui lòng kiểm tra lại trạng thái của database và thông tin kết nối trong file .env")
        sys.exit(1)


if __name__ == "__main__":
    seed_database()
