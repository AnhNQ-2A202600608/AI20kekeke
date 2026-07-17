# Refactor God Component page.tsx

## Overview
- **Status:** Planning
- **Description:** Refactor `frontend/app/page.tsx` from a ~2,000 line "God Component" to clean modular components and custom hooks.

## Proposed Files
- [NEW] `frontend/app/hooks/useQuizSession.ts`
- [NEW] `frontend/app/hooks/useSocraticSidebar.ts`
- [NEW] `frontend/app/hooks/useSurveyHandlers.ts`
- [NEW] `frontend/app/components/quiz-workspace.tsx`
- [NEW] `frontend/app/components/dashboard-layout.tsx`
- [MODIFY] `frontend/app/page.tsx`

See details in [implementation_plan.md](./implementation_plan.md).
