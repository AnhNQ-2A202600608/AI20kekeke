# Phase 04 — Frontend Toast Flow

## Context Links

- Quiz component: `frontend/components/quiz/quiz-question-view.tsx`
- Quiz hooks: `frontend/app/hooks/useQuizSession.ts`, `frontend/app/hooks/useSocraticSidebar.ts`
- Design guidelines: `docs/product/design-guidelines.md`

## Overview

Priority: Medium  
Status: planned

Add non-blocking toast fallback UX in chat and quiz. Reuse existing skip/unknown answer behavior where possible.

## Requirements

- Show toast when backend metadata contains `show_direct_fallback_prompt`.
- Toast must not block typing, answer selection, or navigation.
- Actions:
  - `Xem lời giải`: request direct fallback, mark quiz attempt skipped/no-score.
  - `Tiếp tục gợi ý`: dismiss toast and increase scaffolding if supported.
- Apply to both chat tutor and quiz UI.
- Avoid making `quiz-question-view.tsx` much larger if hook extraction is available.

## Architecture

Prefer a small hook for toast state and actions if both chat and quiz need it:

```typescript
useAdaptiveFallbackToast({ onAcceptFallback, onContinueHint })
```

Quiz can reuse existing `unknown`/skip path but must ensure status becomes `skipped` and no score.

## Related Code Files

- Modify: `frontend/components/quiz/quiz-question-view.tsx`
- Modify: `frontend/app/hooks/useQuizSession.ts`
- Modify chat component/hook after locating current chat UI.
- Possibly add shared hook/component if duplication appears.

## Implementation Steps

1. Locate current toast system or notification component.
2. Add fallback toast state and copy.
3. Wire quiz `Xem lời giải` to skipped/no-score direct fallback request.
4. Wire chat `Xem lời giải` to `force_direct_mode: true` request.
5. Wire dismiss/continue action to normal Socratic scaffolding.
6. Ensure mobile layout remains usable.

## Todo List

- [ ] Locate chat UI and toast infrastructure.
- [ ] Add fallback toast rendering.
- [ ] Add accept fallback handler for quiz.
- [ ] Add accept fallback handler for chat.
- [ ] Add continue/dismiss handler.
- [ ] Test mobile and desktop interaction.

## Success Criteria

- Toast appears from backend metadata.
- Toast is dismissible and non-blocking.
- Accepting fallback shows direct solution and records skipped/no-score in quiz.
- Continuing keeps Socratic flow.

## Risk Assessment

- Component is already large. Extract only if it reduces duplication now.
- Existing “Chưa biết” button may overlap. Align copy and behavior rather than duplicating concepts.

## Security Considerations

- Do not let frontend alone decide scoring; backend must enforce skipped/no-score.
- Do not expose raw telemetry reasons if copy may stigmatize the student.

## Next Steps

Run UI validation after backend contract is implemented.
