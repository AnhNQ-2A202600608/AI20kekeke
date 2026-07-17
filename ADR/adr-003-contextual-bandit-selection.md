# ADR-003: Lựa chọn giải pháp Contextual Bandit gợi ý bài tập thích ứng

**Ngày:** 2026-06-05
**Trạng thái:** Reviewed

## Bối cảnh (Context)

Hệ thống cần gợi ý câu hỏi và bài tập có độ khó phù hợp với năng lực hiện tại của học viên. Chúng ta đã chọn thuật toán Elo (ADR-002) để theo dõi năng lực học viên ($\theta$) và độ khó câu hỏi ($b$) theo thời gian thực. Tuy nhiên, việc quyết định chính xác câu hỏi nào nên được hiển thị tiếp theo đòi hỏi một cơ chế ra quyết định thông minh, có khả năng cân bằng giữa việc thử nghiệm các câu hỏi mới để kiểm định (Exploration) và việc khai thác các câu hỏi đã biết để tối ưu hiệu quả học tập (Exploitation). Do đó, chúng ta cần lựa chọn phương pháp triển khai Contextual Bandit cho bài toán này.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Thuật toán LinUCB tự triển khai (Custom LinUCB in Python)
*Triển khai trực tiếp thuật toán LinUCB (Linear Upper Confidence Bound) bằng Python và Numpy.*
* **Ưu điểm:** 
  * Tự do tùy biến các đặc trưng ngữ cảnh (Context) đặc thù của lĩnh vực EdTech như điểm Elo, chuỗi đúng/sai, và thời gian làm bài.
  * Tích hợp gọn nhẹ vào core FastAPI hiện tại mà không cần thêm các dependencies hệ thống phức tạp.
  * Dễ dàng lưu trữ các tham số mô hình (ma trận $A$ và vector $b$) trực tiếp vào Database hiện có (SQLite/PostgreSQL) dưới dạng JSON hoặc Array.
* **Nhược điểm:** Nhóm phát triển phải tự viết mã nguồn và unit test cho phần tính toán đại số tuyến tính, đòi hỏi sự chính xác cao về mặt toán học.

### Lựa chọn 2: Sử dụng thư viện Vowpal Wabbit (VW)
*Thư viện mã nguồn mở hiệu năng cao chuyên dụng cho Contextual Bandit của Microsoft Research.*
* **Ưu điểm:** 
  * Được tối ưu hóa cực tốt về tốc độ tính toán và dung lượng bộ nhớ.
  * Hỗ trợ nhiều chính sách (policies) khác nhau như Bagging, Cover, Thompson Sampling và LinUCB.
* **Nhược điểm:** 
  * Cài đặt và biên dịch phần core C++ trên môi trường Windows rất phức tạp và dễ phát sinh lỗi.
  * Định dạng dữ liệu đầu vào đặc thù của VW khó debug và quá phức tạp so với nhu cầu hiện tại của MVP.

### Lựa chọn 3: Luật quyết định heuristic cứng (Heuristic Rules)
*Dùng các luật nghiệp vụ cố định, ví dụ như luôn chọn ngẫu nhiên một câu hỏi có độ khó Elo $b$ nằm trong khoảng $[\theta - 100, \theta + 100]$ của học viên.*
* **Ưu điểm:** 
  * Đơn giản, không cần viết thuật toán học máy, dễ triển khai và kiểm thử nhanh chóng.
  * Không tốn tài nguyên máy chủ để cập nhật mô hình trực tuyến.
* **Nhược điểm:** 
  * Không có khả năng tự động thích ứng khi ngữ cảnh người học thay đổi phức tạp.
  * Không cân bằng được giữa việc khám phá các câu hỏi chưa có nhiều dữ liệu và khai thác câu hỏi hiệu quả.

## Quyết định (Decision)

Chọn **Lựa chọn 1: Thuật toán LinUCB tự triển khai (Custom LinUCB in Python)**.

## Lý do (Rationale)

1. Tuân thủ nguyên tắc thiết kế **KISS** và **YAGNI**. Giúp đội ngũ phát triển làm chủ hoàn toàn mã nguồn mà không cần cài đặt thêm các thư viện hệ thống nặng như Vowpal Wabbit.
2. Thuật toán LinUCB sử dụng các phép toán ma trận cơ bản từ `numpy`, rất thích hợp để triển khai và viết unit test trong Python.
3. Trạng thái của mô hình được biểu diễn đơn giản qua các ma trận và vector có kích thước cố định theo số lượng đặc trưng ngữ cảnh (ví dụ: ma trận $4 \times 4$), dễ dàng lưu trữ và truy vấn từ database quan hệ miêu tả trong MVP.
4. Cung cấp khả năng cá nhân hóa thực tế bằng cách kết hợp điểm Elo và các đặc trưng học tập khác của học viên vào vector ngữ cảnh.

## Hệ quả (Consequences)

* Nhóm phát triển cần thiết kế mã nguồn logic cập nhật và dự đoán của LinUCB trong `src/services/bandit.py` và bao phủ bằng unit test để đảm bảo tính chính xác của các phép toán ma trận.
* Cần thiết kế bảng database lưu trữ ma trận hiệp biến sai và vector tham số của Bandit cho từng Concept môn học.
* Trong tương lai, khi ngân hàng câu hỏi tăng lên quy mô lớn (hàng nghìn câu hỏi), cần triển khai thêm bước lọc bộ lọc thô (candidate filtering) dựa trên điểm Elo trước khi đưa vào Bandit để tránh việc tính toán điểm UCB cho quá nhiều câu hỏi cùng lúc trên mỗi API request.
