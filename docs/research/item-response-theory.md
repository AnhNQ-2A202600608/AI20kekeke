# Nghiên cứu Thuyết Ứng Đáp Câu Hỏi (Item Response Theory - IRT) trong Đánh giá Năng lực

Tài liệu này nghiên cứu chi tiết về thuyết ứng đáp câu hỏi (IRT), các mô hình toán học phổ biến và cách thức tích hợp mô hình này vào hệ thống học tập thích ứng.

---

## 1. Giới thiệu tổng quan về IRT

Item Response Theory (IRT) là lý thuyết đo lường tâm lý học giáo dục hiện đại, dùng để mô hình hóa mối quan hệ giữa năng lực tiềm ẩn của học viên ($\theta$) và các thuộc tính đặc trưng của câu hỏi (độ khó, độ phân biệt, xác suất đoán mò).

Khác với lý thuyết kiểm tra cổ điển (chỉ tính tổng điểm thô), IRT cho phép tách biệt năng lực học viên độc lập khỏi đặc tính của bài thi. Điều này nghĩa là năng lực học viên được đánh giá chính xác bất kể đề thi dễ hay khó, và đặc tính của câu hỏi cũng được đánh giá độc lập với năng lực của nhóm học viên tham gia thi.

---

## 2. Các mô hình toán học phổ biến trong IRT

Năng lực của học viên được biểu diễn bằng tham số $\theta$ (thường nằm trong khoảng $[-3, 3]$ hoặc được quy đổi sang thang điểm tương đương Elo). Xác suất trả lời đúng câu hỏi được mô hình hóa qua các hàm phân phối logistic tích lũy:

### Mô hình 1 tham số (1PL / Rasch Model)

Mô hình này giả định tất cả các câu hỏi đều có độ phân biệt như nhau và không có yếu tố đoán mò. Xác suất trả lời đúng chỉ phụ thuộc vào sự chênh lệch giữa năng lực học viên ($\theta$) và độ khó câu hỏi ($b$):

$$P(X_i = 1 | \theta) = \frac{1}{1 + e^{-(\theta - b_i)}}$$

Trong đó:
* $\theta$: Năng lực tiềm ẩn của học viên.
* $b_i$: Độ khó của câu hỏi $i$. Khi $\theta = b_i$, xác suất làm đúng là $50\%$.

### Mô hình 2 tham số (2PL Model)

Mô hình này bổ sung thêm tham số độ phân biệt ($a$), thể hiện khả năng câu hỏi phân loại được học viên giỏi và học viên kém:

$$P(X_i = 1 | \theta) = \frac{1}{1 + e^{-a_i(\theta - b_i)}}$$

Trong đó:
* $a_i$: Độ phân biệt của câu hỏi $i$. Giá trị $a_i$ càng cao thì đường cong biểu diễn xác suất càng dốc tại điểm $\theta = b_i$, nghĩa là câu hỏi phân loại học viên càng mạnh mẽ.

### Mô hình 3 tham số (3PL Model)

Mô hình này bổ sung thêm tham số đoán mò ($c$), đại diện cho xác suất học viên có năng lực cực kỳ thấp vẫn chọn đúng đáp án nhờ may mắn (ví dụ trắc nghiệm 4 đáp án thì $c$ mặc định có thể gần $0.25$):

$$P(X_i = 1 | \theta) = c_i + \frac{1 - c_i}{1 + e^{-a_i(\theta - b_i)}}$$

Trong đó:
* $c_i$: Xác suất đoán mò của câu hỏi $i$.

---

## 3. Quy trình huấn luyện và Hiệu chuẩn tham số (Parameter Calibration)

Để sử dụng IRT, hệ thống phải thực hiện quá trình hiệu chuẩn để tìm ra giá trị $\theta$ cho từng học viên và các tham số $a, b, c$ cho từng câu hỏi dựa trên ma trận kết quả làm bài lịch sử.

Do các tham số đều chưa biết trước, hệ thống thường sử dụng phương pháp **Ước lượng hợp lý cực đại biên (Marginal Maximum Likelihood Estimation - MMLE)** thông qua thuật toán **Expectation-Maximization (EM)**:

1. **Bước Expectation (E-step):** Tính toán số lượng học viên kỳ vọng tại các mức năng lực khác nhau dựa trên tham số câu hỏi hiện tại.
2. **Bước Maximization (M-step):** Cập nhật tham số câu hỏi $a, b, c$ để tối đa hóa hàm hợp lý của dữ liệu quan sát được.
3. Quá trình này lặp đi lặp lại cho đến khi các tham số hội tụ (sai số thay đổi nhỏ hơn một ngưỡng cố định).

---

## 4. Ứng dụng IRT trong Kiểm thử Thích ứng máy tính (CAT)

Kiểm thử thích ứng máy tính (Computerized Adaptive Testing - CAT) là ứng dụng trực tiếp mạnh mẽ nhất của IRT để rút ngắn bài thi chẩn đoán (Diagnostic Test):

1. **Khởi tạo:** Gán cho học viên một điểm năng lực mặc định $\theta_0 = 0$.
2. **Chọn câu hỏi tiếp theo:** Chọn câu hỏi trong ngân hàng đề cung cấp lượng thông tin kiểm tra lớn nhất (Fisher Information) tại mức năng lực hiện tại $\theta_t$ của học viên.
3. **Ước lượng năng lực:** Sau khi học viên trả lời câu hỏi, cập nhật năng lực $\theta_{t+1}$ bằng phương pháp Bayes (Maximum A Posteriori - MAP) hoặc Newton-Raphson để tìm nghiệm cực đại của hàm hợp lý.
4. **Điều kiện dừng:** Quá trình kiểm tra dừng lại khi sai số chuẩn của phép đo năng lực giảm xuống dưới mức cho phép (ví dụ $SEM < 0.3$), hoặc khi đạt đến số lượng câu hỏi tối đa (ví dụ 10 câu).

---

## 5. Phương án kiến trúc lai (Hybrid) cho Core Backend

Như đã phân tích trong quyết định kiến trúc, để giải quyết bài toán hiệu năng tính toán thời gian thực của IRT, chúng ta áp dụng mô hình lai:

* **Tương tác trực tuyến (Online):** Dùng thuật toán Elo để cập nhật nhanh $\theta$ và $b$ ngay sau khi học viên nộp bài nhằm đảm bảo thời gian phản hồi dưới 1ms cho API.
* **Huấn luyện nền ngoại tuyến (Offline Batch):** Định kỳ chạy tiến trình Celery worker hoặc cron job để lấy ma trận kết quả làm bài lịch sử trong cơ sở dữ liệu để chạy hiệu chuẩn IRT. Cập nhật lại các tham số độ khó và năng lực chuẩn xác vào database làm mốc bắt đầu cho chu kỳ Elo tiếp theo.
