# Mobile-first Quiz Focus Mode Verification

Date: 2026-06-29

## Static Checks

- `npm run lint` in `frontend/`: passed.
- `npx tsc --noEmit` in `frontend/`: passed.
- `npm run build` in `frontend/`: passed.

Build warnings observed but not introduced by this UI change:

- npm warns about unknown project config `only-built-dependencies`.
- Next.js warns that `middleware` convention is deprecated in favor of `proxy`.
- Turbopack warns about an unexpected file in the NFT list from `next.config.ts` via `app/api/guidebook/[slug]/route.ts`.

## Browser Verification

Server used: `http://127.0.0.1:3003/app` from the successful production build.

Flow checked:

- Opened `Transformer & LLM Foundations`.
- Entered quiz via `Luyện phần yếu nhất`.
- Checked initial MCQ state.
- Submitted a wrong answer.
- Opened and closed AI Tutor sheet.

Viewport results:

| Viewport | Result |
| --- | --- |
| `240x465` initial | No horizontal overflow. Initial primary action visible. |
| `240x465` wrong answer | No horizontal overflow. Feedback shows wrong state, correct answer, detail disclosure, and `Tiếp tục` visible in viewport. |
| `240x465` AI Tutor | Sheet opens as overlay. Input and close button visible. No horizontal overflow. |
| `360x800` wrong answer | No horizontal overflow. `Tiếp tục` visible. |
| `390x844` wrong answer | No horizontal overflow. `Tiếp tục` visible. |
| `1280x800` wrong answer | Desktop remains usable. No horizontal overflow. |

## Notes

- The quiz flow currently showed the static demo fallback message because adaptive backend/concept data was not available in this local session.
- Dev server on port `3001` was unstable due an existing/stale Next dev process, so the visual check used the successful production build on port `3003`.
