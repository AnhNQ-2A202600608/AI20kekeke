# Mentor Quiz Error Actions Design

## Context

The mentor quiz error screen currently exposes a separate `Bắt đầu sửa` action. That button transitions a case from `new` to `in_progress`, but it does not edit quiz content. The actual content change happens through `Lưu thay đổi`, and case completion happens through `Đóng là đã xử lý` or `Từ chối báo lỗi`.

This creates an extra workflow step in the UI. For the current single-screen mentor experience, mentors should be able to review, edit, save, resolve, or reject directly without first claiming the case through a visible button.

## Approved Direction

Use the simplified action model:

- Remove the visible `Bắt đầu sửa` button.
- Keep `Lưu thay đổi`.
- Keep `Đóng là đã xử lý`.
- Keep `Từ chối báo lỗi`.
- Keep `Bỏ qua` as the reset/discard local edits action.

The internal database statuses can remain unchanged:

- `new`
- `in_progress`
- `resolved`
- `rejected`

The UI should hide the mechanical `new -> in_progress` step while preserving enough backend state for future auditing or multi-mentor assignment.

## Behavior

### Save Changes

When a mentor edits a question and clicks `Lưu thay đổi`:

- The question content is saved.
- If the case is `new`, saving question content leaves the case status as `new`.
- The UI should not require a separate `Bắt đầu sửa` action before saving.

The case status changes only when the mentor closes the report as handled or rejects it. This keeps `Lưu thay đổi` focused on content persistence and avoids a hidden workflow step.

### Resolve Case

When a mentor clicks `Đóng là đã xử lý`:

- A resolution note is required, as it is today.
- The action should work for both `new` and `in_progress` cases.
- Recommended backend behavior: allow direct transition `new -> resolved` in addition to the current `in_progress -> resolved`.
- The case becomes terminal after resolving and should not transition again.

### Reject Case

When a mentor clicks `Từ chối báo lỗi`:

- A resolution note is required.
- The existing `new -> rejected` and `in_progress -> rejected` behavior remains valid.
- The case becomes terminal after rejection and should not transition again.

### Closed Cases

Cases with `resolved` or `rejected` remain read-only for status transitions. If students report the same question again after a case is closed, the existing backend behavior should create a new `new` case because only `new` and `in_progress` are considered open.

## UI Design

The action row should show only the mentor-facing decisions and editing controls:

- `Lưu thay đổi`
- `Đóng là đã xử lý`
- `Từ chối báo lỗi`
- `Bỏ qua`

The removed action:

- `Bắt đầu sửa`

Button enabling rules:

- `Lưu thay đổi` is enabled when a case is selected and no save/transition is in progress.
- `Đóng là đã xử lý` is enabled for `new` or `in_progress` cases when a resolution note is present and no save/transition is in progress.
- `Từ chối báo lỗi` is enabled for `new` or `in_progress` cases when a resolution note is present and no save/transition is in progress.
- `Bỏ qua` is enabled when a case is selected and no save/transition is in progress.

## Backend Design

Update the status transition rules to support direct resolution from `new`:

```text
new -> resolved
new -> rejected
in_progress -> resolved
in_progress -> rejected
```

The `new -> in_progress` transition may remain supported internally, but it should no longer be required by the UI.

No database migration is required for this change because the existing enum values and indexes already support the intended workflow. The unique open-case index remains correct because `new` and `in_progress` are still the only open statuses.

## Testing

Add or update focused tests for:

- A `new` case can be resolved directly with a resolution note.
- A `new` case cannot be resolved without a resolution note.
- Saving question changes on a `new` case leaves the case status as `new`.
- A `new` case can still be rejected with a resolution note.
- An `in_progress` case can still be resolved or rejected.
- A `resolved` or `rejected` case still cannot transition again.
- The mentor UI no longer renders the `Bắt đầu sửa` button.
- The mentor UI enables `Đóng là đã xử lý` for a selected `new` case once the resolution note is filled.

## Out Of Scope

- Renaming database enum values.
- Removing the `in_progress` status from the backend.
- Changing how student reports create new cases after a terminal case.
- Redesigning the full mentor review screen beyond the action row behavior.
