---
phase: 2
title: "Data Adapter"
status: pending
priority: P1
dependencies: [1]
---

# Phase 2: Data Adapter

## Overview

Create a thin view adapter that maps existing Skill/store data into Garden card state. This keeps presentation components simple and avoids fake Garden data.

## Requirements

- Functional: derive recommended skill, day filters, card states, CTA labels, active session status, and selected skill details from existing data.
- Non-functional: no backend API, no hardcoded mock student data, no new persistent state.

## Architecture

Add local helper(s) near the Practice tab unless complexity justifies a new file.

```ts
type PracticeGardenSkill = {
  id: string;
  name: string;
  description: string;
  dayId?: string;
  mastery: number;
  state: 'new' | 'in_progress' | 'review' | 'mastered' | 'locked';
  isRecommended: boolean;
  ctaLabel: string;
  associatedSets: string[];
  activeSetId?: string;
};
```

State mapping:

| Existing signal | Garden state |
|---|---|
| `status === 'WEAK'` | `review` |
| active session for skill | `in_progress` |
| `status === 'LEARNING'` | `in_progress` |
| `status === 'MASTERED'` | `mastered` |
| no associated sets | `locked` |
| else | `new` |

Recommendation priority:

1. active practice session
2. weak skill
3. learning skill with lowest mastery
4. not-started skill
5. mastered skill for maintenance

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\skills-practice-tab.tsx` | Use adapter output and preserve behavior. |
| Create if useful | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-garden-data.ts` | Keep mapping testable if component gets large. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\lib\quiz\types.ts` | Confirm `Skill` and `MasteryStatus` contract. |

## Implementation Steps

1. Define the garden view model and pure mapping function.
2. Map `Skill.status` to Garden state and copy.
3. Resolve `activeSetId` from active session or first associated set.
4. Build day metadata from the existing `days` array and available skills.
5. Replace ad hoc sorted arrays with adapter output while preserving sort priority.
6. Keep selected skill state separate from expanded detail state; avoid modal-first behavior.
7. Add small unit-level assertions only if the repo already has a frontend test pattern. Otherwise validate through component behavior and typecheck.

## Success Criteria

- [ ] Garden cards use real `skills` and `conceptMasteries`.
- [ ] Recommended skill is deterministic and visible.
- [ ] Existing CTA paths still call `onStartPractice(skill, targetSetId)`.
- [ ] Empty, locked, active-session, weak, learning, and mastered states have stable labels.

## Risk Assessment

- Risk: `conceptMasteries` keys are set IDs while `skills` are higher-level items.
  Mitigation: keep set-level details in selected detail panel; use skill-level `masteryScore` for card mastery.
- Risk: fake ZPD score appears authoritative.
  Mitigation: phrase ZPD as derived guidance from existing status/Elo unless real ZPD data exists.
