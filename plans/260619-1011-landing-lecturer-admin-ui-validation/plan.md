---
title: Landing Page Validation Plan
status: review
created: 2026-06-19
scope: landing-validation
---

# Landing Page Validation Plan

## Overview

Create validation artifacts for a dual-audience landing page for the Adaptive-first AI Tutor.

Primary goal: validate message, page structure, and visual direction before implementation.

## Product Direction

- Audience: dual audience, institution-first.
- Main buyer/user: university, department, lecturer, program admin.
- Student value still visible: personalized Socratic tutor, adaptive quiz, progress tracking.
- Style: hybrid.
  - Landing/student sections: friendly, tactile, motivational.
  - Lecturer/admin sections: premium analytics, calm, credible.
- Admin/Langfuse: internal ops preview only, not learning analytics source of truth.

## Deliverables

| File | Purpose | Status |
|---|---|---|
| `landing-page-prompt.md` | Detailed prompt/spec for design validation or later coding | Completed |
| `mockup-landing-page.html` | Self-contained visual mockup, open directly in browser | Completed |
| `plan.md` | This validation plan | Completed |

## Page Sections

1. Hero
2. Problem framing
3. Adaptive learning loop
4. Student experience preview
5. Lecturer insight preview
6. Academic integrity and RAG safety
7. Internal AI ops preview
8. Pilot CTA

## Key Validation Questions

1. Does the first screen clearly communicate Adaptive-first AI Tutor, not generic chatbot?
2. Does the landing page sell to institutions while still showing student value?
3. Does the lecturer insight preview feel useful enough for MVP?
4. Is admin/Langfuse positioning clear as internal ops, not student learning analytics?
5. Is the hybrid visual style credible for higher education?
6. Are the CTAs correct: Join pilot / Book demo / Try student demo?

## Success Criteria

- Stakeholders understand the product in under 30 seconds.
- Page clearly shows 4 USPs:
  - Adaptive Learning
  - Socratic RAG
  - Academic Integrity Guardrails
  - Lecturer Insight
- No section implies AI will do homework for students.
- Admin ops remains secondary and internal.
- Visual style follows existing docs: calm, trustworthy, premium EdTech, no purple-heavy palette.

## Implementation Notes For Later

- Build real app page only after validation.
- Keep Langfuse credentials server-side.
- If admin charts are implemented later, use BFF/backend endpoint returning normalized chart DTOs.
- Avoid direct frontend fetch to Langfuse.

## Risks

| Risk | Mitigation |
|---|---|
| Landing becomes too broad | Keep institution-first narrative |
| Lecturer/admin overlap | Lecturer = teaching insight, Admin = internal ops |
| Looks like generic AI chatbot | Lead with mastery, RAG citations, intervention loop |
| Too playful for university buyers | Use tactile style lightly; analytics sections stay premium |

## Next Steps

1. Review `mockup-landing-page.html` visually.
2. Validate copy/story with user or stakeholders.
3. Decide CTA wording.
4. Decide whether to create implementation plan for actual frontend page.

## Unresolved Questions

- Final CTA wording: Join pilot, Book demo, or Request institutional demo?
- Product name to show in landing hero?
- Should landing page include pricing/contact form in MVP?
