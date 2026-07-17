---
phase: 3
title: "Frontend question-bank onboarding"
status: completed
priority: P1
dependencies: [2]
---

# Phase 3: Frontend question-bank onboarding

## Overview

Refactor onboarding UI to render backend-supplied diagnostic questions while keeping the new app UI direction already implemented.

## Requirements

- Functional: 2 context questions remain local controlled inputs.
- Functional: diagnostic questions are fetched from backend session.
- Functional: after 5 answers, show result/encouragement and offer continue.
- UX: no visible explanation text about the algorithm; the flow should feel like a short placement check.
- Accessibility: options are keyboard usable and loading/error states are clear.

## Architecture

Frontend should own:
- context answers,
- selected option for current question,
- optimistic local feedback display after backend response,
- result page and optional continue CTA.

Backend should own:
- question sequence,
- correctness,
- explanation/encouragement,
- progress totals,
- summary and seed values.

State shape:

```ts
type DiagnosticSessionState = {
  sessionId: string;
  currentQuestion: DiagnosticQuestionPublic | null;
  answeredCount: number;
  requiredCount: 5;
  maxCount: 8;
  canComplete: boolean;
  canContinue: boolean;
};
```

## Related Code Files

- Modify: `frontend/lib/onboarding/onboarding-contract.ts`
- Modify: `frontend/lib/onboarding/onboarding-api.ts`
- Modify: `frontend/lib/onboarding/onboarding-storage.ts`
- Modify: `frontend/components/onboarding/onboarding-page.tsx`
- Delete or shrink: `frontend/lib/onboarding/onboarding-questions.ts`
- Modify: `frontend/lib/onboarding/onboarding-scoring.ts`

## Implementation Steps

1. Add frontend API methods:
   - `startOnboardingDiagnostic(payload)`,
   - `answerOnboardingDiagnostic(payload)`,
   - `completeOnboarding(payload)`.
2. Replace `ONBOARDING_QUESTIONS[step]` indexing with backend `currentQuestion`.
3. Remove local `correct` flags from option data and draft storage.
4. Store only session ID, selected option history, and context answers locally for recovery.
5. Render feedback from backend response:
   - short correct/incorrect encouragement,
   - no answer key leakage before submission,
   - summary after 5 answers.
6. Preserve mobile-first layout and visual density from the current onboarding page.
7. Add explicit error states:
   - no diagnostic items configured,
   - session expired,
   - offline/retry.

## Success Criteria

- [x] Runtime UI does not import hardcoded diagnostic question text.
- [x] Reload during onboarding can resume or restart cleanly.
- [x] Submit button cannot complete before backend says `canComplete`.
- [x] Optional continue does not force users past 5 questions.
- [x] ESLint passes for touched frontend files.

## Risk Assessment

Risk: extra roundtrips make onboarding feel slow.
Mitigation: answer endpoint returns feedback and next question in one response; UI shows immediate selected state and compact loading affordance.
