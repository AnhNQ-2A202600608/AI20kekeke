---
type: project
created: 2026-07-10
updated: 2026-07-10
---

# Technical Decisions

## Quiz ELO Feedback
- Animate ELO only in the existing main practice quiz ELO display after each submitted question.
- Use a per-digit odometer roll: increases roll upward, decreases roll downward, and unchanged digits remain still.
- Keep the signed delta and directional color visible until the learner moves to the next question.
- Provide a reduced-motion fallback without rolling digits.
- Keep the adaptive scoring API, ELO formula, and quiz layout unchanged.
