# Mentor Quiz Error Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible `Bắt đầu sửa` action from the mentor quiz error screen while allowing mentors to resolve a fresh `new` case directly.

**Architecture:** Keep the existing four backend statuses (`new`, `in_progress`, `resolved`, `rejected`) and simplify the UI action row. Backend transition validation will allow `new -> resolved`, and the frontend will enable resolve/reject for every non-terminal selected case.

**Tech Stack:** FastAPI service functions with pytest coverage; Next.js/React TypeScript mentor dashboard with ESLint verification.

---

## File Structure

- Modify: `src/services/quiz_error_cases.py`
  - Responsibility: Owns quiz error case status transition rules and transition validation.
- Modify: `tests/test_api/test_quiz_error_cases.py`
  - Responsibility: Regression coverage for direct `new -> resolved`, missing resolution notes, existing terminal protections, and unchanged save behavior.
- Modify: `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`
  - Responsibility: Mentor-facing quiz error case UI and action-row enable/disable logic.

No database migration is needed. Existing enum values and the partial unique index on open statuses remain correct.

---

### Task 1: Backend Transition Tests

**Files:**
- Modify: `tests/test_api/test_quiz_error_cases.py`

- [ ] **Step 1: Add failing tests for direct resolution from `new`**

Insert these tests after `test_resolve_requires_resolution_note`:

```python
def test_new_case_resolve_requires_resolution_note():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
        }
    )

    with pytest.raises(HTTPException) as exc:
        transition_quiz_error_case(
            db,
            OPEN_CASE_ID,
            QuizErrorStatusUpdate(status="resolved"),
            SimpleNamespace(id=UUID(MENTOR_ID)),
        )

    assert exc.value.status_code == 422


def test_new_case_can_resolve_directly_sets_resolution_fields():
    db = FakeDb()
    db.app_client.tables["quiz_error_cases"].append(
        {
            "id": OPEN_CASE_ID,
            "course_id": COURSE_ID,
            "question_id": QUESTION_ID,
            "status": "new",
            "report_count": 1,
        }
    )

    result = transition_quiz_error_case(
        db,
        OPEN_CASE_ID,
        QuizErrorStatusUpdate(status="resolved", resolution_note="Fixed without separate claim step"),
        SimpleNamespace(id=UUID(MENTOR_ID)),
    )

    case = result["case"]
    assert case["status"] == "resolved"
    assert case["resolution_note"] == "Fixed without separate claim step"
    assert case["resolved_by"] == MENTOR_ID
    assert case["resolved_at"]
```

- [ ] **Step 2: Run the focused tests and confirm they fail**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py::test_new_case_resolve_requires_resolution_note tests/test_api/test_quiz_error_cases.py::test_new_case_can_resolve_directly_sets_resolution_fields -q
```

Expected result before implementation:

```text
FAILED tests/test_api/test_quiz_error_cases.py::test_new_case_resolve_requires_resolution_note
FAILED tests/test_api/test_quiz_error_cases.py::test_new_case_can_resolve_directly_sets_resolution_fields
```

The first test fails because current code rejects `new -> resolved` before checking the missing note. The second test fails because current transition rules do not allow `new -> resolved`.

- [ ] **Step 3: Commit the failing tests**

Run:

```powershell
git add tests/test_api/test_quiz_error_cases.py
git commit -m "test: cover direct quiz error resolution"
```

Expected result:

```text
[namnp/add-process-quizz-error <sha>] test: cover direct quiz error resolution
```

---

### Task 2: Backend Transition Implementation

**Files:**
- Modify: `src/services/quiz_error_cases.py`

- [ ] **Step 1: Allow `new -> resolved` in transition rules**

Change `VALID_TRANSITIONS` near the top of `src/services/quiz_error_cases.py` from:

```python
VALID_TRANSITIONS = {
    "new": {"in_progress", "rejected"},
    "in_progress": {"resolved", "rejected"},
}
```

to:

```python
VALID_TRANSITIONS = {
    "new": {"in_progress", "resolved", "rejected"},
    "in_progress": {"resolved", "rejected"},
}
```

Do not change `OPEN_STATUSES`, `TERMINAL_STATUSES`, or database enum values.

- [ ] **Step 2: Run the focused transition tests**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py::test_new_case_resolve_requires_resolution_note tests/test_api/test_quiz_error_cases.py::test_new_case_can_resolve_directly_sets_resolution_fields tests/test_api/test_quiz_error_cases.py::test_terminal_transition_sets_resolution_fields tests/test_api/test_quiz_error_cases.py::test_invalid_status_transition_is_rejected -q
```

Expected result:

```text
4 passed
```

- [ ] **Step 3: Run the full quiz error case backend test file**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected result:

```text
all tests in tests/test_api/test_quiz_error_cases.py pass
```

- [ ] **Step 4: Commit backend implementation**

Run:

```powershell
git add src/services/quiz_error_cases.py tests/test_api/test_quiz_error_cases.py
git commit -m "feat: allow direct quiz error resolution"
```

Expected result:

```text
[namnp/add-process-quizz-error <sha>] feat: allow direct quiz error resolution
```

---

### Task 3: Frontend Action Row Simplification

**Files:**
- Modify: `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`

- [ ] **Step 1: Remove the unused `canStartEditing` state guard**

In `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`, remove:

```tsx
const canStartEditing = Boolean(selectedDetail) && selectedDetail?.status === 'new' && !isSaving;
```

- [ ] **Step 2: Enable resolve for every non-terminal selected case**

Replace the current `canResolve` block:

```tsx
const canResolve =
  Boolean(selectedDetail) &&
  selectedDetail?.status === 'in_progress' &&
  resolutionNote.trim().length > 0 &&
  !isSaving;
```

with:

```tsx
const canResolve =
  Boolean(selectedDetail) &&
  selectedDetail?.status !== 'resolved' &&
  selectedDetail?.status !== 'rejected' &&
  resolutionNote.trim().length > 0 &&
  !isSaving;
```

Leave `canReject` unchanged because it already enables rejection for non-terminal selected cases with a resolution note.

- [ ] **Step 3: Remove the visible `Bắt đầu sửa` button**

Delete this whole button from the action row:

```tsx
<button
  type="button"
  onClick={() => handleStatusChange('in_progress')}
  disabled={!canStartEditing}
  className="btn-3d btn-blue flex items-center gap-1 px-4 py-2 text-[10px] disabled:cursor-not-allowed disabled:opacity-50"
  aria-label="Bắt đầu sửa ca báo lỗi"
>
  {savingAction === 'status-in_progress' ? (
    <Loader2 className="h-3.5 w-3.5 animate-spin" />
  ) : (
    <Wrench className="h-3.5 w-3.5" />
  )}
  <span>Bắt đầu sửa</span>
</button>
```

Do not remove `handleStatusChange('in_progress')` support from the file if it remains useful for demo data or future workflow paths. Do not remove the `Wrench` import unless ESLint reports it is unused after the edit.

- [ ] **Step 4: Run frontend lint for the changed file**

Run from `frontend/`:

```powershell
pnpm exec eslint components\dashboard\mentor\quiz-error-cases-tab.tsx
```

Expected result:

```text
no output and exit code 0
```

- [ ] **Step 5: Static-check the removed UI text**

Run from the repo root:

```powershell
Select-String -Path frontend\components\dashboard\mentor\quiz-error-cases-tab.tsx -Pattern "Bắt đầu sửa"
```

Expected result:

```text
no matches
```

- [ ] **Step 6: Commit frontend simplification**

Run:

```powershell
git add frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx
git commit -m "feat: simplify mentor quiz error actions"
```

Expected result:

```text
[namnp/add-process-quizz-error <sha>] feat: simplify mentor quiz error actions
```

---

### Task 4: End-To-End Verification Pass

**Files:**
- Read: `docs/superpowers/specs/2026-07-02-mentor-quiz-error-actions-design.md`
- Verify: `src/services/quiz_error_cases.py`
- Verify: `frontend/components/dashboard/mentor/quiz-error-cases-tab.tsx`

- [ ] **Step 1: Run backend focused tests**

Run:

```powershell
python -m pytest tests/test_api/test_quiz_error_cases.py -q
```

Expected result:

```text
all tests in tests/test_api/test_quiz_error_cases.py pass
```

- [ ] **Step 2: Run frontend scoped lint**

Run from `frontend/`:

```powershell
pnpm exec eslint components\dashboard\mentor\quiz-error-cases-tab.tsx
```

Expected result:

```text
no output and exit code 0
```

- [ ] **Step 3: Verify action row text inventory**

Run from the repo root:

```powershell
Select-String -Path frontend\components\dashboard\mentor\quiz-error-cases-tab.tsx -Pattern "Lưu thay đổi|Đóng là đã xử lý|Từ chối báo lỗi|Bỏ qua|Bắt đầu sửa"
```

Expected result:

```text
matches for Lưu thay đổi
matches for Đóng là đã xử lý
matches for Từ chối báo lỗi
matches for Bỏ qua
no matches for Bắt đầu sửa
```

- [ ] **Step 4: Review staged/untracked state before final handoff**

Run:

```powershell
git status --short
```

Expected result:

```text
only intentional implementation files remain modified or staged for this task
pre-existing unrelated workspace changes are not reverted
```

---

## Self-Review

- Spec coverage: Task 1 and Task 2 cover direct `new -> resolved`, missing notes, terminal protections, and unchanged save behavior. Task 3 covers removing `Bắt đầu sửa`, keeping the remaining action buttons, and enabling `Đóng là đã xử lý` for `new` cases. Task 4 covers final verification.
- Placeholder scan: The plan contains only concrete task steps. Each edit step includes exact code or an exact deletion target.
- Type consistency: The backend uses existing `QuizErrorStatusUpdate`, `transition_quiz_error_case`, and status string values. The frontend keeps existing `selectedDetail.status`, `resolutionNote`, and `isSaving` logic.
