---
phase: 5
title: Deployment And Verification
status: completed
priority: P1
dependencies:
  - 2
  - 3
  - 4
---

# Phase 5: Deployment And Verification

## Overview

Verify the migration with tests, build checks, and an operator-facing deploy checklist. This phase prevents the common failure mode: code expects new key names while production still has legacy or public-only variables.

## Requirements

- Functional: local dev, test, and production deployment paths are documented separately.
- Functional: verification proves frontend can log in and backend protected endpoints accept real JWTs after config changes.
- Functional: accidental secret exposure is checked before final handoff.
- Non-functional: no dotenv file or real key value is committed.

## Architecture

Verification layers:

```text
Config tests -> auth boundary tests -> API integration tests -> frontend lint/build -> manual/browser smoke
```

Deploy checklist is a tracked doc update, not a secret store. It must list variable names, owners, and expected key type only.

## Related Code Files

- Modify: `.env.example`
- Modify: `render.yaml`
- Modify: `docs/engineering/system-architecture.md`
- Modify/Create: `docs/engineering/deployment.md` only if a deployment doc already exists or the setup change needs a new home
- Modify: `WORKLOG.md`
- Modify/Create: tests from earlier phases

## Implementation Steps

1. Run backend focused tests:
   - config key classification;
   - auth/RBAC;
   - onboarding protected path;
   - chat/adaptive protected path if touched.
2. Run frontend checks:
   - `npm run lint`;
   - build/typecheck currently used by the repo.
3. Run a secrets scan over changed files and plan reports for accidental key values.
4. Write deploy checklist:
   - set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in frontend environment;
   - set `SUPABASE_SECRET_KEY` in backend environment;
   - leave `SUPABASE_KEY` only during migration if required;
   - remove legacy anon/service role variables after successful deploy.
5. Smoke test user flow:
   - landing -> login;
   - login -> `/app`;
   - incomplete user -> onboarding;
   - onboarding complete -> persisted status;
   - protected backend endpoint rejects missing/invalid token and accepts valid token.
6. Update the UI auth onboarding plan status notes if this plan unblocks its API verification acceptance criteria.

## Success Criteria

- [x] Backend tests pass for auth, config, onboarding, and touched API routes.
- [x] Frontend lint/build checks pass or unrelated blockers are explicitly recorded.
- [x] Changed tracked files contain no real Supabase keys, JWTs, dotenv secrets, or third-party tokens.
- [x] Deployment checklist names every required env variable and key type.
- [x] Manual smoke flow confirms frontend actually triggers backend APIs with real JWT auth.
- [x] `ck plan validate --strict` passes for this plan.

## Risk Assessment

Risk: production deploy fails due missing secret name. Mitigation: keep `SUPABASE_KEY` alias for one release only if it is secret/server-side, and make logs actionable without exposing values.

Risk: local smoke requires real Supabase credentials. Mitigation: document the exact unavailable credential precondition instead of weakening tests or adding fake production paths.
