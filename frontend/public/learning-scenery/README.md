# Mentora Learning Scenery Assets

Decorative learning-scene illustrations for Mentora UI cards, side panels, empty states, onboarding, and progress surfaces.

Use runtime WebP files in UI. Do not commit source PNG regeneration files.

## Runtime Rules

- Use `*-320.webp` for small cards/mobile.
- Use `*-640.webp` for default desktop cards/side panels.
- Use `*-960.webp` only for large panels or hero-like sections.
- Use `alt=""` and `aria-hidden="true"` when decorative.
- Reserve aspect ratio to avoid layout shift.
- Lazy-load below-the-fold scenes.
- Do not place text over detailed image areas.

Machine-readable metadata: [`index.json`](./index.json)

## Asset Index

| Asset | Best Use | Avoid |
|---|---|---|
| `landing-learning-hills` | landing hero, product intro, empty state | dense quiz cards |
| `onboarding-first-trail` | onboarding, first-run, setup | advanced mastery, mentor analytics |
| `tokenization-blocks` | tokenization, chunks, LLM foundations | mentor dashboard |
| `rag-knowledge-forest` | RAG, retrieval, documents, search | leaderboard |
| `agent-tool-route` | agents, tool calling, workflows | profile |
| `evaluation-checkpoint` | evaluation, metrics, quiz results | onboarding intro |
| `safety-guard-bridge` | safety, guardrails, academic integrity | celebration |
| `product-loop-lab` | product iteration, prototype, launch | RAG/security |
| `mastery-celebration` | mastery, completion, level up | error/safety states |
| `mentor-observatory` | mentor dashboard, analytics, observability | simple student cards |
| `profile-progress-garden` | profile, progress, streaks | technical RAG cards |

## Example

```tsx
<Image
  src="/learning-scenery/rag-knowledge-forest-640.webp"
  alt=""
  aria-hidden="true"
  width={220}
  height={220}
  loading="lazy"
/>
```
