# Implementation Plan: Real-World Evaluation using ASSISTments & EdNet

This plan describes how to transition the EduGap engine from a simulation-only framework to a real-world validation system using public academic datasets (ASSISTments and EdNet).

## Plan Status
- **Overall Status:** `in-progress`
- **Progress:** 40% (Phase 1: completed, Phase 2: in-progress, Phase 3: pending)

## Open Questions

> [!IMPORTANT]
> 1. **Dataset Sourcing:** Do we download and cache a small subset of ASSISTments 2009-2010 (e.g., 1,000 students) and EdNet (e.g., KT1 dataset) locally in the repository, or should the script download them dynamically?
> 2. **Evaluation Metrics Baseline:** For BKT, should we compare against standard literature baselines (e.g., Corbett & Anderson standard AUC of ~0.65 - 0.75)?
> 3. **FSRS Timing Binning:** The elapsed time in ASSISTments is recorded in seconds. Should we bin the elapsed time in days as FSRS requires, or configure stability calibration on hour-level granularity?

## Phases

### Phase 1: ASSISTments BKT & Elo Offline Evaluation
- **Goal:** Validate BKT and Elo algorithms on real student logs, computing next-step predictive AUC and RMSE.
- **Status:** `pending`
- **Target File:** [phase-01-assistments-bkt-elo.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-1051-real-world-evaluation-assistments-ednet/phase-01-assistments-bkt-elo.md)

### Phase 2: EdNet LinUCB Bandit Off-Policy Evaluation
- **Goal:** Evaluate LinUCB recommendations against random/greedy baselines on EdNet static logs using the Replay Match algorithm (Li et al., 2010).
- **Status:** `pending`
- **Target File:** [phase-02-ednet-linucb-replay.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-1051-real-world-evaluation-assistments-ednet/phase-02-ednet-linucb-replay.md)

### Phase 3: FSRS Spaced Repetition Calibration
- **Goal:** Calibrate memory stability factor $S^*$ on real elapsed time intervals from student logs.
- **Status:** `pending`
- **Target File:** [phase-03-fsrs-calibration.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260622-1051-real-world-evaluation-assistments-ednet/phase-03-fsrs-calibration.md)

## Key Dependencies
- `pandas` for processing dataset CSVs.
- `scikit-learn` for AUC/ROC computation (already installed).
- Dataset cache directory: `eval/data/`.
