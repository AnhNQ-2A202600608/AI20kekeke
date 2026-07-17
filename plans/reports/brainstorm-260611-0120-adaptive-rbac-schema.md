---
title: Adaptive RBAC Schema Brainstorm
created: 2026-06-11
status: reviewed
scope: database-schema-brainstorm
---

# Adaptive RBAC Schema Brainstorm

## Summary

Recommended schema direction: **Option C — Hybrid runtime + audit schema**.

Core product is **Adaptive-first AI Tutor**. Socratic is support layer: rule-based tutoring behavior, hint ladder, guardrails, and feedback style. Main system value is measuring ability, detecting weakness, selecting next learning action, and updating mastery.

MVP should keep RBAC simple but course-scoped. Adaptive data should be audit-heavy, but separated from runtime tables so MVP does not become a research warehouse.

## Scope Correction

Earlier framing as Socratic-first was wrong.

Correct framing:

- **Primary system:** Adaptive Learning engine.
- **Support behavior:** Socratic/rule-based tutoring and academic guardrails.
- **Decision loop:** contextual bandit selects next action/question using learner context.
- **Knowledge state:** BKT tracks concept mastery probability.
- **Difficulty/ability layer:** Elo tracks student ability and item difficulty.
- **MVP objective:** improve learning path quality, not just chat quality.

## Requirements

| Area | Requirement |
| --- | --- |
| RBAC | Student, Mentor, Admin/BTC; simple roles; course-scoped membership. |
| Adaptive runtime | Fast lookup of current mastery, weakness, question difficulty, eligibility. |
| Contextual bandit | Store policy decision, context, selected action, exploration/exploitation, reward. |
| BKT | Store current probability and full state transitions for audit. |
| Elo | Store current score plus transition events. |
| Socratic support | Track hints, guardrail action, feedback style, citation use. |
| Audit | Replay/debug adaptive decisions without bloating core tables. |
| MVP constraint | Avoid permission matrix and research-only schema complexity in user-facing path. |

## Recommended Approach

Use **two layers**:

1. **Runtime schema** — normalized tables used by app APIs.
2. **Audit schema** — append-only event tables with JSON snapshots for algorithm debugging and research.

This keeps the product simple while preserving full traceability.

## Core RBAC Schema

### `users`

Stores identity and profile.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Internal user id. |
| `email` | text unique | Login identifier. |
| `password_hash` | text | If email/password auth. |
| `full_name` | text | Display name. |
| `status` | enum | `active`, `invited`, `disabled`. |
| `created_at` | timestamptz | Audit. |
| `updated_at` | timestamptz | Audit. |

### `roles`

Small lookup table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | smallint pk | Stable id. |
| `code` | text unique | `student`, `mentor`, `admin`. |
| `name` | text | Human label. |

### `user_roles`

Global role assignment. Keep small.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid fk | User. |
| `role_id` | smallint fk | Global role. |
| `created_at` | timestamptz | Audit. |

Use this for Admin/BTC and simple default role. Do not model permission matrix yet.

### `courses`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Course id. |
| `code` | text | Course code. |
| `title` | text | Course title. |
| `status` | enum | `draft`, `active`, `archived`. |
| `created_by` | uuid fk | Admin/Mentor creator. |
| `created_at` | timestamptz | Audit. |

### `course_members`

Course-scoped RBAC. Important even for MVP.

| Column | Type | Notes |
| --- | --- | --- |
| `course_id` | uuid fk | Course. |
| `user_id` | uuid fk | Member. |
| `role_code` | enum | `student`, `mentor`, `admin`. |
| `status` | enum | `active`, `removed`. |
| `joined_at` | timestamptz | Audit. |

Recommended unique key: `(course_id, user_id, role_code)`.

Why needed: same person can mentor course A and study course B. Avoid `users.role` only.

## Learning Content Schema

### `course_materials`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Material id. |
| `course_id` | uuid fk | Scope. |
| `title` | text | Display title. |
| `source_type` | enum | `pdf`, `slide`, `markdown`, `url`. |
| `storage_uri` | text | File/object reference. |
| `published_status` | enum | `draft`, `published`, `archived`. |
| `uploaded_by` | uuid fk | Mentor/Admin. |
| `created_at` | timestamptz | Audit. |

Rule: student retrieval only uses `published` materials.

### `material_chunks`

Relational metadata for vector chunks.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Chunk id; also vector metadata key. |
| `material_id` | uuid fk | Source. |
| `course_id` | uuid fk | Denormalized for access filtering. |
| `concept_id` | uuid fk nullable | Mapped concept. |
| `chunk_index` | int | Source order. |
| `page_number` | int nullable | Citation. |
| `section_title` | text nullable | Citation. |
| `text_excerpt` | text | Short citation excerpt. |
| `embedding_status` | enum | `pending`, `indexed`, `failed`. |

### `concepts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Concept id. |
| `course_id` | uuid fk | Course scope. |
| `code` | text | Stable concept code. |
| `name` | text | Concept title. |
| `description` | text nullable | Optional. |
| `parent_concept_id` | uuid nullable | Simple hierarchy only. |
| `status` | enum | `active`, `archived`. |

Avoid full graph editor in MVP. Parent relation enough.

## Adaptive Runtime Schema

### `student_concept_mastery`

Main runtime state for adaptive learning.

| Column | Type | Notes |
| --- | --- | --- |
| `student_id` | uuid fk | Student. |
| `course_id` | uuid fk | Course. |
| `concept_id` | uuid fk | Concept. |
| `elo_score` | numeric | Current ability score. |
| `bkt_mastery_probability` | numeric | Current `P(L)` from 0..1. |
| `mastery_state` | enum | `not_started`, `weak`, `learning`, `mastered`. |
| `weakness_flag` | boolean | Fast dashboard/query. |
| `attempt_count` | int | Total attempts. |
| `correct_count` | int | Correct attempts. |
| `last_practiced_at` | timestamptz nullable | Recency. |
| `updated_at` | timestamptz | Runtime freshness. |

Unique key: `(student_id, course_id, concept_id)`.

Runtime reads this table first. Do not compute mastery from audit logs during API request.

### `questions`

Question bank for adaptive selection.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Question id. |
| `course_id` | uuid fk | Scope. |
| `concept_id` | uuid fk | Primary concept. |
| `source_material_id` | uuid fk nullable | Official source. |
| `type` | enum | `mcq`, `short_answer`, `code`, `flashcard`. |
| `prompt` | text | Question. |
| `answer_key` | jsonb | Correct answer/rubric. |
| `difficulty_elo` | numeric | Item difficulty. |
| `calibration_status` | enum | `draft`, `calibrating`, `published`, `retired`. |
| `created_by` | uuid fk nullable | AI/user. |
| `created_at` | timestamptz | Audit. |

Student selector only uses `published` or allowed calibrated questions.

### `question_hints`

Rule-based/Socratic hint ladder.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Hint id. |
| `question_id` | uuid fk | Parent question. |
| `level` | int | 1 light, 2 medium, 3 deep. |
| `hint_text` | text | Socratic hint. |

Socratic is stored as guided support, not the core algorithm.

### `quiz_attempts`

Attempt transaction table.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Attempt id. |
| `student_id` | uuid fk | Student. |
| `course_id` | uuid fk | Course. |
| `question_id` | uuid fk | Question. |
| `concept_id` | uuid fk | Denormalized. |
| `adaptive_decision_id` | uuid fk nullable | Link to bandit decision. |
| `student_answer` | jsonb | Raw answer; shape by question type. |
| `is_correct` | boolean nullable | For binary grading. |
| `actual_score` | numeric | Normalized 0..1 or mapped score. |
| `expected_success` | numeric | Pre-attempt estimate. |
| `hint_count` | int | Used hints. |
| `used_ai_help` | boolean | Socratic/AI help used. |
| `grading_method` | enum | `deterministic`, `ai`, `manual`. |
| `submitted_at` | timestamptz | Time. |

Keep `student_answer` JSONB to avoid premature per-type answer tables.

## Algorithm Audit Schema

### `adaptive_policies`

Policy registry.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Policy id. |
| `name` | text | `linucb`, `thompson_sampling`, `epsilon_greedy`, `zpd_elo_baseline`. |
| `version` | text | Semantic/model version. |
| `status` | enum | `draft`, `active`, `retired`. |
| `config` | jsonb | Alpha, epsilon, priors, reward target. |
| `created_at` | timestamptz | Audit. |

### `adaptive_decisions`

One row per selection decision.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Decision id. |
| `policy_id` | uuid fk | Active policy. |
| `student_id` | uuid fk | Learner. |
| `course_id` | uuid fk | Scope. |
| `concept_id` | uuid fk nullable | Target concept. |
| `decision_type` | enum | `question`, `concept`, `review`, `hint_style`. |
| `selected_action_id` | uuid nullable | Usually question id. |
| `selected_action_type` | text | `question`, `flashcard`, `concept`, `mode`. |
| `candidate_action_ids` | jsonb | Candidate set snapshot. |
| `context_snapshot` | jsonb | Elo, BKT, recency, streaks, mode, weakness. |
| `model_snapshot` | jsonb | Policy internals at decision time. |
| `expected_reward` | numeric nullable | Model score. |
| `expected_success` | numeric nullable | ZPD estimate. |
| `exploration_mode` | enum | `explore`, `exploit`, `fallback`. |
| `reason_code` | text | Human/debug reason. |
| `created_at` | timestamptz | Decision time. |

This is the most important audit table for contextual bandit.

### `adaptive_rewards`

Reward after outcome known.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Reward id. |
| `adaptive_decision_id` | uuid fk | Decision. |
| `quiz_attempt_id` | uuid fk nullable | Outcome source. |
| `reward_value` | numeric | Final reward. |
| `reward_formula` | text | e.g. `zpd_target_075_v1`. |
| `observed_success` | numeric | Actual score/correctness. |
| `target_success` | numeric | Usually 0.70-0.75. |
| `reward_components` | jsonb | Accuracy, hint penalty, time, engagement. |
| `created_at` | timestamptz | Time. |

Example reward logic:

```text
reward = 1 - 2 * abs(observed_or_expected_success - 0.75) - hint_penalty
```

But formula must be versioned because this will change.

### `mastery_events`

Append-only state transition log for Elo + BKT.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Event id. |
| `student_id` | uuid fk | Student. |
| `course_id` | uuid fk | Course. |
| `concept_id` | uuid fk | Concept. |
| `source_type` | enum | `quiz_attempt`, `flashcard_review`, `manual_adjustment`, `diagnostic`. |
| `source_id` | uuid nullable | Attempt/review id. |
| `elo_before` | numeric | Previous Elo. |
| `elo_after` | numeric | New Elo. |
| `elo_delta` | numeric | Difference. |
| `bkt_before` | numeric | Previous P(L). |
| `bkt_after` | numeric | New P(L). |
| `bkt_delta` | numeric | Difference. |
| `state_before` | text | Previous mastery state. |
| `state_after` | text | New mastery state. |
| `parameters_snapshot` | jsonb | K, guess, slip, transition, discount factor. |
| `created_at` | timestamptz | Time. |

This supports audit without recomputing current state.

### `bkt_parameters`

Current/default BKT params by concept.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Param row. |
| `course_id` | uuid fk | Course. |
| `concept_id` | uuid fk | Concept. |
| `prior_learned` | numeric | P(L0). |
| `transition_learn` | numeric | P(T). |
| `guess` | numeric | P(G). |
| `slip` | numeric | P(S). |
| `version` | text | Param version. |
| `status` | enum | `active`, `retired`. |
| `created_at` | timestamptz | Audit. |

MVP can start with default params and refine later.

### `question_elo_events`

Track item difficulty updates separately.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Event id. |
| `question_id` | uuid fk | Question. |
| `quiz_attempt_id` | uuid fk | Trigger. |
| `difficulty_before` | numeric | Old difficulty. |
| `difficulty_after` | numeric | New difficulty. |
| `difficulty_delta` | numeric | Delta. |
| `parameters_snapshot` | jsonb | K, expected, score. |
| `created_at` | timestamptz | Time. |

## Chat / Socratic Support Schema

### `chat_sessions`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Session. |
| `student_id` | uuid fk | Student. |
| `course_id` | uuid fk | Course. |
| `mode` | enum | `explain`, `hint`, `debug_code`, `practice`, `review_submission`. |
| `started_at` | timestamptz | Time. |
| `ended_at` | timestamptz nullable | Time. |

### `chat_messages`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Message. |
| `session_id` | uuid fk | Session. |
| `role` | enum | `student`, `assistant`, `system`. |
| `content` | text | Message content. |
| `concept_id` | uuid nullable | Detected/mapped concept. |
| `rag_confidence` | numeric nullable | Retrieval confidence. |
| `policy_action` | enum | `answer`, `hint`, `refuse`, `redirect`, `low_confidence`. |
| `guardrail_flags` | jsonb | Cheating/offscope/etc. |
| `adaptive_context_snapshot` | jsonb | Mastery state used for tone/hint depth. |
| `created_at` | timestamptz | Time. |

Socratic output can adapt to mastery, but should not own mastery logic.

### `message_citations`

| Column | Type | Notes |
| --- | --- | --- |
| `message_id` | uuid fk | Assistant message. |
| `chunk_id` | uuid fk | Source chunk. |
| `rank` | int | Citation order. |
| `quoted_excerpt` | text | Display excerpt. |

## Feedback and Telemetry

### `feedback_events`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Event. |
| `user_id` | uuid fk | Reporter. |
| `course_id` | uuid fk | Scope. |
| `target_type` | enum | `message`, `question`, `citation`, `quiz_attempt`. |
| `target_id` | uuid | Target id. |
| `feedback_type` | enum | `helpful`, `unhelpful`, `incorrect`, `bad_citation`, `unsafe`. |
| `comment` | text nullable | Optional. |
| `created_at` | timestamptz | Time. |

### `learning_signals`

General telemetry, not source of truth.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | Signal. |
| `student_id` | uuid fk | Student. |
| `course_id` | uuid fk | Course. |
| `concept_id` | uuid nullable | Concept. |
| `signal_type` | enum | `chat`, `quiz`, `hint`, `review`, `feedback`, `guardrail`. |
| `signal_value` | jsonb | Flexible payload. |
| `created_at` | timestamptz | Time. |

## Key Flows

### Adaptive question selection

1. Load `student_concept_mastery`.
2. Load candidate `questions` for target concept/course/status.
3. Build context: Elo, BKT, recent attempts, weakness, streak, hint history.
4. Policy selects action.
5. Insert `adaptive_decisions`.
6. Return selected question.

### Attempt update

1. Student submits answer.
2. Grade deterministic or AI-bounded.
3. Insert `quiz_attempts`.
4. Compute Elo student update.
5. Compute BKT update.
6. Update `student_concept_mastery`.
7. Insert `mastery_events`.
8. Update item difficulty if enabled.
9. Insert `question_elo_events`.
10. Compute reward.
11. Insert `adaptive_rewards`.

### Socratic/rule-based hint support

1. Student requests hint or low mastery triggers softer explanation.
2. Use `question_hints` or generated Socratic response.
3. Log hint count in `quiz_attempts`.
4. Apply Elo discount if correct after hints.
5. Store guardrail/hint metadata in `chat_messages` or `learning_signals`.

## Indexing Recommendations

| Table | Index |
| --- | --- |
| `course_members` | `(user_id, course_id)`, `(course_id, role_code)` |
| `student_concept_mastery` | `(student_id, course_id)`, `(course_id, concept_id, mastery_state)` |
| `questions` | `(course_id, concept_id, calibration_status)`, `(concept_id, difficulty_elo)` |
| `quiz_attempts` | `(student_id, course_id, submitted_at desc)`, `(question_id)` |
| `adaptive_decisions` | `(student_id, created_at desc)`, `(policy_id, created_at desc)` |
| `adaptive_rewards` | `(adaptive_decision_id)`, `(created_at desc)` |
| `mastery_events` | `(student_id, concept_id, created_at desc)` |
| `chat_messages` | `(session_id, created_at)` |

## Security Rules

- Backend must enforce `course_members`; never trust frontend role.
- Student can only read published material and own mastery/attempts.
- Mentor can read course-level aggregate and students in their course.
- Admin/BTC can manage users/materials/audit.
- Raw prompts, model internals, embeddings credentials must not be exposed.
- Uploaded material may contain prompt injection; retrieval output must be constrained to citation use.
- AI grading output must be validated before updating mastery.

## Trade-offs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Course-scoped role over `users.role` only | Correct for real classes | Slightly more joins |
| JSON snapshots in audit tables | Flexible for bandit/BKT changes | Harder analytics unless ETL |
| Runtime + audit split | Fast app, full trace | More write events per attempt |
| BKT + Elo together | Robust concept mastery + item difficulty | Need clear source of truth rules |
| No permission matrix | KISS MVP | Later migration if enterprise roles needed |

## Source of Truth Rules

- Current student state: `student_concept_mastery`.
- Attempt history: `quiz_attempts`.
- Decision trace: `adaptive_decisions`.
- Reward trace: `adaptive_rewards`.
- Algorithm transition trace: `mastery_events`, `question_elo_events`.
- Content access: `course_materials.published_status` + `course_members`.

Do not derive runtime state from audit logs during normal API requests.

## Implementation Considerations

- Start with `zpd_elo_baseline` policy and same audit schema.
- Add LinUCB/Thompson later without migration pain.
- Store policy config/version on every decision.
- Keep BKT params versioned because priors will change after real data.
- Use append-only audit logs; correct mistakes by new event, not mutation.
- Keep dashboards querying runtime/aggregate tables, not raw audit logs.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Audit volume grows fast | Storage/cost | Partition by month/course later; archive old events. |
| JSON snapshots become messy | Hard analysis | Define minimal required keys per policy version. |
| BKT/Elo conflict | Confusing mastery | Use combined state rule; document threshold. |
| AI grading noise corrupts mastery | Bad adaptation | Bound score, require confidence, log grading method. |
| Overbuilding RBAC | Slows MVP | Keep roles simple; no permission matrix now. |

## Recommended Mastery Rule

Use both Elo and BKT:

| State | Suggested rule |
| --- | --- |
| `not_started` | attempt_count = 0 |
| `weak` | low Elo or BKT < 0.45 |
| `learning` | medium Elo and BKT 0.45-0.80 |
| `mastered` | BKT >= 0.80 and stable Elo above threshold |

Elo handles difficulty and ranking. BKT handles confidence of concept mastery. Do not let one lucky correct answer mark mastered.

## Next Steps

1. Convert this brainstorm to ADR because it affects architecture/database/algorithm design.
2. Create implementation plan for schema migrations and service boundaries.
3. Define exact enum values and numeric thresholds.
4. Decide whether audit tables are in same database schema or separate `analytics` schema.
5. Add ERD after table names stabilize.

## MVP Fit

Có. Schema supports Adaptive-first MVP while keeping RBAC simple and Socratic support scoped.

## USP Served

Adaptive Learning primary. Socratic RAG, Guardrails, Lecturer Insight supported.

## Scope Label

MVP core for runtime schema. Research/Post-MVP friendly for detailed adaptive audit tables.

## Unresolved Questions

- Should audit tables live in default schema or separate `analytics`/`audit` schema?
- Should `selected_action_id` support non-question actions from day one, or keep only question selection first?
- What initial BKT thresholds define `weak`, `learning`, `mastered`?
- Which bandit policy ships first: ZPD Elo baseline, LinUCB, or Thompson Sampling?
