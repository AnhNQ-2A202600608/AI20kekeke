"""Unit tests for the init_challenge generator script."""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

# Ensure scripts directory can be imported if needed, or tested as a subprocess
_PROJECT_ROOT = Path(__file__).resolve().parents[2]
import sys
sys.path.append(str(_PROJECT_ROOT))


@pytest.fixture
def temp_workspace():
    """Create a temporary directory for challenge initialization outputs."""
    temp_dir = Path(tempfile.mkdtemp(prefix="vaic_challenge_"))
    yield temp_dir
    shutil.rmtree(temp_dir)


def test_slugify():
    from scripts.init_challenge import slugify
    assert slugify("Document QA Solver") == "document-qa-solver"
    assert slugify("Optimizing-resource_plan v2!") == "optimizing-resource-plan-v2"


def test_challenge_init_success(temp_workspace):
    # Create a mock problem file
    problem_file = temp_workspace / "problem.json"
    problem_data = {
        "title": "Predictive Sales modeling",
        "description": "Model monthly sales volumes forecast. Uses pandas analysis and numpy arrays to predict.",
        "rubrics": {
            "r2_score": 50,
            "mean_squared_error": 50
        },
        "data_sources": ["sales.csv"]
    }
    problem_file.write_text(json.dumps(problem_data), encoding="utf-8")

    output_dir = temp_workspace / "challenges" / "predictive-sales-modeling"

    # Run init_challenge.py via subprocess to verify standard execution
    script_path = _PROJECT_ROOT / "scripts" / "init_challenge.py"
    cmd = [
        sys.executable,
        str(script_path),
        "Predictive Sales modeling",
        str(problem_file),
        "--output",
        str(output_dir)
    ]
    
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    assert "prediction" in res.stdout  # numpy/predict keywords should recommend prediction
    assert "analytics" in res.stdout   # pandas keyword should recommend analytics

    # Check generated files
    assert output_dir.exists()
    assert (output_dir / "challenge.yaml").exists()
    assert (output_dir / "modules_config.json").exists()

    # Load configuration copy
    conf = json.loads((output_dir / "challenge.yaml").read_text(encoding="utf-8"))
    assert conf["slug"] == "predictive-sales-modeling"
    assert "prediction" in conf["active_modules"]
    assert "analytics" in conf["active_modules"]


def test_challenge_init_rubrics_warning(temp_workspace):
    # Mock problem file with bad weight sum (70% instead of 100%)
    problem_file = temp_workspace / "problem.json"
    problem_data = {
        "title": "CV Object Counter",
        "description": "Uses opencv and frames to detect shapes.",
        "rubrics": {
            "detection": 70
        },
        "data_sources": ["frames/"]
    }
    problem_file.write_text(json.dumps(problem_data), encoding="utf-8")
    output_dir = temp_workspace / "challenges" / "cv-counter"

    script_path = _PROJECT_ROOT / "scripts" / "init_challenge.py"
    cmd = [
        sys.executable,
        str(script_path),
        "CV Object Counter",
        str(problem_file),
        "--output",
        str(output_dir)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    # Should print weight warning to stderr or stdout
    assert "WARNING" in res.stderr or "WARNING" in res.stdout
    assert "70.0%" in res.stderr or "70.0%" in res.stdout


def test_challenge_init_override_modules(temp_workspace):
    problem_file = temp_workspace / "problem.json"
    problem_data = {
        "title": "Minimal transform",
        "description": "Simple baseline",
        "rubrics": {
            "accuracy": 100
        },
        "data_sources": []
    }
    problem_file.write_text(json.dumps(problem_data), encoding="utf-8")
    output_dir = temp_workspace / "challenges" / "minimal-transform"

    script_path = _PROJECT_ROOT / "scripts" / "init_challenge.py"
    cmd = [
        sys.executable,
        str(script_path),
        "Minimal transform",
        str(problem_file),
        "--modules", "optimization", "rag",
        "--output", str(output_dir)
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    assert res.returncode == 0
    
    # Load config and verify overridden modules are set
    conf = json.loads((output_dir / "challenge.yaml").read_text(encoding="utf-8"))
    assert "optimization" in conf["active_modules"]
    assert "rag" in conf["active_modules"]
    assert "prediction" not in conf["active_modules"]
