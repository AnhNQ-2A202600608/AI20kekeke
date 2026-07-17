# Phase 3: FSRS Spaced Repetition Calibration

## Context Links
- Research paper md: [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md)
- Forgetting curve calibration: [exp5_forgetting_calibration.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp5_forgetting_calibration.py)

## Overview
- **Priority:** Medium
- **Status:** `pending`
- **Description:** Implement parameter calibration for the FSRS-based Spaced Repetition model using real elapsed times and correctness logs from ASSISTments or EdNet datasets, optimizing the memory stability factor $S^*$ via grid search.

## Key Insights
- Standard spaced repetition models are usually evaluated by how well the stability parameters $S$ predict recall probabilities $P(\text{recall}) = 2^{-\Delta t / S}$ compared to true student recall results ($Y \in \{0, 1\}$).
- Real datasets contain actual elapsed time intervals in seconds, which we must convert to days to align with the FSRS mathematical decay model.

## Requirements
- Parse elapsed time intervals (`elapsed_time` or chronological delta between attempts for the same question/concept) and correctness values from the logs.
- Group data points by elapsed days $\Delta t$ and compute recall predictions.
- Perform Grid Search optimization over stability parameter space $[0.1, 10.0]$ to find $S^*$ that minimizes MSE.
- Calculate the resulting Expected Calibration Error (ECE) to verify probability accuracy.

## Related Code Files
- **[NEW]** [exp9_fsrs_calibration_real.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp9_fsrs_calibration_real.py)
- **[MODIFY]** [eval_suite.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/eval_suite.py)

## Implementation Steps
1. Parse attempts to extract tuples of $(\Delta t, \text{correctness})$ for consecutive attempts by the same student on matching concept groups.
2. Write `eval/exp9_fsrs_calibration_real.py`:
   - Fit forgetting curves using the grid search MSE objective.
   - Output the optimized stability factor $S^*$ and compute ECE.
3. Save results to `eval/results/exp9_fsrs_calibration_real.csv` and plot the curve to `eval/results/exp9_fsrs_calibration_real.png`.
4. Add the execution call to `eval_suite.py` to write these calibrated FSRS metrics into the final `REPORT.txt` report.

## Todo List
- [ ] Parse time-interval logs from ASSISTments/EdNet.
- [ ] Implement `exp9_fsrs_calibration_real.py` containing FSRS curve fitting.
- [ ] Perform grid search optimization for stability calibration.
- [ ] Compute ECE over real student recall logs.
- [ ] Integrate into `eval_suite.py`.

## Success Criteria
- FSRS stability parameter is successfully calibrated, returning a non-zero stability factor $S^*$.
- Predicted recall curve aligns with true correct rates across time bins.
- PNG calibration curves are saved successfully.
