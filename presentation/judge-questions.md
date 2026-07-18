# Jury Defense Guide — 30+ Toughest Questions

This guide prepares the team to defend the solution against jury questions.

---

## 1. Problem Fit & User Value

### Q1: Does your solution actually solve the core user problem, or is it just a wrapper for a technique you wanted to try?
- **Jury Rationale**: Check if the team fell in love with a technique (e.g. LLM/Agent) instead of the user problem.
- **Weakness Checked**: Lack of empathy for the user's operational constraints.
- **Response Framework**: Map the solution directly to user pain points. Focus on operational metrics.
- **Evidence**: User intake requirements mapping ([problem-intake.md](file:///d:/code/AI20kekeke/docs/d-day/problem-intake.md)).
- **What NOT to say**: *"We used an agent because agents are state-of-the-art right now."*

### Q2: Why would the target user choose your interface over their current process?
- **Jury Rationale**: Check if the solution is too complex for the user.
- **Weakness Checked**: Friction in adoption.
- **Response Framework**: Emphasize simple workspace file uploads and automated parameter rendering.
- **Evidence**: Next.js Workspace Page.
- **What NOT to say**: *"Users will receive comprehensive training to understand the system schemas."*

---

## 2. Data & Baseline

### Q3: What is your baseline, and how much better is your solution compared to it?
- **Jury Rationale**: Verify if a simple rule-based approach or statistical average performs just as well.
- **Weakness Checked**: Oversolving a simple task.
- **Response Framework**: State the baseline performance directly. Compare accuracy/solving scores.
- **Evidence**: Module selection and baseline comparisons in [module-selection.md](file:///d:/code/AI20kekeke/docs/d-day/module-selection.md).
- **What NOT to say**: *"We didn't build a baseline because rules-based code cannot solve this."*

### Q4: How does your system handle corrupted or incomplete input data?
- **Jury Rationale**: Assess data engineering robustness.
- **Weakness Checked**: Pipeline crashes on raw dirty data.
- **Response Framework**: Point to the validation layer in `data_loader.py` that raises clean `ValidationErrors`.
- **Evidence**: [data_loader.py](file:///d:/code/AI20kekeke/backend/src/core/data_loader.py) schema checking.
- **What NOT to say**: *"We assume the incoming data is clean."*

---

## 3. AI Necessity

### Q5: Why is AI/ML necessary for this task? Could this be solved with standard linear programming or heuristics?
- **Jury Rationale**: Check if AI was added just for buzzwords.
- **Weakness Checked**: Unnecessary complexity and costs.
- **Response Framework**: Define the exact non-linear parameters that make heuristics fail, showing where heuristic limits are.
- **Evidence**: Go/no-go checklists in [module-selection.md](file:///d:/code/AI20kekeke/docs/d-day/module-selection.md).
- **What NOT to say**: *"AI is needed because standard algorithms cannot adapt."*

### Q6: If your LLM/ML provider is offline, does your core application still function?
- **Jury Rationale**: Verify application resilience.
- **Weakness Checked**: System-wide outages when APIs fail.
- **Response Framework**: Highlight that optional modules are decoupled. Core storage, file upload, and local capabilities run completely offline.
- **Evidence**: Dynamic ModuleRegistry loader.
- **What NOT to say**: *"If the LLM is down, the system cannot function."*

---

## 4. Architecture & Scalability

### Q7: Your runs are synchronous. How does this system scale if 100 users trigger capabilities at the same time?
- **Jury Rationale**: Check architecture limits.
- **Weakness Checked**: Thread locking and server crashes under load.
- **Response Framework**: Explain that for the hackathon MVP, sync processing keeps deployment simple. For scaling, the registry easily plugs into asynchronous task brokers like Celery/Redis.
- **Evidence**: `run_service.py` architecture notes.
- **What NOT to say**: *"FastAPI is very fast so it handles 100 sync runs easily."*

### Q8: Why did you design a pluggable module registry instead of writing a single app?
- **Jury Rationale**: Check architectural foresight.
- **Weakness Checked**: Monolithic code clutter.
- **Response Framework**: Explain that competition tracks change; the pluggable system keeps the core code clean and allows enabling only relevant libraries.
- **Evidence**: [module-system.md](file:///d:/code/AI20kekeke/docs/engineering/module-system.md) loading flow.
- **What NOT to say**: *"We wanted to write more files."*

---

## 5. Evaluation & Metrics

### Q9: How do we know your evaluation reports are authentic and not hardcoded?
- **Jury Rationale**: Ensure team integrity.
- **Weakness Checked**: Fabricated metrics.
- **Response Framework**: The evaluation runner dynamically scans stored local run JSON files to compile scores.
- **Evidence**: [evaluation.py](file:///d:/code/AI20kekeke/backend/src/core/evaluation.py).
- **What NOT to say**: *"We wrote the evaluation numbers in markdown manually."*

### Q10: What metrics did you prioritize and why?
- **Jury Rationale**: Check alignment with competition rubrics.
- **Weakness Checked**: Optimizing secondary metrics.
- **Response Framework**: Link metrics back to the rubric mapping.
- **Evidence**: [rubric-mapping.md](file:///d:/code/AI20kekeke/docs/d-day/rubric-mapping.md).
- **What NOT to say**: *"We optimized accuracy because it is the most popular metric."*

---

## 6. Bias, Fairness & Privacy

### Q11: How do you protect user data privacy in your logs?
- **Jury Rationale**: Check data security standards.
- **Weakness Checked**: Log dumps leaking sensitive keys or personal data.
- **Response Framework**: Custom `SecretRedactingFilter` scans all stream outputs and redacts API keys, passwords, and tokens.
- **Evidence**: [logging.py](file:///d:/code/AI20kekeke/backend/src/core/logging.py).
- **What NOT to say**: *"We don't log any sensitive data."*

### Q12: How does your model handle algorithmic bias?
- **Jury Rationale**: Check fairness awareness.
- **Weakness Checked**: Discriminatory output predictions.
- **Response Framework**: Explain bias checks in the data profile loaders and evaluation tests.
- **Evidence**: [evaluation-guide.md](file:///d:/code/AI20kekeke/docs/domain-knowledge/evaluation-guide.md).
- **What NOT to say**: *"Our dataset is unbiased so our model has no bias."*

---

## 7. Security

### Q13: What happens if a user uploads a file with a name like `../../../../etc/passwd`?
- **Jury Rationale**: Path traversal vulnerability check.
- **Weakness Checked**: Directory traversal file read leaks.
- **Response Framework**: Point to the `_assert_safe_path` check inside `local.py` that raises a `ValidationError` immediately.
- **Evidence**: [local.py](file:///d:/code/AI20kekeke/backend/src/storage/local.py) path guards.
- **What NOT to say**: *"FastAPI router parameters block slashes automatically."*

### Q14: How do you prevent users from uploading malicious executable files?
- **Jury Rationale**: Remote code execution check.
- **Weakness Checked**: Uploading arbitrary binaries.
- **Response Framework**: The upload service verifies file extensions against a strict `ALLOWED_EXTENSIONS` allowlist.
- **Evidence**: [local.py](file:///d:/code/AI20kekeke/backend/src/storage/local.py).
- **What NOT to say**: *"The frontend file input tag blocks other file types."*

---

## 8. Deployment & Cost

### Q15: How much does it cost to run your system at scale?
- **Jury Rationale**: Cost-benefit assessment.
- **Weakness Checked**: Extremely high server/LLM API bills.
- **Response Framework**: Break down server costs (CPU/RAM fallback) and external API tokens per run. Emphasize offline local-mode capabilities.
- **Evidence**: Deployment model.
- **What NOT to say**: *"Running the system is completely free."*

### Q16: Can this solution run in an offline, sandboxed environment?
- **Jury Rationale**: Strict compliance check.
- **Weakness Checked**: Heavy dependence on cloud internet.
- **Response Framework**: Yes, the docker-compose setup and all core technical services are designed to run completely on-premise without external dependencies.
- **Evidence**: docker-compose.yml.
- **What NOT to say**: *"We need to call Google Cloud APIs for retrieval."*

---

## 9. Pilot & Validation

### Q17: What are your criteria for a successful pilot?
- **Jury Rationale**: Validate graduation to production.
- **Weakness Checked**: Deploying untested code directly to all users.
- **Response Framework**: Clear go/no-go parameters defined in problem intake (e.g. success rate > 95% on sample records).
- **Evidence**: [problem-intake.md](file:///d:/code/AI20kekeke/docs/d-day/problem-intake.md).
- **What NOT to say**: *"If users like the system, we go to production."*

### Q18: What is your rollback strategy if the pilot deployment fails?
- **Jury Rationale**: Disaster recovery check.
- **Weakness Checked**: Outages during deployment failure.
- **Response Framework**: Since configurations are isolated in challenges directories, rollback is as simple as updating config mapping.
- **Evidence**: [risk-register.md](file:///d:/code/AI20kekeke/docs/d-day/risk-register.md).
- **What NOT to say**: *"We will hot-fix the code live on the server."*

---

## 10. Demo Authenticity & Potential

### Q19: Is your demo running live, or are we looking at pre-recorded mock responses?
- **Jury Rationale**: Verify honesty.
- **Weakness Checked**: Showing faked mock outputs as live execution.
- **Response Framework**: The demo runs completely live. The logs print execution duration and generated SHA-256 file hashes on the fly.
- **Evidence**: Audit logs stdout.
- **What NOT to say**: *"It is live but we pre-cached the response just in case."*

### Q20: What is the commercial potential of this starter solution?
- **Jury Rationale**: Business potential check.
- **Weakness Checked**: Just a toy hackathon project.
- **Response Framework**: The template serves as a universal accelerator shell. By swapping modules, it is ready to be commercialized for any vertical.
- **Evidence**: System design.
- **What NOT to say**: *"It's just for the competition."*

---

## Remaining Jury Questions (Q21-Q30)

- **Q21**: How do you monitor execution latency spikes?
- **Q22**: Why did you choose SQLite/Local files over PostgreSQL?
- **Q23**: How do you handle file upload limits? (Limit is set in API middleware).
- **Q24**: Can you explain the data profiling outputs?
- **Q25**: How do you measure system throughput?
- **Q26**: What happens if two runs try to update the same artifact? (UUID naming ensures isolation).
- **Q27**: How do you keep CORS settings safe?
- **Q28**: Does this solution comply with data protection regulations?
- **Q29**: How does the system handle concurrent file writes?
- **Q30**: What is the most critical technical risk in your threat model?
