def test_parse_sse_events_handles_token_and_done():
    from scripts.eval_ai_latency import parse_sse_events

    raw = "\n".join(
        [
            "event: token",
            'data: {"delta": "hello"}',
            "",
            "event: done",
            'data: {"metadata": {"timings_ms": {"total": 12.3}}}',
            "",
        ]
    )

    events = list(parse_sse_events(raw))
    assert events == [
        ("token", {"delta": "hello"}),
        ("done", {"metadata": {"timings_ms": {"total": 12.3}}}),
    ]


def test_summarize_results_groups_percentiles():
    from scripts.eval_ai_latency import summarize_results

    rows = [
        {"category": "general", "client_total_ms": 100, "first_token_ms": 50, "timings_ms": {"total": 90}},
        {"category": "general", "client_total_ms": 200, "first_token_ms": 80, "timings_ms": {"total": 180}},
        {"category": "academic", "client_total_ms": 300, "first_token_ms": 120, "timings_ms": {"total": 260}},
    ]

    summary = summarize_results(rows)
    assert summary["general"]["runs"] == 2
    assert summary["general"]["client_total_ms"]["p50"] == 150
    assert summary["academic"]["server_total_ms"]["p95"] == 260
