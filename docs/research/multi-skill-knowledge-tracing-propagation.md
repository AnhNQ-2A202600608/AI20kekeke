# Nghiên cứu: Multi-Skill Knowledge Tracing & Graph Propagation

> [!IMPORTANT]
> **Trạng thái tài liệu:** 🔖 **ĐỌC LẠI** (Tài liệu nghiên cứu lưu trữ để đọc tiếp lúc rảnh)

Tài liệu này nghiên cứu các mô hình giải quyết bài toán định vị lỗi sai (Credit/Blame Assignment) khi một câu hỏi chứa nhiều kỹ năng (Multi-Skill) và thuật toán lan truyền trên đồ thị không gây trễ (Non-laggy Graph Propagation) cho dự án **C2-App-125**.

---

## 1. Bài toán Định vị Lỗi sai (Credit & Blame Assignment)

Khi một câu hỏi kiểm tra đồng thời một tập hợp gồm nhiều kỹ năng $S_Q = \{s_1, s_2, ..., s_k\}$, hệ thống chỉ nhận được kết quả Đúng/Sai tổng quát từ học sinh. Làm thế nào để cập nhật độ thông thạo của từng kỹ năng riêng lẻ?

### A. Mô hình Liên kết Đồng hành (Conjunctive Skill Models / DINA)
Mô hình **DINA (Deterministic Input, Noisy And gate)** giả định rằng học sinh bắt buộc phải làm chủ **tất cả** các kỹ năng thành phần thì mới có thể trả lời đúng câu hỏi.
*   **Nếu câu hỏi ĐÚNG:** Ghi nhận điểm cộng cho tất cả các kỹ năng $s_i \in S_Q$.
*   **Nếu câu hỏi SAI:** Chỉ cần ít nhất một kỹ năng bị hổng là câu hỏi sẽ sai. Do đó, ta cần tìm ra kỹ năng yếu nhất để "gán trách nhiệm" (Blame).

### B. Thuật toán Phân bổ Trách nhiệm Heuristic (Heuristic Blame Assignment)
Để cập nhật độ thông thạo $M(s_i)$ của từng kỹ năng khi học sinh làm sai, ta tính toán phân bổ hình phạt tỷ lệ nghịch với độ thông thạo hiện tại của học sinh:
$$M(s_i)_{\text{new}} = M(s_i)_{\text{old}} \cdot \left( 1 - \eta \cdot (1 - \text{Score}) \cdot \frac{1 - M(s_i)_{\text{old}}}{\sum_{k \in S_Q} (1 - M(s_k)_{\text{old}})} \right)$$

*   **Ý nghĩa:** Kỹ năng nào học sinh đang yếu nhất (có $M(s_i)$ thấp nhất) sẽ chịu phần phạt nặng nhất, vì đó là điểm nghẽn cao nhất khiến học sinh làm sai. Kỹ năng học sinh đã nắm rất vững sẽ bị phạt cực kỳ nhẹ (tránh việc làm sai câu khó ảnh hưởng oan đến các kỹ năng đã master).

---

## 2. Thuật toán Lan truyền Đồ thị 1-Bước (Local 1-Step Propagation)

Để cập nhật độ thông thạo trên đồ thị 25 nodes (5 ngày học) mà không gây lag (yêu cầu thời gian xử lý $< 10\text{ms}$), ta loại bỏ các mô hình mạng neural đồ thị (GNN) chạy real-time và thay thế bằng **Message Passing cục bộ giới hạn độ sâu (Depth = 1)**.

### Quy trình cập nhật:
1.  **Bước 1:** Cập nhật độ thông thạo của các kỹ năng trực tiếp $s_i \in S_Q$ theo công thức Phân bổ Trách nhiệm ở mục 1.
2.  **Bước 2 (Lan truyền ngược - Backward Propagation):**
    Nếu $s_i$ bị giảm điểm mạnh, hệ thống duyệt qua danh sách các kỹ năng cha tiên quyết trực tiếp $p \in \text{Parents}(s_i)$ và giảm nhẹ điểm của chúng:
    $$M(p)_{\text{new}} = M(p)_{\text{old}} - \gamma \cdot \Delta M(s_i) \cdot w_{p \rightarrow s_i}$$
    *(Với $\gamma \approx 0.25$ là hệ số suy giảm ngược, $w_{p \rightarrow s_i}$ là trọng số quan hệ tiên quyết).*
3.  **Bước 3 (Lan truyền xuôi - Forward Propagation):**
    Nếu điểm của $s_i$ tăng lên, cập nhật lại xác suất tiên nghiệm xuất phát điểm $P(L_0)_c$ của các node con trực tiếp $c \in \text{Children}(s_i)$.

### Phân tích Độ phức tạp (Complexity Analysis):
*   **Độ phức tạp tính toán:** $\mathcal{O}(|S_Q| \cdot \text{deg})$ với $|S_Q| \le 5$ và số bậc $\text{deg} \le 3$. Tổng số phép tính số thực $< 50$.
*   **Độ phức tạp Database:** Gom toàn bộ luồng đọc-ghi các node liên quan vào 1 PostgreSQL RPC duy nhất để chạy nguyên tử (Atomicity), thời gian phản hồi thực tế cực kỳ nhanh ($< 5\text{ms}$), hoàn toàn không gây trễ giao diện.
