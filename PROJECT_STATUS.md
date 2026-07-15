# PROJECT_STATUS.md — VAIC AI Agent Starter Template

> Last updated: 2026-07-15T15:31+07:00  
> Gate: 0 — Repository Audit & Planning  

---

## Current Phase

**Phase 0 — Repository Audit & Planning**

## Objective

Kiểm kê repository, xác định phạm vi MVP, tạo tài liệu kế hoạch triển khai.
Chưa thực hiện bất kỳ code nào.

## Completed

- [x] Kiểm kê cấu trúc repository: xác nhận TRỐNG hoàn toàn.
- [x] Khởi tạo git repository (`git init`).
- [x] Xác nhận phiên bản môi trường phát triển.
- [x] Xác nhận dependency có sẵn trên hệ thống (FastAPI, LangGraph, langchain-core).
- [x] Kiểm tra không có secret bị commit (repo trống, không có file nào).
- [x] Xác định phạm vi MVP.
- [x] Tạo `PROJECT_STATUS.md`.
- [x] Tạo `docs/implementation-plan.md`.
- [x] Tạo `docs/architecture/mvp-scope.md`.
- [x] Tạo `.env.example`.

## In Progress

- Không có gì đang thực hiện. Chờ duyệt Phase 1.

## Commands Actually Run

| # | Command | Result |
|---|---------|--------|
| 1 | `git status` | `fatal: not a git repository` — xác nhận chưa có git |
| 2 | `git branch -a` | `fatal: not a git repository` |
| 3 | `python --version` | `Python 3.11.4` |
| 4 | `node --version` | `v22.16.0` |
| 5 | `npm --version` | `10.9.2` |
| 6 | `pnpm --version` | Not installed |
| 7 | `docker --version` | `Docker version 28.1.1, build 4eba377` |
| 8 | `docker compose version` | `Docker Compose version v2.35.1-desktop.1` |
| 9 | `git init` | `Initialized empty Git repository in D:/code/AI20kekeke/.git/` |
| 10 | `git log --oneline -5` | `fatal: your current branch 'master' does not have any commits yet` |
| 11 | `pip --version` | `pip 26.1.2 (python 3.11)` |
| 12 | `pip show fastapi` | `fastapi 0.115.0` — có sẵn globally |
| 13 | `pip show langgraph` | `langgraph 1.2.7` — có sẵn globally |
| 14 | `pip show langchain-core` | `langchain-core 1.4.8` — có sẵn globally |

## Test Results

Không có test nào tồn tại. Repository trống.

## Current Blockers

1. **Cần duyệt kế hoạch Phase 1** trước khi bắt đầu code.
2. **Chưa có `.gitignore`** — sẽ tạo trong Phase 1.
3. **pnpm chưa cài** — sẽ dùng npm (đã có sẵn) hoặc cài pnpm nếu cần.

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `PROJECT_STATUS.md` | CREATED | Tài liệu trạng thái dự án |
| `docs/implementation-plan.md` | CREATED | Kế hoạch triển khai chi tiết |
| `docs/architecture/mvp-scope.md` | CREATED | Phạm vi kiến trúc MVP |
| `.env.example` | CREATED | Template biến môi trường |

## Architecture Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| AD-1 | Monorepo với `backend/` và `frontend/` | Đơn giản cho starter template, dễ docker compose |
| AD-2 | SQLite cho development, PostgreSQL cho production | Giảm dependency ban đầu, dễ migrate sau |
| AD-3 | Stub LLM Provider trước, real provider sau | Cho phép phát triển và test không cần API key |
| AD-4 | FastAPI + LangGraph (Python backend) | Theo yêu cầu, phù hợp agent workflow |
| AD-5 | Next.js (frontend) | Theo yêu cầu, SSR + API routes |
| AD-6 | Virtual environment cho Python | Isolate dependency, tránh xung đột global |
| AD-7 | npm (không pnpm) cho frontend | pnpm chưa cài, npm đã sẵn sàng |

## Unverified Claims

- **Không có unverified claims.** Mọi thông tin đều từ lệnh đã chạy thực tế.

## Next Exact Actions

**Khi Phase 1 được duyệt, thực hiện theo thứ tự:**

1. Tạo `.gitignore` (Python + Node + IDE + OS).
2. Tạo `backend/` scaffold:
   - `pyproject.toml` hoặc `requirements.txt`
   - Virtual environment
   - `backend/app/main.py` — FastAPI entry point
   - `backend/app/config.py` — Settings
   - `backend/app/models/` — SQLAlchemy/Pydantic models
3. Tạo stub LLM provider.
4. Tạo LangGraph agent tối giản.
5. Tạo tool registry + 2 read tools.
6. Tạo API endpoints: `/chat`, `/health`.
7. Viết smoke test cho backend.
8. Chạy backend, xác nhận hoạt động.
9. **Gate 1 check** trước khi sang frontend.

## Gate Status

| Gate | Status | Date | Notes |
|------|--------|------|-------|
| Gate 0 — Audit & Plan | **PASS** | 2026-07-15 | Repo trống, kế hoạch đã tạo, không có secret |
| Gate 1 — Backend Core | PENDING | — | — |
| Gate 2 — Frontend Core | PENDING | — | — |
| Gate 3 — Integration | PENDING | — | — |
| Gate 4 — Docker | PENDING | — | — |
