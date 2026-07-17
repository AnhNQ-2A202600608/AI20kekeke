import json
import logging

import requests
from langchain_core.messages import HumanMessage, SystemMessage

from src.config import get_settings
from src.services.llm import get_llm
from src.services.supabase_config import get_backend_supabase_config

logger = logging.getLogger(__name__)

# Fallback templates if settings.prompts is not fully populated
DEFAULT_QUIZ_PROMPT = """You are an expert curriculum designer at VinUniversity.
Generate exactly {num_questions} multiple-choice questions (MCQs) based ONLY on the provided slide contents below.

Target Concept: {concept_name} (Code: {concept_code})
Target Difficulty: {difficulty}

Slide Contents:
{slides_content}

Requirements for each MCQ:
1. The question must test understanding of key concepts in the slides.
2. Provide exactly 4 options: A, B, C, and D.
3. The distractors (incorrect options) must be realistic and representative of common student misconceptions.
4. Provide a clear explanation for why the correct option is correct and why other options are incorrect.

Format your output as a valid JSON array of objects, where each object has the following keys:
{{
  "prompt": "The question text...",
  "options": {{
    "A": "Option A...",
    "B": "Option B...",
    "C": "Option C...",
    "D": "Option D..."
  }},
  "correct_option": "A" | "B" | "C" | "D",
  "explanation": "Detailed explanation..."
}}

Do not include any markdown formatting wrappers (like ```json) in your raw output, output ONLY the raw JSON string."""

DEFAULT_HINT_PROMPT = """You are an expert tutor using the Socratic method.
Given the following question, options, correct answer, and explanation, generate exactly 3 levels of Socratic hints to help the student solve it.

Question: {question_text}
Options:
A) {option_A}
B) {option_B}
C) {option_C}
D) {option_D}
Correct Option: {correct_option}
Explanation: {explanation}

Requirements for hints:
- Level 1 (Light): Point to a general concept, analogy, or real-world example to guide initial thinking. Do not reference options.
- Level 2 (Medium): Point to specific slide context, formula, or detail. Suggest where to look.
- Level 3 (Deep): Guide the student through the step-by-step logic, helping them eliminate options or reason about the solution without giving the answer away.

Format your output as a valid JSON object with the following keys:
{{
  "level1": "Level 1 hint text...",
  "level2": "Level 2 hint text...",
  "level3": "Level 3 hint text..."
}}

Do not include any markdown formatting wrappers (like ```json) in your raw output, output ONLY the raw JSON string."""


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


async def generate_quizzes_from_slides_task(
    document_name: str,
    num_questions: int,
    difficulty: str,
    socratic_hints: bool,
    concept_code: str,
    user_id: str | None = None,
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

        # 3. Call LLM to generate questions
        llm = get_llm()
        quiz_template = (
            settings.prompts.generate_quizzes_from_slides
            if settings.prompts and settings.prompts.generate_quizzes_from_slides
            else DEFAULT_QUIZ_PROMPT
        )

        formatted_quiz_prompt = quiz_template.format(
            num_questions=num_questions,
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
            questions_json = json.loads(content_str)
        except Exception as e:
            logger.error(f"Failed to parse LLM output as JSON: {e}. Raw content: {content_str}")
            return

        if not isinstance(questions_json, list):
            logger.error(f"LLM output is not a list. Received: {type(questions_json)}")
            return

        logger.info(f"LLM successfully generated {len(questions_json)} question candidates.")

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

        for idx, q_data in enumerate(questions_json):
            logger.info(f"Processing question {idx + 1}/{len(questions_json)}...")
            prompt = q_data.get("prompt")
            options = q_data.get("options")
            correct_option = q_data.get("correct_option")
            explanation = q_data.get("explanation")

            if not prompt or not options or not correct_option:
                logger.warning(f"Skipping invalid question structure: {q_data}")
                continue

            # Construct answer_key payload matching database schema expectations
            # answer_key format is: {"options": {"A": ..., "B": ...}, "correct": "A", "explanation": "..."}
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
