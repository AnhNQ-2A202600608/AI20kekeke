# Experiment Log: EduGap Adaptive Learning Engine

## Contribution (one sentence)
We present a decoupled, concurrency-safe adaptive learning engine that eliminates database lock contention under high student concurrency while achieving mathematically aligned student modeling and content pathing.

## Experiments Run

### Experiment 1: Elo Convergence Performance
- **Claim tested**: Adaptive question selection leads to faster and more accurate estimation of student Elo ratings than random selection.
- **Setup**: 100 students and 100 questions. Simulating 100 practice steps per student.
- **Key result**:
  - Random final Student Elo RMSE: **298.34**
  - Adaptive final Student Elo RMSE: **244.33**
- **Result files**: `eval/results/exp1_elo_convergence.csv`
- **Status**: **PASS** (Adaptive RMSE is significantly lower than Random, showing faster parameter calibration).

### Experiment 2: BKT Learning and Responsiveness Profile
- **Claim tested**: Bayesian Knowledge Tracing (BKT) accurately tracks latent mastery and responds rapidly to student mistakes without circular evaluation.
- **Setup**: 100 students and 50 practice steps. Simulated next-step prediction compared against actual binary outcomes. Mistake test: 1 student forced to answer 20 consecutive incorrect responses.
- **Key result**:
  - Total students reaching latent mastery: **95/100**
  - Mastered group estimated mastery: **0.9991**
  - BKT Next-step Prediction AUC: **0.9941**
  - BKT Responsiveness (Mistake Test final value): **0.0686** (demonstrates recovery from the "mastery trap" when student performs poorly).
- **Result files**: `eval/results/exp2_bkt_validation.csv`, `eval/results/exp2_bkt_responsiveness.csv`
- **Figures generated**: `eval/results/exp2_bkt_validation.png`

### Experiment 3: Contextual Bandit Optimization & ZPD Hit Rate
- **Claim tested**: LinUCB contextual bandit achieves lower cumulative regret and higher reward compared to random and static greedy selection.
- **Setup**: 30 virtual students, 100 questions, 30 independent random seeds. Evaluated using Common Random Numbers (CRN) against an Oracle.
- **Key results**:
  - LinUCB Bandit: Mean Final Regret = **13.19** (95% CI: $\pm 0.68$), Cumulative Reward = **1278.2**
  - Static Greedy: Mean Final Regret = **36.21** (95% CI: $\pm 0.53$), Cumulative Reward = **647.6**
  - Random Baseline: Mean Final Regret = **39.76** (95% CI: $\pm 0.99$), Cumulative Reward = **538.5**
  - Independent t-test vs Random: $t = -43.44$, $p$-value = $0.0000$ ($p < 10^{-5}$)
  - Independent t-test vs Greedy: $t = -52.40$, $p$-value = $0.0000$ ($p < 10^{-5}$)
- **Result files**: `eval/results/exp3_bandit_comparison.csv`
- **Figures generated**: `eval/results/exp3_bandit_comparison.png`

### Experiment 4: Concept Graph Propagation Latency
- **Claim tested**: Concept graph propagation handles cyclic prerequisites correctly and remains low-latency under high graph scale.
- **Setup**: 6-node cycle concept graph (A->B->C->A) and a 40-node stress test with overlapping cycle chords.
- **Key result**:
  - Cycle protection verified (visited set prevents infinite loops).
  - Decay propagation matches theory (forward decay $\beta=0.25$, backward decay $\gamma=0.25$).
  - Standard propagation duration: **1.1414 ms**
  - 40-node cycle stress test duration: **19.6348 ms** (well within the $50\text{ ms}$ budget).
- **Status**: **PASS**

### Experiment 5: Spaced Repetition Calibration
- **Claim tested**: Grid search successfully fits stability factor $S^*$ to minimize prediction error on review logs.
- **Setup**: 1000 simulated review attempts with biological memory decay: $P(\text{recall}) = 2^{-\Delta t / S}$.
- **Key result**:
  - Optimal stability factor $S^*$: **0.70 days** (~17 hours)
  - Expected Calibration Error (ECE) across 5 bins: **0.2622**
- **Result files**: `eval/results/exp5_forgetting_calibration.csv`, `eval/results/exp5_forgetting_decay.csv`

---

## Figures Inventory
| Filename | Description | Venue Section |
|---|---|---|
| `eval/results/exp2_bkt_validation.png` | (Left) BKT mastery trajectory of mastered vs unmastered students. (Right) Mastery trap mistake responsiveness. | Section 5.1 |
| `eval/results/exp3_bandit_comparison.png` | Cumulative regret curves comparing LinUCB, Greedy, and Random with 95% CI bands. | Section 5.2 |
| `eval/results/exp5_forgetting_calibration.png` | Empirical accuracy vs theoretical forgetting curve fit. | Section 5.4 |

---

## Failed / Ablated Settings
- **Direct matrix inversion in recommendation loop**: Exceeded the $5\text{ ms}$ per-request recommendation budget on larger graphs. Motivated the migration to Sherman-Morrison updates in the background outbox worker.
- **BKT without state clamping**: Mastery estimates got stuck at $0.0$ or $1.0$, rendering BKT unresponsive to mistake sequences. Addressed by clamping estimates to $[0.0001, 0.9999]$.
