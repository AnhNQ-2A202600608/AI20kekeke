from __future__ import annotations

import argparse
import json
import os
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv

DEFAULT_OUT_DIR = "plans/20260628-1021-ai-latency-timing-eval/reports"


def percentile(values: list[float], pct: float) -> float:
    if not values:
        return 0.0
    ordered = sorted(values)
    if len(ordered) == 1:
        return round(ordered[0], 2)
    rank = (len(ordered) - 1) * pct
    lower = int(rank)
    upper = min(lower + 1, len(ordered) - 1)
    weight = rank - lower
    return round(ordered[lower] * (1 - weight) + ordered[upper] * weight, 2)


def deep_get(value: dict[str, Any], *path: str) -> Any:
    current: Any = value
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def span_name(event: dict[str, Any]) -> str:
    return (
        deep_get(event, "span_attributes", "name")
        or deep_get(event, "span_attributes", "span_name")
        or deep_get(event, "metadata", "name")
        or event.get("span_name")
        or event.get("name")
        or "unknown"
    )


def duration_ms(event: dict[str, Any]) -> float | None:
    metrics = event.get("metrics") or {}
    direct = metrics.get("duration_ms") or metrics.get("latency_ms")
    if isinstance(direct, int | float):
        return round(float(direct), 2)

    start = metrics.get("start")
    end = metrics.get("end")
    if isinstance(start, int | float) and isinstance(end, int | float) and end >= start:
        delta = float(end) - float(start)
        # Braintrust start/end are epoch seconds in current API responses.
        return round(delta * 1000, 2)
    return None


def numeric_metrics(event: dict[str, Any]) -> dict[str, float]:
    metrics = event.get("metrics") or {}
    out: dict[str, float] = {}
    for key, value in metrics.items():
        if isinstance(value, int | float):
            out[key] = round(float(value), 4)
    duration = duration_ms(event)
    if duration is not None:
        out["duration_ms"] = duration
    return out


def event_summary(event: dict[str, Any]) -> dict[str, Any]:
    metadata = event.get("metadata") or {}
    return {
        "id": event.get("id"),
        "created": event.get("created"),
        "span_id": event.get("span_id"),
        "root_span_id": event.get("root_span_id"),
        "parent_span_id": event.get("parent_span_id") or deep_get(event, "span_attributes", "parent_span_id"),
        "name": span_name(event),
        "error": event.get("error"),
        "metrics": numeric_metrics(event),
        "timings_ms": metadata.get("timings_ms") or {},
        "metadata_keys": sorted(metadata.keys()),
        "input_preview": preview_json(event.get("input")),
        "output_preview": preview_json(event.get("output")),
    }


def preview_json(value: Any, *, max_chars: int = 240) -> str | None:
    if value is None:
        return None
    text = json.dumps(value, ensure_ascii=False, default=str)
    if len(text) <= max_chars:
        return text
    return text[: max_chars - 1].rstrip() + "..."


def fetch_project_logs(
    *,
    api_url: str,
    api_key: str,
    project_id: str,
    limit: int,
    max_pages: int,
) -> list[dict[str, Any]]:
    headers = {"Authorization": f"Bearer {api_key}"}
    url = f"{api_url.rstrip('/')}/v1/project_logs/{project_id}/fetch"
    cursor = None
    events_by_id: dict[str, dict[str, Any]] = {}

    with httpx.Client(timeout=30.0) as client:
        for _ in range(max_pages):
            params: dict[str, Any] = {"limit": limit}
            if cursor:
                params["cursor"] = cursor
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            payload = response.json()
            for event in payload.get("events") or []:
                event_id = event.get("id")
                if event_id:
                    events_by_id[event_id] = event
            cursor = payload.get("cursor")
            if not cursor:
                break

    return list(events_by_id.values())


def summarize(events: list[dict[str, Any]]) -> dict[str, Any]:
    summarized_events = [event_summary(event) for event in events]
    traces: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for event in summarized_events:
        root_id = event.get("root_span_id") or event.get("span_id") or "unknown"
        traces[str(root_id)].append(event)

    trace_rows: list[dict[str, Any]] = []
    span_durations: dict[str, list[float]] = defaultdict(list)
    errors: list[dict[str, Any]] = []

    for root_id, trace_events in traces.items():
        trace_events.sort(key=lambda item: item.get("created") or "")
        durations = [
            float(item["metrics"]["duration_ms"])
            for item in trace_events
            if isinstance((item.get("metrics") or {}).get("duration_ms"), int | float)
        ]
        for item in trace_events:
            duration = (item.get("metrics") or {}).get("duration_ms")
            if isinstance(duration, int | float):
                span_durations[item["name"]].append(float(duration))
            if item.get("error"):
                errors.append({"root_span_id": root_id, "span": item["name"], "error": item["error"]})

        trace_rows.append(
            {
                "root_span_id": root_id,
                "event_count": len(trace_events),
                "created": trace_events[0].get("created") if trace_events else None,
                "total_observed_ms": round(max(durations), 2) if durations else 0.0,
                "spans": [item["name"] for item in trace_events],
            }
        )

    span_summary = {
        name: {
            "count": len(values),
            "p50_ms": percentile(values, 0.5),
            "p95_ms": percentile(values, 0.95),
            "max_ms": round(max(values), 2),
        }
        for name, values in sorted(span_durations.items(), key=lambda item: percentile(item[1], 0.5), reverse=True)
    }

    return {
        "generated": datetime.now(UTC).isoformat(),
        "event_count": len(events),
        "trace_count": len(traces),
        "span_summary": span_summary,
        "trace_rows": sorted(trace_rows, key=lambda item: item.get("created") or "", reverse=True),
        "errors": errors,
        "events": summarized_events,
    }


def render_markdown(summary: dict[str, Any]) -> str:
    lines = [
        "# Braintrust Latency Report",
        "",
        f"- Generated: {summary['generated']}",
        f"- Events fetched: {summary['event_count']}",
        f"- Traces observed: {summary['trace_count']}",
        f"- Errors: {len(summary['errors'])}",
        "",
        "## Span Duration Summary",
        "",
        "| Span | Count | p50 ms | p95 ms | max ms |",
        "|---|---:|---:|---:|---:|",
    ]
    for name, item in summary["span_summary"].items():
        lines.append(f"| `{name}` | {item['count']} | {item['p50_ms']} | {item['p95_ms']} | {item['max_ms']} |")

    lines.extend(
        ["", "## Recent Traces", "", "| Root span | Events | Observed max span ms | Top spans |", "|---|---:|---:|---|"]
    )
    for trace in summary["trace_rows"][:20]:
        top_spans = ", ".join(trace["spans"][:8])
        lines.append(
            f"| `{trace['root_span_id']}` | {trace['event_count']} | {trace['total_observed_ms']} | {top_spans} |"
        )

    if summary["errors"]:
        lines.extend(["", "## Errors", "", "| Root span | Span | Error |", "|---|---|---|"])
        for item in summary["errors"][:20]:
            lines.append(
                f"| `{item['root_span_id']}` | `{item['span']}` | {preview_json(item['error'], max_chars=160)} |"
            )

    return "\n".join(lines) + "\n"


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch recent Braintrust project logs and summarize latency spans.")
    parser.add_argument("--api-url", default=os.getenv("BRAINTRUST_API_URL"))
    parser.add_argument("--api-key", default=os.getenv("BRAINTRUST_API_KEY"))
    parser.add_argument("--project-id", default=os.getenv("BRAINTRUST_PROJECT_ID"))
    parser.add_argument("--limit", type=int, default=50)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--out", default=DEFAULT_OUT_DIR)
    return parser


def main() -> None:
    load_dotenv(".env", override=True)
    parser = build_parser()
    args = parser.parse_args()

    api_url = args.api_url or os.getenv("BRAINTRUST_API_URL")
    api_key = args.api_key or os.getenv("BRAINTRUST_API_KEY")
    project_id = args.project_id or os.getenv("BRAINTRUST_PROJECT_ID")
    if not api_url or not api_key or not project_id:
        raise SystemExit("Missing BRAINTRUST_API_URL, BRAINTRUST_API_KEY, or BRAINTRUST_PROJECT_ID.")

    events = fetch_project_logs(
        api_url=api_url,
        api_key=api_key,
        project_id=project_id,
        limit=args.limit,
        max_pages=args.max_pages,
    )
    summary = summarize(events)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    json_path = out_dir / f"braintrust-latency-{timestamp}.json"
    md_path = out_dir / f"braintrust-latency-{timestamp}.md"
    json_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(summary), encoding="utf-8")
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
