# Phase 02 — Docs Route and Content Source

## Context Links

- Plan: `plan.md`
- Existing docs map: `docs/README.md`
- Product overview: `docs/product/project-overview-pdr.md`
- Design guidelines: `docs/product/design-guidelines.md`

## Overview

Priority: High  
Status: Complete

Add a `/docs` route with minimal content source. User will add final index and documentation content later.

## Key Insights

- Root `docs/` already contains project documentation.
- For implementation simplicity, Fumadocs content can start in `frontend/content/docs/`.
- Existing root docs should remain authoritative until a deliberate migration is planned.

## Requirements

Functional:
- `/docs` page loads.
- Dynamic docs pages can resolve content slugs.
- Placeholder content shows expected structure.
- Sidebar can be generated or configured from docs content.

Non-functional:
- Do not migrate all docs in this phase.
- Keep content placeholders minimal.

## Architecture

Recommended initial structure:

```text
frontend/
├── app/
│   └── docs/
│       ├── layout.tsx
│       └── [[...slug]]/
│           └── page.tsx
└── content/
    └── docs/
        └── index.mdx
```

Alternative if Fumadocs official setup prefers another structure: follow official setup, but keep same intent.

## Related Code Files

Create:
- `frontend/app/docs/layout.tsx`
- `frontend/app/docs/[[...slug]]/page.tsx`
- `frontend/content/docs/index.mdx`

Modify:
- Any Fumadocs source map/config file from phase 01

Delete:
- None

## Implementation Steps

1. Create docs route using Fumadocs App Router pattern.
2. Add placeholder `index.mdx` only.
3. Add route handling for missing docs pages using framework default/not found behavior.
4. Add source metadata for title/description/sidebar if required.
5. Ensure user can add docs by creating new MDX files.

## Todo List

- [x] Add `/docs` route files.
- [x] Add minimal content source.
- [x] Add metadata/title for docs landing.
- [x] Confirm adding a new MDX file requires no route changes.

## Success Criteria

- Visiting `/docs` renders placeholder docs landing.
- Dynamic slug pages render when content exists.
- Missing content does not crash the app.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Confusion between root `docs/` and frontend docs content | Document source-of-truth clearly in placeholder/handoff |
| Overbuilding IA | Only add minimal sections and let user expand |

## Security Considerations

- Public docs must not include secrets, env values, credentials, or private Notion IDs unless already intended public.

## Next Steps

Proceed to visual design and docs UX polish.

## Unresolved Questions

- Should future content be copied from root `docs/` or authored directly in `frontend/content/docs/`?
