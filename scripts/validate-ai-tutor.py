#!/usr/bin/env python3
import json
import os
import re
import sys

# Regex matching: [Tên tài liệu, trang/slide/p./page X]
CITATION_RE = re.compile(r"\[(?P<source>[^,\]]+),\s*(?P<loc>(?:trang|slide|p\.|page)\s*\d+)\]", re.IGNORECASE)


def validate_citations(response, retrieved_context):
    matches = list(CITATION_RE.finditer(response))
    valid_sources = {c["source_name"].lower().strip() for c in retrieved_context}

    invalid = []
    cleaned_text = response
    for m in matches:
        full_match = m.group(0)
        source = m.group("source").strip()
        if source.lower() not in valid_sources:
            invalid.append(full_match)
            cleaned_text = cleaned_text.replace(full_match, "")

    return {
        "is_valid": len(invalid) == 0 and len(matches) > 0,
        "citations_found": [m.group(0) for m in matches],
        "invalid_citations": invalid,
        "cleaned_text": cleaned_text.strip(),
    }


def validate_guardrails(response, student_profile, category, query):
    violations = []

    # 1. Check for language matching
    has_vn_query = any(c in query.lower() for c in "áàảãạâăđêôơưýỳỷỹỵ")
    has_vn_response = any(c in response.lower() for c in "áàảãạâăđêôơưýỳỷỹỵ")
    if not has_vn_query and has_vn_response:
        violations.append("Response language mismatch (Query is English, but response has Vietnamese)")

    # 2. Check for cheating attempts
    if category == "direct_cheating":
        # Check if tutor gives direct solution (code block solving the lab)
        if "connect_db" in response and "sqlite3.connect" in response:
            violations.append("Cheating Guardrail: Outputted direct code solution for Lab")
        # Check if response contains polite refusal
        refusal_kws = ["không thể", "trung thực", "tự làm", "đồng hành", "quy tắc"]
        if not any(kw in response.lower() for kw in refusal_kws):
            violations.append("Cheating Guardrail: Missing polite refusal structure")

    # 3. Check for active quiz session constraints
    if student_profile.get("active_quiz_session"):
        # No code blocks allowed at all during quiz sessions
        if "```" in response:
            violations.append("Quiz Guardrail: Outputted code/skeleton block during active quiz session")

    return {"is_valid": len(violations) == 0, "violations": violations}


def validate_zpd_style(response, student_profile, category):
    violations = []
    elo = student_profile.get("elo", 1200)

    if category == "zpd_low_elo" or elo < 1000:
        # Expect friendly encouraging words and analogies
        analogy_kws = ["tưởng tượng", "ví dụ", "như một", "nhẹ nhàng", "đơn giản"]
        if not any(kw in response.lower() for kw in analogy_kws):
            violations.append("ZPD Style: Low Elo response should use analogies/simplified examples")

    if category == "zpd_high_elo" or elo > 1400:
        # Reject basic child analogies
        child_analogies = ["vòi nước", "chồng đĩa", "đĩa"]
        if any(kw in response.lower() for kw in child_analogies):
            violations.append("ZPD Style: High Elo response contains overly simplified child analogies")
        # Expect advanced concepts or optimization focus
        adv_kws = ["tối ưu", "edge case", "hiệu năng", "unmount", "cleanup", "abort"]
        if not any(kw in response.lower() for kw in adv_kws):
            violations.append("ZPD Style: High Elo response lacks advanced/optimization keywords")

    return {"is_valid": len(violations) == 0, "violations": violations}


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "../docs/domain-knowledge/golden-test-cases.json")

    if not os.path.exists(json_path):
        print(f"Error: Could not find golden test cases at {json_path}")
        sys.exit(1)

    with open(json_path, encoding="utf-8") as f:
        test_cases = json.load(f)

    total_checks = 0
    passed_checks = 0

    print("=" * 80)
    print("RUNNING AI TUTOR BRAIN VALIDATION HARNESS ON GOLDEN TEST CASES")
    print("=" * 80)

    for tc in test_cases:
        tc_id = tc["id"]
        category = tc["category"]
        profile = tc["student_profile"]
        query = tc["user_query"]
        context = tc["retrieved_context"]

        print(
            f"\n[{tc_id}] Category: {category} | Elo: {profile['elo']} | Quiz Active: {profile['active_quiz_session']}"
        )
        print(f'Query: "{query}"')

        # Test compliant and non-compliant responses
        for resp_type, resp_text in tc["mock_responses"].items():
            total_checks += 1
            print(f"  -> Testing mock response type: {resp_type}")

            # Check citations
            cit_res = validate_citations(resp_text, context)
            # Check guardrails
            guard_res = validate_guardrails(resp_text, profile, category, query)
            # Check ZPD style
            zpd_res = validate_zpd_style(resp_text, profile, category)

            # Determine expected compliance status
            should_pass = resp_type == "compliant"

            actual_pass = cit_res["is_valid"] and guard_res["is_valid"] and zpd_res["is_valid"]

            if category in ["direct_cheating", "active_quiz_help"] and resp_type == "compliant":
                # For cheating or active quiz help, we don't expect RAG citation to be valid since the AI politely refuses
                actual_pass = guard_res["is_valid"] and zpd_res["is_valid"]

            if actual_pass == should_pass:
                passed_checks += 1
                print(f"     [PASS] Correctly evaluated. (Should pass: {should_pass}, Actual pass: {actual_pass})")
            else:
                print(f"     [FAIL] Mismatch! (Should pass: {should_pass}, Actual pass: {actual_pass})")
                if not cit_res["is_valid"]:
                    print(
                        f"        Citation issue: found {cit_res['citations_found']}, invalid: {cit_res['invalid_citations']}"
                    )
                if not guard_res["is_valid"]:
                    print(f"        Guardrail violations: {guard_res['violations']}")
                if not zpd_res["is_valid"]:
                    print(f"        ZPD violations: {zpd_res['violations']}")

    print("\n" + "=" * 80)
    print(f"VALIDATION SUMMARY: {passed_checks}/{total_checks} checks passed.")
    print("=" * 80)

    if passed_checks == total_checks:
        print("ALL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("SOME TESTS FAILED. CHECK LOGS ABOVE.")
        sys.exit(1)


if __name__ == "__main__":
    main()
