from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONCURRENCY_MIGRATION = ROOT / "db" / "supabase" / "migrations" / "20260621_concurrency_and_async_outbox.sql"


def _migration_sql() -> str:
    return CONCURRENCY_MIGRATION.read_text(encoding="utf-8").lower()


def _strip_line_comments(sql: str) -> str:
    return "\n".join(line.split("--", maxsplit=1)[0] for line in sql.splitlines())


def _statements(sql: str) -> list[str]:
    return [statement.strip() for statement in sql.split(";") if statement.strip()]


def test_submit_attempt_v3_rpc_is_backend_only() -> None:
    def clean(s: str) -> str:
        s = " ".join(s.split())
        s = s.replace("( ", "(").replace(" )", ")").replace(", ", ",").replace(" ,", ",")
        return s

    sql = clean(_migration_sql())

    signature = clean(
        "app.submit_attempt_v3(uuid, uuid, uuid, uuid, uuid, jsonb, "
        "numeric, integer, boolean, numeric[], numeric, numeric, integer)"
    )
    assert f"revoke execute on function {signature} from authenticated" in sql
    assert f"revoke execute on function {signature} from public" in sql
    assert f"grant execute on function {signature} to service_role" in sql
    assert f"grant execute on function {signature} to authenticated" not in sql


def test_submit_attempt_v3_uses_async_calibration_outbox() -> None:
    sql = _migration_sql()

    function_body = _strip_line_comments(sql.split("-- phân quyền", maxsplit=1)[0])
    statements = _statements(function_body)
    assert not any("from app.questions" in statement and "for update" in statement for statement in statements)
    assert not any("from audit.bandit_arms" in statement and "for update" in statement for statement in statements)
    assert "insert into app.calibration_outbox" in function_body
    assert "update app.questions" not in function_body
    assert "update audit.bandit_arms" not in function_body
