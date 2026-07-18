# Adaptive Learning Metric Display Research - 2026-06-30

## Scope

Research how adaptive learning products expose learner progress metrics, especially whether they show internal ability estimates such as Elo or knowledge-tracing probabilities.

## Findings

### 1. Most learning products expose mastery, not model internals

Khan Academy exposes mastery levels such as Attempted, Familiar, Proficient, and Mastered. Its teacher reports organize progress by Activity, Skills, and Mastery. The learner-facing model is "mastery progress", not a raw Bayesian or Elo score.

ALEKS exposes a knowledge-state pie chart and "ready to learn" concepts. It emphasizes what the learner can do and what they are ready to learn next, not the numerical internals of the adaptive model.

ASSISTments and related ITS research discuss mastery detection and skill builders. The public/product-facing concept is skill mastery, not a displayed latent probability.

### 2. Numeric proficiency scores exist, but only when productized carefully

Duolingo Score is a counterexample: it is a user-facing numeric proficiency score. But it is not branded as an internal model value. It is a defined product metric with a bounded scale, progress meaning, and external communication strategy.

This means Mentora should not expose "Elo" globally unless it intentionally creates a stable product metric, e.g. "Mentora Skill Score", with clear semantics and validation.

### 3. Learning analytics dashboards should be actionable

Research on learning analytics dashboards repeatedly emphasizes actionability. A metric should help the learner decide what to do next. Raw Elo is less actionable than:

- "Bạn đang sẵn sàng học concept này"
- "Cần luyện lại"
- "Gần đạt mastery"
- "Đề xuất làm tiếp"
- "Mức thử thách: vừa sức / hơi khó / ôn nền"

### 4. Mentora implication

Mentora does not currently have a true global Elo. Existing Elo is per concept and used for adaptive difficulty matching. Showing it in the user profile as if it were a global ability rating is misleading.

## Recommendation

### Remove from profile

Remove global/average Elo from learner profile and top navigation.

Replace with:

- XP/streak for motivation.
- Overall mastery percent for course progress.
- Skill map with status labels.
- Recent activity.
- "Next best action" recommendations.

### Keep inside quiz, but rename

Do not show "Elo" as a primary learner-facing stat. If useful in quiz, show it as:

- "Mức thử thách"
- "Vùng luyện tập"
- "Độ khó phù hợp"
- "Sẵn sàng học tiếp"

For dev mode/admin/mentor, keep raw fields:

- concept_elo
- question_difficulty_elo
- bkt_mastery_probability
- expected_success

### Learner-facing labels

Preferred:

- "Mastery"
- "Độ nắm vững"
- "Sẵn sàng học"
- "Vùng luyện tập"
- "Cơ hội luyện tập"

Avoid:

- "Global Elo"
- "Học lực Elo"
- "Elo hiện tại" without "concept"
- "+25 Elo" as reward copy

## Product Pattern

```text
Internal model:
  concept_elo
  bkt_mastery_probability
  expected_success

Learner UI:
  Độ nắm vững: 68%
  Trạng thái: Đang học
  Vùng luyện tập: Vừa sức
  Gợi ý tiếp theo: Làm 5 câu Agentic React

Mentor/dev UI:
  concept_elo=1037
  bkt=0.68
  expected_success=0.72
```

## Sources

- Khan Academy Mastery levels and Course/Unit Mastery docs.
- ALEKS educator manual / MyPie knowledge-state model.
- Duolingo Score product announcement.
- ASSISTments mastery / knowledge tracing research.
- Learning analytics dashboard research on actionable insights.
