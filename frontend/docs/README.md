# Frontend Docs

## Overview

This directory contains the unified frontend documentation set for the Mentora Adaptive-first AI Tutor frontend.

## Documents

| File | Purpose |
| --- | --- |
| `academic-citations.md` | **[NEW]** Trích nguồn các bài báo khoa học và cơ sở toán học đã implement. |
| `notion-docs-mapping.md` | **[NEW]** Bản đồ liên kết tài liệu cục bộ với các trang Notion tương ứng. |
| `notion-redesign-plan.md` | **[NEW]** Kế hoạch thiết kế lại giao diện Notion giúp Mentor dễ review. |
| `frontend-overview.md` | Frontend product direction, current surface, MVP modules, navigation model. |
| `frontend-pages.md` | Page inventory and per-page requirements for current and target MVP screens. |
| `frontend-design-tokens.md` | Color, typography, spacing, state, and accessibility tokens. |
| `frontend-user-flows.md` | Student, mentor, and admin flows across learning, RAG, quiz, ingestion, audit. |
| `frontend-user-stories.md` | User stories and acceptance criteria for all MVP roles. |

## Source of Truth

These frontend docs are grounded in:

- Current frontend code in `app/`, `components/`, `stores/`, and `lib/`.
- Root product docs under `../docs/product/`.
- Root engineering docs under `../docs/engineering/`.

## Maintenance Rules

- Update these docs when frontend page scope, role flows, design tokens, or MVP requirements change.
- Mark future-state behavior clearly when it is not implemented yet.
- Keep the product Adaptive-first: diagnosis, Socratic guidance, mastery tracking, and lecturer insight over generic LMS features.
