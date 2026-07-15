# VAIC Starter P0 Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Loại bỏ sáu blocker P0 để bộ khung khởi động, cấu hình challenge, deploy, kiểm tra và đóng gói an toàn trong ngày thi.

**Architecture:** Giữ modular monolith FastAPI/Next.js hiện tại. Thêm một CLI Python đa nền tảng làm nguồn lệnh chuẩn, để Makefile chỉ là wrapper; challenge runtime được chọn tường minh qua `ACTIVE_CHALLENGE`; frontend gọi API qua same-origin proxy để chạy giống nhau ở local và Docker.

**Tech Stack:** Python 3.11+, FastAPI, pytest, Ruff, Next.js 16, TypeScript, ESLint, Docker Compose.

## Global Constraints

- Không xóa hoặc bỏ qua `challenges/` trong clean/package.
- Không triển khai các module AI skeleton trong phạm vi P0.
- Mọi hành vi Python mới phải có regression test fail trước khi sửa.
- `python scripts/project_tasks.py <command>` là giao diện đa nền tảng chính; Makefile chỉ chuyển tiếp.
- CI backend, frontend lint và frontend production build phải pass.

---

### Task 1: Safe project lifecycle CLI

**Files:**
- Create: `scripts/project_tasks.py`
- Create: `backend/tests/test_project_tasks.py`
- Modify: `Makefile`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `clean_project(root: Path) -> list[Path]`
- Produces: `package_project(root: Path, output: Path) -> Path`
- Produces: CLI commands `bootstrap`, `install`, `dev-backend`, `dev-frontend`, `docker-up`, `docker-down`, `lint`, `format`, `typecheck`, `test`, `smoke`, `eval`, `validate`, `clean`, `package`

- [ ] Write tests proving clean preserves challenge work and package includes it while excluding caches, secrets, dependencies and the output archive.
- [ ] Run `python -m pytest tests/test_project_tasks.py -q` and confirm failures because `scripts.project_tasks` does not exist.
- [ ] Implement the CLI with `pathlib`, `subprocess`, `shutil` and `tarfile`; make destructive targets explicit allowlists.
- [ ] Replace platform-specific Makefile bodies with `python scripts/project_tasks.py <command>` wrappers.
- [ ] Run the targeted tests and Ruff until green.

### Task 2: Challenge-aware module configuration

**Files:**
- Modify: `backend/src/core/config.py`
- Modify: `backend/src/core/module.py`
- Modify: `backend/src/api/main.py`
- Modify: `scripts/init_challenge.py`
- Modify: `.env.example`
- Modify: `backend/tests/test_modules.py`
- Modify: `backend/tests/test_challenge_init.py`

**Interfaces:**
- Produces: `Settings.active_challenge: str`
- Produces: `Settings.modules_config_path: Path`
- Consumes: `ACTIVE_CHALLENGE=<slug-or-path>`

- [ ] Write tests proving `ACTIVE_CHALLENGE` selects `challenges/<slug>/modules_config.json` and invalid paths fail clearly.
- [ ] Run targeted tests and confirm they fail against the current fixed config path.
- [ ] Implement path resolution and make `ModuleRegistry` consume the resolved path.
- [ ] Make challenge initialization print the exact activation command.
- [ ] Run targeted tests and Ruff until green.

### Task 3: Same-origin frontend API and Docker repair

**Files:**
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/app/workspace/page.tsx`
- Modify: `frontend/next.config.ts`
- Modify: `frontend/Dockerfile`
- Modify: `docker-compose.yml`
- Modify: `frontend/.env.example`

**Interfaces:**
- Browser API base: `/api/v1`
- Next proxy destination: `BACKEND_API_URL`, default `http://localhost:8000/api/v1`

- [ ] Replace the hardcoded upload URL with the shared API client.
- [ ] Add a same-origin rewrite for local and Docker runtime.
- [ ] Use `npm ci` in Docker, remove the invalid `public` copy, and configure the backend service URL.
- [ ] Run ESLint, TypeScript and production build.

### Task 4: Backend quality gate

**Files:**
- Modify: `backend/src/core/evaluation.py`
- Modify: `backend/src/core/module.py`
- Modify: `backend/src/services/run_service.py`
- Modify: `backend/tests/conftest.py`
- Modify: long-line test fixtures reported by Ruff

- [ ] Run Ruff and preserve the failure list as baseline evidence.
- [ ] Fix only reported lint/format issues without behavior changes.
- [ ] Run Ruff and all backend tests until green.

### Task 5: Frontend quality gate

**Files:**
- Modify: `frontend/lib/api.ts`
- Modify: `frontend/app/files/page.tsx`
- Modify: `frontend/app/results/page.tsx`
- Modify: `frontend/app/runs/page.tsx`
- Modify: `frontend/app/workspace/page.tsx`

**Interfaces:**
- Produces typed API envelope, capability, run, file and artifact types.
- Produces `getErrorMessage(error: unknown) -> string`.

- [ ] Replace explicit `any` with domain types or `unknown`.
- [ ] Remove unused imports and centralize safe error extraction.
- [ ] Run ESLint, `tsc --noEmit` and production build until green.

### Task 6: Documentation and release verification

**Files:**
- Modify: `README.md`
- Modify: `RELEASE_CHECKLIST.md`
- Modify: `KNOWN_LIMITATIONS.md` if behavior changed
- Regenerate: `vaic-starter-submission.tar.gz`

- [ ] Document Python CLI as primary workflow and Makefile as optional wrapper.
- [ ] Document `ACTIVE_CHALLENGE` and safe package contents.
- [ ] Run full backend tests, Ruff, module validation, frontend lint, TypeScript and build.
- [ ] Build the archive with the new CLI; assert it contains `challenges/` and excludes caches, secrets, `.git`, dependencies and itself.
- [ ] Confirm `git diff --check` and inspect the final diff.
