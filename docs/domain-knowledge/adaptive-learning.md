# Adaptive Learning

## Overview

Adaptive learning is the core product direction. The system tracks student mastery per concept, identifies weak areas, and generates targeted practice instead of offering generic chat or course management.

## MVP Algorithm Choice

Use an Elo-style mastery score for MVP instead of full IRT/Rasch estimation.

## Why Elo for MVP

- Simple closed-form updates.
- Fast enough for online practice flows.
- Works with cold start by assigning default scores.
- Easy to explain visually to students and lecturers.
- Approximates the intuition of ability vs question difficulty without heavy numerical optimization.

## Core Concepts

| Term | Meaning |
| --- | --- |
| Student mastery | Student ability score for one concept. |
| Item difficulty | Difficulty score for a quiz/flashcard item. |
| Expected success | Probability-like estimate from mastery vs difficulty. |
| Weakness flag | Marker for concepts needing review. |

## Basic Update Flow

1. Student attempts a question for a concept.
2. System determines result or graded score.
3. Backend compares student mastery against item difficulty.
4. Backend updates mastery score.
5. Backend updates weakness flag and practice priority.

## Example Formula

```text
expected = 1 / (1 + 10 ^ ((itemDifficulty - studentMastery) / 400))
studentMasteryNew = studentMasteryOld + K * (actualScore - expected)
```

For binary results, `actualScore` is `1` for correct and `0` for incorrect. For AI-graded short answers, normalize the score into a bounded range before updating mastery.

## Product Rules

- Weak concepts should drive adaptive quiz and flashcard generation.
- Mastery should be tracked per student and per concept.
- Lecturer insights should aggregate concept-level gaps across a class.
- The system should avoid overfitting from a single attempt; use reasonable K values and review history.

## Risks

- AI grading inconsistency can corrupt mastery data.
- Bad concept mapping creates misleading weakness flags.
- Too much gamification can distract from learning.

## Mitigations

- Validate and bound AI grading output.
- Keep source concept IDs attached to generated questions.
- Show mastery as guidance, not absolute truth.
- Prefer transparent labels over opaque scores where useful.

## See Also

- [Contextual Bandit Research](../research/contextual-bandit.md): Details on how the system balances exploration and exploitation when selecting the next question based on Elo rating context.
- [Bayesian Knowledge Tracing Research](../research/bayesian-knowledge-tracing.md): Research on tracking student concept mastery probability using Hidden Markov Models.
- [Adaptive Learning and Cold Start Research](../research/adaptive-learning-and-cold-start.md): Synthesis of industry architectures (Tripartite Structure) and strategies to mitigate the cold start problem.
- [Item Response Theory Research](../research/item-response-theory.md): Details on psychometric models (1PL/2PL/3PL) for item difficulty and student latent trait estimation.
- [Design-Based Research](../research/design-based-research.md): Methodology for iterative design, implementation, and feedback analysis on a target student cohort.





