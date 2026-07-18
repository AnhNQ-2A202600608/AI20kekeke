# Algorithm Changelog (Adaptive Learning Core)

Tài liệu này ghi lại toàn bộ các thay đổi, sửa lỗi và nâng cấp liên quan đến **Lõi Thuật toán Thích ứng (Adaptive Learning Core)** và **Bộ công cụ đánh giá thuật toán (Evaluation Suite)** của hệ thống **Mentora**.

---

## [2026-06-21] - Concurrency, Security & Production Math Updates

### 1. Khắc phục lỗ hổng bảo mật & Logic sản phẩm
*   **Bảo mật quyền RPC:** Thu hồi quyền thực thi trực tiếp trên hàm `submit_attempt_v3` của vai trò `authenticated` để chặn bypass server-side logic từ client.
*   **Idempotency & Clamping:** Khắc phục lỗi ép kiểu UUID của `attempt_id` trong luồng chống trùng lặp, áp dụng trần `stability_days` tối đa 36,500 ngày và giới hạn chặn trên/dưới cho `response_time_ms`.
*   **Fix bug select:** Bổ sung trường `created_at` trong hàm `get_adaptive_decision` để tránh lỗi trả về `was_ai_used` không chính xác.

### 2. Giải phóng khóa Concurrency (Async Outbox)
*   **Loại bỏ khóa FOR UPDATE:** Loại bỏ hoàn toàn khóa dòng bi quan trên bảng `questions` và `bandit_arms` tại RPC giao dịch nộp bài đồng bộ.
*   **Mô hình Async Outbox:** Chuyển đổi Elo calibration, LinUCB matrix update và graph propagation sang xử lý bất đồng bộ thông qua hàng đợi `app.calibration_outbox`.
*   **Background Worker:** Phát triển service Python `calibration_worker.py` thực hiện cập nhật ma trận hiệp biến nghịch đảo LinUCB $A^{-1}$ thông qua công thức toán học Sherman-Morrison (kèm symmetrization chống trôi số thập phân và re-inversion định kỳ mỗi 100 lượt).

### 3. Nâng cấp học thuật cho Thử nghiệm (Evaluation Suite)
*   **BKT Next-step AUC:** Nâng cấp đo lường dự báo từ MSE sang Next-step Predictive AUC đạt kết quả xuất sắc **0.8386**.
*   **Bandit Multi-seed Regret:** Đo lường Cumulative Regret thực sự so với Oracle lý tưởng trên **30 seeds ngẫu nhiên** độc lập, vẽ bóng mờ khoảng tin cậy 95% CI (LinUCB Mean Final Regret: **13.19** vs. Random: **39.76** vs. Greedy: **36.21**). Thực hiện kiểm định t-test độc lập chứng minh ý nghĩa thống kê vượt trội ($p$-value = **0.0000e+00**).
*   **Khớp đường cong quên (Forgetting Curve Fitting):** Áp dụng Curve Fitting tìm tham số độ ổn định trí nhớ thực nghiệm tối ưu $S^* = 0.70$ ngày và ECE = **0.2622**.

### 4. Bayesian Knowledge Tracing (BKT - Cũ)
*   **Sửa lỗi ghép cặp tham số (De-conflation):** Tách biệt hoàn toàn luồng giả lập phản hồi của BKT khỏi điểm Elo của sinh viên trong `exp2_bkt_validation.py` (sử dụng chế độ `bkt_only`), giúp xác suất làm chủ của học sinh đã master hội tụ chính xác về mức mục tiêu $>0.9990$ ($0.9991$).
*   **Thêm chỉ số ROC AUC:** Triển khai phép đo kiểm định Rank-Sum Wilcoxon-Mann-Whitney ROC AUC để đánh giá chính xác khả năng dự đoán trạng thái ẩn (mastered vs. unmastered) dựa trên chuỗi quan sát, đạt độ chính xác $0.9941$ ($>0.95$).

### 2. Contextual Multi-Armed Bandits (LinUCB)
*   **Đảm bảo tính công bằng nhân quả (Causal Fairness):** Áp dụng kỹ thuật Số ngẫu nhiên chung (Common Random Numbers - CRN) để đồng bộ hóa hoàn toàn chuỗi tung đồng xu phản hồi và dịch chuyển trạng thái ẩn giữa 3 thuật toán so sánh (LinUCB, Greedy, Random).
*   **Hiệu chuẩn ZPD Hit Rate:** Thay thế việc dùng BKT bằng Elo thực tế để tính toán tỷ lệ câu hỏi trúng vùng phát triển gần nhất (ZPD target $= 0.75$), giải quyết triệt để vấn đề khóa cứng (lockout) khi học sinh chưa master các khái niệm tiên quyết.
*   **Greedy Tie-breaker:** Thêm lựa chọn ngẫu nhiên khi có đồng điểm thưởng (tie-breaker) ở baseline Greedy để tránh thiên vị tuần tự.

### 3. Concept Graph Mastery Propagation
*   **Kiểm chứng suy giảm hình học:** Thêm các ràng buộc kiểm tra chính xác giá trị suy giảm hình học (decay weights) của các quan hệ đệ quy (ví dụ: lan truyền xuôi $\beta = 0.425$, lan truyền ngược $\gamma = 0.3312$).
*   **Đồng bộ hóa bộ nhớ đệm (Cache Invalidation):** Thiết lập mock kiểm thử cho `get_cache_store` để kiểm chứng cơ chế tự động xóa cache (write-through cache invalidation) đối với các concept bị ảnh hưởng trong luồng lan truyền.

### 4. Spaced Repetition (FSRS Lazy Decay)
*   **Thêm thực nghiệm FSRS:** Phát triển kịch bản thực nghiệm thứ 5 `exp5_forgetting_decay.py` để chạy mô phỏng dài hạn (longitudinal) theo ngày, kiểm chứng tính chính xác của công thức suy giảm động (lazy decay) và cập nhật độ ổn định trí nhớ (stability) dựa trên Ease Factor.

### 5. Khắc phục lỗi bất định và tràn số (Math Stability & Determinism)
*   **Seeding RNG:** Cách ly hoàn toàn việc sinh số ngẫu nhiên khỏi module `random` toàn cục của Python, chuyển sang dùng độc lập các đối tượng `random.Random(seed)` được gieo hạt tĩnh để đảm bảo kết quả kiểm thử luôn deterministic 100%.
*   **Tránh ValueError Log(0):** Thêm giới hạn cận dưới `1e-12` trong thuật toán Box-Muller biến đổi phân phối chuẩn để tránh lỗi tính toán `log(0.0)`.

### 6. Tài liệu học thuật & Cơ sở khoa học
*   **Tạo trang trích dẫn học thuật:** Tạo mới file `frontend/content/docs/academic-citations.mdx` chứa nguồn trích dẫn đầy đủ (định dạng APA, BibTeX và mã DOI hoạt động) cho các nghiên cứu nền tảng:
    *   *BKT:* Corbett & Anderson (1994)
    *   *Elo:* Pelánek (2016)
    *   *LinUCB:* Li et al. (2010), Clement et al. (2015)
    *   *Graph:* Hwang (2003)
    *   *FSRS:* Ye (2022), Woźniak (1994)
    *   *Graphusion:* Rui Yang et al. (2025)
    *   *WizardLM:* Can Xu et al. (2023)
*   **Tích hợp định hướng nâng cấp:** Cập nhật liên kết liên hoàn từ các trang thuật toán cụ thể về trang trích dẫn khoa học và phác thảo lộ trình nâng cấp dynamic Elo (K-factor động, Time-gap decay, Speed-weighted Elo) dựa trên nghiên cứu của Pelánek.
