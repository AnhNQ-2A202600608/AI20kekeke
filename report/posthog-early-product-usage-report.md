# PostHog Reach and Early Usage Analytics Report

Report date: 2026-07-06

Data source: PostHog project analytics, queried via PostHog API.

Measurement window: 2026-06-02 16:02 UTC to 2026-07-06 03:21 UTC.

## 1. Executive Summary

EduGap recorded meaningful early reach and product interaction during the measurement window.

The data shows three important signals:

1. The product reached a non-trivial audience: 828 unique pageview persons and 1,925 page views.
2. A meaningful share of visitors performed learning actions: 292 active learners, about 35% of unique pageview persons.
3. Active learners engaged beyond casual browsing: 5,335 questions answered, equal to about 18.3 answered questions per active learner.

This should be interpreted as **early reach and usage evidence**, not product-market fit, revenue traction, or proven learning outcome.

## 2. Data Scope and Definitions

### Measurement scope

| Item | Value |
| --- | --- |
| Source | PostHog |
| Project | EduGap frontend analytics |
| Window start | 2026-06-02 16:02 UTC |
| Window end | 2026-07-06 03:21 UTC |
| Query method | PostHog HogQL API |

### Definitions used in this report

| Term | Definition |
| --- | --- |
| Unique visitor | Unique PostHog person with `$pageview` |
| Page view | Count of `$pageview` events |
| Active learner | Unique PostHog person with at least one learning event |
| Learning event | `quiz_started`, `question_answered`, `essay_submitted`, `essay_graded`, `quiz_completed`, or `quiz_restarted` |
| Question answerer | Unique person with `question_answered` |
| Ordered quiz completer | User with `quiz_completed` after `quiz_started` |

## 3. Reach Metrics

### Overall reach

| Metric | Value |
| --- | ---: |
| Unique pageview persons | 828 |
| Page views | 1,925 |
| Total events | 44,502 |
| Unique persons, any event | 854 |

### Last 30 days

| Metric | Value |
| --- | ---: |
| Unique pageview persons | 599 |
| Page views | 1,553 |
| Total events | 37,518 |
| Unique persons, any event | 616 |

### Interpretation

Most of the tracked activity happened within the last 30 days:

- 599 / 828 unique pageview persons came from the last 30 days.
- 1,553 / 1,925 page views came from the last 30 days.
- 37,518 / 44,502 total events came from the last 30 days.

This indicates the dataset is recent and concentrated around the current product/testing period, not an old long-tail accumulation.

## 4. Learning Usage Metrics

| Metric | Value |
| --- | ---: |
| Active learners | 292 |
| Quiz starts | 853 |
| Unique quiz starters | 292 |
| Questions answered | 5,335 |
| Unique question answerers | 243 |
| Quiz completions | 584 |
| Unique quiz completers | 145 |
| Waitlist submissions | 8 |

### Derived ratios

| Ratio | Value | Meaning |
| --- | ---: | --- |
| Active learner conversion | 35.3% | 292 active learners / 828 unique visitors |
| Question answerer conversion | 29.3% | 243 question answerers / 828 unique visitors |
| Questions per active learner | 18.3 | 5,335 questions / 292 active learners |
| Quiz starts per active learner | 2.9 | 853 starts / 292 active learners |
| Quiz completions per active learner | 2.0 | 584 completions / 292 active learners |
| Ordered quiz completion rate | 49.3% | 144 ordered completers / 292 quiz starters |

## 5. Funnel Analysis

### Learning funnel

```text
828 unique visitors
-> 292 active learners
-> 243 question answerers
-> 144 ordered quiz completers
```

### Funnel interpretation

The strongest signal is that visitor traffic converted into actual learning behavior.

- 35.3% of unique visitors became active learners.
- 29.3% of unique visitors answered at least one question.
- About half of quiz starters completed the quiz flow in ordered sequence.

The funnel also shows the clearest improvement opportunity:

- Quiz completion is not yet high enough to claim strong retention or habit formation.
- The product should investigate drop-off after quiz start and before completion.
- The next iteration should focus on onboarding clarity, quiz length, perceived difficulty, progress feedback, and restart/retry behavior.

## 6. Activity Peaks

| Metric | Value |
| --- | ---: |
| Peak DAU, all events | 169 |
| Peak WAU, all events | 313 |
| Peak MAU, all events | 820 |
| Peak DAU, learning events | 71 |
| Peak WAU, learning events | 118 |
| Peak MAU, learning events | 276 |

### Interpretation

Learning usage appears bursty rather than steady.

This pattern is consistent with cohort-style learning behavior, where activity tends to cluster around lessons, deadlines, practice sessions, or campaign pushes.

The strongest usage peak for learning behavior was:

```text
118 peak weekly active learners
```

This is a useful early signal for cohort-based GTM, but it should not be presented as long-term retention.

## 7. Key Insights

### Insight 1: Reach converted into learning actions

EduGap did not only receive passive traffic. 292 out of 828 unique visitors became active learners.

This suggests the core product promise is concrete enough for a meaningful share of visitors to try learning actions.

### Insight 2: Active learners engaged with practice, not only browsing

Active learners answered 5,335 questions in total, or about 18.3 questions per active learner.

This is a stronger signal than page views because it reflects actual interaction with the learning experience.

### Insight 3: The completion funnel is useful but not yet strong enough for retention claims

The ordered quiz completion rate is 49.3%.

This is enough to show that many users complete a learning flow, but not enough to claim strong habit formation or learning outcome.

The next analytics step should identify:

- Which quiz set has the highest drop-off.
- Whether drop-off correlates with question count or difficulty.
- Whether users abandon before answering, after wrong answers, or near the final step.

### Insight 4: Usage pattern looks cohort-like

Peak weekly active learning reached 118 users, while day-to-day activity varies.

This supports the hypothesis that EduGap may work best in cohort contexts, where activity is driven by course schedule, assignments, or group learning moments.

### Insight 5: Waitlist is currently weak

Waitlist submissions are only 8.

This metric should not be used as a positive conversion signal. It may indicate:

- The waitlist CTA is weak or too late.
- Users are in learning mode, not signup mode.
- The current product path is better for usage validation than acquisition conversion.

## 8. Recommendations

### Product analytics

Add or review events for:

- `learning_path_started`
- `hint_requested`
- `citation_opened`
- `quiz_abandoned`
- `mastery_viewed`
- `review_focus_clicked`
- `quiz_completed_with_score`

These events would help distinguish passive usage, guided learning, citation trust, adaptive practice, and mastery progress.

### Funnel improvement

Prioritize understanding quiz start-to-completion drop-off:

1. Break completion rate down by quiz set.
2. Break completion rate down by question count.
3. Compare completion rate by first-question correctness.
4. Track whether hints/citations increase completion.
5. Add a lightweight exit or abandon signal if possible.

### Reporting

Use this report as an early usage analytics report, not as a direct pitch slide.

For pitch appendix, only extract the cleanest validated numbers:

- 828 unique visitors.
- 292 active learners.
- 5,335 questions answered.
- 584 quiz completions.
- 118 peak WAU learning.

### GTM interpretation

The data supports a learner-first, cohort-context narrative:

```text
Learners are willing to interact with the practice experience, and usage appears to cluster around learning moments.
```

It does not yet prove:

- Retention.
- Paid willingness.
- Mentor value.
- Learning outcome improvement.

## 9. Risks and Caveats

- PostHog identity stitching may affect unique-person counts.
- Pageview counts can differ from other analytics tools due to bot filtering, ad blockers, instrumentation setup, and event definitions.
- The measurement window is short.
- The data does not yet separate organic traffic, internal testing, cohort traffic, or demo traffic.
- Learning events show behavior, not learning gains.
- Waitlist conversion is currently too low to use as a positive GTM signal.

## 10. Follow-Up Questions

To make the next report stronger, answer these:

1. Which traffic sources created the 828 unique visitors?
2. How much usage came from real learners versus internal testing?
3. Which quiz sets produced the most completions and drop-offs?
4. What is the median number of questions answered per learner?
5. Do learners who open citations or hints complete more quizzes?
6. Can active learners be mapped to specific cohort periods or campaigns?

