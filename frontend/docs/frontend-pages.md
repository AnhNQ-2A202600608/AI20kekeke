# Frontend Pages

## Overview

This document defines the intended frontend page set for the MVP vision, while marking what is already represented in the current frontend.

## Page Inventory

| Page / Route | Status | Users | Purpose |
| --- | --- | --- | --- |
| `/` Landing Page | Current | Guest | Explain the product, show proof points, and route students to login or onboarding. Logged-in users are redirected to `/app`. |
| `/app` Student Learning Dashboard | Current | Student | Responsive learning workspace: desktop week sidebar + mission/skill workspace, mobile top bar/day rail/today mission/skill list, guidebook, quiz entry, practice, leaderboard/profile tabs. |
| `/onboarding` Student Onboarding | Current | Student | Capture learner goals/context, run a short diagnostic, and save setup signals before the dashboard. |
| `/login` Login Page | Current | Student now; all roles later | Email/password login with demo bypass; target RBAC auth. |
| Quiz Focus Mode | Current in `/app` state | Student | Distraction-free pre-survey, question answering, explanations, results. |
| Student Tutor Chat | Target MVP | Student | Socratic RAG chat with 5 learning modes and citations. |
| Student Progress Dashboard | Partial current | Student | Concept radar, activity heatmap, weak concept list, next actions. |
| Lecturer Class Insights | Target MVP | Mentor | Class-level mastery, weak concepts, students needing intervention. |
| Material Ingestion Manager | Target MVP | Mentor, BTC/Admin | Upload materials, review generated chunks/quizzes, publish/unpublish. |
| RAG Test Panel | Target MVP | Mentor, BTC/Admin | Test retrieval, citation quality, low-confidence behavior. |
| Audit Dashboard | Target MVP | Mentor, BTC/Admin | Review failed queries, bad feedback, guardrail triggers, missing sources. |
| Admin Management | Target MVP | BTC/Admin | Manage roles, courses, source publication, evidence export. |

## Student Learning Dashboard

### Purpose

Help students choose the next learning action and see progress without feeling like a generic LMS.

### Responsive layout

- Desktop (`lg+`): week/day sidebar on the left and a mission-first learning workspace on the right.
- Mobile: compact brand/status top bar, horizontal day rail, Today Mission card, selected-day skill list, Guidebook notes pop-up, on-demand Sofi coach sheet, and sticky practice/guidebook CTA.

### Primary content

- 28-day program map by phase, day, track, and concept.
- Direct day access with focused concept/practice detail.
- Today Mission summary for the selected day.
- Daily skill list for the active day, with one item selected at a time.
- Guidebook notes pop-up with the selected concept preview, including the tokenizer/vector mini preview when relevant.
- Recommended next quiz or weak concept practice.
- Guidebook or source summary entry.
- Progress sidebar with XP, streak, completion, and future next-best-action.
- Optional leaderboard as secondary motivation.

### Current signals

- `LearningPath` receives quiz sets, completion state, dev mode, guidebook callback, and quiz selection.
- `LearningPath` renders a responsive split: desktop `DesktopLearningSidebar` plus mission/skill workspace, and a mobile stack with `MobileLearningTopBar`, `MobileDayRail`, `MobileTodayMissionCard`, `MobileDailySkillList`, Guidebook notes pop-up, `SofiCoachTrigger`, `SofiCoachSheet`, and a sticky CTA bar.
- `DayDetailCard` remains available as a reusable selected-day card, but the learn tab no longer uses it as the desktop primary surface.
- `RightBar` shows learning coach/ZPD, weekly rhythm, weak concept, XP, streak, and login/profile CTA.
- `LeftBar` controls Learn, Practice, Tutor Chat, Progress, and Leaderboard tabs for students.

### MVP additions

- Replace provisional Day 13-28 shells with official curriculum and quiz sets.
- Confirm official track names and persist selected track when enrollment behavior is defined.
- Keep the responsive learn workspace aligned with the selected day and concept on desktop and small screens.
- Add direct entry to Socratic Tutor Chat.

## Quiz Focus Mode

### Purpose

Give focused adaptive practice and convert attempts into mastery evidence.

### Primary content

- Pre-quiz confidence survey.
- Question panel with MCQ or short-answer input.
- Socratic hint sidebar in MVP.
- Explanation/citation after answer.
- Result summary with weak questions and next practice.

### Current signals

- Pre-survey rating and optional comment.
- MCQ instant grading.
- Short-answer self-comparison against expected answer.
- Result screen with score, post-quiz survey, incorrect questions, XP reward.

### MVP additions

- ZPD question selection from concept Elo.
- Hint-count tracking and Elo discount rule.
- AI grading bounded by rubric and citation/source checks.
- Explicit mastery delta animation.

## Student Tutor Chat

### Purpose

Offer course-grounded Socratic tutoring that adapts to student mastery.

### Learning modes

| Mode | Behavior |
| --- | --- |
| Explain | Explain concept using official sources and examples. |
| Step-by-step hint | Ask guiding questions and reveal hints gradually. |
| Debug code | Help reason about code without doing the assignment. |
| Practice | Generate practice prompt from weak concept. |
| Review submission | Review student work with rubric and suggestions. |

### Required UI states

- Empty state with suggested prompts from weak concepts.
- Retrieval loading state.
- Answer with citation cards near relevant text.
- Low-confidence fallback when source evidence is weak.
- Academic-integrity guardrail state with helpful alternative.
- Helpful/unhelpful/report controls.

## Student Progress Dashboard

### Purpose

Make mastery understandable and actionable.

### Primary content

- Concept radar chart.
- Activity heatmap.
- Weak concepts ranked by urgency.
- Recent attempts and mastery deltas.
- Suggested next quiz/chat action.

### Current signals

- Profile tab includes user header, heatmap-like grid, radar chart, skill progress bars.

### MVP additions

- Replace static/display progress with real `StudentMastery` concept data.
- Include non-color labels/icons for accessibility.
- Link each weak concept to quiz and tutor chat.

## Lecturer Class Insights

### Purpose

Help mentors find class gaps and decide interventions fast.

### Primary content

- Class mastery distribution by concept.
- Weak concept ranking.
- Student list needing support.
- Failed/low-confidence query count.
- Suggested source or quiz fixes.

## Material Ingestion Manager

### Purpose

Control what the tutor is allowed to use and what quiz content gets published.

### Primary content

- Upload PDF/PPTX.
- Metadata: course, week/day, concept tags, owner, draft/published.
- Chunking/embedding status.
- Generated quiz review.
- Publish/unpublish controls.

## RAG Test Panel

### Purpose

Let mentors/admins validate retrieval before students depend on it.

### Primary content

- Test query input.
- Retrieved chunks with source metadata.
- Generated answer preview with citations.
- Confidence score and guardrail classification.
- Mark source/answer as good or needs fix.

## Audit Dashboard

### Purpose

Keep academic integrity and source quality visible.

### Primary content

- Low-confidence queries.
- Unhelpful feedback.
- Citation error reports.
- Cheating/off-scope guardrail triggers.
- Missing-source concepts.

## References

- Current app shell: `app/page.tsx`
- Current dashboard shell: `app/app/page.tsx`
- Current onboarding flow: `app/onboarding/page.tsx`
- Current login page: `app/login/page.tsx`
- Current navigation: `components/LeftBar.tsx`
- Current right sidebar: `components/RightBar.tsx`
