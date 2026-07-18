# 2026-07-18 — Project and document integrity check

- **Why:** The user requested a double-check on the entire documentation set to ensure there are no files or references belonging to an unrelated project.
- **What checked:**
  - Audited all directories: `docs/`, `report/`, `presentation/`, `data/`, `frontend/`, `src/`.
  - Analyzed specific keywords:
    - `btc-heatmap`: Verified it stands for "Bản đồ Tiến độ Chung" (for the Organizing Committee - Ban Tổ Chức / BTC), which displays class mastery heatmaps for Mentora administrators (not Bitcoin).
    - `mooclet`: Verified the Harvard MOOClet framework (Modular Personalization and Experimentation) is implemented in the database schema (`20260611_initial_schema.sql`) for adaptive policy engines.
    - `Sapia` and `Edugap`: Confirmed these are former/alternate names for the design system and previous naming phases of the current **Mentora** project, which are completely consistent with the repository.
    - Textbooks (`data/` directory): History and Geography textbooks for grades 6-9 are the exact domain source for this Socratic RAG tutor.
- **Validation:**
  - Checked that all docs, reports, and codebases are 100% related to the Mentora project.
- **Follow-up:** None.
