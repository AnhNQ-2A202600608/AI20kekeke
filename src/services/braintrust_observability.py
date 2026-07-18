from __future__ import annotations

import os
import sys
from collections.abc import Iterator
from contextlib import contextmanager
from typing import Any

_LOGGER: Any = None
_AUTO_INSTRUMENTED = False


class _NoopSpan:
    def log(self, **_: Any) -> None:
        return


class BraintrustTracer:
    """Optional Braintrust adapter. Disabled unless SDK and env vars exist."""

    def __init__(self) -> None:
        self.enabled = False
        configure_braintrust_observability()
        self._logger = _LOGGER
        if self._logger is not None:
            self.enabled = True

    @contextmanager
    def span(
        self,
        name: str,
        *,
        input: Any | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> Iterator[Any]:
        if not self.enabled or self._logger is None:
            yield _NoopSpan()
            return
        try:
            span_context = self._logger.start_span(name=name, input=input, metadata=metadata or {})
        except Exception:
            yield _NoopSpan()
            return
        with span_context as span:
            yield span


_TRACER: BraintrustTracer | None = None


def configure_braintrust_observability() -> None:
    """Enable Braintrust auto-instrumentation once when env vars are present."""
    global _AUTO_INSTRUMENTED, _LOGGER

    if _LOGGER is not None:
        return
    if "pytest" in sys.modules and os.getenv("BRAINTRUST_ENABLE_IN_TESTS") != "1":
        return
    api_key = os.getenv("BRAINTRUST_API_KEY")
    app_url = os.getenv("BRAINTRUST_API_URL")
    project_id = os.getenv("BRAINTRUST_PROJECT_ID")
    project = os.getenv("BRAINTRUST_PROJECT") or os.getenv("BRAINTRUST_PROJECT_NAME")
    if not api_key or not (project_id or project):
        return

    try:
        import braintrust

        if not _AUTO_INSTRUMENTED:
            braintrust.auto_instrument()
            _AUTO_INSTRUMENTED = True
        logger_kwargs: dict[str, str] = {"api_key": api_key}
        if app_url:
            logger_kwargs["app_url"] = app_url
        if project_id:
            logger_kwargs["project_id"] = project_id
        else:
            logger_kwargs["project"] = project
        _LOGGER = braintrust.init_logger(**logger_kwargs)  # type: ignore[arg-type, union-attr]
    except Exception:
        _LOGGER = None


def get_braintrust_tracer() -> BraintrustTracer:
    global _TRACER
    if _TRACER is None:
        _TRACER = BraintrustTracer()
    return _TRACER


@contextmanager
def braintrust_span(
    name: str,
    *,
    input: Any | None = None,
    metadata: dict[str, Any] | None = None,
) -> Iterator[Any]:
    with get_braintrust_tracer().span(name, input=input, metadata=metadata) as span:
        yield span


def log_span(span: Any, **kwargs: Any) -> None:
    try:
        span.log(**kwargs)
    except Exception:
        return
