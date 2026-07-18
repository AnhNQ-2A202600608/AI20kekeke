# BÁO CÁO KIỂM ĐỊNH BẢO MẬT & THUẬT TOÁN — ADAPTIVE LEARNING CORE
**Mã dự án:** ai20kekeke · **Ngày:** 2026-06-18 · **Phạm vi:** `src/services/adaptive/*`, `src/api/adaptive_routes.py`, `adaptive_schemas.py`, migration `concept_relations.sql`, `test_adaptive.py`
**Kết luận tổng quan:** KHÔNG ĐẠT (Not production-ready). 9 lỗi CRITICAL, 8 MAJOR. Toàn bộ trụ cột "Atomicity – Pessimistic Locking – Anti-Replay" hiện tại **không tồn tại trong code kiểm định được** hoặc là **no-op rỗng**.

---

## 0. PHÁT HIỆN NỀN TẢNG (đọc trước khi xem chi tiết)

[Hiện trạng] → [Vấn đề] → [Giải pháp] cho hai sự thật phá vỡ mọi giả định thiết kế:

**A. Tầng giao dịch là rỗng (no-op).**
`supabase_database.py` dòng 2549–2556:
```python
def begin(self):   return None
def commit(self):  return None
def rollback(self): return None
```
Supabase REST (PostgREST) **auto-commit từng câu lệnh**. Nghĩa là: mọi `db.commit()` / `db.rollback()` trong route **không làm gì cả**. Không có transaction nào bao quanh luồng Python. Mọi `UPDATE` trong `propagate_mastery` được **ghi vĩnh viễn ngay lập tức**, không thể rollback.

**B. RPC `submit_attempt_v2` — nơi được cho là chứa SELECT FOR UPDATE, anti-replay nguyên tử và Sherman-Morrison SQL — KHÔNG có trong tập tin đính kèm.** Chỉ có 1 file SQL: `concept_relations.sql` (tạo bảng, không có function nào). Do đó:
- Mọi tuyên bố "Pessimistic Locking", "Idempotency chống Replay", "Sherman-Morrison trong DB" **không kiểm định được** và phải coi là **chưa được chứng minh**.
- Hàm Python `LinUCB.update_arm()` (chứa Sherman-Morrison có fix đối xứng) **là DEAD CODE** — không route nào gọi nó. Đường cập nhật bandit thật nằm trong RPC ẩn.

> Hệ quả: phần lớn "lớp phòng vệ" trong báo cáo phía dưới chỉ là **trang trí** ở tầng API; phòng vệ thật (nếu có) nằm hoàn toàn trong code không được cung cấp để audit. Đây tự nó là một lỗ hổng quy trình nghiêm trọng.

---

## 1. [CRITICAL] — Crash / Hỏng DB / Mất dữ liệu / Hack Elo-BKT

### C-1. Không có xác thực/phân quyền — `student_id` lấy từ body request
**File:** `adaptive_routes.py` toàn bộ endpoints.
Endpoint `/submit`, `/recommend`, `/sync-mastery` nhận `student_id` **trong body**, không có token/JWT, không kiểm tra caller có đúng là học sinh đó không.

- Bất kỳ ai cũng nộp bài thay mặt **bất kỳ student_id nào**, bơm/hạ Elo & BKT tùy ý.
- `/sync-mastery` cho phép **ghi đè trực tiếp** `elo_score`, `bkt_mastery_probability`, `mastery_state` với giá trị bất kỳ từ client → gian lận điểm tuyệt đối, không qua bất kỳ thuật toán nào.

**Sửa:** Bắt buộc xác thực, lấy `student_id` từ token, cấm truyền qua body.
```python
from fastapi import Security
def current_student(token=Security(verify_jwt)) -> UUID:
    return token.sub  # student_id từ JWT đã verify

@router.post("/submit", response_model=SubmitResponse)
def submit_attempt(request: SubmitRequest,
                   student_id: UUID = Depends(current_student),
                   db=Depends(get_adaptive_db)):
    # KHÔNG dùng request.student_id nữa
    ...
```
Xóa `student_id` khỏi `SubmitRequest`/`RecommendRequest`/`SyncMasteryRequest`. `/sync-mastery` chỉ cho phép gọi từ service nội bộ (service-role key + allowlist), không expose ra client.

---

### C-2. Endpoint duyệt HITL không phân quyền giáo viên — phá vỡ toàn bộ "Human in the Loop"
**File:** `adaptive_routes.py` dòng 1995–2021 (`PATCH /graph/relations/{id}`).
"Phê duyệt giáo viên" là cổng an toàn duy nhất quyết định cạnh nào được lan truyền (`status='approved'`). Endpoint này **không kiểm tra vai trò**. Một học sinh có thể:
1. `POST /graph/relations` tạo quan hệ giả với `weight` khổng lồ.
2. `PATCH` tự `status='approved'`.
3. Trả lời 1 câu → lan truyền tăng/giảm BKT toàn đồ thị theo ý muốn.

→ Vừa là lỗ hổng phân quyền, vừa là vector **hack BKT** trực tiếp.

**Sửa:** Thêm guard role `teacher/admin` cho mọi mutation đồ thị; validate `relation_type`/`status` theo enum.
```python
def require_teacher(token=Security(verify_jwt)):
    if token.role not in ("teacher", "admin"):
        raise HTTPException(403, "Chỉ giáo viên được phê duyệt quan hệ.")

@router.patch("/graph/relations/{relation_id}")
def update_graph_relation(relation_id: UUID, request: ConceptRelationUpdate,
                          _=Depends(require_teacher), db=Depends(get_adaptive_db)):
    if request.status not in (None, "draft", "approved", "rejected"):
        raise HTTPException(422, "status không hợp lệ.")
    ...
```

---

### C-3. Cờ chống gian lận `used_ai_help` / `hint_count` do client tự khai
**File:** `adaptive_schemas.py` 689–690; `elo.py` 648–651.
Toàn bộ cơ chế "đóng băng Elo khi dùng AI" và "hint discount" dựa trên hai trường client gửi lên. Học sinh chỉ cần gửi `used_ai_help=false, hint_count=0` là **luôn nhận Elo đầy đủ** dù đã dùng AI/gợi ý.

**Sửa:** Không tin client. Đếm hint & cờ AI **phía server** từ log phiên thực tế:
```python
# Lấy từ bảng hint_events / ai_help_events đã ghi server-side, không từ payload
hint_count   = db.count_hints(request.decision_id)
used_ai_help = db.was_ai_used(request.decision_id)
```
Trường client (nếu giữ) chỉ dùng để đối chiếu/cảnh báo, không dùng để tính điểm.

---

### C-4. Dùng ANON/PUBLISHABLE key + bảng không có RLS → DB mở toang
**File:** `adaptive_routes.py` 1636–1643 (fallback `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY`); `concept_relations.sql` (không có RLS policy).
App fallback sang **anon/publishable key**. Migration `concept_relations.sql` **không bật RLS, không có policy**. Trên Supabase, bảng không RLS + anon key = bất kỳ ai có anon key (lộ ở frontend) **đọc/ghi trực tiếp mọi bảng**, bỏ qua hoàn toàn API và mọi check ở trên.

**Sửa:**
- Backend bắt buộc dùng **service-role key** (chỉ ở server), bỏ fallback anon.
- Bật RLS + policy cho mọi bảng:
```sql
ALTER TABLE app.concept_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app.student_concept_mastery ENABLE ROW LEVEL SECURITY;
-- ví dụ: học sinh chỉ đọc dữ liệu của chính mình
CREATE POLICY scm_self_read ON app.student_concept_mastery
  FOR SELECT USING (student_id = auth.uid());
-- ghi mastery chỉ qua service-role:
CREATE POLICY scm_service_write ON app.student_concept_mastery
  FOR ALL USING (auth.role() = 'service_role');
```

---

### C-5. Replay/Race chống nộp 2 lần là TOCTOU — guard thật nằm ở code không kiểm định được
**File:** `adaptive_routes.py` 1773–1774.
```python
if decision.get("consumed_at") is not None:
    raise HTTPException(409, ...)
```
Đây là **check-then-act không nguyên tử**. Hai request song song cùng `decision_id` cùng đọc `consumed_at = NULL`, **cả hai cùng vượt qua**, cùng gọi `submit_attempt_v2`. Việc có bị cộng Elo 2 lần hay không phụ thuộc 100% vào RPC ẩn có thực hiện `UPDATE ... WHERE consumed_at IS NULL RETURNING` nguyên tử hay không — **không kiểm định được**. Check ở API chỉ tạo cảm giác an toàn giả.

Thêm nữa: kể cả RPC chặn được Elo, `propagate_mastery` và `cache.set` chạy **ngoài** RPC, không idempotent.

**Sửa (đưa "consume" thành thao tác nguyên tử, không phụ thuộc RPC ẩn):**
```sql
-- Atomic claim: chỉ 1 request thắng
UPDATE audit.adaptive_decisions
   SET consumed_at = now()
 WHERE id = :decision_id AND consumed_at IS NULL
RETURNING id;
-- 0 row trả về => đã tiêu thụ => 409, KHÔNG chạy tiếp.
```
Gọi UPDATE-claim này **đầu tiên**; chỉ khi trả về 1 row mới chạy chấm điểm/propagation. Mọi bước sau phải đặt trong cùng 1 transaction thật (xem C-6).

---

### C-6. "Atomicity" giả: ghi nửa chừng không thể rollback (partial update)
**File:** `graph_propagation.py` 330–354 + `adaptive_routes.py` 1839–1853 + `begin/commit/rollback` no-op.
`propagate_mastery` lặp qua nhiều node cha/con, mỗi node gọi `update_student_bkt` + `log_mastery_event` = **các REST call auto-commit độc lập**. Nếu mất kết nối khi đang update node cha thứ 2:
- Node cha thứ 1 **đã ghi vĩnh viễn**.
- `db.rollback()` ở `except` (route 1885) **không làm gì** → **dữ liệu nửa chừng**, mastery_event lệch với mastery thật.

Câu hỏi của đề ("rollback có hoạt động trong try/except lồng nhau?") — **Không. rollback là no-op tuyệt đối.**

**Sửa:** Gộp toàn bộ chấm điểm + Elo + BKT + propagation vào **một RPC PL/pgSQL duy nhất** chạy trong 1 transaction (đúng như doc nghiên cứu mục 2.B đã hứa nhưng code không làm). Python chỉ gọi 1 lần:
```python
result = db.submit_attempt_v3(payload)  # RPC làm TẤT CẢ: claim decision, elo, bkt, propagate
# Không còn propagate_mastery ở Python, không còn nhiều REST call rời rạc.
```
Nếu buộc giữ ở Python: dùng 1 kết nối psycopg với `BEGIN; ... COMMIT;` thật, không dùng PostgREST cho luồng ghi đa bước.

---

### C-7. `propagate_mastery` không kiểm tra HITL ở từng cạnh đúng cách + double-spend qua nhiều decision
**File:** `graph_propagation.py` 303.
Lọc `status="approved"` được truyền vào `get_concept_relations(course_id, status="approved")` — ổn. Nhưng vì C-2 (ai cũng approve được) và C-5 (consume không nguyên tử), kẻ tấn công có thể nhân bản hiệu ứng. Đồng thời `propagate` chạy **sau** khi RPC đã commit Elo nhưng **trước** `db.commit()` no-op → nếu RPC v2 đã cộng Elo mà propagate ghi đè BKT theo cạnh độc hại, không có ranh giới giao dịch chung.

**Sửa:** Đưa propagation vào trong cùng RPC (C-6) để nó chia sẻ snapshot và khóa hàng với bước Elo/BKT chính; chốt danh sách cạnh `approved` đọc trong cùng transaction (tránh đọc cạnh vừa bị sửa giữa chừng).

---

### C-8. `grade_answer` trả 0.0 cho mọi loại câu không phải MCQ → tự động đánh trượt
**File:** `adaptive_routes.py` 1747–1752.
```python
def grade_answer(question, student_answer) -> float:
    if question.get("type") == "mcq":
        ...
    return 0.0   # short_answer, numeric, v.v. => LUÔN 0.0
```
`/recommend` phục vụ **mọi `type`** câu hỏi, nhưng `/submit` chấm `0.0` cho tất cả loại ≠ mcq → `is_correct=False` → tụt Elo & BKT oan cho học sinh trả lời đúng câu tự luận/điền số. Đây là **hỏng dữ liệu năng lực hàng loạt** (mất dữ liệu sư phạm).

**Sửa:** Chấm theo từng type, hoặc chặn recommend chỉ chọn type đã hỗ trợ.
```python
def grade_answer(question, student_answer) -> float:
    qtype = question.get("type")
    key = question.get("answer_key", {})
    if qtype == "mcq":
        return 1.0 if student_answer.get("selected_option") == key.get("correct") else 0.0
    if qtype == "numeric":
        try:
            return 1.0 if abs(float(student_answer.get("value")) - float(key["value"])) <= float(key.get("tol", 0)) else 0.0
        except (TypeError, ValueError):
            return 0.0
    if qtype == "short_answer":
        norm = lambda s: " ".join(str(s).strip().lower().split())
        return 1.0 if norm(student_answer.get("text")) in {norm(a) for a in key.get("accept", [])} else 0.0
    raise HTTPException(422, f"Loại câu hỏi chưa hỗ trợ chấm: {qtype}")
```

---

### C-9. NaN-poisoning làm `select_arm` trả `None` → `UUID(None)` crash 500
**File:** `bandit.py` 502–521 + `adaptive_routes.py` 1697–1704.
Nếu `A_inv` của một arm chứa `NaN` (do RPC chia gần-0, hoặc dữ liệu `bandit_arms` bị tamper — JSON không validate khi load, route 1682–1686), thì mọi so sánh `ucb > best_ucb` đều `False` → `best_arm_id` giữ `None`. Sau đó `UUID(selected_qid_str)` với `selected_qid_str=None` → `UUID("None")` → `ValueError` → 500. Một arm hỏng làm sập toàn concept.

**Sửa:** Lọc NaN/inf, validate ma trận khi nạp, fallback an toàn.
```python
import numpy as np
def compute_ucb_score(self, context, arm_state):
    A_inv = np.array(arm_state["A_inv"], dtype=float)
    b = np.array(arm_state["b"], dtype=float).reshape(-1, 1)
    if not (np.all(np.isfinite(A_inv)) and np.all(np.isfinite(b))):
        raise ValueError("arm_state chứa NaN/inf")
    ...
# trong select_arm:
    try:
        pred, ucb = self.compute_ucb_score(context, arm_state)
    except ValueError:
        arm_state = self.get_default_arm_state(); arms_states[arm_id] = arm_state
        pred, ucb = self.compute_ucb_score(context, arm_state)
    if not np.isfinite(ucb):
        continue
...
if best_arm_id is None:
    best_arm_id = candidate_arm_ids[0]   # fallback xác định, không bao giờ None
```

---

## 2. [MAJOR] — Sai logic sư phạm / Bất đồng bộ / Sai lệch dữ liệu

### M-1. Không validate `request.concept_id` & `course_id` khớp với decision
**File:** `adaptive_routes.py` 1767–1770.
Chỉ kiểm `student_id` và `selected_action_id`. `concept_id`/`course_id` lấy thẳng từ request, **không đối chiếu** với decision. Học sinh dùng 1 `decision_id` hợp lệ (cho câu Q) nhưng truyền `concept_id` khác → Elo/BKT và propagation bị áp lên **sai concept** (ví dụ đẩy điểm sang concept dễ).

**Sửa:**
```python
if str(decision["course_id"])  != str(request.course_id) \
   or str(decision["concept_id"]) != str(request.concept_id):
    raise HTTPException(400, "decision không khớp concept/course.")
```

### M-2. RPC trả `list` → endpoint âm thầm trả dữ liệu CŨ, bỏ propagation
**File:** `adaptive_routes.py` 1817–1838; `supabase_database.py` 2422–2428.
`submit_attempt_v2` trả `response.data`. Với function `RETURNS TABLE`, PostgREST trả **list**. Khi đó `isinstance(txn_result, dict)` = `False` → nhánh `else` → `txn_result["new_student_elo"]` (index list bằng str) → `TypeError` → `except` nuốt lỗi → gán lại `old_elo/old_bkt`. Kết quả: **DB đã cập nhật thật, nhưng API trả "không đổi"**, `new_bkt==old_bkt` nên **propagation bị bỏ qua** → desync nghiêm trọng. Test (M dưới) mock dict nên không bao giờ phát hiện.

**Sửa:** Chuẩn hóa kiểu trả về tại DB layer.
```python
def submit_attempt_v2(self, payload: dict) -> dict:
    if self._stub_mode: return {}
    resp = self.app_client.rpc("submit_attempt_v2", payload).execute()
    data = resp.data
    if isinstance(data, list):
        data = data[0] if data else {}
    return data or {}
```
Và bỏ nhánh "phòng vệ MagicMock" trong route (1816–1838) — đó là code test rò rỉ vào production, che giấu lỗi thật.

### M-3. Ngưỡng `mastery_state` (0.30/0.85) lệch với `weakness_flag` (0.50)
**File:** `bkt.py` 257–262 vs `graph_propagation.py` 327, 377.
`determine_mastery_state`: weak < 0.30. Nhưng `weakness_flag = bkt < 0.50`. Học sinh BKT=0.40 vừa `state="learning"` vừa `weakness_flag=True` — mâu thuẫn nội tại, gây nhiễu báo cáo điểm yếu.

**Sửa:** Thống nhất 1 nguồn ngưỡng.
```python
WEAK_THRESHOLD = 0.30
def is_weak(p): return p < WEAK_THRESHOLD
# dùng is_weak() ở mọi nơi thay cho < 0.50
```

### M-4. `weight` không bị chặn trần → 1 câu sai xóa sạch mastery node cha
**File:** `graph_propagation.py` 322, 372; `concept_relations.sql` 101; `adaptive_schemas.py` 709, 714.
Schema chỉ `ge=0.0`, DB `DEFAULT 1.0` **không CHECK trần**. Với `weight=999`, `GAMMA*delta_abs*weight` rất lớn → cha bị clamp về `0.0001` chỉ sau 1 câu sai (hoặc con vọt `0.9999` khi forward). Cap giữ được biên [0.0001, 0.9999] (xác suất KHÔNG âm/không >1 — phần này OK), nhưng **động lực sư phạm bị phá hủy** và kết hợp C-2 thành vector hack.

**Sửa:** Chặn `weight ∈ [0,1]` ở cả 3 tầng.
```sql
ALTER TABLE app.concept_relations
  ADD CONSTRAINT weight_range CHECK (weight >= 0 AND weight <= 1);
```
```python
weight = min(1.0, max(0.0, float(rel.get("weight", 1.0))))
```

### M-5. Sherman-Morrison "trong SQL" không kiểm định được + nguy cơ chia 0
**File:** `bandit.py` 544–547 (bản Python, DEAD CODE); RPC SQL (không cung cấp).
Trong bản Python, `A_inv` khởi tạo Identity (PD), cập nhật rank-1 cộng `xx^T` giữ PD ⇒ `denominator = 1 + xᵀA⁻¹x ≥ 1 > 0`: **về lý thuyết không chia 0**. NHƯNG: (a) bản này không được gọi; (b) bản SQL thật không thấy để xác nhận giữ PD và có guard mẫu số; (c) nếu `a_inv` trong DB bị tamper thành non-PD thì mẫu số có thể ≤ 0.

**Sửa (bắt buộc cho bản SQL, và thêm guard cho Python nếu kích hoạt lại):**
```python
denominator = 1.0 + float(x.T.dot(A_inv).dot(x)[0][0])
if denominator < 1e-12:
    return arm_state  # bỏ update bất thường, tránh chia 0 / blow-up
```
Yêu cầu cung cấp source RPC để audit phần đại số tuyến tính trong PL/pgSQL (phép `A_inv·x·xᵀ·A_inv` rất dễ sai thứ tự/đối xứng khi viết tay bằng SQL).

### M-6. Bandit có thể KHÔNG BAO GIỜ học (chỉ ghi Identity, không cập nhật)
**File:** `adaptive_routes.py` 1688–1694 (chỉ upsert default Identity); không nơi nào gọi `update_arm`.
Đường Python chỉ ghi arm mặc định, không bao giờ cập nhật `A_inv/b` (vì `update_arm` dead). Nếu RPC ẩn cũng không cập nhật `bandit_arms`, thì `A_inv≡I`, `b≡0` ⇒ `theta=0`, `pred=0`, `ucb=alpha·√(xᵀx)` **bằng nhau cho mọi arm cùng context** ⇒ luôn chọn arm đầu danh sách. ZPD recommendation trở thành **chọn tùy tiện**.

**Sửa:** Xác nhận RPC ghi lại `A_inv/b` sau mỗi submit, hoặc nối lại đường cập nhật ở Python (gọi `update_arm` rồi `upsert_bandit_arm`). Thêm test kiểm tra `A_inv` thay đổi sau N submit.

### M-7. Forward propagation cập nhật sai đối tượng so với thiết kế
**File:** `graph_propagation.py` 371–373 vs `docs/research/...md` mục 2 bước 3.
Doc quy định forward "cập nhật **P(L₀) tiên nghiệm** của node con". Code lại **cộng thẳng vào `bkt_mastery_probability` hiện tại** của con → lẫn lộn prior với posterior, thổi phồng mastery hiện hành mà học sinh chưa hề luyện con đó.

**Sửa:** Forward chỉ điều chỉnh prior `P(L0)` của con (cột riêng), để lần luyện kế tiếp của con khởi tính từ prior mới; không sửa posterior hiện tại.

### M-8. Cache write-through là WRITE-ONLY trong module này + set sau commit (stale)
**File:** `adaptive_routes.py` 1855–1867; `graph_propagation.py` 408–416; `supabase_database.py` `get_student_mastery` (không đọc cache).
`/submit` `cache.set(...)`; propagation `cache.delete(...)`. Nhưng **không endpoint nào trong module đọc cache** (`get_student_mastery`, `/mastery`, `/recommend` đều đọc thẳng DB). Vậy cache chỉ phục vụ consumer ngoài (chat?) mà không có versioning → **last-write-wins stale**. Thêm: `cache.set` chạy **sau** `commit`; nếu crash giữa hai bước, cache giữ giá trị cũ suốt TTL 300s. Khi `used_ai_help` (BKT không đổi) vẫn set cache → vô hại nhưng dư thừa.

Câu hỏi đề ("học sinh có bao giờ thấy stale ở /mastery, /recommend?"): hai endpoint này **không đọc cache** nên không stale từ cache — nhưng đó là vì cache **vô dụng một chiều**, không phải vì thiết kế đúng.

**Sửa:** Hoặc (a) bỏ hẳn write-through nếu không có reader; hoặc (b) cho `get_student_mastery` đọc cache + ghi cache **trong cùng** transaction ghi DB (write-through thật) kèm version/`updated_at` để chống ghi đè cũ:
```python
profile["_v"] = new_updated_at  # reader bỏ qua nếu _v cũ hơn DB
```

---

## 3. [MINOR / SUGGESTION]

- **S-1.** `bkt.py` 241: nội suy partial-credit không bao giờ chạy vì `grade_answer` chỉ trả 0/1. Sau khi sửa C-8, đường này mới có ý nghĩa.
- **S-2.** `bandit.py` 580: `calculate_bandit_reward` có thể âm khi `expected_success` ngoài [0.25,1.25]. Có thể chủ ý (phạt lệch ZPD) nhưng nên kẹp `max(-1.0, ...)` để ổn định cập nhật.
- **S-3.** `adaptive_routes.py` 1840 & `graph_propagation.py` 325/375: so sánh `!=` trên float sau `round(4)` — nếu RPC trả `Decimal`, `Decimal(0.28) != float(0.28)` có thể True giả → propagation chạy thừa. Ép `float()` trước so sánh.
- **S-4.** `concept_relations.sql`: cho phép đồng thời cạnh A→B và B→A (chỉ UNIQUE theo (source,target,type)). Depth-1 chặn đệ quy trong 1 lần, nhưng nhiều submit có thể ping-pong A↔B. Cân nhắc CHECK chống chu trình 2-đỉnh cho `Prerequisite_of`.
- **S-5.** `create_concept_relation`/`update`: `relation_type`, `status` là `str` thuần, không validate enum ở Pydantic → giá trị rác chỉ bị DB enum chặn bằng 500 khó hiểu. Dùng `Literal[...]`/`Enum`.
- **S-6.** `get_adaptive_db()` tạo client Supabase mới mỗi request (1646) → không tái sử dụng connection. Cân nhắc singleton/pool.
- **S-7.** `model_snapshot` lưu lúc recommend (1721) không được dùng ở submit → dữ liệu chết, tăng dung lượng `adaptive_decisions`.

---

## 4. [TEST SUITE] — Đánh giá "pass ảo"

`test_adaptive.py` có độ phủ **giả tạo cao**; nhiều test xanh nhưng không chứng minh hành vi thật:

1. **Replay test chỉ kiểm 1 request (1006–1041).** Không hề test **2 request song song** — tức không test đúng cái race/TOCTOU mà nó tuyên bố bảo vệ (C-5). Pass ảo.
2. **AI-help test (1119–1194)** assert `payload["p_used_ai_help"] is True` và `new_elo==1200` — nhưng `1200` là do **mock dựng sẵn**, không phải do logic đóng băng. Test **không chứng minh** Elo thực sự bị freeze (logic đó nằm trong RPC không test). Pass ảo.
3. **submit dict-mock che lỗi M-2.** Mock trả `dict` nên không bao giờ chạm nhánh `list`/TypeError xảy ra ở production.
4. **`begin/commit/rollback` là MagicMock** → `assert commit.called_once()` chỉ chứng minh "đã gọi hàm no-op", vô nghĩa về tính nguyên tử.
5. **Không có test:** UUID không hợp lệ (422), DB connection drop giữa propagation (partial update C-6), chia-0/NaN bandit (C-9, M-5), `weight` cực lớn (M-4), concept_id mismatch (M-1), RLS/phân quyền (C-1,C-2), bandit có học hay không (M-6), non-mcq grading (C-8).
6. **`test_graph_propagation_*` mock `get_student_mastery` trả CÙNG một dict cho mọi concept** → không thể phát hiện cập nhật nhầm node.
7. **`client` fixture** không có trong file (giả định ở `conftest.py`) — không kiểm chứng được app wiring thật.

**Đề xuất bổ sung test bắt buộc:**
```python
def test_submit_v2_returns_list_is_handled(mock_db, client):
    mock_db.submit_attempt_v2.return_value = [{"new_student_elo":1216.0,"new_question_elo":1184.0,
        "new_bkt":0.28,"new_state":"learning","weakness_flag":True,"is_correct":True}]
    # assert new_elo==1216.0 (không được rơi về old_elo)

@pytest.mark.asyncio
async def test_concurrent_double_submit_credits_once(mock_db, client):
    # gửi 2 request song song cùng decision_id, assert đúng 1 lần 200, 1 lần 409

def test_non_mcq_not_autograded_zero():
    q = {"type":"short_answer","answer_key":{"accept":["paris"]}}
    assert grade_answer(q, {"text":"Paris"}) == 1.0

def test_bandit_denominator_guard():
    # nạp A_inv non-PD -> không chia 0, không NaN lan ra select_arm

def test_propagation_partial_failure_rolls_back():
    # update node cha #2 raise -> assert node #1 KHÔNG bị ghi vĩnh viễn
```

---

## 5. BẢNG ƯU TIÊN XỬ LÝ

| # | Mức | Lỗi | Tác động | Ưu tiên |
|---|-----|-----|----------|---------|
| C-1 | CRITICAL | Không auth, student_id từ body | Hack điểm bất kỳ học sinh | P0 |
| C-2 | CRITICAL | HITL approve không phân quyền | Hack BKT toàn đồ thị | P0 |
| C-3 | CRITICAL | Cờ AI/hint client tự khai | Bỏ qua chống gian lận | P0 |
| C-4 | CRITICAL | Anon key + không RLS | Bypass toàn bộ API | P0 |
| C-5 | CRITICAL | Replay TOCTOU | Cộng Elo nhiều lần | P0 |
| C-6 | CRITICAL | Atomicity/rollback giả | Partial update, hỏng dữ liệu | P0 |
| C-7 | CRITICAL | Propagation ngoài transaction | Ghi đè BKT độc hại | P0 |
| C-8 | CRITICAL | grade_answer trả 0 cho non-mcq | Đánh trượt oan hàng loạt | P0 |
| C-9 | CRITICAL | NaN→UUID(None) crash | Sập concept | P1 |
| M-1..M-8 | MAJOR | (xem chi tiết) | Sai logic/desync | P1 |

**Khuyến nghị chặn release** cho tới khi: (1) cung cấp & audit RPC `submit_attempt_v2` (SELECT FOR UPDATE + Sherman-Morrison SQL), (2) thay no-op transaction bằng giao dịch thật, (3) thêm auth/RBAC + RLS, (4) chuyển nguồn `used_ai_help/hint_count` về server.
