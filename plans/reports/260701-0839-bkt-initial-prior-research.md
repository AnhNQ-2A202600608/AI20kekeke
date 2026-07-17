# Research Report: BKT Initial Prior For Onboarding

Generated: 2026-07-01 08:39 Asia/Bangkok

## Executive Summary

`P(L0)` is prior probability that a learner already knows a knowledge component before modeled practice. In production systems, it should not be treated as an exact truth from a short onboarding quiz. It is an estimated prior with uncertainty.

Best practice is hybrid:

- start from population/course prior learned from historical data,
- individualize using any available learner history across related skills,
- run a short diagnostic/pretest to update the prior,
- store confidence/evidence count with the resulting `P(L0)`.

For EduGap onboarding, 5 required diagnostic MCQs can create an initial `P(L0)` seed. Optional questions up to 8 should increase confidence, not simply inflate mastery. The system should commit both `bkt_mastery_probability` and an uncertainty/evidence measure.

## Key Findings

### 1. Classic BKT Prior

BKT has four parameters per skill: initial mastery `P(L0)`, learning/transition `P(T)`, guess `P(G)`, and slip `P(S)`. The model updates hidden mastery from observed correct/incorrect responses. pyBKT summaries describe prior knowledge as probability of knowing a concept before encountering a task.

Source: [MDPI pyBKT introduction](https://www.mdpi.com/2624-8611/5/3/50)

### 2. Individualized Prior Improves Prediction

Pardos and Heffernan showed standard KT assumes shared initial prior for all students, and individualizing initial knowledge improves real-world prediction. Their strongest reported strategy used information from multiple skills to inform each student prior, not just one skill in isolation.

Sources:
- [Pardos & Heffernan 2010 PDF](https://people.csail.mit.edu/zp/papers/UMAP_final.pdf)
- [Berkeley publication page](https://www.ischool.berkeley.edu/research/publications/2010/modeling-individualization-bayesian-networks-implementation-knowledge)

### 3. Cold Start Remains Hard

Cold-start KT literature treats new learners with little/no interaction data as a major failure mode. Early predictions are unreliable until enough responses accumulate. Newer KT models may help, but the practical lesson is unchanged: do not over-trust first few answers.

Source: [Cold Start Problem in KT](https://arxiv.org/html/2505.21517v1)

### 4. IRT/CAT Is Better For Initial Placement

IRT is designed for cross-sectional assessment; BKT is designed for longitudinal learning traces. Research connects IRT and BKT and notes IRT can estimate ability, then convert ability + item difficulty/discrimination into probability of knowing a skill before practice.

Sources:
- [Learning meets Assessment: IRT and BKT](https://arxiv.org/abs/1803.05926)
- [MDPI pyBKT IRT discussion](https://www.mdpi.com/2624-8611/5/3/50)

### 5. Parameter Constraints Matter

BKT parameter fitting can become degenerate or counterintuitive if guess/slip/prior are unconstrained. Practical systems bound guess/slip and track reliability.

Sources:
- [Parametric Constraints for BKT](https://educationaldatamining.org/edm2024/proceedings/2024.EDM-long-papers.2/index.html)
- [Properties of BKT Model](https://files.eric.ed.gov/fulltext/EJ1115329.pdf)

## Recommendation For EduGap

### Model

Use this hierarchy:

1. Global concept prior from historical class data.
2. Optional cohort prior: course, track, entry quiz, declared background.
3. Individual diagnostic posterior from onboarding answers.
4. Confidence score from item count, item coverage, and answer consistency.

### Onboarding Flow

- 2 non-ability questions: goal + time/cadence.
- 5 ability questions: adaptive MCQs from existing `app.questions`.
- Optional 3 more: improve confidence.
- Do not ask more unless user chooses.

### Computation

For each concept:

```text
initial_p = population_prior(concept)
for diagnostic answer touching concept:
  p = BKT_bayes_update(p, correct, guess, slip)
  p = p + (1 - p) * transition_if_learning_during_question
```

For placement, use very small or zero transition during diagnostic if the question is assessment-only. If the diagnostic includes explanation/feedback and learning can occur, use small transition such as 0.01-0.02.

### Storage

Store:

- `bkt_mastery_probability`: diagnostic posterior as initial `P(L0)` seed.
- `elo_score`: coarse ability estimate for next item difficulty.
- `evidence_count`.
- `confidence`: low/medium/high.
- `source_type = diagnostic`.
- `prior_source`: population/default/diagnostic/historical.

## Pitfalls

- Do not call 5-question posterior “true mastery”.
- Do not count diagnostic attempts as normal practice attempts unless product explicitly wants that.
- Do not require onboarding-specific question bank if `app.questions` already has valid MCQs.
- Do not rely only on self-reported confidence; use it as weak context, not mastery evidence.
- Do not use hardcoded Bloom levels as scoring truth; item difficulty and historical calibration matter more.

## Unresolved Questions

- Does current `app.questions` have enough MCQs across target concepts and difficulty bands?
- Are existing question `difficulty_elo` values calibrated or mostly default?
- Should diagnostic use `transition=0` or a small learning transition after feedback?
