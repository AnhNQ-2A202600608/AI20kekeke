# Phase 2: EdNet LinUCB Bandit Off-Policy Evaluation

## Context Links
- Research paper md: [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md)
- Bandit comparison script: [exp3_bandit_comparison.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp3_bandit_comparison.py)
- Li et al. (2010) LinUCB citation: [references.bib](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/references.bib)

## Overview
- **Priority:** High
- **Status:** `in-progress`
- **Description:** Implement off-policy evaluation (OPE) for the LinUCB contextual bandit algorithm using static student response logs from the EdNet dataset. Using the Replay Match algorithm (Li et al., 2010), we simulate how our bandit recommendations would perform on real-world logs.

## Key Insights
- Because logs are static, we cannot receive rewards for questions the user did not actually answer in the dataset.
- The **Replay Match** algorithm addresses this: at each log step, we construct the student context and ask LinUCB to recommend a question. If LinUCB recommends the same question the student actually answered, we record the response, update LinUCB, and advance the regret log. If not, we ignore/skip that log step.

## Requirements
- Parse EdNet KT1 logs.
- Map EdNet questions to candidate arms with difficulty estimates.
- Implement the Replay Match loop:
  - If recommended question == actual question in log:
    - Update covariance matrix using the actual reward.
    - Track cumulative reward and regret.
  - Else:
    - Skip to the next log step without updating parameters.
- Compare LinUCB Replay cumulative reward against a Random recommendation baseline (also run via Replay on the same logs).

## Related Code Files
- **[NEW]** [exp8_ednet_bandit_ope.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp8_ednet_bandit_ope.py)
- **[MODIFY]** [eval_suite.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/eval_suite.py)

## Implementation Steps
1. Cache a subset of EdNet KT1 CSV student interaction logs in `eval/data/` (columns: `timestamp`, `solving_id`, `question_id`, `user_answer`, `elapsed_time`).
2. Write `eval/exp8_ednet_bandit_ope.py`:
   - Initialize bandit parameters.
   - Run the Replay Match simulation loop over chronological EdNet records.
   - Save regret logs and compute final cumulative regret.
3. Plot the cumulative regret comparison curves and write the results to `eval/results/exp8_ednet_bandit_ope.png` and `eval/results/exp8_ednet_bandit_ope.csv`.
4. Integrate the evaluation in `eval_suite.py` to include off-policy results in `REPORT.txt`.

## Todo List
- [ ] Set up EdNet sample CSV data subset under `eval/data/`.
- [ ] Implement `exp8_ednet_bandit_ope.py` containing the Replay Match selector.
- [ ] Verify cumulative reward and regret curves show LinUCB outperforming Random.
- [ ] Add the execution command and metrics to `eval_suite.py`.

## Success Criteria
- Replay Match successfully completes over EdNet logs.
- Cumulative reward curve demonstrates that LinUCB achieves higher average reward per matched trial than Random.
- Output CSV and PNG plots are generated in `eval/results/`.

## Risk Assessment
- **Risk:** High rejection rate in Replay Match. Because the candidate pool has 100+ questions, the probability of recommending the exact same question is low, requiring very large log datasets to obtain enough matched steps.
- **Mitigation:** Use a smaller candidate question pool during matching, or apply Inverse Propensity Scoring (IPS) to weight matched attempts.
