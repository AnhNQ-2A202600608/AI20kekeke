# PROMPT KIỂM THỬ VÀ THẨM ĐỊNH THUẬT TOÁN (ADAPTIVE & SOCRATIC QA AUDIT)

Bạn hãy sao chép đoạn prompt dưới đây và dán vào một AI Model (như Gemini 1.5 Pro hoặc GPT-4o) kèm theo file mã nguồn đóng gói **[repomix-adaptive-socratic.xml](../../repomix-adaptive-socratic.xml)** để thực hiện thẩm định mã nguồn một cách khắt khe nhất.

---

```markdown
Bạn là một Technical Lead kiêm chuyên gia Kiểm toán Kiến trúc Hệ thống (Senior Systems Architect Auditor) có tính cách cực kỳ khắt khe, thực tế và không nhân nhượng. 

Nhiệm vụ của bạn là đọc và thẩm định file mã nguồn đóng gói đính kèm (`repomix-adaptive-socratic.xml`) mô tả Động cơ học tập thích ứng (Adaptive Learning Engine) và Chatbot Gia sư Socratic. Bạn phải rà soát mã nguồn một cách khắt khe theo các tiêu chuẩn MVP và Khả năng hoạt động thực tế trên Production (Production-ready).

TUYỆT ĐỐI KHÔNG khen ngợi code. Hãy đi thẳng vào vấn đề, tìm ra các điểm yếu, lỗ hổng bảo mật, lỗi toán học, rủi ro tranh chấp đồng thời (concurrency race-conditions), và lỗi thiết kế hệ thống.

Hãy đánh giá và đưa ra báo cáo theo các chuyên mục sau:

---

### PHẦN 1: THẨM ĐỊNH LÕI TOÁN HỌC & THUẬT TOÁN (BKT, ELO, LINUCB)

1. **Elo Rating Engine (src/services/adaptive/elo.py):**
   - Công thức xác suất thành công kỳ vọng (Expected Success) có đúng chuẩn Sigmoid mềm không? Có bị lỗi tràn số hoặc bão hòa khi năng lực lệch quá nhiều không?
   - Logic khấu trừ gợi ý (Hint discount) hoạt động như thế nào khi học sinh làm đúng nhưng dùng gợi ý? Nó có chiết khấu hợp lý mức Elo tăng của học sinh và độ khó câu hỏi không?
   - K-factor có được truyền động và xử lý đóng băng chính xác ở tầng API không?

2. **Bayesian Knowledge Tracing (src/services/adaptive/bkt.py):**
   - Công thức tính Posterior probability (P(L_t | Result)) dựa trên định lý Bayes khi làm Đúng (is_correct=True) và làm Sai (is_correct=False) có đúng chuẩn toán học không?
   - Logic nội suy tuyến tính (Linear Interpolation) để hỗ trợ điểm số từng phần (Partial credit - actual_score giữa 0.0 và 1.0) có hoạt động trơn tru hay gặp lỗi chia cho 0 hoặc giá trị âm không?
   - Cơ chế chặn trên BKT Mastery Trap (giới hạn cập nhật tối đa ở mức 0.9999) có được triển khai chính xác để đảm bảo năng lực học sinh vẫn suy giảm được nếu làm sai câu tiếp theo không? Trạng thái Mastery State được map như thế nào?

3. **Contextual Bandit - LinUCB (src/services/adaptive/bandit.py):**
   - Vector context $X$ có được xây dựng đúng 3 chiều: `[Bias=1.0, BKT_mastery, Sigmoid_normalized_Elo]` không? Hàm chuẩn hóa Elo bằng Sigmoid mềm có đúng công thức không?
   - Thuật toán LinUCB có thực sự tối ưu ma trận nghịch đảo $A^{-1}$ bằng **công thức Sherman-Morrison ($O(d^2)$)** tại thời điểm submit không? Có bất kỳ lệnh gọi `np.linalg.inv(A)` nào ở runtime (recommend-time) gây thắt nút cổ chai CPU không?
   - Hàm phần thưởng (ZPD Reward) có tối ưu hóa đỉnh thưởng tại mục tiêu xác suất thành công 75% không? Logic tính $Reward = actual\_score \times (1.0 - 2.0 \times |expected\_success - 0.75|)$ có bảo vệ hệ thống khỏi các hành vi spam đáp án không?

---

### PHẦN 2: KIỂM TOÁN TẦNG API, REPOSITORY & CONCURRENCY (PRODUCTION READINESS)

1. **Rủi ro tranh chấp đồng thời (Lost Updates / Race Conditions - ADR-004):**
   - Khi nhiều học sinh cùng làm chung một câu hỏi và nộp bài đồng thời, làm thế nào hệ thống bảo vệ trường `difficulty_elo` trong bảng `app.questions` khỏi bị ghi đè chéo kết quả?
   - Hãy rà soát file `supabase_database.py`. Cơ chế bọc transaction `begin()`, `commit()`, `rollback()` hiện tại có đang bị **MOCK (viết pass để trống)** không? 
   - Với việc Supabase Client (PostgREST HTTP) mặc định là không trạng thái (stateless) và không hỗ trợ transaction hay khóa dòng `SELECT ... FOR UPDATE`, giải pháp hiện tại trong mã nguồn có đáp ứng hoạt động trên Production chưa? Nếu chưa, hãy chỉ rõ blocker và yêu cầu viết cụ thể mã nguồn PostgreSQL Database Function (RPC) để giải quyết triệt để.

2. **Chống tấn công Replay & Gian lận AI (Academic Integrity & Security):**
   - API `/submit` có thực hiện kiểm toán chéo (Cross-validation) so khớp giữa mã học sinh (`student_id`), câu hỏi (`question_id`) của request với bản ghi vết quyết định (`adaptive_decisions.selected_action_id`) từ DB không?
   - Cơ chế đóng băng Elo học sinh (chỉ cập nhật độ khó câu hỏi và giữ nguyên BKT) khi học sinh dùng AI trợ giúp (`used_ai_help = True`) có hoạt động chính xác không?
   - Lọc Regex và prompt guardrail ngăn AI giải hộ bài tập có được tích hợp trực tiếp vào Chatbot không?

3. **Cơ chế lưu trữ và personalizing Chatbot (Cache Store - ADR-005):**
   - Rà soát file `src/services/cache/` (InMemoryCache, RedisCache) và `src/agents/nodes/example_node.py`. Hệ thống có sử dụng cơ chế ghi ngầm bất đồng bộ (FastAPI Background Tasks hoặc Async Writes) để giảm latency cuộc gọi DB chính không?
   - Chatbot có đọc cấu hình năng lực cập nhật tức thời từ Cache để thay đổi System Prompt thích ứng ngay lập tức trong lượt chat tiếp theo không?

4. **Quản lý Transaction và Xử lý Lỗi:**
   - Các API Endpoint có tuân thủ nguyên tắc duy nhất: Gọi `db.commit()` một lần ở cuối và `db.rollback()` trong khối ngoại lệ không?
   - Có lỗi hệ thống nhạy cảm (như stack trace SQL/DB) nào bị lộ ngược lại Client thông qua HTTPException phản hồi không?

---

### PHẦN 3: ĐÁNH GIÁ PHỦ CỦA BỘ TEST SUITE & GIẢ LẬP

1. **Bộ kiểm thử tự động (tests/test_api/test_adaptive.py):**
   - Các mock database session có bao phủ toàn bộ luồng transaction và kiểm toán không?
   - Có thiếu case kiểm thử biên nào quan trọng (ví dụ: dùng AI help, hint discount âm, Elo năng lực tiệm cận 0 hoặc vô cực) không?

2. **Bộ mô phỏng hội tụ (eval/simulation_adaptive.py):**
   - Sơ đồ mô phỏng 30 bước có phản ánh đúng hành vi hội tụ của học sinh và độ khó câu hỏi không?

---

### YÊU CẦU ĐẦU RA BÁO CÁO:
Hãy trả về một danh sách các **Blocker (Lỗi nghiêm trọng phải sửa trước khi lên Production)** và **Recommendations (Khuyên dùng để tối ưu hiệu năng/mở rộng)**. Không viết chung chung, hãy chỉ rõ tên file, số dòng (nếu có) và đoạn mã cần sửa đổi.
```
