#!/usr/bin/env python3
"""
Codex session log scanner.

Reads user prompts from local Codex JSONL transcripts and appends them to
.ai-log/session.jsonl so the existing pre-push submit hook can upload them.

Default source:
    ~/.codex/sessions/**/*.jsonl

Env overrides:
    CODEX_SESSIONS_DIR  point at a different Codex sessions directory
    AI_LOG_DIR          where session.jsonl is written (default: .ai-log)
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

VN_TZ = timezone(timedelta(hours=7))
DEFAULT_SESSIONS_DIR = Path.home() / ".codex" / "sessions"
REQUEST_MARKER = "## My request for Codex:"


def git(cmd: str) -> str:
    try:
        return subprocess.check_output(cmd.split(), shell=False, text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return ""


def _normalize(path: str) -> str:
    if not path:
        return ""
    return path.strip().lower().replace("/", "\\").rstrip("\\")


def _matches_repo(cwd: str, repo_root: str) -> bool:
    if not cwd or not repo_root:
        return False
    if cwd == repo_root:
        return True
    if cwd.startswith(repo_root + "\\"):
        return True
    return repo_root.startswith(cwd + "\\")


def _parse_ts(raw: str) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


def _to_vn_iso(raw: str) -> str:
    parsed = _parse_ts(raw)
    if parsed:
        return parsed.astimezone(VN_TZ).isoformat()
    return raw or datetime.now(VN_TZ).isoformat()


def _text_from_content(content) -> str:
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ""

    parts: list[str] = []
    for item in content:
        if isinstance(item, str):
            parts.append(item)
            continue
        if not isinstance(item, dict):
            continue
        text = item.get("text") or item.get("input_text") or item.get("output_text")
        if isinstance(text, str):
            parts.append(text)
    return "\n".join(part.strip() for part in parts if part and part.strip()).strip()


def _clean_user_prompt(message: str) -> str:
    message = message.strip()
    if REQUEST_MARKER not in message:
        return message

    request = message.split(REQUEST_MARKER, 1)[1].strip()
    return request or message


def _session_context(session_file: Path) -> tuple[str, set[str]]:
    session_id = session_file.stem
    cwds: set[str] = set()

    try:
        with open(session_file, encoding="utf-8") as f:
            for line in f:
                if not line.strip():
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                payload = entry.get("payload") or {}
                if not isinstance(payload, dict):
                    continue

                if entry.get("type") == "session_meta":
                    session_id = payload.get("session_id") or payload.get("id") or session_id
                if payload.get("session_id") and session_id == session_file.stem:
                    session_id = payload["session_id"]

                cwd = payload.get("cwd")
                if isinstance(cwd, str):
                    normalized = _normalize(cwd)
                    if normalized:
                        cwds.add(normalized)
    except OSError:
        pass

    return str(session_id), cwds


def _event_user_prompt(entry: dict) -> str:
    payload = entry.get("payload") or {}
    if entry.get("type") != "event_msg" or not isinstance(payload, dict):
        return ""
    if payload.get("type") != "user_message":
        return ""
    message = payload.get("message")
    return _clean_user_prompt(message) if isinstance(message, str) else ""


def _response_item_user_prompt(entry: dict) -> str:
    payload = entry.get("payload") or {}
    if entry.get("type") != "response_item" or not isinstance(payload, dict):
        return ""
    if payload.get("type") != "message" or payload.get("role") != "user":
        return ""
    return _clean_user_prompt(_text_from_content(payload.get("content")))


def get_session_files(sessions_dir: Path, only_session: str | None = None) -> list[Path]:
    if not sessions_dir.exists():
        return []
    files = sorted(p for p in sessions_dir.rglob("*.jsonl") if p.is_file())
    if not only_session:
        return files
    return [p for p in files if only_session in {p.stem, _session_context(p)[0]}]


def iter_user_prompts(session_files: list[Path], cutoff: datetime | None, repo_root_n: str):
    for session_file in session_files:
        session_id, cwds = _session_context(session_file)
        if repo_root_n and not any(_matches_repo(cwd, repo_root_n) for cwd in cwds):
            continue

        entries: list[tuple[int, dict]] = []
        try:
            with open(session_file, encoding="utf-8") as f:
                for index, line in enumerate(f):
                    if not line.strip():
                        continue
                    try:
                        entries.append((index, json.loads(line)))
                    except json.JSONDecodeError:
                        continue
        except OSError:
            continue

        user_messages: list[tuple[int, dict, str]] = []
        for index, entry in entries:
            prompt = _event_user_prompt(entry)
            if prompt:
                user_messages.append((index, entry, prompt))

        if not user_messages:
            for index, entry in entries:
                prompt = _response_item_user_prompt(entry)
                if prompt:
                    user_messages.append((index, entry, prompt))

        for index, entry, prompt in user_messages:
            ts = entry.get("timestamp") or ""
            parsed_ts = _parse_ts(ts)
            if cutoff and parsed_ts and parsed_ts < cutoff:
                continue
            if len(prompt) < 2:
                continue
            yield {
                "session_id": session_id,
                "line_index": index,
                "timestamp": ts,
                "text": prompt,
            }


def get_logged_entry_ids(log_dir: Path) -> set[str]:
    paths = [log_dir / "session.jsonl"]
    archive_dir = log_dir / "archive"
    if archive_dir.exists():
        paths.extend(sorted(archive_dir.glob("*.jsonl")))

    logged: set[str] = set()
    for path in paths:
        if not path.exists():
            continue
        try:
            with open(path, encoding="utf-8-sig") as f:
                for line in f:
                    if not line.strip():
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    entry_id = entry.get("entry_id")
                    if isinstance(entry_id, str) and entry_id:
                        logged.add(entry_id)
        except OSError:
            continue
    return logged


def build_entry(msg: dict, repo: str, branch: str, commit: str, student: str) -> dict:
    return {
        "ts": _to_vn_iso(msg["timestamp"]),
        "tool": "codex",
        "event": "UserPrompt",
        "entry_id": f"codex-{msg['session_id']}-{msg['line_index']:05d}",
        "session_id": msg["session_id"],
        "model": "codex",
        "repo": repo,
        "branch": branch,
        "commit": commit,
        "student": student,
        "prompt": msg["text"],
        "response_summary": "",
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract user prompts from Codex session transcripts.")
    parser.add_argument("--auto", action="store_true", help="Default mode: scan recent sessions.")
    parser.add_argument("--hours", type=int, default=24, help="Window in hours when scanning (default: 24).")
    parser.add_argument("--all", action="store_true", help="Ignore the time window; scan every session.")
    parser.add_argument("--session-id", help="Limit to one Codex session id or rollout file stem.")
    parser.add_argument("--no-repo-filter", action="store_true", help="Do not filter sessions by current repo cwd.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be logged, do not write.")
    args = parser.parse_args()

    sessions_dir = Path(os.environ.get("CODEX_SESSIONS_DIR", str(DEFAULT_SESSIONS_DIR)))
    session_files = get_session_files(sessions_dir, args.session_id)
    if not session_files:
        print(f"[codex-log] No Codex session files found under {sessions_dir}.", file=sys.stderr)
        sys.exit(0)

    log_dir = Path(os.environ.get("AI_LOG_DIR", ".ai-log"))
    log_file = log_dir / "session.jsonl"
    logged_ids = get_logged_entry_ids(log_dir)

    cutoff = None
    if not args.all:
        cutoff = datetime.now(tz=VN_TZ) - timedelta(hours=args.hours)

    repo_root_n = "" if args.no_repo_filter else _normalize(str(Path.cwd()))
    repo = git("git remote get-url origin").split("/")[-1].replace(".git", "") or Path.cwd().name
    branch = git("git rev-parse --abbrev-ref HEAD")
    commit = git("git rev-parse --short HEAD")
    student = git("git config user.email") or os.environ.get("USERNAME", os.environ.get("USER", "unknown"))

    new_entries: list[dict] = []
    for msg in iter_user_prompts(session_files, cutoff, repo_root_n):
        entry = build_entry(msg, repo, branch, commit, student)
        if entry["entry_id"] in logged_ids:
            continue
        new_entries.append(entry)
        logged_ids.add(entry["entry_id"])

    if not new_entries:
        scope = "all" if args.all else f"{args.hours}h"
        repo_note = "any repo" if args.no_repo_filter else f"repo={repo_root_n or '(unknown)'}"
        print(f"[codex-log] No new prompts ({repo_note}, window={scope}).", file=sys.stderr)
        sys.exit(0)

    if args.dry_run:
        print(f"\n[codex-log] DRY RUN - would log {len(new_entries)} entries:\n")
        for entry in new_entries:
            preview = entry["prompt"].replace("\n", " ")[:120]
            print(f"  [{entry['ts'][:19]}] {preview}")
        sys.exit(0)

    log_dir.mkdir(exist_ok=True)
    with open(log_file, "a", encoding="utf-8") as f:
        for entry in new_entries:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    print(f"[codex-log] Logged {len(new_entries)} prompt(s) from Codex.", file=sys.stderr)


if __name__ == "__main__":
    main()
