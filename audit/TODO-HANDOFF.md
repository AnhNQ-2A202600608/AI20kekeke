# TODO / Handoff — Audit Mentora (dùng cho session Claude Code mới)

> Mục đích: tiếp tục công việc audit→fix ở một chat khác mà không mất ngữ cảnh.
> Đọc file này ĐẦU TIÊN. Sau đó đọc `audit/REPORT.md` + `audit/FIXPLAN.md`.

---

## 0. Trạng thái hiện tại (cập nhật 2026-07-19)

- **Đã xong Phase A→E** (audit only, KHÔNG sửa code). Tất cả findings nằm ở
  `audit/findings-*.json` + báo cáo `audit/REPORT.md`, `audit/FIXPLAN.md`,
  `audit/D-critique.md`, `audit/00-inventory.md`, `audit/raw/INDEX.md`.
- **CHƯA làm Phase F** (sửa). Đang định làm F-0 thì dừng vì lý do bên dưới.

### ⚠️ VẤN ĐỀ NEO COMMIT (phải xử lý trước khi làm F)
- Anchor audit: `audit/raw/COMMIT_SHA` = **c939220**.
- HEAD hiện tại = **c904f9b** (đã trôi 3 commit).
- 3 commit trôi: `c904f9b` fix react-hooks, `288e6b1` fix nav bar css,
  `6d31c03` chore chat-sessions SSR. **Chỉ đụng frontend cosmetic**
  (globals.css, chat-sessions.ts, next-env.d.ts).
- **KHÔNG file backend/security/DB/AI nào bị đụng** → mọi `file:dòng` trong
  findings VẪN ĐÚNG. Drift lành tính.
- **HÀNH ĐỘNG CẦN LÀM**: re-anchor `echo <HEAD mới> > audit/raw/COMMIT_SHA`
  rồi tiếp tục. (An toàn vì không finding nào bị ảnh hưởng.)

### ⚠️ 2 QUYẾT ĐỊNH CẦN NGƯỜI DÙNG
1. **Branch**: đang ở nhánh `dev`. CLAUDE.md CẤM commit thẳng vào `dev`/`main`.
   → Phải tạo branch mới (vd `audit/phase-f`) từ dev TRƯỚC khi commit F-1/F-2.
2. **used_ai_help (AI-001)**: cần quyết cách tính (xem F-3).

---

## 1. Kết quả audit tóm tắt (để không phải đọc lại hết)

- **0 CRITICAL**. Không secret bị commit, không IDOR, không lộ dữ liệu.
- **5 HIGH**: SEC-002 (no rate limit), AI-001 (used_ai_help luôn False —
  chống gian lận chết), SEC-001/DB-001 (RPC SECURITY DEFINER thiếu
  search_path), BE-001 (requests blocking trong async), DATA-003 (backup
  không rõ — cần đội xác nhận).
- **Điểm tốt (đừng phá)**: adaptive math đúng, RPC có FOR UPDATE chống race,
  JWT verify đủ, IDOR chặn nhất quán, BFF proxy allowlist, frontend tsc sạch,
  CI chặn thật.
- **8 false-positive đã tự loại** ở Phase D (xem `audit/D-critique.md`):
  IDOR, client hint_count, double-propagation, idempotency bug (đã fix ở
  migration cuối), v.v.

---

## 2. Việc cần làm tiếp — theo thứ tự (từ prompt "Phase F")

> Mỗi mục = 1 session mới + `/clear`. Dán "KHỐI QUY TẮC SỬA" (trong prompt
> Phase F của người dùng) vào đầu mỗi session.

### F-0 — Lấp trục mù (CHƯA sửa code, trừ OPS-005) — **LÀM ĐƯỢC NGAY**
- Cài + chạy (tools hiện KHÔNG có trong máy): `pip-audit`, `pytest-cov`,
  `radon`, `vulture`; `npm audit` (pnpm không global).
  Dùng `uv pip install pip-audit pytest-cov radon vulture` vào .venv.
- Ghi ra: `audit/raw/pip-audit.json`, `audit/raw/coverage.json`,
  `audit/raw/radon-cc.json`, `audit/raw/radon-mi.json`, `audit/raw/vulture.txt`,
  `audit/raw/npm-audit.json`.
- **Blocker coverage = OPS-005**: `tests/eval/run_eval.py:9-12` gọi
  `sys.stdout/stderr.reconfigure()` ở cấp module → pytest crash lúc collect
  trên Windows ("I/O operation on closed file", "no tests ran").
  → Sửa: bọc reconfigure trong `if __name__ == "__main__":`. Đây là ngoại lệ
  DUY NHẤT được sửa code ở F-0. Commit riêng `[OPS-005]`.
  (Chạy pytest phải dùng `-s` hoặc sau khi sửa OPS-005.)
- Đầu ra: cập nhật `audit/raw/INDEX.md`, tạo `audit/findings-gap.json` +
  `audit/F0-summary.md`.

### F-1 — SEC-002 Rate limiting — **LÀM ĐƯỢC NGAY** (không chạm submit/auth/migration)
- Viết test trước `tests/api/test_rate_limit.py` (chat 25 req→429; login 6
  sai→429; normal không bị chặn; Redis chết → fail-OPEN).
- slowapi + Redis (đã có src/services/cache/). Ngưỡng để trong config.py đọc
  env: /chat 20/phút/user(key=JWT sub), /auth/login 5/phút/IP, signup 3/phút/IP,
  /adaptive/* 60/phút/user, default 120/phút/user. 429 có Retry-After.
- Cập nhật .env.example + README + `audit/fixlog.md`.

### F-2 — OPS-004 + OPS-001 CI coverage gate + security scan — **LÀM ĐƯỢC NGAY**
- pytest-cov vào pyproject; ngưỡng sàn = mức hiện tại (từ coverage.json F-0),
  riêng adaptive/ + auth/ cao hơn. KHÔNG đặt 0 giả tạo.
- Job `security` trong ci-backend.yml: gitleaks + semgrep + pip-audit + trivy
  (BỎ COMMENT "TODO" ở ci-backend.yml:58). ci-frontend: `pnpm audit
  --audit-level=high`. KHÔNG dùng `|| true`/continue-on-error.
- Badge CI + coverage vào README. Ghi `audit/F2-ci.md`.

### F-3 — AI-001 used_ai_help — **CHỈ VIẾT PATCH, DỪNG** (rủi ro cao: chạm submit)
- Điều tra: used_ai_help vào RPC ở đâu, ảnh hưởng Elo sao (v_k_student=0);
  server có dữ liệu gì suy ra "đã dùng AI" (bảng chat_sessions? hint counter
  server-side count_hints(decision_id)?); có nối được (student_id, concept_id,
  thời điểm) giữa chat và submit không.
- Đề xuất 2-3 phương án vào `audit/patches/AI-001.md` + diff vào
  `audit/patches/AI-001.diff`. KHÔNG apply. Chờ người dùng chọn cửa sổ thời gian.

### F-4 — SEC-001 search_path — **BỊ CHẶN** (rủi ro cao: migration)
- **Điều kiện tiên quyết: `audit/raw/db-state.txt` PHẢI tồn tại** (output
  `pg_get_functiondef('app.submit_attempt_v3')` + danh sách prosecdef/proconfig
  từ Supabase). HIỆN CHƯA CÓ → không làm được, cũng không được đoán từ file
  migration (DB-002: v3 bị redefine 5 lần, bản live chưa xác định).
- Người dùng cần chạy SQL trong "Phase A" (mục db-state) trên Supabase SQL
  editor rồi dán vào `audit/raw/db-state.txt`.
- Khi có: viết `ALTER FUNCTION ... SET search_path=...` (KHÔNG CREATE OR
  REPLACE) vào `audit/patches/SEC-001-migration.sql`. KHÔNG apply.

### Sau BATCH 0 → Phase G (kiểm chứng): chạy lại tool vào `audit/raw2/`,
  viết `audit/VERIFY.md` so sánh trước/sau.

---

## 3. Dữ liệu cứng đã có trong audit/raw/ (đừng chạy lại nếu không cần)
- `ruff-signal.json` (2927), `ruff-all-stats.txt`, `tsc.txt` (0 lỗi),
  `mypy-core.txt` (giả "0 lỗi" vì pyproject ignore_errors=true → BE-006),
  `secret-grep-history.txt` (không có secret thật), `INDEX.md`.
- CÒN MÙ: pip-audit(CVE), coverage số, radon, vulture, semgrep, RLS live
  (db-state), attack eval LLM.

## 4. Nhắc quy tắc quan trọng
- Không commit thẳng dev/main → tạo branch trước.
- 1 finding = 1 commit; test FAIL trước rồi mới sửa.
- Mục chạm submit_attempt_v3 / auth / migration → CHỈ viết patch vào
  audit/patches/, DỪNG hỏi người dùng. KHÔNG tự apply.
- Sau mỗi commit: `uv run pytest -q` (hoặc `-s` nếu chưa fix OPS-005) `&&
  (cd frontend && node node_modules/typescript/bin/tsc --noEmit)`.
- Ghi nhật ký vào `audit/fixlog.md` sau mỗi finding.
