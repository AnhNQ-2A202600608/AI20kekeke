# Research Report: Adaptive Onboarding Diagnostic Profile Seeding

---
created: 2026-07-01
scope: onboarding diagnostic design, UI/UX, backend mastery seeding
status: complete
---

## Executive Summary

Current onboarding is a fixed survey plus fixed diagnostic list. It can recommend a weak concept, but it does not yet seed the adaptive learner model. For the requested feature test, the better design is a short adaptive diagnostic: 2 context questions, then 5 required skill questions, then an optional continuation.

The diagnostic should update both `P(L)` / BKT mastery and Elo per concept. Bloom's taxonomy should be item metadata used to diversify cognitive demand, not the selection algorithm. The selector should use current posterior uncertainty, Q-Matrix coverage, and item difficulty to choose the next best question.

Backend must own scoring and mastery updates. Do not accept client-provided mastery or Elo. Onboarding completion should call an atomic backend operation that persists the profile and seeds `app.student_concept_mastery` plus `audit.mastery_events` with `source_type = 'diagnostic'`.

## Research Methodology

- Local code reviewed:
  - `frontend/components/onboarding/onboarding-page.tsx`
  - `frontend/lib/onboarding/*`
  - `src/api/onboarding_routes.py`
  - `db/supabase/migrations/20260611_initial_schema.sql`
  - `db/supabase/migrations/20260621_concurrency_and_async_outbox.sql`
  - `docs/research/bayesian-knowledge-tracing.md`
  - `frontend/content/docs/quiz-generation/knowledge-extraction.mdx`
- External research themes:
  - Computerized adaptive testing
  - BKT cold start
  - Cognitive diagnostic CAT / Q-Matrix
  - Elo/IRT-inspired item difficulty
  - Bloom taxonomy as item classification

## Key Findings

### 1. Current Flow Gap

Current flow:

- 6 survey questions.
- 8 fixed diagnostic questions.
- Backend accepts 7-10 diagnostic answers.
- Summary is ratio-based per concept.
- No real BKT/Elo seed write on completion.

Observed code facts:

- Frontend fixed questions: `frontend/lib/onboarding/onboarding-questions.ts`.
- Payload only carries `correct`, `concept_id`, and selected option.
- Backend summary uses per-concept correct ratio.
- DB already supports `student_concept_mastery` and `audit.mastery_events.source_type = 'diagnostic'`.

### 2. Recommended Product Flow

Keep onboarding short:

1. Context question 1: "Bạn đang học để đạt mục tiêu nào?"
2. Context question 2: "Tuần này bạn có bao nhiêu thời gian / deadline ra sao?"
3. Diagnostic question 1: medium anchor item.
4. Diagnostic questions 2-5: adaptive items.
5. Encouraging result screen.
6. Optional: "Làm thêm 3 câu để hồ sơ chính xác hơn."

Do not ask separate "strength" and "weakness" self-report during MVP. It creates more steps but weak evidence. Let diagnostic infer strengths/weaknesses, then show editable preference later in profile if needed.

### 3. Diagnostic Item Metadata

Minimum item metadata:

```ts
type DiagnosticItem = {
  id: string;
  questionId?: string;
  courseId: string;
  primaryConceptId: string;
  conceptIds: string[];
  qMatrix: Record<string, number>;
  ploId: string;
  bloomLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate';
  difficultyElo: number;
  discrimination?: number;
  guess?: number;
  slip?: number;
};
```

MVP storage options:

- Fast path: store onboarding-specific metadata in versioned YAML/JSON under `config/` or `frontend/lib/onboarding/`, then validate backend-side.
- Better path: store diagnostic-capable questions in `app.questions`, add metadata to `answer_key.diagnostic`, and reuse `difficulty_elo`.
- Later: add normalized `question_concept_map(question_id, concept_id, weight)` for Q-Matrix.

### 4. Selection Algorithm

Start:

- Pick an anchor item with high Q-Matrix coverage.
- Target difficulty near Elo 1200.
- Bloom level: `understand` or `apply`.

After each answer:

- Update concept posteriors in memory.
- Select next item maximizing:

```text
score(item) =
  0.40 * uncertainty_reduction
+ 0.25 * q_matrix_coverage_gap
+ 0.20 * zpd_fit
+ 0.10 * bloom_diversity
+ 0.05 * novelty
```

Stop:

- Required stop at 5 answers.
- Optional continue if confidence is low or user chooses to improve precision.
- Hard cap 8-10 answers.

### 5. BKT Seed Formula

For each concept touched by an answered item:

```text
p_old = current P(L), default 0.25
weight = q_matrix[concept_id]
evidence = correct ? 1 : 0

if correct:
  posterior = p_old * (1 - slip) / (p_old * (1 - slip) + (1 - p_old) * guess)
else:
  posterior = p_old * slip / (p_old * slip + (1 - p_old) * (1 - guess))

p_new = posterior + (1 - posterior) * transition
p_seed = p_old + weight * (p_new - p_old)
```

Clamp `p_seed` to `[0.0001, 0.9999]`.

For a pure initial diagnostic, use `transition = 0` or a reduced transition such as `0.02`; otherwise the diagnostic itself becomes a learning event and may over-credit. If the UI gives feedback/hints after each answer, use normal transition because it really is a learning opportunity.

### 6. Elo Seed Formula

For each primary concept:

```text
expected = 1 / (1 + 10 ^ ((question_elo - student_elo) / 400))
delta = k_diagnostic * (actual_score - expected)
student_elo_new = student_elo_old + delta
```

Recommended:

- Default `student_elo_old = 1200`.
- `k_diagnostic = 24` for the first 5 items.
- Cap total onboarding Elo movement per concept to about ±120.
- Update question Elo asynchronously only if using real production question IDs. For onboarding-only items, do not calibrate question difficulty from a tiny cohort.

### 7. Backend Architecture

Add one backend completion path:

```text
POST /api/v1/onboarding/diagnostic/complete
```

Responsibilities:

- Validate user is student.
- Validate question IDs exist in allowed onboarding diagnostic pool.
- Grade server-side or verify selected option against server-known answer key.
- Compute per-concept BKT/Elo seed.
- Upsert `onboarding_profiles`.
- Upsert `student_concept_mastery`.
- Insert `audit.mastery_events` with `source_type = 'diagnostic'`.
- Return summary and recommended next concept.

Preferred DB implementation:

- Add `app.complete_onboarding_diagnostic(...)` RPC with `SECURITY DEFINER`, restricted to `service_role`.
- Python route calls RPC through server-only client.
- Keep profile write and mastery seed in one transaction.

Avoid:

- Multiple independent PostgREST updates from route.
- Trusting client `correct`, `elo`, `bkt`, `concept_ids`, or Bloom metadata.
- Writing directly from frontend to `student_concept_mastery`.

### 8. UI/UX Recommendations

Flow:

- First screen: compact context setup, 2 cards/questions only.
- Diagnostic screen: one question at a time, tactile card, visible "Câu 3/5".
- Do not expose raw BKT/Elo in onboarding. Show student-friendly language:
  - "Sofi đang đo điểm xuất phát"
  - "Bạn đang khá chắc phần Prompt"
  - "Phần Retrieval nên bắt đầu nhẹ"
- After answer, short encouragement:
  - Correct: "Ổn. Câu tiếp theo sẽ thử mức áp dụng."
  - Wrong: "Không sao. Sofi sẽ kiểm tra lại nền tảng trước."
- Result screen after 5:
  - "Bắt đầu học"
  - "Làm thêm 3 câu để hồ sơ chính xác hơn"

Style:

- Use tactile 3D option cards matching app design.
- Replace `border-stone`/thin card look with app green/blue/yellow tokens and depth border.
- Keep one-viewport desktop.
- Mobile: sticky progress top, sticky CTA bottom, no side summary panel.

## Implementation Recommendations

### MVP Contract

Frontend sends only answer events:

```json
{
  "context": {
    "learning_goal": "lab",
    "weekly_practice_minutes": 120
  },
  "diagnostic_answers": [
    {
      "question_id": "uuid-or-onboarding-id",
      "selected_option_id": "b",
      "response_time_ms": 28000
    }
  ],
  "continue_requested": false
}
```

Backend returns:

```json
{
  "completed": true,
  "recommended_concept_id": "...",
  "summary": {
    "confidence": "medium",
    "diagnostic_total": 5,
    "seeded_concepts": [
      {
        "concept_id": "...",
        "elo_score": 1218,
        "bkt_mastery_probability": 0.42,
        "mastery_state": "learning"
      }
    ]
  }
}
```

### Data Model

No required table change for MVP if using existing `app.questions` and JSON metadata.

Recommended later:

```sql
CREATE TABLE app.question_concept_map (
  question_id uuid REFERENCES app.questions(id) ON DELETE CASCADE,
  concept_id uuid REFERENCES app.concepts(id) ON DELETE CASCADE,
  weight numeric(4,3) NOT NULL CHECK (weight > 0 AND weight <= 1),
  PRIMARY KEY (question_id, concept_id)
);
```

### Verification

Backend:

- Valid 5-answer completion seeds mastery.
- Duplicate question rejected.
- Client-forged `correct` ignored.
- Invalid question not in diagnostic pool rejected.
- `diagnostic` mastery events inserted.
- Existing completed profile is idempotently updated or explicitly rejected based on product decision.

Frontend:

- 2 context steps only.
- 5 required diagnostic steps.
- Optional continue appears only after first diagnostic result.
- Mobile no overflow.
- Tactile button depth visible.

## Common Pitfalls

- Bloom-only adaptation is weak. It controls cognitive level, not mastery inference.
- Asking self-reported weakness is not equivalent to measuring ability.
- Five questions can seed a profile, but confidence is medium unless items are well chosen.
- Client-side grading corrupts mastery if users can forge payloads.
- Updating question Elo from onboarding test items can distort difficulty calibration.

## References

- Corbett and Anderson, Bayesian Knowledge Tracing: https://link.springer.com/article/10.1007/BF01099821
- Computerized Adaptive Testing overview: https://pmc.ncbi.nlm.nih.gov/articles/PMC5968224/
- Cognitive Diagnostic CAT and Q-Matrix item selection: https://pmc.ncbi.nlm.nih.gov/articles/PMC7433381/
- Bloom taxonomy overview: https://teaching.uic.edu/cate-teaching-guides/syllabus-course-design/blooms-taxonomy-of-educational-objectives/
- Local BKT research: `docs/research/bayesian-knowledge-tracing.md`
- Local Q-Matrix onboarding note: `frontend/content/docs/quiz-generation/knowledge-extraction.mdx`

## Unresolved Questions

- Should onboarding diagnostic count as a learning opportunity? If yes, use normal BKT transition. If no, use zero/reduced transition.
- Should question difficulty Elo be calibrated from onboarding answers? Recommended no for MVP unless the same items are used in normal adaptive quiz.
- Which course ID is canonical for onboarding when a student has not chosen a course? Current code likely needs a default course resolver.
