# Sub-skills Mastery and Progress Tracking Plan

This plan details the implementation of separate progress and mastery (Elo/BKT) tracking for each sub-skill (Concept) instead of globally at the parent skill level.

## User Review Required

> [!IMPORTANT]
> The current system has one parent-level mastery and ELO. We are migrating to concept-level (sub-skill) mastery tracked in the Supabase database.
> The frontend will fetch all masteries for the current student in a single query upon startup/login.

## Phases

- **Phase 1: Backend API for Concept Mastery**
  - Status: Pending
  - Links: [phase-01-backend-api.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1703-sub-skills-mastery-tracking/phase-01-backend-api.md)
- **Phase 2: Zustand Store Integration**
  - Status: Pending
  - Links: [phase-02-store-integration.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1703-sub-skills-mastery-tracking/phase-02-store-integration.md)
- **Phase 3: Frontend UI Rendering**
  - Status: Pending
  - Links: [phase-03-frontend-ui.md](file:///d:/CODE/AITHUCCHIEN/PROJECT/C2-App-125/plans/20260616-1703-sub-skills-mastery-tracking/phase-03-frontend-ui.md)

## Verification Plan

### Automated Tests
- Test API endpoint `/api/v1/adaptive/mastery`
- Verify database queries for `student_concept_mastery`

### Manual Verification
- Verify the individual sub-skill circles on the Learning Path update their mastery score, ELO, and completion status independently.
