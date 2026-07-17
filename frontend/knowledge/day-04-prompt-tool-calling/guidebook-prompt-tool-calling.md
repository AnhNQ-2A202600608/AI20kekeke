# Day 04 - Prompt Engineering & Tool Calling

> **Câu hỏi cốt lõi:** *"Hai người hỏi AI cùng một việc, một người nhận kết quả xuất sắc, người kia nhận rác. Tại sao?"*

---

### 🗺️ 1. Bản đồ Kiến thức Hệ thống (Structured Knowledge Map)

#### 1.1. Prompt Engineering Fundamentals
Prompt tốt không phải là prompt “hay”, mà là prompt tạo ra hành vi mong muốn ổn định.

| Thành phần | Mô tả |
| --- | --- |
| **ROLE** | Vai trò của AI (ví dụ: “Act as a senior support analyst”) |
| **TASK** | Nhiệm vụ cần thực hiện (ví dụ: “Summarize the ticket and propose next step”) |
| **CONTEXT** | Bối cảnh của nhiệm vụ (ví dụ: “For an internal operations dashboard”) |
| **FORMAT** | Định dạng đầu ra (ví dụ: “Output as JSON with 3 fields”) |

> **Nguyên tắc vàng:** *Specificity beats cleverness* - Prompt ngắn nhưng rõ nghĩa thường tốt hơn prompt dài mà lan man.

#### 1.2. Các loại Prompt
| Loại prompt | Mục đích chính | Khi dùng |
| --- | --- | --- |
| Instruction prompt | Ra lệnh trực tiếp cho một tác vụ | Hỏi đáp 1 lượt, transform, summarize, classify |
| Conversation prompt | Giữ ngữ cảnh nhiều lượt với user | Chatbot, support, tutor, de-bugging nhiều bước |
| System prompt | Đặt policy, boundary, output contract | Agent, assistant production, use case cần hành vi ổn định |

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

#### 2.1. Zero-shot, One-shot, Few-shot, CoT
| Zero-shot | One-shot | Few-shot | CoT |
| --- | --- | --- | --- |
| Không có ví dụ mẫu. | 1 ví dụ mẫu. | 2–5 ví dụ. | Cho model reasoning từng bước. |
| Nhanh, rẻ, nên thử trước. | Tốt khi cần giữ format rõ hơn. | Tăng consistency, nhưng tốn token hơn. | Hữu ích cho task suy luận. |

#### 2.2. Chain-of-Thought (CoT) và Tree-of-Thought
- **CoT:** Phù hợp khi bài toán cần reasoning nhiều bước.
- **Tree-of-Thought:** Hữu ích cho bài toán cần explore nhiều hướng, phức tạp hơn và tốn token hơn.

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. System Prompt Anatomy
- **Persona:** Định hình danh tính AI.
- **Core Directives:** Mệnh lệnh bất di bất dịch.
- **Capabilities:** Công cụ và dữ liệu được phép sử dụng.
- **Output Contract:** Định dạng đầu ra và quy định chặt chẽ.

#### 3.2. Tool Calling API Cycle
1. **User Input:** Người dùng gửi yêu cầu.
2. **LLM trả về JSON tool_calls:** Model nhận diện thiếu dữ liệu và yêu cầu gọi tool.
3. **App thực thi:** Ứng dụng thực hiện yêu cầu.
4. **Gửi tool_outputs lại LLM:** Kết quả được gửi lại cho model để tổng hợp câu trả lời cuối cùng.

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Ví dụ về System Prompt
```python
system_prompt = """
You are a support triage agent for an e-commerce team.

Rules:
- Answer in Vietnamese.
- Be concise and operational.
- If billing or refund policy is unclear, ask for more details.

Constraints:
- Never invent order status.
- Never promise refunds without tool confirmation.

Output format:
Return JSON with: intent, action, reply 
"""
```

#### 4.2. Tool Schema Example
```json
{
  "type": "function",
  "function": {
    "name": "get_weather",
    "description": "Get current weather for a city when the user asks about weather conditions.",
    "parameters": {
      "type": "object",
      "properties": {
        "city": {"type": "string", "description": "City name, e.g. Hanoi"}
      },
      "required": ["city"]
    }
  }
}
```

#### 4.3. Tool Execution Strategies
- **Tuần tự (Sequential):** Gọi Tool A → Chờ kết quả → Gọi Tool B.
- **Song song (Parallel):** Gọi nhiều tools đồng thời để tối ưu hóa thời gian phản hồi.

---

### 🔑 5. Tư duy Chuyển dịch: Từ Prompt đến Tool Calling

#### 5.1. Tối ưu hóa Prompt
- Sử dụng XML Tags để cấu trúc hóa dữ liệu và ngăn chặn Context Bleed.
- Tạo ví dụ chống chỉ định để dạy model việc không nên làm.

#### 5.2. Dynamic System Prompts
- Bơm biến động vào System Prompt để tăng cường tính thời sự và cá nhân hóa.

#### 5.3. Xây dựng Agent Architecture
- Sử dụng LangGraph để quản lý trạng thái và luồng điều khiển phức tạp.

---

### 📋 6. Tổng kết — Key Takeaways
1. Prompt = interface giữa human intent và model capability.
2. System prompt tốt = agent nhất quán và predictable hơn.
3. Tool schema description quyết định việc model biết khi nào dùng tool nào.
4. Parallel tool calls nhanh hơn đáng kể khi các tool độc lập.

---

### 📚 Tài liệu Tham Khảo
1. Anthropic. Prompt Engineering Overview.
2. OpenAI. Function Calling Guide.
3. Wei et al. Chain-of-Thought Prompting Elicits Reasoning in Large Language Models.

---

### ❓ Hỏi & Đáp
Bạn đang gặp lỗi vì model chưa hiểu ý bạn, hay vì tool contract của bạn chưa đủ rõ? 

---

### 🙏 Cảm ơn!
Email: lecturer@vinuni.edu.vn  
Slides & tài liệu: github.com/aicb-vinuni  
Lab template: bit.ly/aicb-day04-lab