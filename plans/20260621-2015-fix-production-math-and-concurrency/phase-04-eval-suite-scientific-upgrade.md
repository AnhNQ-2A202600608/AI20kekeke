# Phase 4: Eval Suite Scientific Upgrade (Publishability Program)

Phase này tập trung vào việc nâng cấp bộ thử nghiệm (`eval/` suite) đạt chuẩn khoa học nghiêm ngặt để có thể công bố học thuật, đáp ứng các tiêu chuẩn của EDM (Educational Data Mining) và ITS (Intelligent Tutoring Systems).

---

## 1. Yêu cầu chi tiết

### A. Đo lường BKT bằng Next-step Predictive AUC
- **Vấn đề**: Hiện tại `exp2_bkt_validation.py` tính AUC so với trạng thái master thực tế ẩn (`y_true`). Trạng thái này không thể quan sát trên dữ liệu thực, làm thí nghiệm mang tính vòng lặp (circular).
- **Giải pháp**:
  - Chuyển đổi công thức tính AUC. Nhãn đúng (`y_true`) sẽ là **câu trả lời thực tế của học sinh tại bước tiếp theo $t+1$** (Đúng = 1, Sai = 0).
  - Giá trị dự đoán (`y_pred`) sẽ là xác suất trả lời đúng được ước lượng bởi mô hình BKT tại bước $t$: $P(Correct_{t+1}) = P(L_t) \times (1 - S) + (1 - P(L_t)) \times G$.
  - Tính AUC dựa trên cặp `(y_true, y_pred)` này.
  - Báo cáo AUC trên tập học sinh tách biệt (held-out students) để tăng độ tin cậy.

### B. Tính toán Regret thực tế cho Bandit LinUCB
- **Vấn đề**: `exp3_bandit_comparison.py` đang vẽ Cumulative Reward nhưng lại ghi tên đồ thị là "Regret". Regret chuẩn khoa học yêu cầu so sánh với một Oracle (mô hình lý tưởng).
- **Giải pháp**:
  - Xây dựng một **Oracle Selector**: Tại mỗi bước thử nghiệm, Oracle biết trước năng lực Elo thực tế của học sinh đối với câu hỏi và sẽ chọn câu hỏi có xác suất thành công thực tế sát mức mục tiêu $0.75$ nhất.
  - Tính toán Regret của LinUCB tại bước $t$: $Regret_t = P(success)_{Oracle} - P(success)_{LinUCB}$.
  - Cộng dồn và vẽ biểu đồ **Cumulative Regret** (đồ thị này phải đi ngang/hội tụ khi LinUCB học được chính sách tối ưu).

### C. Đánh giá Đa seed (Multi-seed) và Khoảng tin cậy (Confidence Intervals)
- **Vấn đề**: Thí nghiệm hiện tại chạy trên 1 seed duy nhất nên kết quả dễ bị ảnh hưởng bởi nhiễu ngẫu nhiên và thiếu ý nghĩa thống kê.
- **Giải pháp**:
  - Tái cấu trúc cấu trúc chạy thí nghiệm trong `eval/` để chạy qua ít nhất **30 seeds ngẫu nhiên khác nhau**.
  - Tính toán Giá trị trung bình (Mean) và Khoảng tin cậy 95% (95% Confidence Interval) hoặc Sai số chuẩn (Standard Error) tại mỗi bước.
  - Sử dụng thư viện `matplotlib` vẽ biểu đồ có dải bóng mờ biểu thị khoảng tin cậy (Confidence Interval bands) xung quanh đường trung bình.
  - Thực hiện kiểm định giả thuyết thống kê (ví dụ: t-test) để khẳng định sự vượt trội của LinUCB so với Random có ý nghĩa thống kê ($p < 0.05$).

### D. Curve Fitting cho Forgetting Curve (Thuật toán Quên)
- **Vấn đề**: Thí nghiệm forgetting hiện tại chỉ là vẽ đồ thị từ công thức toán lý thuyết.
- **Giải pháp**:
  - Viết module nạp dữ liệu log ôn tập thực tế từ bảng `quiz_attempts`.
  - Khớp (fit) dữ liệu thực tế (khoảng thời gian giãn cách $\Delta t$ và kết quả đúng/sai) với đường cong phân rã để tìm ra các tham số độ ổn định ($S$) tối ưu.
  - Báo cáo sai số hiệu chuẩn (Calibration Error) để chứng minh tính thực tiễn của mô hình.

---

## 2. Các file thay đổi

*   **[MODIFY] [exp2_bkt_validation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp2_bkt_validation.py)**: Chuyển sang Next-step Predictive AUC.
*   **[MODIFY] [exp3_bandit_comparison.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp3_bandit_comparison.py)**: Tích hợp Oracle, tính toán Cumulative Regret thực sự, chạy 30 seeds và vẽ khoảng tin cậy 95% CI.
*   **[NEW] [exp5_forgetting_calibration.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp5_forgetting_calibration.py)**: Thuật toán khớp đường cong quên trên log thực tế.

---

## 3. Tiêu chí hoàn thành (Success Criteria)

- [ ] Biểu đồ của exp3 hiển thị Cumulative Regret hội tụ (dạng logarithmic/sublinear) thay vì đường thẳng đi lên tuyến tính.
- [ ] Các đồ thị so sánh thuật toán hiển thị dải sai số/khoảng tin cậy 95% CI rõ ràng.
- [ ] BKT đạt AUC thực tế trên dữ liệu kiểm thử (Next-step AUC) vượt trội hơn so với baseline đoán bừa.
- [ ] Kết quả kiểm định thống kê $p$-value được in ra trong log output của thí nghiệm.
