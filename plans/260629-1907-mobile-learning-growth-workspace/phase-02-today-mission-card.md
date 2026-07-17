---
phase: 2
title: "Today Mission Card"
status: completed
priority: P2
dependencies: [1]
---

# Phase 2: Today Mission Card

## Overview

Replace dry metric cards with a mission-first card that explains what the selected day is about and what the learner can finish today. Include a controlled illustration slot for the mountain/nature asset from the mockup without blocking implementation on asset availability.

## Requirements

- Functional: card reflects selected day, selected phase/track, available concept count, available set count, estimated time, and completion percent.
- Functional: estimated time can be derived locally, not backend-driven.
- Non-functional: card must stay above the fold on mobile and not exceed comfortable height.
- Non-functional: illustration must not cause CLS; use fixed dimensions and `alt=""` when decorative.

## Architecture

```text
MobileLearningWorkspace
  MobileTodayMissionCard
    mission copy from selectedDay
    metrics from existing computed values
    optional MountainMissionArt
```

The same mission card can later replace desktop stat cards, but phase 2 should prioritize mobile. Use CSS/SVG placeholder first, then allow an image prop/path if the asset is provided.

## Related Code Files

- Create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mobile-today-mission-card.tsx`
- Optional create: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/learning/mission-mountain-art.tsx`
- Modify: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/LearningPath.tsx`
- Optional asset path: `D:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/public/learning/mission-mountain.webp`

## Implementation Steps

1. Create `MobileTodayMissionCard` props:
   - `day`, `phase`, `track`, `conceptCount`, `practiceCount`, `completionPercent`.
2. Define copy:
   - eyebrow: `Today Mission` or Vietnamese equivalent `Nhiệm vụ hôm nay`.
   - title: `Day N · {day.title}`.
   - outcome: `day.outcome`, clamped to 2 lines.
3. Metrics:
   - concepts: `items.length`.
   - practice questions/sets: use available set count; label as `bài luyện` unless exact question count is available.
   - time: local estimate such as `Math.max(8, availableSetCount * 4)` minutes.
   - progress: selected day completion percent.
4. Add illustration slot:
   - If asset exists, render `<Image>` with explicit width/height.
   - If absent, render CSS/SVG mountain placeholder.
5. Keep style consistent:
   - green/avocado, white card, soft border, restrained shadow.
   - avoid heavy decorative gradients or large illustration on small screens.
6. Wire card into mobile branch above skills list.

## Success Criteria

- [x] Mobile Today Mission card appears immediately after day rail.
- [x] Card updates when selected day changes.
- [x] Metrics are truthful to available local data.
- [x] Missing mountain asset does not break layout.
- [x] Text does not overflow on 360px mobile width.

## Completion Notes

- Implemented `MobileTodayMissionCard` with selected day, phase/track, concept count, available set count, estimated minutes, and completion percent.
- Used a fixed-size CSS mountain illustration fallback; no asset dependency is required.

## Asset Prompt

```text
Soft minimal EdTech mountain path illustration, green hills, small flag on summit, warm avocado background, subtle sunlight, rounded friendly style, transparent PNG, no text, no characters, compact card illustration for mobile learning app.
```

## Risk Assessment

- Risk: fake precision for time/questions.
  - Mitigation: label as estimate and use data already available.
- Risk: decorative art dominates the mission.
  - Mitigation: cap art width and hide/soften it on narrow screens.
- Risk: palette drift from current app.
  - Mitigation: use existing `primary-green`, `surface-container-low`, `gray-border`, and `on-background` tokens.
