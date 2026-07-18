# Kế hoạch thiết lập luồng Demo thích ứng & Giả lập Client-side (Mock Flows)

Kế hoạch này đề xuất tối ưu hóa ứng dụng để phục vụ buổi launch demo bằng cách chặn và hiển thị thông báo hợp lý đối với các nút nâng cao chưa hoàn thiện API, đồng thời tích hợp hệ thống giả lập client-side (Client-side Mocking) cho các kịch bản AI Socratic phức tạp (gọi công cụ RAG, chạy sandbox code Python, và sinh câu hỏi tương tác).

## User Review Required

> [!IMPORTANT]
> **Phương pháp tiếp cận: Client-side Mocking**
> Toàn bộ các luồng demo nâng cao sẽ được xử lý hoàn chỉnh ở phía Client thông qua các kịch bản hội thoại chuẩn bị sẵn (Mock Scenarios). Điều này giúp buổi demo hoạt động độc lập, mượt mà và không phụ thuộc vào tình trạng mạng hoặc trạng thái chạy của FastAPI backend.

> [!TIP]
> **Suggestion Chips (Nút bấm Demo nhanh)**
> Chúng tôi sẽ bổ sung 3 nút bấm (Suggestion Chips) trực quan ở chân khung chat để người thuyết trình dễ dàng click kích hoạt 3 kịch bản:
> 1. `Docker Compose & Slide Retrieval` (Gọi công cụ RAG & mở slide học liệu).
> 2. `Python Sandbox Execution` (Gọi công cụ sandbox và render log chạy code).
> 3. `Interactive Next.js RSC Quiz` (Sinh câu hỏi trắc nghiệm tương tác).

---

## Proposed Changes

### 1. Frontend Component: Socratic Chat Tab
#### [MODIFY] [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)
- **Bổ sung Banner Demo:** Hiển thị một thông báo mỏng ở đầu trang để báo hiệu đang ở môi trường mô phỏng học thuật (Demo Mode).
- **Suggestion Chips mới:** Thêm các nút bấm Demo nhanh bên trên hộp nhập chat:
  - 🦊 `[Demo] RAG Slide: Docker Compose`
  - 🖥️ `[Demo] Sandbox: Giai thừa Python`
  - 📝 `[Demo] Quiz: Next.js RSC`
- **Tích hợp các kịch bản Mock (handleSendMessage):**
  - **Kịch bản 1: RAG Slide Retrieval:** Giả lập quá trình suy nghĩ `<think>...</think>`, hiển thị log gọi tool `🔍 RAG Database Search: Đã tìm thấy 2 slides`, tự động hiển thị citation, nạp 2 slide mẫu vào state `retrievedSlides` và tự động trượt mở panel slide bên phải.
  - **Kịch bản 2: Code Sandbox:** Giả lập chạy code, hiển thị log gọi tool `🖥️ Code Sandbox: Executing python_repl...`, hiển thị terminal log với kết quả thực thi code python chính xác trực quan.
  - **Kịch bản 3: Quiz sinh từ AI:** Giả lập sinh câu hỏi, trả về chuỗi text có format để `parseQuizData` tự động nhận diện và render ra Widget trắc nghiệm tương tác hoàn chỉnh.
- **Xử lý Coming Soon & Toast cho các nút chưa kết nối API:**
  - **Đính kèm tài liệu (Paperclip):** Click hiển thị Toast: `📎 Tính năng Đính kèm tài liệu học tập đang được hoàn thiện. Coming soon! 🦊`.
  - **Báo lỗi trích dẫn:** Click hiển thị Toast: `⚠️ Đang kết nối API báo cáo lỗi trích dẫn tới hệ thống kiểm định. Coming soon! 🦊`.
  - **Đánh giá ThumbsUp/Down:** Click hiển thị Toast: `👍/👎 Đã ghi nhận đánh giá hữu ích của bạn! Hệ thống AI đang tối ưu hóa phong cách Socratic.`

### 2. Frontend Component: Practice Workspace
#### [MODIFY] [practice-workspace.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/practice/practice-workspace.tsx)
- Thêm cơ chế fallback client-side khi gọi gợi ý AI từ Practice. Nếu API backend `/api/v1/chat` bị lỗi/offline, hệ thống sẽ tự động sinh phản hồi Socratic gợi mở liên quan trực tiếp đến câu hỏi hiện tại dựa trên bộ câu hỏi có sẵn để người học không bị gián đoạn.

### 3. Frontend Component: Mentor & BTC Dashboards
#### [MODIFY] [mentor-dashboard.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/mentor-dashboard.tsx)
#### [MODIFY] [btc-heatmap.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/btc-heatmap.tsx)
- Bổ sung banner thông tin ở đầu trang: `📢 Chế độ Demo: Dữ liệu đang được mô phỏng tại môi trường thử nghiệm (Sandbox)` để tăng tính chân thực và minh bạch cho buổi thuyết trình.

---

## Verification Plan

### Manual Verification
1. Truy cập tab **Trợ lý AI**, click thử 3 nút **Quick Demo Chips** mới.
2. Kiểm tra xem luồng **RAG Slide** có tự động mở Panel bên phải và hiển thị slide hay không.
3. Kiểm tra xem luồng **Sandbox** có hiển thị code block output hay không.
4. Kiểm tra xem luồng **Quiz** có hiển thị Card câu hỏi tương tác, chọn đáp án và báo đúng sai tức thì hay không.
5. Click các nút `Paperclip`, `Thumbs Up/Down`, `Báo lỗi trích dẫn` và verify xem Toast thông báo Coming Soon có hiển thị mượt mà không.
6. Chuyển sang vai trò **Mentor** / **BTC** và kiểm tra xem có Banner Sandbox mô phỏng dữ liệu hay không.
