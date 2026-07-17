import json
import logging
import time
from datetime import UTC, datetime
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from src.api import (
    adaptive_routes,
    admin_braintrust_routes,
    auth_routes,
    material_routes,
    onboarding_routes,
    quiz_error_routes,
    quiz_review_routes,
)
from src.models.chat_contracts import (
    AgentChatMessage,
    AgentChatMetadata,
    AgentChatResponseV1,
    AgentChatStreamEventV1,
    ChatPart,
    CitationValidation,
    StreamSequence,
    citation_validation_from_legacy,
    rag_source_from_legacy_slide,
)
from src.models.schemas import ChatRequest, ChatResponse
from src.services.ai_response_feedback import (
    list_ai_response_review_items,
    record_ai_response_feedback,
    review_ai_response_feedback,
)
from src.services.braintrust_observability import braintrust_span, log_span
from src.services.cache import get_cache_store
from src.services.cache_keys import mastery_cache_key
from src.services.chat_fast_path import (
    practice_concept_analysis,
    practice_concept_clarification,
    static_general_response,
)
from src.services.chat_optimization import build_system_prompt
from src.services.llm import get_llm
from src.services.quiz_error_cases import create_or_update_quiz_error_case
from src.services.timing import TimingCollector, core_timing_metadata, merge_timing_metadata

logger = logging.getLogger(__name__)

router = APIRouter()
router.include_router(adaptive_routes.router)
router.include_router(auth_routes.router)
router.include_router(admin_braintrust_routes.router)
router.include_router(onboarding_routes.router)
router.include_router(quiz_error_routes.router)
router.include_router(material_routes.router)
router.include_router(quiz_review_routes.router)

CHAT_PERSISTENCE_ERROR = "Không thể tải hoặc lưu phiên chat. Vui lòng thử lại."
CHAT_PERSISTENCE_ERROR_CODE = "chat_persistence_unavailable"
CHAT_PROCESSING_ERROR = "Không thể xử lý hội thoại lúc này. Vui lòng thử lại."
CHAT_PROCESSING_ERROR_CODE = "chat_processing_unavailable"


def is_chat_persistence_error(exc: Exception) -> bool:
    return str(exc).startswith("Unable to ") and (
        "chat session" in str(exc)
        or "chat history" in str(exc)
        or "chat message" in str(exc)
        or "student memory" in str(exc)
    )


def sync_mastery_to_db(
    student_id_str: str,
    course_id_str: str,
    concept_id_str: str,
    profile: dict,
):
    """Ghi nền bất đồng bộ chỉ số Elo/BKT từ Cache xuống database chính (Supabase/Postgres)."""
    try:
        from src.api.adaptive_routes import get_adaptive_db

        db = get_adaptive_db()

        student_id = UUID(student_id_str)
        course_id = UUID(course_id_str)
        concept_id = UUID(concept_id_str)

        db.begin()
        db.sync_elo_bkt_only(
            student_id=student_id,
            course_id=course_id,
            concept_id=concept_id,
            elo_score=profile.get("elo_score", 1200.0),
            bkt_prob=profile.get("bkt_mastery_probability", 0.25),
            mastery_state=profile.get("mastery_state", "not_started"),
            weakness_flag=profile.get("weakness_flag", False),
        )
        db.commit()
        logger.info(f"Đã sync Elo/BKT thành công xuống DB nền cho student {student_id_str}")
    except Exception as e:
        logger.error(f"Lỗi ghi nền Elo/BKT xuống DB: {str(e)}", exc_info=True)


def sse_event(event: str, data: dict | str) -> str:
    payload = data if isinstance(data, str) else json.dumps(data, ensure_ascii=False)
    return f"event: {event}\ndata: {payload}\n\n"


def sse_v1_event(data: AgentChatStreamEventV1) -> str:
    return sse_event(data.event, data.model_dump(by_alias=True, exclude_none=True))


def wants_v1_stream(request: ChatRequest, http_request: Request | None = None) -> bool:
    header_value = ""
    if http_request is not None:
        header_value = http_request.headers.get("x-agent-chat-protocol", "")
    return header_value.strip().lower() == "v1" or request.schema_version == "agent-chat.v1"


def v1_metadata_from_legacy(metadata: dict | None) -> AgentChatMetadata:
    metadata = metadata or {}
    timings = metadata.get("timings_ms") or {}
    return AgentChatMetadata(
        mode=metadata.get("mode"),
        intent=metadata.get("intent"),
        timingsMs={key: float(value) for key, value in timings.items() if isinstance(value, int | float)},
    )


def v1_validations_from_legacy(metadata: dict | None) -> list[CitationValidation]:
    metadata = metadata or {}
    citation = citation_validation_from_legacy(metadata.get("citation_validation"))
    return [citation] if citation else []


def v1_sources_from_legacy(metadata: dict | None):
    metadata = metadata or {}
    return [rag_source_from_legacy_slide(slide) for slide in metadata.get("retrieved_slides") or []]


def v1_done_response(
    *,
    response_text: str,
    metadata: dict | None,
    session_id: str | None,
) -> AgentChatResponseV1:
    assistant_message_id = None
    if metadata:
        assistant_message_id = metadata.get("assistant_message_id")
    return AgentChatResponseV1(
        conversationId=session_id,
        message=AgentChatMessage(
            id=assistant_message_id or (f"assistant-{session_id}" if session_id else None),
            role="assistant",
            parts=[ChatPart(type="text", text=response_text)],
        ),
        sources=v1_sources_from_legacy(metadata),
        validation=v1_validations_from_legacy(metadata),
        metadata=v1_metadata_from_legacy(metadata),
    )


def log_chat_timing(
    *,
    path: str,
    request: ChatRequest,
    metadata: dict,
    answer_chars: int = 0,
    session_id: str | None = None,
    extra: dict | None = None,
) -> None:
    timings_ms = metadata.get("timings_ms") or {}
    payload = {
        "path": path,
        "stream": request.stream,
        "mode": request.mode,
        "intent": metadata.get("intent"),
        "student_id": request.student_id,
        "course_id": request.course_id,
        "concept_id": request.concept_id,
        "session_id": session_id,
        "message_preview": request.message[:120],
        "answer_chars": answer_chars,
        "timings_ms": timings_ms,
    }
    if extra:
        payload.update(extra)
    logger.info("AI_CHAT_LOCAL_TIMING %s", json.dumps(payload, ensure_ascii=False, sort_keys=True))


def practice_mode_needs_concept(request: ChatRequest) -> bool:
    return request.stream and request.mode.strip().lower() == "practice" and not request.concept_id


async def load_student_profile(request: ChatRequest) -> tuple[dict, str | None]:
    student_profile = {
        "elo_score": 1200.0,
        "bkt_mastery_probability": 0.25,
        "weakness_flag": False,
        "mastery_state": "not_started",
    }
    cache_key = ""
    has_context = request.student_id and request.course_id and request.concept_id

    if has_context:
        cache_key = mastery_cache_key(str(request.student_id), str(request.course_id), str(request.concept_id))
        cache = get_cache_store()
        cached_data = cache.get(cache_key)

        if cached_data:
            try:
                student_profile = json.loads(cached_data)
                return student_profile, cache_key
            except Exception as ce:
                logger.warning(f"Lỗi parse JSON cache: {ce}")

        try:
            from src.api.adaptive_routes import get_adaptive_db

            db = get_adaptive_db()
            student_id = UUID(request.student_id)
            course_id = UUID(request.course_id)
            concept_id = UUID(request.concept_id)

            mastery = db.get_student_mastery(student_id, course_id, concept_id)
            student_profile = {
                "elo_score": mastery.get("elo_score", 1200.0),
                "bkt_mastery_probability": mastery.get("bkt_mastery_probability", 0.25),
                "weakness_flag": mastery.get("weakness_flag", False),
                "mastery_state": mastery.get("mastery_state", "not_started"),
            }
            cache.set(cache_key, json.dumps(student_profile), ttl=300)
        except ValueError as ve:
            raise HTTPException(status_code=422, detail="Chat profile context contains an invalid UUID.") from ve
        except Exception as de:
            logger.error(f"Lỗi đọc DB chính cho chat profile: {de}", exc_info=True)
            raise HTTPException(status_code=503, detail="Không thể tải hồ sơ học tập cho phiên chat.")

    return student_profile, cache_key or None


async def update_long_term_memories_job(
    student_id_str: str,
    query: str,
    response: str,
):
    """Trích xuất bất đồng bộ thông tin học sinh và lưu trữ vào trí nhớ dài hạn (student_memories)."""
    try:
        from src.api.adaptive_routes import get_adaptive_db

        db = get_adaptive_db()
        student_id = UUID(student_id_str)

        # 1. Đọc facts hiện tại
        existing_facts = db.get_student_memory(student_id) or {}

        # 2. Định nghĩa Prompt để trích xuất facts mới
        prompt = f"""Bạn là một trợ lý AI trích xuất thông tin cá nhân của học sinh để giúp cá nhân hóa giáo dục.
Hãy phân tích lượt chat mới nhất của học sinh và trợ lý, sau đó cập nhật và trả về cấu trúc thông tin học sinh dưới dạng JSON.
Hãy giữ lại các thông tin hiện có nếu không bị thay đổi hoặc đè lên.

CẤU TRÚC JSON TRẢ VỀ BẮT BUỘC:
{{
    "name": "Tên học sinh (nếu có)",
    "prefer_language": "Ngôn ngữ lập trình yêu thích (ví dụ: Python, JavaScript)",
    "struggles_with": ["Khái niệm hoặc phần kiến thức học sinh đang gặp khó khăn/hỏi lại nhiều lần"],
    "strengths": ["Các chủ đề học sinh làm tốt hoặc tự tin"],
    "other_facts": ["Các sự kiện hữu ích khác (ví dụ: thích học qua ví dụ thực tế)"]
}}

Thông tin học sinh hiện tại:
{json.dumps(existing_facts, ensure_ascii=False, indent=2)}

Lượt chat mới nhất:
Học sinh: {query}
Trợ lý AI: {response}

Chỉ trả về chuỗi JSON hợp lệ, không kèm theo ``` hay bất kỳ đoạn text nào khác. Nếu không có thông tin mới, hãy trả về nguyên trạng thông tin hiện tại."""

        llm = get_llm()
        llm_response = await llm.ainvoke(prompt)
        content = llm_response.content.strip()

        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                content = "\n".join(lines[1:-1]).strip()

        new_facts = json.loads(content)

        # 3. Lưu lại vào DB
        db.save_student_memory(student_id, new_facts)
        logger.info(f"Đã cập nhật trí nhớ dài hạn thành công cho student {student_id_str}")
    except Exception as e:
        logger.error(f"Lỗi khi trích xuất và lưu trí nhớ dài hạn: {e}", exc_info=True)


async def stream_chat_response(
    request: ChatRequest,
    student_profile: dict | None,
    cache_key: str | None,
    background_tasks: BackgroundTasks,
    timings: TimingCollector | None = None,
    protocol_v1: bool = False,
):
    timings = timings or TimingCollector()
    stream_seq = StreamSequence()
    if protocol_v1:
        yield sse_v1_event(stream_seq.next("status", stage="route", message="Đang chuẩn bị phiên chat..."))
    else:
        yield sse_event("thinking", {"text": "Đang chuẩn bị phiên chat..."})

    if practice_mode_needs_concept(request):
        response_text = practice_concept_clarification()
        timings.add("llm_first_token", 0.0)
        timings.add("llm_total", 0.0)
        timings.mark_elapsed("total")
        metadata = core_timing_metadata({"intent": "clarify_practice_concept"}, timings.snapshot())
        log_chat_timing(
            path="chat.practice_clarify",
            request=request,
            metadata=metadata,
            answer_chars=len(response_text),
            extra={"fast_path": True},
        )
        if protocol_v1:
            yield sse_v1_event(stream_seq.next("text_delta", delta=response_text))
            yield sse_v1_event(
                stream_seq.next(
                    "done",
                    response=v1_done_response(response_text=response_text, metadata=metadata, session_id=None),
                )
            )
        else:
            yield sse_event("token", {"delta": response_text})
            yield sse_event(
                "done",
                {
                    "response": response_text,
                    "analysis": practice_concept_analysis(),
                    "metadata": metadata,
                    "session_id": None,
                },
            )
        return

    static_response = static_general_response(request.message)
    if static_response:
        with braintrust_span(
            "chat.static_general", input={"query": request.message}, metadata={"intent": "general"}
        ) as span:
            timings.add("llm_first_token", 0.0)
            timings.add("llm_total", 0.0)
            timings.mark_elapsed("total")
            metadata = core_timing_metadata({"intent": "general"}, timings.snapshot())
            log_chat_timing(
                path="chat.static_general",
                request=request,
                metadata=metadata,
                answer_chars=len(static_response),
                extra={"fast_path": True},
            )
            log_span(
                span, output={"answer_chars": len(static_response)}, metadata={"timings_ms": metadata["timings_ms"]}
            )
            if protocol_v1:
                yield sse_v1_event(stream_seq.next("text_delta", delta=static_response))
                yield sse_v1_event(
                    stream_seq.next(
                        "done",
                        response=v1_done_response(response_text=static_response, metadata=metadata, session_id=None),
                    )
                )
            else:
                yield sse_event("token", {"delta": static_response})
                yield sse_event(
                    "done",
                    {
                        "response": static_response,
                        "analysis": "Câu hỏi xã giao được trả lời nhanh, không cần truy vấn RAG.",
                        "metadata": metadata,
                        "session_id": None,
                    },
                )
        return

    if student_profile is None:
        with braintrust_span("chat.profile_load"):
            student_profile, cache_key = await load_student_profile(request)

    from src.api.adaptive_routes import get_adaptive_db

    db = get_adaptive_db()
    root_input = {"mode": request.mode, "stream": True, "has_context": bool(request.course_id or request.concept_id)}

    with braintrust_span("chat.stream", input=root_input, metadata={"mode": request.mode}) as chat_span:
        session_uuid = None
        try:
            if request.session_id:
                with braintrust_span("chat.session_validate", metadata={"has_session_id": True}):
                    try:
                        temp_uuid = UUID(request.session_id)
                    except ValueError:
                        logger.warning(f"Invalid session_id: {request.session_id}")
                    else:
                        res = db.app_client.table("chat_sessions").select("id").eq("id", str(temp_uuid)).execute()
                        if res.data:
                            session_uuid = temp_uuid

            if not session_uuid and request.student_id and request.course_id:
                with braintrust_span("chat.session_create", metadata={"mode": request.mode}):
                    session_uuid = db.create_chat_session(
                        UUID(request.student_id), UUID(request.course_id), request.mode
                    )
                    logger.info(f"Đã tạo phiên chat mới: {session_uuid}")

            chat_history = []
            if session_uuid:
                with braintrust_span("chat.history_load", metadata={"limit": 10}):
                    chat_history = db.get_chat_history(session_uuid, limit=10)

            long_term_facts = {}
            if request.student_id:
                with braintrust_span("chat.memory_load"):
                    long_term_facts = db.get_student_memory(UUID(request.student_id))
        except Exception as exc:
            logger.error("Lỗi tải dữ liệu phiên chat", exc_info=True)
            log_span(chat_span, error=str(exc))
            if protocol_v1:
                yield sse_v1_event(
                    stream_seq.next(
                        "error",
                        code=CHAT_PERSISTENCE_ERROR_CODE,
                        message=CHAT_PERSISTENCE_ERROR,
                        retryable=True,
                    )
                )
            else:
                yield sse_event("error", {"code": CHAT_PERSISTENCE_ERROR_CODE, "error": CHAT_PERSISTENCE_ERROR})
            return

        try:
            from src.agents.graph import agent

            cumulative_state = {
                "query": request.message,
                "student_profile": student_profile,
                "mode": request.mode,
                "course_id": request.course_id,
                "concept_id": request.concept_id,
                "session_id": str(session_uuid) if session_uuid else None,
                "chat_history": chat_history,
                "long_term_facts": long_term_facts,
                "timings_ms": timings.snapshot(),
            }

            async for event in agent.astream_events(cumulative_state, version="v2"):
                event_type = event.get("event")
                name = event.get("name")

                if event_type == "on_custom_event":
                    data = event.get("data")
                    event_data = data if isinstance(data, dict) else {}
                    if name == "thinking":
                        if protocol_v1:
                            yield sse_v1_event(
                                stream_seq.next("status", stage="generate", message=event_data.get("text", ""))
                            )
                        else:
                            yield sse_event("thinking", data)
                    elif name == "tool_call":
                        if protocol_v1:
                            tool_name = event_data.get("tool_name") or event_data.get("toolName") or "tool"
                            tool_id = stream_seq.next_id("tool")
                            yield sse_v1_event(
                                stream_seq.next(
                                    "tool_call",
                                    id=tool_id,
                                    name=tool_name,
                                    input=event_data.get("arguments") or event_data.get("args"),
                                )
                            )
                        else:
                            yield sse_event("tool_call", data)
                    elif name == "tool_result":
                        if protocol_v1:
                            tool_name = event_data.get("tool_name") or event_data.get("toolName") or "tool"
                            tool_id = stream_seq.next_id("tool")
                            yield sse_v1_event(
                                stream_seq.next(
                                    "tool_result",
                                    id=tool_id,
                                    name=tool_name,
                                    output=event_data.get("output") or event_data.get("result"),
                                    durationMs=event_data.get("duration_ms") or event_data.get("durationMs"),
                                )
                            )
                        else:
                            yield sse_event("tool_result", data)
                    elif name == "token":
                        if protocol_v1:
                            yield sse_v1_event(
                                stream_seq.next("text_delta", delta=event_data.get("delta") or event_data.get("text"))
                            )
                        else:
                            yield sse_event("token", data)

                elif event_type == "on_chain_start":
                    node_name = event.get("metadata", {}).get("langgraph_node")
                    if node_name == "analyze":
                        message = "Đang phân tích câu hỏi & tìm kiếm tài liệu..."
                        if protocol_v1:
                            yield sse_v1_event(stream_seq.next("status", stage="retrieve", message=message))
                        else:
                            yield sse_event("thinking", {"text": message})
                    elif node_name in ["respond", "respond_academic"]:
                        message = "Đang soạn thảo phản hồi Socratic..."
                        if protocol_v1:
                            yield sse_v1_event(stream_seq.next("status", stage="generate", message=message))
                        else:
                            yield sse_event("thinking", {"text": message})
                    elif node_name == "respond_general":
                        message = "Đang soạn thảo phản hồi..."
                        if protocol_v1:
                            yield sse_v1_event(stream_seq.next("status", stage="generate", message=message))
                        else:
                            yield sse_event("thinking", {"text": message})
                    elif node_name == "pedagogical_reflection":
                        message = "Đang kiểm định sư phạm phản hồi..."
                        if protocol_v1:
                            yield sse_v1_event(stream_seq.next("status", stage="validate", message=message))
                        else:
                            yield sse_event("thinking", {"text": message})

                elif event_type == "on_chain_end":
                    node_name = event.get("metadata", {}).get("langgraph_node")
                    if node_name in [
                        "analyze",
                        "respond",
                        "respond_academic",
                        "respond_general",
                        "pedagogical_reflection",
                    ]:
                        node_output = event.get("data", {}).get("output", {})
                        if isinstance(node_output, dict):
                            cumulative_state.update(node_output)
                            if isinstance(node_output.get("metadata"), dict):
                                cumulative_state["metadata"] = {
                                    **cumulative_state.get("metadata", {}),
                                    **node_output["metadata"],
                                }

                        if node_name == "analyze":
                            if protocol_v1:
                                sources = v1_sources_from_legacy(cumulative_state.get("metadata", {}))
                                if sources:
                                    yield sse_v1_event(stream_seq.next("source_delta", sources=sources))
                            else:
                                yield sse_event(
                                    "analysis",
                                    {
                                        "analysis": cumulative_state.get("analysis", ""),
                                        "metadata": core_timing_metadata(cumulative_state.get("metadata", {})),
                                    },
                                )

            if cumulative_state.get("error"):
                raise Exception(cumulative_state.get("error"))

            response_text = cumulative_state.get("response", "")
            analysis_text = cumulative_state.get("analysis", "")
            metadata = merge_timing_metadata(
                cumulative_state.get("metadata", {}) or {}, cumulative_state.get("timings_ms")
            )
            timings.update(metadata.get("timings_ms"))
        except Exception as exc:
            logger.error("Lỗi khi chạy LangGraph Agent trong luồng stream", exc_info=True)
            log_span(chat_span, error=str(exc))
            if protocol_v1:
                yield sse_v1_event(
                    stream_seq.next(
                        "error",
                        code=CHAT_PROCESSING_ERROR_CODE,
                        message=CHAT_PROCESSING_ERROR,
                        retryable=True,
                    )
                )
            else:
                yield sse_event("error", {"code": CHAT_PROCESSING_ERROR_CODE, "error": CHAT_PROCESSING_ERROR})
            return

        assistant_message_id = None
        if session_uuid:
            with braintrust_span("chat.message_save", metadata={"has_session": True}):
                try:
                    db.add_chat_message(
                        session_uuid,
                        "student",
                        request.message,
                        UUID(request.concept_id) if request.concept_id else None,
                    )
                    assistant_message_id = db.add_chat_message(
                        session_uuid,
                        "assistant",
                        response_text,
                        UUID(request.concept_id) if request.concept_id else None,
                    )
                except Exception as db_err:
                    logger.error(f"Error saving chat messages to DB: {db_err}")
                    log_span(chat_span, error=str(db_err))
                    if protocol_v1:
                        yield sse_v1_event(
                            stream_seq.next(
                                "error",
                                code=CHAT_PERSISTENCE_ERROR_CODE,
                                message=CHAT_PERSISTENCE_ERROR,
                                retryable=True,
                            )
                        )
                    else:
                        yield sse_event("error", {"code": CHAT_PERSISTENCE_ERROR_CODE, "error": CHAT_PERSISTENCE_ERROR})
                    return

        if assistant_message_id:
            metadata["assistant_message_id"] = str(assistant_message_id)

        if request.student_id:
            background_tasks.add_task(update_long_term_memories_job, request.student_id, request.message, response_text)

        updated_profile = cumulative_state.get("student_profile")
        has_context = bool(request.student_id and request.course_id and request.concept_id)
        if updated_profile and has_context and updated_profile != student_profile:
            cache = get_cache_store()
            if cache_key:
                cache.set(cache_key, json.dumps(updated_profile), ttl=300)
            background_tasks.add_task(
                sync_mastery_to_db,
                request.student_id,
                request.course_id,
                request.concept_id,
                updated_profile,
            )

        timings.mark_elapsed("total")
        metadata = core_timing_metadata(metadata, timings.snapshot())
        log_chat_timing(
            path="chat.stream",
            request=request,
            metadata=metadata,
            answer_chars=len(response_text),
            session_id=str(session_uuid) if session_uuid else None,
            extra={"fast_path": False},
        )
        log_span(
            chat_span, output={"answer_chars": len(response_text)}, metadata={"timings_ms": metadata["timings_ms"]}
        )

    if protocol_v1:
        yield sse_v1_event(
            stream_seq.next(
                "done",
                response=v1_done_response(
                    response_text=response_text,
                    metadata=metadata,
                    session_id=str(session_uuid) if session_uuid else None,
                ),
            )
        )
    else:
        yield sse_event(
            "done",
            {
                "response": response_text,
                "analysis": analysis_text,
                "metadata": metadata,
                "session_id": str(session_uuid) if session_uuid else None,
            },
        )


@router.post("/chat")
async def chat(
    request: ChatRequest,
    http_request: Request,
    background_tasks: BackgroundTasks,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
):
    """Chat với AI agent được cá nhân hóa qua Elo & BKT."""
    if user.role == "student" and str(request.student_id) != str(user.id):
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền truy cập vào hội thoại của chính mình.")
    try:
        timings = TimingCollector()

        if request.stream:
            return StreamingResponse(
                stream_chat_response(
                    request,
                    None,
                    None,
                    background_tasks,
                    timings,
                    protocol_v1=wants_v1_stream(request, http_request),
                ),
                media_type="text/event-stream",
                background=background_tasks,
            )

        with braintrust_span("chat.profile_load"):
            student_profile, cache_key = await load_student_profile(request)

        from src.api.adaptive_routes import get_adaptive_db

        db = get_adaptive_db()

        with braintrust_span(
            "chat.request", input={"mode": request.mode, "stream": False}, metadata={"mode": request.mode}
        ) as chat_span:
            session_uuid = None
            if request.session_id:
                with braintrust_span("chat.session_validate", metadata={"has_session_id": True}):
                    try:
                        temp_uuid = UUID(request.session_id)
                    except ValueError:
                        logger.warning(f"Invalid session_id: {request.session_id}")
                    else:
                        res = db.app_client.table("chat_sessions").select("id").eq("id", str(temp_uuid)).execute()
                        if res.data:
                            session_uuid = temp_uuid

            if not session_uuid and request.student_id and request.course_id:
                with braintrust_span("chat.session_create", metadata={"mode": request.mode}):
                    session_uuid = db.create_chat_session(
                        UUID(request.student_id), UUID(request.course_id), request.mode
                    )

            chat_history = []
            if session_uuid:
                with braintrust_span("chat.history_load", metadata={"limit": 10}):
                    chat_history = db.get_chat_history(session_uuid, limit=10)

            long_term_facts = {}
            if request.student_id:
                with braintrust_span("chat.memory_load"):
                    long_term_facts = db.get_student_memory(UUID(request.student_id))

            from src.agents.graph import agent

            with braintrust_span("chat.graph", metadata={"stream": False}):
                result = await agent.ainvoke(
                    {
                        "query": request.message,
                        "student_profile": student_profile,
                        "mode": request.mode,
                        "course_id": request.course_id,
                        "concept_id": request.concept_id,
                        "session_id": str(session_uuid) if session_uuid else None,
                        "chat_history": chat_history,
                        "long_term_facts": long_term_facts,
                        "timings_ms": timings.snapshot(),
                    }
                )

            response_text = result.get("response", "")

            # Lưu tin nhắn vào DB
            assistant_message_id = None
            if session_uuid:
                with braintrust_span("chat.message_save", metadata={"has_session": True}):
                    try:
                        db.add_chat_message(
                            session_uuid,
                            "student",
                            request.message,
                            UUID(request.concept_id) if request.concept_id else None,
                        )
                        assistant_message_id = db.add_chat_message(
                            session_uuid,
                            "assistant",
                            response_text,
                            UUID(request.concept_id) if request.concept_id else None,
                        )
                    except Exception as db_err:
                        logger.error(f"Error saving chat messages to DB: {db_err}")

            # Đăng ký background task trích xuất thông tin dài hạn
            if request.student_id:
                background_tasks.add_task(
                    update_long_term_memories_job,
                    request.student_id,
                    request.message,
                    response_text,
                )

            updated_profile = result.get("student_profile")
            has_context = bool(request.student_id and request.course_id and request.concept_id)
            if updated_profile and has_context and updated_profile != student_profile:
                cache = get_cache_store()
                if cache_key:
                    cache.set(cache_key, json.dumps(updated_profile), ttl=300)
                background_tasks.add_task(
                    sync_mastery_to_db,
                    request.student_id,
                    request.course_id,
                    request.concept_id,
                    updated_profile,
                )

            metadata = merge_timing_metadata(result.get("metadata", {}) or {}, result.get("timings_ms"))
            if assistant_message_id:
                metadata["assistant_message_id"] = str(assistant_message_id)
            timings.update(metadata.get("timings_ms"))
            timings.mark_elapsed("total")
            metadata = core_timing_metadata(metadata, timings.snapshot())
            log_chat_timing(
                path="chat.request",
                request=request,
                metadata=metadata,
                answer_chars=len(response_text),
                session_id=str(session_uuid) if session_uuid else None,
                extra={"fast_path": False},
            )
            log_span(
                chat_span, output={"answer_chars": len(response_text)}, metadata={"timings_ms": metadata["timings_ms"]}
            )

            return ChatResponse(
                response=response_text,
                analysis=result.get("analysis", ""),
                metadata=metadata,
                session_id=str(session_uuid) if session_uuid else None,
            )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Lỗi endpoint /chat: {str(e)}", exc_info=True)
        if is_chat_persistence_error(e):
            raise HTTPException(status_code=503, detail=CHAT_PERSISTENCE_ERROR)
        raise HTTPException(status_code=503, detail=CHAT_PROCESSING_ERROR)


@router.get("/status")
async def agent_status():
    """Kiểm tra trạng thái agent."""
    return {"status": "ready", "agent": "LangGraph Agent v1.0"}


@router.get("/student/activity")
async def get_student_activity(
    student_id: UUID,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    if user.role == "student" and student_id != user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền xem lịch sử hoạt động của chính mình.")

    if db._stub_mode or db.app_client is None:
        return []

    try:
        # Lấy lịch sử từ quiz_attempts
        quiz_resp = (
            db.app_client.table("quiz_attempts")
            .select("submitted_at, is_correct, actual_score")
            .eq("student_id", str(student_id))
            .execute()
        )

        # Lấy lịch sử từ chat_sessions
        chat_resp = (
            db.app_client.table("chat_sessions").select("started_at").eq("student_id", str(student_id)).execute()
        )

        activities = {}

        # Xử lý quiz attempts
        for attempt in quiz_resp.data or []:
            if not attempt.get("submitted_at"):
                continue
            date_str = attempt["submitted_at"][:10]  # YYYY-MM-DD
            if date_str not in activities:
                activities[date_str] = {"date": date_str, "eloGain": 0, "quizCount": 0, "chatCount": 0}

            activities[date_str]["quizCount"] += 1
            if attempt.get("is_correct"):
                activities[date_str]["eloGain"] += 15
            else:
                activities[date_str]["eloGain"] += 5

        # Xử lý chat sessions
        for session in chat_resp.data or []:
            if not session.get("started_at"):
                continue
            date_str = session["started_at"][:10]
            if date_str not in activities:
                activities[date_str] = {"date": date_str, "eloGain": 0, "quizCount": 0, "chatCount": 0}

            activities[date_str]["chatCount"] += 1
            activities[date_str]["eloGain"] += 10

        return list(activities.values())
    except Exception as e:
        logger.error(f"Lỗi endpoint /student/activity: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể tải lịch sử hoạt động học tập.")


@router.get("/student/recent_sessions")
async def get_student_recent_sessions(
    student_id: UUID,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    if user.role == "student" and student_id != user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền xem phiên học tập của chính mình.")

    if db._stub_mode or db.app_client is None:
        return []

    try:
        events_resp = (
            db.app_client.table("student_recent_events")
            .select("id, created_at, elo_delta, concept_id, source_type, source_id")
            .eq("student_id", str(student_id))
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )

        events = events_resp.data or []
        if not events:
            return []

        concept_ids = list(set(str(e["concept_id"]) for e in events if e.get("concept_id")))
        source_ids = list(
            set(str(e["source_id"]) for e in events if e.get("source_id") and e.get("source_type") == "quiz_attempt")
        )

        concepts_map = {}
        if concept_ids:
            concepts_resp = db.app_client.table("concepts").select("id, name").in_("id", concept_ids).execute()
            for c in concepts_resp.data or []:
                concepts_map[str(c["id"])] = c["name"]

        quiz_attempts_map = {}
        if source_ids:
            attempts_resp = (
                db.app_client.table("quiz_attempts")
                .select("id, hint_count, is_correct")
                .in_("id", source_ids)
                .execute()
            )
            for a in attempts_resp.data or []:
                quiz_attempts_map[str(a["id"])] = a

        result = []
        for e in events:
            concept_name = concepts_map.get(str(e["concept_id"]), "Chủ đề ẩn")
            hint_count = 0
            questions_count = 1

            if e["source_type"] == "quiz_attempt" and str(e["source_id"]) in quiz_attempts_map:
                attempt_info = quiz_attempts_map[str(e["source_id"])]
                hint_count = attempt_info.get("hint_count") or 0

            hint_penalty = min(100, hint_count * 15)

            try:
                elo_delta_val = float(e["elo_delta"])
            except Exception:
                elo_delta_val = 0.0

            result.append(
                {
                    "id": str(e["id"]),
                    "conceptName": concept_name,
                    "type": "quiz" if e["source_type"] == "quiz_attempt" else "tutor_chat",
                    "date": e["created_at"],
                    "questionsCount": questions_count,
                    "hintsUsed": hint_count,
                    "hintPenaltyPct": hint_penalty,
                    "eloDelta": round(elo_delta_val, 1),
                }
            )

        return result
    except Exception as e:
        logger.error(f"Lỗi endpoint /student/recent_sessions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể tải phiên học tập gần đây.")


@router.get("/benchmark-caching")
async def run_benchmark_caching():
    """Chạy so sánh Prompt Caching: Baseline vs Optimized qua 7 lượt tương tác."""
    import asyncio
    import os
    import time

    from openai import AsyncOpenAI

    from src.config import get_settings
    from src.services.chat_optimization import split_formatted_prompt

    # Ensure OpenAI API Key is present
    settings = get_settings()
    if settings.app_env == "production":
        raise HTTPException(status_code=404, detail="Benchmark endpoint is not available in production.")
    if os.getenv("ENABLE_BENCHMARK_CACHING", "").strip().lower() not in {"1", "true", "yes", "on"}:
        raise HTTPException(status_code=404, detail="Benchmark endpoint is not enabled.")

    api_key = settings.openai_api_key or os.getenv("OPENAI_API_KEY")
    if not api_key or "your-key" in api_key:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY is not configured for benchmark execution.")

    client = AsyncOpenAI(api_key=api_key)

    # Mocked slides context to simulate RAG
    MOCK_SLIDES_DOCKER = (
        "- Tài liệu 1: Docker Basics | Slide 2 | Containerization là công nghệ ảo hóa ở cấp độ hệ điều hành. "
        "Khác với VM, Container chia sẻ nhân kernel của host OS, giúp nhẹ hơn và khởi động nhanh hơn.\n"
        "- Tài liệu 2: Docker Basics | Slide 5 | Docker Image là một snapshot tĩnh dạng read-only chứa code, "
        "runtime, libraries và configs. Docker Container là một thực thể chạy của Image.\n"
        "- Tài liệu 3: Docker Basics | Slide 10 | Docker Compose dùng file docker-compose.yaml (YAML format) "
        "để định nghĩa và chạy các ứng dụng multi-container dễ dàng.\n"
    )

    MOCK_SLIDES_NETWORKING = (
        "- Tài liệu 1: Docker Networking | Slide 4 | Các driver mạng chính của Docker gồm: bridge (mặc định), "
        "host (dùng chung mạng với host), overlay (cho multi-host swarm), và none.\n"
        "- Tài liệu 2: Docker Networking | Slide 7 | Lệnh docker run -p 8080:80 maps port 80 của container "
        "ra port 8080 của host machine để truy cập từ ngoài.\n"
    )

    MOCK_SLIDES_STORAGE = (
        "- Tài liệu 1: Docker Storage | Slide 3 | Volume là cơ chế chính để persist data của Container. "
        "Volume được quản lý bởi Docker host, lưu tại thư mục riêng biệt của host.\n"
        "- Tài liệu 2: Docker Storage | Slide 6 | Bind Mount mount trực tiếp một thư mục bất kỳ của host vào Container. "
        "Nó phụ thuộc vào cấu trúc thư mục của host OS.\n"
    )

    MOCK_SLIDES_COMPOSE = (
        "- Tài liệu 1: Docker Compose | Slide 3 | docker-compose.yaml định nghĩa các services, volumes, networks. "
        "Lệnh docker compose up khởi chạy toàn bộ ứng dụng.\n"
    )

    MOCK_PROFILE = {
        "elo_score": 1250.0,
        "bkt_mastery_probability": 0.45,
        "weakness_flag": False,
        "active_quiz_session": False,
        "scaffolding_rules": "- Học viên có trình độ trung bình khá.\n- Sử dụng thang gợi mở Socratic bậc 2.",
        "mode_instructions": "CHẾ ĐỘ: GIẢI THÍCH (Explain Mode)\n- Nhiệm vụ: Giải thích khái niệm học thuật.",
        "intent": "academic",
    }

    CONVERSATION_TURNS = [
        {
            "query": "Hãy giải thích cho mình khái niệm Docker và tại sao nó lại nhẹ hơn VM?",
            "context": MOCK_SLIDES_DOCKER,
        },
        {
            "query": "Vậy thì Docker Image khác Docker Container như thế nào? Cho ví dụ thực tế.",
            "context": MOCK_SLIDES_DOCKER,
        },
        {
            "query": "Làm thế nào để truy cập được một Docker Container từ bên ngoài mạng?",
            "context": MOCK_SLIDES_NETWORKING,
        },
        {"query": "So sánh các driver mạng host và bridge trong Docker.", "context": MOCK_SLIDES_NETWORKING},
        {
            "query": "Làm thế nào để mount một thư mục từ host máy tính vào trong Container?",
            "context": MOCK_SLIDES_STORAGE,
        },
        {"query": "Sự khác biệt giữa Bind Mount và Named Volume là gì?", "context": MOCK_SLIDES_STORAGE},
        {
            "query": "Cách viết một file docker-compose.yaml cơ bản để chạy web app và database?",
            "context": MOCK_SLIDES_COMPOSE,
        },
    ]

    async def run_turn_baseline(turn_idx: int, history: list[dict], query: str, context: str) -> tuple[dict, str]:
        system_prompt = build_system_prompt(context, MOCK_PROFILE, "Explain")
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        messages.append({"role": "user", "content": query})

        start_time = time.perf_counter()
        ttft = 0.0
        response_text_chunks = []

        stream = await client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, temperature=0.2, stream=True, stream_options={"include_usage": True}
        )

        usage = None
        async for chunk in stream:
            if len(chunk.choices) > 0:
                delta = chunk.choices[0].delta.content or ""
                if delta and ttft == 0.0:
                    ttft = (time.perf_counter() - start_time) * 1000
                response_text_chunks.append(delta)
            if hasattr(chunk, "usage") and chunk.usage is not None:
                usage = chunk.usage

        total_time = (time.perf_counter() - start_time) * 1000
        response_text = "".join(response_text_chunks)
        prompt_tokens = 0
        completion_tokens = 0
        cached_tokens = 0

        if usage is not None:
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            if hasattr(usage, "prompt_tokens_details") and usage.prompt_tokens_details is not None:
                cached_tokens = getattr(usage.prompt_tokens_details, "cached_tokens", 0)

        input_cost = ((prompt_tokens - cached_tokens) * 0.15 + cached_tokens * 0.075) / 1_000_000
        output_cost = (completion_tokens * 0.60) / 1_000_000
        total_cost = input_cost + output_cost

        stats = {
            "turn": turn_idx + 1,
            "type": "Baseline",
            "prompt_tokens": prompt_tokens,
            "cached_tokens": cached_tokens,
            "completion_tokens": completion_tokens,
            "ttft_ms": round(ttft, 2),
            "total_ms": round(total_time, 2),
            "cost_usd": round(total_cost, 7),
        }
        return stats, response_text

    async def run_turn_optimized(turn_idx: int, history: list[dict], query: str, context: str) -> tuple[dict, str]:
        system_prompt = build_system_prompt(context, MOCK_PROFILE, "Explain")
        static_prompt, dynamic_prompt = split_formatted_prompt(system_prompt)

        messages = [{"role": "system", "content": static_prompt}]
        for msg in history:
            messages.append({"role": msg["role"], "content": msg["content"]})
        if dynamic_prompt:
            messages.append({"role": "system", "content": dynamic_prompt})
        messages.append({"role": "user", "content": query})

        start_time = time.perf_counter()
        ttft = 0.0
        response_text_chunks = []

        stream = await client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, temperature=0.2, stream=True, stream_options={"include_usage": True}
        )

        usage = None
        async for chunk in stream:
            if len(chunk.choices) > 0:
                delta = chunk.choices[0].delta.content or ""
                if delta and ttft == 0.0:
                    ttft = (time.perf_counter() - start_time) * 1000
                response_text_chunks.append(delta)
            if hasattr(chunk, "usage") and chunk.usage is not None:
                usage = chunk.usage

        total_time = (time.perf_counter() - start_time) * 1000
        response_text = "".join(response_text_chunks)
        prompt_tokens = 0
        completion_tokens = 0
        cached_tokens = 0

        if usage is not None:
            prompt_tokens = usage.prompt_tokens
            completion_tokens = usage.completion_tokens
            if hasattr(usage, "prompt_tokens_details") and usage.prompt_tokens_details is not None:
                cached_tokens = getattr(usage.prompt_tokens_details, "cached_tokens", 0)

        input_cost = ((prompt_tokens - cached_tokens) * 0.15 + cached_tokens * 0.075) / 1_000_000
        output_cost = (completion_tokens * 0.60) / 1_000_000
        total_cost = input_cost + output_cost

        stats = {
            "turn": turn_idx + 1,
            "type": "Optimized",
            "prompt_tokens": prompt_tokens,
            "cached_tokens": cached_tokens,
            "completion_tokens": completion_tokens,
            "ttft_ms": round(ttft, 2),
            "total_ms": round(total_time, 2),
            "cost_usd": round(total_cost, 7),
        }
        return stats, response_text

    baseline_stats = []
    baseline_history = []
    for idx, turn in enumerate(CONVERSATION_TURNS):
        stats, response = await run_turn_baseline(idx, baseline_history, turn["query"], turn["context"])
        baseline_stats.append(stats)
        baseline_history.append({"role": "user", "content": turn["query"]})
        baseline_history.append({"role": "assistant", "content": response})
        await asyncio.sleep(0.5)

    await asyncio.sleep(1.0)

    optimized_stats = []
    optimized_history = []
    for idx, turn in enumerate(CONVERSATION_TURNS):
        stats, response = await run_turn_optimized(idx, optimized_history, turn["query"], turn["context"])
        optimized_stats.append(stats)
        optimized_history.append({"role": "user", "content": turn["query"]})
        optimized_history.append({"role": "assistant", "content": response})
        await asyncio.sleep(0.5)

    total_baseline_cost = sum(b["cost_usd"] for b in baseline_stats)
    total_opt_cost = sum(o["cost_usd"] for o in optimized_stats)
    savings_pct = round((1 - total_opt_cost / total_baseline_cost) * 100, 2) if total_baseline_cost > 0 else 0.0

    return {
        "baseline": baseline_stats,
        "optimized": optimized_stats,
        "summary": {
            "total_baseline_cost": round(total_baseline_cost, 7),
            "total_optimized_cost": round(total_opt_cost, 7),
            "savings_percentage": savings_pct,
        },
    }


@router.get("/student/mastery/history")
def get_student_mastery_history(
    student_id: UUID,
    course_id: UUID,
    concept_id: UUID,
    as_of: str | None = None,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    if user.role == "student" and student_id != user.id:
        raise HTTPException(status_code=403, detail="Sinh viên chỉ có quyền xem lịch sử năng lực của chính mình.")
    if as_of:
        try:
            target_time = datetime.fromisoformat(as_of)
        except Exception:
            raise HTTPException(
                status_code=400, detail="Định dạng tham số as_of không hợp lệ. Vui lòng gửi dạng ISO-8601."
            )

        mastery = db.get_student_mastery_as_of(student_id, course_id, concept_id, target_time)
        if not mastery:
            return []
        return [mastery]

    # If no as_of parameter, return all historical ranges from app.student_mastery_bitemporal
    if db._stub_mode or db.app_client is None:
        return [
            {
                "elo_score": 1200.0,
                "bkt_mastery_probability": 0.25,
                "mastery_state": "not_started",
                "weakness_flag": False,
                "attempt_count": 0,
                "correct_count": 0,
                "stability_days": 3.0,
                "valid_time": "[2026-06-24T00:00:00Z,)",
                "transaction_time": "[2026-06-24T00:00:00Z,)",
            }
        ]

    try:
        now_str = datetime.now(UTC).isoformat()
        response = (
            db.app_client.table("student_mastery_bitemporal")
            .select(
                "elo_score, bkt_mastery_probability, mastery_state, weakness_flag, attempt_count, correct_count, last_practiced_at, stability_days, valid_time, transaction_time"
            )
            .eq("student_id", str(student_id))
            .eq("course_id", str(course_id))
            .eq("concept_id", str(concept_id))
            .filter("transaction_time", "cs", f"[{now_str}, {now_str}]")
            .execute()
        )

        history = []
        for row in response.data or []:
            history.append(
                {
                    "elo_score": float(row["elo_score"]),
                    "bkt_mastery_probability": float(row["bkt_mastery_probability"]),
                    "mastery_state": row["mastery_state"],
                    "weakness_flag": row["weakness_flag"],
                    "attempt_count": row["attempt_count"],
                    "correct_count": row["correct_count"],
                    "stability_days": float(
                        row.get("stability_days") if row.get("stability_days") is not None else 3.0
                    ),
                    "last_practiced_at": row.get("last_practiced_at"),
                    "valid_time": row.get("valid_time"),
                    "transaction_time": row.get("transaction_time"),
                }
            )
        return history
    except Exception as e:
        logger.error(f"Lỗi khi lấy lịch sử năng lực: {e}")
        raise HTTPException(status_code=503, detail="Không thể tải lịch sử năng lực.")


class QuizReportRequest(BaseModel):
    question_id: str
    question_text: str
    selected_option: str | None = None
    error_type: str
    detail: str
    student_id: str | None = None
    course_id: str | None = None


class FeedbackRequest(BaseModel):
    target_type: str
    target_id: str
    feedback_type: str
    course_id: str
    comment: str | None = None
    metadata: dict | None = None


class FeedbackReviewUpdateRequest(BaseModel):
    course_id: str
    review_status: str
    note: str | None = None


@router.post("/feedback")
async def record_feedback(
    request: FeedbackRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
):
    import os

    from src.api.adaptive_routes import get_adaptive_db

    if request.target_type != "message":
        raise HTTPException(status_code=400, detail="Only message feedback is currently supported.")

    db = get_adaptive_db()
    payload = {
        "user_id": str(user.id),
        "course_id": request.course_id,
        "target_type": request.target_type,
        "target_id": request.target_id,
        "feedback_type": request.feedback_type,
        "comment": request.comment,
        "metadata": request.metadata or {},
        "timestamp": time.time(),
    }

    try:
        os.makedirs("outputs", exist_ok=True)
        with open("outputs/ai_response_feedback.jsonl", "a", encoding="utf-8") as file:
            file.write(json.dumps(payload, ensure_ascii=False) + "\n")
    except Exception as file_error:
        logger.error("Lỗi ghi file feedback AI response local: %s", file_error)

    result = record_ai_response_feedback(
        db,
        user_id=user.id,
        course_id=request.course_id,
        target_id=request.target_id,
        feedback_type=request.feedback_type,
        comment=request.comment,
        metadata=request.metadata or {},
    )

    return {
        "status": "success",
        "message": "Đã ghi nhận phản hồi cho câu trả lời AI.",
        **result,
    }


@router.get("/feedback/review-items")
async def get_feedback_review_items(
    course_id: str,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
):
    from src.api.adaptive_routes import get_adaptive_db

    db = get_adaptive_db()
    return list_ai_response_review_items(db, course_id=course_id)


@router.patch("/feedback/review-items/{target_id}")
async def update_feedback_review_item(
    target_id: str,
    request: FeedbackReviewUpdateRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
):
    from src.api.adaptive_routes import get_adaptive_db

    db = get_adaptive_db()
    result = review_ai_response_feedback(
        db,
        course_id=request.course_id,
        target_id=target_id,
        reviewer_id=user.id,
        review_status=request.review_status,
        note=request.note,
    )
    return {
        "status": "success",
        "item": result,
    }


class SurveyCreateRequest(BaseModel):
    set_id: str
    rating_pre: int | None = Field(default=None, ge=1, le=5)
    comment_pre: str | None = None
    email: str | None = None
    rating_understanding: int | None = Field(default=None, ge=1, le=5)
    rating_utility: int | None = Field(default=None, ge=1, le=5)
    rating_personalized: int | None = Field(default=None, ge=1, le=5)
    comment_post: str | None = None


class SurveyUpdateRequest(BaseModel):
    email: str | None = None
    rating_understanding: int | None = Field(default=None, ge=1, le=5)
    rating_utility: int | None = Field(default=None, ge=1, le=5)
    rating_personalized: int | None = Field(default=None, ge=1, le=5)
    comment_post: str | None = None


def get_public_supabase_client():
    from supabase import ClientOptions, create_client

    from src.services.supabase_config import get_backend_supabase_config

    supabase_config = get_backend_supabase_config(allow_stub=False)
    return create_client(
        supabase_config.url,
        supabase_config.secret_key,
        options=ClientOptions(schema="public"),
    )


def clean_survey_payload(payload: dict) -> dict:
    return {key: value for key, value in payload.items() if value is not None}


@router.post("/surveys")
async def create_survey_submission(
    request: SurveyCreateRequest,
    _: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
    public_client=Depends(get_public_supabase_client),
):
    payload = clean_survey_payload(request.model_dump())
    if not payload.get("set_id"):
        raise HTTPException(status_code=422, detail="set_id is required.")
    try:
        response = public_client.table("surveys").insert(payload).select("id").single().execute()
        if not response.data or "id" not in response.data:
            raise HTTPException(status_code=503, detail="Không thể lưu khảo sát lúc này.")
        return {"id": str(response.data["id"])}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Lỗi tạo survey submission: %s", exc, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể lưu khảo sát lúc này.")


@router.patch("/surveys/{submission_id}")
async def update_survey_submission(
    submission_id: str,
    request: SurveyUpdateRequest,
    _: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
    public_client=Depends(get_public_supabase_client),
):
    payload = clean_survey_payload(request.model_dump())
    if not payload:
        raise HTTPException(status_code=422, detail="Không có dữ liệu khảo sát để cập nhật.")
    try:
        public_client.table("surveys").update(payload).eq("id", submission_id).execute()
        return {"id": submission_id}
    except Exception as exc:
        logger.error("Lỗi cập nhật survey submission %s: %s", submission_id, exc, exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể cập nhật khảo sát lúc này.")


@router.post("/quiz/report")
async def report_quiz_error(
    request: QuizReportRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.get_current_user),
):
    import json
    import os

    from src.api.adaptive_routes import get_adaptive_db

    # Overwrite student_id from token to avoid spoofing
    if user.role == "student" or not request.student_id:
        request.student_id = str(user.id)

    report_dict = request.model_dump()
    report_dict["timestamp"] = time.time()

    # 1. Write to local file outputs/quiz_reports.jsonl for auditing
    try:
        os.makedirs("outputs", exist_ok=True)
        report_path = os.getenv("QUIZ_REPORT_AUDIT_PATH", "outputs/quiz_reports.jsonl")
        with open(report_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(report_dict, ensure_ascii=False) + "\n")
    except Exception as fe:
        logger.error(f"Lỗi ghi file báo cáo lỗi local: {fe}")

    db = get_adaptive_db()
    service_result = None
    service_error = None
    try:
        service_result = create_or_update_quiz_error_case(db, request, UUID(str(request.student_id)))
    except HTTPException as he:
        service_error = he
    except Exception as se:
        logger.error(f"Lỗi tạo hồ sơ báo lỗi quiz: {se}", exc_info=True)
        service_error = HTTPException(status_code=503, detail="Không thể ghi nhận hồ sơ báo lỗi quiz.")

    # 2. Insert into Supabase table feedback_events
    if not db._stub_mode and db.app_client is not None:
        try:
            user_id = request.student_id if request.student_id else None
            course_id = request.course_id if request.course_id else None

            feedback_data = {
                "target_type": "question",
                "target_id": request.question_id,
                "feedback_type": "incorrect",
                "comment": f"[{request.error_type}] {request.detail} | Câu hỏi: {request.question_text}",
            }
            if user_id:
                feedback_data["user_id"] = str(user_id)
            if course_id:
                feedback_data["course_id"] = str(course_id)

            db.app_client.table("feedback_events").insert(feedback_data).execute()
            logger.info("Đã lưu báo cáo lỗi kiến thức thành công lên Supabase")
        except Exception as se:
            logger.error(f"Lỗi lưu báo cáo lỗi lên Supabase: {se}", exc_info=True)
            raise HTTPException(status_code=503, detail="Không thể lưu báo cáo lỗi kiến thức.")

    legacy_only_details = {
        "Course not found.",
        "Question not found.",
        "Student not found.",
        "question_id must be a valid UUID.",
    }
    if service_error is not None and str(service_error.detail) in legacy_only_details:
        logger.info(
            "Báo cáo quiz được ghi nhận ở legacy audit nhưng chưa tạo mentor case: %s",
            service_error.detail,
        )
    elif service_error is not None:
        raise service_error

    logger.info(f"Ghi nhận báo cáo lỗi cho câu hỏi {request.question_id}: {request.error_type}")
    return {
        "status": "success",
        "message": "Báo cáo lỗi đã được ghi nhận thành công.",
        "case_id": service_result.get("case_id") if service_result else None,
    }


class IngestSlidesRequest(BaseModel):
    target_filter: str | None = None


@router.post("/ingest/slides", status_code=202)
def trigger_slide_ingestion(
    request: IngestSlidesRequest,
    background_tasks: BackgroundTasks,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
):
    """
    Kích hoạt nạp tài liệu/slide PDF dưới nền. Chỉ cho phép Mentor/Admin/Dev.
    """
    from src.pipeline.ingest.rag_ingestion import ingest_slides

    background_tasks.add_task(ingest_slides, request.target_filter)
    return {"status": "accepted", "message": "Tiến trình nạp slide đã được kích hoạt chạy nền."}


@router.get("/audit/decisions")
def get_audit_decisions(
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lấy danh sách log quyết định thuật toán thích ứng. Chỉ cho phép Admin/Dev.
    """
    if db._stub_mode or db.audit_client is None:
        return []

    try:
        response = db.audit_client.table("adaptive_decisions").select("*").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi truy xuất adaptive decisions log: {e}")
        raise HTTPException(status_code=503, detail="Không thể tải dữ liệu audit decisions.")


@router.get("/audit/rewards")
def get_audit_rewards(
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lấy danh sách log phần thưởng bandit. Chỉ cho phép Admin/Dev.
    """
    if db._stub_mode or db.audit_client is None:
        return []

    try:
        response = db.audit_client.table("adaptive_rewards").select("*").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi truy xuất adaptive rewards log: {e}")
        raise HTTPException(status_code=503, detail="Không thể tải dữ liệu audit rewards.")


class RagAuditRequest(BaseModel):
    query: str
    concept_id: str | None = None
    course_id: str | None = "00000000-0000-0000-0000-000000000001"
    match_threshold: float = 0.42
    match_count: int = 4


@router.post("/audit/rag-test")
async def audit_rag_test(
    request: RagAuditRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
):
    """
    Chạy thử nghiệm RAG thực tế phục vụ cho chức năng Audit Sandbox của Mentor.
    """
    from langchain_core.messages import HumanMessage, SystemMessage

    from src.services.citation_validator import CitationValidator
    from src.services.rag import RAGDependencyError, RAGService

    start_time = time.time()
    try:
        # 1. Truy hồi tài liệu
        rag_service = RAGService()
        slides = await rag_service.aretrieve_relevant_slides(
            query=request.query,
            match_threshold=request.match_threshold,
            match_count=request.match_count,
            course_id=request.course_id,
            concept_id=request.concept_id,
        )

        # 2. Xây dựng context học liệu
        formatted_context = rag_service.format_context(slides)

        # 3. Định hình prompt và gọi LLM giải thích theo kiểu Socratic
        from src.api.adaptive_routes import get_adaptive_db

        db = get_adaptive_db()
        concept_rule = None
        if request.concept_id and not db._stub_mode:
            try:
                rule_res = (
                    db.app_client.table("concept_rules")
                    .select("rule_text")
                    .eq("concept_id", request.concept_id)
                    .execute()
                )
                if rule_res.data and len(rule_res.data) > 0:
                    concept_rule = rule_res.data[0].get("rule_text")
            except Exception as re_err:
                logger.error(f"Lỗi khi lấy concept rule cho RAG test: {re_err}")

        profile = {
            "elo_score": 1200.0,
            "bkt_mastery_probability": 0.25,
            "weakness_flag": False,
            "active_quiz_session": False,
            "scaffolding_rules": "",
            "mode_instructions": "",
            "intent": "academic",
        }
        system_prompt = build_system_prompt(formatted_context, profile, "Explain")
        if concept_rule:
            system_prompt += f"\n\n[CHỈ DẪN ĐẶC BIỆT CỦA MENTOR CHO CHỦ ĐỀ NÀY - BẮT BUỘC TUÂN THỦ]:\n{concept_rule}"

        llm = get_llm()

        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=request.query),
        ]

        response = await llm.ainvoke(messages)
        response_text = response.content if hasattr(response, "content") else str(response)

        # 4. Xác thực trích dẫn
        validation = CitationValidator.validate_citations(
            response_text,
            slides,
            request.query,
            intent="academic",
        )

        latency_ms = int((time.time() - start_time) * 1000)

        # 5. Tính toán điểm tin cậy
        confidence_score = 0.92 if len(slides) > 0 else 0.54
        if len(slides) > 0 and validation.get("is_valid") is False:
            confidence_score = 0.70

        confidence = int(confidence_score * 100)

        # 6. Định dạng cấu trúc trả về
        citations_list = []
        for slide in slides:
            doc_name = slide.get("document_name", "").replace(".pdf", "").replace(".md", "")
            slide_num = slide.get("slide_number")
            citations_list.append(
                {
                    "title": doc_name,
                    "location": f"Slide {slide_num}" if slide_num else "Nguồn",
                    "excerpt": slide.get("content", "")[:150] + ("..." if len(slide.get("content", "")) > 150 else ""),
                    "image_url": slide.get("image_url"),
                    "raw_document_name": slide.get("document_name"),
                    "raw_slide_number": slide_num,
                    "full_content": slide.get("content", ""),
                }
            )

        return {
            "answer": validation.get("cleaned_text", response_text),
            "confidence": confidence,
            "latencyMs": latency_ms,
            "citations": citations_list,
        }
    except RAGDependencyError as e:
        logger.error(f"RAG dependency unavailable during audit test: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Kho học liệu RAG hiện không sẵn sàng.")
    except RuntimeError as e:
        if "LLM provider is not configured" in str(e):
            logger.error(f"LLM provider unavailable during audit test: {e}", exc_info=True)
            raise HTTPException(status_code=503, detail="LLM provider chưa được cấu hình.")
        logger.error(f"Lỗi trong quá trình chạy thử nghiệm RAG audit: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể chạy RAG Sandbox lúc này.")
    except Exception as e:
        logger.error(f"Lỗi trong quá trình chạy thử nghiệm RAG audit: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể chạy RAG Sandbox lúc này.")


@router.get("/concepts")
def get_concepts(
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lấy danh sách các concept tri thức từ DB để nạp động vào RAG Sandbox.
    """
    try:
        response = db.app_client.table("concepts").select("id,code,name,description").execute()
        return response.data or []
    except Exception as e:
        logger.error(f"Lỗi khi lấy danh sách concepts cho audit: {e}")
        raise HTTPException(status_code=503, detail="Không thể tải danh sách concept.")


# =====================================================================
# RAG Audit Interactive features (Mentor)
# =====================================================================


class SlideEmbeddingsUpdateRequest(BaseModel):
    document_name: str
    slide_number: int
    content: str


@router.patch("/audit/slide-embeddings")
async def update_slide_embeddings(
    request: SlideEmbeddingsUpdateRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
):
    """
    Cập nhật nội dung văn bản của một Slide và sinh lại vector embedding.
    """
    from supabase import ClientOptions, create_client

    from src.services.rag import RAGDependencyError, RAGService
    from src.services.supabase_config import get_backend_supabase_config

    # 1. Sinh lại vector embedding mới bằng model của RAGService
    rag_service = RAGService()
    try:
        embedding_vector = await rag_service.embeddings.aembed_query(request.content)
    except Exception as ee:
        logger.error(f"Lỗi khi sinh embedding cho slide: {ee}")
        if isinstance(ee, RAGDependencyError):
            raise HTTPException(status_code=503, detail="Không thể sinh embedding do RAG provider chưa sẵn sàng.")
        raise HTTPException(status_code=503, detail="Không thể sinh embedding lúc này.")

    # 2. Cập nhật dữ liệu vào bảng slide_embeddings ở schema public
    try:
        supabase_config = get_backend_supabase_config(allow_stub=False)
        public_client = create_client(
            supabase_config.url,
            supabase_config.secret_key,
            options=ClientOptions(schema="public"),
        )

        # Kiểm tra slide tồn tại
        res = (
            public_client.table("slide_embeddings")
            .select("document_name")
            .eq("document_name", request.document_name)
            .eq("slide_number", request.slide_number)
            .execute()
        )

        if not res.data:
            raise HTTPException(status_code=404, detail="Không tìm thấy slide tài liệu này trong database.")

        public_client.table("slide_embeddings").update({"content": request.content, "embedding": embedding_vector}).eq(
            "document_name", request.document_name
        ).eq("slide_number", request.slide_number).execute()

        # Xóa cache của RAG Service
        if hasattr(rag_service.cache, "clear"):
            try:
                # Nếu cache hỗ trợ clear hoặc xóa cụ thể thì chạy, nếu không thì đợi TTL tự hết hạn
                pass
            except Exception:
                pass

        return {"message": "Cập nhật slide và tính toán lại vector thành công."}
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Lỗi khi cập nhật slide_embeddings: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể cập nhật slide embedding.")


class ConceptRuleRequest(BaseModel):
    concept_id: str
    rule_text: str


@router.get("/audit/concept-rules/{concept_id}")
def get_concept_rule(
    concept_id: str,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lấy chỉ dẫn prompt tùy biến của Concept.
    """
    try:
        res = db.app_client.table("concept_rules").select("rule_text").eq("concept_id", concept_id).execute()
        rule_text = ""
        if res.data and len(res.data) > 0:
            rule_text = res.data[0].get("rule_text", "")
        return {"concept_id": concept_id, "rule_text": rule_text}
    except Exception as e:
        logger.error(f"Lỗi khi lấy concept rule: {e}")
        raise HTTPException(status_code=503, detail="Không thể tải luật prompt của chủ đề.")


@router.post("/audit/concept-rules")
def save_concept_rule(
    request: ConceptRuleRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lưu/Cập nhật chỉ dẫn prompt tùy biến của Concept.
    """
    try:
        res = db.app_client.table("concept_rules").select("id").eq("concept_id", request.concept_id).execute()
        if res.data and len(res.data) > 0:
            db.app_client.table("concept_rules").update(
                {"rule_text": request.rule_text, "updated_at": datetime.now(UTC).isoformat()}
            ).eq("concept_id", request.concept_id).execute()
        else:
            db.app_client.table("concept_rules").insert(
                {"concept_id": request.concept_id, "rule_text": request.rule_text}
            ).execute()
        return {"message": "Đã lưu luật prompt của chủ đề thành công."}
    except Exception as e:
        logger.error(f"Lỗi khi lưu concept rule: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể lưu luật prompt của chủ đề.")


class RAGEvalDatasetRequest(BaseModel):
    query: str
    concept_id: str | None = None
    original_answer: str
    gold_answer: str
    citations_json: list | None = None


@router.post("/audit/eval-dataset")
def save_eval_dataset(
    request: RAGEvalDatasetRequest,
    user: adaptive_routes.AuthenticatedUser = Depends(adaptive_routes.require_role(["mentor", "admin", "dev"])),
    db=Depends(adaptive_routes.get_adaptive_db),
):
    """
    Lưu cặp QA chuẩn phục vụ đánh giá RAG sau này.
    """
    try:
        db.app_client.table("rag_eval_dataset").insert(
            {
                "query": request.query,
                "concept_id": request.concept_id,
                "original_answer": request.original_answer,
                "gold_answer": request.gold_answer,
                "citations_json": request.citations_json,
            }
        ).execute()
        return {"message": "Đã lưu bộ câu hỏi - câu trả lời mẫu thành công."}
    except Exception as e:
        logger.error(f"Lỗi khi lưu ground truth eval dataset: {e}", exc_info=True)
        raise HTTPException(status_code=503, detail="Không thể lưu tập đánh giá.")
