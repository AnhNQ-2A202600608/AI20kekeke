#!/usr/bin/env python3
import os
import re
import sys

# Color formatting helpers for CI/CD terminal
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"

project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def log_pass(name: str):
    print(f"{GREEN}✓ [PASS] {name}{RESET}")


def log_fail(name: str, reason: str):
    print(f"{RED}✗ [FAIL] {name} - Reason: {reason}{RESET}")


def log_warn(name: str, reason: str):
    print(f"{YELLOW}⚠ [WARN] {name} - Reason: {reason}{RESET}")


def main():
    failed = False
    print("=" * 60)
    print("Running Production Readiness & Operational Compliance Checks (Lesson 12)")
    print("=" * 60)

    # --- 1. Dockerfile Checks ---
    dockerfile_path = os.path.join(project_root, "Dockerfile")
    if not os.path.exists(dockerfile_path):
        log_fail("Dockerfile existence", "Dockerfile not found in project root")
        failed = True
    else:
        with open(dockerfile_path, encoding="utf-8") as f:
            docker_content = f.read()

        # Check for multi-stage build
        from_matches = re.findall(r"^FROM\s+", docker_content, re.IGNORECASE | re.MULTILINE)
        if len(from_matches) >= 2:
            log_pass("Dockerfile Multi-stage Build")
        else:
            log_fail(
                "Dockerfile Multi-stage Build",
                f"Dockerfile only has {len(from_matches)} stage(s). Needs at least 2 stages.",
            )
            failed = True

        # Check for non-root user setup
        if "USER " in docker_content or "useradd" in docker_content or "adduser" in docker_content:
            log_pass("Dockerfile Non-Root User Setup")
        else:
            log_warn(
                "Dockerfile Non-Root User Setup",
                "No explicit 'USER' instruction found in Dockerfile. Recommended for production security.",
            )

        # Check for pinned base image (not latest)
        if re.search(r"FROM\s+python:[\d\.]+-slim", docker_content, re.IGNORECASE):
            log_pass("Dockerfile Pinned Base Image")
        elif "latest" in docker_content.lower():
            log_fail(
                "Dockerfile Pinned Base Image", "Dockerfile uses 'latest' tag which is not allowed for stable builds."
            )
            failed = True
        else:
            log_pass("Dockerfile Base Image Tag (No 'latest')")

    # --- 2. .dockerignore Checks ---
    dockerignore_path = os.path.join(project_root, ".dockerignore")
    if not os.path.exists(dockerignore_path):
        log_fail(".dockerignore existence", ".dockerignore not found in project root")
        failed = True
    else:
        with open(dockerignore_path, encoding="utf-8") as f:
            di_content = f.read()
        ignores = [line.strip() for line in di_content.splitlines() if line.strip() and not line.startswith("#")]

        required_ignores = [".env", ".git", ".venv", "__pycache__"]
        missing_ignores = [req for req in required_ignores if not any(req in x for x in ignores)]
        if not missing_ignores:
            log_pass(".dockerignore files exclusion")
        else:
            log_fail(".dockerignore files exclusion", f"Missing critical ignores: {missing_ignores}")
            failed = True

    # --- 3. .gitignore Checks ---
    gitignore_path = os.path.join(project_root, ".gitignore")
    if not os.path.exists(gitignore_path):
        log_fail(".gitignore existence", ".gitignore not found")
        failed = True
    else:
        with open(gitignore_path, encoding="utf-8") as f:
            gi_content = f.read()
        if ".env" in gi_content:
            log_pass(".gitignore env file exclusion")
        else:
            log_fail(".gitignore env file exclusion", ".env is not ignored in .gitignore")
            failed = True

    # --- 4. Secret Leak Checks ---
    secret_leaked = False
    # API key matching pattern for sk-..., openai, supabase secrets, etc.
    secret_pattern = re.compile(
        r'(api_key|secret|password|token|supabase_key)\s*=\s*["\'](sk-[a-zA-Z0-9]{20,}|eyJ[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,}\.[a-zA-Z0-9\-_]{20,})["\']',
        re.IGNORECASE,
    )

    for root, dirs, files in os.walk(project_root):
        # Exclude directories
        dirs[:] = [d for d in dirs if d not in [".venv", "venv", ".git", "__pycache__", "tests", "node_modules"]]
        for file in files:
            if file.endswith((".py", ".ts", ".js", ".json", ".yaml", ".yml")) and file not in [
                "check_production_ready.py",
                "golden-test-cases.json",
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
                            "Hardcoded Secret Check",
                            f"Potential hardcoded API key/credential in file: {os.path.relpath(file_path, project_root)}",
                        )
                        secret_leaked = True
                        failed = True
                except Exception:
                    pass
    if not secret_leaked:
        log_pass("No Hardcoded Secrets Detected")

    # --- 5. CORS Check ---
    config_py_path = os.path.join(project_root, "src", "config.py")
    if os.path.exists(config_py_path):
        with open(config_py_path, encoding="utf-8") as f:
            config_content = f.read()
        if 'cors_origins: str = "*"' in config_content or 'cors_origins = "*"' in config_content:
            log_fail("CORS Hardcoded Wildcard", "CORS origins is set to wildcard '*' as default in config.py")
            failed = True
        else:
            log_pass("CORS Production Configuration")
    else:
        log_warn("CORS Configuration", "config.py not found under src/")

    # --- 6. Endpoints Checks ---
    main_py_path = os.path.join(project_root, "src", "main.py")
    if os.path.exists(main_py_path):
        with open(main_py_path, encoding="utf-8") as f:
            main_content = f.read()

        has_health = "/health" in main_content
        has_ready = "/ready" in main_content

        if has_health:
            log_pass("Health Check Endpoint (/health)")
        else:
            log_fail("Health Check Endpoint (/health)", "/health endpoint missing in main.py")
            failed = True

        if has_ready:
            log_pass("Readiness Check Endpoint (/ready)")
        else:
            log_fail("Readiness Check Endpoint (/ready)", "/ready endpoint missing in main.py")
            failed = True
    else:
        log_fail("main.py existence", "src/main.py not found")
        failed = True

    # --- 7. Configuration Architecture ---
    if os.path.exists(config_py_path):
        with open(config_py_path, encoding="utf-8") as f:
            config_content = f.read()
        if "BaseSettings" in config_content or "SettingsConfigDict" in config_content:
            log_pass("Pydantic Settings Management")
        else:
            log_warn(
                "Pydantic Settings Management", "BaseSettings not found in config.py. Pydantic Settings is recommended."
            )
    else:
        failed = True

    # --- 8. Dependency Lockfiles ---
    uv_lock_path = os.path.join(project_root, "uv.lock")
    pnpm_lock_path = os.path.join(project_root, "frontend", "pnpm-lock.yaml")

    if os.path.exists(uv_lock_path):
        log_pass("Backend Lockfile (uv.lock)")
    else:
        log_fail("Backend Lockfile (uv.lock)", "uv.lock not found in project root")
        failed = True

    if os.path.exists(pnpm_lock_path):
        log_pass("Frontend Lockfile (pnpm-lock.yaml)")
    else:
        log_warn("Frontend Lockfile (pnpm-lock.yaml)", "pnpm-lock.yaml not found under /frontend")

    # --- 9. Golden Cases existence ---
    golden_cases_path = os.path.join(project_root, "docs", "domain-knowledge", "golden-test-cases.json")
    if os.path.exists(golden_cases_path):
        log_pass("Golden Test Cases existence")
    else:
        log_fail("Golden Test Cases existence", "golden-test-cases.json not found in docs/domain-knowledge/")
        failed = True

    # --- 10. CI/CD Workflows Check ---
    ci_backend_path = os.path.join(project_root, ".github", "workflows", "ci-backend.yml")
    ci_frontend_path = os.path.join(project_root, ".github", "workflows", "ci-frontend.yml")

    if os.path.exists(ci_backend_path):
        log_pass("Backend CI workflow definition")
    else:
        log_fail("Backend CI workflow definition", "ci-backend.yml not found")
        failed = True

    if os.path.exists(ci_frontend_path):
        log_pass("Frontend CI/CD workflow definition")
    else:
        log_fail("Frontend CI/CD workflow definition", "ci-frontend.yml not found")
        failed = True

    print("=" * 60)
    if failed:
        print(f"{RED}Production Readiness Check FAILED! Please resolve the issues before deploying.{RESET}")
        sys.exit(1)
    else:
        print(f"{GREEN}All Production Readiness Checks Passed Successfully!{RESET}")
        sys.exit(0)


if __name__ == "__main__":
    main()
