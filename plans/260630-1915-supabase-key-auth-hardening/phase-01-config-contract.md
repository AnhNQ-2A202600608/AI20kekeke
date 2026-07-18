---
phase: 1
title: Config Contract
status: completed
priority: P1
dependencies: []
---

# Phase 1: Config Contract

## Overview

Define the Supabase key contract once, then make examples and runtime config agree with it. This phase is about removing ambiguity before behavior changes.

## Requirements

- Functional: document frontend publishable key and backend secret key as separate required settings.
- Functional: preserve a deliberate migration path for existing deployments that still use `SUPABASE_KEY`.
- Non-functional: do not print, commit, or transform real env values.
- Non-functional: warnings must identify variable names only, never values.

## Architecture

Use explicit env names:

```text
Frontend/public: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
Backend/server:  SUPABASE_URL, SUPABASE_SECRET_KEY
Migration alias: SUPABASE_KEY only as temporary backend alias, with warning
```

`NEXT_PUBLIC_*` values are never valid backend privileged credentials. `SUPABASE_PUBLISHABLE_KEY` can exist only for tooling that is explicitly public/read-only; it must not feed the adaptive database adapter.

## Related Code Files

- Modify: `.env.example`
- Modify: `frontend/.env.example` if present
- Modify: `render.yaml`
- Modify: `docs/engineering/system-architecture.md`
- Modify: `docs/engineering/code-standards.md` if it already contains env/security rules
- Modify: `src/config.py` or nearest existing settings module if present

## Implementation Steps

1. Scout existing settings loaders and all references to `SUPABASE_KEY`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SUPABASE_*`.
2. Update env examples to show:
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for browser/SSR public clients.
   - `SUPABASE_SECRET_KEY` for FastAPI/server DB access.
   - `SUPABASE_KEY` as deprecated alias only if needed for zero-downtime migration.
3. Update deployment config comments so Render/secrets UI operators know the backend value must be secret/server-only.
4. Add a small config helper or settings fields if the repo already centralizes env parsing.
5. Add tests or config assertions for missing backend secret and accidental public key use.

## Success Criteria

- [x] Every env example distinguishes publishable vs secret keys.
- [x] Backend docs no longer say "Anon/Service Key" for privileged DB access.
- [x] Existing deployments can migrate without changing frontend code and backend code in the same deploy when necessary.
- [x] No real secret value appears in a tracked file, test snapshot, or report.

## Risk Assessment

Risk: renaming env variables can break production deploys. Mitigation: support `SUPABASE_KEY` as a deprecated backend alias for one release, warn loudly, and document the removal path.

Risk: warnings leak secrets. Mitigation: log variable names and key type classification only.
