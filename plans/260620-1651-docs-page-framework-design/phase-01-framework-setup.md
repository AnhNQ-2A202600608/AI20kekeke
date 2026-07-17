# Phase 01 — Framework Setup

## Context Links

- Plan: `plan.md`
- Frontend package: `frontend/package.json`
- Setup guide: `docs/guide/setup/package-managers.md`
- Code standards: `docs/engineering/code-standards.md`

## Overview

Priority: High  
Status: Complete

Prepare the frontend app to use Fumadocs with the smallest dependency/config footprint.

## Key Insights

- Existing app is Next.js 15 + React 19 + Tailwind 4.
- Fumadocs should live inside `frontend`, not as a separate app.
- Read package manager guide before dependency changes.

## Requirements

Functional:
- Add required Fumadocs packages.
- Add source/config files required by Fumadocs.
- Keep existing app behavior unchanged.

Non-functional:
- KISS/YAGNI: no versioned docs, no auth, no localization.
- Avoid broad refactors.

## Architecture

Docs framework is embedded in frontend:

```text
frontend/
├── app/docs/...
├── content/docs/...
└── source.config.ts or equivalent Fumadocs config
```

## Related Code Files

Modify:
- `frontend/package.json`
- frontend lockfile if present
- Fumadocs config file required by selected package setup

Create:
- Minimal Fumadocs source/config file if required

Delete:
- None

## Implementation Steps

1. Read `docs/guide/setup/package-managers.md`.
2. Confirm frontend package manager and lockfile (`pnpm`).
3. Install required Fumadocs packages and Mermaid peer dependencies:
   `pnpm add fumadocs-ui fumadocs-core fumadocs-mdx @types/mdx fumadocs-mermaid mermaid next-themes`
4. Add minimal config following official Fumadocs Next.js setup, including `source.config.ts` and `next.config.ts` integration.
5. Avoid changing unrelated app config unless required.

## Todo List

- [x] Read setup/package manager guide.
- [x] Identify package manager and lockfile (`pnpm`).
- [x] Add Fumadocs & Mermaid dependencies.
- [x] Add minimal source/config (`source.config.ts`).
- [x] Run install/build validation.

## Success Criteria

- Dependencies install cleanly.
- Config compiles.
- Existing app routes remain unaffected.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Dependency mismatch with Next 15/React 19 | Check current Fumadocs peer requirements before install |
| Too much config | Use minimal official setup only |
| Breaking existing app | Validate build after setup |

## Security Considerations

- Do not expose private docs or secrets.
- Do not hardcode environment values.

## Next Steps

Proceed to docs route and content source setup.

## Unresolved Questions

- Exact Fumadocs package names/version should be confirmed at implementation time.
