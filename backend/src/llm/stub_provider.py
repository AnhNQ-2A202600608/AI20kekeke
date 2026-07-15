"""Stub LLM provider — rule-based intent detection and response composition.

This provider does NOT call any real LLM API. It uses keyword matching to:
1. Detect user intent (search, lookup, greeting, help, unknown).
2. Build a tool plan based on detected intent.
3. Compose responses grounded in tool results — never fabricating data.

All responses include a [STUB PROVIDER] badge to make it clear this is not a real LLM.
"""

from __future__ import annotations

import re
from typing import Any

from src.llm.base import BaseLLMProvider, LLMResponse


# Keyword patterns for intent detection
_SEARCH_KEYWORDS = [
    "tìm", "search", "find", "tra cứu", "lookup", "tìm kiếm",
    "ai là", "who is", "khách hàng", "customer", "danh sách", "list",
    "premium", "vip", "standard", "active", "inactive",
]

_DETAIL_KEYWORDS = [
    "chi tiết", "detail", "thông tin", "info", "PRF-",
    "hồ sơ", "profile", "lịch sử", "history", "interaction",
    "cơ hội", "opportunity",
]

_GREETING_KEYWORDS = [
    "hello", "hi", "xin chào", "chào", "hey", "good morning",
    "good afternoon", "good evening",
]

_HELP_KEYWORDS = [
    "help", "giúp", "hướng dẫn", "guide", "how to", "cách",
    "tool", "what can", "làm gì", "có thể",
]


def _match_keywords(text: str, keywords: list[str]) -> bool:
    """Check if text contains any of the keywords (case-insensitive)."""
    text_lower = text.lower()
    return any(kw.lower() in text_lower for kw in keywords)


def _extract_record_id(text: str) -> str | None:
    """Try to extract a record ID like PRF-001 from text."""
    match = re.search(r"PRF-\d{3}", text, re.IGNORECASE)
    return match.group(0).upper() if match else None


def _extract_search_query(text: str) -> str:
    """Extract the most likely search term from user text."""
    # Remove common filler words
    fillers = [
        "tìm", "search", "find", "tra cứu", "lookup", "tìm kiếm",
        "cho tôi", "give me", "show me", "hiển thị", "hãy",
        "khách hàng", "customer", "danh sách", "list",
        "ai là", "who is", "thông tin", "về", "about",
        "có", "nào", "những", "các", "của", "the",
    ]
    words = text.split()
    filtered = [w for w in words if w.lower() not in fillers]

    # If we have filtered words, use them; otherwise fall back to full text
    return " ".join(filtered).strip() if filtered else text.strip()


class StubLLMProvider(BaseLLMProvider):
    """Rule-based stub that mimics LLM behavior for development and testing."""

    @property
    def provider_name(self) -> str:
        return "stub"

    def analyze_intent(self, query: str, context: list[dict] | None = None) -> LLMResponse:
        """Detect intent using keyword rules and build a tool plan."""
        record_id = _extract_record_id(query)

        # Priority 1: If a specific record ID is mentioned, get details
        if record_id:
            return LLMResponse(
                content="",
                intent="get_details",
                tool_plan=[
                    {
                        "tool": "get_record_details",
                        "params": {"record_id": record_id},
                        "reason": f"User requested details for {record_id}",
                    }
                ],
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        # Priority 2: Detail keywords without specific ID → search first
        if _match_keywords(query, _DETAIL_KEYWORDS) and not record_id:
            search_query = _extract_search_query(query)
            return LLMResponse(
                content="",
                intent="search_then_detail",
                tool_plan=[
                    {
                        "tool": "search_records",
                        "params": {"query": search_query, "limit": 5},
                        "reason": "Search for matching profiles first",
                    }
                ],
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        # Priority 3: Search keywords
        if _match_keywords(query, _SEARCH_KEYWORDS):
            search_query = _extract_search_query(query)
            return LLMResponse(
                content="",
                intent="search",
                tool_plan=[
                    {
                        "tool": "search_records",
                        "params": {"query": search_query, "limit": 10},
                        "reason": "User wants to search for records",
                    }
                ],
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        # Priority 4: Greeting
        if _match_keywords(query, _GREETING_KEYWORDS):
            return LLMResponse(
                content=(
                    "[STUB PROVIDER] Xin chào! Tôi là VAIC Agent demo. "
                    "Tôi có thể giúp bạn tìm kiếm và xem thông tin khách hàng. "
                    "Hãy thử: 'Tìm khách hàng premium' hoặc 'Chi tiết PRF-001'."
                ),
                intent="greeting",
                tool_plan=[],
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        # Priority 5: Help
        if _match_keywords(query, _HELP_KEYWORDS):
            return LLMResponse(
                content=(
                    "[STUB PROVIDER] Tôi hỗ trợ các thao tác sau:\n"
                    "• Tìm kiếm khách hàng: 'Tìm khách hàng premium'\n"
                    "• Xem chi tiết: 'Chi tiết PRF-001'\n"
                    "• Tìm theo trạng thái: 'Khách hàng inactive'\n"
                    "• Tìm theo khu vực: 'Khách hàng HCM'\n\n"
                    "Dữ liệu hiện tại là mock data cho mục đích demo."
                ),
                intent="help",
                tool_plan=[],
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        # Fallback: Try search with the full query
        return LLMResponse(
            content="",
            intent="search_fallback",
            tool_plan=[
                {
                    "tool": "search_records",
                    "params": {"query": _extract_search_query(query), "limit": 5},
                    "reason": "No clear intent detected — attempting search as fallback",
                }
            ],
            provider=self.provider_name,
            model="stub-rule-engine",
            is_stub=True,
        )

    def compose_response(
        self,
        query: str,
        tool_results: list[dict[str, Any]],
        context: list[dict] | None = None,
    ) -> LLMResponse:
        """Compose a human-readable response grounded in tool results.

        NEVER fabricates data. Only uses what tools returned.
        """
        if not tool_results:
            return LLMResponse(
                content=(
                    "[STUB PROVIDER] Không có kết quả từ công cụ nào. "
                    "Vui lòng thử lại với câu hỏi khác."
                ),
                intent="no_results",
                provider=self.provider_name,
                model="stub-rule-engine",
                is_stub=True,
            )

        parts: list[str] = ["[STUB PROVIDER]"]

        for tr in tool_results:
            tool_name = tr.get("tool_name", "unknown")
            result = tr.get("result", {})
            success = result.get("success", False)

            if not success:
                error_msg = result.get("error", "Unknown error")
                parts.append(f"\n⚠️ Tool '{tool_name}' thất bại: {error_msg}")
                continue

            records = result.get("records", [])
            data = result.get("data", {})

            if tool_name == "search_records":
                total = data.get("total_matches", 0)
                search_query = data.get("query", "")
                if total == 0:
                    parts.append(
                        f"\nKhông tìm thấy kết quả nào cho '{search_query}'."
                    )
                else:
                    parts.append(f"\nTìm thấy {total} kết quả cho '{search_query}':")
                    for i, rec in enumerate(records, 1):
                        parts.append(
                            f"  {i}. [{rec.get('id')}] {rec.get('name')} "
                            f"— {rec.get('segment')}, {rec.get('status')}"
                            f" ({rec.get('region', 'N/A')})"
                        )

            elif tool_name == "get_record_details":
                profile = data.get("profile", {})
                interactions = data.get("interactions", [])
                opportunities = data.get("opportunities", [])

                if profile:
                    parts.append(f"\n📋 Hồ sơ: {profile.get('name')} ({profile.get('id')})")
                    parts.append(f"   Email: {profile.get('email')}")
                    parts.append(f"   Segment: {profile.get('segment')}")
                    parts.append(f"   Status: {profile.get('status')}")
                    meta = profile.get("metadata", {})
                    parts.append(f"   Region: {meta.get('region', 'N/A')}")
                    ltv = meta.get("lifetime_value", 0)
                    parts.append(f"   Lifetime Value: {ltv:,.0f} VND")
                    tags = profile.get("tags", [])
                    if tags:
                        parts.append(f"   Tags: {', '.join(tags)}")

                if interactions:
                    parts.append(f"\n📞 Lịch sử tương tác ({len(interactions)}):")
                    for inter in interactions:
                        amount_str = (
                            f" — {inter['amount']:,.0f} VND"
                            if inter.get("amount")
                            else ""
                        )
                        parts.append(
                            f"   • [{inter['id']}] {inter['type']}: "
                            f"{inter['summary']}{amount_str}"
                        )

                if opportunities:
                    parts.append(f"\n🎯 Cơ hội ({len(opportunities)}):")
                    for opp in opportunities:
                        parts.append(
                            f"   • [{opp['id']}] {opp['type']}: {opp['title']} "
                            f"(ưu tiên: {opp['priority']}, "
                            f"giá trị: {opp.get('estimated_value', 0):,.0f} VND)"
                        )

            else:
                # Generic fallback for unknown tools
                if records:
                    parts.append(f"\nKết quả từ '{tool_name}': {len(records)} bản ghi.")

        return LLMResponse(
            content="\n".join(parts),
            intent="composed_response",
            provider=self.provider_name,
            model="stub-rule-engine",
            is_stub=True,
        )
