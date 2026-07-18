# Database (Algorithm Focused)

## Tech Stack

- **Supabase PostgreSQL** — relational + vector trong cùng 1 instance
- **pgvector** extension — lưu embeddings `vector(1536)` trực tiếp trên `app.material_chunks`
- **HNSW index** — cosine similarity search cho RAG retrieval

## Folder Structure

```text
db/
├── README.md               ← file này
├── schema/                 ← sơ đồ visualization (paste vào dbdiagram.io)
│   └── adaptive-algo.dbml  ← DBML diagram source (Algo-focused)
├── supabase/
│   └── migrations/         ← production SQL migrations (chạy thật)
│       ├── 20260611_initial_schema.sql
│       └── 20260612_adaptive_fixes.sql   ← [NEW] fix blockers + RPC
└── seed/                   ← test/mock data
```

## Schema Architecture (Algo Focused)

Sơ đồ cơ sở dữ liệu này được thiết kế tinh giản, tập trung hoàn toàn vào hoạt động của các thuật toán thích ứng (**ELO**, **BKT**, và **LinUCB Contextual Bandit**), loại bỏ các bảng nghiệp vụ tĩnh và RBAC.

### 2 Schemas: `app` vs `audit`

| Schema | Hành vi | Mục đích |
|--------|---------|----------|
| `app.*` | READ + UPDATE | Dữ liệu chạy ứng dụng (API, UI) |
| `audit.*` | INSERT only (append-only) | Lịch sử biến động, telemetry, ML training |

### Table Summary (15 tables - Algo Focused)

**`app.*` — 8 tables core logic & runtime:**

| Table | Vai trò |
|-------|---------|
| `users` | Người dùng tối giản (student/teacher) |
| `courses` | Khóa học |
| `concepts` | Cây khái niệm (Knowledge Graph) |
| `student_concept_mastery` | Elo + BKT per student per concept (Core state) |
| `questions` | Ngân hàng câu hỏi (MCQ, code, flashcard) + difficulty Elo |
| `question_hints` | Gợi ý Socratic theo 3 cấp độ |
| `hint_logs` | [NEW] Nhật ký dùng gợi ý Socratic để tính khấu trừ Elo |
| `quiz_attempts` | Nhật ký làm bài của học sinh |

**`audit.*` — 7 tables analytics & ML state:**

| Table | Vai trò |
|-------|---------|
| `adaptive_policies` | Cấu hình bandit (LinUCB) lọc theo `course_id` |
| `bandit_arms` | [NEW] Trạng thái LinUCB (A_inv, b) cập nhật in-place per-arm |
| `adaptive_decisions` | Vết quyết định của LinUCB (context snapshot, UCB score, consumed_at) |
| `adaptive_rewards` | Tín hiệu reward (Y) tính từ ZPD target (0.75) phục vụ bandit update |
| `bkt_parameters` | Tham số BKT per concept (prior, transition, guess, slip) |
| `mastery_events` | Append-only log ghi lại biến động Elo + BKT của học sinh |
| `question_elo_events` | Append-only log ghi lại biến động Elo độ khó câu hỏi |

---

## RPC Functions (2)

- `app.submit_attempt_txn` — Giao dịch nộp bài nguyên tử (Atomic transaction): Khóa bi quan SELECT FOR UPDATE ELO học sinh & câu hỏi, khấu trừ Elo khi dùng hint, đóng băng Elo học sinh khi dùng AI trợ giúp, cập nhật incremental counter, chống Replay Attack qua `consumed_at`, và log attempt trơn tru ở DB layer.
- `app.count_hints_for_decision` — Đếm số lượt gợi ý Socratic học viên đã sử dụng cho lượt quyết định tương ứng.

## Visualization

Paste nội dung file [adaptive-algo.dbml](file:///d:/code/AI20kekeke/db/schema/adaptive-algo.dbml) vào [dbdiagram.io](https://dbdiagram.io/d) để xem sơ đồ trực quan.
