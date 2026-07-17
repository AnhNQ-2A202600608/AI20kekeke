# BKT System Research Note - 2026-06-30

## Scope

Compare EduGap's current Bayesian Knowledge Tracing design with common adaptive tutoring practice.

## External Findings

- Classic BKT estimates a learner's changing knowledge state per skill/knowledge component, using observed correct/incorrect responses.
- BKT is commonly modeled as a hidden Markov model with four parameters: prior learned, transition/learn, guess, and slip.
- Intelligent tutoring systems use these per-skill mastery probabilities for mastery learning and sequencing: continue practice until a mastery threshold is reached, then move to another knowledge component.
- Modern BKT practice often fits parameters from data and may individualize or contextualize parameters, especially prior, learn rate, guess, and slip.
- BKT remains useful mainly because it is interpretable. Deep KT and IRT/logistic models can improve prediction, but are harder to explain and need more data.

## EduGap Alignment

- The backend concept is correct: `student_concept_mastery` stores per-student, per-course, per-concept `bkt_mastery_probability`.
- The Python BKT formula is the standard binary posterior update followed by the learning transition.
- The SQL RPC has been migrated toward the same binary update with `actual_score >= 0.75`.
- Using BKT as one feature in the LinUCB context vector is reasonable, as long as BKT remains a mastery estimate and Elo remains a difficulty/ability matching signal.

## Mismatches / Risks

- Frontend language can imply "overall Elo/mastery", while backend truth is concept-level mastery.
- BKT defaults are currently fixed or fallback-based. Literature favors data-fitted parameters once enough logs exist.
- `weakness_flag = bkt < 0.50` while `mastery_state = weak only if bkt < 0.30` creates a semantic split that must be explicitly named or unified.
- Graph propagation directly changes related concepts' current BKT. This is a heuristic, not classic BKT. It should be documented as prerequisite-transfer, not "BKT itself".
- Forgetting decay applied to BKT is also an extension, not classic BKT. It can be useful, but should be labeled as time-decayed mastery.
- Evaluation should use held-out next-response prediction metrics, not only latent-state simulation.

## Recommendation

Keep BKT simple for now:

1. Treat BKT as per-concept mastery probability.
2. Treat Elo as per-concept ability/difficulty alignment.
3. Treat global user Elo only as an aggregate dashboard metric, not adaptive source of truth.
4. Rename UI labels to "Concept Elo" and "Concept Mastery" or Vietnamese equivalents.
5. Do not claim graph propagation or forgetting are standard BKT. Claim they are product heuristics layered on top.
6. Add later: parameter fitting with pyBKT or equivalent once real attempts are available.

## Sources

- Corbett & Anderson, "Knowledge tracing: Modeling the acquisition of procedural knowledge"
- Pelanek, "Bayesian Knowledge Tracing, Logistic Models, and Beyond"
- Badrinath, Wang, Pardos, "pyBKT: An Accessible Python Library of Bayesian Knowledge Tracing Models"
- Bulut et al., "An Introduction to Bayesian Knowledge Tracing with pyBKT"
- Mao, "Deep Learning vs. Bayesian Knowledge Tracing"
- Yudelson, Koedinger, Gordon, "Individualized Bayesian Knowledge Tracing Models"
- Baker, Corbett, Aleven, "Contextual Estimation of Slip and Guess Probabilities"
