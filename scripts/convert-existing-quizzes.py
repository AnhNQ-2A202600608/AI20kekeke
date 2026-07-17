# ruff: noqa: E402
import json
import sys
from pathlib import Path

from dotenv import load_dotenv

# Add root folder to python path to resolve config and src
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.insert(0, str(root_dir))

load_dotenv(dotenv_path=root_dir / ".env")

from langchain_core.messages import HumanMessage, SystemMessage

from src.services.llm import get_llm

VALID_CONCEPTS = [
    "d1-ai-llm-foundations",
    "d2-ai-problem-framing",
    "d3-agentic-react",
    "d4-prompt-engineering",
    "d4-tool-calling",
    "d5-ai-product-kickoff",
    "d6-ai-product-hackathon",
    "d7-data-foundations",
    "d7-embedding-vector",
    "d8-rag-pipeline",
    "d9-multi-agent-mcp",
    "d10-data-pipeline-observability",
    "d11-guardrails-safety",
    "d12-cloud-deployment",
    "d13-monitoring-observability",
    "d14-ai-evaluation",
    "d15-production-deployment-cost",
    "d16-track-foundations",
    "d17-t1-prd-pmf",
    "d18-t1-financial-roi",
    "d19-t1-stakeholder-pitch",
    "d20-t1-roadmap-execution",
    "d21-t1-governance-risk",
    "d22-t1-compliance",
    "d23-t1-change-adoption",
    "d24-t1-responsible-ai",
    "d17-t2-data-eng-foundations",
    "d18-t2-data-lakehouse",
    "d19-t2-vector-feature-store",
    "d20-t2-model-serving",
    "d21-t2-cicd",
    "d22-t2-llmops",
    "d23-t2-observability-stack",
    "d24-t2-data-governance",
    "d17-t3-agent-memory",
    "d18-t3-production-rag",
    "d19-t3-graphrag",
    "d20-t3-multi-agent",
    "d21-t3-finetuning-lora",
    "d22-t3-dpo-alignment",
    "d23-t3-langgraph",
    "d24-t3-ragas-guardrails",
]

SET_PRIMARY_CONCEPT = {
    # Day 1
    "day1-basics": "d1-ai-llm-foundations",
    "day1-tokenization": "d1-ai-llm-foundations",
    "day1-llm-architecture": "d1-ai-llm-foundations",
    "day1-inference-decoding": "d1-ai-llm-foundations",
    "day1-short-answer": "d1-ai-llm-foundations",
    "week1-day1": "d1-ai-llm-foundations",
    # Day 2
    "day2-basics": "d2-ai-problem-framing",
    "day2-model-selection": "d2-ai-problem-framing",
    "day2-data-strategy": "d2-ai-problem-framing",
    "day2-metrics-evaluation": "d2-ai-problem-framing",
    "week1-day2": "d2-ai-problem-framing",
    # Day 3
    "react-loop-basics": "d3-agentic-react",
    "react-tool-calling-patterns": "d3-agentic-react",
    "react-agent-security": "d3-agentic-react",
    "react-agent-debugging": "d3-agentic-react",
    "week1-day3": "d3-agentic-react",
    # Day 4
    "prompt-context-foundations": "d4-prompt-engineering",
    "context-engineering-practice": "d4-prompt-engineering",
    "tool-calling-security-control": "d4-tool-calling",
    "prompt-tool-calling-short-answer": "d4-tool-calling",
    "week1-day4": "d4-prompt-engineering",
    # Day 5
    "ai-product-uncertainty-foundations": "d5-ai-product-kickoff",
    "ai-product-uncertainty-practice": "d5-ai-product-kickoff",
    "ai-product-uncertainty-advanced": "d5-ai-product-kickoff",
    "ai-product-uncertainty-business-roi": "d5-ai-product-kickoff",
    "ai-product-uncertainty-short-answer": "d5-ai-product-kickoff",
    "week1-day5": "d5-ai-product-kickoff",
    # Day 6
    "hackathon-day-preview": "d6-ai-product-hackathon",
    "week1-day6": "d6-ai-product-hackathon",
    # Day 7
    "day7-basics": "d7-data-foundations",
    "day7-pipeline": "d7-embedding-vector",
    "day7-advanced": "d7-embedding-vector",
    "day7-short-answer": "d7-embedding-vector",
    "week1-day7": "d7-data-foundations",
    # Day 8
    "day8-basics": "d8-rag-pipeline",
    "day8-pipeline": "d8-rag-pipeline",
    "day8-advanced": "d8-rag-pipeline",
    "day8-short-answer": "d8-rag-pipeline",
    # Day 9
    "day9-basics": "d9-multi-agent-mcp",
    "day9-pipeline": "d9-multi-agent-mcp",
    "day9-advanced": "d9-multi-agent-mcp",
    "day9-short-answer": "d9-multi-agent-mcp",
    # Day 10
    "day10-basics": "d10-data-pipeline-observability",
    "day10-pipeline": "d10-data-pipeline-observability",
    "day10-advanced": "d10-data-pipeline-observability",
    "day10-short-answer": "d10-data-pipeline-observability",
}


def main():
    llm = get_llm()
    # Check if we got a mock model
    if hasattr(llm, "content"):
        print("[ERROR] get_llm() returned a MockChatModel. Please check environment variables/API keys.")
        sys.exit(1)

    print(f"LLM initialized: {llm}")

    quiz_dir = root_dir / "frontend" / "public" / "quizzes"

    # We want to process day1 through day10 folders
    day_folders = [quiz_dir / f"day{i}" for i in range(1, 11)]

    json_files = []
    for folder in day_folders:
        if folder.exists():
            json_files.extend(list(folder.glob("*.json")))

    print(f"Found {len(json_files)} quiz JSON files in Day 1 - 10 folders.")

    system_prompt = """Bạn là một chuyên gia về Socratic Method và AI Education.
Nhiệm vụ của bạn là tạo ra:
1. Một "Socratic hint ladder" gồm đúng 3 cấp độ gợi ý (hints) cho các câu hỏi trắc nghiệm hoặc tự luận được cung cấp.
2. Danh sách các "concepts" liên quan đến câu hỏi đó (chọn từ danh sách concept hợp lệ được cung cấp).

Mục tiêu của gợi ý Socratic:
- Dẫn dắt tư duy của học viên tự tìm ra câu trả lời, tuyệt đối không đưa ra câu trả lời trực tiếp hoặc gián tiếp quá lộ liễu.
- Không được đề cập tới chữ cái đáp án đúng (A, B, C, D) hoặc nội dung trực tiếp của đáp án đúng.
- Viết gợi ý bằng Tiếng Việt chuẩn xác, ngắn gọn, súc tích (1-2 câu mỗi gợi ý).

Cấu trúc gợi ý (3 cấp độ):
- Level 1 (Light/Conceptual): Gợi ý ở mức khái niệm chung, nhắc nhở học viên tập trung vào khía cạnh lý thuyết cốt lõi nào, hoặc sử dụng một ẩn dụ/metaphor liên quan.
- Level 2 (Medium/Scaffolded): Gợi ý cấu trúc hoặc cơ chế vận hành, đưa ra câu hỏi gợi mở sâu hơn về mặt kỹ thuật/công thức hoặc thu hẹp phạm vi suy luận.
- Level 3 (Deep/Direct Guidance): Gợi ý bước tư duy trực tiếp, chỉ ra lỗi sai phổ biến hoặc bẫy/trap của câu hỏi, gợi ý học viên đối chiếu loại trừ hoặc phân tích chi tiết các phương án lựa chọn mà không nói rõ phương án nào đúng.

Chọn Concept:
- Chọn từ 1 đến 3 concept liên quan trực tiếp đến câu hỏi trong danh sách concept hợp lệ dưới đây.
- Concept đầu tiên BẮT BUỘC phải là concept mặc định được truyền vào trong yêu cầu của người dùng.

Đầu ra phải là một JSON object hợp lệ tuân thủ định dạng sau:
{
  "questions": [
    {
      "id": 1,
      "hints": [
        "Gợi ý Level 1",
        "Gợi ý Level 2",
        "Gợi ý Level 3"
      ],
      "concepts": [
        "concept-1",
        "concept-2"
      ]
    },
    ...
  ]
}"""

    for file_path in json_files:
        print(f"Processing: {file_path.relative_to(root_dir)}")

        with open(file_path, encoding="utf-8") as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"  [ERROR] Failed to parse JSON: {e}")
                continue

        questions = data.get("questions", [])
        if not questions:
            print("  [WARN] No questions found. Skipping.")
            continue

        # Check if all questions already have hints AND concepts
        need_processing = False
        for q in questions:
            if (
                "hints" not in q
                or not isinstance(q["hints"], list)
                or len(q["hints"]) != 3
                or "concepts" not in q
                or not isinstance(q["concepts"], list)
                or len(q["concepts"]) == 0
            ):
                need_processing = True
                break

        if not need_processing:
            print("  [INFO] Already has hints and concepts. Skipping.")
            continue

        print(f"  Generating hints and concepts for {len(questions)} questions...")

        # Prepare content for LLM
        llm_input_questions = []
        for q in questions:
            q_info = {
                "id": q.get("id"),
                "question": q.get("question"),
            }
            if "options" in q:
                q_info["options"] = q.get("options")
                q_info["answer"] = q.get("answer")
                q_info["explanation"] = q.get("explanation")
            else:
                q_info["expected_answer"] = q.get("expected_answer")
                q_info["evaluation_points"] = q.get("evaluation_points")
            llm_input_questions.append(q_info)

        primary_concept = SET_PRIMARY_CONCEPT.get(file_path.stem, "d1-ai-llm-foundations")

        user_prompt = f"Concept mặc định (bắt buộc chọn đầu tiên): {primary_concept}\n"
        user_prompt += f"Danh sách concept hợp lệ để chọn thêm:\n{json.dumps(VALID_CONCEPTS, indent=2)}\n\n"
        user_prompt += f"Hãy tạo Socratic hints và chọn concepts cho danh sách câu hỏi sau:\n{json.dumps(llm_input_questions, ensure_ascii=False, indent=2)}"

        try:
            try:
                # Try binding response format to JSON
                llm_json = llm.bind(response_format={"type": "json_object"})
                response = llm_json.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])
            except Exception:
                # Fallback to normal invoke if bind or response_format is not supported
                response = llm.invoke([SystemMessage(content=system_prompt), HumanMessage(content=user_prompt)])

            res_content = response.content.strip()
            # If the response is wrapped in ```json ... ```, strip it
            if "```json" in res_content:
                res_content = res_content.split("```json")[1].split("```")[0].strip()
            elif "```" in res_content:
                res_content = res_content.split("```")[1].split("```")[0].strip()

            res_data = json.loads(res_content)
            hints_map = {q["id"]: q["hints"] for q in res_data.get("questions", [])}
            concepts_map = {q["id"]: q.get("concepts", []) for q in res_data.get("questions", [])}

            # Inject hints and concepts back
            injected_count = 0
            for q in questions:
                q_id = q.get("id")
                if q_id in hints_map:
                    q["hints"] = hints_map[q_id]

                    concepts = concepts_map.get(q_id, [primary_concept])
                    if not concepts:
                        concepts = [primary_concept]
                    # Ensure primary concept is first
                    if primary_concept not in concepts:
                        concepts = [primary_concept] + concepts
                    else:
                        concepts.remove(primary_concept)
                        concepts = [primary_concept] + concepts

                    # Validate concepts are in the valid list
                    validated_concepts = [c for c in concepts if c in VALID_CONCEPTS]
                    if not validated_concepts:
                        validated_concepts = [primary_concept]

                    q["concepts"] = validated_concepts
                    injected_count += 1
                else:
                    print(f"  [WARN] Hints/concepts for question id {q_id} not found in LLM response.")
                    # fallback
                    q["hints"] = [
                        "Hãy đọc kỹ câu hỏi và suy nghĩ về chủ đề này.",
                        "Gợi ý 2: Tập trung phân tích các từ khóa chính.",
                        "Gợi ý 3: Đưa ra lựa chọn cẩn thận.",
                    ]
                    q["concepts"] = [primary_concept]

            print(f"  Successfully generated and injected {injected_count} question hints and concepts.")

            # Save updated file
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"  [ERROR] Failed during LLM call or parsing for {file_path.name}: {e}")

    print("\nConversion process completed!")


if __name__ == "__main__":
    main()
