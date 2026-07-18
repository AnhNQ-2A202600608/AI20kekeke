# Day 09 - Multi-Agent Systems & Connected Architectures

## 1. Giới hạn của Single-Agent & Sự chuyển dịch tư duy

### 1.1 Khi một Agent bắt đầu quá tải
Trong các bài học trước (từ Day 01 đến Day 08), chúng ta tập trung tối ưu hóa hiệu năng của một Agent duy nhất (Single-Agent). Tuy nhiên, khi quy mô của ứng dụng doanh nghiệp lớn lên, một Agent đơn lẻ phải gánh vác quá nhiều vai trò: lập kế hoạch (planning), tìm kiếm thông tin (retrieval), gọi công cụ (tool calling), tổng hợp dữ liệu (synthesis) và giám sát lỗi (monitoring + retry). 

Một thực thể đơn lẻ gánh vác quá nhiều vai trò sẽ trở thành một **God Agent** — hệ thống trở nên cực kỳ khó tối ưu, khó gỡ lỗi (debug) và không thể mở rộng quy mô một cách bền vững.

### 1.2 Bốn giới hạn cốt lõi của Single-Agent
1. **Context Window Bottleneck (Nghẽn cổ chai ngữ cảnh):** 
   - *Kịch bản:* Agent phải phân tích một hợp đồng dài 80 trang (~40,000 tokens), gọi thêm tool tra cứu luật trả về 12,000 tokens, cộng thêm lịch sử hội thoại 6,000 tokens và prompt hệ thống 3,000 tokens.
   - *Hậu quả:* Xảy ra hiện tượng **"Lost-in-the-Middle"** (LLM bỏ qua hoặc quên các chi tiết nằm ở giữa văn bản). Các dấu hiệu nhận biết bao gồm câu trả lời thiếu sót thông tin quan trọng, agent lặp lại các bước đã thực hiện, hoặc gọi tool với tham số trống (empty context).
2. **Specialization Trade-off (Sự đánh đổi về chuyên môn hóa):** 
   - Agent càng gánh nhiều vai trò, prompt hệ thống (system prompt) càng dài và phức tạp. Việc cố gắng tối ưu hóa prompt để LLM giỏi đều mọi việc thường dẫn đến việc nó không thật sự xuất sắc ở bất kỳ vai trò nào.
3. **Parallelism hạn chế (Khó xử lý song song):** 
   - Một Agent đơn lẻ hoạt động theo chuỗi tuần tự (serial execution). Khi có nhiều tác vụ độc lập cần giải quyết cùng lúc, hệ thống vẫn phải chờ từng bước nối tiếp nhau, làm tăng độ trễ (latency) không cần thiết.
4. **Reliability yếu (Độ cô lập lỗi kém):** 
   - Thiếu cơ chế cô lập lỗi (fault isolation). Nếu Agent lựa chọn sai công cụ (tool) hoặc hiểu sai ý định của người dùng ngay từ đầu luồng, lỗi này sẽ lan truyền và làm hỏng toàn bộ kết quả phía sau mà không có khả năng tự phục hồi cục bộ.

### 1.3 Tư duy hệ thống (Systems Thinking)
Chúng ta cần dịch chuyển tư duy từ việc cố gắng tạo ra một *"Agent thông minh hơn"* sang thiết kế một *"Hệ thống rõ ràng và phối hợp hiệu quả"*. 

```
Tư duy cũ (God Agent):
User Request ──> [ God Agent (Plan + Retrieve + Tool Call + Synthesize) ] ──> Output

Tư duy hệ thống (Multi-Agent):
                   ┌──> Retrieval Worker (RAG) ──┐
User Request ──> [ Supervisor ] ─────────────────┼──> Synthesis Worker ──> Output
                   └──> Tool Worker (API/MCP) ───┘
```

Trước khi bắt tay vào thiết kế hệ thống Multi-Agent, kỹ sư cần trả lời ba câu hỏi cốt lõi:
- **Câu hỏi 1 (Chia trách nhiệm ở đâu?):** Phần việc nào cần suy luận logic chuyên sâu (reasoning)? Phần nào chỉ cần lấy dữ liệu (data fetching)? Phần nào chỉ cần định dạng kết quả (formatting)?
- **Câu hỏi 2 (Thông tin đi theo con đường nào?):** Luồng dữ liệu di chuyển ra sao? Agent nào cần nhận đầu ra của agent nào trước? Dữ liệu nào cần bảo mật?
- **Câu hỏi 3 (Lỗi xảy ra ở đâu là ít tổn hại nhất?):** Làm sao để lỗi xảy ra ở một Worker (ví dụ: mất kết nối API ngoài) được xử lý cô lập mà không làm sập toàn bộ hệ thống?

---

## 2. Các mô hình thiết kế Multi-Agent (Multi-Agent Patterns)

Tùy thuộc vào bản chất của bài toán, chúng ta lựa chọn một trong bốn pattern phổ biến sau đây:

| Pattern | Cơ chế hoạt động | Điểm mạnh | Cảnh báo / Rủi ro | Phù hợp nhất khi |
| :--- | :--- | :--- | :--- | :--- |
| **Supervisor-Worker** | Một Supervisor trung tâm nhận yêu cầu, phân chia công việc cho các Worker chuyên biệt, giám sát và tổng hợp kết quả. | Lập kế hoạch linh hoạt, điều phối rõ ràng, dễ trace luồng đi của quyết định. | Supervisor có thể trở thành điểm nghẽn (bottleneck) nếu phải xử lý quá nhiều logic. | Tác vụ phức tạp cần điều hướng động dựa trên yêu cầu người dùng. |
| **Pipeline** | Chuỗi xử lý tuyến tính cố định. Output của Agent trước là Input của Agent sau. | Rất dễ hiểu, dễ kiểm thử độc lập cho từng bước, luồng đi ổn định. | Kém linh hoạt khi luồng cần rẽ nhánh động; độ trễ cộng dồn qua từng bước. | Các bài toán xử lý văn bản cố định (ví dụ: Nhận diện thực thể -> Dịch thuật -> Viết báo cáo). |
| **Debate** | Nhiều Agent cùng giải một bài toán từ nhiều góc nhìn khác nhau, sau đó tranh biện và biểu quyết kết quả. | Giảm thiểu điểm mù (blind spots), nâng cao chất lượng suy luận đối với các quyết định quan trọng. | Chi phí token rất cao, tăng đáng kể latency và khó tổng hợp ý kiến đồng thuận. | Các tác vụ đòi hỏi độ chính xác cao và có rủi ro lớn (pháp lý, chẩn đoán y khoa, đánh giá bảo mật). |
| **Hierarchical** | Cấu trúc phân cấp hình cây. Supervisor cấp trên điều phối các Sub-supervisor cấp dưới, Sub-supervisor điều phối Workers. | Khả năng mở rộng (scalability) cực tốt ở quy mô lớn, tính module hóa cao. | Cực kỳ phức tạp trong việc thiết kế, truyền trạng thái (state sharing) và debug. | Hệ thống quy mô lớn của doanh nghiệp (Enterprise Scale) với hàng chục nghiệp vụ con. |

---

## 3. Deep-Dive: Kiến trúc Supervisor-Worker

Kiến trúc Supervisor-Worker là mô hình thực tiễn nhất để bắt đầu nâng cấp từ các hệ thống RAG đơn lẻ sang hệ thống Multi-Agent.

```
                  ┌───────── USER REQUEST ─────────┐
                  │                                │
                  v                                │
           ┌──────────────┐                        │
           │  Supervisor  │ <────────────────┐     │
           └──────┬───────┘                  │     │
                  │                          │     │
       ┌──────────┼──────────┐               │     v
       v          v          v               │   ┌────────────────┐
   ┌───────┐  ┌───────┐  ┌───────┐           │   │  Human Review  │
   │Retrie─│  │ Tool  │  │Synthe─│           │   └───────┬────────┘
   │ val   │  │Worker │  │ sis   │           │           │
   │Worker │  │(MCP)  │  │Worker │           │           v
   └───┬───┘  └───┬───┘  └───┬───┘           └────── APPROVAL
       │          │          │
       └──────────┼──────────┘
                  │
                  v
            [SHARED STATE]
```

### 3.1 Trách nhiệm của các thành phần
- **Supervisor (Người điều phối):**
  - Phân tích yêu cầu ban đầu của người dùng để lập kế hoạch (plan).
  - Quyết định Worker nào sẽ thực hiện tác vụ tiếp theo (routing).
  - Giám sát trạng thái thực thi và quyết định chạy lại (retry) với tham số mới nếu Worker trả về kết quả lỗi hoặc không đạt yêu cầu.
  - Chuyển giao luồng cho con người phê duyệt (Human-in-the-loop) khi chạm vào các ranh giới rủi ro.
  - Tổng hợp dữ liệu từ các Worker để đưa ra câu trả lời cuối cùng.
- **Worker (Người thực thi):**
  - Đảm nhận một năng lực chuyên biệt hẹp (Domain Skill) như: tìm kiếm tài liệu (retrieval), gọi API hệ thống (tool use), định dạng văn bản (synthesis).
  - Hoạt động càng stateless (không lưu trạng thái lịch sử dài hạn) càng tốt, chỉ xử lý dựa trên input hiện tại nhận từ Supervisor.
  - Đóng gói lỗi cục bộ (local error handling) và trả về thông tin lỗi có cấu trúc thay vì làm sập toàn bộ luồng chạy của hệ thống.

### 3.2 Giao tiếp trong hệ thống: Shared State vs. Message Passing
Có hai trường phái quản lý dữ liệu giao tiếp giữa các agents:

1. **Shared State (Trạng thái chia sẻ):**
   - *Cơ chế:* Một schema dữ liệu chung (bộ nhớ trung tâm) được truyền qua lại giữa các nodes. Mỗi node đọc dữ liệu cần thiết và ghi cập nhật vào các trường cụ thể.
   - *Ưu điểm:* Rất tiện lợi cho việc điều phối bằng đồ thị (như LangGraph), dễ dàng quan sát toàn cảnh hệ thống đang có dữ liệu gì.
   - *Rủi ro:* Nếu không quản lý chặt chẽ, các node có thể ghi đè dữ liệu của nhau (state pollution). Cần định nghĩa rõ quyền sở hữu (ownership) đối với từng trường dữ liệu.
2. **Message Passing (Truyền tin nhắn):**
   - *Cơ chế:* Các agent giao tiếp trực tiếp thông qua các thông điệp có cấu trúc (gửi và nhận).
   - *Ưu điểm:* Khớp nối lỏng (low coupling), các agent độc lập hoàn toàn, dễ dàng tích hợp các hệ thống phân tán.
   - *Rủi ro:* Phải thiết kế và duy trì các message contracts (hợp đồng thông điệp) rất chặt chẽ, overhead mã hóa/giải mã lớn.

> **Quy tắc thực tiễn:** Sử dụng **Shared State** để phục vụ việc điều phối luồng chạy (orchestration), và sử dụng **Message Contract** rõ ràng tại các cổng nhận của Worker để đảm bảo giao tiếp không bị nhập nhằng.

### 3.3 Thiết kế State Schema tối giản
Một Shared State Schema bắt buộc phải có các trường dữ liệu sau để đảm bảo tính vận hành:

```python
from typing import TypedDict, List, Dict, Any, Optional

class MultiAgentState(TypedDict):
    task: str                   # Yêu cầu gốc từ người dùng
    plan: List[str]             # Danh sách các bước/worker cần gọi tiếp theo
    worker_results: Dict[str, Any]  # Kết quả trả về của từng worker (key là agent_id)
    status: str                 # Trạng thái hệ thống: pending | running | done | error
    final_answer: str           # Câu trả lời tổng hợp cuối cùng trả về user
    trace: List[Dict[str, Any]] # Nhật ký thực thi (audit log) bắt buộc
    error: Optional[str]        # Chi tiết thông báo lỗi nếu hệ thống thất bại cục bộ
```

> **Tại sao trường `trace` là bắt buộc?**
> Nếu không có `trace` ghi nhận từng hành động của các agent kèm timestamp, hệ thống Multi-Agent sẽ trở thành một "hộp đen". Khi xảy ra lỗi, lập trình viên sẽ không thể biết được tác nhân nào đã chạy, route sang đâu, nhận đầu vào là gì và lỗi bắt đầu phát sinh từ bước nào.

---

## 4. Orchestration & Observability với LangGraph

### 4.1 LangGraph đóng vai trò gì?
LangGraph giúp chuyển hóa toàn bộ luồng hoạt động phức tạp của Multi-Agent thành một đồ thị có hướng (Graph) tường minh, trong đó:
- **Node (Nút):** Là một hàm Python nhận vào `State` hiện tại, xử lý (gọi LLM hoặc công cụ) và trả về các trường dữ liệu cập nhật cho `State`.
- **Edge (Cạnh/Đường nối):**
  - *Unconditional Edge (Cạnh cố định):* Luôn di chuyển từ Node A sang Node B.
  - *Conditional Edge (Cạnh điều kiện):* Một hàm routing bằng code Python sẽ đọc `State` hiện tại để quyết định tên của Node tiếp theo sẽ được thực thi.
- **Persistence (Lưu trữ trạng thái):** Cho phép ghi nhớ trạng thái (checkpointing) để tạm dừng đồ thị và khôi phục lại sau đó.

### 4.2 Cơ chế Human-in-the-Loop (Can thiệp của con người)
Trong hệ thống Multi-Agent, tính tự trị (autonomy) hoàn toàn thường đi kèm rủi ro lớn. Chúng ta cần thiết kế các điểm can thiệp của con người (Human Oversight) khi:
- Hệ thống chuẩn bị thực hiện một hành động có tác động vật lý không thể đảo ngược (ví dụ: chuyển tiền, xóa cơ sở dữ liệu, gửi email cho khách hàng).
- Độ tự tin của Supervisor hoặc Worker nằm dưới ngưỡng an toàn (confidence score < threshold).
- Gặp các ca xử lý nhạy cảm liên quan đến điều khoản bảo mật hoặc y tế.

Trong LangGraph, điều này được thực thi bằng cách định cấu hình `interrupt_before` tại node mong muốn. Đồ thị sẽ dừng chạy, lưu checkpoint vào bộ nhớ, chờ tín hiệu Approve/Reject từ phía con người thông qua API trước khi tiếp tục thực thi node đó.

---

## 5. Các chỉ số vận hành: Cost, Latency & Reliability

Thiết kế Multi-Agent là bài toán đánh đổi (trade-offs) phức tạp. Hệ thống nhiều Agent không hề miễn phí.

### 5.1 So sánh trực quan: Single-Agent vs. Multi-Agent

| Tiêu chí | Single-Agent | Multi-Agent |
| :--- | :--- | :--- |
| **Chi phí token (LLM Cost)**| Thấp (thường chỉ mất 1-2 LLM calls cho toàn bộ yêu cầu). | Cao (mỗi bước điều phối, gọi worker, và tổng hợp đều tốn LLM calls). |
| **Độ trễ (Latency)** | Thấp (nếu prompt ngắn). | Cao (nhiều LLM call nối tiếp nhau làm tăng độ trễ tuần tự). |
| **Khả năng gỡ lỗi (Debug)** | Rất khó (toàn bộ logic suy luận bị giấu kín trong prompt hệ thống). | Dễ dàng (mỗi worker có input/output rõ ràng, có trace log ghi lại chi tiết). |
| **Chuyên môn hóa** | Hạn chế (model dễ bị quá tải khi prompt quá dài và phức tạp). | Rất tốt (mỗi worker chỉ làm một việc hẹp nên độ chính xác cực cao). |
| **Khả năng mở rộng (Scale)** | Khó khăn (phải viết lại prompt hệ thống mỗi khi thêm chức năng). | Rất dễ (chỉ cần đăng ký thêm một Worker node mới vào đồ thị điều phối). |

### 5.2 Chiến lược tối ưu hóa chi phí và độ trễ
1. **Phân cấp mô hình (Model Cascading):**
   - Supervisor chủ yếu làm nhiệm vụ đọc JSON hoặc định hướng đơn giản → Sử dụng các mô hình nhỏ, tốc độ nhanh và chi phí rẻ (ví dụ: `gpt-4o-mini`, `Claude 3.5 Haiku`).
   - Chỉ sử dụng các mô hình lớn, mạnh mẽ (như `gpt-4o`, `Claude 3.5 Sonnet`) cho các Worker đảm nhận nhiệm vụ đòi hỏi khả năng suy luận logic sâu sắc (như tổng hợp mã nguồn, phân tích tài liệu phức tạp).
2. **Xử lý song song (Concurrency):**
   - Thiết kế đồ thị sao cho các Worker không phụ thuộc dữ liệu của nhau có thể chạy song song (ví dụ: gọi song song Retrieval Worker và Tool Worker), sau đó mới hội tụ tại Node Synthesis để tổng hợp.

### 5.3 Thiết kế độ tin cậy (Reliability & Fail-safe)
Hệ thống Multi-Agent production bắt buộc phải tuân thủ các nguyên tắc thiết kế an toàn:
- **Timeout & Retry Limits:** Thiết lập giới hạn thời gian chờ cho mỗi Worker call. Nếu quá thời gian, Supervisor tiến hành gọi lại (retry) với số lần giới hạn (tối đa 2-3 lần).
- **Graceful Degradation (Suy giảm hiệu năng có kiểm soát):** Nếu một Worker bị lỗi hoàn toàn (ví dụ: API thời tiết ngoài bị sập), hệ thống không được crash toàn bộ. Supervisor phải có phương án fallback: sử dụng dữ liệu cũ trong cache, bỏ qua phần thông tin đó, hoặc trả về câu trả lời tổng hợp kèm cảnh báo thiếu thông tin một cách rõ ràng cho người dùng.
- **Strict Input Validation:** Mọi kết quả trả về từ Worker trước khi được nạp vào Shared State phải đi qua một lớp validate schema (ví dụ: dùng Pydantic). Điều này ngăn chặn việc Worker sinh dữ liệu sai cấu trúc làm hỏng các node chạy phía sau.
