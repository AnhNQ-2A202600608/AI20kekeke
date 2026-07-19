# Báo cáo Audit Mentora (AI20kekeke)

**Commit:** `c939220c60f4f63a34b7a6cf6dc843023dc09e20` · **Nhánh:** dev · **Ngày:** 2026-07-19
**Phạm vi:** Phase A→E (chỉ audit, KHÔNG sửa mã nguồn). Phase F (sửa) chờ bạn duyệt.
**Giọng:** thẳng thắn. Cái gì tốt nói tốt, cái gì tệ nói tệ.

---

## 1. Tóm tắt điều hành

Mentora là một sản phẩm hackathon 4 ngày (128 commit) nhưng **kỹ thuật lõi tốt hơn mức mong đợi**: engine thích ứng (Elo/BKT/LinUCB) đúng toán và có vệ sinh số học, RPC giao dịch nguyên tử có khoá bi quan chống race condition, phân quyền IDOR nhất quán, JWT xác thực đầy đủ chữ ký, và **không có secret nào bị commit**. Đây không phải project ghép từ tutorial.

Nhưng nó **chưa sẵn sàng phục vụ sinh viên thật** ở trạng thái hiện tại, vì các lý do có thể sửa nhanh chứ không phải lỗi kiến trúc:

**5 rủi ro lớn nhất:**
1. **Không có rate limiting** ở bất kỳ đâu — `/chat` đốt tiền LLM vô hạn, `/auth/login` brute-force tự do (SEC-002).
2. **Cơ chế chống gian lận cốt lõi bị chết**: `used_ai_help` luôn = False → sinh viên dùng AI trợ giúp vẫn được đầy đủ Elo (AI-001). Đây là tính năng README quảng cáo nhưng không hoạt động.
3. **RPC SECURITY DEFINER không SET search_path** → nguy cơ leo thang quyền qua Postgres (SEC-001/DB-001).
4. **Không có quét bảo mật trong CI** (Trivy bị comment "TODO"), **không có coverage**, và **auto-deploy production không cổng phê duyệt** (OPS-001/002/004).
5. **Backup/khôi phục không xác định được** — với dữ liệu học tập thật, nếu chưa có backup đã test thì đây là rủi ro mất dữ liệu (DATA-003, cần đội xác nhận).

**Điểm sức khoẻ từng trục (/10):**

| Trục | Điểm | Một câu lý do |
|---|---|---|
| Bảo mật | 6.5 | Nền tảng đúng (auth/IDOR/no-secret) nhưng thiếu rate limit + search_path + quét CI. |
| Đúng đắn | 7.5 | Math adaptive & RPC locking tốt; điểm trừ: used_ai_help chết, P(T) lệch Python/SQL, propagation async không bền. |
| Chất lượng code | 6 | Router 2000 dòng, async blocking, mypy tắt, blind-except tràn lan; nhưng lõi adaptive sạch. |
| Test | 5.5 | Backend test khá nhiều & có ý nghĩa; frontend 0 test, coverage mù, no security scan. |
| Vận hành | 5 | /health cứng, auto-CD không gate, backup không rõ, Render free ngủ đông. |
| Tài liệu | 4.5 | Nhiều tuyên bố lệch code (2 bảng endpoint, @supabase/ssr, Zustand, ARCHITECTURE.md rỗng). |

**Kết luận thẳng:** CHƯA nên mở cho sinh viên thật cho tới khi xong **BATCH 0 + BATCH 1** (xem FIXPLAN) — chủ yếu là rate limit, search_path, used_ai_help, health check, và xác nhận backup + RLS live. Không mục nào cần đổi kiến trúc; ước lượng ~1 tuần.

**Không có phát hiện CRITICAL nào sống sót** (không có secret lộ, không IDOR, không lộ dữ liệu vô danh). Rủi ro nặng nhất là HIGH.

---

## 2. Bảng gộp findings (sort theo Priority ~ Impact×Likelihood ÷ Effort)

| ID | Sev | Trục | Tiêu đề | File:dòng | I | L | Eff | Conf |
|---|---|---|---|---|---|---|---|---|
| SEC-002 | HIGH | security | Không rate limit (/chat, /login) | main.py:54 | 4 | 4 | M | confirmed |
| AI-001 | HIGH | integrity | used_ai_help luôn False | adaptive_routes.py:690 | 4 | 4 | M | confirmed |
| SEC-001 | HIGH | db-priv | RPC SECURITY DEFINER thiếu search_path | ...security_and_correctness_fixes.sql:27 | 4 | 3 | M | confirmed |
| BE-001 | HIGH | async | requests blocking trong async | quiz_generator.py:118 | 4 | 3 | M | confirmed |
| DATA-003 | HIGH | recovery | Backup/restore không xác định | — | 5 | 2 | M | needs_human |
| SEC-003 | MED | security | requests không timeout (13 chỗ) | material_routes.py:104 | 3 | 3 | S | confirmed |
| AI-002 | MED | rag | Thiếu citation vẫn cho qua (TC-001) | citation_validator.py:72 | 3 | 3 | M | confirmed |
| DB-003 | MED | durability | Propagation async không bền + không khoá | adaptive_routes.py:805 | 3 | 3 | L | confirmed |
| OPS-001 | MED | ci | Không quét bảo mật (Trivy comment) | ci-backend.yml:58 | 3 | 3 | M | confirmed |
| OPS-003 | MED | ops | /health cứng, Render trỏ /health | main.py:122 | 3 | 2 | S | confirmed |
| SEC-004 | MED | frontend | JWT trong localStorage | session.ts:39 | 4 | 2 | L | confirmed |
| BE-003 | MED | correctness | P(T) BKT lệch 0.06 (Py) vs 0.10 (SQL) | bkt.py:19 | 3 | 2 | M | confirmed |
| DB-002 | MED | migration | v3 redefine 5× (3 cùng ngày), thứ tự mong manh | ...dynamic_elo_calibration.sql:121 | 3 | 2 | M | suspected |
| AI-003 | MED | injection | <student_query> chỉ ở 1 node | respond_general_node.py:85 | 3 | 2 | S | confirmed |
| BE-004 | MED | errors | 112 blind-except + 29 pass | supabase_database.py:146 | 2 | 3 | M | confirmed |
| BE-005 | MED | maint | God routers 2000+ dòng | adaptive_routes.py:1 | 2 | 3 | L | confirmed |
| BE-006 | MED | types | mypy tắt toàn cục | pyproject.toml:40 | 2 | 3 | L | confirmed |
| OPS-002 | MED | cd | Auto-CD prod không gate | ci-backend.yml:74 | 3 | 2 | M | confirmed |
| OPS-004 | MED | test | Coverage mù (no pytest-cov) | pyproject.toml:20 | 2 | 3 | S | confirmed |
| AI-004 | MED | injection | Indirect injection qua slide | respond_node.py:198 | 3 | 2 | M | suspected |
| AI-005 | MED | cost | Reflection loop +LLM, no chặn (do no rate limit) | graph.py:87 | 2 | 3 | M | confirmed |
| DATA-001 | MED | privacy | PII/nội dung gửi OpenAI, no redact | respond_node.py:313 | 3 | 3 | M | confirmed |
| DATA-002 | MED | privacy | PII không có retention/xoá | ...mssv.sql | 3 | 2 | L | confirmed |
| SEC-006 | MED | rls | RLS live chưa xác nhận; service_role bỏ qua RLS | ...disable_rls_feedback_events.sql | 3 | 2 | L | needs_human |
| FE-004 | MED | test | Frontend 0 test | ci-frontend.yml:56 | 2 | 3 | M | confirmed |
| DATA-004 | MED | access | Quản lý key/quyền prod không rõ | — | 3 | 2 | M | needs_human |
| SEC-005 | LOW | cors | CORS allow_credentials + '*' methods | main.py:54 | 2 | 2 | S | confirmed |
| FE-002 | LOW | frontend | Không AbortController (race) | api-client.ts:28 | 2 | 2 | S | confirmed |
| FE-003 | LOW | docs | Chat không streaming như README | api-client.ts:43 | 1 | 2 | M | confirmed |
| BE-007 | LOW | errors | raise no-from, log f-string | — | 1 | 2 | M | confirmed |
| OPS-005 | LOW | dx | pytest crash Windows | tests/eval/run_eval.py:11 | 2 | 3 | S | confirmed |
| OPS-006 | LOW | cost | keep-awake 10' | keep-awake.yml:6 | 1 | 3 | S | confirmed |
| AI-006 | LOW | debt | 2 hệ RAG (pgvector + TF-IDF) | rag.py:732 | 1 | 2 | M | confirmed |
| FE-005 | LOW | maint | giao-vien 600 dòng | giao-vien/page.tsx:1 | 1 | 2 | M | confirmed |
| DOC-001..008 | LOW | docs | Lệch tài liệu (xem findings-docs.json) | README/ARCHITECTURE | 1-3 | 3 | S-M | confirmed |
| DATA-005 | LOW | logging | Query học sinh vào Braintrust span | rag.py:428 | 2 | 2 | M | suspected |

Chi tiết + bằng chứng + repro trong `audit/findings-*.json`.

---

## 3. Nguyên nhân gốc (3 quyết định, không phải 30 triệu chứng)

**RC-1 — "Ship demo nhanh, hoãn phần vận hành/an toàn vòng ngoài."**
Hệ quả: SEC-002 (no rate limit), OPS-001 (Trivy comment "TODO"), OPS-002 (no gate), OPS-003 (/health cứng), OPS-004 (no coverage), OPS-006 (keep-awake bù free tier), DATA-003/004 (backup/ops chưa có). Lõi được chăm; vỏ vận hành để lại.

**RC-2 — "Cài thuật toán ở HAI nơi (Python và PL/pgSQL) mà không có nguồn chân lý chung."**
Hệ quả: BE-003 (P(T) lệch), DB-002 (v3 redefine 5× rối), DB-003 (propagation chuyển async tách khỏi RPC), AI-001 (used_ai_help lẽ ra tính server nhưng stub False). Logic trùng lặp phân kỳ dần.

**RC-3 — "Tài liệu viết theo tham vọng, không theo code thực tế."**
Hệ quả: toàn bộ DOC-001..008 (2 bảng endpoint, @supabase/ssr, Zustand, Tailwind, ARCHITECTURE.md rỗng), FE-003 (streaming), một phần AI-002 (quảng cáo 'RAG có citation' nhưng không ép). Làm mất niềm tin của người review vào cả phần đúng.

---

## 4. Những thứ đang LÀM TỐT (đừng phá khi refactor)

1. **Adaptive engine đúng toán**: LinUCB Identity-init + Sherman-Morrison + ép đối xứng + isfinite guard (bandit.py:41,148,151); BKT Bayes + clamp + chống chia 0 (bkt.py:52,73); Elo clamp exponent (RPC:198). — *bằng chứng, không khen suông.*
2. **RPC submit_attempt_v3**: SELECT FOR UPDATE chống lost-update (RPC:179,193), idempotency (bản cuối:83), replay chặn (consumed_at), audit trail đầy đủ 4 bảng.
3. **Phân quyền IDOR nhất quán** ở mọi endpoint student (role==student && id!=sub → 403).
4. **JWT verify đầy đủ**: JWKS chữ ký + audience + issuer + require exp/sub (supabase_jwt.py:89-96); dev-token fail-closed khi production.
5. **Không secret nào commit**; .env chưa từng vào git.
6. **BFF proxy an toàn**: allowlist path + forward tối thiểu header (route.ts:3).
7. **Frontend type-clean**: tsc 0 lỗi, 0 `any`.
8. **CI chặn thật** (không `|| true`), test backend có ý nghĩa (RBAC, equivalence, bitemporal, robustness).
9. **Prompt an toàn**: delimiter <student_query> ở nhánh academic, citation validator loại trích dẫn bịa + fallback an toàn, guardrail trẻ vị thành niên.

---

## 5. Câu hỏi cho đội phát triển (code không trả lời được)

1. **Backup Supabase** đã bật chưa, tần suất, và đã TEST restore lần nào chưa? (DATA-003)
2. **used_ai_help**: thiết kế ban đầu định tính cờ này thế nào (đếm lượt /chat theo concept trong cửa sổ decision?) — hay chủ ý bỏ? (AI-001)
3. Trên **production Supabase**, `pg_get_functiondef('app.submit_attempt_v3')` cho ra bản nào (có search_path? idempotency dùng qa.id hay to_jsonb?) và **RLS bảng nào đang bật**? (SEC-001, DB-002, SEC-006)
4. Vì sao **graph propagation chuyển từ trong-RPC ra FastAPI background_task**? Có chủ ý đánh đổi độ bền không? (DB-003)
5. Có **DPA/consent** cho việc gửi nội dung học sinh (có thể là trẻ vị thành niên) lên OpenAI/Braintrust không? (DATA-001/005)
6. `backend/` (rỗng), `dashboard/simulation_app.py` (1082 dòng) — production hay công cụ nội bộ? (dọn dead code)
7. Ai giữ SUPABASE_SECRET_KEY, có lịch xoay không, quy trình khi lộ? (DATA-004)

---

## 6. Trạng thái công cụ (đọc kèm để biết độ tin cậy)

Xem `audit/raw/INDEX.md`. Trục MÙ (chưa kiểm được, cần chạy trong CI/Supabase): RLS live, CVE phụ thuộc (pip-audit/pnpm audit/trivy), coverage số, SAST (semgrep), mypy (bị repo tự tắt). Mọi kết luận về các trục này để ở mức confidence thấp/needs_human.
