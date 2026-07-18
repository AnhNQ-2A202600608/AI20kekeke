import json
import os
import subprocess
import sys
from pathlib import Path


def _write_jsonl(path: Path, entries: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        for entry in entries:
            f.write(json.dumps(entry) + "\n")


def _run_log_codex(repo_root: Path, sessions_dir: Path, log_dir: Path) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["CODEX_SESSIONS_DIR"] = str(sessions_dir)
    env["AI_LOG_DIR"] = str(log_dir)
    return subprocess.run(
        [sys.executable, "scripts/log_codex.py", "--all"],
        cwd=repo_root,
        env=env,
        text=True,
        capture_output=True,
        check=False,
    )


def test_log_codex_writes_only_current_repo_user_prompts(tmp_path: Path) -> None:
    repo_root = Path(__file__).resolve().parents[2]
    sessions_dir = tmp_path / "sessions"
    log_dir = tmp_path / ".ai-log"

    matching_session = sessions_dir / "2026" / "07" / "01" / "rollout-abc.jsonl"
    other_session = sessions_dir / "2026" / "07" / "01" / "rollout-other.jsonl"
    _write_jsonl(
        matching_session,
        [
            {
                "timestamp": "2026-07-01T01:00:00Z",
                "type": "session_meta",
                "payload": {"session_id": "abc", "cwd": str(repo_root)},
            },
            {
                "timestamp": "2026-07-01T01:00:01Z",
                "type": "event_msg",
                "payload": {
                    "type": "user_message",
                    "message": (
                        "# Context from my IDE setup:\n\n"
                        "## Active file: .env\n"
                        "## Active selection of the file:\n"
                        "SUPABASE_URL=https://example.invalid\n\n"
                        "## My request for Codex:\n"
                        "fix codex logging\n"
                    ),
                },
            },
            {
                "timestamp": "2026-07-01T01:00:02Z",
                "type": "response_item",
                "payload": {"type": "message", "role": "assistant", "content": []},
            },
        ],
    )
    _write_jsonl(
        other_session,
        [
            {
                "timestamp": "2026-07-01T01:00:00Z",
                "type": "session_meta",
                "payload": {"session_id": "other", "cwd": str(tmp_path / "other-repo")},
            },
            {
                "timestamp": "2026-07-01T01:00:01Z",
                "type": "event_msg",
                "payload": {"type": "user_message", "message": "do not log this"},
            },
        ],
    )

    result = _run_log_codex(repo_root, sessions_dir, log_dir)

    assert result.returncode == 0, result.stderr
    entries = [json.loads(line) for line in (log_dir / "session.jsonl").read_text(encoding="utf-8").splitlines()]
    assert [entry["prompt"] for entry in entries] == ["fix codex logging"]
    assert "SUPABASE_URL" not in entries[0]["prompt"]
    assert entries[0]["tool"] == "codex"
    assert entries[0]["event"] == "UserPrompt"
    assert entries[0]["session_id"] == "abc"


def test_log_codex_is_idempotent_across_live_and_archive_logs(tmp_path: Path) -> None:
    repo_root = Path(__file__).resolve().parents[2]
    sessions_dir = tmp_path / "sessions"
    log_dir = tmp_path / ".ai-log"
    session_file = sessions_dir / "2026" / "07" / "01" / "rollout-abc.jsonl"
    _write_jsonl(
        session_file,
        [
            {
                "timestamp": "2026-07-01T01:00:00Z",
                "type": "session_meta",
                "payload": {"session_id": "abc", "cwd": str(repo_root)},
            },
            {
                "timestamp": "2026-07-01T01:00:01Z",
                "type": "event_msg",
                "payload": {"type": "user_message", "message": "log this once"},
            },
        ],
    )

    first = _run_log_codex(repo_root, sessions_dir, log_dir)
    second = _run_log_codex(repo_root, sessions_dir, log_dir)

    assert first.returncode == 0, first.stderr
    assert second.returncode == 0, second.stderr
    entries = [json.loads(line) for line in (log_dir / "session.jsonl").read_text(encoding="utf-8").splitlines()]
    assert [entry["prompt"] for entry in entries] == ["log this once"]

    entry_id = entries[0]["entry_id"]
    (log_dir / "session.jsonl").unlink()
    _write_jsonl(log_dir / "archive" / "2026-07-01.jsonl", [{"entry_id": entry_id}])
    third = _run_log_codex(repo_root, sessions_dir, log_dir)

    assert third.returncode == 0, third.stderr
    assert not (log_dir / "session.jsonl").exists()
