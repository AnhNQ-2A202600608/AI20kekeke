# Knowledge Address Map

> Purpose: one-page address book for EduGap knowledge. Use this to find the right source fast. This page is an index, not duplicate documentation.

## Source-of-Truth Policy

| Content type | Source of truth | Notion role |
| --- | --- | --- |
| Product docs | Local markdown | readable mirror + review navigation |
| Engineering docs | Local markdown | readable mirror + architecture review |
| Research/domain docs | Local markdown | curated research library |
| Runtime code facts | Codebase | linked reference only |
| Roadmap status | Notion database | operating tracker |
| Backlog/tasks | Notion database | operating tracker |
| Bugs/standups | Notion database | operating tracker, ID pending verification |
| ADRs/decisions | Local decision docs when added | searchable mirror later |

Rule: do not edit mirrored markdown content directly in Notion unless a write-back sync exists. Edit project ops data in Notion databases.

## Project North Star

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Product definition | `docs/product/project-overview-pdr.md` | Product Overview / PDR | first read for scope |
| MVP roadmap | `docs/product/project-roadmap.md` | Project Roadmap + Roadmap DB | planning/status |
| Design direction | `docs/product/design-guidelines.md` | Design Guidelines | UI/UX decisions |
| Scope guard | `CLAUDE.md` | EduGap root summary | prevent scope drift |

## Adaptive Learning Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Mastery/Elo | `docs/domain-knowledge/adaptive-learning.md` | Adaptive Learning & Mastery | concept mastery logic |
| Spaced repetition | `docs/domain-knowledge/spaced-repetition.md` | Spaced Repetition | flashcard scheduling |
| BKT | `docs/research/bayesian-knowledge-tracing.md` | Bayesian Knowledge Tracing | future mastery model |
| IRT | `docs/research/item-response-theory.md` | Item Response Theory | assessment difficulty/reliability |
| Contextual bandit | `docs/research/contextual-bandit.md` | Contextual Bandit | future adaptive sequencing |
| Cold start | `docs/research/adaptive-learning-and-cold-start.md` | Adaptive Learning & Cold Start | onboarding/new learner strategy |

## Engineering Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Architecture | `docs/engineering/system-architecture.md` | System Architecture | service/data flow review |
| Code standards | `docs/engineering/code-standards.md` | Code Standards | implementation rules |
| Deployment | `docs/engineering/deployment-guide.md` | Deployment Guide | release/deploy decisions |
| Codebase summary | `docs/engineering/codebase-summary.md` | Codebase Summary | fast onboarding |
| Architecture diagram | `docs/architecture_diagram.md` | Architecture Diagram | visual explanation |

## Frontend Knowledge

| Topic | Local source | Notion address | Usage |
| --- | --- | --- | --- |
| Frontend overview | `frontend/docs/frontend-overview.md` | Frontend Overview | UI app structure |
| Pages/screens | `frontend/docs/frontend-pages.md` | Frontend Pages | screen inventory |
| User flows | `frontend/docs/frontend-user-flows.md` | Frontend User Flows | flow validation |
| User stories | `frontend/docs/frontend-user-stories.md` | Frontend User Stories + User Story DB | requirements traceability |
| Design tokens | `frontend/docs/frontend-design-tokens.md` | Frontend Design Tokens | visual consistency |
| Notion mapping | `frontend/docs/notion-docs-mapping.md` | Notion Docs Mapping | page/database lookup |

## Project Operations

| Topic | Notion address | Usage | Status |
| --- | --- | --- | --- |
| Milestones | Roadmap & Milestones DB | timeline/status | verified |
| User stories | User Story DB | requirements management | verified, some rows incomplete |
| Backlog tasks | Backlog DB | execution tracking | verified, some rows incomplete |
| Bugs | Bug Tracking DB | defect management | verified |
| Standup | Daily Standup DB | team updates | verified |
| Templates | Forms/templates page | consistent project docs | linked from root |

## Review Entry Points

| Reviewer intent | Start here |
| --- | --- |
| Understand project in 2 minutes | Product Overview / PDR + EduGap root |
| Check MVP fit | Product Roadmap + Project North Star section |
| Review adaptive learning logic | Adaptive Learning & Mastery + BKT/IRT research |
| Review implementation direction | System Architecture + Codebase Summary |
| Review UI scope | Frontend Overview + Frontend Pages + User Stories |
| Review execution status | Roadmap DB + Backlog DB |

## Maintenance Rule

Update this map when:

- A doc file is renamed or moved.
- A Notion page/database is renamed or recreated.
- A new source-of-truth is introduced.
- A major feature changes project scope or review flow.

## Unresolved Questions

- Should this map also become an evergreen local doc under `docs/`?
- Should Bugs/Standup verified IDs be synced into `frontend/docs/notion-docs-mapping.md`?
- Should ADR/decision tracking be added now or deferred?
