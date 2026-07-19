# FIXPLAN — Kế hoạch thi công (Phase F)

Commit nền: `c939220`. Mỗi batch = một session sửa. **Mục RỦI RO CAO** (chạm submit_attempt_v3, auth, migration) → viết patch vào `audit/patches/{ID}.diff` và DỪNG hỏi bạn, KHÔNG tự apply.

Quy tắc: 1 finding = 1 commit; viết test FAIL trước rồi sửa; không refactor tiện tay; secret → chỉ ghi `audit/ROTATE-KEYS.md`.

---

## BATCH 0 — Làm ngay (chặn mở cho sinh viên thật)

| ID | Sửa gì | File chạm | Test chứng minh | Ước lượng | Phụ thuộc / Rủi ro |
|---|---|---|---|---|---|
| SEC-002 | Thêm rate limit (slowapi + Redis): /chat 20/phút/user, /auth/login 5/phút/IP, /auth/signup 3/phút/IP | main.py, api/*, deps mới | test_rate_limit::test_chat_429 | M | Redis đã có |
| AI-001 | Tính used_ai_help phía server (đếm lượt /chat theo concept trong cửa sổ decision), truyền vào RPC | adaptive_routes.py:686-708 | test_adaptive::test_used_ai_help_reduces_elo | M | **RỦI RO CAO: chạm submit** → patch + hỏi |
| SEC-001/DB-001 | Migration mới: `ALTER FUNCTION ... SET search_path = pg_catalog, app, audit, pg_temp` cho MỌI hàm prosecdef=true | db/.../<new>.sql | migration test proconfig NOT NULL | M | **RỦI RO CAO: migration** → patch + hỏi |
| DATA-003 | Xác nhận backup Supabase + test restore; viết docs/INCIDENT-RESPONSE.md | docs/ | N/A | S | Cần đội trả lời trước |
| SEC-006 | Chạy db-state query trên Supabase, xác nhận RLS bảng PII bật | (query) | N/A | S | Cần quyền production |

**Điều kiện ra khỏi BATCH 0:** rate limit hoạt động, used_ai_help sống, search_path pinned, backup xác nhận, RLS live xác nhận.

---

## BATCH 1 — Cao, không đổi kiến trúc

| ID | Sửa gì | File | Test | Ước lượng |
|---|---|---|---|---|
| BE-001 | Chuyển requests→httpx.AsyncClient (await) hoặc to_thread trong quiz_generator | quiz_generator.py | lint ASYNC210 sạch | M |
| SEC-003 | Thêm timeout cho mọi requests.* | material_routes, quiz_generator, rag_ingestion | lint S113 sạch | S |
| OPS-003 | render.yaml healthCheckPath → /ready | render.yaml | curl /ready | S |
| OPS-001 | Bật lại Trivy + thêm job gitleaks/pip-audit/pnpm audit trong CI | .github/workflows/ | CI đỏ khi có CVE | M |
| OPS-004 | Thêm pytest-cov + đo coverage; ngưỡng sàn adaptive/auth | pyproject, ci-backend.yml | CI coverage gate | S |
| OPS-005 | Đưa reconfigure stderr vào `if __name__=='__main__'` | tests/eval/run_eval.py | pytest chạy full trên Windows | S |
| AI-002 | Ép câu trả lời academic có tài liệu phải mang ≥1 citation (dùng reflection loop hoặc auto-attach top-1) | citation_validator.py, respond_node.py | test_grounded_requires_citation | M |
| AI-003 | Bọc <student_query> ở respond_general_node & tutor_node | respond_general_node.py, tutor_node.py | test_general_wraps_input | S |
| SEC-005 | Validate CORS: reject '*' khi allow_credentials; thu hẹp methods/headers | config.py, main.py | test_cors_config | S |
| DOC-001..008 | Sửa README theo code (1 bảng endpoint từ OpenAPI, bỏ Zustand/@supabase/ssr sai, sửa version Python); điền ARCHITECTURE.md | README, ARCHITECTURE.md | N/A | M |

---

## BATCH 2 — Trung, cần refactor

| ID | Sửa gì | Rủi ro |
|---|---|---|
| DB-003 | Đưa propagation vào outbox bền vững (đã có offline_outbox pattern) hoặc trở lại trong-RPC với FOR UPDATE | **CAO: chạm submit/RPC** → patch + hỏi |
| DB-002 | Gộp 5 migration submit_attempt_v3 về 1 canonical, đặt tên timestamp rõ; verify bản live | **CAO: migration** → patch + hỏi |
| BE-003 | Một nguồn chân lý tham số BKT (algorithm.yaml), dùng cho cả Python & SQL | trung |
| BE-005 | Tách business logic khỏi routes.py/adaptive_routes.py (service layer + deps.py) | trung |
| BE-006 | Bỏ mypy ignore_errors; bật dần theo module + CI gate | trung |
| BE-004 | Thay blind-except bằng except cụ thể + log | thấp |
| SEC-004/FE-001 | Chuyển JWT sang cookie httpOnly + middleware (đúng như README @supabase/ssr) | **CAO: chạm auth toàn cục** → patch + hỏi |
| FE-004 | Thêm test frontend (Vitest/RTL) + 1 E2E Playwright | thấp |
| DATA-001/002 | Redact PII trước LLM; định nghĩa retention + quyền xoá | trung |

---

## BATCH 3 — Nợ dài hạn (ghi nhận, chưa cần làm)

- AI-006: hợp nhất/loại TF-IDF fallback nếu không dùng.
- AI-004: đóng khung chunk <document> chống indirect injection + chạy attack eval (eval/attacks.yaml).
- OPS-002: GitHub Environment protection cho production CD.
- OPS-006: cân nhắc Render starter thay free nếu phục vụ thật.
- FE-002/003/005, BE-007, DATA-005: cleanup UX/log/maint.
- Dọn dead code: `backend/` (rỗng), dashboard/simulation_app nếu không production.

---

## Ghi chú thực thi
- Sau mỗi 5 finding: dừng, tóm tắt cho người review.
- Sau mỗi commit: `uv run pytest -q && (cd frontend && node node_modules/typescript/bin/tsc --noEmit)`.
- Kết thúc: chạy lại Phase A → `audit/raw2/`, viết `audit/VERIFY.md` so sánh trước/sau (Phase G).
