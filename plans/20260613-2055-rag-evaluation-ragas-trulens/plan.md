# Plan: RAG Evaluation (Ragas/TruLens) and Monitoring (Langfuse/Langsmith)

This plan outlines the design and implementation steps for evaluating the Socratic AI Tutor RAG pipeline using Ragas and TruLens across 4 evaluation tiers, and configuring real-time observability using Langfuse and Langsmith.

## Context & Requirements

1.  **4-Tier Evaluation Framework**:
    *   **Tier 1: Quality (Model Performance)**: Integrate Ragas/TruLens to measure core RAG metrics: Faithfulness (hallucination check), Answer Relevance, Context Recall, and Context Precision.
    *   **Tier 2: Automated Heuristic**: Define deterministic rules to filter outputs (e.g., response length, citation format validation, regex to check if direct solutions/code are leaked).
    *   **Tier 3: LLM as a Judge**: Implement a strong LLM (GPT-4o/Gemini) with custom prompt templates to score the "Socratic depth" and pedagogical tone of responses.
    *   **Tier 4: User Signal & Outcome**: Store user feedback (Helpful/Unhelpful click rates) and connect them to student learning outcomes (Elo/BKT mastery changes after tutoring).
2.  **Real-Time Monitoring & Observability**:
    *   Integrate **Langfuse** or **Langsmith** SDK to trace LLM calls, calculate exact token usage, analyze latency bottlenecks, and capture step-by-step agent execution trees in LangGraph.

## Proposed Submodules

1.  `src/services/eval/base.py`: Abstractions for RAG evaluation.
2.  `src/services/eval/ragas_eval.py`: Ragas integration for offline evaluation on a Golden Dataset.
3.  `src/services/eval/trulens_eval.py`: TruLens recorder configuration for feedback loops.
4.  `src/services/eval/heuristics.py`: Rule-based checks (length, citation format, direct code block detectors).
5.  `src/services/eval/llm_judge.py`: Socratic tone scoring using LLM-as-a-judge.
6.  `src/core/monitoring.py`: Initializer and setup helper for Langfuse & Langsmith tracing.
7.  `src/api/routes/feedback.py`: Endpoint to save student helpful/unhelpful signals and error reports to Supabase.

## Implementation Steps

1.  **Dependencies & Environment**:
    *   Add `ragas`, `trulens-eval`, `langfuse`, `langsmith` to `requirements.txt`.
    *   Add API keys and project settings in `.env.example`.
2.  **Build Core Monitoring**:
    *   Create `src/core/monitoring.py` to auto-detect and configure Langfuse/Langsmith environment variables.
    *   Decorate/wrap LangGraph agent execution and FastAPI routes to enable tracing.
3.  **Implement Heuristics & LLM Judge**:
    *   Write validator rules in `heuristics.py` to check citation structure and deny direct code replies.
    *   Write LLM-as-a-judge prompt in `llm_judge.py` to classify answers (Socratic, Direct Answer, Off-scope).
4.  **Integrate Ragas & TruLens**:
    *   Build a script `eval_rag_pipeline.py` under `scripts/` to run offline tests using Ragas metrics on a predefined test dataset of 50 student questions.
    *   Add TruLens feedback functions for real-time observability.
5.  **Verify & Test**:
    *   Verify that traces are correctly sent to Langfuse/Langsmith dashboard.
    *   Run offline evaluation and output a quality scorecard (CSV/Markdown).

## Open Questions

- **Đầu việc ưu tiên**: Nhóm phát triển muốn ưu tiên xây dựng bộ công cụ đánh giá offline với Ragas trước (chạy script kiểm định trên Golden Dataset) hay tích hợp trực tiếp TruLens recorder vào luồng chạy runtime để giám sát thời gian thực?

## Standardized Logging Schema (3-Tier Validation)

Every log entry emitted by the services must be structured and validated using a unified Pydantic model before being logged. This prevents dashboard build failures due to schema drift.

### Pydantic Validation Model:

```python
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any

class UnifiedServiceLog(BaseModel):
    # Tier 1: Required
    ts: str = Field(..., description="Timestamp in ISO 8601 format (e.g., YYYY-MM-DDTHH:MM:SSZ)")
    level: str = Field(..., description="INFO, WARN, or ERROR")
    correlation_id: str = Field(..., description="Unique trace/correlation ID for request matching")
    service_name: str = Field(..., description="Name of the service (e.g., 'rag-eval-service', 'semantic-cache')")
    event_type: str = Field(..., description="Name of the event (e.g., 'rag_query', 'cache_lookup', 'error')")

    # Tier 2: Context (Optional/When applicable)
    user_id: Optional[str] = Field(None, description="Hashed student/user ID for privacy compliance")
    session_id: Optional[str] = Field(None, description="Active chat/quiz session ID")
    feature: Optional[str] = Field(None, description="Active feature area (e.g., 'socratic_chat', 'quiz')")
    model: Optional[str] = Field(None, description="Active LLM model used (e.g., 'gpt-4o', 'gemini-1.5')")
    env: Optional[str] = Field(None, description="Running environment (development, staging, production)")

    # Tier 3: Payload (Event-specific metrics)
    payload: Dict[str, Any] = Field(
        default_factory=dict,
        description="Event-specific metrics, containing: latency_ms, tokens_in, tokens_out, cost_usd, error_type, tool_name"
    )
```


