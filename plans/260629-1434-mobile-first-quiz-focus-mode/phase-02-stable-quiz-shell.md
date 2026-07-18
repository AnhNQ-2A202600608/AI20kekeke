---
phase: 2
title: "Stable Quiz Shell"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Stable Quiz Shell

## Overview

Stabilize the mobile shell so answer submission adds feedback inside a predictable slot instead of pushing the whole page into a new scroll position.

## Requirements

- Functional: question, answers, feedback slot, and footer must remain reachable on small mobile viewports.
- Non-functional: one scroll owner on mobile; no horizontal scroll; safe-area bottom remains respected.

## Architecture

Use a fixed quiz card shell inside `QuizWorkspace`, with internal sections:

```text
progress strip
compact header
scrollable content area
reserved feedback slot
sticky action footer
```

Avoid nested `overflow-hidden` chains that trap content. If a section must scroll, it should be the content body, not the whole app and not the footer.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Read: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-results.tsx`

## Implementation Steps

1. Review current `h-dvh`, `min-h-dvh`, and `overflow-hidden` chain in `QuizWorkspace`.
2. Keep viewport lock only at the app shell; make quiz body the intentional scroll owner.
3. Reduce mobile header density:
   - keep close button and `Câu x/y`
   - move source, Elo, share, report into compact secondary row or icon-only controls
   - avoid wrapping telemetry into multiple tall rows
4. Give answer buttons stable min heights but avoid excessive submitted-state height.
5. Add a reserved feedback area after answer choices with bounded spacing so post-submit content does not create a large jump.
6. Keep footer height predictable and make the primary CTA fill available mobile width.

## Success Criteria

- [x] Mobile has one clear scroll owner.
- [x] Footer does not move off-screen because feedback appears.
- [x] Header remains one compact visual block at `240x465`.
- [x] Answer option states do not resize dramatically after submit.
- [x] Desktop shell remains equivalent or improved.

## Risk Assessment

- Risk: changing scroll ownership can clip content on very small screens. Mitigation: verify `240x465` and allow content body scrolling.
- Risk: moving telemetry reduces transparency. Mitigation: keep it available as secondary compact metadata, not removed.
