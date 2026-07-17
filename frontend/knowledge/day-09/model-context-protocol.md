# Model Context Protocol (MCP) — Chuẩn kết nối hệ thống cho AI

## 1. Vấn đề thực tế và Sự ra đời của MCP

### 1.1 Khó khăn trước khi có MCP
Trước khi Model Context Protocol (MCP) ra đời, việc tích hợp các công cụ (tools) và nguồn dữ liệu bên ngoài vào AI Agent gặp phải sự phân mảnh nghiêm trọng:
- **Tích hợp tùy biến (Custom Adapters):** Mỗi công cụ, cơ sở dữ liệu hay API ngoài đều yêu cầu lập trình viên viết một wrapper hoặc adapter riêng biệt.
- **Sự thay đổi API:** Mỗi khi API phía đối tác thay đổi, mã nguồn tích hợp của Agent bắt buộc phải viết lại và deploy lại.
- **Khác biệt giữa các Framework:** Cách gọi công cụ của LangChain khác với LlamaIndex, Semantic Kernel hay AutoGen. Không có chuẩn chung để tái sử dụng công cụ qua lại giữa các framework.
- **Mơ hồ về năng lực:** Agent không có cách nào tự động khám phá (discover) xem hệ thống đang có những công cụ gì và cách dùng ra sao nếu không được hard-code sẵn trong prompt hệ thống.

```
Trước MCP (Phân mảnh):
[ LangGraph Agent ] ──> Adapter A ──> Database API
                    ──> Adapter B ──> Slack API
                    ──> Adapter C ──> Local Filesystem

Sau MCP (Chuẩn hóa USB):
[ LangGraph Agent (MCP Client) ] ── (Chuẩn MCP JSON-RPC) ──> [ MCP Server ] ──> Database, Slack, Local File
```

### 1.2 Model Context Protocol (MCP) là gì?
Model Context Protocol (MCP) là một giao thức mở, chuẩn hóa (do Anthropic khởi xướng) cho phép các ứng dụng AI (MCP Clients) kết nối trực tiếp với các nguồn dữ liệu và công cụ (MCP Servers) thông qua một giao diện giao tiếp thống nhất.

> **Analogy dễ nhớ: Analogy USB**
> Hãy nghĩ về MCP như cổng kết nối USB. Thay vì mỗi thiết bị ngoại vi (chuột, bàn phím, máy in, ổ cứng) yêu cầu máy tính thiết kế một cổng cắm riêng biệt, tất cả thiết bị đều dùng chung cổng USB. Máy tính chỉ cần trang bị cổng USB là dùng được mọi thiết bị. 
> Tương tự, AI Agent chỉ cần trang bị cổng MCP Client là có thể sử dụng bất kỳ công cụ hoặc nguồn dữ liệu nào được công bố qua MCP Server.

---

## 2. Kiến trúc của MCP

Giao thức MCP hoạt động theo mô hình **Client-Server** dựa trên giao thức truyền tin **JSON-RPC 2.0** qua hai kênh truyền tải phổ biến: **Stdio** (cho các tiến trình chạy cục bộ trên cùng máy) hoặc **SSE / HTTP** (cho các dịch vụ chạy từ xa qua mạng).

```
┌────────────────────────────────────────────────────────┐
│                     MCP CLIENT                         │
│  (Ví dụ: LangGraph Agent, Cursor, Claude Desktop, ...) │
└──────────────────────────┬─────────────────────────────┘
                           │
                 JSON-RPC 2.0 (Stdio / SSE)
                           │
┌──────────────────────────v─────────────────────────────┐
│                     MCP SERVER                         │
│  (Ví dụ: Github API Server, Postgres DB Server, ...)   │
└──────┬───────────────────┼───────────────────┬─────────┘
       │                   │                   │
┌──────v──────┐     ┌──────v──────┐     ┌──────v──────┐
│    TOOLS    │     │  RESOURCES  │     │   PROMPTS   │
│ (Hành động) │     │ (Dữ liệu)   │     │ (Template)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 2.1 Ba khả năng cốt lõi (Capabilities) mà MCP Server công bố:

1. **Tools (Công cụ thực thi — Ghi/Hành động):**
   - Cho phép AI Agent thực hiện một hành động có tác động lên hệ thống (ví dụ: tạo file mới, gửi email, tạo ticket JIRA, chạy truy vấn SQL ghi vào DB).
   - Mỗi Tool được định nghĩa kèm theo một **JSON Schema** mô tả chi tiết: tên tool, chức năng, danh sách các tham số đầu vào, kiểu dữ liệu và thuộc tính bắt buộc.
2. **Resources (Tài nguyên đọc — Đọc/Context):**
   - Cung cấp cho AI Agent dữ liệu thô, tài liệu hoặc thông tin trạng thái ở chế độ chỉ đọc (read-only) để làm context cho prompt.
   - Ví dụ: đọc nội dung của một file log, lấy sơ đồ bảng (schema) của database, đọc nội dung một tài liệu SOP.
   - Tài nguyên được định vị bằng các định dạng tựa URI (ví dụ: `file:///logs/today.log`, `postgres://schema/users`).
3. **Prompts (Các mẫu prompt chuẩn hóa):**
   - Các template prompt được thiết kế sẵn bởi server để hướng dẫn Agent thực hiện một tác vụ cụ thể một cách tối ưu nhất.
   - Ví dụ: prompt hướng dẫn review code, prompt mẫu viết SQL truy vấn dữ liệu an toàn.

---

## 3. Quy trình tự động khám phá công cụ (Discovery Flow)

Một trong những ưu điểm vượt trội nhất của MCP là khả năng **tự động khám phá công cụ lúc runtime (dynamic discovery)**. Agent không cần biết trước tool tồn tại trong mã nguồn cứng, nó tự truy vấn server để lấy danh sách.

```
MCP Client                                                  MCP Server
    │                                                           │
    │ 1. Khởi tạo kết nối (Initialize handshake)                │
    ├──────────────────────────────────────────────────────────>│
    │ <─────────────────────────────────────────────────────────┤
    │                                                           │
    │ 2. Gọi tools/list (Query capabilities)                    │
    ├──────────────────────────────────────────────────────────>│
    │ <─────────────────────────────────────────────────────────┤ (Trả về danh sách Tools + JSON Schemas)
    │                                                           │
    │ 3. Đọc Schemas & chọn tool phù hợp                        │
    │                                                           │
    │ 4. Gọi tools/call (Invoke tool với arguments)             │
    ├──────────────────────────────────────────────────────────>│
    │                                                           │ (Thực thi code nghiệp vụ)
    │ <─────────────────────────────────────────────────────────┤ (Trả về kết quả chuẩn hóa JSON)
    │                                                           │
```

### 3.1 Chi tiết bản tin JSON-RPC trao đổi:

**Client gửi yêu cầu truy vấn danh sách công cụ (`tools/list`):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/list",
  "id": 1
}
```

**Server trả lời danh sách các công cụ có sẵn kèm schema tham số:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "tools": [
      {
        "name": "search_policy",
        "description": "Tìm kiếm chính sách hoàn trả hoặc bảo hành của công ty dựa trên từ khóa.",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "string",
              "description": "Từ khóa tìm kiếm (ví dụ: hoàn tiền, đổi trả)"
            },
            "user_role": {
              "type": "string",
              "enum": ["customer", "support_staff", "admin"],
              "description": "Vai trò của người dùng để lọc chính sách phù hợp"
            }
          },
          "required": ["query", "user_role"]
        }
      }
    ]
  },
  "id": 1
}
```

**Client gọi thực thi công cụ (`tools/call`):**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "search_policy",
    "arguments": {
      "query": "hoàn tiền 7 ngày",
      "user_role": "customer"
    }
  },
  "id": 2
}
```

**Server thực thi nghiệp vụ phía sau và trả về kết quả chuẩn hóa:**
```json
{
  "jsonrpc": "2.0",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[Chính sách hoàn tiền] Khách hàng vãng lai được đổi trả hoàn tiền trong 7 ngày kể từ ngày nhận hóa đơn nếu sản phẩm chưa bóc hộp."
      }
    ]
  },
  "id": 2
}
```

---

## 4. Lợi ích của việc tích hợp hệ thống qua MCP

1. **Khớp nối lỏng (Decoupled Architecture):**
   - Đội ngũ phát triển API/Công cụ chỉ cần tập trung xây dựng và cập nhật trên MCP Server.
   - Phía phát triển AI Agent (MCP Client) không cần sửa đổi bất kỳ dòng code logic nào khi server cập nhật tính năng bên trong hay thêm tool mới.
2. **Khả năng mở rộng dạng lắp ghép (Modular Scaling):**
   - Muốn thêm một năng lực mới cho hệ thống? Chỉ cần deploy thêm một MCP Server độc lập và cấu hình địa chỉ IP/Stdio cho Agent kết nối. Hệ thống tự động khám phá ra năng lực mới.
3. **Traceability và Audit dễ dàng (Giám sát tập trung):**
   - Mọi truy vấn công cụ đi qua giao thức MCP đều được đóng gói dưới dạng JSON-RPC chuẩn hóa. Điều này cho phép xây dựng một hệ thống monitor tập trung (như LangSmith hoặc các ELK stack) để audit chính xác: *"Agent nào đã gọi tool gì, lúc nào, với tham số nào và mất bao lâu?"*
4. **Bảo mật và Ranh giới tin cậy (Security Boundaries):**
   - MCP Server đóng vai trò như một firewall. Agent không trực tiếp chạm vào database hay file hệ thống. Nó chỉ có quyền gọi các API do Server công bố công khai. Server có quyền kiểm tra, validate tham số trước khi thực thi lệnh thật.
