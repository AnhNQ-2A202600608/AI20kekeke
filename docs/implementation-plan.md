# Implementation Plan — VAIC AI Agent Starter Template

> Version: 1.0  
> Date: 2026-07-15  
> Status: AWAITING APPROVAL  

---

## 1. Hiện Trạng Repository

### 1.1 Tình trạng

| Item | Status |
|------|--------|
| Thư mục gốc | `D:\code\AI20kekeke` |
| Nội dung | **TRỐNG** — không có file nào trước phiên này |
| Git | Vừa khởi tạo (`git init`), chưa có commit |
| Branch | `master` (mặc định) |
| Secret bị commit | **KHÔNG** — repo trống |
| File cấu hình | Chưa có (trừ `.env.example` vừa tạo) |
| package.json | Chưa có |
| pyproject.toml | Chưa có |
| requirements.txt | Chưa có |
| Dockerfile | Chưa có |
| docker-compose.yml | Chưa có |
| .gitignore | Chưa có |
| README.md | Chưa có |
| Tests | Chưa có |
| CI workflows | Chưa có |

### 1.2 Môi trường phát triển (đã xác nhận)

| Tool | Version |
|------|---------|
| Python | 3.11.4 |
| pip | 26.1.2 |
| Node.js | 22.16.0 |
| npm | 10.9.2 |
| pnpm | **Chưa cài** |
| Docker | 28.1.1 |
| Docker Compose | 2.35.1-desktop.1 |
| OS | Windows |

### 1.3 Python packages có sẵn globally (KHÔNG nhất thiết dùng — sẽ tạo venv riêng)

| Package | Version |
|---------|---------|
| FastAPI | 0.115.0 |
| LangGraph | 1.2.7 |
| langchain-core | 1.4.8 |

---

## 2. Mục Tiêu Sản Phẩm

**VAIC AI Agent Starter Template** là một boilerplate project cho phép developer nhanh chóng xây dựng AI agent application với:

- **Backend**: FastAPI + LangGraph agent
- **Frontend**: Next.js chat interface
- **Extensibility**: Tool registry, nhiều LLM provider
- **Observability**: Audit logging, source references
- **Deployment**: Docker Compose ready

### 2.1 Đối tượng sử dụng

- Developer cần scaffold nhanh một AI agent project.
- Team muốn có baseline architecture cho agent-based application.

### 2.2 Giá trị cốt lõi

1. Chạy được trong < 5 phút sau clone.
2. Stub LLM cho phép phát triển không cần API key.
3. Kiến trúc rõ ràng, dễ mở rộng.
4. Có test cơ bản từ đầu.

---

## 3. Kiến Trúc MVP

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ Chat UI  │  │ Message  │  │ Source References  │  │
│  │          │  │ Stream   │  │                    │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / SSE
┌──────────────────────▼──────────────────────────────┐
│                  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │ /chat    │  │ /health  │  │ Audit Logger      │  │
│  │ endpoint │  │          │  │                    │  │
│  └────┬─────┘  └──────────┘  └───────────────────┘  │
│       │                                              │
│  ┌────▼─────────────────────────────────────────┐   │
│  │           LangGraph Agent                     │   │
│  │  ┌────────────┐  ┌────────────────────────┐  │   │
│  │  │ LLM Node   │  │ Tool Execution Node    │  │   │
│  │  │ (Provider) │  │                        │  │   │
│  │  └────────────┘  └────────────────────────┘  │   │
│  └──────────────────────────────────────────────┘   │
│       │                                              │
│  ┌────▼─────────────────────────────────────────┐   │
│  │           Tool Registry                       │   │
│  │  ┌─────────────┐  ┌─────────────────────┐   │   │
│  │  │ Read Tool 1 │  │ Read Tool 2         │   │   │
│  │  │ (echo/info) │  │ (datetime/system)   │   │   │
│  │  └─────────────┘  └─────────────────────┘   │   │
│  └──────────────────────────────────────────────┘   │
│       │                                              │
│  ┌────▼──────┐                                       │
│  │ SQLite DB │                                       │
│  └───────────┘                                       │
└─────────────────────────────────────────────────────┘
```

### 3.1 Cấu trúc thư mục dự kiến (MVP)

```
AI20kekeke/
├── .env.example
├── .gitignore
├── PROJECT_STATUS.md
├── README.md
├── docker-compose.yml            # Phase 4
├── docs/
│   ├── implementation-plan.md
│   └── architecture/
│       └── mvp-scope.md
├── backend/
│   ├── Dockerfile                # Phase 4
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # FastAPI entry point
│   │   ├── config.py             # Settings / env loading
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── routes/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── chat.py       # POST /chat, SSE streaming
│   │   │   │   └── health.py     # GET /health
│   │   │   └── deps.py           # Dependency injection
│   │   ├── agent/
│   │   │   ├── __init__.py
│   │   │   ├── graph.py          # LangGraph agent definition
│   │   │   ├── nodes.py          # Agent nodes (llm_node, tool_node)
│   │   │   └── state.py          # Agent state schema
│   │   ├── llm/
│   │   │   ├── __init__.py
│   │   │   ├── base.py           # Abstract LLM provider
│   │   │   ├── stub.py           # Stub provider (no API key)
│   │   │   └── factory.py        # Provider factory
│   │   ├── tools/
│   │   │   ├── __init__.py
│   │   │   ├── registry.py       # Tool registry
│   │   │   ├── echo_tool.py      # Read tool 1
│   │   │   └── datetime_tool.py  # Read tool 2
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py       # SQLite connection
│   │   │   ├── models.py         # SQLAlchemy models
│   │   │   └── audit.py          # Audit logger
│   │   └── schemas/
│   │       ├── __init__.py
│   │       ├── chat.py           # Request/Response schemas
│   │       └── common.py         # Shared schemas
│   └── tests/
│       ├── __init__.py
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_chat.py
│       └── test_smoke.py         # E2E smoke test
├── frontend/
│   ├── Dockerfile                # Phase 4
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── public/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── SourceReference.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   └── lib/
│   │       └── api.ts
│   └── __tests__/                # Optional in MVP
└── data/                         # SQLite DB files (gitignored)
```

---

## 4. Các Phase Triển Khai

### Phase 1 — Backend Core

**Mục tiêu**: FastAPI server chạy được, có health endpoint, stub LLM, LangGraph agent tối giản, 2 tools, audit log cơ bản.

**Files tạo/sửa**:
- `.gitignore` — NEW
- `README.md` — NEW
- `backend/pyproject.toml` — NEW
- `backend/requirements.txt` — NEW
- `backend/app/__init__.py` — NEW
- `backend/app/main.py` — NEW
- `backend/app/config.py` — NEW
- `backend/app/api/__init__.py` — NEW
- `backend/app/api/routes/__init__.py` — NEW
- `backend/app/api/routes/health.py` — NEW
- `backend/app/api/routes/chat.py` — NEW
- `backend/app/api/deps.py` — NEW
- `backend/app/agent/__init__.py` — NEW
- `backend/app/agent/graph.py` — NEW
- `backend/app/agent/nodes.py` — NEW
- `backend/app/agent/state.py` — NEW
- `backend/app/llm/__init__.py` — NEW
- `backend/app/llm/base.py` — NEW
- `backend/app/llm/stub.py` — NEW
- `backend/app/llm/factory.py` — NEW
- `backend/app/tools/__init__.py` — NEW
- `backend/app/tools/registry.py` — NEW
- `backend/app/tools/echo_tool.py` — NEW
- `backend/app/tools/datetime_tool.py` — NEW
- `backend/app/db/__init__.py` — NEW
- `backend/app/db/database.py` — NEW
- `backend/app/db/models.py` — NEW
- `backend/app/db/audit.py` — NEW
- `backend/app/schemas/__init__.py` — NEW
- `backend/app/schemas/chat.py` — NEW
- `backend/app/schemas/common.py` — NEW
- `backend/tests/__init__.py` — NEW
- `backend/tests/conftest.py` — NEW
- `backend/tests/test_health.py` — NEW
- `backend/tests/test_chat.py` — NEW

**Dependencies dự kiến** (trong venv):
```
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
langgraph>=1.2.0
langchain-core>=1.4.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
sqlalchemy>=2.0.0
aiosqlite>=0.20.0
python-dotenv>=1.0.0
httpx>=0.27.0          # for testing
pytest>=8.0.0
pytest-asyncio>=0.23.0
```

**Tiêu chí nghiệm thu (Gate 1)**:
- [ ] `GET /health` trả về `200 {"status": "ok"}`.
- [ ] `POST /chat` với stub LLM trả về streaming response.
- [ ] Agent gọi được tool thông qua registry.
- [ ] Audit log ghi được conversation vào SQLite.
- [ ] `pytest backend/tests/` pass 100%.
- [ ] Server khởi động trong < 5 giây.

---

### Phase 2 — Frontend Core

**Mục tiêu**: Next.js chat UI kết nối được với backend, streaming messages, multi-turn context, source references.

**Files tạo/sửa**:
- `frontend/package.json` — NEW
- `frontend/next.config.js` — NEW (hoặc `.mjs`)
- `frontend/tsconfig.json` — NEW
- `frontend/src/app/layout.tsx` — NEW
- `frontend/src/app/page.tsx` — NEW
- `frontend/src/app/globals.css` — NEW
- `frontend/src/components/ChatWindow.tsx` — NEW
- `frontend/src/components/MessageBubble.tsx` — NEW
- `frontend/src/components/ChatInput.tsx` — NEW
- `frontend/src/components/SourceReference.tsx` — NEW
- `frontend/src/hooks/useChat.ts` — NEW
- `frontend/src/lib/api.ts` — NEW

**Dependencies dự kiến**:
```
next@latest
react@latest
react-dom@latest
typescript
@types/react
@types/react-dom
@types/node
```

**Tiêu chí nghiệm thu (Gate 2)**:
- [ ] `npm run dev` khởi động không lỗi.
- [ ] Chat UI hiển thị và gửi message được.
- [ ] Streaming response hiển thị real-time.
- [ ] Multi-turn: context giữ qua các lượt chat.
- [ ] Source references hiển thị khi có.
- [ ] Responsive trên desktop.

---

### Phase 3 — Integration & E2E Test

**Mục tiêu**: Backend + Frontend chạy cùng nhau, smoke test end-to-end pass.

**Files tạo/sửa**:
- `backend/tests/test_smoke.py` — NEW
- `PROJECT_STATUS.md` — UPDATE
- `README.md` — UPDATE (hướng dẫn chạy)

**Tiêu chí nghiệm thu (Gate 3)**:
- [ ] Backend + Frontend chạy đồng thời, giao tiếp thành công.
- [ ] Smoke test: gửi message → nhận streaming response → verify content.
- [ ] Audit log ghi đầy đủ.
- [ ] Không có lỗi console (backend hoặc frontend).

---

### Phase 4 — Docker Compose

**Mục tiêu**: Containerize cả backend và frontend, chạy bằng `docker compose up`.

**Files tạo/sửa**:
- `backend/Dockerfile` — NEW
- `frontend/Dockerfile` — NEW
- `docker-compose.yml` — NEW
- `.dockerignore` — NEW
- `PROJECT_STATUS.md` — UPDATE
- `README.md` — UPDATE

**Tiêu chí nghiệm thu (Gate 4)**:
- [ ] `docker compose build` thành công.
- [ ] `docker compose up` khởi động cả 2 service.
- [ ] Chat flow hoạt động qua Docker.
- [ ] Smoke test pass trong Docker.

---

## 5. Dependency Dự Kiến (Tổng hợp)

### Backend (Python 3.11+)

| Package | Mục đích | Phase |
|---------|----------|-------|
| fastapi | Web framework | 1 |
| uvicorn[standard] | ASGI server | 1 |
| langgraph | Agent orchestration | 1 |
| langchain-core | LLM abstractions | 1 |
| pydantic | Data validation | 1 |
| pydantic-settings | Config management | 1 |
| sqlalchemy | ORM | 1 |
| aiosqlite | Async SQLite | 1 |
| python-dotenv | Env loading | 1 |
| httpx | HTTP client / testing | 1 |
| pytest | Testing | 1 |
| pytest-asyncio | Async testing | 1 |

### Frontend (Node 22+)

| Package | Mục đích | Phase |
|---------|----------|-------|
| next | React framework | 2 |
| react | UI library | 2 |
| react-dom | DOM rendering | 2 |
| typescript | Type safety | 2 |

---

## 6. Rủi Ro

| # | Rủi ro | Mức độ | Giảm thiểu |
|---|--------|--------|------------|
| R1 | LangGraph API thay đổi giữa version | MEDIUM | Pin version trong requirements.txt |
| R2 | Global packages xung đột với venv | LOW | Luôn dùng venv, không dùng global |
| R3 | SQLite lock khi concurrent requests | LOW | Chỉ dùng cho dev, document rõ giới hạn |
| R4 | Next.js version breaking changes | LOW | Pin version trong package.json |
| R5 | Docker build chậm trên Windows | MEDIUM | Multi-stage build, .dockerignore tốt |
| R6 | SSE streaming không ổn định qua proxy | MEDIUM | Test trực tiếp trước, document proxy config |
| R7 | pnpm không có sẵn | LOW | Dùng npm thay thế (đã quyết định AD-7) |

---

## 7. Những Phần Cố Ý Hoãn

Các thành phần sau **KHÔNG** nằm trong MVP, sẽ triển khai ở phase sau khi có nhu cầu:

| Item | Lý do hoãn |
|------|-----------|
| Redis | Chưa cần caching/pub-sub cho MVP |
| Vector database | Chưa có use case RAG cụ thể |
| RAG pipeline | Cần use case cụ thể trước |
| Nhiều LLM provider hoàn chỉnh | Stub đủ cho development |
| Kubernetes | Docker Compose đủ cho starter |
| Dashboard monitoring phức tạp | Audit log text đủ cho MVP |
| Nhiều workflow CI | Chưa cần automated CI ở phase đầu |
| Full MCP infrastructure | Quá phức tạp cho starter template |
| PostgreSQL production migration | SQLite đủ cho development |
| Presentation kit | Không cần thiết cho template |
| 15-node Agent graph | 2-3 node đủ cho MVP |

---

## 8. Chiến Lược Rollback

### Nguyên tắc

- Mỗi phase kết thúc bằng một git commit có tag.
- Nếu phase thất bại, rollback về commit cuối của phase trước.
- Không xóa file đã hoạt động khi thử nghiệm tính năng mới.

### Quy trình

```
Phase 1 hoàn thành → git tag v0.1.0-backend
Phase 2 hoàn thành → git tag v0.2.0-frontend
Phase 3 hoàn thành → git tag v0.3.0-integration
Phase 4 hoàn thành → git tag v0.4.0-docker
```

### Rollback command

```bash
# Nếu Phase N thất bại, quay về Phase N-1:
git reset --hard v0.(N-1).0-<label>
```

---

## 9. Checkpoint Cho Phiên Sau

Phiên sau cần đọc:
1. `PROJECT_STATUS.md` — trạng thái tổng quan.
2. `docs/implementation-plan.md` — kế hoạch chi tiết.
3. `docs/architecture/mvp-scope.md` — phạm vi kiến trúc.
4. `.env.example` — template biến môi trường.

Không cần đọc lịch sử chat. Tất cả thông tin đã được ghi lại trong các file trên.
