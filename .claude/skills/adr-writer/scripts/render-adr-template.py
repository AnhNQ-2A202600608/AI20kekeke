#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import date


def render_template(adr_id: str, title: str, status: str, current_date: str) -> str:
    return f"""# ADR-{adr_id}: {title}

**Ngày:** {current_date}
**Trạng thái:** {status}

## Bối cảnh (Context)

[Problem and constraints.]

## Các lựa chọn (Alternatives)

### Lựa chọn 1: [Name]
- Ưu điểm: ...
- Nhược điểm: ...

### Lựa chọn 2: [Name]
- Ưu điểm: ...
- Nhược điểm: ...

## Quyết định (Decision)

Chọn **[selected alternative]**.

## Lý do (Rationale)

1. [Reason tied to context/constraints.]
2. [Reason tied to trade-offs.]

## Hệ quả (Consequences)

- [Positive or neutral consequence.]
- [Risk/cost/operational burden.]
"""


def main() -> None:
    parser = argparse.ArgumentParser(description="Render a project ADR markdown template.")
    parser.add_argument("--id", required=True, help="Three-digit ADR id, for example 003.")
    parser.add_argument("--title", required=True, help="ADR decision title.")
    parser.add_argument("--status", default="Accepted", help="ADR status line value.")
    parser.add_argument("--date", default=date.today().isoformat(), help="ADR date in YYYY-MM-DD format.")
    args = parser.parse_args()

    print(render_template(args.id, args.title, args.status, args.date), end="")


if __name__ == "__main__":
    main()
