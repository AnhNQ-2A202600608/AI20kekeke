# Phase 1: ASSISTments BKT & Elo Offline Evaluation

## Context Links
- Research paper md: [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md)
- BKT evaluation script: [exp2_bkt_validation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp2_bkt_validation.py)
- Elo convergence script: [exp1_elo_convergence.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp1_elo_convergence.py)

## Overview
- **Priority:** High
- **Status:** `completed`
- **Description:** Implement offline evaluations for Bayesian Knowledge Tracing (BKT) and Elo ratings using the public ASSISTments 2009-2010 dataset. This demonstrates the numerical accuracy and predictive power of the EduGap model on real student response data.

## Key Insights
- Naive HMM BKT updates usually yield AUCs between $0.65$ and $0.75$ in student performance prediction tasks. We want to verify that EduGap's BKT update algorithm matches or exceeds this range.
- Evaluating BKT sequentially requires structuring the CSV logs chronologically per student.

## Requirements
- Load and parse the ASSISTments dataset CSV logs.
- Group student responses by `user_id` and order by `order_id` (chronologically).
- Feed student attempt results into `calculate_bkt_update` and `calculate_elo_updates` step-by-step.
- Compute the next-step prediction accuracy:
  - Predict student correctness on attempt $t$ using the updated knowledge state at $t-1$.
  - Calculate overall Area Under the ROC Curve (AUC) and Root Mean Squared Error (RMSE).

## Related Code Files
- **[NEW]** [exp7_assistments_evaluation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp7_assistments_evaluation.py)
- **[MODIFY]** [eval_suite.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/eval_suite.py)

## Implementation Steps
1. Create `eval/data/` directory and cache a subset of the ASSISTments 2009-2010 dataset (specifically columns: `user_id`, `problem_id`, `correct`, `order_id`, `ms_first_response`).
2. Write `eval/exp7_assistments_evaluation.py`:
   - Load dataset using Pandas.
   - Run sequential updates for student parameters.
   - Save predictions and compute next-step correctness prediction metrics using `scikit-learn` (`roc_auc_score` and `mean_squared_error`).
3. Run and plot the results, writing them to `eval/results/exp7_assistments_evaluation.png` and `eval/results/exp7_assistments_evaluation.csv`.
4. Integrate `exp7_assistments_evaluation.py` into `eval_suite.py` to compile the final `REPORT.txt` report.

## Todo List
- [ ] Set up `eval/data/` directory and sample ASSISTments CSV subset.
- [ ] Implement `exp7_assistments_evaluation.py` with sequential data parsing.
- [ ] Execute offline calibration for BKT and Elo, calculating AUC and RMSE.
- [ ] Plot predicted probabilities against true responses in a calibration curve.
- [ ] Update `eval_suite.py` to trigger the ASSISTments evaluation.

## Success Criteria
- Script runs successfully on ASSISTments logs and generates AUC/RMSE metrics.
- Next-step prediction AUC is computed and verified (AUC $> 0.65$ to show predictive significance).
- Output CSV and PNG files are correctly saved to `eval/results/`.

## Risk Assessment
- **Risk:** Large dataset sizes causing memory overflows or slow processing.
- **Mitigation:** Parse only a selected subset of the logs (e.g., top 1,000 students or 100,000 interactions) for evaluation purposes.
