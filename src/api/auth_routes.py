import logging
import re
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from src.api.adaptive_routes import AuthenticatedUser, get_adaptive_db, get_current_user
from src.services.adaptive.database_interface import AdaptiveDatabaseInterface

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def reset_backend_supabase_auth(db: AdaptiveDatabaseInterface) -> None:
    reset = getattr(db, "reset_service_auth", None)
    if callable(reset):
        reset()


def cleanup_partial_signup(db: AdaptiveDatabaseInterface, user_id: str, *, remove_app_user: bool = False) -> None:
    if remove_app_user:
        try:
            db.app_client.table("users").delete().eq("id", user_id).execute()
        except Exception:
            logger.warning("Không thể dọn bản ghi app.users sau lỗi signup cho user %s.", user_id, exc_info=True)

    try:
        db.app_client.auth.admin.delete_user(user_id)
    except Exception:
        logger.warning("Không thể dọn Supabase Auth user sau lỗi signup cho user %s.", user_id, exc_info=True)


class LoginRequest(BaseModel):
    email: str = Field(..., description="Email đăng nhập")
    password: str = Field(..., description="Mật khẩu đăng nhập")


class AuthUserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    mssv: str | None = None
    role: str
    is_demo_account: bool = False
    demo_profile_key: str | None = None


USER_PROFILE_SELECT = "id, email, full_name, mssv, is_demo_account, demo_profile_key"
USER_PROFILE_FALLBACK_SELECT = "id, email, full_name, mssv"


def select_user_profile(db: AdaptiveDatabaseInterface, user_id: str):
    try:
        return db.app_client.table("users").select(USER_PROFILE_SELECT).eq("id", user_id).execute()
    except Exception as exc:
        if "is_demo_account" not in str(exc) and "demo_profile_key" not in str(exc):
            raise
        logger.warning("Demo account columns are not available yet; falling back to legacy user profile select.")
        return db.app_client.table("users").select(USER_PROFILE_FALLBACK_SELECT).eq("id", user_id).execute()


def demo_flags_from_user_row(user: dict) -> dict[str, object]:
    return {
        "is_demo_account": bool(user.get("is_demo_account")),
        "demo_profile_key": user.get("demo_profile_key"),
    }


def get_user_demo_profile_flags(db: AdaptiveDatabaseInterface, user_id: str) -> tuple[bool, str | None]:
    if getattr(db, "_stub_mode", False) or getattr(db, "app_client", None) is None:
        return False, None
    response = select_user_profile(db, user_id)
    if not response.data:
        return False, None
    row = response.data[0]
    return bool(row.get("is_demo_account")), row.get("demo_profile_key")


def get_mock_user_profile(user_id: str) -> dict | None:
    mock_users = {
        "d3b07384-d113-4ec5-a58e-0f2d87e07661": {
            "id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
            "email": "student@edugap.vn",
            "full_name": "Nguyễn Văn Thực Chiến",
            "mssv": "2A202611111",
            "role": "student",
        },
        "55555555-5555-5555-5555-555555555555": {
            "id": "55555555-5555-5555-5555-555555555555",
            "email": "mentor@edugap.vn",
            "full_name": "Giảng Viên Sapia",
            "mssv": None,
            "role": "mentor",
        },
        "77777777-7777-7777-7777-777777777777": {
            "id": "77777777-7777-7777-7777-777777777777",
            "email": "admin@edugap.vn",
            "full_name": "Admin Sapia",
            "mssv": None,
            "role": "admin",
        },
        "36bc990a-5bb6-48a6-a488-b97118497d3f": {
            "id": "36bc990a-5bb6-48a6-a488-b97118497d3f",
            "email": "hoang.htb@edugap.vn",
            "full_name": "Hồ Tất Bảo Hoàng",
            "mssv": "2A202600699",
            "role": "admin",
        },
        "88888888-8888-8888-8888-888888888888": {
            "id": "88888888-8888-8888-8888-888888888888",
            "email": "btc@edugap.vn",
            "full_name": "Ban Tổ Chức Sapia",
            "mssv": None,
            "role": "btc",
        },
    }
    return mock_users.get(user_id)


@router.get("/me", response_model=AuthUserResponse)
def me(
    auth_user: AuthenticatedUser = Depends(get_current_user),
    db: AdaptiveDatabaseInterface = Depends(get_adaptive_db),
):
    user_id = str(auth_user.id)
    if db._stub_mode or db.app_client is None:
        mock_profile = get_mock_user_profile(user_id)
        if mock_profile:
            return mock_profile
        return {
            "id": user_id,
            "email": auth_user.email or f"{user_id}@stub.local",
            "full_name": auth_user.email or "Học viên EduGap",
            "mssv": None,
            "role": auth_user.role,
            "is_demo_account": False,
            "demo_profile_key": None,
        }

    user_response = select_user_profile(db, user_id)
    if not user_response.data:
        raise HTTPException(status_code=404, detail="Tài khoản chưa được đồng bộ cấu hình hệ thống.")

    user = user_response.data[0]
    role_response = db.app_client.table("user_roles").select("role_id, roles(code)").eq("user_id", user_id).execute()
    role_code = auth_user.role or "student"
    if role_response.data:
        roles_data = role_response.data[0]
        if "roles" in roles_data and roles_data["roles"]:
            role_code = roles_data["roles"].get("code", role_code)

    return {
        "id": user["id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "mssv": user["mssv"],
        "role": role_code,
        **demo_flags_from_user_row(user),
    }


@router.post("/login")
def login(request: LoginRequest, db: AdaptiveDatabaseInterface = Depends(get_adaptive_db)):
    """
    Đăng nhập bằng Email và Mật khẩu thông qua Supabase Auth.
    """
    email_clean = request.email.strip().lower()

    # 1. Kiểm tra định dạng Email cơ bản
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email_clean):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ.")

    try:
        # Xử lý trường hợp Stub Mode hoặc Database không khả dụng
        if db._stub_mode or db.app_client is None:
            # Khớp các tài khoản test mẫu trong stub mode
            mock_users = {
                "student@edugap.vn": {
                    "id": "d3b07384-d113-4ec5-a58e-0f2d87e07661",
                    "email": "student@edugap.vn",
                    "full_name": "Nguyễn Văn Thực Chiến",
                    "mssv": "2A202611111",
                    "role": "student",
                },
                "mentor@edugap.vn": {
                    "id": "55555555-5555-5555-5555-555555555555",
                    "email": "mentor@edugap.vn",
                    "full_name": "Giảng Viên Sapia",
                    "mssv": None,
                    "role": "mentor",
                },
                "admin@edugap.vn": {
                    "id": "77777777-7777-7777-7777-777777777777",
                    "email": "admin@edugap.vn",
                    "full_name": "Admin Sapia",
                    "mssv": None,
                    "role": "admin",
                },
                "hoang.htb@edugap.vn": {
                    "id": "36bc990a-5bb6-48a6-a488-b97118497d3f",
                    "email": "hoang.htb@edugap.vn",
                    "full_name": "Hồ Tất Bảo Hoàng",
                    "mssv": "2A202600699",
                    "role": "admin",
                },
                "btc@edugap.vn": {
                    "id": "88888888-8888-8888-8888-888888888888",
                    "email": "btc@edugap.vn",
                    "full_name": "Ban Tổ Chức Sapia",
                    "mssv": None,
                    "role": "btc",
                },
                "dev1@edugap.vn": {
                    "id": "11111111-1111-1111-1111-111111111111",
                    "email": "dev1@edugap.vn",
                    "full_name": "Developer One",
                    "mssv": "2A202600001",
                    "role": "dev",
                },
            }

            if email_clean in mock_users and request.password == "Password123!":
                user_info = mock_users[email_clean]
                return {
                    "id": user_info["id"],
                    "email": user_info["email"],
                    "full_name": user_info["full_name"],
                    "mssv": user_info["mssv"],
                    "role": user_info["role"],
                    "token": f"fake-jwt-token-{user_info['id']}",
                    "is_demo_account": False,
                    "demo_profile_key": None,
                }
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

        # 2. Xác thực với Supabase Auth
        try:
            auth_response = db.app_client.auth.sign_in_with_password(
                {"email": email_clean, "password": request.password}
            )
            reset_backend_supabase_auth(db)
        except Exception as auth_err:
            reset_backend_supabase_auth(db)
            logger.warning(f"Đăng nhập thất bại ở Supabase Auth cho email {email_clean}: {auth_err}")
            raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không chính xác.")

        user_id = auth_response.user.id
        access_token = auth_response.session.access_token

        # 3. Truy vấn thông tin người dùng từ bảng nghiệp vụ users
        user_response = select_user_profile(db, user_id)

        if not user_response.data:
            logger.error(f"Lỗi đồng bộ: User {user_id} có trong Supabase Auth nhưng không có trong app.users")
            raise HTTPException(status_code=503, detail="Tài khoản chưa được đồng bộ cấu hình hệ thống.")

        user = user_response.data[0]

        # 4. Lấy vai trò của người dùng
        role_response = (
            db.app_client.table("user_roles").select("role_id, roles(code)").eq("user_id", user_id).execute()
        )

        role_code = "student"
        if role_response.data:
            roles_data = role_response.data[0]
            if "roles" in roles_data and roles_data["roles"]:
                role_code = roles_data["roles"].get("code", "student")

        return {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"],
            "mssv": user["mssv"],
            "role": role_code,
            "token": access_token,
            **demo_flags_from_user_row(user),
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Lỗi trong quá trình đăng nhập: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Có lỗi xảy ra trong quá trình xử lý đăng nhập.")


class SignupRequest(BaseModel):
    email: str = Field(..., description="Email đăng ký")
    password: str = Field(..., min_length=6, description="Mật khẩu đăng ký (tối thiểu 6 ký tự)")
    full_name: str = Field(..., description="Họ và tên học viên")
    mssv: str | None = Field(default=None, description="Mã số sinh viên (tùy chọn)")


@router.post("/signup")
def signup(request: SignupRequest, db: AdaptiveDatabaseInterface = Depends(get_adaptive_db)):
    """
    Đăng ký tài khoản học viên mới bằng Email và Mật khẩu.
    """
    email_clean = request.email.strip().lower()

    # 1. Kiểm tra định dạng Email
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email_clean):
        raise HTTPException(status_code=400, detail="Định dạng email không hợp lệ.")

    # 2. Kiểm tra định dạng MSSV nếu có nhập
    mssv_upper = None
    if request.mssv and request.mssv.strip():
        mssv_upper = request.mssv.strip().upper()
        if not re.match(r"^2A2026\d{5}$", mssv_upper):
            raise HTTPException(
                status_code=400, detail="Họ tên hoặc mã số sinh viên không chính xác (Định dạng MSSV sai)."
            )

    try:
        if db._stub_mode or db.app_client is None:
            # Tạo tài khoản giả lập trong môi trường stub
            new_id = str(uuid.uuid4())
            return {
                "id": new_id,
                "email": email_clean,
                "full_name": request.full_name,
                "mssv": mssv_upper,
                "role": "student",
                "token": f"fake-jwt-token-{new_id}",
                "is_demo_account": False,
                "demo_profile_key": None,
            }

        # 3. Kiểm tra trùng lặp email nghiệp vụ
        existing_email = db.app_client.table("users").select("id").eq("email", email_clean).execute()
        if existing_email.data:
            raise HTTPException(status_code=409, detail="Email này đã được đăng ký.")

        # 4. Kiểm tra MSSV trùng lặp nếu có nhập
        if mssv_upper:
            existing_mssv = db.app_client.table("users").select("id").eq("mssv", mssv_upper).execute()
            if existing_mssv.data:
                raise HTTPException(status_code=409, detail="Mã số sinh viên này đã được đăng ký.")

        # 5. Đăng ký trên Supabase Auth
        try:
            # Bật tự động confirm email (nếu config của project cho phép)
            auth_response = db.app_client.auth.sign_up(
                {
                    "email": email_clean,
                    "password": request.password,
                    "options": {"data": {"full_name": request.full_name, "mssv": mssv_upper}},
                }
            )
            reset_backend_supabase_auth(db)
        except Exception as auth_err:
            reset_backend_supabase_auth(db)
            logger.error(f"Lỗi tạo tài khoản trên Supabase Auth: {auth_err}")
            raise HTTPException(status_code=400, detail="Đăng ký thất bại trên hệ thống Auth.")

        user_id = auth_response.user.id

        # 6. Đồng bộ sang bảng nghiệp vụ users
        user_data = {
            "id": user_id,
            "email": email_clean,
            "full_name": request.full_name,
            "mssv": mssv_upper,
            "status": "active",
        }

        try:
            db.app_client.table("users").insert(user_data).execute()
        except Exception as db_err:
            logger.error(f"Lỗi insert thông tin vào app.users: {db_err}")
            # Dọn dẹp tài khoản Auth vừa tạo nếu insert bảng nghiệp vụ lỗi để tránh bất đồng bộ
            try:
                db.app_client.auth.admin.delete_user(user_id)
            except Exception:
                pass
            raise HTTPException(status_code=503, detail="Lỗi lưu trữ thông tin học viên.")

        try:
            role_resp = db.app_client.table("roles").select("id").eq("code", "student").execute()
            if not role_resp.data:
                raise RuntimeError("Role 'student' is not configured.")
            role_id = role_resp.data[0]["id"]
        except Exception as err:
            logger.error(f"Không thể truy vấn role_id cho 'student' từ database: {str(err)}", exc_info=True)
            cleanup_partial_signup(db, user_id, remove_app_user=True)
            raise HTTPException(status_code=503, detail="Hệ thống vai trò chưa sẵn sàng để tạo tài khoản.")

        try:
            db.app_client.table("user_roles").insert({"user_id": user_id, "role_id": role_id}).execute()
        except Exception as role_err:
            logger.error(f"Lỗi gán vai trò student cho user {user_id}: {role_err}")
            cleanup_partial_signup(db, user_id, remove_app_user=True)
            raise HTTPException(status_code=503, detail="Không thể gán vai trò cho tài khoản mới.")

        # Tự động đăng nhập để lấy JWT ngay sau khi đăng ký thành công
        token = ""
        try:
            login_resp = db.app_client.auth.sign_in_with_password({"email": email_clean, "password": request.password})
            reset_backend_supabase_auth(db)
            token = login_resp.session.access_token
        except Exception:
            reset_backend_supabase_auth(db)
            pass

        return {
            "id": user_id,
            "email": email_clean,
            "full_name": request.full_name,
            "mssv": mssv_upper,
            "role": "student",
            "token": token,
            "is_demo_account": False,
            "demo_profile_key": None,
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Lỗi đăng ký tài khoản: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Có lỗi xảy ra trong quá trình xử lý đăng ký.")
