# Kế hoạch nâng cấp hiệu chuẩn hệ thống Elo (Elo System Calibration Plan)

Tài liệu này phác thảo kế hoạch nâng cấp thuật toán **Educational Elo** của hệ thống **EduGap** dựa trên nghiên cứu **Radek Pelánek (2016)** nhằm tối ưu hóa tính chính xác, tốc độ hội tụ và khả năng thích ứng của công cụ đánh giá năng lực.

## Các tính năng đề xuất (Core Features)

1.  **Dynamic K-question Calibration:** Tự động điều chỉnh hệ số biến động $K_{\text{question}}$ của câu hỏi dựa trên số lượt làm bài thực tế để tăng tính ổn định của chỉ số độ khó.
2.  **Time-Gap Uncertainty Adjustment:** Tăng tạm thời hệ số biến động $K_{\text{student}}$ của học viên khi họ quay lại học sau một thời gian dài (giảm thiểu độ trễ ước lượng năng lực khi có sự quên).
3.  **Response-Time Weighted Elo:** Điều chỉnh điểm số thực tế $S$ đầu vào dựa trên thời gian làm bài của học viên nhằm phân biệt mức độ thành thục (truy xuất nhanh vs. làm bài chậm).

---

## Danh sách các Phase (Phases breakdown)

*   **Phase 1: Thiết kế cơ sở dữ liệu và Cập nhật RPC `submit_attempt_v3`**
    *   *Mô tả:* Thêm cột đếm lượt làm bài cho câu hỏi và tích hợp logic tính $K$ động vào PostgreSQL function.
    *   *Link:* [Phase 1: Database & RPC Update](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-1217-elo-system-calibration-plan/phase-01-database-and-rpc-updates.md)
*   **Phase 2: Backend Integration & Response-Time Metrics**
    *   *Mô tả:* Gửi telemetry `response_time` từ client qua backend và tích hợp hàm điều chỉnh điểm số dựa trên thời gian làm bài trung bình.
    *   *Link:* [Phase 2: Backend & Logic](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260621-1217-elo-system-calibration-plan/phase-02-backend-integration.md)
*   **Phase 3: Kiểm thử tự động & Đánh giá (Evaluation Suite)**
    *   *Mô tả:* Viết các kịch bản kiểm thử mô phỏng trong `eval/` để đánh giá tốc độ hội tụ của thuật toán nâng cấp so với Elo tiêu chuẩn.

---

## Trạng thái hiện tại (Status)
*   **Trạng thái:** Chờ duyệt (Pending Review)
*   **Tiến độ:** 0%
