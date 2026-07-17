# Plan: Catch-All BFF Proxy Routing

Migrate the Next.js to FastAPI `/api/v1/*` proxying logic from a static Next.js `rewrites` configuration to a dynamic Catch-All BFF Proxy Route Handler.

## User Review Required

> [!NOTE]
> This architectural shift moves request proxying from Next.js internal build-time rewrites into a dynamic runtime Route Handler.
> - **Benefits:** Allows runtime logging, custom server-side header injection (e.g., Auth tokens), dynamic error catching/fallback, and reliable streaming.
> - **Impact:** All requests to `/api/v1/*` will pass through `frontend/app/api/v1/[...path]/route.ts`. No component code changes are required.

## Proposed Changes

### Frontend Infrastructure

#### [NEW] [route.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/app/api/v1/%5B...path%5D/route.ts)
- Create a dynamic Catch-All Route Handler that intercepts all requests under `/api/v1/*`.
- Forward incoming requests (headers, query params, body) dynamically to the FastAPI backend at `BACKEND_API_URL`.
- Properly handle Server-Sent Events (SSE) content-type to allow transparent Socratic chat streaming.
- Implement central try-catch error handling to return a friendly `503 Service Unavailable` with a diagnostic message if the FastAPI backend is offline.

#### [MODIFY] [next.config.ts](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/frontend/next.config.ts)
- Remove the `/api/v1/:path*` entry from the `rewrites()` array. This allows Next.js to route those requests to our new Catch-All Route Handler.

### Documentation

#### [NEW] [adr-011-catch-all-bff-proxy-routing.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/ADR/adr-011-catch-all-bff-proxy-routing.md)
- Document this routing decision as an Architecture Decision Record (ADR) under `ADR/` with status `Reviewed`.

---

## Verification Plan

### Automated Tests
- Run `pnpm lint` in the `frontend` directory to ensure no linting/syntax errors.
- Run `pnpm build` in the `frontend` directory to check compilation.

### Manual Verification
- Verify that Socratic Chat streaming still works correctly.
- Stop the FastAPI backend and verify that calling `/api/v1/chat` or `/api/v1/adaptive/recommend` returns a clear 503 response stating that FastAPI is offline, rather than a generic network error.
