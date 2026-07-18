# Project Overview PDR

## Overview

AI20K-C2-HE-01 is an Adaptive-first AI Tutor for higher education. The product helps lecturers support large classes by giving each student a personalized tutor that diagnoses weak concepts, guides learning with Socratic prompts, and tracks mastery over time.

## Vision

Provide a 24/7 personal academic tutor that teaches from official course material, encourages independent reasoning, and adapts practice to each student's current ability.

## MVP Goals

- Public landing, Supabase email/password login, onboarding gate, and authenticated `/app` workspace.
- Student Socratic RAG Chat grounded in official course materials with citation cards.
- 5 learning modes: Explain, Step-by-step hint, Debug code, Practice, and Review submission.
- Adaptive Quizzes matching questions to student concept mastery using Elo ratings and ZPD (target 70%-75% expected success).
- Student Elo/BKT Mastery scoring per concept, stability days, and discount factor applied when Socratic hints are used during quiz.
- Student App workspace visualizing day-by-day learning path, mastery seed/soil state, profile progress, concept focus, and practice sets.
- Academic integrity guardrails to prevent AI from doing lab/gate assignments (hint ladder fallback).
- Lecturer / Admin course material ingestion manager supporting automatic quiz generation and draft/published status.
- RAG query testing panel for Mentors/BTC to verify chunks and citations before publishing.
- Class-level insight dashboard for Mentors showing weak concepts and students needing support.
- Role-based authentication and backend RBAC (Student, Mentor, BTC/Admin, Dev).

## Primary Users

| User | Needs |
| --- | --- |
| Student | Ask questions in 5 modes, take adaptive quizzes with Socratic hints, see citations, view Radar/Heatmap progress dashboard, and check assigned learning plans. |
| Mentor | Upload and test course material, review failed/low-confidence queries, see class-level gaps, and assign learning plans. |
| BTC / Admin | Manage users, verify course materials, publish/unpublish sources, and audit logs. |

## Core Features

### Student Portal

- Landing, login, onboarding, and app-entry routing that keeps unauthenticated users out of `/app`.
- Onboarding diagnostic flow to collect baseline learner context before opening the main workspace.
- Socratic RAG Chat with 5 selectable modes, personalized dynamically by the student's current concept Elo rating.
- Citation Card showing title, slide/page/section, and text excerpt.
- Adaptive Quiz Interface supporting ZPD-based question selection, Socratic hints, and Elo updates (with help discounts).
- Learning workspace featuring 28-day path navigation, day focus, mastery seed/soil visuals, practice sets, profile growth, and progress telemetry.
- Feedback Controls (Helpful/Unhelpful, report citation/answer error).
- Guardrail UI for off-scope, cheating-risk, and low-confidence fallbacks.
- Learning Plan View (to check plan assigned manually by Mentor - post-MVP).

### Lecturer & Admin Portal

- Course Material Ingestion (upload documents, input metadata, toggle draft/published) with automated RAG question generation.
- RAG Test Panel (run test queries on draft/published sources to audit retrieval).
- Class Insight Dashboard (aggregated class Elo scores, weak concepts ranking, student list needing support).
- Audit Dashboard (list of low-confidence searches, unhelpful feedback, and missing sources).
- Braintrust observability panel for BTC/Admin using backend proxy only.
- RBAC using Supabase email/password authentication and backend role resolution.

### Safety & Integrity

- Guardrails for off-scope queries (redirect politely back to course).
- Academic integrity guardrails for direct answers/lab copying (hints only).
- Fallback for low-confidence search (report lack of sources, suggest related topics).
- Production auth fail-closed: Supabase JWT is the only live credential accepted by protected backend routes.
- Supabase Publishable Key is limited to browser/SSR clients; server-only Supabase work uses backend secret key.

### Interface System

- Visual system follows Sapia/EduGap tactile learning UI: cozy avocado background, green/yellow/orange/blue/red state colors, 3D depth borders, dense app sizing, and project-owned learning assets.
- App workspace scale is the source of truth for landing, auth, onboarding, and dashboard sizing. Public pages should not default to oversized marketing hero typography.
- Brand and maskable icon assets live under `frontend/public/brand/edugap/`; learning scenery, app backgrounds, seeds, soils, and mascot assets should be reused before adding new visuals.

## Non-MVP / Future Scope

- **React Flow DAG Editor**: Visual editor for prerequisites.
- **Concept Mind Map**: Interactive concept network graph.
- LMS integration, advanced multimodal tutoring, and fully automated learning plan generator.

## Success Criteria

- Chat responses strictly grounded in published sources with citation cards, adaptive in style to student's Elo score.
- Dynamic question selection successfully targets a ZPD success rate of 70%-75%.
- Student Elo score accurately reflects their mastery (full gains for independent success, discounted gains when hints are used).
- Draft materials and uncalibrated draft questions are hidden from student retrieval; published materials are retrievable.
- Mentors can review failed student queries and easily update sources.
- Golden test cases pass successfully for all happy and error paths.
- Guests cannot enter `/app`; authenticated users complete onboarding before app access.
- Protected live API routes reject missing, fake, raw UUID, expired, or cross-user credentials.


