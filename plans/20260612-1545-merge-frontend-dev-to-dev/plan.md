# Plan: Merge blue/frontend-dev into dev

## Goal
Safely merge the `blue/frontend-dev` branch into `dev` without regressing the backend features on `dev`, resolving all conflicts, and verifying the application via linting and testing.

## Context & Findings
1. **Divergence**:
   - `blue/frontend-dev` has 30 new commits (containing full Next.js UI redesign, tabs, sidebars, stores, and custom 3D styling).
   - `dev` has 53 new commits (containing backend Elo/BKT algorithms, RAG pipeline, DB integrations, and slide crawlers).
2. **Conflict Areas**:
   - `frontend/package.json` & `frontend/pnpm-lock.yaml`: Dependencies added on both branches.
   - `frontend/public/quiz-manifest.json`: Quizzes from Day 9/10 on `dev` vs new UI manifest on `blue/frontend-dev`.
   - `WORKLOG.md`: Task lists written by different members on both branches.
   - `docs/engineering/system-architecture.md` & `docs/product/design.md`: Architecture specs (keep `dev`) vs Design specs (keep `blue/frontend-dev`).
   - `frontend/app/page.tsx`, `globals.css`, `layout.tsx`: Old template UI on `dev` vs polished 3D UI on `blue/frontend-dev`.
   - `.agents/skills/notion-backlog-workflow/SKILL.md`: Automation sections on `dev` vs earlier version.

---

## Proposed Merge Plan

### Phase 1: Branch Preparation & Merge Start
- [ ] Task 1.1: Switch to `dev` and pull the latest changes → Verify: Current branch is `dev` and up to date.
- [ ] Task 1.2: Create a merge branch `feature/merge-frontend-dev` off `dev` → Verify: Switch to `feature/merge-frontend-dev` successfully.
- [ ] Task 1.3: Run `git merge blue/frontend-dev` to start the merge and trigger conflicts → Verify: Git reports conflicts in the 12 files.

### Phase 2: Conflict Resolution
- [ ] Task 2.1: Resolve `frontend/package.json` by keeping the union of dependencies (e.g. keeping `chart.js`, `dayjs`, `react-chartjs-2`, `zustand` from `blue/frontend-dev` alongside `dev` dependencies) → Verify: Valid JSON syntax.
- [ ] Task 2.2: Resolve `frontend/public/quiz-manifest.json` by combining both manifest entries (specifically preserving Day 9 & Day 10 quizzes from `dev` and the layout details from `blue/frontend-dev`) → Verify: Valid JSON syntax.
- [ ] Task 2.3: Resolve `WORKLOG.md` by combining the log entries chronologically from both branches → Verify: Table headers match and format is clean.
- [ ] Task 2.4: Resolve UI conflicts (`frontend/app/page.tsx`, `frontend/app/globals.css`, `frontend/app/layout.tsx`, `frontend/.gitignore`) by accepting the incoming changes from `blue/frontend-dev` → Verify: Compare with `blue/frontend-dev` to ensure exact match.
- [ ] Task 2.5: Resolve doc/config conflicts (`docs/engineering/system-architecture.md`, `.agents/skills/notion-backlog-workflow/SKILL.md`, `docs/product/design.md`) by keeping `dev`'s system architecture/notion workflow but adopting `blue/frontend-dev`'s updated design guidelines → Verify: Documentation is cohesive.
- [ ] Task 2.6: Complete the merge commit → Verify: `git commit` succeeds with a descriptive merge message.

### Phase 3: Post-Merge Verification
- [ ] Task 3.1: Run `pnpm install` inside the `frontend` folder to update the lockfile → Verify: `frontend/pnpm-lock.yaml` is updated and clean.
- [ ] Task 3.2: Run `npm run lint` in the `frontend` folder → Verify: Linter completes with zero errors.
- [ ] Task 3.3: Run `npm run build` in the `frontend` folder to check Next.js compilation → Verify: Next.js build succeeds.
- [ ] Task 3.4: Run `.venv\Scripts\pytest` in the root folder → Verify: All 5 backend tests pass.

### Phase 4: Finalization
- [ ] Task 4.1: Push `feature/merge-frontend-dev` to remote → Verify: Branch is pushed.
- [ ] Task 4.2: Merge `feature/merge-frontend-dev` into `dev` (or open PR) → Verify: `dev` branch contains all combined changes.

---

## Done When
- [ ] `blue/frontend-dev` is successfully merged into `dev`.
- [ ] Frontend builds cleanly with all custom UI features and Day 9/10 quizzes intact.
- [ ] All automated tests pass successfully.
