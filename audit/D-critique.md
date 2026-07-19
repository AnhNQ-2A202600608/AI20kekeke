# Phase D — Phản biện chính bản audit

Commit: `c939220`. Vai trò: người phản biện đi tìm lỗi TRONG báo cáo, không bảo vệ nó.

## 1. False positive đã LOẠI trong lúc audit (không đưa vào findings)

| Nghi ngờ ban đầu | Kết luận | Lý do (bằng chứng) |
|---|---|---|
| IDOR: endpoint nhận student_id từ body/query, tin client | **LOẠI** | Mọi endpoint có `if role=='student' and id!=auth_user.id: 403` nhất quán (adaptive_routes:313,638,936,955,966,1025; routes.py:966,1025). |
| Client khai gian hint_count/used_ai_help phá chống gian lận | **LOẠI (phần hint)** | Live mode đếm hint từ DB (submit:688-689), bỏ qua client. CÒN LẠI used_ai_help → giữ, thành AI-001 nhưng vì lý do KHÁC (hardcode False, không phải tin client). |
| submit_attempt_v3 idempotency lỗi ép kiểu `to_jsonb(qa) INTO uuid` | **LOẠI khỏi live** | Bản áp dụng cuối (security_and_correctness_fixes.sql:83) dùng `qa.id` đúng. Giữ lại dưới dạng DB-002 (fragility thứ tự migration) vì bản giữa tái tạo lỗi. |
| Double propagation (RPC + async Python) | **LOẠI** | RPC cuối CỐ Ý bỏ propagation đồng bộ (security_and_correctness_fixes.sql:9, trả []). Chỉ async Python propagate → không nhân đôi. Chuyển thành DB-003 (durability/locking của async). |
| S608 SQL injection sync_routes.py:83 | **LOẠI** | f-string chỉ dựng placeholder `?,?,?`; giá trị tham số hoá. Ghi false-positive trong raw/INDEX.md. |
| Frontend leak SSE connection | **LOẠI** | api-client dùng response.json() không streaming (FE-003); không mở stream nên không leak. |
| CI không chặn (|| true) | **LOẠI** | Không có continue-on-error/|| true; CI chặn thật (OPS-POS). |
| pytest suite hỏng hoàn toàn (repo defect) | **HẠ CẤP** | Crash là đặc thù Windows (reconfigure stderr). CI ubuntu nhiều khả năng chạy được → OPS-005 mức LOW, không phải "test suite chết". |

## 2. Findings CONFIRMED (đã tái hiện bằng đọc code/tool, không cần DB live)

SEC-002 (no rate limit), SEC-003 (requests no timeout — ruff S113), SEC-004/FE-001 (JWT localStorage), SEC-005 (CORS), AI-001 (used_ai_help=False), AI-002 (citation passthrough), AI-003 (student_query chỉ ở 1 node), BE-001/BE-002 (async blocking — ruff ASYNC), BE-003 (P(T) 0.06 vs 0.10), BE-004 (blind except — ruff), BE-005 (god routers), BE-006 (mypy off), FE-002/003/004/005, OPS-001 (Trivy commented), OPS-002 (auto-CD), OPS-003 (/health cứng), OPS-004 (no coverage tool), OPS-005 (windows pytest), DOC-001..008, DATA-001/002.

## 3. Findings SUSPECTED / NEEDS_HUMAN (không tự tin xếp CRITICAL/HIGH khi chưa tái hiện)

- **SEC-001/DB-001 (search_path)** — HIGH nhưng chỉ đọc code migration. Cần `SELECT proconfig FROM pg_proc WHERE prosecdef` trên production để chắc bản live thật sự thiếu search_path. Đọc migration cuối cho thấy THIẾU → confidence cao nhưng vẫn nên xác minh live.
- **DB-002 (migration order fragility)** — suspected. Cần `pg_get_functiondef` trên production để biết bản live là bản đúng hay lỗi.
- **SEC-006 (RLS live state)** — needs_human. db-state không lấy được (không có quyền query production). Migration cho thấy feedback_events RLS bị tắt (20260627) nhưng trạng thái THẬT chưa xác nhận.
- **AI-004 (indirect injection)** — suspected. Chưa chạy attack eval thật.
- **DATA-003/004 (backup, access mgmt)** — needs_human. Không có trong repo.
- **DB-004 (cache consistency)** — suspected. Chưa đọc hết khối cache 816-840.

## 4. Vùng MÙ (công cụ không chạy được → mọi kết luận về trục này confidence thấp)

| Trục | Vì sao mù | Ảnh hưởng |
|---|---|---|
| RLS/index/pg_stat live (db-state) | Không có quyền query Supabase production | SEC-006, DB index/EXPLAIN, drift — chưa kiểm |
| SAST (semgrep), secret scanner chuyên dụng (gitleaks/trufflehog) | Không cài | Thay bằng ruff S + git grep; có thể sót pattern |
| Dependency CVE (pip-audit/pnpm audit/trivy) | Không cài | Không có danh sách CVE — mục "phụ thuộc" của C1 chưa làm |
| Coverage (pytest-cov) | Không cài | Không biết module nào chưa test — C6 coverage-by-module trống |
| Type-check (mypy) | Config repo tự tắt (ignore_errors) | Trục type-safety mù (chính nó là BE-006) |
| Complexity (radon), dead code (vulture) | Không cài | Ước lượng bằng LOC + ruff C901 |
| Attack eval (LLM jailbreak thật) | Cần staging + API key | AI-003/004 chưa có bằng chứng chạy thật |

## 5. Endpoint chưa được kiểm sâu (đối chiếu bảng authz vs findings)

Đã kiểm authz: recommend, submit, mastery, sync-mastery, activity, recent_sessions, graph relations (require_teacher), material (require_role), quiz_error/review (require_role), onboarding (get_current_user). **Chưa đọc sâu**: admin_braintrust_routes (8 endpoint — auth dependency chưa xác nhận role gate), placement/submit, audit/* trong routes.py (audit/decisions, audit/rewards, audit/rag-test, audit/eval-dataset — có thể lộ dữ liệu nếu thiếu role gate). → Đề xuất kiểm ở vòng sau; đánh dấu là khoảng trống đã biết.

## 6. Tự đánh giá độ tin cậy báo cáo

- **Chắc chắn**: adaptive math (đọc kỹ RPC + Python), auth flow, IDOR pattern, async/lint findings (có tool), doc mismatch, RPC locking/idempotency/propagation design.
- **Suy luận từ code, chưa chạy**: search_path exploit, migration order, prompt-injection resilience.
- **Không kiểm được**: RLS live, CVE, coverage số, backup/ops.
- **Chưa đọc hết**: admin_braintrust_routes, audit/* endpoints, onboarding_routes (1038 dòng) chi tiết, dashboard/simulation_app.
