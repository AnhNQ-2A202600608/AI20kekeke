from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
API_DIR = ROOT / "src" / "api"


def test_backend_api_routes_do_not_use_generic_500_responses() -> None:
    offenders: list[str] = []
    for path in API_DIR.glob("*.py"):
        source = path.read_text(encoding="utf-8")
        if "status_code=500" in source or "status.HTTP_500_INTERNAL_SERVER_ERROR" in source:
            offenders.append(str(path.relative_to(ROOT)))

    assert offenders == []


def test_backend_api_routes_do_not_expose_raw_exception_details() -> None:
    forbidden_patterns = (
        "detail=str(",
        'detail=f"{',
        "{str(e)}",
        "{str(exc)}",
        "{e}",
        "{exc}",
    )
    offenders: list[str] = []
    for path in API_DIR.glob("*.py"):
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            if "HTTPException" not in line and "detail=" not in line:
                continue
            for pattern in forbidden_patterns:
                if pattern in line:
                    offenders.append(f"{path.relative_to(ROOT)}:{line_number} contains {pattern}")

    assert offenders == []
