# Phase 3: Bandit Significance & Ablation Study

## Context Links
- Critique: [gpt-report.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/gpt-report.md#L249-L279)
- Bandit Evaluation Script: [exp3_bandit_comparison.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp3_bandit_comparison.py)

## Overview
- **Priority**: Medium-High
- **Current Status**: Todo
- This phase upgrades the statistical tests in the bandit evaluation suite from independent t-tests to paired t-tests (reflecting the Common Random Numbers paired design). It also runs ablation simulations to show the value of LinUCB's different context parameters.

## Key Insights
- **Paired Design**: Since all agents face the exact same student responses and mastery transitions under identical seeds (CRN), the samples are paired. Paired t-test (`ttest_rel`) is statistically correct and increases testing power.
- **ZPD Hit Rate vs Reward**: LinUCB maximizes the custom reward, not the raw ZPD hit rate. We will add an explanation in the paper describing why LinUCB has a lower ZPD hit rate than Greedy (due to Elo updates and initial convergence noise), but achieves higher cumulative learning rewards.
- **Ablation Studies**: We will run a comparison:
  1. Full LinUCB (BKT + Elo context).
  2. LinUCB without BKT context (Elo-only).
  3. LinUCB without Elo context (BKT-only).

## Requirements
- Replace `stats.ttest_ind` with `stats.ttest_rel`.
- Implement automated ablation configurations in the simulation.
- Report paired difference confidence intervals.

## Related Code Files
- [exp3_bandit_comparison.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp3_bandit_comparison.py) [MODIFY]

## Implementation Steps
1. Modify the significance check function in `exp3_bandit_comparison.py` to import and call `scipy.stats.ttest_rel` (or its manual math equivalent as fallback).
2. Add ablation branches in `run_bandit_comparison` to evaluate a LinUCB agent with a reduced context vector (e.g. removing the BKT mastery index).
3. Compute the mean difference and confidence interval on the *paired differences* of final regrets.
4. Output the updated regret curves (with shaded CI regions) and save them to `eval/results/exp3_bandit_comparison.png`.

## Todo List
- [ ] Upgrade t-test logic in `exp3_bandit_comparison.py` to paired.
- [ ] Implement BKT-context ablation configuration.
- [ ] Compute and format paired difference stats.
- [ ] Re-run multi-seed simulation suite and verify outputs.

## Success Criteria
- Statistical report prints paired t-test results with p-value.
- Regret curves are generated showing full LinUCB, ablation LinUCB, Greedy, and Random.
- Hypothesis tests confirm LinUCB superiority with high statistical significance ($p < 10^{-5}$).

## Risk Assessment
- Scipy module not installed in some runtime environments. *Mitigation*: Fallback to manual formula for paired t-test: $t = \frac{\bar{d}}{s_d / \sqrt{n}}$ where $d_i = x_i - y_i$.
