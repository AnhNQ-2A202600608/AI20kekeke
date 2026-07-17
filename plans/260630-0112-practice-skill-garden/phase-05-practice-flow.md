---
phase: 5
title: "Practice Flow"
status: pending
priority: P1
dependencies: [2, 3, 4]
---

# Phase 5: Practice Flow

## Overview

Preserve and polish the full user flow: enter garden, filter day, select skill, start/resume/review practice, return with updated mastery visual.

## Requirements

- Functional: all existing Practice actions continue to work.
- Non-functional: no blocking animation before navigation, no confirm dialogs for primary actions, no state loss when filtering.

## Architecture

Primary calls stay unchanged:

```ts
onStartPractice(skill, targetSetId)
clearActiveSession()
resetPracticeSession(skill.id)
```

Button labels:

| Garden state | CTA |
|---|---|
| `new` | `Bắt đầu luyện` |
| `in_progress` | `Luyện tiếp` |
| `review` | `Ôn lại` |
| `mastered` | `Duy trì` |
| `locked` | `Sắp mở` |

## Related Code Files

| Action | Absolute path | Purpose |
|---|---|---|
| Modify | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\skills-practice-tab.tsx` | Preserve handlers and wire Garden events. |
| Modify/Create | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\components\dashboard\practice-garden\practice-garden-page.tsx` | CTA wiring. |
| Read | `D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\frontend\app\hooks\useQuizSession.ts` | Confirm return/update assumptions. |

## Implementation Steps

1. Keep existing `handleStartPractice`, `handleResumeActiveSession`, reset, and clear handlers.
2. Route card CTA:
   - active session for same skill -> resume
   - review skill -> start current recommended set
   - mastered -> start maintenance/first set
   - locked/no sets -> disabled
3. Move destructive reset behind secondary UI in selected detail, not on main card.
4. Add a short loading/pressed state only if it does not delay navigation.
5. Ensure filter changes do not leave `selectedSkillId` pointing to an invisible skill; auto-select the recommended visible skill.
6. After practice completes and store updates, Garden derives new mastery without manual refresh logic.
7. Keep existing alert/error behavior unless a safer inline state is trivial.

## Success Criteria

- [ ] Resume banner still works for active sessions.
- [ ] Start buttons launch the same quiz flow as before.
- [ ] Per-set `Luyện riêng` behavior is preserved in selected detail.
- [ ] Filtering days updates visible cards and selected skill predictably.
- [ ] Locked/empty skills cannot launch practice.

## Risk Assessment

- Risk: CTA copy changes confuse existing users.
  Mitigation: keep clear action words and state labels; do not hide session count.
- Risk: reset action is accidentally triggered.
  Mitigation: keep confirmation and move it away from primary CTA.
