import json
import logging

import requests
from langchain_core.messages import HumanMessage, SystemMessage

from src.config import get_settings
from src.services.llm import get_llm
from src.services.supabase_config import get_backend_supabase_config

logger = logging.getLogger(__name__)

# Fallback templates if settings.prompts is not fully populated
DEFAULT_QUIZ_PROMPT = """Bạn là chuyên gia thiết kế chương trình học và chuyên gia khảo thí theo Chương trình Giáo dục Phổ thông 2018 (CT GDPT 2018) của Việt Nam.
Hãy tạo ra đúng {num_questions} câu hỏi trắc nghiệm khách quan (MCQ) dựa TRÊN DUY NHẤT nội dung các trang slide bài giảng dưới đây.

Khái niệm mục tiêu: {concept_name} (Mã concept: {concept_code})
Mức độ nhận thức mục tiêu (Độ khó): {difficulty} (dễ: Nhận biết, bình thường: Thông hiểu, khó: Vận dụng/Vận dụng cao)

Nội dung slide bài giảng:
{slides_content}

Yêu cầu đối với mỗi câu hỏi MCQ:
1. Câu hỏi phải kiểm tra đúng chuẩn đầu ra năng lực của khái niệm mục tiêu, bám sát kiến thức thực tế được trình bày trong các trang slide.
2. Câu hỏi phải sử dụng ngôn ngữ Tiếng Việt chuẩn sư phạm, diễn đạt trong sáng, dễ hiểu, phù hợp với lứa tuổi học sinh phổ thông Việt Nam.
3. Cung cấp đúng 4 phương án lựa chọn: A, B, C, và D. Các phương án sai (distractors) phải là các lỗi tư duy hoặc hiểu lầm phổ biến mà học sinh Việt Nam thường mắc phải liên quan đến bài học.
4. Cung cấp lời giải thích chi tiết, thuyết phục tại sao phương án đúng là đúng, và tại sao các phương án khác lại sai, chỉ rõ căn cứ từ nội dung slide.
5. Ngôn ngữ câu hỏi, các lựa chọn và lời giải thích BẮT BUỘC phải viết hoàn toàn bằng Tiếng Việt.

Định dạng đầu ra là một mảng JSON hợp lệ gồm các đối tượng, trong đó mỗi đối tượng có các khóa sau (tên khóa giữ nguyên tiếng Anh để khớp hệ thống):
{{
  "prompt": "Nội dung câu hỏi bằng tiếng Việt...",
  "options": {{
    "A": "Nội dung phương án A...",
    "B": "Nội dung phương án B...",
    "C": "Nội dung phương án C...",
    "D": "Nội dung phương án D..."
  }},
  "correct_option": "A" | "B" | "C" | "D",
  "explanation": "Lời giải thích chi tiết bằng tiếng Việt..."
}}

Tuyệt đối không bao quanh đầu ra bằng các ký tự định dạng markdown (như ```json), chỉ trả về duy nhất chuỗi JSON thô."""

DEFAULT_HINT_PROMPT = """Bạn là một gia sư sư phạm theo phương pháp Socratic nhiệt tình và kiên nhẫn dành cho học sinh Việt Nam.
Dựa trên câu hỏi, các phương án lựa chọn, đáp án đúng và lời giải thích dưới đây, hãy xây dựng đúng 3 cấp độ gợi ý Socratic bằng Tiếng Việt để giúp học sinh tự tìm ra đáp án mà không trực tiếp làm hộ bài:

Câu hỏi: {question_text}
Các lựa chọn:
A) {option_A}
B) {option_B}
C) {option_C}
D) {option_D}
Đáp án đúng: {correct_option}
Giải thích: {explanation}

Yêu cầu đối với các cấp độ gợi ý (viết bằng Tiếng Việt ấm áp, dễ thương phù hợp lứa tuổi):
- Gợi ý Cấp 1 (Nhẹ): Hướng học sinh đến một khái niệm chung, sự liên tưởng thực tế hoặc quy tắc cơ bản trong slide để kích hoạt tư duy ban đầu. Không đề cập đến các phương án lựa chọn.
- Gợi ý Cấp 2 (Trung bình): Chỉ ra chi tiết cụ thể hoặc phần kiến thức/công thức nằm ở slide nào để học sinh biết nơi cần tra cứu lại.
- Gợi ý Cấp 3 (Sâu): Hướng dẫn học sinh phân tích loại trừ phương án nhiễu hoặc hướng dẫn từng bước lập luận nhỏ để học sinh tự tìm ra đáp án đúng. Tuyệt đối không được nói ra đáp án đúng là gì.

Định dạng đầu ra là một đối tượng JSON hợp lệ có các khóa sau:
{{
  "level1": "Nội dung gợi ý cấp 1...",
  "level2": "Nội dung gợi ý cấp 2...",
  "level3": "Nội dung gợi ý cấp 3..."
}}

Tuyệt đối không bao quanh đầu ra bằng các ký tự định dạng markdown (như ```json), chỉ trả về duy nhất chuỗi JSON thô."""


def clean_json_response(content: str) -> str:
    """Helper to remove markdown code blocks from LLM responses if present."""
    content = content.strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    return content.strip()


CRITIC_PROMPT = """Bạn là một chuyên gia khảo thí độc lập theo Chương trình Giáo dục Phổ thông 2018 của Việt Nam.
Nhiệm vụ của bạn là thẩm định độ khó thực tế của danh sách câu hỏi trắc nghiệm dưới đây.
Với mỗi câu hỏi, hãy phân tích kỹ yêu cầu tư duy của nó để giải và phân loại vào một trong ba mức độ nhận thức:
- "dễ" (Nhận biết): Học sinh chỉ cần nhớ lại kiến thức, nhận diện công thức, hoặc đọc trực tiếp từ slide.
- "bình thường" (Thông hiểu): Học sinh cần hiểu ý nghĩa khái niệm, thực hiện các phép biến đổi đơn giản, hoặc giải thích được hiện tượng.
- "khó" (Vận dụng): Học sinh cần liên kết nhiều khái niệm, giải quyết tình huống mới, hoặc thực hiện tính toán nhiều bước phức tạp.

Danh sách câu hỏi cần thẩm định:
{questions_formatted}

Định dạng đầu ra là một mảng JSON chứa chính xác mức độ khó dự đoán ("dễ", "bình thường", hoặc "khó") cho từng câu hỏi tương ứng theo đúng thứ tự.
Ví dụ:
[
  "dễ",
  "bình thường",
  "dễ",
  "khó"
]

Chỉ trả về duy nhất mảng JSON thô, không kèm định dạng markdown hay văn bản giải thích nào khác."""


def validate_option_balance(options: dict[str, str]) -> bool:
    """
    Validates option lengths with tolerance for math formulas and short values.
    Returns True if valid or if all options are short/math-based.
    Returns False if descriptive text options differ in length by > 50%.
    """
    import re
    if not isinstance(options, dict) or len(options) < 4:
        return False

    vals = [str(v).strip() for v in options.values()]

    # Identify math expressions or short option texts
    math_pattern = re.compile(r'[0-9+\-*/=<>\\\{\}\^_\$]')

    is_all_math_or_short = True
    lengths = []
    for val in vals:
        val_len = len(val)
        is_math = bool(math_pattern.search(val))
        is_short = val_len < 20
        if not (is_math or is_short):
            is_all_math_or_short = False
        lengths.append(val_len)

    if is_all_math_or_short:
        return True

    min_len = max(1, min(lengths))
    max_len = max(lengths)
    return (max_len / min_len) <= 1.5


def shuffle_single_question_options(q: dict) -> None:
    """Shuffles the options of a single question and updates correct_option accordingly."""
    import random
    options = q.get("options")
    correct = q.get("correct_option")
    if not options or not correct or correct not in options:
        return

    correct_text = options[correct]
    texts = list(options.values())
    random.shuffle(texts)

    keys = ["A", "B", "C", "D"]
    new_options = {}
    new_correct = None
    for k, text in zip(keys, texts):
        new_options[k] = text
        if text == correct_text:
            new_correct = k

    q["options"] = new_options
    q["correct_option"] = new_correct


def rebalance_and_shuffle_options(questions: list[dict]) -> list[dict]:
    """
    Shuffles options for each question and balances correct option (A, B, C, D) distribution
    to ensure no option is overrepresented (>40% of the total quiz set).
    """
    if not questions:
        return []

    # First shuffle options randomly for all questions
    for q in questions:
        shuffle_single_question_options(q)

    if len(questions) < 5:
        return questions

    max_allowed = max(2, int(len(questions) * 0.40))

    # Iteratively swap overrepresented correct answers to underrepresented keys
    for _ in range(100):
        counts = {"A": 0, "B": 0, "C": 0, "D": 0}
        for q in questions:
            correct = q.get("correct_option")
            if correct in counts:
                counts[correct] += 1

        overrepresented = [k for k, v in counts.items() if v > max_allowed]
        underrepresented = [k for k, v in counts.items() if v < max_allowed]

        if not overrepresented or not underrepresented:
            break

        source_key = overrepresented[0]
        target_key = underrepresented[0]

        # Find a question to swap correct_option from source_key to target_key
        swapped = False
        for q in questions:
            if q.get("correct_option") == source_key:
                options = q.get("options", {})
                if source_key in options and target_key in options:
                    options[source_key], options[target_key] = options[target_key], options[source_key]
                    q["correct_option"] = target_key
                    swapped = True
                    break
        if not swapped:
            break

    return questions


async def verify_batch_difficulty(questions: list[dict], target_difficulty: str) -> list[bool]:
    """
    Uses Critic Agent to assess the difficulty of a batch of questions.
    Returns a list of booleans representing whether each question fits within 1 cognitive level of the target difficulty.
    """
    if not questions:
        return []

    # Format questions for the Critic prompt
    questions_formatted = ""
    for idx, q in enumerate(questions):
        questions_formatted += f"--- Câu hỏi {idx + 1} ---\n"
        questions_formatted += f"Câu hỏi: {q.get('prompt')}\n"
        options = q.get("options", {}) or {}
        questions_formatted += "Các phương án:\n"
        for k, v in options.items():
            questions_formatted += f"  {k}. {v}\n"
        questions_formatted += f"Đáp án đúng: {q.get('correct_option')}\n"
        questions_formatted += f"Giải thích: {q.get('explanation')}\n\n"

    prompt = CRITIC_PROMPT.format(questions_formatted=questions_formatted)

    messages = [
        SystemMessage(content="You are an expert curriculum auditor who outputs raw JSON arrays of strings."),
        HumanMessage(content=prompt)
    ]

    try:
        llm = get_llm()
        resp = await llm.ainvoke(messages)
        content = clean_json_response(resp.content)
        classified = json.loads(content)

        if not isinstance(classified, list) or len(classified) != len(questions):
            logger.warning(
                f"Critic response size mismatch. Expected {len(questions)}, got {len(classified) if isinstance(classified, list) else type(classified)}"
            )
            return [True] * len(questions)

        difficulty_levels = {"dễ": 1, "bình thường": 2, "khó": 3}
        target_level = difficulty_levels.get(target_difficulty.lower(), 2)

        results = []
        for idx, item in enumerate(classified):
            pred = str(item).strip().lower()
            pred_level = difficulty_levels.get(pred, 2)
            passed = abs(pred_level - target_level) <= 1
            questions[idx]["critic_difficulty"] = pred
            results.append(passed)

        return results
    except Exception as e:
        logger.exception(f"Error in verify_batch_difficulty: {e}")
        return [True] * len(questions)


async def generate_quizzes_from_slides_task(
    document_name: str,
    num_questions: int,
    difficulty: str,
    socratic_hints: bool,
    concept_code: str,
    user_id: str | None = None,
    prompt_override: str | None = None,
    is_weakness_targeted: bool = False,
) -> None:
    """
    Background pipeline to generate quiz questions using OpenAI LLM based on slide contents.
    Stores generated questions in app.questions (as draft) and hints in app.question_hints.
    """
    logger.info(f"Starting quiz generation background task for document: {document_name}")
    try:
        settings = get_settings()
        config = get_backend_supabase_config(allow_stub=True)
        if config.is_stub:
            logger.error("Supabase is in stub mode. Cannot run real ingestion pipeline.")
            return

        supabase_url = config.url
        supabase_api_key = config.secret_key

        # 1. Fetch slide content from public.slide_embeddings
        slides_url = f"{supabase_url}/rest/v1/slide_embeddings"
        headers = {
            "apikey": supabase_api_key,
            "Authorization": f"Bearer {supabase_api_key}",
            "Accept": "application/json",
        }
        params = {
            "document_name": f"eq.{document_name}",
            "select": "slide_number,content",
            "order": "slide_number.asc",
        }
        resp = requests.get(slides_url, headers=headers, params=params)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch slides from DB: {resp.status_code} - {resp.text}")
            return

        slides = resp.json()
        if not slides:
            logger.error(f"No slides found for document: {document_name}")
            return

        logger.info(f"Fetched {len(slides)} slides for document: {document_name}")

        # Choose a subset of slides if there are too many (e.g. select up to 12 slides distributed evenly)
        max_slides = 12
        if len(slides) > max_slides:
            step = len(slides) / max_slides
            selected_slides = [slides[int(i * step)] for i in range(max_slides)]
        else:
            selected_slides = slides

        slides_content = "\n\n".join([f"--- Slide {s['slide_number']} ---\n{s['content']}" for s in selected_slides])

        # 2. Resolve concept_id and course_id from app.concepts
        concept_url = f"{supabase_url}/rest/v1/concepts"
        concept_headers = {
            "apikey": supabase_api_key,
            "Authorization": f"Bearer {supabase_api_key}",
            "Accept-Profile": "app",
        }
        concept_params = {
            "code": f"eq.{concept_code}",
            "select": "id,course_id,name",
        }
        concept_resp = requests.get(concept_url, headers=concept_headers, params=concept_params)

        concept_id = None
        course_id = None
        concept_name = concept_code

        if concept_resp.status_code == 200 and concept_resp.json():
            concept_data = concept_resp.json()[0]
            concept_id = concept_data["id"]
            course_id = concept_data["course_id"]
            concept_name = concept_data["name"]
        else:
            # Fallback: fetch any concept from the database
            fallback_params = {"select": "id,course_id,name", "limit": "1"}
            fallback_resp = requests.get(concept_url, headers=concept_headers, params=fallback_params)
            if fallback_resp.status_code == 200 and fallback_resp.json():
                fallback_data = fallback_resp.json()[0]
                concept_id = fallback_data["id"]
                course_id = fallback_data["course_id"]
                concept_name = fallback_data["name"]
                logger.warning(
                    f"Concept code '{concept_code}' not found. Fallback to concept: {concept_name} ({concept_id})"
                )

        if not concept_id or not course_id:
            logger.error("Could not resolve concept_id or course_id. Aborting quiz generation.")
            return

        # 3. Call LLM to generate questions with retry and validation logic
        llm = get_llm()
        if prompt_override:
            quiz_template = prompt_override
        else:
            quiz_template = (
                settings.prompts.generate_quizzes_from_slides
                if settings.prompts and settings.prompts.generate_quizzes_from_slides
                else DEFAULT_QUIZ_PROMPT
            )

        if is_weakness_targeted:
            weakness_instruction = "\n\nIMPORTANT: This concept is currently a learning gap / weakness for the student. Focus questions on clarifying common student misconceptions, providing extremely clear educational explanations, and helping the student bridge their knowledge gap through targeted Socratic hints.\n"
            quiz_template = quiz_template + weakness_instruction

        valid_questions = []
        retry_count = 0
        max_retries = 2

        while len(valid_questions) < num_questions and retry_count <= max_retries:
            needed = num_questions - len(valid_questions)
            logger.info(f"Attempting to generate {needed} questions (retry_count={retry_count})...")

            formatted_quiz_prompt = quiz_template.format(
                num_questions=needed,
                concept_name=concept_name,
                concept_code=concept_code,
                difficulty=difficulty,
                slides_content=slides_content,
            )

            messages = [
                SystemMessage(
                    content="You are an expert curriculum designer who outputs raw JSON arrays matching the requested schema."
                ),
                HumanMessage(content=formatted_quiz_prompt),
            ]

            logger.info("Calling LLM to generate questions...")
            llm_resp = await llm.ainvoke(messages)
            content_str = clean_json_response(llm_resp.content)

            try:
                candidates = json.loads(content_str)
            except Exception as e:
                logger.error(f"Failed to parse LLM output as JSON: {e}. Raw content: {content_str}")
                retry_count += 1
                continue

            if not isinstance(candidates, list):
                logger.error(f"LLM output is not a list. Received: {type(candidates)}")
                retry_count += 1
                continue

            # First filter candidates by validate_option_balance
            valid_candidates = []
            for c in candidates:
                if not c.get("prompt") or not c.get("options") or not c.get("correct_option"):
                    continue

                c["option_balance_passed"] = validate_option_balance(c.get("options"))
                if c["option_balance_passed"]:
                    valid_candidates.append(c)
                else:
                    logger.info(f"Question failed option length balance validation: {c.get('prompt')}")

            if not valid_candidates:
                logger.info("No candidates passed option balance validation in this batch.")
                retry_count += 1
                continue

            # Run batch difficulty verification on candidates that passed option balance
            passed_difficulty = await verify_batch_difficulty(valid_candidates, difficulty)

            for c, passed in zip(valid_candidates, passed_difficulty):
                c["retry_count"] = retry_count
                if passed:
                    valid_questions.append(c)
                    if len(valid_questions) >= num_questions:
                        break
                else:
                    logger.info(f"Question failed Critic difficulty check: {c.get('prompt')} (predicted: {c.get('critic_difficulty')})")

            retry_count += 1

        if not valid_questions:
            logger.error("Failed to generate any valid questions after max retries.")
            return

        valid_questions = valid_questions[:num_questions]

        # Apply option rebalancing and shuffling
        valid_questions = rebalance_and_shuffle_options(valid_questions)

        # Mapping of difficulty input to ELO value
        difficulty_elo_map = {"dễ": 1050.0, "bình thường": 1200.0, "khó": 1350.0}
        target_elo = difficulty_elo_map.get(difficulty.lower(), 1200.0)

        # 4. Insert each question and (optionally) its hints into the database
        questions_insert_url = f"{supabase_url}/rest/v1/questions"
        hints_insert_url = f"{supabase_url}/rest/v1/question_hints"

        app_headers = {
            "apikey": supabase_api_key,
            "Authorization": f"Bearer {supabase_api_key}",
            "Content-Type": "application/json",
            "Accept-Profile": "app",
            "Content-Profile": "app",
            "Prefer": "return=representation",
        }

        hint_template = (
            settings.prompts.generate_socratic_hints
            if settings.prompts and settings.prompts.generate_socratic_hints
            else DEFAULT_HINT_PROMPT
        )

        for idx, q_data in enumerate(valid_questions):
            logger.info(f"Processing question {idx + 1}/{len(valid_questions)}...")
            prompt = q_data.get("prompt")
            options = q_data.get("options")
            correct_option = q_data.get("correct_option")
            explanation = q_data.get("explanation")

            validation_metadata = {
                "critic_difficulty": q_data.get("critic_difficulty"),
                "option_balance_passed": q_data.get("option_balance_passed", True),
                "retry_count": q_data.get("retry_count", 0),
            }

            # Construct answer_key payload matching database schema expectations
            answer_key = {"options": options, "correct": correct_option, "explanation": explanation}

            question_payload = {
                "course_id": course_id,
                "concept_id": concept_id,
                "type": "mcq",
                "prompt": prompt,
                "answer_key": answer_key,
                "difficulty_elo": target_elo,
                "calibration_status": "draft",
                "source_document_name": document_name,
                "validation_metadata": validation_metadata,
            }
            if user_id:
                question_payload["created_by"] = user_id

            # Insert question
            q_resp = requests.post(questions_insert_url, headers=app_headers, json=question_payload)
            if q_resp.status_code not in [200, 201]:
                logger.error(f"Failed to insert question: {q_resp.status_code} - {q_resp.text}")
                continue

            inserted_question = q_resp.json()[0]
            question_id = inserted_question["id"]

            logger.info(f"Inserted question successfully. ID: {question_id}")

            # 5. Generate hints if requested
            if socratic_hints:
                logger.info(f"Generating Socratic hints for question: {question_id}")
                formatted_hint_prompt = hint_template.format(
                    question_text=prompt,
                    option_A=options.get("A", ""),
                    option_B=options.get("B", ""),
                    option_C=options.get("C", ""),
                    option_D=options.get("D", ""),
                    correct_option=correct_option,
                    explanation=explanation or "",
                )

                hint_messages = [
                    SystemMessage(
                        content="You are an expert Socratic tutor who outputs raw JSON objects matching the requested schema."
                    ),
                    HumanMessage(content=formatted_hint_prompt),
                ]

                hint_resp = await llm.ainvoke(hint_messages)
                hint_str = clean_json_response(hint_resp.content)

                try:
                    hints_json = json.loads(hint_str)

                    # Insert 3 levels of hints
                    hints_payload = [
                        {
                            "question_id": question_id,
                            "level": 1,
                            "hint_text": hints_json.get(
                                "level1", f"Xem lại khái niệm trong slide liên quan đến {concept_name}."
                            ),
                        },
                        {
                            "question_id": question_id,
                            "level": 2,
                            "hint_text": hints_json.get("level2", "Hãy xem kỹ tài liệu của phần này."),
                        },
                        {
                            "question_id": question_id,
                            "level": 3,
                            "hint_text": hints_json.get(
                                "level3", "Hãy cân nhắc việc loại bỏ các lựa chọn không hợp lý dựa trên logic."
                            ),
                        },
                    ]

                    h_resp = requests.post(hints_insert_url, headers=app_headers, json=hints_payload)
                    if h_resp.status_code not in [200, 201]:
                        logger.error(
                            f"Failed to insert hints for question {question_id}: {h_resp.status_code} - {h_resp.text}"
                        )
                    else:
                        logger.info(f"Successfully generated and inserted 3 Socratic hints for question {question_id}.")

                except Exception as e:
                    logger.error(f"Failed to parse hints JSON or insert hints: {e}. Raw hints content: {hint_str}")

        logger.info(f"Finished quiz generation pipeline for document: {document_name}")
    except Exception as e:
        logger.exception(f"Unhandled error in generate_quizzes_from_slides_task: {e}")

