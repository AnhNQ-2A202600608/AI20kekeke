# Spec Kit Trong Repo VAIC Này

## Trạng thái hiện tại

Repo `D:\VAIC\AI20kekeke` hiện đã có `Spec Kit` cho `Codex` ở chế độ `skills`.

Các thành phần đã được thêm vào:

- thư mục `.specify/`
- thư mục `.agents/skills/`
- cấu hình `.specify/integration.json`
- cấu hình `.specify/init-options.json`

## Cấu hình đang dùng

- integration: `codex`
- `ai_skills`: `true`
- script type: `ps`
- feature numbering: `sequential`
- phiên bản scaffold: `0.12.15`

## Constitution

- File canonical cho Spec Kit: `.specify/memory/constitution.md`
- Bản tiếng Việt cho team đọc: `.specify/memory/constitution.vi.md`

## Các skill đã có trong project

- `speckit-constitution`
- `speckit-specify`
- `speckit-plan`
- `speckit-tasks`
- `speckit-implement`
- `speckit-converge`
- `speckit-clarify`
- `speckit-analyze`
- `speckit-checklist`
- `speckit-taskstoissues`

## Cách dùng

Trong môi trường Codex hỗ trợ local skills, dùng:

```text
$speckit-constitution
$speckit-specify
$speckit-plan
$speckit-tasks
$speckit-implement
```

Luồng chuẩn:

1. tạo nguyên tắc với `constitution`
2. viết yêu cầu với `specify`
3. lập kế hoạch với `plan`
4. sinh task với `tasks`
5. thực thi với `implement`
6. rà thiếu sót với `converge` nếu cần

## Lưu ý

- Repo này được gắn `Spec Kit` bằng scaffold tương thích `0.12.15`.
- Mình không copy `.agents/memory` hay `feature.json` từ project khác để tránh lẫn ngữ cảnh.
- Sau khi bắt đầu một feature mới bằng `specify`, repo sẽ tự sinh `specs/<so-thu-tu>-<ten-feature>/`.
