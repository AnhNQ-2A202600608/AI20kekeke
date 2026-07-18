from __future__ import annotations

import os
import threading
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import HTTPException
from pydantic import BaseModel, Field

_DEFAULT_TTL_SECONDS = 120
_FORCE_REFRESH_COOLDOWN_SECONDS = 30


class BraintrustWindow(BaseModel):
    limit: int
    range: str = "24h"
    generated_at: str


class BraintrustCacheMeta(BaseModel):
    cached: bool
    cache_age_seconds: float
    last_fetched_at: str | None = None
    next_refresh_at: str | None = None
    refresh_after_seconds: int
    data_source: str


class BraintrustOverview(BaseModel):
    events: int
    traces: int
    errors: int
    error_rate: float
    score_events: int
    latest_event_at: str | None = None


class BraintrustExecutiveDashboard(BaseModel):
    overview: BraintrustOverview
    last_sync_at: str | None = None
    cache: BraintrustCacheMeta


class BraintrustScoreStatus(BaseModel):
    configured: bool
    message: str
    score_names: list[str] = Field(default_factory=list)


class BraintrustScoreMetric(BaseModel):
    name: str
    count: int
    average: float
    minimum: float
    maximum: float


class BraintrustScoresDashboard(BaseModel):
    status: BraintrustScoreStatus
    metrics: list[BraintrustScoreMetric]
    missing_score_traces: int
    score_coverage: float


class BraintrustSpanLatency(BaseModel):
    name: str
    count: int
    p50_ms: float
    p95_ms: float
    max_ms: float


class BraintrustAgentMetric(BaseModel):
    name: str
    traces: int
    events: int
    errors: int
    error_rate: float
    p95_ms: float
    tool_calls: int
    model_calls: int


class BraintrustAgentsDashboard(BaseModel):
    agents: list[BraintrustAgentMetric]
    top_tools: list[BraintrustAgentMetric]


class BraintrustTraceIssue(BaseModel):
    root_span_id: str
    span: str
    reason: str
    created: str | None = None
    detail_link: str | None = None


class BraintrustErrorsDashboard(BaseModel):
    errors: list[BraintrustTraceIssue]
    error_count: int
    error_rate: float
    error_reasons: dict[str, int] = Field(default_factory=dict)


class BraintrustUsageDashboard(BaseModel):
    available: bool
    total_tokens: int
    input_tokens: int
    output_tokens: int
    estimated_cost: float
    latency_by_span: list[BraintrustSpanLatency]


class BraintrustReviewQueueDashboard(BaseModel):
    items: list[BraintrustTraceIssue]
    reasons: dict[str, int] = Field(default_factory=dict)


class BraintrustDashboardSummary(BaseModel):
    window: BraintrustWindow
    meta: BraintrustCacheMeta
    overview: BraintrustOverview
    score_status: BraintrustScoreStatus
    latency_by_span: list[BraintrustSpanLatency]
    errors: list[BraintrustTraceIssue]
    problem_traces: list[BraintrustTraceIssue]
    executive: BraintrustExecutiveDashboard
    agents: BraintrustAgentsDashboard
    scores: BraintrustScoresDashboard
    incidents: BraintrustErrorsDashboard
    usage: BraintrustUsageDashboard
    review_queue: BraintrustReviewQueueDashboard


@dataclass
class _CachedEvents:
    events: list[dict[str, Any]]
    fetched_at: datetime


_CACHE_LOCK = threading.Lock()
_EVENT_CACHE: dict[str, _CachedEvents] = {}


def _percentile(values: list[float], pct: float) -> float:
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


def _deep_get(value: dict[str, Any], *path: str) -> Any:
    current: Any = value
    for key in path:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _parse_created(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _range_delta(range_value: str) -> timedelta:
    normalized = range_value.strip().lower()
    if normalized.endswith("h") and normalized[:-1].isdigit():
        return timedelta(hours=int(normalized[:-1]))
    if normalized.endswith("d") and normalized[:-1].isdigit():
        return timedelta(days=int(normalized[:-1]))
    return timedelta(hours=24)


def _filter_events_by_range(events: list[dict[str, Any]], range_value: str) -> list[dict[str, Any]]:
    cutoff = datetime.now(UTC) - _range_delta(range_value)
    dated: list[dict[str, Any]] = []
    undated: list[dict[str, Any]] = []
    for event in events:
        created = _parse_created(event.get("created"))
        if created is None:
            undated.append(event)
        elif created >= cutoff:
            dated.append(event)
    if dated:
        return dated
    if len(undated) == len(events):
        return events
    return []


def span_name(event: dict[str, Any]) -> str:
    return str(
        _deep_get(event, "span_attributes", "name")
        or _deep_get(event, "span_attributes", "span_name")
        or _deep_get(event, "metadata", "name")
        or event.get("span_name")
        or event.get("name")
        or "unknown"
    )


def agent_name(event: dict[str, Any]) -> str:
    return str(
        _deep_get(event, "metadata", "agent_name")
        or _deep_get(event, "metadata", "agent")
        or _deep_get(event, "metadata", "workflow")
        or _deep_get(event, "span_attributes", "agent_name")
        or _deep_get(event, "span_attributes", "agent")
        or span_name(event)
    )


def _span_kind(event: dict[str, Any]) -> str:
    return str(
        _deep_get(event, "span_attributes", "type")
        or _deep_get(event, "span_attributes", "kind")
        or _deep_get(event, "metadata", "type")
        or ""
    ).lower()


def _is_tool_call(event: dict[str, Any]) -> bool:
    name = span_name(event).lower()
    kind = _span_kind(event)
    return "tool" in kind or name.startswith("tool.") or ".tool" in name


def _is_model_call(event: dict[str, Any]) -> bool:
    name = span_name(event).lower()
    kind = _span_kind(event)
    return "llm" in kind or "model" in kind or "openai" in name or "anthropic" in name


def duration_ms(event: dict[str, Any]) -> float | None:
    metrics = event.get("metrics") or {}
    direct = metrics.get("duration_ms") or metrics.get("latency_ms")
    if isinstance(direct, int | float):
        return round(float(direct), 2)

    start = metrics.get("start")
    end = metrics.get("end")
    if isinstance(start, int | float) and isinstance(end, int | float) and end >= start:
        return round((float(end) - float(start)) * 1000, 2)
    return None


def _metric_number(event: dict[str, Any], *names: str) -> float:
    metrics = event.get("metrics") or {}
    metadata = event.get("metadata") or {}
    for name in names:
        value = metrics.get(name)
        if isinstance(value, int | float):
            return float(value)
        value = metadata.get(name)
        if isinstance(value, int | float):
            return float(value)
    return 0.0


def _root_span_id(event: dict[str, Any]) -> str:
    return str(event.get("root_span_id") or event.get("span_id") or event.get("id") or "unknown")


def _detail_link(root_span_id: str, *, api_url: str, project_id: str) -> str | None:
    app_url = os.getenv("BRAINTRUST_APP_URL")
    if not app_url:
        if "api.braintrust.dev" in api_url:
            app_url = "https://www.braintrust.dev"
        else:
            app_url = api_url.rstrip("/").removesuffix("/api")
    if not app_url:
        return None
    return f"{app_url.rstrip('/')}/app/trace?project_id={project_id}&root_span_id={root_span_id}"


def _cache_key(*, api_url: str, project_id: str, limit: int) -> str:
    return f"{api_url.rstrip('/')}:{project_id}:{limit}"


def fetch_braintrust_events(*, api_url: str, api_key: str, project_id: str, limit: int) -> list[dict[str, Any]]:
    url = f"{api_url.rstrip('/')}/v1/project_logs/{project_id}/fetch"
    headers = {"Authorization": f"Bearer {api_key}"}
    with httpx.Client(timeout=20.0) as client:
        response = client.get(url, headers=headers, params={"limit": limit})
        response.raise_for_status()
    payload = response.json()
    events = payload.get("events") or []
    return events if isinstance(events, list) else []


def clear_braintrust_dashboard_cache() -> None:
    with _CACHE_LOCK:
        _EVENT_CACHE.clear()


def _fetch_events_with_cache(
    *,
    api_url: str,
    api_key: str,
    project_id: str,
    limit: int,
    force_refresh: bool,
) -> tuple[list[dict[str, Any]], BraintrustCacheMeta]:
    now = datetime.now(UTC)
    key = _cache_key(api_url=api_url, project_id=project_id, limit=limit)
    with _CACHE_LOCK:
        cached = _EVENT_CACHE.get(key)
        if cached:
            age = (now - cached.fetched_at).total_seconds()
            next_refresh_at = cached.fetched_at + timedelta(seconds=_FORCE_REFRESH_COOLDOWN_SECONDS)
            if not force_refresh and age < _DEFAULT_TTL_SECONDS:
                return cached.events, BraintrustCacheMeta(
                    cached=True,
                    cache_age_seconds=round(age, 2),
                    last_fetched_at=cached.fetched_at.isoformat(),
                    next_refresh_at=next_refresh_at.isoformat(),
                    refresh_after_seconds=max(0, int(_FORCE_REFRESH_COOLDOWN_SECONDS - age)),
                    data_source="cache",
                )
            if force_refresh and now < next_refresh_at:
                return cached.events, BraintrustCacheMeta(
                    cached=True,
                    cache_age_seconds=round(age, 2),
                    last_fetched_at=cached.fetched_at.isoformat(),
                    next_refresh_at=next_refresh_at.isoformat(),
                    refresh_after_seconds=max(0, int((next_refresh_at - now).total_seconds())),
                    data_source="cache_rate_limited",
                )

    events = fetch_braintrust_events(api_url=api_url, api_key=api_key, project_id=project_id, limit=limit)
    fetched_at = datetime.now(UTC)
    with _CACHE_LOCK:
        _EVENT_CACHE[key] = _CachedEvents(events=events, fetched_at=fetched_at)
    return events, BraintrustCacheMeta(
        cached=False,
        cache_age_seconds=0.0,
        last_fetched_at=fetched_at.isoformat(),
        next_refresh_at=(fetched_at + timedelta(seconds=_FORCE_REFRESH_COOLDOWN_SECONDS)).isoformat(),
        refresh_after_seconds=_FORCE_REFRESH_COOLDOWN_SECONDS,
        data_source="braintrust",
    )


def _error_reason(event: dict[str, Any]) -> str:
    error = event.get("error")
    if isinstance(error, dict):
        return str(error.get("message") or error.get("type") or "error")
    return str(error or "error")


def summarize_braintrust_events(
    events: list[dict[str, Any]],
    *,
    limit: int,
    api_url: str,
    project_id: str,
    range_value: str = "24h",
    meta: BraintrustCacheMeta | None = None,
) -> BraintrustDashboardSummary:
    events = _filter_events_by_range(events, range_value)
    traces: dict[str, list[dict[str, Any]]] = defaultdict(list)
    span_durations: dict[str, list[float]] = defaultdict(list)
    agent_durations: dict[str, list[float]] = defaultdict(list)
    tool_durations: dict[str, list[float]] = defaultdict(list)
    agent_events: Counter[str] = Counter()
    agent_errors: Counter[str] = Counter()
    agent_tools: Counter[str] = Counter()
    agent_models: Counter[str] = Counter()
    tool_events: Counter[str] = Counter()
    tool_errors: Counter[str] = Counter()
    agent_traces: dict[str, set[str]] = defaultdict(set)
    score_names: Counter[str] = Counter()
    score_values: dict[str, list[float]] = defaultdict(list)
    traces_with_scores: set[str] = set()
    errors: list[BraintrustTraceIssue] = []
    error_reasons: Counter[str] = Counter()
    input_tokens = 0
    output_tokens = 0
    total_tokens = 0
    estimated_cost = 0.0
    meta = meta or BraintrustCacheMeta(
        cached=False,
        cache_age_seconds=0.0,
        refresh_after_seconds=_FORCE_REFRESH_COOLDOWN_SECONDS,
        data_source="memory",
    )

    for event in events:
        root_id = _root_span_id(event)
        name = span_name(event)
        agent = agent_name(event)
        traces[root_id].append(event)
        agent_events[agent] += 1
        agent_traces[agent].add(root_id)

        duration = duration_ms(event)
        if duration is not None:
            span_durations[name].append(duration)
            agent_durations[agent].append(duration)

        if _is_tool_call(event):
            agent_tools[agent] += 1
            tool_events[name] += 1
            if duration is not None:
                tool_durations[name].append(duration)
        if _is_model_call(event):
            agent_models[agent] += 1

        input_tokens += int(_metric_number(event, "input_tokens", "prompt_tokens", "tokens_input"))
        output_tokens += int(_metric_number(event, "output_tokens", "completion_tokens", "tokens_output"))
        total_tokens += int(_metric_number(event, "total_tokens", "tokens"))
        estimated_cost += _metric_number(event, "cost", "estimated_cost", "cost_usd")

        scores = event.get("scores")
        if isinstance(scores, dict) and scores:
            score_names.update(str(key) for key in scores.keys())
            traces_with_scores.add(root_id)
            for key, value in scores.items():
                if isinstance(value, int | float):
                    score_values[str(key)].append(float(value))

        if event.get("error"):
            reason = _error_reason(event)
            agent_errors[agent] += 1
            error_reasons[reason] += 1
            if _is_tool_call(event):
                tool_errors[name] += 1
            errors.append(
                BraintrustTraceIssue(
                    root_span_id=root_id,
                    span=name,
                    reason=reason,
                    created=event.get("created"),
                    detail_link=_detail_link(root_id, api_url=api_url, project_id=project_id),
                )
            )

    latency_by_span = [
        BraintrustSpanLatency(
            name=name,
            count=len(values),
            p50_ms=_percentile(values, 0.5),
            p95_ms=_percentile(values, 0.95),
            max_ms=round(max(values), 2),
        )
        for name, values in sorted(span_durations.items(), key=lambda item: _percentile(item[1], 0.95), reverse=True)
    ]

    trace_rows: list[tuple[str, float, str | None]] = []
    for root_id, trace_events in traces.items():
        valid_durations = [duration_ms(item) for item in trace_events]
        durations = [float(item) for item in valid_durations if item is not None]
        if durations:
            created_values = [item.get("created") for item in trace_events if item.get("created")]
            trace_rows.append((root_id, max(durations), max(created_values) if created_values else None))

    slow_traces = [
        BraintrustTraceIssue(
            root_span_id=root_id,
            span="trace",
            reason=f"slow trace: {round(max_duration, 2)} ms",
            created=created,
            detail_link=_detail_link(root_id, api_url=api_url, project_id=project_id),
        )
        for root_id, max_duration, created in sorted(trace_rows, key=lambda item: item[1], reverse=True)[:10]
    ]

    event_count = len(events)
    trace_count = len(traces)
    error_count = len(errors)
    score_event_count = sum(1 for event in events if isinstance(event.get("scores"), dict) and event.get("scores"))
    latest_event_at = max((event.get("created") for event in events if event.get("created")), default=None)
    if not total_tokens:
        total_tokens = input_tokens + output_tokens
    usage_available = bool(input_tokens or output_tokens or total_tokens or estimated_cost)

    overview = BraintrustOverview(
        events=event_count,
        traces=trace_count,
        errors=error_count,
        error_rate=round(error_count / event_count, 4) if event_count else 0.0,
        score_events=score_event_count,
        latest_event_at=latest_event_at,
    )
    score_status = BraintrustScoreStatus(
        configured=bool(score_names),
        message="Evaluator scores found." if score_names else "No Braintrust evaluator scores configured.",
        score_names=sorted(score_names),
    )
    score_metrics = [
        BraintrustScoreMetric(
            name=name,
            count=len(values),
            average=round(sum(values) / len(values), 4),
            minimum=round(min(values), 4),
            maximum=round(max(values), 4),
        )
        for name, values in sorted(score_values.items())
        if values
    ]
    agent_metrics = [
        BraintrustAgentMetric(
            name=name,
            traces=len(agent_traces[name]),
            events=agent_events[name],
            errors=agent_errors[name],
            error_rate=round(agent_errors[name] / agent_events[name], 4) if agent_events[name] else 0.0,
            p95_ms=_percentile(agent_durations[name], 0.95),
            tool_calls=agent_tools[name],
            model_calls=agent_models[name],
        )
        for name in agent_events
    ]
    top_tools = [
        BraintrustAgentMetric(
            name=name,
            traces=0,
            events=tool_events[name],
            errors=tool_errors[name],
            error_rate=round(tool_errors[name] / tool_events[name], 4) if tool_events[name] else 0.0,
            p95_ms=_percentile(tool_durations[name], 0.95),
            tool_calls=tool_events[name],
            model_calls=0,
        )
        for name in tool_events
    ]

    review_items = list(errors[:10])
    for root_id in set(traces.keys()) - traces_with_scores:
        trace_events = traces[root_id]
        created_values = [item.get("created") for item in trace_events if item.get("created")]
        review_items.append(
            BraintrustTraceIssue(
                root_span_id=root_id,
                span="trace",
                reason="missing score",
                created=max(created_values) if created_values else None,
                detail_link=_detail_link(root_id, api_url=api_url, project_id=project_id),
            )
        )
    review_items.extend(slow_traces[:10])

    return BraintrustDashboardSummary(
        window=BraintrustWindow(limit=limit, range=range_value, generated_at=datetime.now(UTC).isoformat()),
        meta=meta,
        overview=overview,
        score_status=score_status,
        latency_by_span=latency_by_span[:20],
        errors=errors[:20],
        problem_traces=slow_traces,
        executive=BraintrustExecutiveDashboard(overview=overview, last_sync_at=latest_event_at, cache=meta),
        agents=BraintrustAgentsDashboard(
            agents=sorted(agent_metrics, key=lambda item: item.events, reverse=True)[:20],
            top_tools=sorted(top_tools, key=lambda item: item.events, reverse=True)[:20],
        ),
        scores=BraintrustScoresDashboard(
            status=score_status,
            metrics=score_metrics,
            missing_score_traces=max(0, trace_count - len(traces_with_scores)),
            score_coverage=round(len(traces_with_scores) / trace_count, 4) if trace_count else 0.0,
        ),
        incidents=BraintrustErrorsDashboard(
            errors=errors[:50],
            error_count=error_count,
            error_rate=round(error_count / event_count, 4) if event_count else 0.0,
            error_reasons=dict(error_reasons.most_common(10)),
        ),
        usage=BraintrustUsageDashboard(
            available=usage_available,
            total_tokens=total_tokens,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost=round(estimated_cost, 6),
            latency_by_span=latency_by_span[:20],
        ),
        review_queue=BraintrustReviewQueueDashboard(
            items=review_items[:50],
            reasons={
                "error": len(errors),
                "missing_score": max(0, trace_count - len(traces_with_scores)),
                "slow_trace": len(slow_traces),
            },
        ),
    )


def get_braintrust_dashboard_summary(
    *,
    limit: int = 200,
    range_value: str = "24h",
    force_refresh: bool = False,
) -> BraintrustDashboardSummary:
    safe_limit = max(1, min(limit, 500))
    api_url = os.getenv("BRAINTRUST_API_URL", "").strip() or "https://api.braintrust.dev"
    api_key = os.getenv("BRAINTRUST_API_KEY", "").strip()
    project_id = os.getenv("BRAINTRUST_PROJECT_ID", "").strip()
    if not api_url or not api_key or not project_id:
        raise HTTPException(status_code=503, detail="Braintrust dashboard is not configured.")

    try:
        events, meta = _fetch_events_with_cache(
            api_url=api_url,
            api_key=api_key,
            project_id=project_id,
            limit=safe_limit,
            force_refresh=force_refresh,
        )
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail="Unable to fetch Braintrust project logs.") from exc

    return summarize_braintrust_events(
        events,
        limit=safe_limit,
        range_value=range_value,
        api_url=api_url,
        project_id=project_id,
        meta=meta,
    )
