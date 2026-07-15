# MVP Scope — VAIC AI Agent Starter Template

> Version: 1.0  
> Date: 2026-07-15  

---

## 1. Tổng Quan

Document này xác định chính xác những gì **NẰM TRONG** và **KHÔNG NẰM TRONG** phạm vi MVP của VAIC AI Agent Starter Template.

---

## 2. Trong Phạm Vi MVP (IN SCOPE)

### 2.1 Backend — FastAPI

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| FastAPI server | Entry point, CORS, middleware | Low |
| Health endpoint | `GET /health` → `{"status": "ok"}` | Trivial |
| Chat endpoint | `POST /chat` → SSE streaming response | Medium |
| Config | Pydantic Settings, .env loading | Low |
| Error handling | Global exception handler | Low |

### 2.2 Agent — LangGraph

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| Agent graph | 2-3 nodes: LLM → Tool → Response | Medium |
| Agent state | Conversation state schema | Low |
| LLM node | Gọi LLM provider, quyết định dùng tool | Medium |
| Tool node | Thực thi tool từ registry | Low |

### 2.3 LLM Provider

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| Base provider | Abstract class / protocol | Low |
| Stub provider | Hardcoded responses, tool-aware | Low |
| Factory | Tạo provider từ config | Trivial |

### 2.4 Tool System

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| Tool registry | Register, list, execute tools | Low |
| Echo tool | Read tool: echo input hoặc trả info | Trivial |
| Datetime tool | Read tool: trả về datetime hiện tại | Trivial |

### 2.5 Database & Audit

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| SQLite connection | Async SQLite via aiosqlite | Low |
| Conversation model | Lưu conversation history | Low |
| Audit logger | Ghi log mỗi interaction | Low |

### 2.6 Frontend — Next.js

| Component | Mô tả | Complexity |
|-----------|--------|------------|
| Chat window | Container cho messages | Medium |
| Message bubble | Hiển thị user/assistant message | Low |
| Chat input | Text input + send button | Low |
| Source reference | Hiển thị tool sources | Low |
| useChat hook | SSE streaming, state management | Medium |
| API client | HTTP + SSE connection | Low |

### 2.7 Streaming

| Feature | Mô tả |
|---------|--------|
| SSE (Server-Sent Events) | Backend stream tokens via SSE |
| Real-time display | Frontend hiển thị tokens khi nhận |
| Connection handling | Reconnect on disconnect |

### 2.8 Multi-turn Context

| Feature | Mô tả |
|---------|--------|
| Conversation ID | Mỗi chat session có unique ID |
| Message history | Backend giữ history trong memory + DB |
| Context window | Gửi N messages gần nhất cho LLM |

### 2.9 Source References

| Feature | Mô tả |
|---------|--------|
| Tool call tracking | Ghi lại tools đã gọi |
| Source display | Frontend hiển thị tool results như source |

### 2.10 Testing

| Test | Mô tả |
|------|--------|
| Health test | Verify health endpoint |
| Chat test | Verify chat endpoint với stub |
| Smoke test | E2E: send message → receive response |

### 2.11 Docker (Phase 4)

| Component | Mô tả |
|-----------|--------|
| Backend Dockerfile | Python 3.11 slim image |
| Frontend Dockerfile | Node 22 alpine, multi-stage |
| docker-compose.yml | 2 services: backend + frontend |

---

## 3. KHÔNG Trong Phạm Vi MVP (OUT OF SCOPE)

> ⚠️ Các item dưới đây sẽ được triển khai ở phase sau khi có nhu cầu cụ thể.

| Item | Lý do loại |
|------|-----------|
| **Redis** | Không cần cache/pubsub cho MVP |
| **Vector database** (Pinecone, Chroma, etc.) | Chưa có use case RAG |
| **RAG pipeline** | Cần data source cụ thể |
| **Nhiều LLM provider hoàn chỉnh** (OpenAI, Google, Anthropic) | Stub đủ cho development |
| **Kubernetes** | Docker Compose đủ cho starter |
| **Monitoring dashboard** (Grafana, Prometheus) | Audit log text đủ |
| **CI/CD workflows** (GitHub Actions) | Sẽ thêm khi cần |
| **Full MCP infrastructure** | Quá phức tạp cho starter |
| **PostgreSQL** | SQLite đủ cho dev |
| **Authentication** (OAuth, JWT) | Không cần cho internal tool |
| **Rate limiting** | Không cần cho dev |
| **15-node agent graph** | 2-3 node đủ cho MVP demo |
| **Presentation kit** | Không liên quan đến template |
| **WebSocket** (thay cho SSE) | SSE đơn giản hơn, đủ cho MVP |
| **File upload** | Chưa có use case |
| **Multi-agent** | Single agent đủ cho MVP |

---

## 4. Ranh Giới Kỹ Thuật

### Backend giới hạn ở:
- **1 agent graph** (không multi-agent).
- **1 LLM provider active** tại một thời điểm.
- **2 tools** (read-only).
- **SQLite only** (không PostgreSQL migration).
- **In-memory conversation** + SQLite audit (không Redis session).

### Frontend giới hạn ở:
- **1 page** (chat page).
- **Desktop responsive** (không optimize mobile).
- **Không authentication UI**.
- **Không theme switching** (chỉ 1 theme).

### Infrastructure giới hạn ở:
- **Docker Compose** (không K8s).
- **Không CI/CD** trong MVP.
- **Không monitoring** ngoài logs.

---

## 5. Definition of Done (MVP)

MVP được coi là hoàn thành khi:

1. ✅ Clone repo → cài dependency → chạy trong < 5 phút.
2. ✅ `GET /health` trả 200.
3. ✅ Gửi message qua chat UI → nhận streaming response.
4. ✅ Agent có thể gọi tool và trả kết quả.
5. ✅ Multi-turn context hoạt động (nhớ context qua các lượt).
6. ✅ Source references hiển thị.
7. ✅ Audit log ghi được.
8. ✅ Smoke test pass.
9. ✅ Docker Compose chạy được.
10. ✅ README có hướng dẫn đầy đủ.
