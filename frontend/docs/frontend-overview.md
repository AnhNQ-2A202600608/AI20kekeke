# Frontend Overview

## Overview

The frontend should present Mentora as an Adaptive-first AI Tutor for higher education. The current UI already supports a learning path, quiz practice, profile progress, leaderboard, lightweight auth modal, and progress sidebar. The MVP vision extends this into Socratic RAG chat, concept-level mastery, lecturer insights, material ingestion, and academic-integrity guardrails.

## Product Direction

- Keep the student experience focused on diagnosis, guided practice, and visible progress.
- Use course-grounded tutoring with citation cards when RAG is available.
- Treat quiz and dashboard screens as mastery signals, not generic gamification.
- Keep lecturer/admin UI focused on weak concepts, source quality, and intervention decisions.

## Current Frontend Surface

| Area | Current implementation | MVP direction |
| --- | --- | --- |
| Learning path | Path of quiz sets and guidebook entry points | Concept-aware adaptive path using mastery weakness |
| Quiz mode | Pre-survey, MCQ/short answer, explanations, result screen | ZPD quiz selection, Socratic hints, Elo updates |
| Profile | XP, streak, completed sets, heatmap, radar chart | Concept mastery dashboard per student |
| Leaderboard | Static/sample competitive XP list | Optional motivation layer, not core learning evidence |
| Auth modal | Local profile creation/login simulation | RBAC auth for Student, Mentor, BTC/Admin |
| Right sidebar | Streak, XP, total progress, waitlist | Learning summary, interventions, next best action |

## MVP Frontend Modules

| Module | Primary user | Purpose |
| --- | --- | --- |
| Student Tutor Chat | Student | Ask course-grounded questions in 5 modes with citations and guardrails. |
| Adaptive Quiz | Student | Practice questions selected by concept mastery and ZPD. |
| Student Progress Dashboard | Student | Show radar, heatmap, weak concepts, and next learning actions. |
| Lecturer Class Insights | Mentor | Find class weak concepts and students needing support. |
| Material Ingestion | Mentor/BTC/Admin | Upload, review, test, and publish course sources and generated quizzes. |
| RAG Test & Audit | Mentor/BTC/Admin | Validate retrieval quality, citations, guardrail events, and low-confidence logs. |
| RBAC/Auth | All roles | Route users to role-specific portals and protect privileged actions. |

## Navigation Model

### Student

1. Home dashboard opens on learning path.
2. Student can enter tutor chat, start recommended quiz, read guidebook, or inspect progress.
3. Quiz completion updates mastery signals and next recommended action.
4. Profile/dashboard shows concept status and activity.

### Mentor / Lecturer

1. Opens class insight dashboard.
2. Reviews weak concepts and struggling students.
3. Opens source/audit panels when gaps suggest material or retrieval issues.
4. Assigns or recommends focused practice.

### BTC / Admin

1. Manages users, courses, and materials.
2. Publishes approved documents and generated quizzes.
3. Reviews audit logs and system health evidence.

## Implementation Notes

- Current Next app entry lives in `app/page.tsx`.
- UI uses Tailwind utility classes and warm amber/stone color language.
- State currently combines local React state, localStorage, Zustand store, Supabase survey writes, and analytics events.
- Future MVP work should split large page responsibilities before adding chat, lecturer, and ingestion surfaces.

## References

- Academic Citations & Foundations: [academic-citations.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/docs/academic-citations.md)
- Root product PDR: `../docs/product/project-overview-pdr.md`
- Root roadmap: `../docs/product/project-roadmap.md`
- Root architecture: `../docs/engineering/system-architecture.md`
- Root design guidelines: `../docs/product/design-guidelines.md`
