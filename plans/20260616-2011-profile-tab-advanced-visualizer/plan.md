# Kế hoạch Triển khai: Đồ thị Lãng quên & Cây Kỹ năng Thích ứng (Profile Visualizer)

Kế hoạch này phác thảo các bước tích hợp Đồ thị Lãng quên (Ebbinghaus Forgetting Curve), Đồ thị Phụ thuộc Khái niệm (DAG Skill Tree), và các chỉ số BKT/Bandit nâng cao vào Trang cá nhân học viên, tối ưu hóa hiển thị di động.

---

## Các Giai đoạn Thực hiện (Phases)

### Phase 1: Mô hình hóa Toán học & Dữ liệu
* **Đồ thị lãng quên (SM-2 + Ebbinghaus):**
  * Tích hợp công thức tính độ bền trí nhớ thực tế: $R(t) = e^{-0.1386 \cdot \Delta t}$ dựa trên số ngày trôi qua kể từ `lastPracticed` đến ngày hiện tại ("2026-06-16").
  * Tự động gán cờ `decayRisk = true` khi $R(t) < 60\%$.
* **Đồ thị quan hệ khái niệm (Knowledge DAG Map):**
  * Định cấu hình quan hệ tiên quyết giữa 6 chủ đề chính:
    * `AI & LLM Foundation` $\to$ Tiên quyết của `Prompt Engineering`, `RAG Pipeline`, và `Design Pattern ReAct`.
    * `RAG Pipeline` $\to$ Tiên quyết của `Embedding & Vector DB`.
    * `Định hình bài toán AI` $\to$ Tiên quyết của `RAG Pipeline`.

### Phase 2: Tái cấu trúc Giao diện Tab & Tối ưu Di động
* **Tab Switcher:** Thêm 3 tab hiển thị trực quan:
  * **charts**: Radar Chart (Ma trận năng lực) & Line Chart (Tiến trình Elo 30 ngày).
  * **skill_tree**: Cây kỹ năng quan hệ tiên quyết (DAG).
  * **memory_decay**: Danh sách theo dõi độ bền trí nhớ (Đồ thị lãng quên).
* **Responsive Layout:**
  * Đối với màn hình di động (dưới 640px), chuyển nhãn tên Concept lên **phía trên** thanh bar để thanh bar có trọn 100% chiều ngang hiển thị dải bất định BKT và vạch ZPD.

### Phase 3: Cây Kỹ năng Tương tác (Skill Tree Visualizer)
* Sử dụng thư viện **React Flow** (`@xyflow/react`) kết hợp công cụ tính toán tự động bố cục **Dagre** (`dagre`) để tự động vẽ Đồ thị quan hệ tiên quyết dạng DAG xếp tầng thay vì code tay thủ công.
* Cấu hình các Custom Nodes tròn màu sắc theo trạng thái mastery sử dụng Tailwind CSS.
* Cho phép click vào Node để hiển thị một BottomSheet/Drawer thông tin chi tiết của Concept đó (Elo, BKT, Lần ôn cuối, các tham số Guess/Slip).

### Phase 4: Thiết lập Đồ thị Lãng quên (Memory Decay)
* Hiển thị danh sách Concept sắp xếp theo mức độ hao mòn trí nhớ.
* Thêm nút "Sạc pin Elo" trực tiếp tại từng thẻ Concept bị yếu để học viên củng cố ngay.

### Phase 5: Xác minh & Biên dịch
* Chạy build production: `pnpm run build` trong `/frontend` để xác nhận không lỗi biên dịch.

---

## Kế hoạch Xác minh (Verification Plan)
* **Tự động:** Đảm bảo Next.js build thành công.
* **Thủ công:** Kiểm tra mockup HTML tĩnh trên trình duyệt để đánh giá độ thẩm mỹ, độ mượt của các tương tác và độ co giãn trên màn hình điện thoại di động.
