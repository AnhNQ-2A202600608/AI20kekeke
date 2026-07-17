# Phase 2: Zustand Store Integration

## Overview
- Priority: High
- Current Status: Pending
- Description: Extend the Zustand store to track concept-level mastery scores and Elo, and sync updates to the backend Supabase database.

## Proposed Changes

### [MODIFY] [createPracticeSlice.ts](file:///d:/CODE/AITHUCCHIEN\PROJECT/C2-App-125/frontend/stores/createPracticeSlice.ts)
1. Add `conceptMastery` dictionary to store concept-level stats.
2. Add `fetchConceptMasteries(studentId, courseId)` to load all concept progress on login/boot.
3. Update `submitPracticeAnswer` to calculate and save both parent-level and concept-level mastery, and trigger a background POST to `/api/v1/adaptive/sync-mastery` to persist the update.

## Detailed Store Implementation

### Types
```typescript
export interface ConceptMastery {
  conceptCode: string;
  elo: number;
  bkt: number;
  masteryState: string;
  weaknessFlag: boolean;
  attemptCount: number;
  correctCount: number;
}
```

### Slice Methods
```typescript
  conceptMastery: Record<string, ConceptMastery>;
  fetchConceptMasteries: (studentId: string, courseId: string) => Promise<void>;
```

## Implementation Steps

1. **Update interface `PracticeSlice`** in `createPracticeSlice.ts`.
2. **Implement `fetchConceptMasteries`**:
   Make a GET request to `/api/v1/adaptive/mastery?student_id=${studentId}&course_id=${courseId}`. Map the returned array (using `concepts.code`) to a key-value record and save it to the store.
3. **Modify `submitPracticeAnswer`**:
   - Resolve the concept code (e.g. `day1-basics`) from the active question's `setId`.
   - Calculate Elo and mastery for the concept.
   - Save the updated concept mastery to the state.
   - Fire a `fetch('/api/v1/adaptive/sync-mastery')` POST request to save the change to the Supabase database.
