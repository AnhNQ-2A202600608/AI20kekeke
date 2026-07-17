from __future__ import annotations

import time
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

CORE_TIMING_KEYS = ("total", "rag_embedding", "rag_vector_rpc", "llm_first_token", "llm_total")


class TimingCollector:
    """Small per-request timing collector using monotonic wall time."""

    def __init__(self) -> None:
        self._start = time.perf_counter()
        self._timings_ms: dict[str, float] = {}

    @contextmanager
    def span(self, name: str) -> Iterator[None]:
        start = time.perf_counter()
        try:
            yield
        finally:
            self.add(name, (time.perf_counter() - start) * 1000)

    def add(self, name: str, elapsed_ms: float) -> None:
        self._timings_ms[name] = round(float(elapsed_ms), 2)

    def mark_elapsed(self, name: str) -> None:
        self.add(name, self.elapsed_ms())

    def elapsed_ms(self) -> float:
        return (time.perf_counter() - self._start) * 1000

    def ensure(self, *names: str) -> None:
        for name in names:
            self._timings_ms.setdefault(name, 0.0)

    def update(self, values: dict[str, Any] | None) -> None:
        if not values:
            return
        for key, value in values.items():
            if isinstance(value, int | float):
                self._timings_ms[key] = round(float(value), 2)

    def snapshot(self) -> dict[str, float]:
        return dict(self._timings_ms)


def merge_timing_metadata(metadata: dict[str, Any] | None, timings_ms: dict[str, Any] | None) -> dict[str, Any]:
    merged = dict(metadata or {})
    current = dict(merged.get("timings_ms") or {})
    if timings_ms:
        for key, value in timings_ms.items():
            if isinstance(value, int | float):
                current[key] = round(float(value), 2)
    merged["timings_ms"] = current
    return merged


def core_timing_metadata(metadata: dict[str, Any] | None, timings_ms: dict[str, Any] | None = None) -> dict[str, Any]:
    merged = merge_timing_metadata(metadata, timings_ms)
    current = merged.get("timings_ms") or {}
    merged["timings_ms"] = {key: current[key] for key in CORE_TIMING_KEYS if key in current}
    return merged
