---
phase: 5
title: "Sofi Coach Popup And Validation"
status: completed
priority: P1
dependencies: [1, 2, 3, 4]
---

# Phase 5: Sofi Coach Popup And Validation

## Overview

Integrate Sofi as an on-demand coach popup/bottom sheet, not a permanent panel. Finish with lint/build and responsive visual validation for desktop and mobile.

## Requirements

- Functional: Sofi coach can open from a collapsed card or floating trigger.
- Functional: popup content uses active day/concept context.
- Functional: "Hỏi AI" or equivalent routes to existing AI/chat behavior without embedding permanent chat in the learning layout.
- Non-functional: popup must be keyboard accessible, dismissible, and safe-area aware.
- Non-functional: reduced motion disables or softens transitions.
- Non-functional: validation must confirm no sticky CTA/floating nav overlap.

## Architecture

```text
MobileLearningWorkspace
  SofiCoachTrigger
    collapsed coach card or floating action
  SofiCoachSheet
    SofiStateMascot
    active concept coach copy
    quick actions
      Explain concept
      Show simple example
      Ask AI / open chat
```

Use mascot assets from `frontend/components/mascot` when the Sofi asset plan is complete. If assets are absent, render a small brand mascot fallback or icon and keep layout intact.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/sofi-coach-trigger.tsx`
- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/sofi-coach-sheet.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LeftBar.tsx`
- Reuse: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/mascot/sofi-state-mascot.tsx`
- Reuse existing AI route/tab logic from `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useQuizSession.ts`

## Implementation Steps

1. Design trigger behavior:
   - mobile: collapsed Sofi card below preview, or small floating button if CTA spacing allows.
   - desktop: keep optional small trigger; do not add right panel.
2. Create `SofiCoachSheet`:
   - bottom sheet on mobile.
   - right-side popover/drawer on wider screens if used.
   - `aria-modal`, close button, escape/backdrop close.
3. Add contextual copy:
   - default: `Bạn đang xây nền tảng rất vững. Mình có thể giúp bạn hiểu concept này bằng ví dụ ngắn.`
   - token concept: `Tokenization là cách text được chia thành mảnh trước khi vào LLM.`
   - weak concept: encourage review without shaming.
4. Add quick actions:
   - `Giải thích dễ hiểu` updates local coach copy or opens existing chat prompt later.
   - `Cho ví dụ` updates local example.
   - `Hỏi AI` switches to existing `chat` tab or invokes existing AI drawer pattern.
5. Ensure no fake AI:
   - do not generate model responses unless wired to existing AI flow.
   - local quick actions may show static educational microcopy only.
6. Validation:
   - run `npm run lint`.
   - run `npm run build`.
   - browser check desktop and mobile viewport.
   - verify safe-area, sticky CTA, floating nav, and coach sheet do not overlap incoherently.
7. Document asset needs in final implementation notes if assets are missing.

## Success Criteria

- [x] Sofi is not a permanent panel.
- [x] Opening Sofi shows mascot/coach sheet with active concept context.
- [x] Closing Sofi restores learning screen without scroll/layout jumps.
- [x] Existing AI/chat remains reachable by user action.
- [x] Mobile sticky CTA stays easy to reach and not covered by coach/nav controls.
- [ ] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] Desktop and mobile screenshots show no incoherent overlap.

## Completion Notes

- Implemented `SofiCoachTrigger` and `SofiCoachSheet` as on-demand coach UI.
- `Hỏi AI` delegates to the existing chat tab through `LearningPath`/`DashboardLayout`.
- `npm run lint` remains blocked by an unrelated pre-existing issue in `frontend/components/quiz/quiz-question-view.tsx`; targeted lint for touched files passes.

## Asset Prompt

```text
Friendly scholarly fox mascot named Sofi, round glasses, dark green hoodie with small EduGap emblem, holding a notebook and pointing upward, warm encouraging expression, transparent background, full body, high quality 3D illustrated EdTech style.
```

## Risk Assessment

- Risk: sheet duplicates existing AI chat and confuses users.
  - Mitigation: Sofi sheet is coach launcher/context, not chat transcript.
- Risk: popup traps focus or blocks mobile CTA.
  - Mitigation: implement accessible modal behavior and test open/closed states.
- Risk: plan dependency on Sofi assets blocks UI work.
  - Mitigation: use fallback icon/brand mascot until WebP assets are finalized.
- Risk: browser runtime cannot inspect `/app` due local auth/onboarding state.
  - Mitigation: still run lint/build and capture any reachable route; if blocked, report exact limitation.
