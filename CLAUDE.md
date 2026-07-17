# Agent Guide
`AGENTS.md` must stay a symlink to this file.

## Scope

## Non-Negotiables
- Default branch is `dev`. Feature/fix branches start from `dev`; production hotfixes start from `main` only when explicitly needed.
- Do not commit directly to `dev` or `main`.

## Architecture

- `docs/` - local development and architecture docs.

## User-Facing Change Checklist
- Keep README concise

## Package Managers & Environments

> [!IMPORTANT]
> **ĐỌC TRƯỚC KHI TẢI / CÀI ĐẶT / CHẠY THỬ NGHIỆM:**
> Khi cần tải dependencies, cài đặt môi trường hoặc chạy kiểm thử (tests), AI Agent **BẮT BUỘC** phải đọc chi tiết hướng dẫn tại [Package Managers & Setup Guide](docs\guide\setup\package-managers.md) trước.

## Commands & Validation

Before requesting review or merge, run tests and checks:
*   **Run Tests:** `uv run pytest`
*   **Format & Lint:** `uv run ruff format` and `uv run ruff check --fix`

After every push to a PR, watch CI until it finishes. If checks fail, inspect logs, fix root cause, push again, and re-watch.

## Configuration & Prompts
- **YAML Decoupling**: Do not hardcode configuration variables, prompt templates, or logic rules. Extract them to versioned YAML files (`settings.yaml`, `prompts.yaml`, `algorithm.yaml` in `config/`) and validate schemas using Pydantic at startup.

## Design Standards

- YAGNI, KISS, DRY.
