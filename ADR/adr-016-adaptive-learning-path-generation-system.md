# ADR-016: Adaptive Learning Path Generation and Multi-Agent Evaluation System

**Ngày:** 2026-07-18
**Trạng thái:** Accepted

## Bối cảnh (Context)

Hệ thống EduGap (Toán 6) cần cung cấp lộ trình học tập thích ứng cá nhân hóa cho học viên sau khi hoàn thành các bài kiểm tra giữa kỳ hoặc cuối kỳ. 
Các yêu cầu kỹ thuật và sư phạm bao gồm:
1. **Trải nghiệm cá nhân hóa cấu trúc (Structural Personalization):** Học viên cần thấy các milestone kiến thức dưới dạng có cấu trúc, trực quan hóa mối quan hệ phụ thuộc (tiên quyết) thay vì một danh sách tuyến tính phẳng, cho phép học song song nhiều nhánh.
2. **Suy luận Sư phạm thông minh (Pedagogical Hybrid Decision):** Cần phân tích sâu sắc các lỗi sai của học viên. Nếu chỉ là lỗi bất cẩn tính toán (careless mistakes), không nên bắt học viên học lại toàn bộ lý thuyết từ đầu mà chỉ cần ôn luyện nhanh. Ngược lại, nếu hổng kiến thức gốc (conceptual gaps), bắt buộc phải học lý thuyết sâu và làm bài tập cơ bản. Lộ trình phải tuân thủ nghiêm ngặt các ràng buộc tiên quyết của Concept Graph.
3. **Lịch sử Lộ trình & Hỗ trợ Giảng viên (Path History & Mentor Direction):** Hệ thống không được ghi đè lộ trình cũ. Mỗi lần học viên yêu cầu sửa đổi hoặc làm bài thi mới, một phiên bản lộ trình (instance) độc lập cần được tạo ra để lưu giữ lịch sử. Mentor cũng cần có khả năng tạo và gửi lộ trình tùy chỉnh trực tiếp đến học viên.

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Lộ trình tuyến tính phẳng (Linear Path) & Hệ thống Đơn phiên bản (Single Instance)
- **Ưu điểm:** Thiết kế cơ sở dữ liệu đơn giản, giao diện hiển thị tuyến tính dễ lập trình.
- **Nhược điểm:** Không biểu thị được mối quan hệ tiên quyết song song của đồ thị tri thức, không lưu trữ được lịch sử học tập qua các giai đoạn, không hỗ trợ mentor can thiệp mà không phá vỡ lộ trình tự động.

### Lựa chọn 2: Lộ trình dạng Đồ thị Milestone (Milestone DAG), Đa phiên bản (Multi-Instance) & Pedagogical Hybrid (Được chọn)
- **Ưu điểm:**
  - **DAG Milestones:** Phản ánh chính xác cấu trúc đồ thị tiên quyết môn học; cho phép học viên học song song các nhánh độc lập.
  - **Pedagogical Hybrid:** Kết hợp tối ưu giữa phân tích lỗi sai định tính của LLM (careless vs conceptual) và ràng buộc topo định lượng của thuật toán để tạo lộ trình vừa chính xác sư phạm vừa linh hoạt.
  - **Multi-Instance:** Lưu giữ toàn bộ lịch sử lộ trình của học viên; hỗ trợ tách biệt lộ trình thích ứng tự động và lộ trình tùy chỉnh do Mentor giao.
- **Nhược điểm:** Phức tạp hóa thiết kế DB (JSONB cấu trúc đồ thị), độ trễ phân tích của Agent tăng do phải chạy song song thuật toán và LLM trước khi đánh giá.

## Quyết định (Decision)

Chọn **Lựa chọn 2: Lộ trình dạng Đồ thị Milestone (Milestone DAG), Đa phiên bản (Multi-Instance) & Pedagogical Hybrid**.

Chi tiết triển khai:
1. **Cơ sở dữ liệu:** Tạo bảng `app.learning_path_instances` chứa thông tin phiên bản lộ trình học tập, sử dụng trường `path_data` dạng `jsonb` để biểu diễn đồ thị các milestone bao gồm trạng thái (`locked`, `unlocked`, `completed`), danh sách tasks (lý thuyết, video, slide, practice) và liên kết tiên quyết (`prerequisites`).
2. **Thuật toán sinh lộ trình:** Adaptive Engine sử dụng thuật toán **Sắp xếp topo (Topological Sort)** trên đồ thị con của các concept bị hổng và các concept tiên quyết chưa làm chủ làm khung sườn cứng.
3. **Cơ chế Multi-Agent (LangGraph):**
   - **LLM Path Generator Agent:** Phân tích định tính lỗi làm bài (bất cẩn vs hổng kiến thức) kết hợp RAG slide học liệu.
   - **Evaluation Agent (Critic):** Hợp nhất lộ trình từ Thuật toán và LLM, thực hiện suy luận sư phạm để gán các task phù hợp (quick practice cho lỗi tính toán, deep study cho lỗi kiến thức) và ép ràng buộc tiên quyết topo để đảm bảo tính đúng đắn sư phạm.

## Lý do (Rationale)

1. **Bảo vệ tính đúng đắn sư phạm:** Topological Sort đảm bảo học sinh không bị học vượt khi chưa vững kiến thức nền.
2. **Cá nhân hóa sâu sắc:** Phân loại lỗi sai giúp học sinh không phải học lại lý thuyết của các phần họ hiểu bản chất nhưng tính toán nhầm, tối ưu hóa thời gian học.
3. **Hỗ trợ vai trò Mentor:** Cơ chế Multi-instance cho phép giáo viên can thiệp vào lộ trình học tập mà không làm mất dữ liệu lộ trình thích ứng cũ của hệ thống.
4. **Theo dõi tiến độ:** Lưu lịch sử lộ trình giúp hệ thống và giảng viên vẽ biểu đồ phát triển năng lực của học viên theo thời gian.

## Hệ quả (Consequences)

- Tăng kích thước lưu trữ cơ sở dữ liệu do lưu nhiều instance lộ trình dưới dạng JSONB.
- Cần xây dựng giao diện Frontend hiển thị đồ thị cây/milestone hoặc dạng lộ trình phân nhánh trực quan, sinh động bám sát Sapia Design System (Cozy Avocado `#f4fce8`, Sapia Green `#58cc02`, cấm màu tím `Purple Ban`).
- Tăng độ trễ phản hồi khi sinh lộ trình (do gọi LLM và RAG song song). Cần sử dụng cơ chế xử lý bất đồng bộ (async queue) hoặc API Streaming trạng thái sinh lộ trình ở UI.
- Cần thiết lập cơ chế RLS (Row Level Security) trên Supabase cho bảng `app.learning_path_instances` để đảm bảo học viên chỉ xem được lộ trình của mình và Mentor xem được lộ trình của học viên trong lớp.
