"""Challenge Workspace Generator.

Parses problem intake files, recommends capability modules, and scaffolds
independent workspaces under challenges/<slug>/ without modifying core templates.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

# Heuristic keyword matchers for capability recommendation
RECOMMENDATIONS_HEURISTICS = {
    "agent": {
        "keywords": [
            "agent",
            "multi-turn",
            "chatbot",
            "conversation",
            "tool calling",
            "langgraph",
            "reasoning",
        ],
        "reason": (
            "Dialogue flow or tool-calling reasoning detected. Recommend AI Agent orchestration."
        ),
        "dependency": "langgraph, langchain_core",
    },
    "rag": {
        "keywords": [
            "rag",
            "semantic search",
            "vector database",
            "chromadb",
            "document qa",
            "retrieval",
        ],
        "reason": (
            "Text document lookup or retrieval-augmented generation detected. Recommend RAG System."
        ),
        "dependency": "chromadb",
    },
    "computer_vision": {
        "keywords": [
            "image",
            "object detection",
            "contour",
            "opencv",
            "computer vision",
            "video",
            "frame",
        ],
        "reason": (
            "Image processing or visual target analysis detected. Recommend Computer Vision module."
        ),
        "dependency": "cv2",
    },
    "prediction": {
        "keywords": [
            "predict",
            "forecast",
            "classification",
            "regressor",
            "scikit-learn",
            "numpy",
            "tabular",
        ],
        "reason": (
            "Tabular forecast or numerical machine learning modeling detected. "
            "Recommend Prediction Engine."
        ),
        "dependency": "numpy, sklearn",
    },
    "optimization": {
        "keywords": [
            "optimization",
            "scipy",
            "linear programming",
            "operations research",
            "minimize",
            "maximize",
        ],
        "reason": (
            "Operational constraints or resource allocation variables detected. "
            "Recommend Optimization Engine."
        ),
        "dependency": "scipy",
    },
    "analytics": {
        "keywords": [
            "analytics",
            "dataframe",
            "pandas",
            "data profile",
            "correlation",
            "aggregation",
        ],
        "reason": (
            "Exploratory data analysis or column aggregations detected. "
            "Recommend Data Analytics module."
        ),
        "dependency": "pandas",
    },
}


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text.strip("-")


def parse_input_file(path: Path) -> dict[str, Any]:
    """Load JSON or YAML problem intake file."""
    if not path.exists():
        raise FileNotFoundError(f"Problem file not found at: {path}")

    content = path.read_text(encoding="utf-8")

    # Try parsing as JSON first
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        pass

    # Basic fallback YAML parser for simple key-value structures
    # (Avoids strict dependency on external PyYAML if run outside venv)
    try:
        import yaml

        return yaml.safe_load(content)
    except ImportError:
        # Graceful basic custom parser for standard YAML format
        logger_warn("PyYAML not installed. Using simple built-in parser fallback.")
        result: dict[str, Any] = {}
        current_key = None
        for line in content.splitlines():
            # Skip comments and empty lines
            if not line.strip() or line.strip().startswith("#"):
                continue

            # Match top-level key-values
            match = re.match(r"^(\w+):\s*(.*)$", line)
            if match:
                key, val = match.groups()
                val = val.strip().strip('"').strip("'")

                # Check if it starts a list or dict block
                if not val:
                    current_key = key
                    result[key] = [] if line.endswith(":") else {}
                else:
                    result[key] = val
                    current_key = None
            elif current_key and line.startswith("  -"):
                # Handle list item
                item_val = line.replace("  -", "", 1).strip().strip('"').strip("'")
                if isinstance(result[current_key], list):
                    result[current_key].append(item_val)
        return result


def logger_warn(msg: str) -> None:
    print(f"⚠️  WARNING: {msg}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Initialize a new challenge workspace.")
    parser.add_argument("challenge_name", help="Name of the competition challenge")
    parser.add_argument("problem_file", help="Path to JSON/YAML problem intake definition")
    parser.add_argument("--modules", nargs="*", help="Override / manually select enabled modules")
    parser.add_argument(
        "--output", help="Optional override of challenge workspace destination folder"
    )
    args = parser.parse_args()

    # 1. Parse problem intake file
    try:
        problem_path = Path(args.problem_file)
        problem_data = parse_input_file(problem_path)
    except Exception as exc:
        print(f"Error reading problem file: {exc}", file=sys.stderr)
        sys.exit(1)

    # 2. Check mandatory fields
    mandatory_fields = ["title", "description", "rubrics", "data_sources"]
    missing = [f for f in mandatory_fields if f not in problem_data]
    if missing:
        logger_warn(f"Mandatory fields missing in intake data: {', '.join(missing)}")

    # 3. Rubric weights validation
    rubrics = problem_data.get("rubrics", {})
    total_weight = 0
    if isinstance(rubrics, dict):
        # Format: { "accuracy": 40, "code_quality": 30 }
        total_weight = sum(
            float(w) for w in rubrics.values() if str(w).replace(".", "", 1).isdigit()
        )
    elif isinstance(rubrics, list):
        # Format: [ { "criteria": "accuracy", "weight": 40 } ]
        for item in rubrics:
            if isinstance(item, dict):
                w = item.get("weight", 0)
                total_weight += float(w)

    if total_weight != 100.0:
        logger_warn(
            f"Total rubric weight equals {total_weight}%, which is atypical (expected 100%)."
        )

    # 4. Capability Recommendation Engine
    description = problem_data.get("description", "").lower()
    recommended_modules = []

    for mod_id, spec in RECOMMENDATIONS_HEURISTICS.items():
        matched_kws = [kw for kw in spec["keywords"] if kw in description]
        if matched_kws:
            recommended_modules.append(
                {
                    "id": mod_id,
                    "reason": spec["reason"],
                    "evidence": f"Matched keywords: {', '.join(matched_kws)}",
                }
            )

    print("\nEvaluating challenge capability requirements...")
    if recommended_modules:
        print("Recommended capability modules:")
        for rec in recommended_modules:
            print(f"  - {rec['id']}: {rec['reason']} ({rec['evidence']})")
    else:
        print("  - No optional capability modules recommended. Relying on default transform core.")

    # Determine final active modules (support user override)
    final_modules = []
    if args.modules:
        final_modules = args.modules
        print(f"\nUser overridden active modules list: {', '.join(final_modules)}")
    else:
        final_modules = [r["id"] for r in recommended_modules]

    # 5. Scaffold Output Workspace
    slug = slugify(args.challenge_name)
    workspace_dir = (
        Path(args.output)
        if args.output
        else Path(__file__).resolve().parents[1] / "challenges" / slug
    )
    workspace_dir.mkdir(parents=True, exist_ok=True)

    # Copy files safely
    # challenge.yaml
    challenge_config = {
        "slug": slug,
        "title": problem_data.get("title", args.challenge_name),
        "active_modules": final_modules,
        "rubric_total_points": total_weight,
        "data_sources": problem_data.get("data_sources", []),
    }
    (workspace_dir / "challenge.yaml").write_text(
        json.dumps(challenge_config, indent=2), encoding="utf-8"
    )

    # requirements.md
    reqs_lines = [
        f"# Requirements — {args.challenge_name}",
        "",
        problem_data.get("description", "No description provided."),
        "",
        "## Functional Requirements Matrix",
        "",
    ]
    (workspace_dir / "requirements.md").write_text("\n".join(reqs_lines), encoding="utf-8")

    # rubric.md
    rubrics_lines = [
        f"# Rubric Criteria — {args.challenge_name}",
        "",
        f"Total Rubric Weight Points: {total_weight}%",
        "",
    ]
    if isinstance(rubrics, dict):
        for k, v in rubrics.items():
            rubrics_lines.append(f"- **{k}**: {v}%")
    (workspace_dir / "rubric.md").write_text("\n".join(rubrics_lines), encoding="utf-8")

    # Other files as placeholders
    (workspace_dir / "architecture.md").write_text(
        "# Proposed Architecture Design\n", encoding="utf-8"
    )
    (workspace_dir / "mvp.md").write_text("# MVP Definition Plan\n", encoding="utf-8")
    (workspace_dir / "evaluation.md").write_text("# Evaluation Scoring Metrics\n", encoding="utf-8")
    (workspace_dir / "demo.md").write_text("# Dry-Run Demo Script\n", encoding="utf-8")
    (workspace_dir / "risks.md").write_text("# Risk Register Checklist\n", encoding="utf-8")

    # status.md
    status_lines = [
        f"# Challenge Status: {args.challenge_name}",
        "",
        "## Active Tasks Checklist",
        "",
        "- [ ] Initialize baseline solution",
        "- [ ] Populate rubric scoring weights",
        "- [ ] Integrate core storage pipeline",
    ]
    (workspace_dir / "status.md").write_text("\n".join(status_lines), encoding="utf-8")

    # modules_config.json
    modules_config = {"example_transform": True}
    for m in final_modules:
        modules_config[m] = True
    (workspace_dir / "modules_config.json").write_text(
        json.dumps(modules_config, indent=2), encoding="utf-8"
    )

    print(f"\nSuccess: Scaffolded workspace for '{args.challenge_name}' at:\n  {workspace_dir}")
    print(f"ACTIVE_CHALLENGE={workspace_dir}")
    print("Set ACTIVE_CHALLENGE in .env before starting the backend.\n")


if __name__ == "__main__":
    main()
