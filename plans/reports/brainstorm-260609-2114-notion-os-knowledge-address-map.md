---
type: brainstorm-report
created: 2026-06-09 21:14
scope: notion-os-knowledge-address-map
status: proposed
---

# Notion OS + Knowledge Address Map Brainstorm

## Summary

Recommendation: build **Option C: Notion Operating System**, but start with a small **Knowledge Address Map** first.

Reason: current Notion already has good skeleton. Without a map, adding more databases/views will create beautiful clutter. Map first makes Notion usable for Claude, mentor review, and project ops.

## Current Findings

### Project scope

- Product: **EduGap / Adaptive-first AI Tutor** for higher education.
- MVP focus:
  - Student Socratic RAG tutor.
  - Course material ingestion + vector retrieval.
  - Mastery tracking by concept.
  - Adaptive quiz / flashcard from weakness.
  - Academic integrity guardrails.
  - Minimal lecturer insight dashboard.
- Anti-scope:
  - Generic chatbot.
  - AI doing homework for student.
  - Generic LMS.
  - Broad agent platform not serving tutoring/adaptive learning.

### Local docs structure

Current local docs are logically split:

| Area | Purpose |
| --- | --- |
| `docs/product/` | product scope, roadmap, design guidelines |
| `docs/domain-knowledge/` | adaptive learning, spaced repetition |
| `docs/research/` | BKT, IRT, contextual bandit, DBR, cold start |
| `docs/engineering/` | architecture, standards, deployment, codebase summary |
| `frontend/docs/` | frontend overview, pages, flows, tokens, stories |

### Notion structure

Root page: **Edugap**.

Current root has:

- Project callout.
- 4 documentation hubs:
  - Product & Roadmaps.
  - Research & Domain Knowledge.
  - Engineering & Architecture.
  - Frontend Workspace.
- Main project databases:
  - Lộ trình & Mốc quan trọng.
  - Danh sách User Story.
  - Backlog & Quản lý công việc.
- Template/forms page.

### Current strengths

- High-level IA aligns with project scope.
- Local-to-Notion mapping exists: `frontend/docs/notion-docs-mapping.md`.
- Notion is not only static docs; it has real project databases.
- Backlog has relations to User Story and Sprint/Milestone.

### Current problems

- Section pages are flat link lists, not review dashboards.
- Root portal is useful but still thin for mentor review.
- Many page titles are file names, e.g. `project-roadmap.md`, not human-facing titles.
- Database data quality needs cleanup: some empty fields, zero estimates, incomplete descriptions.
- Source-of-truth rule not explicit enough.
- No single knowledge map tells Claude/mentor: “for topic X, go here.”

## Decision

Adopt **Option C: Notion OS**, but implement in this order:

1. Knowledge Address Map.
2. Source-of-truth rule.
3. Notion OS information architecture.
4. Database cleanup and relations.
5. Dashboard views.
6. Optional automation/sync.

Do not start from automation. Automation before IA will sync confusion faster.

## Knowledge Address Map

### Purpose

A short index that maps project knowledge to addresses.

It should help:

- Claude avoid repeated broad scouting.
- Mentor review project faster.
- Team know where to update each type of info.
- Notion stay navigable as docs/databases grow.

### Rules

- Keep it as an index, not a duplicate doc.
- Use topic → local source → Notion destination → usage.
- Mark source-of-truth per row.
- Prefer stable topic names over file names.
- Review after major docs/database changes.

### Proposed sections

#### 1. Project North Star

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Product definition | `docs/product/project-overview-pdr.md` | Product overview page | first read for project scope |
| MVP roadmap | `docs/product/project-roadmap.md` | Roadmap page + roadmap DB | planning / mentor status |
| Design direction | `docs/product/design-guidelines.md` | Design guidelines page | UI/UX decisions |
| Scope guard | root `CLAUDE.md` | root portal summary | prevent scope drift |

#### 2. Adaptive Learning Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Mastery/Elo | `docs/domain-knowledge/adaptive-learning.md` | Adaptive learning page | concept mastery logic |
| Spaced repetition | `docs/domain-knowledge/spaced-repetition.md` | Spaced repetition page | flashcard scheduling |
| BKT | `docs/research/bayesian-knowledge-tracking.md` or current BKT research doc | BKT page | future mastery model |
| IRT | `docs/research/item-response-theory.md` | IRT page | assessment difficulty/reliability |
| Contextual bandit | `docs/research/contextual-bandit.md` | Contextual bandit page | future adaptive sequencing |

#### 3. Engineering Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Architecture | `docs/engineering/system-architecture.md` | System architecture page | service/data flow review |
| Code standards | `docs/engineering/code-standards.md` | Code standards page | implementation standards |
| Deployment | `docs/engineering/deployment-guide.md` | Deployment guide page | release/deploy decisions |
| Codebase summary | `docs/engineering/codebase-summary.md` | Codebase summary page | fast onboarding |
| Architecture diagrams | `docs/architecture_diagram.md` | Architecture diagram page | visual explanation |

#### 4. Frontend Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Frontend overview | `frontend/docs/frontend-overview.md` | Frontend overview page | UI app structure |
| Pages/screens | `frontend/docs/frontend-pages.md` | Frontend pages DB/page | screen inventory |
| User flows | `frontend/docs/frontend-user-flows.md` | User flows page | flow validation |
| User stories | `frontend/docs/frontend-user-stories.md` | User story DB/page | requirements traceability |
| Design tokens | `frontend/docs/frontend-design-tokens.md` | Design tokens page | visual consistency |

#### 5. Project Operations

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Milestones | roadmap docs / imported source | Roadmap & milestones DB | timeline/status |
| User stories | frontend/product story docs | User Story DB | requirements management |
| Backlog tasks | imported task source | Backlog DB | execution tracking |
| Bugs | bug tracking DB | Bug DB | defect management |
| Standup | standup DB | Daily Standup DB | weekly/daily status |
| Templates | template page | Forms/templates page | consistent project docs |

## Source-of-Truth Policy

Recommended policy:

| Content type | Source of truth | Notion role |
| --- | --- | --- |
| Product/engineering docs | Local markdown | readable mirror + review portal |
| Research notes | Local markdown | curated research library |
| Runtime code facts | Codebase | linked reference only |
| Roadmap status | Notion DB | operational tracker |
| Backlog/tasks | Notion DB | operational tracker |
| Bugs/standups | Notion DB | operational tracker |
| ADRs | Local `docs/decisions` or ADR folder | searchable mirror |

Rule: do not edit mirrored markdown content directly in Notion unless sync workflow supports writing back. For project ops DBs, edit in Notion.

## Notion OS Target Architecture

### Root: EduGap Project OS

Root should become a real operating dashboard:

- Project one-liner.
- MVP scope / non-MVP warning.
- Current sprint status.
- Open risks and questions.
- Mentor review shortcuts.
- Knowledge Address Map.
- Database dashboard.
- Documentation library.

### Main hubs

| Hub | Role | Must show |
| --- | --- | --- |
| Product Hub | scope + roadmap | MVP, milestones, design direction |
| Research Hub | adaptive/RAG knowledge | theory by feature impact |
| Engineering Hub | architecture/build/deploy | system map, standards, decisions |
| Frontend Hub | UI/UX implementation | screens, flows, stories, tokens |
| Operations Hub | execution | roadmap, backlog, bugs, standups |
| Review Hub | mentor-facing entry | what to review, status, risks |

### Database layer

Keep databases focused:

1. Roadmap & Milestones.
2. User Stories.
3. Backlog Tasks.
4. Bugs.
5. Standups.
6. Decisions/ADRs.
7. Research Concepts.
8. Docs Library.

Avoid creating more until these are clean.

### Suggested relations

| From | To | Why |
| --- | --- | --- |
| Backlog Task | User Story | trace implementation to requirement |
| Backlog Task | Milestone/Sprint | show sprint load |
| Bug | Backlog Task | link fix work |
| User Story | MVP USP | prove scope alignment |
| Research Concept | Feature/User Story | prove research supports product |
| ADR | Architecture/Feature | decision traceability |
| Doc Library | Hub/Topic | fast navigation |

## UI/UX Recommendations for Notion

### Root dashboard layout

Use simple layout:

```text
EduGap Project OS
├─ Hero: one-liner + MVP scope
├─ Row: Current Sprint | Open Risks | Mentor Review
├─ Knowledge Address Map
├─ Documentation Hubs
├─ Project Databases
└─ Source-of-Truth Rules
```

### Section pages

Each section should start with:

- What this section is for.
- Start here.
- Key docs.
- Related databases.
- Open questions.

Do not leave section pages as only link lists.

### Page titles

Rename Notion page titles for humans:

| Current | Better |
| --- | --- |
| `project-overview-pdr.md` | Product Overview / PDR |
| `project-roadmap.md` | Project Roadmap |
| `adaptive-learning.md` | Adaptive Learning & Mastery |
| `system-architecture.md` | System Architecture |
| `frontend-user-stories.md` | Frontend User Stories |

Keep local filename visible as metadata/property, not title.

### Database views

| Database | Views |
| --- | --- |
| Roadmap | Timeline, Board by status, Table by milestone |
| User Stories | Table by role, Board by status, MVP-only filter |
| Backlog | Board by status, Sprint view, Priority view |
| Bugs | Severity board, Open bugs, Fixed this sprint |
| Standups | Calendar, Latest updates |
| Docs Library | By hub, By source-of-truth, Needs review |

## Implementation Phases

### Phase 1 — Map first

- Create Knowledge Address Map page.
- Add source-of-truth policy.
- Link it from root page.
- Confirm all key docs/databases have addresses.

### Phase 2 — IA cleanup

- Rename human-facing Notion pages.
- Add summaries to root and section pages.
- Add navigation/backlinks.
- Add “Start here” blocks.

### Phase 3 — Database cleanup

- Audit empty fields.
- Normalize statuses.
- Fix zero estimates when invalid.
- Check relations: task ↔ user story ↔ milestone.
- Add filtered views.

### Phase 4 — Mentor Review Dashboard

- Add review page or root section:
  - MVP progress.
  - What changed recently.
  - What to review.
  - Risks/questions.
  - Demo links/screens if available.

### Phase 5 — Automation later

- Markdown → Notion sync only after IA stable.
- One-way sync for docs unless explicit write-back is designed.
- Keep project ops DBs manually editable in Notion.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Over-engineered Notion | slows product work | map + clean current DBs before adding more |
| Source drift | wrong docs in Notion | explicit source-of-truth policy |
| Too many databases | hard to maintain | cap initial DBs to 8 |
| Duplicate docs | confusion | index only, no content duplication |
| Broken sync | overwrites manual edits | one-way docs sync only |

## Success Metrics

- New contributor/mentor can find project scope in < 2 minutes.
- Claude can answer “where is X documented?” from map without broad scout.
- Each core USP maps to docs + roadmap/user stories.
- Backlog tasks relate to user stories and milestones.
- Root page shows current status, not just links.
- Mirrored docs have clear source-of-truth labels.

## Recommended Next Step

Create a concrete implementation plan for Option C with these deliverables:

1. Knowledge Address Map page design.
2. Root dashboard structure.
3. Database schema/view audit.
4. Naming/renaming list.
5. Safe migration steps using `ntn` / Notion MCP.

## Unresolved Questions

- Should Knowledge Address Map live only in Notion, or also as local markdown under `docs/`?
- Should Notion docs remain one-way mirror from local markdown?
- Is Notion intended for mentor review only, or daily team operation too?
- Should ADRs be added to the Notion OS now, or after current docs cleanup?
