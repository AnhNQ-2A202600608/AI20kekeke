# Kế hoạch tổng thể: Tái cấu trúc giao diện Trợ lý Socratic AI (Gemini-Inspired)

Kế hoạch này đề xuất tái thiết kế giao diện chat trợ lý AI trong [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\socratic-chat-tab.tsx) dựa trên các nguyên tắc thiết kế hiện đại của Gemini, Claude, và ChatGPT.

## Trạng thái hiện tại
- **Mục tiêu**: Hợp nhất màn hình, chuyển Trình chiếu học liệu thành panel bên phải, tổ chức lại thanh bên trái và tích hợp các tính năng nâng cao (Thinking, Tools, Quiz).
- **Trạng thái**: Đang lên kế hoạch (Planning).

## Các giai đoạn triển khai (Phases)

1. **[Giai đoạn 1: Tái cấu trúc Layout & Panel](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1936-unified-socratic-chat-redesign/phase-01-layout-and-panels.md)**
   - Tích hợp thanh bên trái (Sidebar) thu gọn được (collapsible) lấy cảm hứng từ Gemini.
   - Chuyển khung học liệu dưới cùng thành một Panel bên phải co giãn/ẩn hiện được (collapsible side panel).
   - Tổ chức lại vị trí các nút ở thanh bên (Đưa nút New Chat và Instructor Dashboard lên trên cùng, lịch sử ở dưới).

2. **[Giai đoạn 2: Hiển thị Logic suy nghĩ (Thinking) & Tools](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1936-unified-socratic-chat-redesign/phase-02-ai-thinking-and-tools.md)**
   - Render khối suy nghĩ (Thinking process) dạng accordion mở rộng/thu gọn tương tự Gemini/ChatGPT.
   - Render trạng thái gọi công cụ (Tools execution) như RAG search, code sandbox dưới dạng badge/card trực quan.

3. **[Giai đoạn 3: Tích hợp Widget Quiz tương tác](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1936-unified-socratic-chat-redesign/phase-03-interactive-quiz-widgets.md)**
   - Nhận diện câu hỏi trắc nghiệm từ AI và render thành các card câu hỏi tương tác (Quiz widgets) thay vì text markdown.
   - Cho phép người dùng click chọn đáp án trực tiếp trong khung chat và nhận phản hồi đúng/sai tức thì.

## Kiểm tra và Xác minh
- Chạy biên dịch TS: `pnpm exec tsc --noEmit`.
- Kiểm tra hiển thị responsive trên Mobile (Sidebar ẩn hoàn toàn, Slide Panel dạng ngăn kéo drawer trượt).
