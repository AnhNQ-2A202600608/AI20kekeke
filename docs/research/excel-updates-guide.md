# Hướng dẫn Cập nhật Excel Quản lý Dự án (MVP Quiz & Dashboard scope)

Tài liệu này tổng hợp toàn bộ các nội dung cần chỉnh sửa và thêm mới trong file Excel quản lý dự án (`team_project_management_template_ai_tutor_filled_with_progress_styled_summary.xlsx`) để đồng bộ với scope tài liệu hiện tại (bao gồm trắc nghiệm thích ứng Elo, Radar/Heatmap dashboard và Socratic RAG chat).

---

## 1. Sheet: `Tổng hợp`

### A. Thay đổi mục tiêu dự án (Dòng 18)
*   **Nội dung cũ**: Trong 4-6 tuần, xây MVP AI tutor trả lời thắc mắc kiến thức dựa trên tài liệu chính thức, kèm citation, có guardrail chống làm hộ lab/gate và demo được happy + error paths.
*   **Nội dung mới**: Trong 4-6 tuần, xây dựng MVP AI Tutor tích hợp RAG Socratic Chat (5 modes), hệ thống trắc nghiệm thích ứng (Adaptive Quizzes) tự động tính điểm Elo cá nhân hóa, và Dashboard Radar Chart/Heatmap trực quan hóa năng lực.

### B. Cập nhật bảng "Tóm tắt Scope MVP" (Dòng 32)
*   **Core user (Dòng 34)**:
    *   *Mô tả*: Sinh viên hỏi kiến thức cá nhân hóa theo Elo và thực hiện làm Quiz thích ứng trong vùng ZPD.
    *   *Liên quan*: US-001, US-006, US-019, US-020, US-022, US-023.
*   **Thêm mới hạng mục "Adaptive Quiz & Elo" (Dòng 41)**:
    *   *Mô tả*: Tự động chọn câu hỏi vùng ZPD (70-75% tỷ lệ đúng), tính điểm Elo học sinh và Elo câu hỏi, áp dụng Elo discount khi dùng trợ lý Socratic.
    *   *Owner chính*: Thành viên 3 (Backend/Data).
    *   *Liên quan*: F-07, US-020, US-021.
*   **Thêm mới hạng mục "Dashboard" (Dòng 42)**:
    *   *Mô tả*: Hiển thị Radar Chart năng lực Elo và Heatmap chuyên cần của học viên; Dashboard phân tích lớp cho Mentor.
    *   *Owner chính*: Thành viên 2 (Frontend).
    *   *Liên quan*: F-08, US-023, US-024.

---

## 2. Sheet: `Danh sách User Story`

Thêm mới **6 User Stories** dưới đây vào cuối bảng (sau dòng US-018):

| Mã | Tên câu chuyện sử dụng | Với vai trò | Tôi muốn | Để đạt được | Mức ưu tiên | Sprint dự kiến | Liên kết |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **US-019** | Làm quiz thích ứng | Sinh viên | Làm câu hỏi trắc nghiệm có độ khó vừa sức (vùng ZPD, tỷ lệ đúng 70%-75% dựa trên Elo hiện tại) | Tránh nhàm chán hoặc nản lòng khi ôn tập | Bắt buộc | Sprint 2 | F-07 |
| **US-020** | Cập nhật điểm Elo sinh viên | Sinh viên | Điểm Elo năng lực của tôi tự cập nhật sau mỗi lượt nộp quiz | Theo dõi chính xác sự tiến bộ của bản thân | Bắt buộc | Sprint 2 | F-07 |
| **US-021** | Hiệu chỉnh Elo câu hỏi | Hệ thống | Tự động cập nhật độ khó (Elo) của câu hỏi dựa trên tỉ lệ trả lời đúng/sai của sinh viên | Có ngân hàng đề thi ngày càng chính xác | Bắt buộc | Sprint 2 | F-07 |
| **US-022** | Socratic Hint trong Quiz | Sinh viên | Gọi trợ lý Socratic hỗ trợ trong lúc làm Quiz và chấp nhận bị trừ bớt (discount) điểm Elo nhận được | Vừa tự suy luận được đáp án vừa giữ tính trung thực | Bắt buộc | Sprint 2 | F-07 |
| **US-023** | Xem Radar & Heatmap cá nhân | Sinh viên | Xem Radar Chart (Elo từng concept) và Heatmap chuyên cần trên Dashboard | Trực quan hóa các phần yếu/mạnh để tự học | Bắt buộc | Sprint 3 | F-08 |
| **US-024** | Xem Dashboard phân tích lớp | Mentor | Xem Elo trung bình của lớp, xếp hạng các concept yếu và danh sách học viên cần can thiệp | Hỗ trợ học viên yếu kịp thời | Bắt buộc | Sprint 4 | F-08 |

---

## 3. Sheet: `Đặc tả tính năng`

Thêm đặc tả chi tiết cho **2 tính năng mới** (F-07 và F-08):

### Đặc tả F-07: Trắc nghiệm thích ứng & Tính điểm Elo
*   **Mã User Story liên quan**: US-019, US-020, US-021, US-022
*   **Người viết**: Thành viên 3 (Backend/Data)
*   **1. Động lực**: Cá nhân hóa câu hỏi luyện tập cho học sinh, tránh tình trạng đề quá dễ hoặc quá khó. Gợi ý Socratic trực tiếp khi làm quiz để học sinh học qua sai lầm.
*   **2. Thiết kế**:
    *   *Kiến trúc*: Student Quiz UI -> Backend core (ZPD question selector, Elo calculations) -> Database (Quizzes, QuizAttempts, StudentMastery). Tích hợp chat sidebar cho Socratic hint.
    *   *Công thức*: ZPD chọn câu hỏi có $P(correct) \approx 0.70 - 0.75$. Cập nhật Elo: $Elo_{new} = Elo_{old} + K \times (Actual - Expected) \times Discount$.
    *   *Phạt Elo (Discount factor)*: Không hint ($Discount = 1.0$), 1 hint ($Discount = 0.7$), $\ge 2$ hints ($Discount = 0.4$), sai ($Discount = 1.0$).
*   **3. Kế hoạch**: 1) Thiết kế DB schema; 2) Cài đặt service Elo; 3) Thiết lập thuật toán ZPD; 4) Tích hợp Socratic hint và Elo discount.

### Đặc tả F-08: Dashboard trực quan năng lực (Radar, Heatmap & Class insights)
*   **Mã User Story liên quan**: US-023, US-024
*   **Người viết**: Thành viên 2 (Frontend)
*   **1. Động lực**: Học viên cần biết rõ lỗ hổng kiến thức trực quan để ôn tập. Giảng viên cần nắm tổng quan cả lớp để điều chỉnh bài giảng.
*   **2. Thiết kế**:
    *   *Student UI*: Biểu đồ Radar 5 đỉnh tương đương 5 skill/concept của môn học; Heatmap hoạt động theo ngày.
    *   *Lecturer UI*: Biểu đồ tổng quan Elo trung bình của cả lớp, Top 3 weak concepts, danh sách sinh viên cần can thiệp hỗ trợ.
*   **3. Kế hoạch**: 1) Tích hợp thư viện chart (Chart.js/Recharts); 2) Viết API tổng hợp số liệu; 3) Dựng giao diện Student & Lecturer Dashboard.

---

## 4. Sheet: `Tiến trình`

Thêm mới **7 Tasks** dưới đây vào bảng tiến trình:

| STT | Giai đoạn | Task ID | Checklist task | Kết quả cần có | Owner chính | Feature/US | Ưu tiên | Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **29** | Alignment | **P-029** | Thiết kế schema DB cho Quiz và Elo | Bảng `Quizzes`, `QuizAttempts`, `StudentMastery` trong DB schema | Thành viên 3 | F-07, US-020 | Bắt buộc | Sprint 1 |
| **30** | Source/RAG | **P-030** | Cài đặt service tính Elo & thuật toán ZPD | API/logic tự động cập nhật Elo và recommend câu hỏi vừa sức | Thành viên 3 | F-07, US-019 | Bắt buộc | Sprint 2 |
| **31** | Tutor API | **P-031** | Logic Socratic Quiz Helper & Phạt Elo | API chat hint trong Quiz kèm discount factor lưu vào attempt | Thành viên 1 | F-07, US-022 | Bắt buộc | Sprint 2 |
| **32** | Frontend | **P-032** | Dựng giao diện Adaptive Quiz UI | Màn hình làm Quiz chia đôi, có nút Socratic chat sidebar | Thành viên 2 | F-07, US-019 | Bắt buộc | Sprint 3 |
| **33** | Frontend | **P-033** | Dựng Student Dashboard Radar/Heatmap | UI Radar Chart (Elo concept) và Heatmap chuyên cần | Thành viên 2 | F-08, US-023 | Bắt buộc | Sprint 3 |
| **34** | Source/RAG | **P-034** | Auto-generate Quiz question khi ingestion | AI tự động sinh câu hỏi và hints khi Mentor upload tài liệu | Thành viên 3 | F-02, US-009 | Bắt buộc | Sprint 3 |
| **35** | Mentor/Admin| **P-035** | Dựng Lecturer Class Insight Dashboard | Giao diện tổng quan lớp học: weak concepts, học viên cần can thiệp | Thành viên 2 | F-08, US-024 | Bắt buộc | Sprint 4 |

---

## 5. Sheet: `Backlog`

Bổ sung các task tương ứng với các task `P-029` đến `P-035` vào Sprint tương ứng, phân bổ công việc như sau:
*   **Sprint 1**:
    *   *Mã việc*: `T-017` | *Tên*: Lập DB schema cho Quiz và Elo | *Dự kiến*: 4 giờ | *Phụ trách*: Thành viên 3.
*   **Sprint 2**:
    *   *Mã việc*: `T-018` | *Tên*: Phát triển service thuật toán Elo và ZPD | *Dự kiến*: 8 giờ | *Phụ trách*: Thành viên 3.
    *   *Mã việc*: `T-019` | *Tên*: Phát triển Socratic Quiz helper & Elo discount logic | *Dự kiến*: 8 giờ | *Phụ trách*: Thành viên 1 + 3.
*   **Sprint 3**:
    *   *Mã việc*: `T-020` | *Tên*: Phát triển giao diện Quiz UI & Student Dashboard | *Dự kiến*: 12 giờ | *Phụ trách*: Thành viên 2.
    *   *Mã việc*: `T-021` | *Tên*: Tích hợp tự động sinh Quiz khi Ingestion tài liệu | *Dự kiến*: 8 giờ | *Phụ trách*: Thành viên 3.
*   **Sprint 4**:
    *   *Mã việc*: `T-022` | *Tên*: Phát triển giao diện Lecturer Class Insights | *Dự kiến*: 8 giờ | *Phụ trách*: Thành viên 2.
