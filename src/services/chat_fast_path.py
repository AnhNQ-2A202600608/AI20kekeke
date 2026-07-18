from __future__ import annotations

import json
import re
import unicodedata
from functools import lru_cache
from pathlib import Path
from typing import Any

RULES_PATH = Path(__file__).with_name("chat_fast_path_rules.json")


def normalize_chat_text(text: str) -> str:
    normalized = unicodedata.normalize("NFKC", text.strip().lower())
    without_marks = "".join(
        char for char in unicodedata.normalize("NFD", normalized) if unicodedata.category(char) != "Mn"
    )
    return without_marks.replace("đ", "d")


@lru_cache(maxsize=1)
def load_fast_path_rules() -> list[dict[str, Any]]:
    try:
        payload = json.loads(RULES_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    rules = payload.get("rules", [])
    return rules if isinstance(rules, list) else []


@lru_cache(maxsize=1)
def load_fast_path_payload() -> dict[str, Any]:
    try:
        return json.loads(RULES_PATH.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return {}


@lru_cache(maxsize=1)
def practice_concept_clarification() -> str:
    payload = load_fast_path_payload()
    response = payload.get("practice_concept_clarification")
    return response if isinstance(response, str) and response else "Bạn muốn ôn tập chủ đề nào?"


@lru_cache(maxsize=1)
def practice_concept_analysis() -> str:
    payload = load_fast_path_payload()
    response = payload.get("practice_concept_analysis")
    return (
        response if isinstance(response, str) and response else "Practice mode requires a topic before quiz generation."
    )


def static_general_response(query: str) -> str | None:
    normalized = normalize_chat_text(query)
    if not normalized:
        return None

    for rule in load_fast_path_rules():
        response = rule.get("response")
        if not isinstance(response, str) or not response:
            continue

        exact_any = rule.get("exact_any") or []
        if normalized in exact_any:
            return response

        contains_any = rule.get("contains_any") or []
        if any(isinstance(term, str) and term in normalized for term in contains_any):
            return response

        regex_any = rule.get("regex_any") or []
        if any(isinstance(pattern, str) and re.search(pattern, normalized) for pattern in regex_any):
            return response

    return None
