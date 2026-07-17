# Phase 03 — Prompt Guardrail Update

## Context Links

- Prompt config: `config/prompts.yaml`
- Code standards: `docs/engineering/code-standards.md`
- PDR safety goals: `docs/product/project-overview-pdr.md`

## Overview

Priority: High  
Status: planned

Update YAML prompt configuration so direct fallback is allowed only after explicit opt-in and always recorded as skipped/no-score for quiz contexts.

## Requirements

- Keep default academic integrity rule strict.
- Add fallback mode instruction for opted-in direct solution.
- Make quiz/assignment semantics explicit: direct answer closes attempt as skipped/no-score.
- Preserve citation requirements for RAG-grounded explanations.

## Architecture

Update `config/prompts.yaml` rather than hardcoding prompt text in Python. Suggested wording:

```yaml
GuidedDirectFallback: |
  CHẾ ĐỘ: HỖ TRỢ TRỰC TIẾP SAU KHI HỌC VIÊN CHỌN FALLBACK
  - Chỉ áp dụng khi hệ thống đã ghi nhận học viên chủ động chọn xem lời giải trực tiếp.
  - Nếu đang trong quiz/assignment active, attempt phải được xem là skipped/no-score và không cập nhật mastery.
  - Có thể cung cấp đáp án/lời giải trực tiếp cho câu hiện tại, sau đó giải thích từng bước và lỗi sai phổ biến.
  - Vẫn phải bám học liệu chính thức và trích dẫn nguồn khi dùng RAG context.
```

Also revise global guardrail from absolute ban to default ban with explicit fallback exception.

## Related Code Files

- Modify: `config/prompts.yaml`
- Modify prompt builder if it validates mode names.
- Add tests for prompt mode selection if existing test harness supports it.

## Implementation Steps

1. Locate prompt builder in `src/services/chat_optimization.py`.
2. Confirm supported mode lookup behavior.
3. Add fallback mode to YAML.
4. Update global guardrail wording to include explicit exception.
5. Ensure fallback still requires citations when context is used.

## Todo List

- [ ] Read prompt builder.
- [ ] Add `GuidedDirectFallback` mode.
- [ ] Adjust academic integrity wording.
- [ ] Validate YAML syntax.
- [ ] Test prompt generation.

## Success Criteria

- Default tutor still avoids direct answers.
- Direct solution only appears under fallback mode.
- No prompt conflict between guardrail and fallback mode.

## Risk Assessment

- Over-broad exception could weaken guardrails. Keep condition narrow and auditable.

## Security Considerations

- Uploaded material prompt injection must not override fallback conditions.
- Internal scoring/logging rules should not be exposed as system internals beyond necessary student-facing copy.

## Next Steps

Implement frontend toast copy consistent with this prompt language.
