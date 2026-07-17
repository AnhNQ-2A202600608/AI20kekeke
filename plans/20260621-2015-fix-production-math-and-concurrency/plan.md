# plan.md - Fix Production Math, Security, and Concurrency Bottlenecks

Kế hoạch này tập trung vào việc khắc phục toàn diện các phát hiện trong báo cáo đánh giá kỹ thuật và EDM (Educational Data Mining):
1. **Lỗ hổng bảo mật**: Quyền thực thi RPC trực tiếp từ client, bỏ qua kiểm tra server-side.
2. **Lỗi logic & toán học**: Bug `was_ai_used` do thiếu trường select, lỗi cast kiểu idempotency UUID/JSONB, sự tăng trưởng stability_days không giới hạn trần, và sự sai khác thuật toán (lan truyền đồ thị, BKT) giữa Python (Eval) và SQL (Production).
3. **Hiệu năng & Đồng thời (Concurrency)**: Điểm nghẽn khóa dòng (`FOR UPDATE`) trên bảng `questions` và `bandit_arms` gây cạn kiệt connection pool khi có nhiều submit đồng thời.

---

## Plan Context
- **Plan dir**: `plans/20260621-2015-fix-production-math-and-concurrency/`
- **Blocked By**: `20260621-1217-elo-system-calibration-plan` (Plan này sẽ sửa đổi trực tiếp các đề xuất trong Elo Calibration Plan để tránh gây lỗi concurrency).
- **Blocks**: None

---

## Status: Pending Review (0%)

---

## Phases Breakdown

*   **[NEW] [Phase 1: Sửa lỗi bảo mật, logic nóng và toán học](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-2015-fix-production-math-and-concurrency/phase-01-security-and-correctness.md)**
    *   *Mô tả:* Thu hồi quyền RPC từ `authenticated`, sửa bug `was_ai_used` (select `created_at`), sửa bug ép kiểu UUID của idempotency, đặt giới hạn trần cho `stability_days`, và giới hạn cận dưới/cận trên cho `response_time`.
*   **[NEW] [Phase 2: Đồng nhất hóa thuật toán Python & SQL và Equivalence Testing](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-2015-fix-production-math-and-concurrency/phase-02-sync-python-sql.md)**
    *   *Mô tả:* Đồng bộ hóa thuật toán lan truyền đồ thị và logic BKT giữa Python (môi trường Eval) và SQL (môi trường Production). Xây dựng bài test kiểm thử CI xác nhận kết quả đầu ra của Python và SQL là đồng nhất 100% trên cùng một vector đầu vào.
*   **[NEW] [Phase 3: Giải phóng khóa hàng và Chuyển đổi cập nhật bất đồng bộ (Async Outbox)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-2015-fix-production-math-and-concurrency/phase-03-concurrency-and-async.md)**
    *   *Mô tả:* Tách rời giao dịch đồng bộ. Loại bỏ khóa `FOR UPDATE` trên bảng `questions` và `bandit_arms`. Chuyển Elo question calibration, LinUCB matrix learning và graph propagation ra khỏi transaction nộp bài đồng bộ. Sử dụng bảng Outbox và background worker để xử lý batch bất đồng bộ.
*   **[NEW] [Phase 4: Nâng cấp học thuật cho Eval Suite (Publishability Program)](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-2015-fix-production-math-and-concurrency/phase-04-eval-suite-scientific-upgrade.md)**
    *   *Mô tả:* Tái cấu trúc bộ thử nghiệm để đo lường BKT bằng Next-step Predictive AUC, tính toán Regret thực tế so với Oracle, chạy Multi-seed với khoảng tin cậy 95% CI và khớp đường cong quên từ log thực tế.

---

## Verification Plan

### Automated Tests
- Run `uv run pytest` để xác nhận toàn bộ test suite hiện tại vượt qua.
- Thêm bài test equivalence test so sánh trực tiếp output Python và RPC SQL.
- Chạy stress test mô phỏng 1000 submits đồng thời trên cùng một question sử dụng kịch bản Locust hoặc Playwright/k6 để đo lường giải phóng lock DB.

### Manual Verification
- Kiểm tra quyền gọi RPC từ phía client không có đặc quyền để đảm bảo bị chặn (Permission Denied).
