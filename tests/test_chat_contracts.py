import json

from src.api.routes import sse_v1_event
from src.models.chat_contracts import (
    AgentChatMessage,
    AgentChatRequestV1,
    AgentChatResponseV1,
    ChatPart,
    RagSource,
    StreamSequence,
    rag_source_from_legacy_slide,
)


def test_agent_chat_request_v1_serializes_aliases():
    request = AgentChatRequestV1(
        clientMessageId="client-1",
        userMessage=AgentChatMessage(role="user", parts=[ChatPart(type="text", text="Explain RAG")]),
        context={
            "studentId": "student-1",
            "courseId": "course-1",
            "conceptId": "concept-1",
            "mode": "Explain",
        },
        options={"accuracyMode": "strict", "providerHint": "auto"},
    )

    payload = request.model_dump(by_alias=True, exclude_none=True)

    assert payload["schemaVersion"] == "agent-chat.v1"
    assert payload["clientMessageId"] == "client-1"
    assert payload["userMessage"]["parts"][0]["text"] == "Explain RAG"
    assert payload["context"]["studentId"] == "student-1"
    assert payload["options"]["accuracyMode"] == "strict"


def test_rag_source_from_legacy_slide_normalizes_shape():
    source = rag_source_from_legacy_slide(
        {
            "document_name": "day-08-rag.pdf",
            "slide_number": 12,
            "content": "Hybrid retrieval combines vector and keyword search.",
            "similarity": 0.81,
            "image_url": "https://example.test/slide.png",
            "is_neighbor": True,
        }
    )

    payload = source.model_dump(by_alias=True, exclude_none=True)

    assert payload == {
        "documentName": "day-08-rag.pdf",
        "slideNumber": 12,
        "content": "Hybrid retrieval combines vector and keyword search.",
        "similarity": 0.81,
        "retrievalMethod": "neighbor",
        "isNeighbor": True,
        "imageUrl": "https://example.test/slide.png",
    }


def test_stream_sequence_and_sse_v1_event_shape():
    sequence = StreamSequence()
    status = sequence.next("status", stage="route", message="Đang xác định phạm vi câu hỏi...")
    text = sequence.next("text_delta", messageId="assistant-1", delta="RAG là")

    assert status.seq == 1
    assert text.seq == 2

    raw = sse_v1_event(text)
    lines = raw.strip().splitlines()

    assert lines[0] == "event: text_delta"
    assert lines[1].startswith("data: ")

    data = json.loads(lines[1].removeprefix("data: "))
    assert data == {
        "v": 1,
        "seq": 2,
        "event": "text_delta",
        "messageId": "assistant-1",
        "delta": "RAG là",
    }


def test_agent_chat_response_v1_can_carry_sources_and_final_message():
    response = AgentChatResponseV1(
        conversationId="conversation-1",
        message=AgentChatMessage(
            id="assistant-1",
            role="assistant",
            parts=[ChatPart(type="text", text="RAG kết hợp truy xuất và sinh câu trả lời.")],
        ),
        sources=[RagSource(documentName="day-08-rag.pdf", slideNumber=3, similarity=0.9)],
        metadata={"intent": "academic", "timingsMs": {"total": 1200.0}},
    )

    payload = response.model_dump(by_alias=True, exclude_none=True)

    assert payload["schemaVersion"] == "agent-chat.v1"
    assert payload["conversationId"] == "conversation-1"
    assert payload["message"]["parts"][0]["text"] == "RAG kết hợp truy xuất và sinh câu trả lời."
    assert payload["sources"][0]["documentName"] == "day-08-rag.pdf"
    assert payload["metadata"]["timingsMs"]["total"] == 1200.0
