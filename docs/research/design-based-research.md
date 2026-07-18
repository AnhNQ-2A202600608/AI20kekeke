# Nghiên cứu Phương pháp Nghiên cứu dựa trên Thiết kế (Design-Based Research - DBR) trong EdTech

Tài liệu này nghiên cứu chi tiết về phương pháp Nghiên cứu dựa trên Thiết kế (Design-Based Research - DBR), cách ứng dụng phương pháp này để liên tục thử nghiệm, thu thập phản hồi và tinh chỉnh thuật toán thích ứng dựa trên một nhóm học viên mục tiêu định kỳ.

---

## 1. Khái niệm và Bản chất của DBR

Design-Based Research (DBR) là phương pháp nghiên cứu thực nghiệm trong giáo dục nhằm thiết kế, triển khai, phân tích và liên tục tinh chỉnh các công cụ hoặc môi trường học tập dựa trên phản hồi thực tế từ học viên.

Khác với nghiên cứu thực nghiệm truyền thống chỉ đánh giá kết quả trước và sau khi can thiệp bằng các bài kiểm tra tĩnh, DBR tập trung vào các chu kỳ lặp lại (iterative cycles) để liên tục cải thiện sản phẩm và đồng thời rút ra các nguyên lý thiết kế sư phạm mới.

Chu kỳ DBR cốt lõi gồm bốn bước:

1. **Phân tích và Khám phá (Analysis & Exploration):** Xác định vấn đề thực tế trong lớp học (ví dụ: tỷ lệ học viên bỏ cuộc cao do bài tập quá khó hoặc quá dễ).
2. **Thiết kế giải pháp (Design & Construction):** Xây dựng các tính năng công nghệ thích ứng (như mô hình Elo và LinUCB đã thiết kế).
3. **Thử nghiệm thực tế (Implementation & Evaluation):** Cho một nhóm học viên thử nghiệm (Target Cohort) sử dụng hệ thống trong một khoảng thời gian học tập thực tế (ví dụ từ 4 đến 8 tuần).
4. **Phân tích và Phản tư (Reflection & Redesign):** Dựa trên dữ liệu hệ thống (Telemetry) và khảo sát định kỳ của học viên để điều chỉnh thuật toán hoặc giao diện, sau đó bắt đầu chu kỳ thử nghiệm tiếp theo.

---

## 2. Các yêu cầu kỹ thuật để hỗ trợ DBR trong hệ thống

Để phục vụ phương pháp DBR hiệu quả, Core Backend và hệ thống thu thập dữ liệu cần được thiết kế để hỗ trợ việc thu thập phản hồi và theo dõi nhóm học viên định kỳ:

### Quản lý Nhóm thử nghiệm (Cohort Management)

* Hệ thống cần hỗ trợ định nghĩa các nhóm học viên (Cohorts). Ví dụ: Nhóm học viên lớp học phần A sử dụng phiên bản thuật toán gợi ý LinUCB với hệ số khám phá $\alpha = 0.2$, nhóm học viên lớp B sử dụng $\alpha = 0.5$.
* Việc phân chia nhóm giúp kỹ sư phân tích so sánh hiệu năng của các cấu hình thuật toán khác nhau giữa các chu kỳ thử nghiệm.

### Thu thập dữ liệu tương tác chi tiết (Detailed Telemetry Logging)

Hệ thống ghi nhật ký (logs) cần ghi nhận không chỉ kết quả đúng/sai mà cả các hành vi vi mô của học viên:

* `hesitation_time`: Khoảng thời gian do dự trước khi đưa ra câu trả lời.
* `hint_requests`: Số lần và thời điểm học viên yêu cầu trợ giúp từ AI Tutor.
* `active_time`: Tổng thời gian thực tế học viên tập trung trên màn hình bài tập.

### Cơ chế thu thập phản hồi định kỳ trong ứng dụng (In-app Feedback Surveys)

* Thiết kế các câu hỏi khảo sát ngắn (micro-surveys) xuất hiện tự động sau khi học viên hoàn thành một số lượng bài tập nhất định (ví dụ sau mỗi 10 câu hỏi).
* Câu hỏi khảo sát tập trung vào cảm xúc và đánh giá của học viên về độ khó: *"Bạn cảm thấy độ khó của các bài tập vừa rồi thế nào? (1: Quá dễ, 3: Vừa vặn, 5: Quá khó)"*.
* Dữ liệu khảo sát định kỳ này là nguồn phản hồi quan trọng để đối chiếu với năng lực ước lượng của mô hình Elo/BKT.

---

## 3. Lộ trình Triển khai DBR cho Dự án AI Tutor

Chúng ta sẽ thực hiện kiểm định chất lượng thuật toán thích ứng thông qua DBR theo 3 chu kỳ lặp:

### Chu kỳ 1: Thử nghiệm diện hẹp (Alpha Test - 2 tuần)

* **Đối tượng:** Nhóm 10 đến 15 sinh viên thử nghiệm nội bộ.
* **Mục tiêu:** Kiểm tra xem hệ thống có ghi nhận đúng dữ liệu tương tác và lưu ma trận LinUCB chính xác trong database không.
* **Đánh giá:** Phát hiện lỗi kỹ thuật hệ thống, kiểm tra xem độ khó Elo của các câu hỏi có hội tụ đúng hướng không.

### Chu kỳ 2: Thử nghiệm thực tế lớp học (Beta Test - 4 tuần)

* **Đối tượng:** Một lớp học phần thực tế khoảng 40 đến 50 sinh viên.
* **Mục tiêu:** Thu thập dữ liệu tương tác và đánh giá sự cải thiện năng lực thông qua các bài kiểm tra chẩn đoán.
* **Phản hồi định kỳ:** Thực hiện khảo sát tuần (Weekly survey) để đánh giá mức độ tương tác và cảm xúc (Productive Struggle).
* **Kết quả:** Phân tích dữ liệu để điều chỉnh tham số $\alpha$ của LinUCB và phân phối câu hỏi.

### Chu kỳ 3: Tinh chỉnh và Nhân rộng (Scale Up - 8 tuần)

* **Đối tượng:** Nhiều lớp học với quy mô 200 đến 300 sinh viên.
* **Mục tiêu:** Đánh giá độ ổn định của hệ thống khi chạy song song nhiều nhóm thử nghiệm với các cấu hình thuật toán khác nhau để tối ưu hóa mô hình gợi ý bài tập.


