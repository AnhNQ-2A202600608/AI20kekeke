from __future__ import annotations

import argparse
import json
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import httpx
from dotenv import load_dotenv


def fetch_project_logs(
    *,
    api_url: str,
    api_key: str,
    project_id: str,
    limit: int,
    max_pages: int,
) -> list[dict[str, Any]]:
    headers = {"Authorization": f"Bearer {api_key}"}
    url = f"{api_url.rstrip('/')}/v1/project_logs/{project_id}/fetch"
    cursor = None
    events_by_id: dict[str, dict[str, Any]] = {}

    with httpx.Client(timeout=30.0) as client:
        for _ in range(max_pages):
            params: dict[str, Any] = {"limit": limit}
            if cursor:
                params["cursor"] = cursor
            response = client.get(url, headers=headers, params=params)
            response.raise_for_status()
            payload = response.json()
            for event in payload.get("events") or []:
                event_id = event.get("id")
                if event_id:
                    events_by_id[str(event_id)] = event
            cursor = payload.get("cursor")
            if not cursor:
                break

    return list(events_by_id.values())


def _metadata_for_transfer(event: dict[str, Any], source_project_id: str) -> dict[str, Any]:
    source_metadata = event.get("metadata")
    metadata: dict[str, Any] = source_metadata if isinstance(source_metadata, dict) else {}
    return {
        **metadata,
        "braintrust_transfer": True,
        "source_project_id": source_project_id,
        "source_event_id": event.get("id"),
        "source_span_id": event.get("span_id"),
        "source_root_span_id": event.get("root_span_id"),
        "source_parent_span_id": event.get("parent_span_id"),
        "source_created": event.get("created"),
        "transferred_at": datetime.now(UTC).isoformat(),
    }


def _string_error(value: Any) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False, default=str)


def _target_event_id(event: dict[str, Any], source_project_id: str) -> str | None:
    source_event_id = event.get("id")
    if not source_event_id:
        return None
    return f"transfer:{source_project_id}:{source_event_id}"


def replay_with_sdk(
    *,
    events: list[dict[str, Any]],
    target_app_url: str | None,
    target_api_key: str,
    target_project_id: str,
    source_project_id: str,
) -> int:
    import braintrust

    logger = braintrust.init_logger(
        project_id=target_project_id,
        api_key=target_api_key,
        app_url=target_app_url,
        async_flush=False,
        force_login=True,
    )

    logged = 0
    for event in events:
        logger.log(
            input=event.get("input"),
            output=event.get("output"),
            expected=event.get("expected"),
            error=_string_error(event.get("error")),
            tags=event.get("tags") if isinstance(event.get("tags"), list) else None,
            scores=event.get("scores") if isinstance(event.get("scores"), dict) else None,
            metadata=_metadata_for_transfer(event, source_project_id),
            metrics=event.get("metrics") if isinstance(event.get("metrics"), dict) else None,
            id=_target_event_id(event, source_project_id),
        )
        logged += 1

    logger.flush()
    return logged


def write_raw_backup(events: list[dict[str, Any]], out_dir: Path) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now(UTC).strftime("%Y%m%d-%H%M%S")
    path = out_dir / f"braintrust-project-logs-raw-{timestamp}.json"
    path.write_text(json.dumps({"events": events}, ensure_ascii=False, indent=2, default=str), encoding="utf-8")
    return path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Fetch Braintrust project logs and replay them into another project.")
    parser.add_argument("--source-api-url", default=os.getenv("BRAINTRUST_SOURCE_API_URL") or os.getenv("BRAINTRUST_API_URL"))
    parser.add_argument("--source-api-key", default=os.getenv("BRAINTRUST_SOURCE_API_KEY") or os.getenv("BRAINTRUST_API_KEY"))
    parser.add_argument("--source-project-id", default=os.getenv("BRAINTRUST_SOURCE_PROJECT_ID") or os.getenv("BRAINTRUST_PROJECT_ID"))
    parser.add_argument("--target-app-url", default=os.getenv("BRAINTRUST_TARGET_APP_URL"))
    parser.add_argument("--target-api-key", default=os.getenv("BRAINTRUST_TARGET_API_KEY"))
    parser.add_argument("--target-project-id", default=os.getenv("BRAINTRUST_TARGET_PROJECT_ID"))
    parser.add_argument("--limit", type=int, default=100)
    parser.add_argument("--max-pages", type=int, default=1)
    parser.add_argument("--out", default="outputs/braintrust-transfer")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main() -> None:
    load_dotenv(".env", override=True)
    parser = build_parser()
    args = parser.parse_args()

    source_api_url = args.source_api_url or os.getenv("BRAINTRUST_SOURCE_API_URL") or os.getenv("BRAINTRUST_API_URL")
    source_api_key = args.source_api_key or os.getenv("BRAINTRUST_SOURCE_API_KEY") or os.getenv("BRAINTRUST_API_KEY")
    source_project_id = args.source_project_id or os.getenv("BRAINTRUST_SOURCE_PROJECT_ID") or os.getenv("BRAINTRUST_PROJECT_ID")
    target_app_url = args.target_app_url or os.getenv("BRAINTRUST_TARGET_APP_URL")
    target_api_key = args.target_api_key or os.getenv("BRAINTRUST_TARGET_API_KEY")
    target_project_id = args.target_project_id or os.getenv("BRAINTRUST_TARGET_PROJECT_ID")

    if not source_api_url or not source_api_key or not source_project_id:
        raise SystemExit("Missing source Braintrust settings.")
    if not args.dry_run and (not target_api_key or not target_project_id):
        raise SystemExit("Missing BRAINTRUST_TARGET_API_KEY or BRAINTRUST_TARGET_PROJECT_ID.")
    if not args.dry_run and source_project_id == target_project_id:
        raise SystemExit("Source and target project IDs are identical; refusing to replay logs into the same project.")

    events = fetch_project_logs(
        api_url=source_api_url,
        api_key=source_api_key,
        project_id=source_project_id,
        limit=args.limit,
        max_pages=args.max_pages,
    )
    backup_path = write_raw_backup(events, Path(args.out))

    if args.dry_run:
        print(f"Fetched {len(events)} raw events.")
        print(f"Wrote raw backup {backup_path}")
        print("Dry run only; no logs were replayed.")
        return

    logged = replay_with_sdk(
        events=events,
        target_app_url=target_app_url,
        target_api_key=target_api_key,
        target_project_id=target_project_id,
        source_project_id=source_project_id,
    )
    print(f"Fetched {len(events)} raw events.")
    print(f"Wrote raw backup {backup_path}")
    print(f"Replayed {logged} events into target project.")


if __name__ == "__main__":
    main()
