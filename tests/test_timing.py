import time


def test_timing_collector_records_named_spans():
    from src.services.timing import TimingCollector

    timings = TimingCollector()
    with timings.span("example"):
        time.sleep(0.001)

    snapshot = timings.snapshot()
    assert "example" in snapshot
    assert snapshot["example"] >= 0


def test_timing_collector_merges_nested_timing_dicts():
    from src.services.timing import merge_timing_metadata

    metadata = {"timings_ms": {"existing": 1.0}}
    merged = merge_timing_metadata(metadata, {"new": 2.0})

    assert merged["timings_ms"]["existing"] == 1.0
    assert merged["timings_ms"]["new"] == 2.0
    assert metadata["timings_ms"]["existing"] == 1.0


def test_core_timing_metadata_keeps_only_fallback_keys():
    from src.services.timing import core_timing_metadata

    metadata = {
        "timings_ms": {
            "total": 10,
            "rag_embedding": 2,
            "rag_vector_rpc": 3,
            "llm_first_token": 4,
            "llm_total": 5,
            "history_load": 99,
        }
    }

    result = core_timing_metadata(metadata)
    assert result["timings_ms"] == {
        "total": 10,
        "rag_embedding": 2,
        "rag_vector_rpc": 3,
        "llm_first_token": 4,
        "llm_total": 5,
    }


def test_braintrust_span_reraises_application_exceptions(monkeypatch):
    from src.services import braintrust_observability

    class DummyContext:
        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

        def log(self, **kwargs):
            return None

    class DummyLogger:
        def start_span(self, **kwargs):
            return DummyContext()

    tracer = braintrust_observability.BraintrustTracer()
    tracer.enabled = True
    tracer._logger = DummyLogger()
    monkeypatch.setattr(braintrust_observability, "_TRACER", tracer)

    try:
        with braintrust_observability.braintrust_span("test"):
            raise ValueError("boom")
    except ValueError as exc:
        assert str(exc) == "boom"
    else:
        raise AssertionError("braintrust_span swallowed an application exception")
