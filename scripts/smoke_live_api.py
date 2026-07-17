#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
import time
from dataclasses import dataclass
from typing import Any

import httpx

TIMEOUT_SECONDS = float(os.getenv("LIVE_SMOKE_TIMEOUT_SECONDS", "20"))
FAKE_STUDENT_ID = "d3b07384-d113-4ec5-a58e-0f2d87e07661"


@dataclass
class CheckResult:
    name: str
    ok: bool
    status_code: int | None = None
    detail: str | None = None
    elapsed_ms: float | None = None

    def as_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "ok": self.ok,
            "status_code": self.status_code,
            "detail": self.detail,
            "elapsed_ms": round(self.elapsed_ms, 1) if self.elapsed_ms is not None else None,
        }


def normalize_url(value: str) -> str:
    return value.strip().rstrip("/")


def request(
    client: httpx.Client, method: str, url: str, **kwargs: Any
) -> tuple[httpx.Response | None, float, str | None]:
    start = time.perf_counter()
    try:
        response = client.request(method, url, **kwargs)
        return response, (time.perf_counter() - start) * 1000, None
    except httpx.HTTPError as exc:
        return None, (time.perf_counter() - start) * 1000, str(exc)


def body_summary(response: httpx.Response) -> str:
    try:
        payload = response.json()
        return json.dumps(payload, ensure_ascii=False, sort_keys=True)[:400]
    except ValueError:
        return response.text[:400]


def expect_status(
    client: httpx.Client,
    name: str,
    method: str,
    url: str,
    expected: set[int],
    **kwargs: Any,
) -> CheckResult:
    response, elapsed_ms, error = request(client, method, url, **kwargs)
    if response is None:
        return CheckResult(name=name, ok=False, detail=error, elapsed_ms=elapsed_ms)
    if response.status_code not in expected:
        return CheckResult(
            name=name,
            ok=False,
            status_code=response.status_code,
            detail=body_summary(response),
            elapsed_ms=elapsed_ms,
        )
    return CheckResult(name=name, ok=True, status_code=response.status_code, elapsed_ms=elapsed_ms)


def check_ready_payload(client: httpx.Client, backend_url: str) -> CheckResult:
    response, elapsed_ms, error = request(client, "GET", f"{backend_url}/ready")
    if response is None:
        return CheckResult("backend_ready", False, detail=error, elapsed_ms=elapsed_ms)
    if response.status_code != 200:
        return CheckResult("backend_ready", False, response.status_code, body_summary(response), elapsed_ms)
    payload = response.json()
    if payload.get("status") != "ready" or payload.get("database") == "stub":
        return CheckResult("backend_ready", False, response.status_code, body_summary(response), elapsed_ms)
    return CheckResult("backend_ready", True, response.status_code, elapsed_ms=elapsed_ms)


def check_cors(client: httpx.Client, backend_url: str, origin: str) -> CheckResult:
    response, elapsed_ms, error = request(
        client,
        "OPTIONS",
        f"{backend_url}/api/v1/status",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization,content-type",
        },
    )
    if response is None:
        return CheckResult("backend_cors_preflight", False, detail=error, elapsed_ms=elapsed_ms)
    allow_origin = response.headers.get("access-control-allow-origin")
    if response.status_code not in {200, 204} or allow_origin != origin:
        return CheckResult(
            "backend_cors_preflight",
            False,
            response.status_code,
            f"allow-origin={allow_origin!r}; body={body_summary(response)}",
            elapsed_ms,
        )
    return CheckResult("backend_cors_preflight", True, response.status_code, elapsed_ms=elapsed_ms)


def check_token_rejected(client: httpx.Client, base_url: str, token: str, name: str) -> CheckResult:
    response, elapsed_ms, error = request(
        client,
        "GET",
        f"{base_url}/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response is None:
        return CheckResult(name, False, detail=error, elapsed_ms=elapsed_ms)
    if response.status_code == 200:
        return CheckResult(name, False, response.status_code, "token was accepted", elapsed_ms)
    if response.status_code not in {401, 403}:
        return CheckResult(name, False, response.status_code, body_summary(response), elapsed_ms)
    return CheckResult(name, True, response.status_code, elapsed_ms=elapsed_ms)


def check_real_token(client: httpx.Client, frontend_url: str, token: str) -> CheckResult:
    response, elapsed_ms, error = request(
        client,
        "GET",
        f"{frontend_url}/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    if response is None:
        return CheckResult("frontend_real_token_auth_me", False, detail=error, elapsed_ms=elapsed_ms)
    if response.status_code != 200:
        return CheckResult(
            "frontend_real_token_auth_me", False, response.status_code, body_summary(response), elapsed_ms
        )
    payload = response.json()
    if not payload.get("id") or str(payload.get("token", "")).startswith("fake-jwt-token-"):
        return CheckResult(
            "frontend_real_token_auth_me", False, response.status_code, body_summary(response), elapsed_ms
        )
    return CheckResult("frontend_real_token_auth_me", True, response.status_code, elapsed_ms=elapsed_ms)


def main() -> int:
    frontend_url = normalize_url(os.getenv("FRONTEND_BASE_URL", ""))
    backend_url = normalize_url(os.getenv("BACKEND_BASE_URL", ""))
    cors_origin = normalize_url(os.getenv("LIVE_SMOKE_CORS_ORIGIN", frontend_url))
    real_token = os.getenv("LIVE_SUPABASE_ACCESS_TOKEN", "").strip()

    missing = [
        name
        for name, value in {"FRONTEND_BASE_URL": frontend_url, "BACKEND_BASE_URL": backend_url}.items()
        if not value
    ]
    if missing:
        print("Missing required env vars: " + ", ".join(missing), file=sys.stderr)
        return 2

    results: list[CheckResult] = []
    with httpx.Client(timeout=TIMEOUT_SECONDS, follow_redirects=False) as client:
        results.append(expect_status(client, "backend_health", "GET", f"{backend_url}/health", {200}))
        results.append(check_ready_payload(client, backend_url))
        results.append(check_cors(client, backend_url, cors_origin))
        results.append(expect_status(client, "frontend_bff_status", "GET", f"{frontend_url}/api/v1/status", {200}))
        results.append(
            check_token_rejected(
                client, frontend_url, f"fake-jwt-token-{FAKE_STUDENT_ID}", "frontend_rejects_fake_token"
            )
        )
        results.append(check_token_rejected(client, frontend_url, FAKE_STUDENT_ID, "frontend_rejects_raw_uuid_token"))
        results.append(
            check_token_rejected(client, backend_url, f"fake-jwt-token-{FAKE_STUDENT_ID}", "backend_rejects_fake_token")
        )
        results.append(check_token_rejected(client, backend_url, FAKE_STUDENT_ID, "backend_rejects_raw_uuid_token"))
        if real_token:
            results.append(check_real_token(client, frontend_url, real_token))

    summary = {"ok": all(result.ok for result in results), "checks": [result.as_dict() for result in results]}
    print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    return 0 if summary["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
