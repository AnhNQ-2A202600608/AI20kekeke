# BÁO CÁO THẨM ĐỊNH MÃ NGUỒN — ADAPTIVE LEARNING ENGINE & SOCRATIC CHATBOT

Kết luận tổng quát: **CHƯA SẴN SÀNG PRODUCTION.** Điểm sáng lớn của hệ thống là kiến trúc được thiết kế bài bản theo **MOOClet Framework** (tách biệt rõ ràng Versions, User Store, và Selection Policy) giúp tối ưu lượng code và tối đa hóa tính linh hoạt vận hành; lõi toán học (BKT, Elo, Sherman-Morrison) đúng chuẩn. Tuy nhiên, tầng API/Repository hiện còn tồn tại 7 Blocker, trong đó có 3 lỗi phá vỡ trực tiếp tính toàn vẹn dữ liệu và chống gian lận.

---

## A. DANH SÁCH BLOCKER (bắt buộc sửa trước khi lên Production)

### BLOCKER 1 — Transaction bị MOCK hoàn toàn, `/submit` ghi 8 lần không nguyên tử
**File:** `src/services/adaptive/supabase_database.py` (cuối file)
```python
def begin(self):
    pass
def commit(self):
    pass
def rollback(self):
    pass
```
`/submit` (`src/api/adaptive_routes.py`) thực hiện tuần tự: `update_student_mastery` → `update_question_elo` → `log_quiz_attempt` → `update_bandit_policy_config` → 3 lệnh log, trải trên **2 schema (app + audit)** qua PostgREST stateless. Nếu lỗi ở bước 4/8, học sinh đã bị trừ/cộng Elo nhưng không có attempt log, không có reward — `db.rollback()` không làm gì cả. Toàn bộ khối `try/except` với rollback hiện chỉ là trang trí.

**Yêu cầu sửa:** gom toàn bộ luồng submit vào một PostgreSQL Function (RPC) duy nhất — vừa nguyên tử, vừa giải quyết BLOCKER 2. Mã nguồn tại Phụ lục A1.

### BLOCKER 2 — Race condition `difficulty_elo` (ADR-004 ghi "Accepted" nhưng KHÔNG được triển khai)
**File:** `src/services/adaptive/supabase_database.py`, hàm `update_question_elo`
```python
self.app_client.table("questions").update({"difficulty_elo": difficulty_elo, ...})
```
Đây chính xác là kịch bản Lost Update mô tả trong ADR-004: API đọc Elo ở `get_question_by_id`, tính toán trên server, rồi **ghi đè số cứng**. Không có `SELECT ... FOR UPDATE`, không có RPC, không có version check. Hai học sinh nộp cùng lúc → một kết quả hiệu chuẩn bị mất. ADR quyết định Pessimistic Locking nhưng code không có dòng nào thực hiện.

Lỗi tương tự ở `update_student_mastery`: đọc `attempt_count`/`correct_count` rồi cộng 1 trên Python và ghi đè — học sinh mở 2 tab nộp song song sẽ mất count.

**Yêu cầu sửa:** RPC `submit_attempt_txn` tại Phụ lục A1 (khóa dòng `FOR UPDATE` cho cả `questions` và `student_concept_mastery`).

### BLOCKER 3 — Replay Attack KHÔNG bị chặn: một `decision_id` nộp được vô hạn lần
**File:** `src/api/adaptive_routes.py`, hàm `submit_attempt`, bước 1
Code chỉ kiểm tra `decision.student_id == request.student_id` và `selected_action_id == question_id`. **Không kiểm tra decision đã được tiêu thụ hay chưa.** Học sinh gọi `/recommend` một lần, lấy câu dễ nhất, rồi POST `/submit` cùng `decision_id` với `actual_score=1.0` lặp 100 lần → Elo và BKT tăng 100 lần, mỗi lần đều hợp lệ qua cross-validation hiện tại.

**Yêu cầu sửa:** thêm cột `consumed_at timestamptz` vào `audit.adaptive_decisions`; trong RPC, `UPDATE ... SET consumed_at = now() WHERE id = :decision_id AND consumed_at IS NULL` — nếu 0 row ảnh hưởng thì raise lỗi 409. (Đã gộp trong Phụ lục A1.)

### BLOCKER 4 — `actual_score`, `hint_count`, `used_ai_help` do CLIENT tự khai
**File:** `src/models/adaptive_schemas.py` (`SubmitRequest`) + `adaptive_routes.py`
Server có sẵn `answer_key` trong bảng `questions` (được `get_question_by_id` trả về) nhưng **không chấm bài**. Điểm số là một field JSON client gửi lên. Toàn bộ cơ chế "chống gian lận AI" sụp đổ vì kẻ gian chỉ cần gửi `used_ai_help=false, hint_count=0, actual_score=1.0`. 

**Yêu cầu sửa:** chấm `student_answer` đối chiếu `answer_key` ở server ngay trong `submit_attempt`; xóa `actual_score` khỏi `SubmitRequest` (hoặc chỉ giữ cho loại câu hỏi tự luận có pipeline chấm riêng). `hint_count` phải do server đếm qua bảng log lượt xin gợi ý, không nhận từ client.

### BLOCKER 5 — Đóng băng Elo khi dùng AI bị sai: đóng băng luôn cả độ khó câu hỏi
**File:** `src/api/adaptive_routes.py` (bước 4) + `src/services/adaptive/elo.py`
```python
new_student_elo, new_question_elo = calculate_elo_updates(..., k_factor=0.0)
```
Spec (docstring elo.py + ADR): khi `used_ai_help=True`, chỉ đóng băng Elo học sinh, **câu hỏi vẫn phải được hiệu chuẩn**. Nhưng `k_factor` trong `calculate_elo_updates` nhân vào **cả hai** delta. Đã kiểm chứng bằng chạy code: `calc(1200, 1200, 1.0, k=0.0)` → `(1200.0, 1200.0)` — question Elo đứng yên. Implementation mâu thuẫn trực tiếp với thiết kế.

**Yêu cầu sửa:** tách K-factor:
```python
def calculate_elo_updates(student_elo, question_elo, actual_score, hint_count=0,
                          k_student: float = 32.0, k_question: float = 32.0):
    ...
    new_student_elo = student_elo + k_student * student_delta
    new_question_elo = question_elo + k_question * question_delta
```
Tầng API gọi `k_student=0.0, k_question=32.0` khi `used_ai_help=True`.

### BLOCKER 6 — Bandit policy toàn cục: bỏ qua `course_id` + race ghi đè cả config JSON
**File:** `src/services/adaptive/supabase_database.py`, hàm `get_bandit_policy_state(course_id)`
```python
.eq("name", "zpd_selector").eq("status", "active")   # KHÔNG có .eq("course_id", ...)
```
Tham số `course_id` được nhận nhưng không dùng → mọi khóa học dùng chung 1 policy, `arms_states` của tất cả câu hỏi mọi course trộn vào **một cột JSON duy nhất**. Hệ quả kép:
1. Mỗi `/recommend` và `/submit` đọc toàn bộ JSON, sửa 1 arm, ghi đè toàn bộ → hai request đồng thời (bất kỳ học sinh nào, bất kỳ course nào) xóa cập nhật Sherman-Morrison của nhau. Bandit học chậm/sai mà không ai phát hiện.
2. JSON phình vô hạn theo số câu hỏi (mỗi arm 3x3 matrix + vector), mỗi request tải về và đẩy lên lại toàn bộ.

**Yêu cầu sửa:** tách bảng `audit.bandit_arms (policy_id, arm_id PK, a_inv jsonb, b jsonb)`, lọc policy theo `course_id`, và update arm trong RPC (Phụ lục A1) hoặc bằng `UPDATE ... WHERE arm_id = X` từng dòng.

### BLOCKER 7 — `/chat` background sync ghi dữ liệu rác vào DB chính
**File:** `src/api/routes.py`, hàm `sync_mastery_to_db` + `chat`
Ba lỗi chồng nhau:
1. Default profile `elo_score=400.0`, `mastery_state="Beginner"` — hệ adaptive dùng default **1200.0** và enum `not_started/weak/learning/mastered`. Khi cache miss + DB lỗi, profile rác này có thể được agent cập nhật rồi **ghi thẳng xuống `student_concept_mastery`**: Elo học sinh từ 1200 sập về ~400, `mastery_state='Beginner'` vi phạm enum (hoặc tệ hơn: được chấp nhận nếu cột là text).
2. `sync_mastery_to_db` gọi `update_student_mastery` — hàm này **+1 `attempt_count`** vốn thiết kế cho nộp quiz. Mỗi lượt chat có cập nhật profile sẽ thổi phồng attempt_count, phá thống kê độ chính xác (correct_count/attempt_count).
3. `updated_profile = block_profile = result.get("student_profile")` — biến `block_profile` thừa, dấu hiệu code chưa được review.

**Yêu cầu sửa:** viết hàm sync riêng chỉ update các cột Elo/BKT/state (không đụng counters), đồng bộ default về 1200.0 và đúng enum.

---

## B. LỖI NGHIÊM TRỌNG MỨC CAO (High — nên xếp ngay sau Blocker)

### H1 — Nghi vấn `"now()"` không cast được qua PostgREST
`supabase_database.py`: `"last_practiced_at": "now()"`. Postgres chấp nhận chuỗi đặc biệt `'now'`, nhưng `'now()'` nhiều khả năng gây `invalid input syntax for type timestamptz` → **mọi lệnh `update_student_mastery` fail ở runtime thật**. Mock test không bắt được vì DB bị mock. Cần test integration thật; an toàn nhất dùng `datetime.now(timezone.utc).isoformat()` hoặc default/trigger ở DB.

### H2 — Lộ thông tin lỗi nội bộ ra client
`adaptive_routes.py` dòng cuối hai endpoint và `routes.py` `/chat`:
```python
raise HTTPException(status_code=500, detail=f"Lỗi xử lý nộp bài: {str(e)}")
```
`str(e)` của supabase-py chứa message PostgREST (tên bảng, cột, constraint). Trả `detail` chung chung, log chi tiết server-side (logger đã có).

### H3 — Không có authentication trên cả 3 endpoint
`student_id` lấy từ request body. Bất kỳ ai biết UUID của học sinh khác đều submit/đọc hộ được. Cần middleware JWT (Supabase Auth) và đối chiếu `student_id` từ token, không từ body.

### H4 — Guardrail Regex + `example_node.py` KHÔNG tồn tại trong gói thẩm định
Prompt audit yêu cầu rà `src/agents/nodes/example_node.py` và bộ lọc Regex chống giải hộ (ADR-006, Quyết định 2.2). Repomix **không chứa thư mục `src/agents/`** (routes.py import `from src.agents.graph import agent` — module nằm ngoài gói). Không thể xác nhận guardrail đã được tích hợp. Ở trạng thái gói hiện tại: chưa có bằng chứng triển khai → tính là chưa làm.

### H5 — Cache không được invalidate khi nộp quiz
ADR-005 cam kết "Elo thay đổi → System prompt thay đổi ngay lập tức". Nhưng `/submit` (adaptive_routes.py) **không ghi/không xóa** cache key `student:{...}:mastery` mà `/chat` đọc với TTL 300s. Học sinh vừa lên hạng qua quiz, chatbot vẫn coi là yếu tới 5 phút. Sửa: cuối `/submit` thành công, write-through profile mới vào cache (cùng key format — hiện key format chỉ định nghĩa trong routes.py, cần đưa về module chung).

---

## C. RECOMMENDATIONS (tối ưu / mở rộng)

1. **Chống tràn số (đã reproduce được OverflowError):** `elo.py` `10.0 ** ((q-s)/400)` và `bandit.py` `math.exp(...)` nổ `OverflowError` khi chênh lệch Elo cực lớn (dữ liệu DB hỏng/bị bơm). Clamp exponent: `min(20.0, max(-20.0, (q-s)/400.0))`.
2. **Ngưỡng không nhất quán:** `weakness_flag = bkt < 0.50` nhưng `weak` state là `< 0.30`; `is_correct = actual_score >= 0.75` là magic number — đưa về hằng số cấu hình chung, ghi vào ADR.
3. **`get_adaptive_db` tạo 2 Supabase client mỗi request** (dual-schema × mỗi lần Depends). Cache client ở module level (singleton) — PostgREST client là stateless, tái sử dụng an toàn.
4. **Reward âm hợp lệ nhưng chưa chống spam đáp án sai:** `R = score × (1 − 2|es − 0.75|)` cho R=0 khi score=0 bất kể es — spam sai hàng loạt không phạt arm, chỉ làm nhiễu. Cân nhắc rate-limit submit theo student và reward âm nhẹ cho score=0 ngoài ZPD.
5. **Hint discount nhân cả `question_delta`:** chấp nhận được, nhưng nên tách hệ số (câu hỏi vẫn cần tín hiệu hiệu chuẩn đầy đủ hơn học sinh). Hiện 1 hint còn 70%, 2 hints 40%, ≥3 hints 10% — đúng docstring.
6. **BKT params hardcode:** `BKTParameters()` mặc định cho mọi concept (comment trong code tự thừa nhận "Có thể đọc từ audit.bkt_parameters"). Per-concept params là yếu tố quyết định chất lượng BKT.
7. **`InMemoryCacheStore` không giới hạn kích thước** — memory leak chậm trên process sống lâu; thêm max-entries/LRU.
8. **Test suite (tests/test_api/test_adaptive.py) thiếu các case:** `used_ai_help=True` (sẽ bắt được BLOCKER 5 ngay), decision sai student (expect 403), question_id lệch (expect 400), decision không tồn tại (404), nộp lặp decision (sẽ bắt BLOCKER 3), partial score 0.5, exception giữa chừng phải gọi `rollback`. Mock hiện tại chỉ phủ happy-path.
9. **Simulation (eval/simulation_adaptive.py):** không seed (`random.seed`) → không tái lập; 1 học sinh, 30 bước là quá ít để kết luận hội tụ LinUCB (10 arms × 3 chiều); không mô phỏng hint/AI-help. Chạy ≥500 bước × ≥20 học sinh ảo, vẽ RMSE(est_diff vs true_diff) theo bước.
10. **Toán học đã xác minh ĐÚNG (không cần sửa):** posterior BKT đúng chuẩn Bayes cả 2 nhánh; nội suy partial credit không chia 0; cap 0.9999 hoạt động (kiểm chứng số: 0.9999 → posterior 0.99998 → cap giữ 0.9999, làm sai vẫn giảm được); Sherman-Morrison đúng công thức, mẫu số ≥ 1 (A⁻¹ PD), không có `np.linalg.inv` ở recommend-time; context vector đúng `[1.0, BKT, sigmoid((elo−1600)/400)]`; đỉnh reward tại es=0.75.

---

## D. ĐIỂM SÁNG VÀ ĐIỂM MẠNH KIẾN TRÚC (Strengths)

1. **Tuân thủ Kiến trúc chuẩn MOOClet Framework (Modular Experimentation & Personalization):**
   Hệ thống được thiết kế tách biệt cực kỳ khoa học dựa trên 3 trụ cột cốt lõi của Harvard/MIT MOOClet:
   - **Alternative Versions ($V$):** Quản lý ngân hàng câu hỏi độc lập tại `app.questions`.
   - **User Variable Store ($U$):** Hồ sơ năng lực thích ứng của học viên `app.student_concept_mastery` (kết hợp Elo + BKT).
   - **Selection Policy ($P$):** Tách biệt chính sách chọn hành động qua `audit.adaptive_policies` cấu hình động.
   *Lợi ích:* Đạt độ linh hoạt tối đa, cho phép chuyển đổi/thử nghiệm các thuật toán gợi ý khác nhau (LinUCB, Thompson Sampling, A/B Testing, Heuristic) trực tiếp bằng thay đổi database cấu hình mà không phải chỉnh sửa mã nguồn backend.
2. **Khả năng Mở rộng (Extensibility):** Thiết kế cấu trúc log tương tác dưới dạng `Context - Action - Reward` chuẩn hóa, mở đường cho việc áp dụng các mô hình học máy nâng cao trong tương lai mà không cần cấu trúc lại Database.

---

## PHỤ LỤC A1 — PostgreSQL RPC giải quyết BLOCKER 1, 2, 3 (và một phần 6)

```sql
-- Yêu cầu: ALTER TABLE audit.adaptive_decisions ADD COLUMN consumed_at timestamptz;
create or replace function app.submit_attempt_txn(
  p_decision_id uuid,
  p_student_id uuid,
  p_course_id uuid,
  p_concept_id uuid,
  p_question_id uuid,
  p_student_answer jsonb,
  p_actual_score numeric,      -- sau khi server đã chấm (BLOCKER 4)
  p_hint_count int,
  p_used_ai_help boolean,
  p_k_student numeric default 32.0,
  p_k_question numeric default 32.0
) returns jsonb
language plpgsql
security definer
as $$
declare
  v_decision record;
  v_mastery record;
  v_question record;
  v_expected numeric;
  v_sd numeric; v_qd numeric; v_disc numeric;
  v_new_student_elo numeric; v_new_question_elo numeric;
begin
  -- (BLOCKER 3) Tiêu thụ decision một lần duy nhất, khóa dòng
  update audit.adaptive_decisions
     set consumed_at = now()
   where id = p_decision_id
     and student_id = p_student_id
     and selected_action_id = p_question_id
     and consumed_at is null
  returning * into v_decision;
  if not found then
    raise exception 'DECISION_INVALID_OR_CONSUMED' using errcode = 'P0409';
  end if;

  -- (BLOCKER 2) Khóa bi quan đúng ADR-004
  select * into v_mastery from app.student_concept_mastery
   where student_id = p_student_id and course_id = p_course_id
     and concept_id = p_concept_id
   for update;
  select * into v_question from app.questions
   where id = p_question_id
   for update;

  -- Elo (đọc giá trị MỚI NHẤT sau khi đã giữ khóa)
  v_expected := 1.0 / (1.0 + power(10.0,
      least(20.0, greatest(-20.0,
        (v_question.difficulty_elo - v_mastery.elo_score) / 400.0))));
  v_sd := p_actual_score - v_expected;
  v_qd := v_expected - p_actual_score;
  if v_sd > 0 and p_hint_count > 0 then
    v_disc := greatest(0.1, 1.0 - 0.3 * p_hint_count);
    v_sd := v_sd * v_disc; v_qd := v_qd * v_disc;
  end if;
  -- (BLOCKER 5) AI-help: đóng băng RIÊNG học sinh
  if p_used_ai_help then p_k_student := 0.0; end if;

  v_new_student_elo  := round(v_mastery.elo_score        + p_k_student  * v_sd, 2);
  v_new_question_elo := round(v_question.difficulty_elo  + p_k_question * v_qd, 2);

  update app.student_concept_mastery
     set elo_score = v_new_student_elo,
         attempt_count = attempt_count + 1,                      -- atomic, hết lost update
         correct_count = correct_count + (p_actual_score >= 0.75)::int,
         last_practiced_at = now(), updated_at = now()
   where student_id = p_student_id and course_id = p_course_id
     and concept_id = p_concept_id;
  -- (BKT cập nhật ở app-layer truyền vào, hoặc port công thức vào đây tùy lựa chọn)

  update app.questions
     set difficulty_elo = v_new_question_elo, updated_at = now()
   where id = p_question_id;

  insert into app.quiz_attempts(student_id, course_id, question_id, concept_id,
    adaptive_decision_id, student_answer, is_correct, actual_score,
    expected_success, hint_count, used_ai_help)
  values (p_student_id, p_course_id, p_question_id, p_concept_id,
    p_decision_id, p_student_answer, p_actual_score >= 0.75, p_actual_score,
    v_expected, p_hint_count, p_used_ai_help);

  return jsonb_build_object(
    'old_elo', v_mastery.elo_score, 'new_elo', v_new_student_elo,
    'old_question_elo', v_question.difficulty_elo,
    'new_question_elo', v_new_question_elo,
    'expected_success', v_expected);
end $$;
```
Gọi từ Python: `self.app_client.rpc("submit_attempt_txn", {...}).execute()` — một round-trip, nguyên tử, có khóa dòng. Các bảng audit log còn lại có thể insert trong cùng function (mở rộng) để đạt nguyên tử 100%. Riêng bandit arm update tách bảng `audit.bandit_arms` và update theo `arm_id` (BLOCKER 6).

---

## TÓM TẮT ƯU TIÊN

| # | Hạng mục | Mức | Effort |
|---|----------|-----|--------|
| 1 | RPC transaction + FOR UPDATE + chống replay (B1,B2,B3) | Blocker | 1-2 ngày |
| 2 | Server-side grading, bỏ tin client (B4) | Blocker | 1 ngày |
| 3 | Tách k_student/k_question (B5) | Blocker | 1 giờ |
| 4 | Tách bảng bandit_arms + lọc course_id (B6) | Blocker | 0.5-1 ngày |
| 5 | Sửa sync /chat: default 1200, không +attempt_count (B7) | Blocker | 2 giờ |
| 6 | Verify `"now()"`, ẩn str(e), auth JWT, cache write-through (H1–H5) | High | 1-2 ngày |
| 7 | Bổ sung test AI-help/replay/rollback, simulation seed + scale | Medium | 1 ngày |
