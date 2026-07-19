import asyncio
import os
import sys
import io
import json
import logging
import argparse
import requests
from pathlib import Path

# Fix output encoding for non-ASCII characters in terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add project root to python path
project_root = Path(__file__).resolve().parent.parent
sys.path.append(str(project_root))

from langchain_core.messages import HumanMessage, SystemMessage
from src.config import get_settings
from src.services.llm import get_llm
from src.services.rag import RAGService
from src.services.supabase_config import get_backend_supabase_config
from src.services.quiz_generator import clean_json_response, DEFAULT_QUIZ_PROMPT, DEFAULT_HINT_PROMPT

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

async def test_or_generate_quizzes(test_mode=False, single_concept_code=None):
    settings = get_settings()
    config = get_backend_supabase_config()
    if config.is_stub:
        logger.error("Supabase is in stub mode. Cannot run pipeline.")
        return

    supabase_url = config.url
    supabase_api_key = config.secret_key

    # Fetch active concepts for course_id = 'cf76850d-0738-50c3-bf34-1c464fa3b4d3' (math-k6)
    concepts_url = f"{supabase_url}/rest/v1/concepts"
    concept_headers = {
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Accept-Profile": "app",
    }
    
    params = {
        "course_id": "eq.cf76850d-0738-50c3-bf34-1c464fa3b4d3",
        "status": "eq.active",
        "select": "id,course_id,code,name,curriculum_chapter,curriculum_order",
        "order": "curriculum_chapter.asc,curriculum_order.asc"
    }
    
    if single_concept_code:
        params["code"] = f"eq.{single_concept_code}"
    
    resp = requests.get(concepts_url, headers=concept_headers, params=params)
    if resp.status_code != 200:
        logger.error(f"Failed to fetch concepts: {resp.status_code} - {resp.text}")
        return

    all_concepts = resp.json()
    # Filter only concepts that have curriculum_chapter
    math_concepts = [c for c in all_concepts if c.get("curriculum_chapter") is not None]
    
    if not math_concepts:
        logger.error("No active Math concepts found in the database.")
        return

    if test_mode:
        # Run only for the very first concept
        math_concepts = [math_concepts[0]]
        logger.info(f"Running in TEST mode. Selected concept: {math_concepts[0]['name']} ({math_concepts[0]['code']})")
    else:
        logger.info(f"Loaded {len(math_concepts)} Math concepts to process.")

    rag = RAGService()
    llm = get_llm()

    # RAG scope id for math
    p_rag_scope_id = "4802fcfb-2e37-401c-9de0-0360bf2fa535"
    
    # API Endpoints
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

    difficulty_elo_map = {
        "dễ": 1050.0,
        "bình thường": 1200.0,
        "khó": 1350.0
    }

    # Templates
    quiz_template = (
        settings.prompts.generate_quizzes_from_slides
        if settings.prompts and settings.prompts.generate_quizzes_from_slides
        else DEFAULT_QUIZ_PROMPT
    )
    
    hint_template = (
        settings.prompts.generate_socratic_hints
        if settings.prompts and settings.prompts.generate_socratic_hints
        else DEFAULT_HINT_PROMPT
    )

    # Fetch concepts that already have questions generated from sgk-toan-6 to skip them
    existing_qs_url = f"{supabase_url}/rest/v1/questions"
    existing_qs_params = {
        "source_document_name": "eq.sgk-toan-6",
        "select": "concept_id",
    }
    existing_resp = requests.get(existing_qs_url, headers={
        "apikey": supabase_api_key,
        "Authorization": f"Bearer {supabase_api_key}",
        "Accept-Profile": "app",
    }, params=existing_qs_params)
    
    already_done_concept_ids = set()
    if existing_resp.status_code == 200:
        already_done_concept_ids = {q["concept_id"] for q in existing_resp.json()}
        logger.info(f"Skipping {len(already_done_concept_ids)} concepts already having questions.")

    total = len(math_concepts)
    skipped = 0
    processed = 0
    failed = 0

    for i, concept in enumerate(math_concepts):
        concept_id = concept["id"]
        concept_code = concept["code"]
        concept_name = concept["name"]

        # Skip concepts that already have questions generated
        if concept_id in already_done_concept_ids:
            logger.info(f"[{i+1}/{total}] SKIP (already has questions): {concept_name}")
            skipped += 1
            continue

        logger.info(f"[{i+1}/{total}] === Processing Concept: {concept_name} (Code: {concept_code}) ===")

        # 1. RAG Search
        logger.info("Performing vector search on app.material_chunks...")
        emb = await rag._get_query_embedding(concept_name)
        
        rpc_url = f"{supabase_url}/rest/v1/rpc/match_material_chunks"
        rpc_headers = {
            "apikey": supabase_api_key,
            "Authorization": f"Bearer {supabase_api_key}",
            "Content-Type": "application/json",
            "Accept-Profile": "app",
            "Content-Profile": "app",
        }
        payload = {
            "query_embedding": emb,
            "p_rag_scope_id": p_rag_scope_id,
            "match_threshold": 0.1,
            "match_count": 8
        }
        
        rpc_resp = requests.post(rpc_url, headers=rpc_headers, json=payload)
        if rpc_resp.status_code != 200:
            logger.error(f"Vector search failed: {rpc_resp.status_code} - {rpc_resp.text}")
            continue
            
        chunks = rpc_resp.json()
        if not chunks:
            logger.warning(f"No RAG chunks found for concept: {concept_name}. Skipping.")
            continue
            
        logger.info(f"Found {len(chunks)} relevant chunks.")
        slides_content = "\n\n".join([f"--- Chunk Page {c['page_number']} ---\n{c['content']}" for c in chunks])

        # 2. Loop through difficulties
        for difficulty, target_elo in difficulty_elo_map.items():
            num_questions = 10
            # For test mode, generate fewer questions to save API quota
            if test_mode:
                num_questions = 3 # Generate 3 questions per difficulty level for quick validation
                
            logger.info(f"Generating {num_questions} questions for difficulty: {difficulty} (Elo: {target_elo})...")
            
            vietnamese_instruction = (
                "\n\nCRITICAL REQUIREMENT: The prompt, options, and explanation MUST be written entirely in Vietnamese. "
                "The questions should match the grade 6 level and tone. DO NOT use English."
            )
            
            formatted_quiz_prompt = quiz_template.format(
                num_questions=num_questions,
                concept_name=concept_name,
                concept_code=concept_code,
                difficulty=difficulty,
                slides_content=slides_content,
            ) + vietnamese_instruction

            messages = [
                SystemMessage(
                    content="You are an expert curriculum designer who outputs raw JSON arrays matching the requested schema."
                ),
                HumanMessage(content=formatted_quiz_prompt),
            ]

            llm_resp = await llm.ainvoke(messages)
            content_str = clean_json_response(llm_resp.content)

            try:
                questions_json = json.loads(content_str)
            except Exception as e:
                logger.error(f"Failed to parse LLM output as JSON: {e}. Raw content: {content_str}")
                continue

            if not isinstance(questions_json, list):
                logger.error(f"LLM output is not a list. Received: {type(questions_json)}")
                continue

            logger.info(f"Successfully generated {len(questions_json)} questions.")

            # 3. Insert questions & generate Socratic hints
            for idx, q_data in enumerate(questions_json):
                prompt = q_data.get("prompt")
                options = q_data.get("options")
                correct_option = q_data.get("correct_option")
                explanation = q_data.get("explanation")

                if not prompt or not options or not correct_option:
                    logger.warning(f"Skipping invalid question structure: {q_data}")
                    continue

                answer_key = {"options": options, "correct": correct_option, "explanation": explanation}

                question_payload = {
                    "course_id": concept["course_id"],
                    "concept_id": concept_id,
                    "type": "mcq",
                    "prompt": prompt,
                    "answer_key": answer_key,
                    "difficulty_elo": target_elo,
                    "calibration_status": "published", # Set directly to published
                    "source_document_name": "sgk-toan-6",
                }

                q_resp = requests.post(questions_insert_url, headers=app_headers, json=question_payload)
                if q_resp.status_code not in [200, 201]:
                    logger.error(f"Failed to insert question: {q_resp.status_code} - {q_resp.text}")
                    continue

                inserted_question = q_resp.json()[0]
                question_id = inserted_question["id"]

                logger.info(f"Inserted question [{idx+1}/{len(questions_json)}] successfully. ID: {question_id}")

                # 4. Generate Hints
                logger.info(f"Generating Socratic hints for question ID: {question_id}...")
                formatted_hint_prompt = hint_template.format(
                    question_text=prompt,
                    option_A=options.get("A", ""),
                    option_B=options.get("B", ""),
                    option_C=options.get("C", ""),
                    option_D=options.get("D", ""),
                    correct_option=correct_option,
                    explanation=explanation or "",
                ) + "\n\nCRITICAL REQUIREMENT: The hint text for level1, level2, and level3 MUST be written entirely in Vietnamese. Keep the Socratic style."

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
                    hints_payload = [
                        {
                            "question_id": question_id,
                            "level": 1,
                            "hint_text": hints_json.get(
                                "level1", f"Xem lại khái niệm liên quan đến {concept_name}."
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
                        logger.error(f"Failed to insert hints: {h_resp.status_code} - {h_resp.text}")
                    else:
                        logger.info(f"Successfully generated and inserted 3 Socratic hints for question {question_id}.")
                except Exception as e:
                    logger.error(f"Failed to parse hints JSON: {e}. Raw content: {hint_str}")

        processed += 1
        logger.info(f"[{i+1}/{total}] ✓ Done concept: {concept_name} | Processed: {processed} | Skipped: {skipped}")

    logger.info("=" * 60)
    logger.info(f"FINISHED. Total: {total} | Processed: {processed} | Skipped: {skipped} | Failed: {failed}")
    logger.info(f"Questions created: ~{processed * 30} (10 per difficulty × 3 difficulties)")
    logger.info("=" * 60)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Math Quiz Questions")
    parser.add_argument("--test", action="store_true", help="Run in test mode for the first concept only with 3 questions per difficulty")
    parser.add_argument("--concept", type=str, help="Run for a specific concept code only")
    args = parser.parse_args()

    asyncio.run(test_or_generate_quizzes(test_mode=args.test, single_concept_code=args.concept))
