# Plan: Connecting Frontend to Backend with Robust Fallbacks

This plan outlines the design and implementation steps for connecting the React/Next.js frontend to the FastAPI/LangGraph backend. It ensures the frontend remains fully functional using local mock data (fallback mode) if the backend is offline, unreachable, or returns server errors.

## Context & Requirements
1. **Proxy-first (BFF) Fallback Strategy**: Next.js Route Handlers act as a Backend-for-Frontend (BFF) to proxy API requests to the FastAPI backend.
2. **Backend Config**: Use the `BACKEND_API_URL` environment variable (defaulting to `http://127.0.0.1:8000`).
3. **Graceful Failures**: If the backend is unreachable or returns a server error, catch the failure in the Route Handler and return mock data with `is_fallback: true`.
4. **Client-Side Indicator**: Enhance the UI to show a subtle `[Offline Mode]` badge if the data is served via fallback.

## Proposed Changes

### 1. Configuration
- **Modify** `frontend/.env.example` to document `BACKEND_API_URL`.

### 2. Next.js API Routes (BFF)
- **Modify** `frontend/app/api/v1/chat/route.ts` to call FastAPI backend, falling back to Socratic chatbot mock.
- **Modify** `frontend/app/api/v1/adaptive/recommend/route.ts` to call FastAPI backend, falling back to MCQ mock.
- **Modify** `frontend/app/api/v1/adaptive/submit/route.ts` to call FastAPI backend, falling back to local grading & progression mock.

### 3. Client Components
- **Modify** `frontend/app/page.tsx` to pass dynamic student details and render the chat connection fallback.
- **Modify** `frontend/components/dashboard/socratic-chat-tab.tsx` to display an offline badge if `is_fallback` is returned.
- **Modify** `frontend/components/dashboard/ZpdWidget.tsx` to display an offline badge for ZPD challenge if `is_fallback` is returned.

## Verification Plan

### Manual Verification
1. **Scenario A: Backend Offline (FastAPI down)**
   - Verify that all widgets load without crashing and show `[Offline Mode]` badges.
   - Interact with the chat and MCQ widgets.
2. **Scenario B: Backend Online (FastAPI running)**
   - Start the FastAPI backend and confirm the routes are proxied correctly.
   - Verify that data updates are synced and the offline badges disappear.
