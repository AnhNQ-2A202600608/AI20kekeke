---
phase: 3
title: "Integration Validation"
status: completed
priority: P1
dependencies: [1, 2]
---

# Phase 3: Integration Validation

## Overview

Wire the modal into the existing Socratic Chat state and verify it behaves correctly with the one-page chat layout, responsive constraints, TypeScript, and lint rules.

## Requirements

- Functional: active chat concept is reflected in graph trigger/modal.
- Functional: CTA actions either call existing handlers or are disabled/hidden with clear state.
- Functional: graph modal coexists with slide viewer, chat input, reasoning logs, and sidebar.
- Non-functional: no TypeScript/lint regressions.
- Non-functional: no document/body scroll regression.

## Architecture

Integration should stay at the Socratic Chat boundary:

- `useSocraticChat` remains the owner of active concept and practice handlers.
- Knowledge graph components receive plain props and callbacks.
- Avoid writing graph selection into global Zustand unless a later feature needs cross-page persistence.

Validation commands:

```bash
cd frontend
pnpm exec tsc --noEmit
pnpm exec eslint components/dashboard/socratic-chat/index.tsx components/dashboard/socratic-chat/components/knowledge-graph
```

If a local dev server is available, run manual UI checks on desktop and mobile widths.

## Related Code Files

- Modify: `frontend/components/dashboard/socratic-chat/index.tsx`
- Modify/create under: `frontend/components/dashboard/socratic-chat/components/knowledge-graph/`
- Verify: `frontend/app/page.tsx`
- Verify: `frontend/app/components/dashboard-layout.tsx`
- Verify: `frontend/app/globals.css`

## Implementation Steps

1. Pass active concept, skills, and practice/chat callbacks from Socratic Chat into the graph trigger/modal.
2. Ensure graph trigger does not overlap chat input at common viewports.
3. Verify modal overlay z-index works with sidebars and drawers.
4. Check keyboard flow:
   - trigger focusable
   - close button focusable
   - Escape closes modal
   - graph controls do not trap focus permanently
5. Check scroll behavior:
   - body/html remain locked in chat
   - modal internal content can scroll if needed
   - React Flow canvas does not scroll the page
6. Run focused TypeScript and ESLint commands.
7. Optional visual validation with browser screenshot if dev server is running.

## Success Criteria

- [x] Active concept marker updates when user changes concept.
- [x] CTAs do not navigate to broken states.
- [x] No overlap with input bar, sidebar, slide viewer, or reasoning logs.
- [x] Desktop and mobile modal layouts are usable.
- [x] Body/page scroll stays disabled on chat page.
- [x] `pnpm exec tsc --noEmit` passes.
- [x] Focused ESLint passes.

## Risk Assessment

- Risk: existing chat files have unrelated dirty changes.
  Mitigation: stage/commit only touched graph UI files when implementation happens.
- Risk: no frontend test runner exists for React Flow interactions.
  Mitigation: rely on TypeScript, ESLint, and manual/browser verification for this UI-only feature.
- Risk: future API graph shape differs.
  Mitigation: keep adapter source-agnostic and document expected fields.
