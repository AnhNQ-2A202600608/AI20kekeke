---
phase: 4
title: "AI Tutor Sheet"
status: completed
priority: P2
dependencies: [3]
---

# Phase 4: AI Tutor Sheet

## Overview

Make AI Tutor a focused secondary sheet that supports the quiz without moving or crowding the primary quiz surface.

## Requirements

- Functional: AI Tutor opens from hint/action controls, preserves prepared wrong-answer prompt, sends messages, shows citations, and closes cleanly.
- Non-functional: sheet must respect safe-area bottom, keep input usable, and avoid excessive header chrome on mobile.

## Architecture

`SocraticSidebarView` remains an overlay bottom sheet. The quiz card behind it should not reflow. Sheet internals should prioritize:

```text
pull handle + compact title
message list
input
secondary metadata collapsed or compact
```

Hint count and Elo penalty should be visible but not consume a full card-like block on very small screens.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`

## Implementation Steps

1. Verify open/close sources:
   - footer AI Tutor button
   - wrong-answer prepared prompt action
   - hint-related interactions
2. Compress sheet header:
   - remove nonessential "Focus Sheet" label on very small screens
   - keep title, close, and hint count compact
3. Keep citation expansion available but collapsed by default.
4. Ensure `openSocraticWithDraft(wrongAnswerPrompt)` still populates the input/draft flow.
5. Keep overlay click close and explicit close button.
6. Test body scroll and input focus behavior with `82dvh` sheet height; adjust only if needed.

## Success Criteria

- [x] AI Tutor opens without changing quiz card layout behind it.
- [x] Wrong-answer prepared prompt remains wired to the same action.
- [x] Message list and input are usable on `240x465`.
- [x] Hint penalty remains visible but compact.
- [x] Citations remain accessible without occupying default vertical space.

## Risk Assessment

- Risk: making metadata compact weakens penalty transparency. Mitigation: keep penalty text visible when hint count > 0.
- Risk: sheet input is obscured by mobile browser UI. Mitigation: preserve safe-area padding and verify in browser.
