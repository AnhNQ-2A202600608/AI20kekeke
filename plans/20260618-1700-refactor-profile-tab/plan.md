# Implementation Plan: Refactoring ProfileTab God Component

Deconstruct the monolithic `ProfileTab` component (`profile-tab.tsx`, 1662 lines) into a highly modular component structure under `frontend/components/dashboard/profile/`, separating state management, pure utilities, charts, graph networks, and modular sections.

## User Review Required

- All new components and custom hooks will be located in the folder `frontend/components/dashboard/profile/`.
- The original file [profile-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile-tab.tsx) will be replaced by a clean, lightweight entrypoint file `profile/index.tsx` (importing and orchestrating sub-components), and then the old file will be deleted.
- The sub-components will be split cleanly so that each file is strictly under 200 lines (complying with the codebase rule).

## Proposed Changes

### Dashboard Module Refactoring

#### [NEW] [profile-utils.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/utils/profile-utils.ts)
- Define types/interfaces: `ConceptMastery`, `Session`, `DayActivity`, `NextAction`.
- Move the constant `CONCEPT_MAPPING` and helpers like `getLayoutedElements`, `nodeTypes`, and mock data `sessions`.

#### [NEW] [useProfileData.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/hooks/useProfileData.ts)
- State & memoized data logic: `computedConcepts`, `averageElo`, `zpdConceptsCount`, `sortedConcepts`, `hasDecayRisk`, `heatmapActivities`, `lineChartData`, `nextActions`, `forgettingChartData`, `scatterData`, `layoutedNodes`, `layoutedEdges`.
- Handler methods: `handleStartConceptPractice` and `handleRecharge`.

#### [NEW] [profile-header.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/profile-header.tsx)
- Renders identity information (avatar, name, username) and the 4 metric cards (Elo, XP, Streak, ZPD Concepts count).

#### [NEW] [bandit-recommendation.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/bandit-recommendation.tsx)
- Renders the Contextual Bandit suggestion banner with expected Elo gain and ZPD target probability.

#### [NEW] [performance-charts.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/performance-charts.tsx)
- Renders the Radar Chart and progress line chart over 30 days.

#### [NEW] [skill-tree-graph.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/skill-tree-graph.tsx)
- Renders the `@xyflow/react` directed acyclic graph (DAG) map of concepts.

#### [NEW] [memory-decay-chart.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/memory-decay-chart.tsx)
- Renders Ebbinghaus forgetting curve line/scatter charts and list of memory retention percentages with Elo charging buttons.

#### [NEW] [mastery-map.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/mastery-map.tsx)
- Renders Section 2 Adaptive Mastery Map showing Elo bars and BKT uncertainty bands.

#### [NEW] [activity-heatmap.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/activity-heatmap.tsx)
- Renders Section 4 study calendar activity heatmaps.

#### [NEW] [recent-sessions.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/recent-sessions.tsx)
- Renders Section 5 last learning sessions and the hint penalty info banner.

#### [NEW] [study-path-guidelines.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/study-path-guidelines.tsx)
- Renders Section 6 optimal study paths list with quick-start buttons.

#### [NEW] [concept-detail-drawer.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/components/concept-detail-drawer.tsx)
- Renders the slide-up dialog with BKT parameters, prerequisites, and learning actions.

#### [NEW] [index.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile/index.tsx)
- The main entrypoint component (under 150 lines) coordinates the hooks, layout tabs, sub-components, and drawer.

#### [MODIFY] [dashboard-layout.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/components/dashboard-layout.tsx)
- Update importing of `ProfileTab` to point to the new `frontend/components/dashboard/profile/index.tsx`.

#### [DELETE] [profile-tab.tsx](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/components/dashboard/profile-tab.tsx)
- Delete the old 1662-line monolithic profile-tab.tsx file.

## Verification Plan

### Automated Tests
- Run TypeScript type-checking to verify zero compilation errors:
  ```bash
  pnpm tsc --noEmit
  ```
- Run ESLint to verify zero linter warnings or errors:
  ```bash
  pnpm run lint
  ```
