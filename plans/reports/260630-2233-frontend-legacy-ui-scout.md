# Frontend Legacy UI Scout

---
date: 2026-06-30
scope: frontend source audit
status: read-only scout complete
---

## Summary

Read-only scout across `frontend/app`, `frontend/components`, `frontend/hooks`, `frontend/lib`, `frontend/stores`, and frontend docs found three cleanup groups:

- Strong delete candidates: unused legacy components/routes.
- Active but unmigrated surfaces: live UI still using old amber/stone, demo/mock flows, duplicated renderers, or prototype data.
- Mostly migrated surfaces: keep, with small follow-up cleanup.

No files were deleted or migrated during this scout.

## Delete Candidates

| Priority | File | Reason |
| --- | --- | --- |
| P0 | `frontend/app/supabase-test/page.tsx` | Raw test route querying `todos`, inline connection-test UI. Remove from production app unless still needed for local diagnostics. |
| P0 | `frontend/components/dashboard/mentor-dashboard.tsx` | Appears unused. Current layout imports mentor tabs directly. Contains emoji tab metadata and old demo wrapper. |
| P0 | `frontend/components/TileTooltip.tsx` | No active usage found. Tied to older skill-tile map UI. |
| P0 | `frontend/components/quiz/difficulty-badge.tsx` | No active usage found in `frontend`. |
| P1 | `frontend/components/Calendar.tsx` | Likely unused by active shell; newer profile/activity components replaced it. Verify no dynamic import before deletion. |
| P1 | `frontend/components/dashboard/profile/components/activity-heatmap.tsx` | Old profile child component, no active imports found. |
| P1 | `frontend/components/dashboard/profile/components/bandit-recommendation.tsx` | Old profile child component, no active imports found. |
| P1 | `frontend/components/dashboard/profile/components/mastery-map.tsx` | Old profile child component, no active imports found. |
| P1 | `frontend/components/dashboard/profile/components/profile-header.tsx` | Old profile child component, no active imports found. |
| P1 | `frontend/components/dashboard/profile/components/recent-sessions.tsx` | Old profile child component, no active imports found. |
| P1 | `frontend/components/dashboard/profile/components/study-path-guidelines.tsx` | Old profile child component, no active imports found. |

## Consolidate Candidates

| Priority | Files | Recommendation |
| --- | --- | --- |
| P0 | `frontend/components/LoginScreen.tsx`, `frontend/app/login/page.tsx` | Consolidate auth UI. `LoginScreen` is active as modal but duplicates `/login` and contains legacy demo/fake-token behavior. |
| P0 | `frontend/app/guidebook/[slug]/page.tsx`, `frontend/app/api/guidebook/[slug]/route.ts` | Consolidate duplicated hardcoded guidebook maps and regex markdown rendering. API route still emits amber styling and structural emoji. |
| P1 | `frontend/components/RadarChart.tsx`, `frontend/components/dashboard/profile/components/performance-charts.tsx` | Split `EloProgressChart` from `PerformanceCharts`; then remove legacy radar fallback path if unused. |
| P1 | `frontend/components/dashboard/mentor/components/mentor-skill-tree-graph.tsx`, `frontend/components/dashboard/profile/components/skill-tree-graph.tsx` | Near-duplicate React Flow graph components. Extract shared graph primitive with role-specific copy/status mapping. |
| P2 | `frontend/components/quiz/socratic-sidebar-view.tsx`, `frontend/components/dashboard/socratic-chat/**` | Quiz-specific Socratic drawer duplicates chat/lightbox/input behavior. Replace with shared chat primitives over time. |

## Active Migration Targets

| Priority | File | Issue |
| --- | --- | --- |
| P0 | `frontend/components/quiz/quiz-question-view.tsx` | Highest-priority live legacy surface. Large hand-styled quiz UI with amber/stone styling, raw colors, inline dev-mode UI, hardcoded course metadata, and old tutor copy. |
| P0 | `frontend/components/quiz/quiz-results.tsx` | Old results dashboard pattern, reward-gradient styling, embedded survey UI, dev diagnostics. Redesign/split recommended. |
| P0 | `frontend/components/dashboard/mentor/class-insights-tab.tsx` | Large active demo surface with generated students, fixed dates, fake emails, localStorage notes, hardcoded graph positions, and one-off UI. Needs real data contract plus design migration. |
| P0 | `frontend/components/dashboard/mentor/ingestion-tab.tsx` | Active but mock-heavy: initial documents, relations, chunks, quiz logs, upload logs. Some mock data initializes outside demo mode. |
| P0 | `frontend/components/dashboard/mentor/quiz-editor-tab.tsx` | Active prototype HITL editor with mock questions and in-memory publish/reject flow. |
| P1 | `frontend/components/dashboard/mentor/rag-audit-tab.tsx` | Mixed real/demo. Has hardcoded preset sandbox rows and labels like mock retrieval sandbox. |
| P1 | `frontend/components/dashboard/guidebook-view.tsx` | Still uses old amber token styling. |
| P1 | `frontend/app/api/guidebook/[slug]/route.ts` | Emits old amber HTML classes and structural emoji. |
| P1 | `frontend/components/onboarding/onboarding-page.tsx`, `frontend/components/onboarding/onboarding-gate.tsx` | Live onboarding still mixes amber/neutral/shadow-soft styling with newer green tokens. |
| P1 | `frontend/components/LoginScreen.tsx` | Active modal has amber link, role demo paths, fake JWT behavior, and older modal proportions. |
| P2 | `frontend/components/quiz/loading-questions-card.tsx` | Generic card loader; migrate to current tactile/garden loading pattern. |
| P2 | `frontend/components/dashboard/socratic-chat/hooks/useSocraticChat.ts` | Demo-mode mock slides/citations and hardcoded tool responses. Audit whether demo mode remains a product requirement. |
| P2 | `frontend/components/dashboard/socratic-chat/components/ai-message-item.tsx` | Supports `legacy-*` compatibility IDs; keep only if old persisted messages still need rendering. |

## Documentation Drift

| File | Issue |
| --- | --- |
| `frontend/docs/frontend-design-tokens.md` | Obsolete. Still defines warm amber/stone and mentions blue/purple reset; current product guideline is green tactile/garden and bans purple-heavy styling. |
| `frontend/docs/frontend-overview.md` | Mentions static/sample leaderboard and warm amber/stone language. |
| `frontend/metadata.json` | Describes old glassmorphic dark-theme quiz app. |
| `frontend/README.md` | Contains emoji-heavy sections and older positioning; should be refreshed only if README is still maintained. |

## Mostly Keep

| Area | Notes |
| --- | --- |
| `frontend/components/dashboard/practice-garden/**` | Mostly aligned with seed/soil primitives and current style. |
| `frontend/components/dashboard/profile/index.tsx`, `rpg-profile-hero.tsx`, `skill-garden.tsx`, `profile-growth-showcase.tsx` | Newer profile shell. Keep, but profile utilities still generate fallback analytics and fixed concept mappings. |
| `frontend/components/learning/**` | Mostly migrated. Some static preview labels and microcopy may be temporary scaffolding. |
| `frontend/components/landing/**` | Mostly green/cream aligned; keep unless product wants app-only surface cleanup. |

## Recommended Sequence

1. Delete P0 unused files and run `pnpm lint` plus `pnpm build`.
2. Consolidate guidebook rendering and auth UI before broad styling work.
3. Migrate quiz question/results UI, because it is active and visibly old.
4. Decide whether mentor/admin demo surfaces are product demos or production workflows. If production, replace mock constants with real API contracts before visual polish.
5. Refresh frontend docs/metadata after code cleanup so docs match the active design system.

