import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from src.services.quiz_generator import (
    generate_quizzes_from_slides_task,
    rebalance_and_shuffle_options,
    validate_option_balance,
    verify_batch_difficulty,
)


# 1. Test validate_option_balance
def test_validate_option_balance_math_and_short():
    # Math expressions should always pass option validation
    math_options = {
        "A": "1",
        "B": "2",
        "C": "100",
        "D": "5",
    }
    assert validate_option_balance(math_options) is True

    # LaTeX formulas should always pass
    latex_options = {
        "A": "\\frac{1}{2}",
        "B": "\\frac{3}{4}",
        "C": "\\frac{5}{6}",
        "D": "\\frac{7}{8}",
    }
    assert validate_option_balance(latex_options) is True

    # Very short option texts should always pass
    short_options = {
        "A": "A. Phân số",
        "B": "B. Số tự nhiên",
        "C": "C. Số nguyên âm",
        "D": "D. Số nguyên dương",
    }
    assert validate_option_balance(short_options) is True


def test_validate_option_balance_descriptive_text():
    # Balanced text options (max_len / min_len <= 1.5)
    balanced_options = {
        "A": "Đây là phương án đầu tiên của câu hỏi.",
        "B": "Đây là phương án thứ hai trong số bốn.",
        "C": "Đây là phương án thứ ba của câu hỏi này.",
        "D": "Đây là phương án cuối cùng trong bài này.",
    }
    # Lengths: A: 39, B: 37, C: 40, D: 41. max=41, min=37. 41/37 = 1.1 <= 1.5
    assert validate_option_balance(balanced_options) is True

    # Imbalanced text options (max_len / min_len > 1.5)
    imbalanced_options = {
        "A": "Đây là phương án đầu tiên của câu hỏi.",
        "B": "Đây là phương án thứ hai trong số bốn.",
        "C": "Đây là phương án siêu siêu siêu siêu siêu siêu dài và chi tiết so với các phương án còn lại trong câu.",
        "D": "Đây là phương án cuối cùng trong bài này.",
    }
    # Lengths: A: 39, B: 37, C: 104, D: 41. max=104, min=37. 104/37 = 2.8 > 1.5
    assert validate_option_balance(imbalanced_options) is False


# 2. Test rebalance_and_shuffle_options
def test_rebalance_and_shuffle_options():
    questions = [
        {"prompt": "Q1", "options": {"A": "ans1", "B": "w1", "C": "w2", "D": "w3"}, "correct_option": "A"},
        {"prompt": "Q2", "options": {"A": "ans2", "B": "w1", "C": "w2", "D": "w3"}, "correct_option": "A"},
        {"prompt": "Q3", "options": {"A": "ans3", "B": "w1", "C": "w2", "D": "w3"}, "correct_option": "A"},
        {"prompt": "Q4", "options": {"A": "ans4", "B": "w1", "C": "w2", "D": "w3"}, "correct_option": "A"},
        {"prompt": "Q5", "options": {"A": "ans5", "B": "w1", "C": "w2", "D": "w3"}, "correct_option": "A"},
    ]

    # Save original correct answers mapped by prompt to verify text remains consistent
    correct_texts = {q["prompt"]: q["options"][q["correct_option"]] for q in questions}

    balanced = rebalance_and_shuffle_options(questions)

    # Count correct option frequencies
    counts = {"A": 0, "B": 0, "C": 0, "D": 0}
    for q in balanced:
        correct = q["correct_option"]
        counts[correct] += 1
        # Verify the correct text matches what it was originally
        assert q["options"][correct] == correct_texts[q["prompt"]]

    # Max allowed count should be 2 (5 * 0.4 = 2)
    for k, v in counts.items():
        assert v <= 2


# 3. Test verify_batch_difficulty
@pytest.mark.asyncio
@patch("src.services.quiz_generator.get_llm")
async def test_verify_batch_difficulty(mock_get_llm):
    # Mock LLM output
    mock_llm_instance = AsyncMock()
    mock_llm_instance.ainvoke.return_value = MagicMock(content='["dễ", "bình thường", "khó"]')
    mock_get_llm.return_value = mock_llm_instance

    questions = [
        {"prompt": "Q1", "options": {"A": "1"}, "correct_option": "A", "explanation": "E1"},
        {"prompt": "Q2", "options": {"A": "2"}, "correct_option": "A", "explanation": "E2"},
        {"prompt": "Q3", "options": {"A": "3"}, "correct_option": "A", "explanation": "E3"},
    ]

    # Target difficulty is "bình thường"
    # Predictions: "dễ" (level 1), "bình thường" (level 2), "khó" (level 3)
    # Target level: 2
    # All deviations are <= 1, so all should pass
    results = await verify_batch_difficulty(questions, "bình thường")
    assert results == [True, True, True]

    # Target difficulty is "dễ" (level 1)
    # Predictions: "dễ" (level 1, diff 0), "bình thường" (level 2, diff 1), "khó" (level 3, diff 2)
    # Results should be [True, True, False]
    results_easy = await verify_batch_difficulty(questions, "dễ")
    assert results_easy == [True, True, False]


# 4. Test generate_quizzes_from_slides_task retry and success flow
@pytest.mark.asyncio
@patch("src.services.quiz_generator.get_llm")
@patch("requests.post")
@patch("requests.get")
async def test_generate_quizzes_task_flow(mock_get, mock_post, mock_get_llm, monkeypatch):
    # Mock supabase config to bypass stub mode check
    monkeypatch.setattr(
        "src.services.quiz_generator.get_backend_supabase_config",
        lambda allow_stub=True: MagicMock(url="https://fake.supabase.co", secret_key="fake-key", is_stub=False),
    )

    # Mock slides fetch response
    slides_resp = MagicMock()
    slides_resp.status_code = 200
    slides_resp.json.return_value = [{"slide_number": 1, "content": "Nội dung slide 1 về phân số."}]

    # Mock concepts fetch response
    concept_resp = MagicMock()
    concept_resp.status_code = 200
    concept_resp.json.return_value = [{"id": "concept-123", "course_id": "course-456", "name": "Phân Số Học"}]

    # Setup get requests mock side_effect
    def get_side_effect(url, *args, **kwargs):
        if "slide_embeddings" in url:
            return slides_resp
        if "concepts" in url:
            return concept_resp
        return MagicMock(status_code=404)

    mock_get.side_effect = get_side_effect

    # Mock LLM instance for question generation and Critic verification
    mock_llm_instance = AsyncMock()

    # We mock three sequential calls:
    # 1. Question generation attempt 1: yields 2 questions, one fails validate_option_balance, one fails Critic check.
    # 2. Question generation attempt 2 (retry): yields 2 questions, both pass all checks.
    # 3. Socratic Hints generation (1 call for each of the 2 final selected questions = 2 calls)
    q_gen_resp_1 = MagicMock(
        content=json.dumps(
            [
                {
                    "prompt": "Q1 (Will fail option balance)",
                    "options": {
                        "A": "Ngắn",
                        "B": "Rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất rất dài",
                        "C": "Ngắn nữa",
                        "D": "Ngắn tiếp",
                    },
                    "correct_option": "A",
                    "explanation": "Exp",
                },
                {
                    "prompt": "Q2 (Will fail Critic check)",
                    "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                    "correct_option": "B",
                    "explanation": "Exp",
                },
            ]
        )
    )

    q_gen_resp_2 = MagicMock(
        content=json.dumps(
            [
                {
                    "prompt": "Q3 (Will pass)",
                    "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                    "correct_option": "C",
                    "explanation": "Exp",
                },
                {
                    "prompt": "Q4 (Will pass)",
                    "options": {"A": "1", "B": "2", "C": "3", "D": "4"},
                    "correct_option": "D",
                    "explanation": "Exp",
                },
            ]
        )
    )

    critic_resp_1 = MagicMock(content='["khó"]')  # For Q2 (target: dễ -> diff 2 -> fails)
    critic_resp_2 = MagicMock(content='["dễ", "dễ"]')  # For Q3, Q4 (target: dễ -> passes)
    hint_resp = MagicMock(content=json.dumps({"level1": "H1", "level2": "H2", "level3": "H3"}))

    mock_llm_instance.ainvoke.side_effect = [
        q_gen_resp_1,  # Gen attempt 1
        critic_resp_1,  # Critic verify attempt 1 (only runs on Q2 since Q1 failed option balance)
        q_gen_resp_2,  # Gen attempt 2 (retry)
        critic_resp_2,  # Critic verify attempt 2 (runs on Q3, Q4)
        hint_resp,  # Hint for question 1
        hint_resp,  # Hint for question 2
    ]
    mock_get_llm.return_value = mock_llm_instance

    # Mock DB insertion responses
    post_resp = MagicMock()
    post_resp.status_code = 201
    post_resp.json.return_value = [{"id": "inserted-q-uuid"}]
    mock_post.return_value = post_resp

    # Execute background task requesting 2 questions
    await generate_quizzes_from_slides_task(
        document_name="sach-toan.pdf",
        num_questions=2,
        difficulty="dễ",
        socratic_hints=True,
        concept_code="phan-so",
        user_id="user-999",
    )

    # Let's verify DB posts
    # Should have post to app.questions 2 times, and post to app.question_hints 2 times
    assert mock_post.call_count == 4

    # Let's inspect the payload sent to app.questions
    inserted_questions_payloads = [
        call.kwargs["json"] for call in mock_post.call_args_list if "questions" in call.args[0]
    ]
    assert len(inserted_questions_payloads) == 2

    # Check validation metadata values
    for q_payload in inserted_questions_payloads:
        val_meta = q_payload["validation_metadata"]
        assert val_meta["option_balance_passed"] is True
        assert val_meta["critic_difficulty"] == "dễ"
        # Since it succeeded in retry attempt 1 (which has retry_count=1)
        assert val_meta["retry_count"] == 1
