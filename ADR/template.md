# ADR-001: [Tiêu đề quyết định]

**Ngày:** YYYY-MM-DD
**Trạng thái:** Accepted / Deprecated / Superseded by ADR-XXX

## Bối cảnh (Context)

Mô tả vấn đề hoặc tình huống buộc bạn phải đưa ra quyết định.
Ví dụ: "Agent cần khả năng tìm kiếm web để trả lời câu hỏi về sự kiện hiện tại.
Cần chọn giữa Tavily Search API và Serper.dev."

## Các lựa chọn (Alternatives)

### Lựa chọn 1: Tavily Search API
- Ưu điểm: Tối ưu cho AI use case, trả kết quả đã clean, hỗ trợ search depth.
- Nhược điểm: API mới, cộng đồng nhỏ hơn, free tier giới hạn 1000 requests/tháng.

### Lựa chọn 2: Serper.dev
- Ưu điểm: Wrapper cho Google Search, kết quả chi tiết, free tier 2500 requests.
- Nhược điểm: Cần parse kết quả thủ công, đôi khi bị rate limit.

### Lựa chọn 3: Google Custom Search API
- Ưu điểm: Chính thức từ Google, ổn định.
- Nhược điểm: Setup phức tạp, free tier chỉ 100 requests/ngày.

## Quyết định (Decision)

Chọn **Lựa chọn 1: Tavily Search API**.

## Lý do (Rationale)

1. Tavily được thiết kế cho AI Agent — kết quả trả về đã được clean và structured,
   giảm công việc xử lý phía Agent.
2. Tavily tích hợp sẵn với LangChain/LangGraph ecosystem, ít code hơn.
3. Free tier 1000 requests đủ cho giai đoạn development và demo.
4. Nếu cần scale lên, pricing reasonable ($30/tháng cho 10k requests).

## Hệ quả (Consequences)

- Agent phụ thuộc vào Tavily API availability.
- Cần xử lý fallback khi Tavily down (có thể trả lời bằng kiến thức LLM).
- Cần quản lý API key trong biến môi trường.
