---
phase: 2
title: "Header And Hint UI"
status: completed
priority: P1
dependencies: [1]
---

# Phase 2: Header And Hint UI

## Overview

Restore the useful parts of the illustrated top learning panel and move hints into the answer flow without making the page text-heavy.

## Requirements

- Functional: desktop top status shows brand/context/progress/streak/Elo/report/share.
- Functional: mobile status remains compact and readable.
- Functional: hint ladder is visible near options and unlocks progressively.
- Non-functional: avoid long coach copy before answer; no permanent right panel competing with the question.

## Architecture

Use progressive disclosure:

```text
answering:
  top status + question + options + compact hint ladder
selected:
  top status + option selected + compact confirmation footer
reviewing:
  top status + result + explanation + optional AI affordance
```

Keep Sofi as a compact affordance before answer. The full Socratic sheet remains overlay/drawer via `SocraticSidebarView`.

## Related Code Files

- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/quiz-question-view.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/quiz-workspace.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/hooks/useSocraticSidebar.ts`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/quiz/socratic-sidebar-view.tsx`
- Inspect: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/brand/sofi-mascot.tsx`

## Implementation Steps

1. Add or refactor a compact status area inside the quiz card/shell:
   - `Câu X/Y`
   - topic/source
   - difficulty
   - progress label/bar
   - streak
   - Elo
   - report and share actions
2. Desktop: show full labels when space allows.
3. Mobile: collapse low-priority labels into icon buttons or short text.
4. Replace `AI Hint (3)` with learning-language copy:
   - `Mở gợi ý 1`
   - `Gợi ý còn lại: 2`
   - `Đã dùng 1/3 gợi ý`
5. Render hint chips as a ladder:
   - Hint 1: `Gợi ý nhẹ`
   - Hint 2: `Định hướng`
   - Hint 3: `Gần đáp án`
6. Unlock next hint only after previous hint is opened.
7. Demote `Chưa biết? Xem đáp án`:
   - Before hints: do not show it.
   - After enough hint use: show `Bỏ qua & xem giải thích` as secondary.
8. Keep hint content short and collapsed by default if it would push options/CTA below the fold on small screens.

## Success Criteria

- [x] Top status is useful on desktop and compact on mobile.
- [x] Hint controls sit near options, not only in footer.
- [x] Copy explains hint behavior without large paragraphs.
- [x] `Chưa biết? Xem đáp án` no longer appears as the first escape hatch.
- [x] Sofi pre-answer affordance is compact and does not compete with options.

## Risk Assessment

- Risk: Header reintroduces vertical crowding. Mitigation: use one compact row on mobile and hide non-critical labels.
- Risk: Hint penalty copy adds anxiety/noise. Mitigation: keep penalty text secondary and factual, e.g. `Ảnh hưởng điểm luyện tập`.
- Risk: Too much mascot content. Mitigation: pre-answer Sofi max one short bubble or collapsed trigger.
