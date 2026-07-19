# Audit Phase 0 — Trinh sát & Bản đồ Repo

> Mentora (AI20kekeke) — Adaptive Socratic Tutor
> Ngày audit: 2026-07-19 · Nhánh: `dev` · Commit HEAD: `2245728`
> Phạm vi Phase 0: **chỉ trinh sát**, không đánh giá chất lượng. Không sửa mã nguồn.

---

## 1. Tổng quan nhanh

| Chỉ số | Giá trị |
|---|---|
| Tuổi repo | 4 ngày (2026-07-15 → 2026-07-19) — dự án hackathon nước rút |
| Tổng commit | 128 |
| Python LOC | ~21.7k (`src/`) + 7.0k (`scripts/`) + 10.7k (`tests/`) + 2.9k (`eval/`) |
| Frontend LOC | ~4.2k TS/TSX (26 `.tsx`, 11 `.ts`) |
| Số migration DB | 40 file SQL trong `db/supabase/migrations/` |
| Số endpoint API | ~40+ (9 router con + routes.py gốc) |

**Cảnh báo sớm quan trọng** (chuyển sang các phase sau):
- `pyproject.toml` đặt `[tool.mypy] ignore_errors = true` → **type-checking backend bị tắt hoàn toàn**.
- Bất đồng phiên bản Python: `requires-python = ">=3.13"` nhưng `Dockerfile` dùng `python:3.11-slim` và `ruff.toml` đặt `target-version = "py311"`.
- `frontend/package.json` **KHÔNG có** Tailwind, Zustand, hay `@supabase/ssr` trong dependencies — trong khi README + tech-stack tuyên bố cả ba. Cần xác minh ở Phase 3.
- Lịch sử migration bật/tắt RLS qua lại: `20260624_enable_rls_policies` → `20260626_fix_and_enable_rls` → `20260627_disable_rls_feedback_events`. Cần soi kỹ ở Phase 1/4.
- `.env` và `.env.example` nằm trong thư mục bị **permission settings chặn đọc** đối với công cụ audit — Phase 1 (secret scan) cần người dùng cấp quyền hoặc chạy `gitleaks` thủ công.

---

## 2. Cây thư mục (độ sâu 3, bỏ node_modules/.venv/.git)

```
AI20kekeke/
├── src/                      # Backend FastAPI — LÕI (21.7k LOC)
│   ├── api/                  # 11 router file (routes.py + 10 module)
│   ├── agents/               # LangGraph: graph.py, state.py, nodes/, tools/
│   │   ├── nodes/            # analyze, respond, respond_general, tutor, reflection
│   │   └── tools/            # tutor_tools.py
│   ├── services/             # Business logic
│   │   ├── adaptive/         # Elo, BKT, bandit, graph_propagation, supabase_database
│   │   ├── auth/             # supabase_jwt.py
│   │   └── cache/            # redis_store + in-memory fallback
│   ├── models/               # Pydantic contracts
│   ├── modules/rag/          # pdf_ingest, index, chunking (TF-IDF cục bộ)
│   ├── pipeline/             # ingest, transform, graphusion (knowledge graph)
│   │   └── graphusion/       # trích xuất triplet/concept → build KG
│   ├── dashboard/            # simulation_app.py (Streamlit, 1082 LOC)
│   ├── config.py             # Settings (Pydantic + YAML source)
│   └── main.py               # App entry, CORS, /health, /ready
├── frontend/                 # Next.js 16 App Router (KHÔNG dùng src/, dùng app/)
│   ├── app/                  # routes tiếng Việt: bai-hoc, on-thi, hoi-dap-ai...
│   │   ├── api/backend/[...path]/  # BFF proxy tới FastAPI
│   │   ├── components/       # AppShell, ExerciseExperience, ExamExperience...
│   │   ├── hooks/, lib/      # api-client, session, chat-sessions
│   ├── content/, docs/       # Fumadocs MDX
├── db/                       # DB as code
│   ├── schema/               # adaptive-algo.dbml
│   ├── seed/                 # seed SQL
│   └── supabase/migrations/  # 40 migration
├── config/                   # YAML decoupling: settings/prompts/algorithm.yaml + rag/
├── tests/                    # 40+ test file (test_api, test_agents, services, eval)
├── scripts/                  # 30+ script: seed, ingest, kg pipeline, eval, logging
├── eval/                     # Golden eval, ragas, results/
├── docs/                     # Docs sâu (product, engineering, domain-knowledge, guide)
├── ADR/                      # Architecture Decision Records
├── outputs/, report/         # Deliverables, braintrust transfer
├── data/                     # SGK đã xử lý, rag_index, chat sessions (gitignored)
├── backend/                  # ⚠️ RỖNG (chỉ còn egg-info) — thư mục CHẾT / legacy
├── presentation/, scratch/   # Slide, nháp
└── .github/workflows/        # 6 workflow CI/CD
```

---

## 3. LOC theo khu vực

| Khu vực | Python LOC | Ghi chú |
|---|---|---|
| `src/` | 21,741 | Lõi backend |
| `tests/` | 10,709 | Tỷ lệ test/src ~0.49 — khá cao cho hackathon |
| `scripts/` | 6,988 | Nhiều pipeline một lần chạy |
| `eval/` | 2,885 | Golden/Ragas eval |
| `config/` | 0 (.py) | Toàn YAML |
| `frontend/` | 4,204 (TS/TSX) | Nhỏ gọn |

---

## 4. Mô tả thư mục cấp 1 (sống / chết)

| Thư mục | Nội dung | Trạng thái |
|---|---|---|
| `src/` | Toàn bộ backend FastAPI + adaptive + agent + RAG | **Sống** — trung tâm |
| `frontend/` | Next.js App Router UI (routes tiếng Việt) | **Sống** |
| `db/` | 40 migration Supabase + seed + dbml | **Sống** — biến động mạnh |
| `tests/` | Test suite khá đầy đủ | **Sống** |
| `scripts/` | Seed, ingest OCR, KG pipeline, logging AI | **Sống nhưng hỗn tạp** — nhiều one-off |
| `eval/` | Golden eval + Ragas | Sống (chạy thủ công?) |
| `config/` | settings/prompts/algorithm.yaml | **Sống** — YAML decoupling |
| `data/` | SGK processed, rag_index, chat sessions | Sống (gitignored) |
| `backend/` | Chỉ còn `egg-info` | **CHẾT** — legacy, nên xóa (git log cho thấy từng có `core/logging.py`, `core/errors.py`) |
| `outputs/` | AI logs / braintrust (gitignored) | Deliverable artifact |
| `presentation/`, `report/`, `scratch/` | Slide, báo cáo mentor, nháp | Phụ trợ |
| `.agent/`, `.agents/`, `.codex/`, `.cursor/`, `.gemini/` | Skill packs của nhiều agent tool | Meta (phần lớn gitignored) |

---

## 5. Tóm tắt file cấu hình & tài liệu chính

- **README.md** (27KB): Rất chi tiết — problem/solution, tech stack, setup, 2 bảng endpoint (KHÁC NHAU), 5 golden test case, deliverables. Tự thú nhận TC-001 "⚠️ Thiếu trích dẫn".
- **ARCHITECTURE.md** (2.4KB): **Template rỗng chưa điền** — toàn `[mô tả]`, `[choice]`, `[reason]`. Không phản ánh hệ thống thật. (README lại trỏ deliverable #3 sang `docs/architecture.md`, một file khác.)
- **CLAUDE.md**: Non-negotiables (default branch `dev`, không commit thẳng dev/main), YAML decoupling, YAGNI/KISS/DRY.
- **pyproject.toml**: deps đầy đủ; **mypy `ignore_errors=true`** (tắt type check); loại trừ docs/eval/scripts.
- **ruff.toml**: line-length 120, select `E,F,I,N,W,UP` (KHÔNG bật `ALL` hay bộ security `S`), ignore `E501,N806`, `target-version=py311`.
- **requirements.txt**: có `psycopg2-binary`, `pgvector` (không có trong pyproject!) — nguồn deps song song, dễ lệch.
- **frontend/package.json**: `next@16.2.10`, `react@19.2.4`, phosphor-icons, fontsource. **Thiếu Tailwind/Zustand/@supabase/ssr** so với tuyên bố. `pnpm@10`.
- **Dockerfile**: multi-stage, non-root (`appuser`), healthcheck. Base `python:3.11-slim` (không pin digest, lệch với requires-python 3.13). `COPY . .` (dựa `.dockerignore` để loại `.env`).
- **docker-compose.yml**: chỉ backend + `env_file: .env` + mount `./data`. Không có Redis/DB service.
- **render.yaml**: backend web (Docker, region Singapore, **plan free**) + Redis free. Secret `sync: false` (đặt tay trên Dashboard) — tốt. **`CORS_ORIGINS` mặc định `http://localhost:3000`** (ghi chú "sẽ ghi đè" — rủi ro nếu quên). Có key ANTHROPIC/GEMINI dù pyproject chỉ có OpenAI.
- **.pre-commit-config.yaml**: chỉ ruff + ruff-format (không có gitleaks/detect-secrets/mypy).
- **.dockerignore**: loại `.env`, `.venv`, `docs/`, `eval/`, `*.md` — OK.
- **.gitignore**: che `.env*`, `data/`, `outputs/`, `.ai-log/*.jsonl` — hợp lý.
- **.github/workflows/**: `ci-backend.yml`, `ci-frontend.yml`, `branch-protection.yml`, `keep-awake.yml`, `manual-backend-verification.yml`, `pr-format-validator.yml`. (Nội dung soi ở Phase 6.)

---

## 6. File > 400 dòng (ứng viên refactor)

| LOC | File | Ghi chú |
|---|---|---|
| **2073** | `src/api/adaptive_routes.py` | Router khổng lồ — chứa auth deps + recommend + submit + graph CRUD |
| **2038** | `src/api/routes.py` | Router gốc — chat, feedback, audit, benchmark... |
| **1170** | `src/services/adaptive/supabase_database.py` | Adapter DB |
| **1082** | `src/dashboard/simulation_app.py` | Streamlit sim (không thuộc luồng production?) |
| **1038** | `src/api/onboarding_routes.py` | Onboarding + diagnostic |
| **745** | `src/services/rag.py` | RAG service |
| **635** | `src/services/braintrust_dashboard.py` | Observability |
| **475** | `src/services/quiz_error_cases.py` | |
| **458** | `src/api/material_routes.py` | |
| **420** | `src/api/auth_routes.py` | login/signup |
| **412** | `src/agents/nodes/analyze_node.py` | Intent + integrity risk |

→ Hai file API >2000 dòng là hotspot rõ rệt: route KHÔNG mỏng, chứa nhiều business logic (Phase 2).

Frontend file lớn nhất: `frontend/app/giao-vien/page.tsx` (600), `on-thi/exam-workflow.ts` (442), `onboarding/page.tsx` (261).

---

## 7. Hotspot theo tần suất sửa (git log --name-only)

| Lần sửa | File |
|---|---|
| 21 | `README.md` |
| 11 | `frontend/app/globals.css` |
| 10 | `frontend/app/hoi-dap-ai/page.tsx` (trang chat AI) |
| 10 | `PROJECT_STATUS.md` |
| 9 | `frontend/app/onboarding/page.tsx` |
| 8 | `src/api/routes.py` |
| 8 | `frontend/package.json` |
| 8 | `frontend/app/hoc-tap/page.tsx`, `components/AppShell.tsx`, `.github/workflows/ci-frontend.yml` |
| 7 | `.github/workflows/ci-backend.yml` |
| 6 | `src/api/adaptive_routes.py`, `src/services/rag.py`, `backend/src/core/logging.py`, `backend/src/core/errors.py` |

→ Điểm nóng code: **`routes.py`, `adaptive_routes.py`, `rag.py`, `analyze_node`, `respond_node`** trùng với các file lớn/lõi → ưu tiên audit sâu. `backend/src/core/*` từng nóng nhưng nay là thư mục chết.

---

## 8. Critical paths (request → DB)

### 8.1 Login — `POST /api/v1/auth/login`
`auth_routes.py:164 login()` → `db.app_client.auth.sign_in_with_password({email, password})` (Supabase Auth) → trả JWT + role. Không cần Bearer (public). Signup ở `auth_routes.py:295` (`/auth/signup`) — **KHÔNG phải `/auth/register`** như bảng #2 của README ghi.

### 8.2 Auth dependency (dùng chung mọi endpoint bảo vệ)
`adaptive_routes.py:116 get_current_user(authorization: Header)`:
- Bearer bắt buộc, tách token.
- `token == "service_role"` + `allow_service_role_bypass()` → user role `dev` (bỏ qua auth). **Cần kiểm tra fail-safe ở Phase 1.**
- Nếu `is_stub_db or allow_dev_tokens()`: giải mã JWT **không verify chữ ký** (base64 decode payload), hoặc coi token là UUID thô; map mock roles theo UUID hardcode. **Rủi ro nếu bật nhầm production.**
- Live mode (fail-closed): `verify_supabase_jwt_locally(token, supabase_url)` (`services/auth/supabase_jwt.py`), fallback `auth.get_user(token)`. Role lấy từ bảng `user_roles` — lỗi role store → 503 (fail-closed, tốt).
- Kết quả cache theo `id(db):stub:dev:token`.
- Phân quyền: `RoleChecker` / `require_role([...])` / `require_teacher` / `get_current_student_id`.

### 8.3 `POST /adaptive/recommend` (`adaptive_routes.py:304`)
`get_current_user` → chọn câu hỏi qua bandit/ZPD → trả `RecommendResponse` (decision_id, expected_success ~0.72). Nhận `student_id/course_id/concept_id` **từ body** — cần kiểm IDOR ở Phase 1 (body student_id có so với JWT sub không?).

### 8.4 `POST /adaptive/submit` (`adaptive_routes.py:628`)
`get_current_user` → build payload → `db.submit_attempt_v3(payload)` = RPC PostgreSQL nguyên tử (`database_interface.py:67`) chấm điểm + cập nhật Elo/BKT + lan truyền đồ thị 1-bước + xóa cache. Fallback: hàng đợi SQLite offline khi RPC lỗi (`:747`). Nhận `hint_count` và `used_ai_help` **từ client** — nghi vấn gian lận, soi kỹ Phase 5.

### 8.5 `POST /chat` (`routes.py:789`)
`get_current_user` → LangGraph `agent` (`agents/graph.py`): `analyze` → (`respond_general` | `respond_academic`) → điều kiện `check_reflection` → `pedagogical_reflection` (tối đa 2 vòng viết lại) → END. Hỗ trợ SSE streaming. Reflection chỉ kích hoạt khi phát hiện code block/đáp án MCQ hoặc `academic_integrity_risk`.

---

## 9. Bất đồng tài liệu ↔ thực tế (ghi nhận sơ bộ, xác minh ở Phase 6)

1. README có **2 bảng endpoint mâu thuẫn**: bảng #1 ghi `POST /auth/signup`, bảng #2 ghi `POST /auth/register`. Code có **`/auth/signup`** (`auth_routes.py:295`) — bảng #2 SAI.
2. `ARCHITECTURE.md` là **template rỗng**, không mô tả hệ thống thật.
3. Tech stack tuyên bố **Tailwind 4 + Zustand + @supabase/ssr** nhưng `frontend/package.json` không liệt kê chúng.
4. `requires-python >=3.13` vs Docker `python:3.11` vs ruff `py311`.
5. `pyproject.toml` không có `psycopg2`/`pgvector`, `requirements.txt` có — hai nguồn deps lệch nhau.
6. README nhắc **cả TF-IDF index cục bộ (`modules/rag/index.py`) VÀ pgvector** — hai hệ truy hồi song song (làm rõ ở Phase 5).

---

## 10. Câu hỏi mở (cần đội phát triển giải thích trước khi audit sâu)

1. **`backend/` để làm gì?** Hiện rỗng (chỉ egg-info) nhưng git log cho thấy từng có `core/logging.py`, `core/errors.py` bị sửa nhiều lần. Đã bị bỏ hẳn hay còn được import ở đâu đó?
2. **`.env` / `.env.example`**: công cụ audit bị chặn quyền đọc file này. Có thể cấp quyền đọc `.env.example` (chỉ placeholder) để Phase 1 xác minh không lộ giá trị thật? `.env` có đang được commit trong lịch sử git không?
3. **Nguồn cấu hình nào thắng?** `config.py` xếp thứ tự init → env → dotenv → YAML. Trên production Render, cấu hình đến từ env vars hay `config/settings.yaml`? File YAML có commit giá trị nhạy cảm không?
4. **TF-IDF vs pgvector**: production thực sự dùng đường truy hồi nào? Cái còn lại là dead code hay fallback?
5. **`AUTH_ALLOW_DEV_TOKENS` / `service_role` bypass**: có cơ chế nào chặn cứng khi `APP_ENV=production` không? (Sẽ xác minh code ở Phase 1, nhưng cần biết ý định thiết kế.)
6. **`hint_count` / `used_ai_help` từ client**: README nói "đếm từ server logs" nhưng `/adaptive/submit` nhận 2 field này từ body. Server có tự đếm/ghi đè không, hay tin client?
7. **`src/dashboard/simulation_app.py` (Streamlit, 1082 LOC)**: có phải thành phần production hay chỉ công cụ mô phỏng nội bộ?
8. **Migration RLS bật/tắt qua lại** (`enable` → `fix_and_enable` → `disable_rls_feedback_events`): trạng thái RLS cuối cùng trên production là gì? Có bảng dữ liệu sinh viên nào đang tắt RLS không?

---

## Trạng thái Phase 0

✅ Hoàn tất trinh sát. Không sửa mã nguồn. Sẵn sàng cho **Phase 1 — Bảo mật & Secret** (khuyến nghị bắt đầu session mới, và cấp quyền đọc `.env.example` + chạy `gitleaks`/`git log -p` trước).
