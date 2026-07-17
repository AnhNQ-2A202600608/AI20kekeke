# Phase 1: Metric Alignment & Bibliography Clean-up

## Context Links
- Critique: [gpt-report.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/gpt-report.md)
- Paper Source: [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md)
- Reference Database: [references.bib](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/references.bib)

## Overview
- **Priority**: High
- **Current Status**: Todo
- This phase addresses inconsistencies in numerical claims (such as BKT AUC and Spaced Repetition ECE) between the paper draft and the actual outputs of the evaluation suite (`REPORT.txt`). It also cleans up BibTeX formatting issues and unused citations.

## Key Insights
- **BKT AUC**: The paper claimed 0.9941 but `REPORT.txt` reports 0.8386. The paper must align with reality.
- **Spaced Repetition ECE**: The reported 0.2622 is a toy validation check over 5 records. This must be clarified as a "calibration verification metric" rather than a real student logs cohort calibration.
- **Citations**: The `.bib` file has 7 citations but only 4 are cited in the body. We need to cite the remaining ones to substantiate related work.

## Requirements
- Correct all inflated numerical claims.
- Fix Clement et al. author format in `references.bib`.
- Ensure all 7 reference bibliography entries are actually trích dẫn cited in the body text.

## Related Code Files
- [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md) [MODIFY]
- [references.bib](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/references.bib) [MODIFY]
- [convert.py](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/convert.py) [MODIFY]

## Implementation Steps
1. Open [adaptive-learning-engine-paper.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/docs/research/adaptive-learning-engine-paper.md) and replace `0.9941` BKT AUC with `0.8386`.
2. Add body text citation `[5]` (Richardson, 2018) in the microservices/outbox section, `[6]` (Kleppmann, 2017) in the concurrency architecture section, and `[7]` (Woźniak, 1994) in the spaced repetition section of `adaptive-learning-engine-paper.md`.
3. Clarify in section 5.4 that ECE 0.2622 represents a synthetic sample calibration check.
4. Modify `references.bib` to fix `clement2015multi` author list syntax.
5. Update `convert.py`'s citation map to map `[5]`, `[6]`, `[7]` to their correct LaTeX `\cite{...}` commands.

## Todo List
- [ ] Correct BKT AUC in paper.
- [ ] Clarify Spaced Repetition calibration data size.
- [ ] Fix Clement et al. author syntax in `.bib` file.
- [ ] Insert citations for remaining references in paper body.
- [ ] Update citation map in `convert.py`.

## Success Criteria
- No metric mismatches between paper draft and `REPORT.txt`.
- LaTeX compilation produces 7 bibliography entries.
- Clement et al. is cited correctly without format errors.

## Risk Assessment
- None. This phase only involves documentation and parameter updates.
