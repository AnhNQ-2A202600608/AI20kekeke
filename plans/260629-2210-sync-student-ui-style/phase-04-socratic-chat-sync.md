---
phase: 4
title: Socratic Chat Sync
status: completed
priority: P1
dependencies:
  - 1
  - 3
---

# Phase 4: Socratic Chat Sync

## Overview

Restyle the Socratic AI chat page to match EduGap's current learning workspace while preserving full-height chat ergonomics, scroll lock, history sidebar, modes, message sending, slide viewer, and feedback actions.

## Requirements

- Functional: no changes to `useSocraticChat` state semantics, message send flow, slide retrieval, or feedback handlers.
- Non-functional: chat should feel like the same product as `/app`, but remain a purpose-built chat workspace.
- Responsive: mobile sidebar, slide panel, input bar, and mode selector must remain usable.
- Accessibility: maintain button labels, focus states, and scrollable regions.

## Architecture

Do not force chat into `/app` day rail layout. Instead apply the style language to chat chrome:

```text
SocraticChatTab
  full-height bg-background shell
  tactile top bar with Sofi/avatar + active concept + Elo pill
  compact tactile mode selector
  chat messages with EduGap bubble/card styling
  tactile input bar
  slide viewer as learning resource panel
```

## Related Code Files

- Modify: `frontend/components/dashboard/socratic-chat/index.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/chat-sidebar.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/chat-input-bar.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`
- Modify: `frontend/components/dashboard/socratic-chat/components/slide-viewer.tsx`
- Reference: `frontend/app/components/quiz-app-shell.tsx`
- Reference: `frontend/app/components/dashboard-layout.tsx`
- Preserve: `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`

## Implementation Steps

1. Replace the chat root gradient-heavy background with the calmer `/app` avocado/surface system.
2. Restyle the chat top bar:
   - EduGap learning panel feel
   - active concept title
   - Elo/style pills
   - compact mode selector
3. Update chat sidebar to use tactile list rows and consistent active states.
4. Update `AIMessageItem` and user message bubbles:
   - AI messages as white tactile learning cards
   - source/citation/action controls as compact buttons
   - avoid large decorative gradients
5. Update typing indicator to use Sofi/avatar plus tactile loading panel.
6. Update `ChatInputBar` to match tactile input/submit controls and preserve disabled/typing states.
7. Update `SlideViewer` as a learning resource panel with tactile header and compact slide cards.
8. Re-test body scroll lock and mobile overlay behavior after styling changes.

## Success Criteria

- [ ] Chat page visually aligns with `/app` but remains full-height and chat-first.
- [ ] Message send, history load/delete, mode switch, slide open/close, and feedback actions still work.
- [ ] Mobile sidebar and slide viewer still open/close correctly.
- [ ] Body/page scroll lock remains intact when chat is active.
- [ ] No text or controls overlap at desktop or mobile sizes.

## Risk Assessment

- Risk: chat full-height layout regresses due to added shell spacing. Mitigation: keep `h-[100dvh]`, `min-h-0`, and overflow boundaries unchanged.
- Risk: mode selector wraps poorly. Mitigation: keep horizontal overflow and stable min heights.
- Risk: slide viewer becomes visually heavy. Mitigation: style panel chrome, not slide content.
