---
title: Docs Page Framework Design Plan
status: completed
created: 2026-06-20
scope: docs-page-fumadocs-setup
blockedBy: []
blocks: []
---

# Docs Page Framework Design Plan

## Overview

Setup a documentation page system for the existing Next.js frontend using Fumadocs.

Goal: provide the docs shell, routing, navigation, search-ready structure, and visual direction. The user will add the final index and documentation content.

## Decisions

*   **Framework:** Use **Fumadocs** inside the current Next.js app.
    *   Fits existing `frontend` stack: Next.js 15, React 19, Tailwind 4.
    *   Avoids separate docs app such as Docusaurus or Astro Starlight.
    *   Better customization than hosted/platform-oriented options like Mintlify.
    *   Supports MDX/content-driven docs, sidebar, and docs layout patterns.
*   **Vị trí lưu trữ tài liệu:** Lưu trữ trực tiếp tại `frontend/content/docs/` dưới dạng các file `.mdx` phục vụ cho việc cập nhật nhanh chóng.
*   **Quyền truy cập:** Đường dẫn `/docs` sẽ được công khai (**public**) ngay trong phiên bản MVP.
*   **Tìm kiếm (Search):** Cấu hình tính năng tìm kiếm cục bộ (local search) của Fumadocs ngay lập tức.
*   **Hỗ trợ Mermaid:** Render sơ đồ Mermaid trực quan trên các trang tài liệu sử dụng gói `fumadocs-mermaid`.

## Scope

In scope:
- Add Fumadocs dependencies and config.
- Add `/docs` route shell.
- Add docs layout with sidebar, content area, and optional table of contents.
- Enable local search.
- Integrate Mermaid rendering support.
- Add minimal placeholder content only.
- Match current EdTech design guidelines.
- Preserve existing `docs/` Markdown as source-of-truth project docs.

Out of scope:
- Writing full documentation content.
- Migrating every existing `docs/` file to MDX.
- Building public marketing docs site.
- Versioned docs, localization, analytics, auth-gated docs.

## Phases

| Phase | File | Status | Purpose |
|---|---|---:|---|
| 1 | [Framework setup](phase-01-framework-setup.md) | Completed | Install/configure Fumadocs and Mermaid in frontend |
| 2 | [Docs route and content source](phase-02-docs-route-content-source.md) | Completed | Add `/docs` route, local search, and content structure |
| 3 | [Docs UI and visual design](phase-03-docs-ui-visual-design.md) | Completed | Apply higher-ed AI Tutor docs UX |
| 4 | [Validation and handoff](phase-04-validation-handoff.md) | Completed | Validate build, accessibility, and content handoff |

## Dependencies

- Existing frontend package: `frontend/package.json`.
- Existing design rules: `docs/product/design-guidelines.md`.
- Existing docs map: `docs/README.md`.
- Package manager/setup guide must be read before installing dependencies: `docs/guide/setup/package-managers.md`.

## Success Criteria

- `/docs` loads in the Next.js app.
- Docs sidebar and content layout work with placeholder content.
- Sơ đồ Mermaid render thành công trên MDX.
- Khung tìm kiếm hoạt động bình thường.
- User can add or edit docs content without touching route code.
- Visual direction stays calm, readable, academic, and adaptive-first.
- Build/lint pass after implementation.

## Recommended Cook Command

```bash
/ck:cook D:\CODE\AITHUCCHIEN\PROJECT\C2-App-125\plans\260620-1651-docs-page-framework-design
```

## Resolved Questions

*   *Docs content location:* Saved under `frontend/content/docs/`.
*   *Route visibility:* Public.
*   *Search functionality:* Configured immediately.
*   *Mermaid support:* Enabled using `fumadocs-mermaid` and `mermaid`.
*   *Next.js version:* Currently at `^15.4.9` (already on Next.js 15), so no major upgrade is needed; we will keep it as is.
