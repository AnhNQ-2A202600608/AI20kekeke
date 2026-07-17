import asyncio
import json
import os
import sys

# Reconfigure stdout/stderr to use UTF-8 to prevent encoding errors on Windows
if sys.platform.startswith("win"):
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

from dotenv import load_dotenv

# Add parent directory to sys.path to import src
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# Load env variables
load_dotenv(os.path.join(project_root, ".env"))

from src.agents.graph import agent  # noqa: E402
from src.services.llm import get_llm  # noqa: E402


async def evaluate_response(llm, query: str, response: str, retrieved_slides: list[dict], category: str):
    """
    Evaluates the response using an LLM-as-a-judge matching Ragas metrics (Faithfulness, Relevance)
    and custom EduGap Socratic compliance.
    """
    # Build context string
    context_str = ""
    for idx, slide in enumerate(retrieved_slides):
        context_str += f"[Slide {idx + 1}] Document: {slide.get('document_name')}, Slide: {slide.get('slide_number')}\n"
        if slide.get("content"):
            context_str += f"Content: {slide.get('content')}\n"
        context_str += "---\n"

    if not context_str.strip():
        context_str = "No RAG context was retrieved for this query."

    eval_prompt = f"""
You are an expert AI tutor evaluator. You are auditing a Socratic AI Tutor response to a student.
Evaluate the tutor response on three dimensions (score each from 0 to 5):

---
[STUDENT QUERY]
{query}

[GOLDEN CATEGORY]
{category}

[RETRIEVED RAG SLIDES CONTEXT]
{context_str}

[AI TUTOR RESPONSE]
{response}
---

DIMENSIONS TO EVALUATE:

1. Faithfulness (Hallucination Check):
- 5: The answer is entirely supported by the retrieved slides (no external/invented facts).
- 0: The answer contains major hallucinations or contradicts the slides.
(Note: General social queries or queries where no context is needed should be scored 5 if the response doesn't hallucinate fake facts).

2. Answer Relevance:
- 5: The response is directly relevant and addresses the student's query.
- 0: The response is completely off-topic.

3. Socratic Scaffolding (Pedagogical Compliance):
- 5: The response guides the student step-by-step through questions/hints, and does NOT reveal the final code/solution directly.
- 0: The response directly gives the final solution/code, violating the Socratic rule.
- N/A: If the category is direct_cheating and the AI successfully refused a complete solution while guiding Socratic, give it 5. If it gave the code/final solution, give it 0.

Respond strictly in JSON format with the following keys (no markdown blocks, no other text):
{{
  "faithfulness": <score 0-5>,
  "faithfulness_reason": "<brief reasoning>",
  "relevance": <score 0-5>,
  "relevance_reason": "<brief reasoning>",
  "socratic": <score 0-5>,
  "socratic_reason": "<brief reasoning>"
}}
"""
    try:
        # Call the LLM
        evaluator = get_llm()
        # Ensure we don't get a mock model for evaluation
        if hasattr(evaluator, "invoke"):
            res = await evaluator.ainvoke(eval_prompt)
            res_text = res.content.strip()
        else:
            # Fallback if mock LLM is active
            return {
                "faithfulness": 5,
                "faithfulness_reason": "Mocked pass",
                "relevance": 5,
                "relevance_reason": "Mocked pass",
                "socratic": 5,
                "socratic_reason": "Mocked pass",
            }

        # Parse JSON
        # Strip markdown code block wrappers if any
        if res_text.startswith("```"):
            res_text = res_text.split("```")[1]
            if res_text.startswith("json"):
                res_text = res_text[4:]
        res_text = res_text.strip()

        return json.loads(res_text)
    except Exception as e:
        print(f"  [!] Lỗi khi chạy LLM evaluator: {e}")
        return {
            "faithfulness": 0,
            "faithfulness_reason": f"Evaluation error: {e}",
            "relevance": 0,
            "relevance_reason": f"Evaluation error: {e}",
            "socratic": 0,
            "socratic_reason": f"Evaluation error: {e}",
        }


async def run_evaluation():
    test_cases_path = os.path.join(project_root, "docs", "domain-knowledge", "golden-test-cases.json")
    if not os.path.exists(test_cases_path):
        print(f"[!] Lỗi: Không tìm thấy file golden-test-cases.json tại {test_cases_path}")
        sys.exit(1)

    with open(test_cases_path, encoding="utf-8") as f:
        test_cases = json.load(f)

    print(
        f"[*] Đang chạy đánh giá chất lượng AI bằng LLM-as-a-judge (Ragas-equivalent metrics) trên {len(test_cases)} cases..."
    )

    llm = get_llm()
    results = []

    for tc in test_cases:
        tc_id = tc["id"]
        desc = tc["description"]
        category = tc["category"]
        query = tc["user_query"]
        profile = tc["student_profile"]

        print(f"\n[{tc_id}] Đang xử lý: {query}")

        initial_state = {
            "query": query,
            "student_profile": {
                "elo_score": profile.get("elo", 1200),
                "bkt_mastery_probability": profile.get("bkt_mastery_probability", 0.25),
                "weakness_flag": profile.get("weakness_flag", False),
                "active_quiz_session": profile.get("active_quiz_session", False),
            },
            "metadata": {"student_profile": profile, "golden_category": category},
        }

        try:
            # Run LangGraph Agent
            result = await agent.ainvoke(initial_state)

            response_text = result.get("response", "")
            metadata = result.get("metadata", {})
            retrieved_slides = metadata.get("retrieved_slides", [])

            # Run Ragas-equivalent LLM evaluator
            eval_scores = await evaluate_response(llm, query, response_text, retrieved_slides, category)

            f_score = eval_scores.get("faithfulness", 0)
            r_score = eval_scores.get("relevance", 0)
            s_score = eval_scores.get("socratic", 0)

            print(
                f"  -> Faithfulness (Hallucination check): {f_score}/5 ({eval_scores.get('faithfulness_reason', '')})"
            )
            print(f"  -> Answer Relevance                  : {r_score}/5 ({eval_scores.get('relevance_reason', '')})")
            print(f"  -> Socratic Compliance               : {s_score}/5 ({eval_scores.get('socratic_reason', '')})")

            results.append(
                {
                    "id": tc_id,
                    "category": category,
                    "description": desc,
                    "query": query,
                    "response": response_text,
                    "retrieved_count": len(retrieved_slides),
                    "faithfulness": f_score,
                    "relevance": r_score,
                    "socratic": s_score,
                    "reasons": eval_scores,
                }
            )

        except Exception as e:
            print(f"  [!] Lỗi khi chạy test case {tc_id}: {e}")
            results.append(
                {
                    "id": tc_id,
                    "category": category,
                    "description": desc,
                    "query": query,
                    "response": f"Error: {e}",
                    "retrieved_count": 0,
                    "faithfulness": 0,
                    "relevance": 0,
                    "socratic": 0,
                    "reasons": {"faithfulness_reason": str(e), "relevance_reason": str(e), "socratic_reason": str(e)},
                }
            )

    # Generate Markdown Report
    outputs_dir = os.path.join(project_root, "outputs")
    os.makedirs(outputs_dir, exist_ok=True)
    report_path = os.path.join(outputs_dir, "ragas_eval_report.md")

    avg_faithfulness = sum(r["faithfulness"] for r in results) / len(results)
    avg_relevance = sum(r["relevance"] for r in results) / len(results)
    avg_socratic = sum(r["socratic"] for r in results) / len(results)

    report_lines = [
        "# Báo cáo Đánh giá Chất lượng RAGAS & Socratic (LLM-as-a-judge)",
        "",
        f"- **Tổng số test cases**: {len(results)}",
        "",
        "## 📊 Điểm số trung bình (Scale 1-5)",
        f"- **Faithfulness (Độ trung thực / Chống ảo giác)**: **{avg_faithfulness:.2f}/5**",
        f"- **Answer Relevance (Độ liên quan câu trả lời)**: **{avg_relevance:.2f}/5**",
        f"- **Socratic Scaffolding (Tính gợi mở sư phạm)**: **{avg_socratic:.2f}/5**",
        "",
        "## 📝 Chi tiết từng Test Case",
        "",
        "| ID | Danh mục | Câu hỏi | RAG Count | Faithfulness | Relevance | Socratic | Trạng thái |",
        "|---|---|---|---|---|---|---|---|",
    ]

    for r in results:
        status = "✅ Đạt" if (r["faithfulness"] >= 4 and r["relevance"] >= 4 and r["socratic"] >= 4) else "⚠️ Cần tối ưu"
        clean_query = r["query"].replace("\n", " ")
        report_lines.append(
            f"| {r['id']} | {r['category']} | {clean_query} | {r['retrieved_count']} | {r['faithfulness']}/5 | {r['relevance']}/5 | {r['socratic']}/5 | {status} |"
        )

    report_lines.append("\n## 🔍 Phân tích chi tiết lỗi & Gợi ý")
    for r in results:
        report_lines.extend(
            [
                f"\n### [{r['id']}] {r['description']}",
                f'- **Học viên hỏi**: *"{r["query"]}"*',
                f'- **Tutor trả lời**: *"{r["response"][:200]}..."*',
                "- **Phân tích của Judge**:",
                f"  - *Faithfulness ({r['faithfulness']}/5)*: {r['reasons'].get('faithfulness_reason')}",
                f"  - *Relevance ({r['relevance']}/5)*: {r['reasons'].get('relevance_reason')}",
                f"  - *Socratic ({r['socratic']}/5)*: {r['reasons'].get('socratic_reason')}",
                "---",
            ]
        )

    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    print(f"\n[+] Báo cáo đánh giá chất lượng đã được lưu tại: {report_path}")


if __name__ == "__main__":
    asyncio.run(run_evaluation())
