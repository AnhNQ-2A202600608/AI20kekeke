# Plan: Socratic AI & RAG Frontend Integration

## Overview
Connect the split-screen quiz interface and RAG chat portal into the Next.js frontend.

## Phases
1. **Phase 1: LeftBar Navigation Update** - Add 'chat' tab to LeftBar.tsx.
2. **Phase 2: RAG Chat Tab Component** - Create `socratic-chat-tab.tsx` based on `socratic_rag_duolingo_edition`.
3. **Phase 3: Quiz Split-Screen Update** - Refactor the quiz rendering in `page.tsx` to include the Socratic AI sidebar.
4. **Phase 4: API Integration** - Connect the chat box to `/api/v1/chat`.
5. **Phase 5: Verification & Verification Checks** - Build and manually check features.

## Files to Modify
- [LeftBar.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LeftBar.tsx)
- [page.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/page.tsx)
- [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx) [NEW]
