# Luồng Xử lý AI Chatbot Chi tiết (Detailed AI Chatbot Flows)

Tài liệu này mô tả chi tiết thứ tự gọi hàm, luồng dữ liệu Server-Sent Events (SSE), tối ưu hóa Prompt Caching, và logic kiểm định sư phạm Socratic của API Chatbot `/api/v1/chat`.

---

## 1. Sơ đồ tuần tự truyền phát chatbot Socratic (`POST /api/v1/chat`)

Sơ đồ mô tả luồng hoạt động truyền phát thời gian thực (real-time streaming) giữa Client UI, API Router, các node trong LangGraph Agent, OpenAI API, và Supabase DB/Cache.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Học viên (Client UI)
    participant API as FastAPI Router (/chat)
    participant DB as Supabase DB / Cache
    participant NodeAnalyze as Analyze Node (LangGraph)
    participant RAG as RAG Service
    participant NodeTutor as Respond Node (LangGraph)
    participant LLM as OpenAI GPT-4o-mini
    participant NodeCritic as Reflection Node (LangGraph)

    Student->>API: Gửi tin nhắn (query, chat_history, student_id, concept_id)
    Note over API: Khởi chạy LangGraph Agent (astream_events)
    
    API->>DB: get_student_profile(student_id, course_id, concept_id)
    DB-->>API: Trả về student_profile (Elo, BKT, weaknesses, active_quiz)
    
    API->>NodeAnalyze: analyze_node(state)
    
    Note over NodeAnalyze: 1. Phân loại ý định (Intent Routing)
    NodeAnalyze->>NodeAnalyze: is_general_query_heuristic(query)
    
    alt Ý định học thuật (intent == 'academic')
        NodeAnalyze->>API: adispatch_custom_event('tool_call', match_slides)
        API-->>Student: SSE stream 'tool_call' event
        
        NodeAnalyze->>RAG: aretrieve_relevant_slides(query, match_threshold, match_count)
        Note over RAG: Vector search (PostgreSQL) + Keyword search (ilike)
        RAG->>DB: Truy vấn dữ liệu slides
        DB-->>RAG: Trả về slides tương tự
        RAG->>RAG: _fetch_neighboring_slides() (Gộp slide N-1 & N+1)
        RAG-->>NodeAnalyze: retrieved_slides
        
        alt Slide tốt nhất có similarity < 0.42 (Fallback)
            Note over NodeAnalyze: Hạ cấp ý định: intent = 'general'
        end
        
        NodeAnalyze->>API: adispatch_custom_event('tool_result', match_slides)
        API-->>Student: SSE stream 'tool_result' event (retrieved slides)
    else Ý định xã giao (intent == 'general')
        Note over NodeAnalyze: Bypass RAG & Critic
    end
    
    NodeAnalyze->>NodeAnalyze: build_prompt_profile(profile, mode)
    Note over NodeAnalyze: Tính toán scaffolding_rules & mode_instructions
    NodeAnalyze-->>API: Trả về state cập nhật (intent, context, retrieved_slides, prompt_profile)
    
    API->>NodeTutor: respond_node(state)
    NodeTutor->>NodeTutor: build_system_prompt()
    NodeTutor->>NodeTutor: split_formatted_prompt()
    Note over NodeTutor: Tách static_prompt (lên đầu) & dynamic_prompt (dưới history)<br/>(Tối ưu Prompt Caching)
    
    NodeTutor->>LLM: astream(messages)
    loop Đọc từng chunk từ Stream
        LLM-->>NodeTutor: chunk
        NodeTutor->>API: adispatch_custom_event('token', chunk.content)
        API-->>Student: SSE stream 'token' event (Hiển thị chữ chạy)
    end
    
    NodeTutor->>NodeTutor: validate_citations(raw_text, retrieved_slides)
    Note over NodeTutor: Làm sạch các trích dẫn lỗi không có trong học liệu
    NodeTutor-->>API: Trả về state cập nhật (response_text)
    
    alt Chứa mã nguồn (```) hoặc Đáp án trắc nghiệm (Reflection Trigger)
        API->>NodeCritic: pedagogical_reflection_node(state)
        NodeCritic->>API: adispatch_custom_event('thinking', 'Đang kiểm định sư phạm...')
        API-->>Student: SSE stream 'thinking' event
        
        NodeCritic->>LLM: ainvoke(CRITIC_PROMPT) (bind: JSON mode, max_tokens=150, temp=0.0)
        LLM-->>NodeCritic: eval_result (is_valid, feedback)
        
        alt is_valid == False (Vi phạm Socratic) & attempts < 2
            NodeCritic->>API: adispatch_custom_event('thinking', 'Vi phạm quy tắc. Đang sửa...')
            API-->>Student: SSE stream 'thinking' event
            NodeCritic-->>API: Trả về state (reflection_feedback) -> Lặp lại respond_node
        else Đạt chuẩn hoặc đã thử 2 lần
            NodeCritic->>API: adispatch_custom_event('thinking', 'Kiểm định thành công.')
            API-->>Student: SSE stream 'thinking' event
            NodeCritic-->>API: Trả về state (reflection_feedback = None) -> Kết thúc đồ thị
        end
    else Phản hồi lý thuyết thông thường
        Note over API: Bypass Critic Node (Đi thẳng tới END)
    end
    
    Note over API: Kết thúc tiến trình Agent. Trả về kết quả cuối cùng.
    
    API->>DB: sync_mastery_to_db() & log_chat_history() (Chạy ngầm - Background Tasks)
    API-->>Student: Đóng luồng kết nối SSE (Stream Finished)
```

---

## 2. Giải thích chi tiết các bước xử lý

### A. Phân loại ý định & Tìm kiếm RAG (Analyze Node)
1. **Lọc Heuristics**: Kiểm tra nhanh chuỗi tin nhắn của người dùng bằng Regex để phát hiện các câu chào hỏi, xã giao hoặc hỏi thông tin chatbot. Nếu khớp, bypass RAG hoàn toàn.
2. **LLM Classifier**: Dùng LLM phân loại ngữ cảnh dựa vào tin nhắn mới và lịch sử 5 lượt chat gần nhất để phát hiện hành vi chuyển đổi chủ đề (Topic Switching).
3. **Hybrid Search**: Chạy truy vấn Vector tương đồng song song với từ khóa SQL `ilike` trên Supabase Database.
4. **Context Expansion**: Tự động mở rộng học liệu lấy thêm slide kề trước ($N-1$) và kề sau ($N+1$) của top 2 slides khớp nhất để giúp học sinh có cái nhìn toàn cảnh trên giao diện.
5. **Fallback Downgrade**: Nếu slide tốt nhất có độ tương đồng `< 0.42`, hệ thống tự động hạ cấp ý định về `general` để AI tự trả lời bằng kiến thức mở rộng của nó mà không bị ép trích dẫn học liệu sai thực tế.

### B. Prompt Caching & Streaming (Respond Node)
1. **Split Prompt**: Cắt đôi System Prompt thành `static_prompt` (các luật Socratic cố định) và `dynamic_prompt` (slide RAG động và thông tin Elo của lượt chat).
2. **Prefix Matching**: Đặt `static_prompt` ở đầu và `dynamic_prompt` ở cuối danh sách tin nhắn gửi lên OpenAI API. Nhờ đó, OpenAI tự động khớp Cache cho phần tĩnh, giúp giảm thời gian phản hồi (TTFT) từ ~1.4s xuống ~250ms (nhanh gấp 6 lần).
3. **Citation Validator**: Dọn dẹp câu trả lời thô của LLM bằng cách lọc bỏ các thẻ trích dẫn bị ảo giác (không khớp với slides RAG được cung cấp).

### C. Pedagogical Reflection (Reflection Node)
1. **Critic Trigger**: Chỉ kích hoạt bộ lọc kiểm định Critic khi câu trả lời thô có chứa khối mã nguồn (` ``` `) hoặc định dạng đáp án trắc nghiệm.
2. **Critic Model**: Gọi LLM với cấu hình tối giản (JSON mode, Temperature = 0.0, Max tokens = 150) để kiểm tra xem câu trả lời có vi phạm luật Socratic (như rò rỉ mã nguồn code giải hoàn chỉnh hoặc đáp án bài tập trực tiếp) hay không.
3. **Vòng lặp sửa đổi**: Nếu vi phạm (`is_valid == false`), Node phản hồi sẽ chạy lại để sinh câu trả lời mới dựa trên nhận xét (feedback) sửa đổi của Critic (tối đa 2 lần để tránh gây trễ vô hạn).
