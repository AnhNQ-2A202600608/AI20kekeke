# Implementation Plan: Excel vs Docs Alignment with Restored Quizzes & Dashboard

Align the codebase documentation with the actual project scope, combining the Socratic Chat RAG system from the Excel template with the Adaptive Quiz (Elo-based) and Student Dashboard (Radar Chart & Heatmap) features.

## User Review Required

> [!IMPORTANT]
> The revised scope integrates both the conversational RAG chatbot (with 5 modes, citation cards, guardrails, draft/publish states) and the adaptive testing system (ZPD question selection, student concept Elo, question difficulty Elo, Radar chart, activity Heatmap, and Lecturer class insights).

## Proposed Changes

### Documentation

#### [MODIFY] [excel_vs_docs_analysis.md](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125/docs/research/excel_vs_docs_analysis.md)
Update the gap analysis to define the combined list of User Stories (US-001 to US-024) and propose improvements.

#### [MODIFY] [project-overview-pdr.md](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125/docs/product/project-overview-pdr.md)
Restore Adaptive Quizzes, Elo scoring, and Student Dashboard (Radar chart & Heatmap) to MVP Goals and Core Features.

#### [MODIFY] [design.md](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125/docs/product/design.md)
Restore UI definitions and wireframes for the Student Dashboard and Adaptive Quiz Interface, detailing the integration with the Chat Portal.

#### [MODIFY] [project-roadmap.md](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125/docs/product/project-roadmap.md)
Integrate Quiz, Elo, and Dashboard development tasks into the 4 Sprints.

#### [MODIFY] [system-architecture.md](file:///d:/CODE/AITHUCCHIEN\PROJECT\C2-App-125/docs/engineering/system-architecture.md)
Restore database schemas for Quizzes, QuizAttempts, and StudentMastery, and update component responsibilities.

## Verification Plan

### Manual Verification
- Verify that all documentation files consistently reference the unified scope.
- Confirm that the Socratic RAG Chat and the Adaptive Quiz systems are well-integrated via the Concept Elo rating.
