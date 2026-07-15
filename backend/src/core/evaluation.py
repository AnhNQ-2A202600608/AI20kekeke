"""Evaluation Runner and Metric Registry.

Compiles scoring reports (runtime, error rates, success metrics) and outputs
both JSON and markdown summary evaluation assets.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable


@dataclass
class EvalReport:
    timestamp: str
    total_runs: int
    successful_runs: int
    failed_runs: int
    success_rate: float
    average_duration_ms: float
    error_rate: float
    metrics: dict[str, Any] = field(default_factory=dict)
    individual_runs: list[dict[str, Any]] = field(default_factory=list)


class MetricRegistry:
    """Registry for evaluation scoring functions."""

    def __init__(self) -> None:
        self._metrics: dict[str, Callable[[Any, Any], float]] = {}

    def register(self, name: str, func: Callable[[Any, Any], float]) -> None:
        if name in self._metrics:
            raise ValueError(f"Metric '{name}' already registered")
        self._metrics[name] = func

    def evaluate(self, name: str, output: Any, expected: Any) -> float:
        func = self._metrics.get(name)
        if not func:
            raise ValueError(f"Unknown evaluation metric: {name}")
        return func(output, expected)


class EvaluationRunner:
    """Orchestrates runs evaluation and outputs markdown/JSON reports."""

    def __init__(self, metric_registry: MetricRegistry | None = None) -> None:
        self.registry = metric_registry or MetricRegistry()

    def generate_report(self, run_records: list[dict[str, Any]]) -> EvalReport:
        """Analyze run history and compute standard pipeline metrics."""
        if not run_records:
            return EvalReport(
                timestamp=datetime.now(timezone.utc).isoformat(),
                total_runs=0,
                successful_runs=0,
                failed_runs=0,
                success_rate=0.0,
                average_duration_ms=0.0,
                error_rate=0.0,
            )

        total_runs = len(run_records)
        successful_runs = sum(1 for r in run_records if r.get("status") == "completed")
        failed_runs = sum(1 for r in run_records if r.get("status") == "failed")

        success_rate = (successful_runs / total_runs) if total_runs > 0 else 0.0
        error_rate = (failed_runs / total_runs) if total_runs > 0 else 0.0

        # Calculate average duration if timestamps are present
        durations = []
        for r in run_records:
            started = r.get("started_at")
            completed = r.get("completed_at")
            if started and completed:
                try:
                    t1 = datetime.fromisoformat(started)
                    t2 = datetime.fromisoformat(completed)
                    durations.append((t2 - t1).total_seconds() * 1000.0)
                except ValueError:
                    pass

        avg_duration = sum(durations) / len(durations) if durations else 0.0

        return EvalReport(
            timestamp=datetime.now(timezone.utc).isoformat(),
            total_runs=total_runs,
            successful_runs=successful_runs,
            failed_runs=failed_runs,
            success_rate=success_rate,
            average_duration_ms=avg_duration,
            error_rate=error_rate,
            individual_runs=run_records,
        )

    def write_reports(
        self, report: EvalReport, output_dir: Path, filename_prefix: str = "eval"
    ) -> None:
        """Write report out to JSON and Markdown file formats."""
        output_dir.mkdir(parents=True, exist_ok=True)

        # 1. JSON Report
        json_path = output_dir / f"{filename_prefix}_report.json"
        report_dict = {
            "timestamp": report.timestamp,
            "total_runs": report.total_runs,
            "successful_runs": report.successful_runs,
            "failed_runs": report.failed_runs,
            "success_rate": report.success_rate,
            "average_duration_ms": report.average_duration_ms,
            "error_rate": report.error_rate,
            "metrics": report.metrics,
            "individual_runs_count": len(report.individual_runs),
        }
        json_path.write_text(json.dumps(report_dict, indent=2), encoding="utf-8")

        # 2. Markdown Report
        md_path = output_dir / f"{filename_prefix}_report.md"
        md_lines = [
            "# Evaluation Summary Report",
            "",
            f"- **Timestamp**: {report.timestamp}",
            f"- **Total Runs**: {report.total_runs}",
            f"- **Successful Runs**: {report.successful_runs}",
            f"- **Failed Runs**: {report.failed_runs}",
            f"- **Success Rate**: {report.success_rate:.2%}",
            f"- **Error Rate**: {report.error_rate:.2%}",
            f"- **Average Duration**: {report.average_duration_ms:.2f} ms",
            "",
            "## Individual Run Index",
            "",
            "| Run ID | Capability | Status | Completed At |",
            "|--------|------------|--------|--------------|",
        ]
        for run in report.individual_runs:
            completed_at = run.get("completed_at") or "N/A"
            md_lines.append(
                f"| {run.get('run_id')} | {run.get('capability')} | "
                f"{run.get('status')} | {completed_at} |"
            )

        md_path.write_text("\n".join(md_lines), encoding="utf-8")
