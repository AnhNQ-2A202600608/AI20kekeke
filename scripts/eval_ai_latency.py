from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
import time
from collections import defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx

DEFAULT_QUERIES = [
    {"category": "general", "message": "chào bạn"},
    {"category": "academic_cached", "message": "RAG khác fine-tuning thế nào?"},
    {"category": "academic_cold", "message": "giải thích vector database trong production RAG"},
    {"category": "long_history", "message": "nhắc lại ngắn gọn điểm chính về embedding và retrieval"},
]


def parse_sse_events(raw: str):
    event_name = None
    data_lines: list[str] = []

    def decode_event(name: str, lines: list[str]):
        payload = "\n".join(lines)
        try:
            data: Any = json.loads(payload)
        except json.JSONDecodeError:
            data = payload
        return name, data

    for line in raw.splitlines():
        if line.startswith("event: "):
            event_name = line.removeprefix("event: ").strip()
            data_lines = []
        elif line.startswith("data: "):
            data_lines.append(line.removeprefix("data: "))
        elif line == "" and event_name:
            yield decode_event(event_name, data_lines)
            event_name = None
            data_lines = []
    if event_name:
        yield decode_event(event_name, data_lines)


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


def summarize_results(rows: list[dict[str, Any]]) -> dict[str, Any]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        if not row.get("warmup"):
            grouped[row["category"]].append(row)

    summary: dict[str, Any] = {}
    for category, category_rows in grouped.items():
        client_total = [float(row.get("client_total_ms") or 0) for row in category_rows]
        first_token = [float(row.get("first_token_ms") or 0) for row in category_rows]
        server_total = [float((row.get("timings_ms") or {}).get("total") or 0) for row in category_rows]
        summary[category] = {
            "runs": len(category_rows),
            "client_total_ms": {"p50": percentile(client_total, 0.5), "p95": percentile(client_total, 0.95)},
            "first_token_ms": {"p50": percentile(first_token, 0.5), "p95": percentile(first_token, 0.95)},
            "server_total_ms": {"p50": percentile(server_total, 0.5), "p95": percentile(server_total, 0.95)},
        }
    return summary


async def collect_chat_stream(
    client: httpx.AsyncClient,
    *,
    path: str,
    payload: dict[str, Any],
    headers: dict[str, str],
) -> dict[str, Any]:
    start = time.perf_counter()
    first_event_ms = None
    first_token_ms = None
    answer_chunks: list[str] = []
    done_payload: dict[str, Any] = {}
    error_payload: Any = None
    raw_parts: list[str] = []

    async with client.stream("POST", path, json=payload, headers=headers) as response:
        response.raise_for_status()
        buffer: list[str] = []
        current_event = None
        current_data: list[str] = []
        async for line in response.aiter_lines():
            raw_parts.append(line)
            if first_event_ms is None and line.startswith("event: "):
                first_event_ms = round((time.perf_counter() - start) * 1000, 2)
            if line.startswith("event: "):
                current_event = line.removeprefix("event: ").strip()
                current_data = []
            elif line.startswith("data: "):
                current_data.append(line.removeprefix("data: "))
            elif line == "" and current_event:
                buffer.append("\n".join([f"event: {current_event}", *[f"data: {d}" for d in current_data], ""]))
                data_raw = "\n".join(current_data)
                try:
                    data: Any = json.loads(data_raw)
                except json.JSONDecodeError:
                    data = data_raw
                if current_event == "token":
                    if first_token_ms is None:
                        first_token_ms = round((time.perf_counter() - start) * 1000, 2)
                    if isinstance(data, dict):
                        answer_chunks.append(str(data.get("delta") or ""))
                elif current_event == "done" and isinstance(data, dict):
                    done_payload = data
                elif current_event == "error":
                    error_payload = data
                current_event = None
                current_data = []

    total_ms = round((time.perf_counter() - start) * 1000, 2)
    metadata = done_payload.get("metadata") or {}
    return {
        "client_total_ms": total_ms,
        "ttfb_ms": first_event_ms or total_ms,
        "first_token_ms": first_token_ms or total_ms,
        "timings_ms": metadata.get("timings_ms") or {},
        "answer_chars": len("".join(answer_chunks) or done_payload.get("response", "")),
        "session_id": done_payload.get("session_id"),
        "error": error_payload,
    }


def render_markdown(summary: dict[str, Any], rows: list[dict[str, Any]]) -> str:
    lines = [
        "# AI Latency Eval Report",
        "",
        f"- Generated: {datetime.now(UTC).isoformat()}",
        f"- Runs: {len(rows)}",
        "",
        "| Category | Runs | Client p50 | Client p95 | First token p50 | First token p95 | Server p50 | Server p95 |",
        "|---|---:|---:|---:|---:|---:|---:|---:|",
    ]
    for category, item in sorted(summary.items()):
        lines.append(
            "| {category} | {runs} | {client_p50} | {client_p95} | {token_p50} | {token_p95} | {server_p50} | {server_p95} |".format(
                category=category,
                runs=item["runs"],
                client_p50=item["client_total_ms"]["p50"],
                client_p95=item["client_total_ms"]["p95"],
                token_p50=item["first_token_ms"]["p50"],
                token_p95=item["first_token_ms"]["p95"],
                server_p50=item["server_total_ms"]["p50"],
                server_p95=item["server_total_ms"]["p95"],
            )
        )

    lines.extend(["", "## Timing Contributors", ""])
    span_values: dict[str, list[float]] = defaultdict(list)
    for row in rows:
        if row.get("warmup"):
            continue
        for key, value in (row.get("timings_ms") or {}).items():
            if isinstance(value, int | float):
                span_values[key].append(float(value))

    lines.extend(["| Span | p50 ms | p95 ms |", "|---|---:|---:|"])
    for span, values in sorted(span_values.items(), key=lambda kv: percentile(kv[1], 0.5), reverse=True):
        lines.append(f"| `{span}` | {percentile(values, 0.5)} | {percentile(values, 0.95)} |")

    lines.extend(
        [
            "",
            "## Decision Placeholder",
            "",
            "Use this report to choose the next optimization target from measured p50/p95 contributors.",
        ]
    )
    return "\n".join(lines) + "\n"


def maybe_log_braintrust_eval(rows: list[dict[str, Any]], summary: dict[str, Any], *, enabled: bool) -> None:
    if not enabled or not os.getenv("BRAINTRUST_API_KEY"):
        return
    project_id = os.getenv("BRAINTRUST_PROJECT_ID")
    project = os.getenv("BRAINTRUST_PROJECT") or os.getenv("BRAINTRUST_PROJECT_NAME")
    if not (project_id or project):
        return
    try:
        import braintrust

        logger_kwargs = {"project_id": project_id} if project_id else {"project": project}
        if os.getenv("BRAINTRUST_API_KEY"):
            logger_kwargs["api_key"] = os.getenv("BRAINTRUST_API_KEY")
        if os.getenv("BRAINTRUST_API_URL"):
            logger_kwargs["app_url"] = os.getenv("BRAINTRUST_API_URL")
        logger = braintrust.init_logger(**logger_kwargs)
        for row in rows:
            logger.log(
                input={"message": row.get("message"), "category": row.get("category")},
                output={"error": row.get("error"), "answer_chars": row.get("answer_chars")},
                metrics={
                    "client_total_ms": row.get("client_total_ms"),
                    "first_token_ms": row.get("first_token_ms"),
                    "server_total_ms": (row.get("timings_ms") or {}).get("total"),
                },
                metadata={"timings_ms": row.get("timings_ms") or {}, "warmup": row.get("warmup")},
            )
        logger.log(metadata={"summary": summary, "kind": "ai_latency_eval_summary"})
    except Exception as exc:
        api_key = os.getenv("BRAINTRUST_API_KEY") or ""
        message = str(exc).replace(api_key, "<redacted>")
        print(
            f"Warning: failed to log latency eval rows to Braintrust: {type(exc).__name__}: {message}", file=sys.stderr
        )
        return


async def run_eval(args: argparse.Namespace) -> tuple[Path, Path]:
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    json_path = out_dir / f"ai-latency-{timestamp}.json"
    md_path = out_dir / f"ai-latency-{timestamp}.md"

    headers = {"Authorization": f"Bearer {args.auth_token}"}
    rows: list[dict[str, Any]] = []
    session_by_category: dict[str, str] = {}
    async with httpx.AsyncClient(base_url=args.base_url.rstrip("/"), timeout=args.timeout) as client:
        for query in DEFAULT_QUERIES:
            total_runs = args.warmups + args.repetitions
            for index in range(total_runs):
                category = query["category"]
                payload = {
                    "message": query["message"],
                    "student_id": args.student_id,
                    "course_id": args.course_id,
                    "concept_id": args.concept_id,
                    "mode": args.mode,
                    "stream": True,
                }
                if category in {"academic_cached", "long_history"} and session_by_category.get(category):
                    payload["session_id"] = session_by_category[category]
                result = await collect_chat_stream(client, path="/chat", payload=payload, headers=headers)
                if result.get("session_id"):
                    session_by_category[category] = result["session_id"]
                rows.append(
                    {
                        "category": category,
                        "message": query["message"],
                        "run_index": index,
                        "warmup": index < args.warmups,
                        **result,
                    }
                )

    summary = summarize_results(rows)
    maybe_log_braintrust_eval(rows, summary, enabled=args.braintrust)
    json_path.write_text(json.dumps({"summary": summary, "rows": rows}, ensure_ascii=False, indent=2), encoding="utf-8")
    md_path.write_text(render_markdown(summary, rows), encoding="utf-8")
    return json_path, md_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Run repeatable AI chat latency evals.")
    parser.add_argument("--base-url", default=os.getenv("LATENCY_EVAL_BASE_URL", "http://localhost:8000/api/v1"))
    parser.add_argument("--student-id", default=os.getenv("LATENCY_EVAL_STUDENT_ID"))
    parser.add_argument("--course-id", default=os.getenv("LATENCY_EVAL_COURSE_ID"))
    parser.add_argument("--concept-id", default=os.getenv("LATENCY_EVAL_CONCEPT_ID"))
    parser.add_argument("--auth-token", default=os.getenv("LATENCY_EVAL_AUTH_TOKEN", "service_role"))
    parser.add_argument("--mode", default="Explain")
    parser.add_argument("--repetitions", type=int, default=5)
    parser.add_argument("--warmups", type=int, default=1)
    parser.add_argument("--timeout", type=float, default=45.0)
    parser.add_argument("--out", default="plans/20260628-1021-ai-latency-timing-eval/reports")
    parser.add_argument("--braintrust", action="store_true", help="Log eval rows to Braintrust when env vars are set.")
    return parser


def main() -> None:
    args = build_parser().parse_args()
    json_path, md_path = asyncio.run(run_eval(args))
    print(f"Wrote {json_path}")
    print(f"Wrote {md_path}")


if __name__ == "__main__":
    main()
