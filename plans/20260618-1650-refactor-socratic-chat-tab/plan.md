# Refactor SocraticChatTab - Plan Overview

Refactoring the 1,850 line `SocraticChatTab` God Component to comply with the 200-line limit and improve code maintainability.

## Status: IN_PROGRESS

## Phases
1. **Phase 1: Research & Planning** [COMPLETED] - Analyzed state, render branches, and dependencies.
2. **Phase 2: Extract Parser & Hooks** [PENDING] - Extract parsing utilities and main state management hook `useSocraticChat`.
3. **Phase 3: Extract Subcomponents** [PENDING] - Create `chat-sidebar`, `chat-input-bar`, `ai-message-item`, and `slide-viewer`.
4. **Phase 4: Integrate & Verify** [PENDING] - Build coordinates in `index.tsx`, update parent imports, delete the monolithic file, run build & lint.

## Key Files to Modify/Create
- [NEW] [parser.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/utils/parser.ts)
- [NEW] [useSocraticChat.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts)
- [NEW] [chat-sidebar.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx)
- [NEW] [chat-input-bar.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx)
- [NEW] [ai-message-item.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx)
- [NEW] [slide-viewer.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/components/slide-viewer.tsx)
- [NEW] [index.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat/index.tsx)
- [MODIFY] [dashboard-layout.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx)
- [DELETE] [socratic-chat-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/socratic-chat-tab.tsx)
