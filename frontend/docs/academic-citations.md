# Academic Citations & Scientific Foundations

This document provides the scientific citations, academic papers, and mathematical foundations for the adaptive learning algorithms implemented in the **Mentora** engine. These publications serve as the mathematical "Source of Truth" for both our production implementation and the verification gates in our evaluation suite.

---

## 1. Bayesian Knowledge Tracing (BKT)

### Academic Citation
*   **Paper:** Corbett, A. T., & Anderson, J. R. (1994). *Knowledge tracing: Modeling the acquisition of procedural knowledge.* User Modeling and User-Adapted Interaction, 4(4), 253-278.
*   **Type:** Foundational Student Knowledge State Modeling.
*   **BibTeX:**
    ```bibtex
    @article{corbett1994knowledge,
      title={Knowledge tracing: Modeling the acquisition of procedural knowledge},
      author={Corbett, Albert T and Anderson, John R},
      journal={User modeling and user-adapted interaction},
      volume={4},
      number={4},
      pages={253--278},
      year={1994},
      publisher={Springer}
    }
    ```

### Implementation in Mentora
*   **Production Code:** [bkt.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/bkt.py)
*   **Mathematics:** Updates the latent mastery probability $P(L_t)$ based on binary observations (correct/incorrect):
    *   *Posterior Update:*
        $$P(L_t | \text{Correct}) = \frac{P(L_t)(1 - S)}{P(L_t)(1 - S) + (1 - P(L_t))G}$$
        $$P(L_t | \text{Incorrect}) = \frac{P(L_t)S}{P(L_t)S + (1 - P(L_t))(1 - G)}$$
    *   *Transition Chance:*
        $$P(L_{t+1}) = P(L_t | \text{Observation}) + (1 - P(L_t | \text{Observation}))P(T)$$
*   **Evaluation Suite:** Verified in [exp2_bkt_validation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp2_bkt_validation.py) using pure BKT simulated emission and BKT state prediction accuracy (calculating Wilcoxon-Mann-Whitney ROC AUC).

---

## 2. Elo Rating System in Education

### Academic Citation
*   **Paper:** Pelánek, R. (2016). *Applications of the Elo rating system in education.* Computers & Education, 98, 191-208.
*   **Type:** Dynamic Student Ability and Question Difficulty Estimation.
*   **BibTeX:**
    ```bibtex
    @article{pelanek2016applications,
      title={Applications of the Elo rating system in education},
      author={Pel{\'a}nek, Radek},
      journal={Computers \& Education},
      volume={98},
      pages={191--208},
      year={2016},
      publisher={Elsevier}
    }
    ```

### Implementation in Mentora
*   **Production Code:** [elo.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/elo.py)
*   **Mathematics:** Models the expected probability of correctness using a logistic function and updates parameters symmetrically or asymmetrically:
    *   *Expected Success:*
        $$P(\text{success}) = \frac{1}{1 + 10^{(\theta - \alpha)/400}}$$
    *   *Parameter Update:*
        $$\alpha_{\text{new}} = \alpha + K \cdot (\text{Score} - P(\text{success}))$$
        $$\theta_{\text{new}} = \theta + K \cdot (P(\text{success}) - \text{Score})$$
*   **Evaluation Suite:** Verified in [exp1_elo_convergence.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp1_elo_convergence.py) using seeded student populations to measure convergence speed (RMSE) of estimated student ability against the latent truth.

---

## 3. Contextual Multi-Armed Bandits (LinUCB)

### Academic Citation
*   **Paper:** Li, L., Chu, W., Langford, J., & Schapire, R. E. (2010). *A contextual-bandit approach to personalized news article recommendation.* Proceedings of the 19th International Conference on World Wide Web, 291-300.
*   **Educational Adaptations:** Clement, B., Roy, D., Oudeyer, P. Y., & Lopes, M. (2015). *Multi-armed bandits for intelligent tutoring systems.* Journal of Educational Technology & Society, 18(2), 268-281.
*   **Type:** Personalized Question Recommendation under Exploration/Exploitation Trade-offs.
*   **BibTeX:**
    ```bibtex
    @inproceedings{li2010contextual,
      title={A contextual-bandit approach to personalized news article recommendation},
      author={Li, Lihong and Chu, Wei and Langford, John and Schapire, Robert E},
      booktitle={Proceedings of the 19th international conference on World Wide Web},
      pages={291--300},
      year={2010}
    }
    ```

### Implementation in Mentora
*   **Production Code:** [bandit.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/bandit.py)
*   **Mathematics:** Recommends questions (arms) using Upper Confidence Bound (UCB) on linear regression projections:
    $$a_t = \arg\max_{a \in \mathcal{A}_t} \left( x_{t,a}^\top \hat{\theta}_a + \alpha \sqrt{x_{t,a}^\top A_a^{-1} x_{t,a}} \right)$$
*   **Evaluation Suite:** Verified in [exp3_bandit_comparison.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp3_bandit_comparison.py) comparing LinUCB against Random and Greedy baselines under paired Common Random Numbers (CRN), validating reward curves and Zone of Proximal Development (ZPD) targeting hit rates.

---

## 4. Concept Graph Mastery Propagation

### Academic Citation
*   **Paper:** Hwang, G. J. (2003). *A concept map model for developing intelligent tutoring systems.* Cognitive Systems Research, 4(3), 217-230.
*   **Type:** Multi-concept Dependency & Graph Propagation.
*   **BibTeX:**
    ```bibtex
    @article{hwang2003concept,
      title={A concept map model for developing intelligent tutoring systems},
      author={Hwang, Gwo-Jen},
      journal={Cognitive Systems Research},
      volume={4},
      number={3},
      pages={217--230},
      year={2003},
      publisher={Elsevier}
    }
    ```

### Implementation in Mentora
*   **Production Code:** [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py)
*   **Mathematics:** Propagates delta updates to dependent/prerequisite concepts recursively with geometric decay coefficients:
    *   *Forward Propagation:*
        $$\Delta M(c) = \beta \cdot \Delta M(p) \cdot W(p, c)$$
    *   *Backward Propagation:*
        $$\Delta M(p) = \gamma \cdot \Delta M(c) \cdot W(p, c)$$
*   **Evaluation Suite:** Verified in [exp4_graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp4_graph_propagation.py) asserting exact computed decay bounds on cyclic/stress graphs and verifying write-through cache invalidation.

---

## 5. Spaced Repetition (Forgetting / FSRS)

### Academic Citation
*   **Paper:** Ye, J. (2022). *A Free Spaced Repetition Scheduler (FSRS) Algorithm.* 
*   **Foundational Theory:** Woźniak, P. A., & Gorzelańczyk, E. J. (1994). *Optimization of repetition spacing in the practice of learning.* Acta Neurobiologiae Experimentalis, 54(1), 59-62.
*   **Type:** Memory Retention Decay over Time.
*   **BibTeX:**
    ```bibtex
    @article{wozniak1994optimization,
      title={Optimization of repetition spacing in the practice of learning},
      author={Wo{\'z}niak, Piotr A and Gorzela{\'n}czyk, Edward J},
      journal={Acta Neurobiologiae Experimentalis},
      volume={54},
      number={1},
      pages={59--62},
      year={1994}
    }
    ```

### Implementation in Mentora
*   **Production Code:** [forgetting.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/forgetting.py)
*   **Mathematics:** Models memory decay based on stability days:
    $$P_{\text{effective}} = P_{\text{stored}} \cdot 2^{-\Delta t / S}$$
    Updates stability $S$ dynamically based on performance ease factors:
    $$S_{\text{new}} = \begin{cases} 
      S \cdot \text{ease\_factor} & \text{if Score} \ge 0.8 \\
      \max(1.0, S \cdot 0.5) & \text{if Score} < 0.5 \\
      S & \text{otherwise}
    \end{cases}$$
*   **Evaluation Suite:** Verified in [exp5_forgetting_decay.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp5_forgetting_decay.py) validating FSRS lazy decay calculations, stability updates, and daily longitudinal retention simulation.

---

## 6. Graphusion (Scientific Knowledge Graph Construction)

### Academic Citation
*   **Paper:** Rui Yang, Boming Yang, Xinjie Zhao, Fan Gao, Aosong Feng, Sixun Ouyang, Moritz Blum, Tianwei She, Yuang Jiang, Freddy Lecue, Jinghui Lu, and Irene Li. (2025). *Graphusion: A RAG Framework for Scientific Knowledge Graph Construction with a Global Perspective.* In Companion Proceedings of the ACM Web Conference 2025 (WWW Companion '25), April 28-May 2, 2025, Sydney, NSW, Australia. ACM, New York, NY, USA.
*   **DOI:** https://doi.org/10.1145/3701716.3717821
*   **Type:** Scientific Knowledge Graph Construction and Educational QA.
*   **BibTeX:**
    ```bibtex
    @inproceedings{yang2025graphusion,
      title={Graphusion: A RAG Framework for Scientific Knowledge Graph Construction with a Global Perspective},
      author={Yang, Rui and Yang, Boming and Zhao, Xinjie and Gao, Fan and Feng, Aosong and Ouyang, Sixun and Blum, Moritz and She, Tianwei and Jiang, Yuang and Lecue, Freddy and Lu, Jinghui and Li, Irene},
      booktitle={Companion Proceedings of the ACM Web Conference 2025 (WWW Companion '25)},
      year={2025},
      publisher={ACM}
    }
    ```

### Implementation in Mentora
*   **Production Code:** Graph relationships loaded into the database schema and traversed via `propagate_mastery` inside [graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/services/adaptive/graph_propagation.py) are grounded in Graphusion's hierarchical concept modeling (using the LectureBankCD dataset) and Socratic learning pathways.
*   **Evaluation Suite:** Evaluated in [exp4_graph_propagation.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/eval/exp4_graph_propagation.py) which tests directed cyclic and acyclic graph traversals, representing the global-fusion sub-graph structures designed in the Graphusion framework.

---

## 7. WizardLM (Evol-Instruct Instruction Complication)

### Academic Citation
*   **Paper:** Can Xu, Qingfeng Sun, Kai Zheng, Xiubo Geng, Pu Zhao, Jiazhan Feng, Chongyang Tao, Qingwei Lin, and Daxin Jiang. (2023). *WizardLM: Empowering Large Pre-trained Language Models to Follow Complex Instructions.* arXiv preprint arXiv:2304.12244.
*   **Type:** AI-driven Evolutionary Instruction Generation and Complexity Scaling.
*   **BibTeX:**
    ```bibtex
    @article{xu2023wizardlm,
      title={WizardLM: Empowering Large Pre-trained Language Models to Follow Complex Instructions},
      author={Xu, Can and Sun, Qingfeng and Zheng, Kai and Geng, Xiubo and Zhao, Pu and Feng, Jiazhan and Tao, Chongyang and Lin, Qingwei and Jiang, Daxin},
      journal={arXiv preprint arXiv:2304.12244},
      year={2023}
    }
    ```

### Implementation in Mentora
*   **Production Code:** Configured in `config/prompts.yaml` and parsed via [config.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/src/config.py) (e.g. `EvolInstructInDepth` and `EvolInstructElimination`). The system uses the 6 operations defined in WizardLM's **Evol-Instruct** framework (`add_constraints`, `deepening`, `concretizing`, `increase_reasoning`, `complicate_input`, `in_breadth`) to dynamically evolve and mutate quiz questions to scale their cognitive difficulty.
*   **Evaluation Suite:** The prompts and configurations are verified in unit tests ensuring template placeholder compliance (`student_elo`, `student_bkt`, etc.) to guarantee that evolved instructions can be safely parsed by LLM agents.

