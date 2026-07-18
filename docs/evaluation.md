# Mentora Evaluation Evidence

This document is the Demo Day evaluation entry point. It summarizes test results, RAGAS-equivalent quality checks, performance metrics, user feedback evidence, and traceability from test cases to product features.

## Evaluation Checklist

| Checklist Item | Evidence | Status |
|---|---|---|
| Pytest output + coverage | `eval/results/chatbot_evidence/pytest-chatbot-coverage-utf8.txt`, `coverage-chatbot.json`, `htmlcov/` | Ready |
| RAGAS metrics or self-evaluation | `outputs/ragas_eval_report.md`, `ragas_metrics_summary.csv` | Ready |
| Performance metrics | `latency_summary.csv`, `plans/20260628-1600-ai-rag-routing-streaming-latency-improvement/reports/ai-latency-20260628-090618.md`, Braintrust latency reports | Ready |
| User feedback | PostHog usage report, quiz issue logs, and direct chat feedback from 8 testers | Ready |
| Code traceability | Test case to feature map below | Ready |

## 1. Test Results And Coverage

Command recorded in evidence package:

```powershell
uv run --with pytest-cov python -m pytest tests\test_chat_contracts.py tests\test_rag.py tests\test_agents\test_intent_router.py tests\test_agents\test_tools.py tests\test_api\test_chat_stream.py tests\test_api\test_routes.py -q --cov=src --cov-report=term-missing --cov-report=json:eval\results\chatbot_evidence\coverage-chatbot.json --cov-report=html:eval\results\chatbot_evidence\htmlcov
```

| Test Evidence | Result | Source |
|---|---:|---|
| Chatbot-focused pytest suite | 79 passed, 2 warnings, 15.64s | `eval/results/chatbot_evidence/pytest-chatbot-coverage-utf8.txt` |
| Full `src` coverage under chatbot suite | 42.6% / rounded 43% total | `coverage-chatbot.json`, terminal coverage output |
| Chat contract coverage | 97.6% | `chatbot_evaluation_evidence.md` |
| Timing service coverage | 95.7% | `chatbot_evaluation_evidence.md` |
| Chat fast-path coverage | 85.2% | `chatbot_evaluation_evidence.md` |
| Citation validator coverage | 82.5% | `chatbot_evaluation_evidence.md` |
| Analyze node coverage | 82.6% | `chatbot_evaluation_evidence.md` |
| RAG service coverage | 69.9% | `chatbot_evaluation_evidence.md` |

![Coverage of chatbot modules](../eval/results/chatbot_evidence/coverage_key_modules.svg)

## 2. RAGAS-equivalent Metrics

The project uses `scripts/run_ragas_eval.py` over golden cases from `docs/domain-knowledge/golden-test-cases.json`. The metrics are equivalent to RAGAS faithfulness and answer relevance, with an additional Socratic scaffolding metric.

| Metric | Score | Target | Status |
|---|---:|---:|---|
| Faithfulness | 5.00/5 | >= 4/5 | PASS |
| Answer relevance | 5.00/5 | >= 4/5 | PASS |
| Socratic scaffolding | 4.30/5 | >= 4/5 | PASS |
| Cases passing all three metrics >= 4/5 | 7/10 | >= 7/10 | PASS |

![RAGAS average metrics](../eval/results/chatbot_evidence/ragas_average_metrics.svg)

| Case | Category | RAG Count | Faithfulness | Relevance | Socratic | Status |
|---|---|---:|---:|---:|---:|---|
| TC-001 | knowledge_question | 4 | 5/5 | 5/5 | 5/5 | PASS |
| TC-002 | knowledge_question | 0 | 5/5 | 5/5 | 3/5 | WATCH |
| TC-003 | direct_cheating | 4 | 5/5 | 5/5 | 5/5 | PASS |
| TC-004 | zpd_low_elo | 0 | 5/5 | 5/5 | 3/5 | WATCH |
| TC-005 | zpd_high_elo | 4 | 5/5 | 5/5 | 5/5 | PASS |
| TC-006 | active_quiz_help | 4 | 5/5 | 5/5 | 5/5 | PASS |
| TC-007 | knowledge_question | 4 | 5/5 | 5/5 | 3/5 | WATCH |
| TC-008 | direct_cheating | 0 | 5/5 | 5/5 | 5/5 | PASS |
| TC-009 | zpd_low_elo | 0 | 5/5 | 5/5 | 4/5 | PASS |
| TC-010 | active_quiz_help | 4 | 5/5 | 5/5 | 5/5 | PASS |

Companion reports:

- `outputs/ragas_eval_report.md`
- `outputs/golden_eval_report.md`
- `eval/results/chatbot_evidence/ragas_metrics_summary.csv`
- `eval/results/chatbot_evidence/ragas_case_scores.svg`

## 3. Performance Metrics

Latency source: `plans/20260628-1600-ai-rag-routing-streaming-latency-improvement/reports/ai-latency-20260628-090618.md`. Values exclude warmup rows.

| Scenario | Runs | Client p50 | Client p95 | First token p50 | First token p95 | Server p50 | Server p95 |
|---|---:|---:|---:|---:|---:|---:|---:|
| general | 2 | 3.06s | 3.09s | 2.83s | 2.87s | 2.43s | 2.47s |
| academic_cached | 2 | 6.09s | 6.13s | 3.21s | 3.25s | 5.50s | 5.53s |
| academic_cold | 2 | 7.72s | 7.98s | 3.17s | 3.22s | 7.11s | 7.37s |
| long_history | 2 | 10.11s | 10.33s | 3.17s | 3.30s | 9.48s | 9.70s |

![Latency by scenario](../eval/results/chatbot_evidence/latency_by_scenario.svg)

Braintrust trace evidence from `braintrust-latency-20260628-091738.md`:

| Span | Count | p50 | p95 | Interpretation |
|---|---:|---:|---:|---|
| `chat.stream` | 7 | 8.61s | 10.53s | Full streamed chat path |
| `LangGraph` | 7 | 8.61s | 9.70s | Agent orchestration path |
| `respond_academic` | 7 | 6.15s | 8.37s | Academic answer generation |
| `rag.vector_rpc` | 3 | 0.43s | 0.46s | Supabase pgvector RPC is not the main bottleneck |
| `chat.profile_load` | 7 | 0.19ms | 0.62ms | Profile load is negligible |

## 4. User Feedback Evidence

Direct qualitative feedback was collected from AI20K testers between 2026-06-17 and 2026-07-06. The source summary is `docs/evidence/user-feedback-chat-export-summary.md`; the table below anonymizes names while preserving role, issue, and product action.

### Confirmed usage feedback

Source: `report/posthog-early-product-usage-report.md`, window 2026-06-02 16:02 UTC to 2026-07-06 03:21 UTC.

| Feedback Signal | Evidence | Interpretation |
|---|---:|---|
| Unique pageview persons | 828 | Product reached a non-trivial test audience |
| Active learners | 292 | 35.3% of visitors performed learning actions |
| Questions answered | 5,335 | Learners engaged with practice, not only browsing |
| Quiz completions | 584 | Many users reached the end of a quiz flow |
| Ordered quiz completion rate | 49.3% | Useful but still needs funnel improvement |
| Waitlist submissions | 8 | CTA/lead-capture is weak and needs iteration |

Additional feedback artifact:

- `outputs/quiz_reports.jsonl` records user-submitted quiz issue reports for review.

### Direct tester feedback

| Participant | Role | Feedback Summary | Product Action | Status |
|---|---|---|---|---|
| Tester A | AI20K learner | Wanted deeper personalization: a roadmap or guideline based on learner ability, with an option for learners who want to go deeper. | Strengthen adaptive roadmap and mastery-based recommendations. | Accepted |
| Tester B | AI20K learner | Asked how large knowledge bases are uploaded, whether enterprise customers can manage knowledge securely, and which file formats are supported. | Document batch ingestion, private deployment model, and supported formats such as text, PDF, image, and voice. | Accepted |
| Tester C | AI20K learner | Login bypass showed only a skeleton state; suggested a clearer loading indicator to improve perceived UX. | Add explicit loading affordance for auth/session bootstrapping. | Accepted |
| Tester D | AI20K learner | Felt the interface was too bright and colorful for extended use. | Add dark mode and tune the visual palette for lower eye strain. | Planned |
| Tester E | AI20K learner | Reported that text was too small on a 24-inch screen and that the AI response could take minutes for short questions. | Increase key font sizes through design tokens and continue chat latency optimization. | Accepted |
| Tester F | AI20K learner | Noted that the advertised quick-select keys `1/2/3/4` did not work. | Fix keyboard shortcuts and add regression coverage for quiz answer selection. | Accepted |
| Tester G | AI20K learner | Found repeated quiz questions and suspected the adaptive recommendation flow was recycling items. | Fix frontend adaptive recommendation state and exclude previously answered questions. | Fixed/Validated |
| Tester H | AI20K learner | After completing a day, the app jumped back to the first day instead of highlighting the current completed day. | Persist selected learning day/week after quiz completion. | Fixed/Validated |

## 5. Code Traceability

| Test Case / Evidence | Feature | Code Area | Evidence |
|---|---|---|---|
| Chat stream pytest suite | SSE chat API and stream contract | `src/api/routes.py`, `src/models/chat_contracts.py` | `tests/test_api/test_chat_stream.py`, `tests/test_chat_contracts.py` |
| RAG service tests | Retrieval, citation context, Supabase pgvector behavior | `src/services/rag.py` | `tests/test_rag.py` |
| Intent/router tests | LangGraph routing and tutor tool behavior | `src/agents/graph.py`, `src/agents/nodes/analyze_node.py`, `src/agents/tools/` | `tests/test_agents/test_intent_router.py`, `tests/test_agents/test_tools.py` |
| Golden TC-001, TC-002, TC-007 | Knowledge questions and citation behavior | `src/services/rag.py`, `src/services/citation_validator.py` | `outputs/golden_eval_report.md` |
| Golden TC-003, TC-008 | Direct cheating guardrail | `src/agents/nodes/pedagogical_reflection_node.py`, `src/services/chat_fast_path.py` | `outputs/golden_eval_report.md` |
| Golden TC-004, TC-009 | Low-Elo/ZPD explanation style | `src/agents/nodes/respond_node.py` | `outputs/ragas_eval_report.md` |
| Golden TC-005 | High-Elo explanation quality | `src/agents/nodes/respond_node.py` | `outputs/ragas_eval_report.md` |
| Golden TC-006, TC-010 | Active quiz help guardrail | `src/agents/nodes/respond_node.py`, `src/agents/nodes/pedagogical_reflection_node.py` | `outputs/golden_eval_report.md` |
| Latency harness | Chat response time, first token latency, span timing | `scripts/eval_ai_latency.py`, `src/services/timing.py` | `latency_summary.csv`, Braintrust latency reports |
| Adaptive experiments | Elo/BKT/LinUCB algorithm validation | `src/services/adaptive/`, `eval/` | `eval/results/report.md`, `docs/research/paper/main.tex` |

## 6. Evaluation Artifacts

| Artifact | Purpose |
|---|---|
| `eval/results/chatbot_evidence/chatbot_evaluation_evidence.md` | Consolidated chatbot evidence report |
| `eval/results/chatbot_evidence/pytest-chatbot-coverage-utf8.txt` | Raw pytest output and coverage table |
| `eval/results/chatbot_evidence/coverage-chatbot.json` | Machine-readable coverage data |
| `eval/results/chatbot_evidence/htmlcov/index.html` | HTML coverage report |
| `eval/results/chatbot_evidence/ragas_metrics_summary.csv` | RAGAS-equivalent aggregate metrics |
| `eval/results/chatbot_evidence/latency_summary.csv` | Response-time metrics |
| `outputs/golden_eval_report.md` | Golden test case behavior report |
| `outputs/ragas_eval_report.md` | LLM-as-judge quality report |
| `report/posthog-early-product-usage-report.md` | Usage analytics and feedback proxy |
| `docs/evidence/user-feedback-chat-export-summary.md` | Direct tester feedback summary |
| `outputs/quiz_reports.jsonl` | User-submitted quiz issue reports |

## 7. Interpretation

- The chatbot-focused regression suite is green and covers chat stream, contracts, RAG, routing, tutor tools, and route smoke tests.
- RAGAS-equivalent faithfulness and relevance are both 5.00/5; Socratic scaffolding meets target at 4.30/5.
- General chat is near the 3-second response-time target, while academic cold and long-history paths remain the slowest.
- Usage analytics and direct chat feedback show real learner interaction; the strongest product follow-ups are personalization depth, chat latency, readable typography, duplicate-question prevention, and clearer quiz review.
