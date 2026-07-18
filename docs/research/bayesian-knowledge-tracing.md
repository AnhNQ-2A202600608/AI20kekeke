# Nghiên cứu Bayesian Knowledge Tracing (BKT) trong Đánh giá Năng lực Học viên

Tài liệu này nghiên cứu chi tiết về thuật toán Bayesian Knowledge Tracing (BKT), các công thức toán học cập nhật xác suất và cách áp dụng thuật toán này để theo dõi trạng thái làm chủ kiến thức của học viên trong hệ thống học tập thích ứng.

---

## 1. Giới thiệu tổng quan về BKT

Bayesian Knowledge Tracing (BKT) là thuật toán tiêu chuẩn trong lĩnh vực giáo dục thông minh (Intelligent Tutoring Systems) dùng để theo dõi mức độ hiểu bài của học viên đối với từng khái niệm kiến thức độc lập qua chuỗi các lượt trả lời câu hỏi.

BKT coi quá trình học tập là một Mô hình Markov ẩn (Hidden Markov Model - HMM) với hai trạng thái ẩn và hai hành động quan sát được:

* **Trạng thái ẩn (Hidden States):**
  * $L$ (Learned): Trạng thái đã làm chủ khái niệm kiến thức.
  * $U$ (Unlearned): Trạng thái chưa làm chủ khái niệm kiến thức.
* **Hành động quan sát được (Observed States):**
  * Đúng (Correct - 1): Học viên trả lời đúng câu hỏi.
  * Sai (Incorrect - 0): Học viên trả lời sai câu hỏi.

---

## 2. Bốn tham số cốt lõi của BKT

Mỗi khái niệm kiến thức (Concept) trong hệ thống sẽ đi kèm với 4 tham số xác suất ban đầu:

1. **$P(L_0)$ (Prior Probability):** Xác suất ban đầu học viên đã vững kiến thức trước khi bắt đầu làm câu hỏi đầu tiên của Concept này.
2. **$P(T)$ (Transition Probability):** Xác suất học viên chuyển trạng thái từ chưa hiểu bài sang hiểu bài sau khi làm một bài tập (được coi là một cơ hội học tập).
3. **$P(G)$ (Guess Probability):** Xác suất học viên trả lời đúng câu hỏi mặc dù thực chất chưa hiểu bài.
4. **$P(S)$ (Slip Probability):** Xác suất học viên trả lời sai câu hỏi mặc dù thực chất đã hiểu bài.

---

## 3. Công thức toán học và Quy trình cập nhật Bayesian

Tại mỗi lượt làm bài tập thứ $t$:

### Bước 1: Tính xác suất hậu nghiệm (Posterior Probability)

Dựa trên kết quả trả lời thực tế của học viên tại lượt $t$ (Đúng hoặc Sai), chúng ta tính xác suất học viên thực sự đã hiểu bài tại thời điểm đó:

* **Trường hợp học viên trả lời Đúng (Correct):**
  $$P(L_t | \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$

* **Trường hợp học viên trả lời Sai (Incorrect):**
  $$P(L_t | \text{Incorrect}) = \frac{P(L_{t-1}) \cdot P(S)}{P(L_{t-1}) \cdot P(S) + (1 - P(L_{t-1})) \cdot (1 - P(G))}$$

### Bước 2: Cập nhật xác suất cho cơ hội học tập tiếp theo

Sau khi hoàn thành lượt làm bài $t$, học viên trải qua một cơ hội học tập mới. Xác suất học viên hiểu bài ở lượt tiếp theo $t+1$ được tính bằng cách cộng xác suất đã hiểu ở bước trước với xác suất học viên chuyển từ chưa hiểu sang hiểu bài:

$$P(L_{t+1}) = P(L_t | \text{Result}) + (1 - P(L_t | \text{Result})) \cdot P(T)$$

Trong đó $\text{Result}$ là kết quả thực tế của lượt làm bài thứ $t$ (Correct hoặc Incorrect).

---

## 4. Dự báo hiệu suất của học viên

Chúng ta có thể dự báo xác suất học viên sẽ trả lời đúng câu hỏi tiếp theo tại lượt $t+1$ dựa trên xác suất hiểu bài hiện tại của họ bằng công thức:

$$P(\text{Correct}_{t+1}) = P(L_t) \cdot (1 - P(S)) + (1 - P(L_t)) \cdot P(G)$$

---

## 5. So sánh BKT với mô hình Elo hiện tại

| Tiêu chí | Mô hình Elo | Mô hình BKT |
| --- | --- | --- |
| **Đầu ra năng lực** | Điểm số liên tục (ví dụ: 1200, 1500) | Xác suất từ 0 đến 1 về khả năng hiểu bài |
| **Độ khó câu hỏi** | Được cập nhật linh hoạt cho từng câu hỏi cụ thể | Coi mọi câu hỏi trong cùng một Concept có độ khó như nhau |
| **Khả năng lọc nhiễu** | Kém hơn đối với hành vi đoán mò hoặc bất cẩn | Rất mạnh mẽ nhờ tham số Guess ($P(G)$) và Slip ($P(S)$) |
| **Khởi đầu lạnh** | Dễ dàng gán điểm mặc định ban đầu | Đòi hỏi dữ liệu lịch sử để tối ưu hóa 4 tham số xác suất |
| **Tốc độ cập nhật** | Thời gian thực, tức thì sau mỗi lượt trả lời | Thời gian thực đối với năng lực, nhưng tham số câu hỏi cần chạy ngoại tuyến |

---

## 6. Đề xuất kiến trúc kết hợp cho EdTech

Để tận dụng ưu điểm của cả hai mô hình trong hệ thống học tập thích ứng của dự án, chúng ta có thể áp dụng kiến trúc lai (Hybrid):

* Sử dụng **Elo** để liên tục cập nhật độ khó chi tiết cho từng câu hỏi và năng lực tổng quát của học viên.
* Sử dụng **BKT** làm bộ lọc ở cấp độ Concept để xác định chính xác thời điểm học viên đạt trạng thái làm chủ (Mastery) một chủ đề trước khi chuyển sang chủ đề tiếp theo.
