---
phase: 3
title: "Migrate active student surfaces"
status: in_progress
effort: ""
priority: P1
dependencies: [2]
---

# Phase 3: Migrate active student surfaces

## Overview

Migrate active student surfaces that are still using old amber/stone, generic card, demo, or duplicated UI patterns.

## Requirements

- Functional: preserve quiz, learning path, practice garden, chat, profile, onboarding, and login behavior.
- Non-functional: align styling with `docs/product/design-guidelines.md`; do not expand scope to mentor/BTC/admin.

## Architecture

Prioritize high-traffic student surfaces:

1. Quiz mode: `QuizWorkspace` children.
2. Learn tab: `LearningPath` and guidebook.
3. Skills/profile/chat tabs.
4. Auth/onboarding surfaces.

Use existing primitives before new abstractions: `TactileButton`, `TactilePanel`, `MetricPill`, `LearningPageShell`, `MasterySeedBadge`, `MasterySoilStrip`, `SofiExpressionAvatar`, and app-level top nav components.

## Related Code Files

- Modify:
  - `frontend/components/quiz/quiz-question-view.tsx`
  - `frontend/components/quiz/quiz-results.tsx`
  - `frontend/components/quiz/socratic-sidebar-view.tsx`
  - `frontend/components/quiz/loading-questions-card.tsx`
  - `frontend/components/LearningPath.tsx`
  - `frontend/components/dashboard/guidebook-view.tsx`
  - `frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx`
  - `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts`
  - `frontend/components/LoginScreen.tsx`
  - `frontend/components/onboarding/onboarding-page.tsx`
  - `frontend/components/onboarding/onboarding-gate.tsx`
  - `frontend/app/hooks/useQuizSession.ts`
- Possibly create:
  - `frontend/components/quiz/quiz-tactile-shell.tsx`
  - `frontend/components/quiz/quiz-feedback-panel.tsx`
  - `frontend/components/dashboard/profile/components/elo-progress-chart.tsx`

## Implementation Steps

1. Quiz UI migration:
   - Replace amber hint/review panels in `quiz-question-view.tsx` with primary green, info blue, tertiary yellow, and error red tokens.
   - Replace raw `course_id` usage with the existing adaptive course constant or config source.
   - Keep mobile bottom actions compact with `min-h-10`/`min-h-11`.
   - Convert old hint/banner UI into a tactile panel using existing primitives.
2. Results UI migration:
   - Split survey/dev diagnostics from the main result summary if needed.
   - Replace `btn-3d btn-orange` reward-first pattern with current green/soil mastery feedback.
   - Keep correct/incorrect feedback semantic and accessible.
3. Socratic sidebar migration:
   - Reuse shared Socratic chat message/input/lightbox primitives where practical.
   - Keep quiz-specific hint penalty information, but restyle with compact green/blue/error tokens.
4. Learn/guidebook cleanup:
   - Reduce `LearningPath` guide modal radii from `rounded-[28px]`/`rounded-[32px]` to app-standard `rounded-2xl`.
   - Convert `guidebook-view.tsx` amber classes to green tactile tokens.
5. Chat cleanup:
   - Keep legacy message compatibility only if persisted old messages still exist.
   - Gate mock slides/citations under intentional demo mode only; otherwise remove or rename as fallback test data.
6. Auth/onboarding cleanup:
   - Consolidate `LoginScreen` with `/login` decisions or restyle the modal to match current app density.
   - Replace amber/neutral/shadow-soft remnants in onboarding with current tokens.
7. Profile detailed analytics cleanup:
   - Split `EloProgressChart` from the old `PerformanceCharts` radar wrapper.
   - Keep `SkillTreeGraph`/`MemoryDecayChart` live, but defer large graph consolidation unless it blocks deletion.

## Success Criteria

- [x] Active student UI touched in this slice no longer depends on amber/stone as primary visual language.
- [x] Quiz result, quiz hint panels, learn guidebook, onboarding, and login match current compact tactile guidelines.
- [ ] Mock/demo branches are explicitly gated or removed from production student flows.
- [x] Student tabs remain `learn`, `skills`, `chat`, and `profile`.

## Progress Notes

Completed in current slice:

- Guidebook surface moved from amber cards to green tactile panels.
- Learning guide modal shell radius/border aligned with app tactile style.
- Login modal and onboarding warnings/actions moved away from amber primary styling.
- Quiz results moved to green/blue/yellow semantic panels and removed orange primary CTA.
- Quiz question view removed hardcoded adaptive course id in report payload and changed hint/reference panels away from amber.
- `btn-3d` usage was removed from the quiz question submit/continue actions touched here.

Deferred:

- Deep Socratic chat message compatibility and mock/demo branch cleanup.
- Full adaptive quiz behavior refactor beyond style and config source cleanup.

## Risk Assessment

Quiz mode is the highest-risk area because it combines adaptive API calls, local fallback data, persisted answer history, and Socratic hint penalties. Migrate it in small commits and keep behavior tests/manual checks focused.
