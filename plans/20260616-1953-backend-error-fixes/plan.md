# Kế hoạch khắc phục lỗi Terminal Backend (uv)

Kế hoạch này đề xuất các bước sửa lỗi cấu hình, xác thực LLM và ràng buộc cơ sở dữ liệu trên backend và frontend để máy chủ chạy trơn tru không còn log lỗi/cảnh báo.

## Phân tích các lỗi hiện tại ở Terminal

1. **Lỗi xác thực OpenAI (AuthenticationError: 401)**:
   - **Nguyên nhân**: API key `OPENAI_API_KEY` trong `.env` đang để placeholder `sk-your-key-here`.
   - **Giải pháp**: Tận dụng `OPENROUTER_API_KEY` đã được thêm vào `.env`. Cập nhật `src/services/llm.py` để khi phát hiện `OPENROUTER_API_KEY` sẽ cấu hình `ChatOpenAI` chạy qua OpenRouter endpoint (`https://openrouter.ai/api/v1`) và tự động chuẩn hóa định dạng model name cho OpenRouter (ví dụ: `openai/gpt-4o-mini`).
   - Cập nhật tương tự cho `OpenAIEmbeddings` trong `src/services/rag.py` để tránh lỗi 401 khi chạy embedding trích xuất slide.

2. **Cảnh báo RAGService thiếu Supabase Anon Key**:
   - **Nguyên nhân**: Hệ thống tìm biến `SUPABASE_ANON_KEY` nhưng trong `.env` chỉ cấu hình `SUPABASE_KEY`.
   - **Giải pháp**:
     - Thêm `SUPABASE_ANON_KEY` trỏ tới giá trị của `SUPABASE_KEY` trong file `.env`.
     - Cập nhật `src/services/rag.py` để tự động fallback tìm `SUPABASE_KEY` nếu `SUPABASE_ANON_KEY` rỗng.

3. **Lỗi kết nối LangSmith (LangSmithError: 403 Forbidden)**:
   - **Nguyên nhân**: Biến `LANGCHAIN_TRACING_V2=true` đang bật nhưng `LANGCHAIN_API_KEY` là placeholder không hợp lệ.
   - **Giải pháp**: Tắt chế độ tracing bằng cách đặt `LANGCHAIN_TRACING_V2=false` trong file `.env`.

4. **Lỗi Ràng buộc Khóa ngoại Cơ sở dữ liệu (`student_concept_mastery_course_id_fkey`)**:
   - **Nguyên nhân**: Frontend đang truyền cứng `course_id` là `'76f92026-c23f-4a00-ba57-db7b3f9ff7fe'` (DevOps & API Basics). Tuy nhiên, trong schema cơ sở dữ liệu Supabase thực tế chỉ có duy nhất 1 khóa học là `'00000000-0000-0000-0000-000000000001'` (AI & LLM Bootcamp) dẫn đến vi phạm ràng buộc khóa ngoại (Foreign Key Constraint).
   - **Giải pháp**: Cập nhật biến `COURSE_UUID` trong `socratic-chat-tab.tsx` thành `'00000000-0000-0000-0000-000000000001'`.

---

## Thay đổi đề xuất (Proposed Changes)

### 1. File cấu hình môi trường (.env)

#### [MODIFY] [.env](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/.env)
- Đặt `LANGCHAIN_TRACING_V2=false`.
- Thêm `SUPABASE_ANON_KEY` bằng giá trị của `SUPABASE_KEY`.

### 2. Dịch vụ LLM (Backend)

#### [MODIFY] [llm.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/llm.py)
- Cập nhật logic khởi tạo để tích hợp OpenRouter API Key & base URL.

### 3. Dịch vụ RAG (Backend)

#### [MODIFY] [rag.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/rag.py)
- Fallback `supabase_anon_key` sang `SUPABASE_KEY`.
- Định tuyến `OpenAIEmbeddings` sang OpenRouter nếu `OPENROUTER_API_KEY` được thiết lập.

### 4. Giao diện Chat Socratic (Frontend)

#### [MODIFY] [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)
- Đổi `COURSE_UUID` thành `'00000000-0000-0000-0000-000000000001'`.

---

## Kế hoạch kiểm tra (Verification Plan)

### Kiểm thử tự động
- Chạy kiểm tra TypeScript phía frontend: `pnpm exec tsc --noEmit`.
- Chạy thử backend server và gọi API chat để xác thực không còn lỗi 401 hay lỗi 403.

### Kiểm thử thủ công
- Gửi tin nhắn trên giao diện Socratic AI Chat tab, xem nó có phản hồi qua OpenRouter trơn tru hay không.
- Xác nhận các slide học liệu trích xuất RAG được load chính xác lên panel học liệu.
- Theo dõi log terminal của máy chủ `uv` xem có còn in ra lỗi khóa ngoại hay cảnh báo thiếu anon key nữa không.
