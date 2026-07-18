# Kế hoạch Thiết kế lại Notion Mentora giúp Mentor dễ Review

Dựa trên các nguyên tắc thiết kế sản phẩm số chuyên nghiệp từ bộ hướng dẫn `notion-template-business` (như: phân cấp thông tin rõ ràng, giao diện sạch sẽ, hỗ trợ điều hướng nhanh và sử dụng các tính năng trực quan của Notion), bản kế hoạch này đề xuất các bước cải tiến trang tài liệu **Mentora** từ dạng văn bản thuần sang giao diện Dashboard tương tác.

---

## 1. Đánh giá độ tương thích của Template với Dự án Mentora

**Ưu điểm tương thích**:
*   Dự án **Mentora** là một hệ thống AI Tutor phức tạp, kết hợp cả thuật toán học tập (Elo, BKT, IRT), cơ chế RAG và giao diện quản trị phức tạp. Mentor cần xem nhanh tiến độ và hiểu nhanh kiến trúc mà không bị ngập trong chữ.
*   Cách phân chia tài liệu hiện tại (Product, Research, Engineering, Frontend) đã rất logic nhưng cần một **Dashboard trung tâm (First Impression)** đóng vai trò như cổng điều hướng.

---

## 2. Bản thiết kế lại Giao diện Notion (Redesign Concept)

### A. Trang chủ: Mentora Project Portal
*   **Cover & Icon**: Thêm banner tối giản sang trọng (Sui-style hoặc tối giản công nghệ) và sử dụng icon thống nhất (ví dụ: 🎓 cho cổng chính).
*   **Khu vực "Chào mừng & Tóm tắt nhanh" (Callout Box)**:
    > 💡 **Mentora** là nền tảng AI Tutor thế hệ mới tập trung vào khả năng tự thích ứng (Adaptive-first), hỗ trợ học tập cá nhân hóa thông qua chatbot Socratic RAG, chấm điểm tự động và theo dõi mức độ thành thạo Elo.
*   **Bố cục hai cột (Two-column Layout)**:
    *   **Cột 1 (Directory Links)**: Sử dụng các block **Callout** hoặc **Page Link** kết hợp icon trực quan để trỏ tới 4 phân vùng chính.
    *   **Cột 2 (Quick Actions & Status)**: Đặt bảng tiến độ Sprint hiện tại và thông tin kết nối MCP.

---

### B. Cải tiến Nội dung Trực quan hơn

| Tệp tài liệu hiện tại | Vấn đề hiện tại | Đề xuất trực quan hóa trên Notion |
| :--- | :--- | :--- |
| `project-roadmap.md` | Dạng danh sách text tĩnh, khó theo dõi tiến độ thực tế | **Chuyển thành Notion Database (Board/Timeline view)**:<br>- Tạo các cột trạng thái: *Backlog*, *In Progress*, *To Review*, *Done*.<br>- Thêm thuộc tính: *Sprint*, *Priority*, *Owner*. |
| `frontend-pages.md` & `frontend-user-stories.md` | Danh sách bảng biểu dài dòng, khó đối chiếu | **Chuyển thành Database tương tác**:<br>- Mỗi hàng là một Page/Screen của Frontend.<br>- Thuộc tính: *Status*, *Complexity*, *Linked Stories* (liên kết chéo). |
| `architecture_diagram.md` | Code khối Mermaid text thô, khó nhìn hình dung | **Sử dụng Native Mermaid Block**:<br>- Sử dụng block Mermaid tích hợp của Notion để hiển thị sơ đồ trực quan tương tác thay vì chỉ để code block dạng text. |
| Tài liệu Research (`bayesian-knowledge-tracing.md`, v.v.) | Chứa nhiều công thức toán học và lý thuyết khô khan | **Tối ưu hóa bố cục**:<br>- Sử dụng block **Math Equation (KaTeX)** của Notion cho các công thức tính toán Elo/BKT.<br>- Sử dụng block **Quote/Callout** để làm nổi bật các định luật/ràng buộc cốt lõi. |

---

## 3. Lộ trình Thực hiện (Implementation Roadmap)

### Phase 1: Tạo bộ Khung Trang Chủ & Menu Điều hướng
- [ ] Thiết lập trang chủ **Mentora Project Portal** với bố cục 2 cột.
- [ ] Cài đặt thanh điều hướng (Breadcrumbs / Sync Block Menu) ở đầu các trang con để quay lại trang chủ nhanh chóng.

### Phase 2: Chuyển đổi Dữ liệu Tĩnh sang Database
- [ ] Tạo database **Mentora Roadmaps & Sprints** từ file `project-roadmap.md`.
- [ ] Tạo database **Frontend Pages & Stories** tích hợp từ file `frontend-pages.md` và `frontend-user-stories.md`.

### Phase 3: Làm đẹp nội dung tài liệu
- [ ] Đổi các block code Mermaid thành block sơ đồ trực quan.
- [ ] Định dạng lại các công thức toán học (Math equations).
- [ ] Thêm Callout block cho các phần lưu ý quan trọng.
