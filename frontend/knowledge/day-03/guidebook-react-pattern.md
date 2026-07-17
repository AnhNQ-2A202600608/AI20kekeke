# Day 03 - Từ Chatbot Đến Agentic Agent

> **Câu hỏi cốt lõi:** *"ChatGPT là chatbot hay agent? Siri thì sao? Cursor IDE thì sao?"*

---

### 🗺️ 1. Bản đồ Kiến thức Hệ thống (Structured Knowledge Map)

Để hiểu rõ sự chuyển mình từ chatbot đến agentic agent, chúng ta sẽ khám phá các khía cạnh chính của hệ thống AI:

#### 1.1. 3 Kiểu Hệ Thống AI
Mô tả sự tiến hóa từ bot có quy tắc đến agent có khả năng lập kế hoạch và sử dụng công cụ:

| Kiểu Hệ Thống        | Đặc Điểm                                   |
| :------------------- | :----------------------------------------- |
| **Rule-based Bot**   | Dựa trên quy tắc cứng, xử lý dự đoán.    |
| **LLM Chatbot**      | Trả lời thông minh nhưng chủ yếu một lượt. |
| **Reactive Agent**   | Sử dụng công cụ và lặp lại quan sát.     |
| **Autonomous Agent** | Có khả năng ra quyết định dài hạn.       |

---

### 📌 2. Khái niệm Cơ bản & Từ khóa Nền tảng (Core Concepts & Glossary)

Để phân biệt giữa các loại hệ thống AI, hãy xem xét các khái niệm sau:

| Thuật ngữ             | Khái niệm                                   | Tại sao cần quan tâm?                       |
| :--------------------- | :------------------------------------------ | :------------------------------------------- |
| **Agentic Fit**       | Khung phân tích để xác định khi nào cần sử dụng agent. | Giúp quyết định nâng cấp từ chatbot lên agent. |
| **ReAct Pattern**      | Kết hợp suy luận và hành động để tạo ra agent có thể debug. | Cung cấp cách tiếp cận có thể kiểm tra và cải tiến. |
| **Tool Calling**      | Gọi các công cụ bên ngoài để thực hiện hành động. | Tăng cường khả năng của agent thông qua việc sử dụng dữ liệu thực. |

---

### 📐 3. Quy tắc, Công thức & Tham số Kỹ thuật (Hard Rules & Formulas)

#### 3.1. 4 Tiêu chí Agentic Fit
Để xác định xem một bài toán có cần agent hay không, hãy xem xét các tiêu chí sau:

1. **Multi-step Reasoning:** Bài toán có cần chia thành nhiều bước phụ thuộc nhau không?
2. **Tool Interaction:** Hệ thống có cần gọi search, API, database không?
3. **Dynamic Decision:** Mỗi bước tiếp theo có phụ thuộc vào kết quả vừa quan sát không?
4. **Long Horizon:** Hệ thống có phải giữ mục tiêu xuyên suốt qua nhiều vòng lặp không?

#### 3.2. ReAct Loop: Thought → Action → Observation
Mô hình ReAct cho phép agent lặp lại các bước sau:

```
         ┌───────────┐
         │ User Input│
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │  Thought  │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │  Action   │
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │ Observation│
         └─────┬─────┘
               │
         ┌─────▼─────┐
         │ Final Answer│
         └─────────────┘
```

---

### 💻 4. Hành trang Kỹ thuật & Mã nguồn (Technical Hands-on)

#### 4.1. Pseudocode: Agent Loop Tối Thiểu
Dưới đây là mã giả cho vòng lặp agent:

```python
messages = []

for step in range(MAX_ITERATIONS):
    output = call_model(system=SYSTEM_PROMPT, messages=messages, tools=TOOLS)

    if output.type == "final_answer":
        return output.content

    result = run_tool(output.name, output.args)
    messages += [output.as_message(), tool_message(output.name, result)]

return "Stopped: max iterations reached"
```

#### 4.2. System Prompt Cho ReAct Agent
Một ví dụ về prompt cho agent:

```text
SYSTEM_PROMPT = """
You are a travel planning agent.
Your job:
- Break the user goal into smaller steps
- Use tools when fresh information is required
- Think briefly, then choose the best next action
- Stop when you have enough evidence to answer
"""
```

---

### 🧠 5. Tư duy Chuyển dịch: Chatbot sang Agentic Agent

Sự chuyển mình từ chatbot sang agentic agent không chỉ là nâng cấp công nghệ mà còn là sự thay đổi trong cách tiếp cận giải quyết vấn đề. Hãy xem xét các yếu tố sau:

- **Chatbot:** Thích hợp cho các tác vụ đơn giản, một lượt.
- **Agent:** Thích hợp cho các tác vụ phức tạp, nhiều bước và cần ra quyết định.

---

### 🔍 6. So sánh Chatbot và Agent

| Khía cạnh | Chatbot thắng                       | Agent thắng                                        |
| :-------- | :----------------------------------- | :------------------------------------------------- |
| Tác vụ    | FAQ, support đơn giản               | Booking, research, coding nhiều bước               |
| Tốc độ    | Nhanh, ít round-trip                 | Chậm hơn do loop và tool calls                     |
| Cost      | Thấp hơn, predictable hơn            | Cao hơn nhưng đổi lại xử lý được bài toán khó hơn  |

---

### 📊 7. Chi phí & An ninh (Cost & Security)

#### 7.1. Chi phí giữa Chatbot và Agent
Ví dụ về chi phí cho một truy vấn tìm vé:

- **Chatbot:** Chi phí thấp hơn, nhưng có thể bịa thông tin.
- **Agent:** Chi phí cao hơn nhưng cung cấp thông tin chính xác hơn dựa trên dữ liệu thực.

#### 7.2. An ninh trong Agent
Cần chú ý đến các lỗ hổng bảo mật khi agent gọi các công cụ bên ngoài. Các biện pháp bảo vệ cần thiết bao gồm:

- **Sanitize tool output:** Làm sạch đầu ra của công cụ trước khi đưa vào ngữ cảnh.
- **Human confirmation:** Xác nhận từ con người cho các hành động không thể đảo ngược.

---

### 💡 8. Tóm tắt & Kết luận

1. **Agent không phải chỉ là chatbot thông minh hơn;** mà là sự kết hợp của LLM, reasoning, tools và memory/state.
2. **ReAct là pattern dễ học nhất** để biến LLM thành hệ thống biết hành động và dễ debug.
3. **Chỉ sử dụng agent** khi bài toán có multi-step reasoning, tool use, dynamic decisions, long horizon.

---

### 📚 9. Tài liệu Tham Khảo

1. Yao et al. ReAct: Synergizing Reasoning and Acting in Language Models. arXiv:2210.03629, 2023.
2. Anthropic. Building effective agents. anthropic.com/research/building-effective-agents.

---

### ❓ 10. Hỏi & Đáp

Hãy xem xét các use case trong công việc của bạn: khi nào chỉ cần chatbot, và khi nào thực sự cần agent loop?