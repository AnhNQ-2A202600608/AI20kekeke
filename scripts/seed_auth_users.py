import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import AuthApiError, create_client
from supabase.client import ClientOptions

# Reconfigure stdout to use UTF-8 to prevent UnicodeEncodeError on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Load environment variables
project_root = Path(__file__).resolve().parent.parent
load_dotenv(project_root / ".env")
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from src.services.supabase_config import get_backend_supabase_config  # noqa: E402


def seed_users():
    config = get_backend_supabase_config(allow_stub=True)

    if config.is_stub:
        print("[!] Lỗi: Chưa cấu hình SUPABASE_URL hoặc SUPABASE_SECRET_KEY trong file .env")
        sys.exit(1)

    print(f"[*] Đang kết nối tới Supabase: {config.url}")

    # Initialize clients
    app_client = create_client(config.url, config.secret_key, options=ClientOptions(schema="app"))
    auth_client = create_client(config.url, config.secret_key)

    # 1. Fetch available roles from app.roles to map role code -> role id
    try:
        roles_res = app_client.table("roles").select("id, code").execute()
        roles_map = {r["code"]: r["id"] for r in roles_res.data}
        print(f"[+] Tìm thấy các vai trò trong DB: {roles_map}")
    except Exception as e:
        print(f"[!] Lỗi khi lấy danh sách vai trò từ CSDL app.roles: {e}")
        sys.exit(1)

    # 2. Query all existing users with non-null MSSV from app.users
    print("[*] Đang truy vấn danh sách học viên hiện có trong CSDL...")
    try:
        db_users_res = app_client.table("users").select("id, email, full_name, mssv").not_.is_("mssv", "null").execute()
        db_users = db_users_res.data
        print(f"[+] Tìm thấy {len(db_users)} người dùng có MSSV trong CSDL app.users.")
    except Exception as e:
        print(f"[!] Lỗi khi truy vấn danh sách users từ database: {e}")
        sys.exit(1)

    # 3. Build users to seed
    users_to_seed = []

    # Process each user from DB
    for u in db_users:
        uid = u["id"]
        email = u["email"]
        full_name = u["full_name"]
        mssv = u["mssv"]

        # Determine role (default to student, check if dev)
        role_code = "student"
        try:
            # Query role from user_roles
            ur_res = app_client.table("user_roles").select("roles(code)").eq("user_id", uid).execute()
            if ur_res.data and ur_res.data[0].get("roles"):
                role_code = ur_res.data[0]["roles"].get("code", "student")
        except Exception:
            pass

        users_to_seed.append(
            {
                "id": uid,
                "email": email,
                "password": "Password123!",
                "full_name": full_name,
                "mssv": mssv,
                "role": role_code,
            }
        )

    # Add static mentor and admin accounts if they are not in the list
    static_users = [
        {
            "id": "55555555-5555-5555-5555-555555555555",
            "email": "mentor@mentora.vn",
            "password": "Password123!",
            "full_name": "Giảng Viên Sapia",
            "mssv": None,
            "role": "mentor",
        },
        {
            "id": "77777777-7777-7777-7777-777777777777",
            "email": "admin@mentora.vn",
            "password": "Password123!",
            "full_name": "Admin Sapia",
            "mssv": None,
            "role": "admin",
        },
        {
            "id": "36bc990a-5bb6-48a6-a488-b97118497d3f",
            "email": "hoang.htb@mentora.vn",
            "password": "Password123!",
            "full_name": "Hồ Tất Bảo Hoàng",
            "mssv": "2A202600699",
            "role": "admin",
        },
    ]

    # Check and append static users
    for su in static_users:
        if not any(u["id"] == su["id"] for u in users_to_seed):
            users_to_seed.append(su)

    print(f"[*] Tổng số tài khoản cần đồng bộ xác thực: {len(users_to_seed)}")

    # 4. Sync each user with Supabase Auth + Database
    for user in users_to_seed:
        email = user["email"]
        uid = user["id"]
        pwd = user["password"]
        name = user["full_name"]
        mssv = user["mssv"]
        role_code = user["role"]

        print(f"\n[*] Đang xử lý tài khoản: {email} ({role_code}) | ID: {uid}...")

        # Step A: Check/Create user in Supabase Auth using auth.admin API
        try:
            # Check if user already exists in Auth
            auth_client.auth.admin.get_user_by_id(uid)
            print("  [+] Tài khoản đã tồn tại trong Supabase Auth.")
        except AuthApiError as e:
            # If not found, create user with explicit ID
            if "not found" in str(e).lower() or "user_not_found" in str(e).lower() or e.status == 404:
                try:
                    # Check by email first (in case UUID is different)
                    users_list = auth_client.auth.admin.list_users()
                    existing_email_user = next((u for u in users_list if u.email == email), None)

                    if existing_email_user:
                        print(
                            f"  [!] Email {email} đã tồn tại với UUID khác: {existing_email_user.id}. Tiến hành xóa cũ để đồng bộ..."
                        )
                        auth_client.auth.admin.delete_user(existing_email_user.id)

                    # Create user in Auth
                    auth_client.auth.admin.create_user(
                        {
                            "id": uid,
                            "email": email,
                            "password": pwd,
                            "email_confirm": True,
                            "user_metadata": {"full_name": name},
                        }
                    )
                    print("  [+] Đã tạo mới tài khoản thành công trong Supabase Auth.")
                except Exception as ce:
                    print(f"  [!] Lỗi khi tạo tài khoản trong Supabase Auth: {ce}")
                    continue
            else:
                print(f"  [!] Lỗi không xác định khi truy vấn Supabase Auth: {e}")
                continue
        except Exception as e:
            print(f"  [!] Lỗi kết nối Supabase Auth: {e}")
            continue

        # Step B: Sync with app.users table (just in case they don't exist yet, like mentor/admin)
        try:
            app_user_res = app_client.table("users").select("id").eq("id", uid).execute()
            if not app_user_res.data:
                insert_data = {"id": uid, "email": email, "full_name": name, "mssv": mssv, "status": "active"}
                app_client.table("users").insert(insert_data).execute()
                print("  [+] Đã thêm tài khoản vào bảng app.users.")
            else:
                update_data = {"email": email, "full_name": name, "mssv": mssv}
                app_client.table("users").update(update_data).eq("id", uid).execute()
                print("  [+] Đã đồng bộ thông tin trong bảng app.users.")
        except Exception as e:
            print(f"  [!] Lỗi đồng bộ vào bảng app.users: {e}")

        # Step C: Assign role in app.user_roles
        if role_code in roles_map:
            role_id = roles_map[role_code]
            try:
                user_role_res = app_client.table("user_roles").select("role_id").eq("user_id", uid).execute()
                if not user_role_res.data:
                    app_client.table("user_roles").insert({"user_id": uid, "role_id": role_id}).execute()
                    print(f"  [+] Đã gán vai trò {role_code} (ID: {role_id}) cho tài khoản.")
                else:
                    existing_role_id = user_role_res.data[0]["role_id"]
                    if existing_role_id != role_id:
                        app_client.table("user_roles").update({"role_id": role_id}).eq("user_id", uid).execute()
                        print(f"  [+] Đã cập nhật vai trò sang {role_code} (ID: {role_id}).")
                    else:
                        print(f"  [+] Tài khoản đã có vai trò {role_code}.")
            except Exception as e:
                print(f"  [!] Lỗi đồng bộ vai trò vào bảng app.user_roles: {e}")

    print("\n[+] ĐÃ ĐỒNG BỘ THÀNH CÔNG TOÀN BỘ DANH SÁCH HỌC VIÊN LÊN SUPABASE AUTH!")


if __name__ == "__main__":
    seed_users()
