# Research Report: Supabase Publishable Keys And Current Project Usage

Timestamp: 2026-06-30 Asia/Bangkok

## Executive Summary

Supabase has moved from legacy JWT-based `anon` and `service_role` API keys to opaque `sb_publishable_...` and `sb_secret_...` API keys. Official docs say legacy keys are deprecated by end of 2026, and new projects should use publishable keys in browser/public code and secret keys only on backend/server code.

This repo is mixed but not completely outdated. The Next SSR utilities already use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The active local frontend env contains both legacy anon and new publishable keys; most frontend code now prefers publishable. The backend local env uses a new `sb_secret_...` key through the generic `SUPABASE_KEY` name. The problem is naming and fallback semantics: code still says `anon`, `SUPABASE_KEY`, and falls back to `NEXT_PUBLIC_*` values in backend services. That makes misconfiguration easy.

This is probably not the main runtime bottleneck for learning/chat latency by itself. The bigger bottleneck is live auth verification: `get_current_user()` calls `db.app_client.auth.get_user(token)` for each protected request. Supabase signing-key docs say asymmetric signing keys allow local JWT validation without putting Auth server in the hot path. That is the relevant performance/security migration if endpoint latency is high.

## Sources

- Supabase API keys docs: publishable vs secret, legacy deprecation, RLS requirements.
- Supabase JWT signing keys docs: legacy JWT secret vs signing keys, local validation benefits.
- Supabase SSR docs: `@supabase/ssr`, publishable key env, browser/server clients, proxy refresh.
- Supabase troubleshooting docs: legacy anon/service rotation deprecation and migration recommendation.

## Current Repo Findings

### Frontend

| File | Pattern | Assessment |
| --- | --- | --- |
| `frontend/utils/supabase/client.ts` | `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)` | Current recommended style. |
| `frontend/utils/supabase/server.ts` | `createServerClient(...PUBLISHABLE_KEY)` with cookies | Current SSR style. |
| `frontend/utils/supabase/middleware.ts` | `createServerClient(...PUBLISHABLE_KEY)` with cookie refresh | Current SSR style, though Next now calls middleware "proxy" in new docs/build warnings. |
| `frontend/lib/supabase.ts` | Prefers publishable, falls back to legacy anon | Works, but duplicate client factory and fallback naming are messy. |
| `frontend/lib/adaptive/database.ts` | Direct Supabase client from frontend with publishable/anon fallback | Risky surface. Any writes depend entirely on RLS; better route sensitive writes through FastAPI/BFF. |

Local frontend env has both legacy anon and new publishable keys. Do not remove legacy until all code and deployment env are aligned, but prefer publishable.

### Backend

| File | Pattern | Assessment |
| --- | --- | --- |
| `src/api/adaptive_routes.py` | `SUPABASE_KEY` -> `SUPABASE_ANON_KEY` -> `SUPABASE_PUBLISHABLE_KEY` -> `NEXT_PUBLIC_*` | Dangerous fallback order for backend. Server should prefer secret key and should not silently fall back to public frontend keys for privileged operations. |
| `src/services/adaptive/supabase_database.py` | `create_client(url, key, ClientOptions(schema="app"/"audit"))` | Compatible with new secret key if `SUPABASE_KEY` is `sb_secret_...`. |
| `src/services/rag.py` and ingestion scripts | REST calls with `apikey` and `Authorization: Bearer <key>` | Compatible pattern, but variable name `supabase_anon_key` is misleading when it may hold a secret key. |
| `render.yaml` | `SUPABASE_KEY` comment says "Anon/Service Key" | Ambiguous. Should be explicit: backend secret key only. |

Root local env has `SUPABASE_KEY` set to an `sb_secret_...` value. That means the database adapter is using the new server-side key locally. I did not copy the secret value into this report.

## Is This A Bottleneck?

### Not likely: API key format alone

Using `sb_publishable_...` instead of legacy anon is mostly a security/developer-experience migration. It should not by itself fix major latency. If RLS policies are correct, publishable works as the public key.

### Likely: per-request auth network call

`get_current_user()` verifies live JWTs through `db.app_client.auth.get_user(token)`. That calls Supabase Auth. Supabase signing-key docs explicitly describe a performance/reliability benefit when asymmetric signing keys allow local JWT validation without Auth server in the hot path.

This matters for:

- `/api/v1/chat`
- `/api/v1/adaptive/*`
- `/api/v1/onboarding/*`
- `/api/v1/student/*`
- mentor/admin endpoints using `require_role`

If each UI screen fires several protected requests, each one pays a token validation call before doing real DB/LLM work.

### Also likely: client creation per request

`get_adaptive_db()` constructs a new `SupabaseAdaptiveDatabase` dependency, which creates two Supabase clients. That is probably smaller than LLM/RAG cost, but it is unnecessary overhead and makes connection/client behavior harder to reason about.

## Recommended Direction

1. Split env names:
   - Frontend: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - Backend: `SUPABASE_URL`, `SUPABASE_SECRET_KEY`
   - Legacy fallback only in a migration shim, not in normal config.

2. Remove backend fallback to public keys for privileged database adapter paths.
   - If backend only has publishable key, fail startup or enter clearly labeled read-only mode.
   - Do not let server mutate `app`/`audit` schemas through a public key by accident.

3. Keep `@supabase/ssr` utilities as the canonical frontend Supabase client.
   - Consolidate `frontend/lib/supabase.ts` and `frontend/lib/adaptive/database.ts` or route sensitive operations through BFF/FastAPI.

4. Investigate local JWT verification.
   - Use Supabase JWT signing keys/JWKS and verify JWT locally in FastAPI.
   - Keep `auth.get_user()` only as fallback or for explicit session refresh/extra user lookup.
   - Cache role lookup for a short TTL after token validation.

5. Rotate exposed local secrets.
   - Local env files currently contain Supabase and third-party keys. They are ignored, but any key exposed in chat/logs/screenshots should be rotated.

## Concrete Migration Sketch

```python
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

if not SUPABASE_URL or not SUPABASE_SECRET_KEY:
    raise RuntimeError("Backend requires SUPABASE_URL and SUPABASE_SECRET_KEY")

db = SupabaseAdaptiveDatabase(SUPABASE_URL, SUPABASE_SECRET_KEY)
```

```ts
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
```

## Unresolved Questions

- Has the Supabase project already migrated JWT signing keys to asymmetric mode, or only API keys?
- Does the target production backend env currently set `SUPABASE_KEY` to `sb_secret_...` or legacy `service_role`?
- Which frontend direct Supabase calls are still needed versus should be routed through `/api/v1`?
