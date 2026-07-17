#!/usr/bin/env python3
import os
import re
import sys

# Đảm bảo terminal in được UTF-8 trên Windows
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Định dạng màu sắc cho terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

# Tìm root của repository (nơi chứa thư mục .git, backend, frontend, scripts)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def log_pass(name: str):
    print(f"{GREEN}✓ [PASS] {name}{RESET}")


def log_fail(name: str, reason: str):
    print(f"{RED}✗ [FAIL] {name} - Lý do: {reason}{RESET}")


def log_warn(name: str, reason: str):
    print(f"{YELLOW}⚠ [WARN] {name} - Cảnh báo: {reason}{RESET}")


def main():
    failed = False
    print("=" * 60)
    print("Đang chạy kiểm tra Mức Độ Sẵn Sàng Sản Xuất (Production Readiness)")
    print("=" * 60)

    # --- 1. Kiểm tra Dockerfile Backend ---
    dockerfile_path = os.path.join(project_root, "backend", "Dockerfile")
    if not os.path.exists(dockerfile_path):
        log_fail("Dockerfile Backend", "Không tìm thấy Dockerfile trong thư mục backend/")
        failed = True
    else:
        with open(dockerfile_path, encoding="utf-8") as f:
            docker_content = f.read()

        # Kiểm tra Multi-stage build
        from_matches = re.findall(r"^FROM\s+", docker_content, re.IGNORECASE | re.MULTILINE)
        if len(from_matches) >= 2:
            log_pass("Dockerfile Backend: Multi-stage Build")
        else:
            log_fail(
                "Dockerfile Backend: Multi-stage Build",
                f"Dockerfile chỉ có {len(from_matches)} stage FROM. Yêu cầu ít nhất 2 stage.",
            )
            failed = True

        # Kiểm tra Non-root user
        if "USER " in docker_content or "useradd" in docker_content or "adduser" in docker_content:
            log_pass("Dockerfile Backend: Cấu hình Non-Root User")
        else:
            log_warn(
                "Dockerfile Backend: Cấu hình Non-Root User",
                "Chưa tìm thấy lệnh khai báo 'USER' phi root trong Dockerfile.",
            )

        # Kiểm tra Pinned python tag
        if re.search(r"FROM\s+python:[\d\.]+-slim", docker_content, re.IGNORECASE):
            log_pass("Dockerfile Backend: Pinned Base Image Tag")
        elif "latest" in docker_content.lower():
            log_fail(
                "Dockerfile Backend: Pinned Base Image Tag",
                "Không được sử dụng tag 'latest' cho base image Python.",
            )
            failed = True
        else:
            log_pass("Dockerfile Backend: Base Image Tag (Không dùng latest)")

    # --- 2. Kiểm tra .dockerignore Backend ---
    dockerignore_path = os.path.join(project_root, "backend", ".dockerignore")
    if not os.path.exists(dockerignore_path):
        log_fail(".dockerignore Backend", "Không tìm thấy .dockerignore trong thư mục backend/")
        failed = True
    else:
        with open(dockerignore_path, encoding="utf-8") as f:
            di_content = f.read()
        ignores = [
            line.strip() for line in di_content.splitlines() if line.strip() and not line.startswith("#")
        ]

        required_ignores = [".env", ".git", ".venv", "__pycache__"]
        missing_ignores = [req for req in required_ignores if not any(req in x for x in ignores)]
        if not missing_ignores:
            log_pass(".dockerignore Backend: Loại bỏ file nhạy cảm")
        else:
            log_fail(".dockerignore Backend: Loại bỏ file nhạy cảm", f"Thiếu cấu hình ignore: {missing_ignores}")
            failed = True

    # --- 3. Kiểm tra .gitignore của Repo ---
    gitignore_path = os.path.join(project_root, ".gitignore")
    if not os.path.exists(gitignore_path):
        log_fail(".gitignore của dự án", "Không tìm thấy file .gitignore ở thư mục gốc")
        failed = True
    else:
        with open(gitignore_path, encoding="utf-8") as f:
            gi_content = f.read()
        if ".env" in gi_content:
            log_pass(".gitignore: Đã loại bỏ file .env")
        else:
            log_fail(".gitignore: Đã loại bỏ file .env", "Chưa ignore file .env")
            failed = True

    # --- 4. Quét rò rỉ API Keys / Secrets ---
    secret_leaked = False
    # Pattern tìm sk-..., eyJ... jwt token, hoặc hardcoded api keys
    secret_pattern = re.compile(
        r'(api_key|secret|password|token|supabase_key)\s*=\s*["\'](sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,})["\']',
        re.IGNORECASE,
    )

    for root, dirs, files in os.walk(project_root):
        # Bỏ qua các thư mục dev/test/dependency
        dirs[:] = [
            d for d in dirs if d not in [".venv", "venv", ".git", "__pycache__", "tests", "node_modules", ".next"]
        ]
        for file in files:
            if file.endswith((".py", ".ts", ".js", ".json", ".yaml", ".yml")) and file not in [
                "check_production_ready.py",
                "package-lock.json",
                "pnpm-lock.yaml",
                "uv.lock",
            ]:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if secret_pattern.search(content):
                        log_fail(
                            "Kiểm tra Rò Rỉ API Key",
                            f"Phát hiện nguy cơ hardcoded credentials trong file: {os.path.relpath(file_path, project_root)}",
                        )
                        secret_leaked = True
                        failed = True
                except Exception:
                    pass
    if not secret_leaked:
        log_pass("Quét API Key: Không phát hiện secrets bị hardcode")

    # --- 5. Kiểm tra CORS trên Backend ---
    main_py_path = os.path.join(project_root, "backend", "src", "api", "main.py")
    if os.path.exists(main_py_path):
        with open(main_py_path, encoding="utf-8") as f:
            main_content = f.read()
        if 'allow_origins=["*"]' in main_content or "allow_origins=['*']" in main_content:
            log_fail("Kiểm tra CORS Backend", "Cài đặt allow_origins đang để wildcard '*' trực tiếp trong main.py")
            failed = True
        else:
            log_pass("Kiểm tra CORS Backend: Hạn chế nguồn truy cập an toàn")
    else:
        log_fail("Backend main.py", "Không tìm thấy src/api/main.py")
        failed = True

    # --- 6. Kiểm tra Endpoints Health & Ready ---
    if os.path.exists(main_py_path):
        # Kiểm tra xem có mount router chứa health hay không
        has_health_mount = "health.router" in main_content
        if has_health_mount:
            log_pass("Backend: Có mount health router")
        else:
            log_fail("Backend: Có mount health router", "Chưa mount router health trong main.py")
            failed = True
    else:
        failed = True

    # --- 7. Kiểm tra sự tồn tại của Lockfiles ---
    pnpm_lock_path = os.path.join(project_root, "frontend", "pnpm-lock.yaml")
    # pnpm lockfile kiểm tra ở frontend
    if os.path.exists(pnpm_lock_path):
        log_pass("Frontend Lockfile (pnpm-lock.yaml) tồn tại")
    else:
        log_warn("Frontend Lockfile (pnpm-lock.yaml)", "Không tìm thấy pnpm-lock.yaml. Cần chạy pnpm install để tạo.")

    # --- 8. Kiểm tra render.yaml cấu hình an toàn ---
    render_yaml_path = os.path.join(project_root, "render.yaml")
    if os.path.exists(render_yaml_path):
        with open(render_yaml_path, encoding="utf-8") as f:
            render_content = f.read()

        if "autoDeploy: false" in render_content:
            log_pass("render.yaml: autoDeploy được tắt để CI kiểm soát")
        else:
            log_fail("render.yaml: autoDeploy", "Phải cấu hình 'autoDeploy: false' để tránh deploy tự phát")
            failed = True

        if "healthCheckPath: /api/v1/health" in render_content:
            log_pass("render.yaml: Cấu hình đúng healthCheckPath")
        else:
            log_fail(
                "render.yaml: healthCheckPath",
                "Chưa định nghĩa hoặc sai healthCheckPath. Yêu cầu: '/api/v1/health'",
            )
            failed = True
    else:
        log_fail("render.yaml", "Không tìm thấy file render.yaml")
        failed = True

    print("=" * 60)
    if failed:
        print(f"{RED}Kiểm tra Mức Độ Sẵn Sàng Sản Xuất THẤT BẠI! Vui lòng khắc phục các lỗi trên.{RESET}")
        sys.exit(1)
    else:
        print(f"{GREEN}Chúc mừng! Tất cả các bài kiểm tra Production Readiness đã ĐẠT!{RESET}")
        sys.exit(0)


if __name__ == "__main__":
    main()
