from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field

ChatRole = Literal["user", "assistant", "system", "tool"]
ChatPartType = Literal["text", "image", "file"]
AccuracyMode = Literal["fast", "balanced", "strict"]
ProviderHint = Literal["openai", "gemini", "openrouter", "auto"]
StreamStage = Literal["route", "retrieve", "generate", "validate"]
StreamEventName = Literal[
    "status",
    "tool_call",
    "tool_result",
    "source_delta",
    "text_delta",
    "artifact",
    "validation",
    "done",
    "error",
]


class ChatPart(BaseModel):
    type: ChatPartType
    text: str | None = None
    url: str | None = None
    file_id: str | None = Field(default=None, alias="fileId")
    name: str | None = None
    mime_type: str | None = Field(default=None, alias="mimeType")


class AgentChatMessage(BaseModel):
    id: str | None = None
    role: ChatRole
    parts: list[ChatPart]
    created_at: str | None = Field(default=None, alias="createdAt")
    metadata: dict[str, Any] = Field(default_factory=dict)


class AgentChatContext(BaseModel):
    student_id: str = Field(alias="studentId")
    course_id: str = Field(alias="courseId")
    concept_id: str | None = Field(default=None, alias="conceptId")
    mode: str = "Explain"
    locale: str | None = None


class AgentChatOptions(BaseModel):
    stream: bool = True
    provider_hint: ProviderHint = Field(default="auto", alias="providerHint")
    latency_budget_ms: int | None = Field(default=None, alias="latencyBudgetMs")
    accuracy_mode: AccuracyMode = Field(default="balanced", alias="accuracyMode")


class AgentChatRequestV1(BaseModel):
    schema_version: Literal["agent-chat.v1"] = Field(default="agent-chat.v1", alias="schemaVersion")
    conversation_id: str | None = Field(default=None, alias="conversationId")
    client_message_id: str = Field(alias="clientMessageId")
    user_message: AgentChatMessage = Field(alias="userMessage")
    context: AgentChatContext
    options: AgentChatOptions = Field(default_factory=AgentChatOptions)


class RagSource(BaseModel):
    source_id: str | None = Field(default=None, alias="sourceId")
    document_name: str = Field(alias="documentName")
    slide_number: int | None = Field(default=None, alias="slideNumber")
    chunk_id: str | None = Field(default=None, alias="chunkId")
    content: str | None = None
    similarity: float | None = None
    retrieval_method: str | None = Field(default=None, alias="retrievalMethod")
    is_neighbor: bool = Field(default=False, alias="isNeighbor")
    image_url: str | None = Field(default=None, alias="imageUrl")
    confidence: Literal["low", "medium", "high"] | None = None


class CitationValidation(BaseModel):
    type: Literal["citation"] = "citation"
    is_valid: bool = Field(alias="isValid")
    valid_citations: list[tuple[str, int]] = Field(default_factory=list, alias="validCitations")
    invalid_citations: list[tuple[str, int]] = Field(default_factory=list, alias="invalidCitations")


class LegacyCitationValidation(BaseModel):
    is_valid: bool = Field(alias="is_valid")
    valid_citations: list[tuple[str, int]] = Field(default_factory=list, alias="valid_citations")
    invalid_citations: list[tuple[str, int]] = Field(default_factory=list, alias="invalid_citations")


class PedagogicalValidation(BaseModel):
    type: Literal["pedagogical"] = "pedagogical"
    is_valid: bool = Field(alias="isValid")
    feedback: str = ""


class ToolCallPayload(BaseModel):
    id: str
    name: str
    input: Any = None


class ToolResultPayload(BaseModel):
    id: str
    name: str
    output: Any = None
    duration_ms: float | None = Field(default=None, alias="durationMs")


class ChatArtifact(BaseModel):
    id: str
    type: str
    title: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class AgentChatMetadata(BaseModel):
    provider: str | None = None
    model: str | None = None
    mode: str | None = None
    intent: str | None = None
    timings_ms: dict[str, float] = Field(default_factory=dict, alias="timingsMs")
    token_usage: dict[str, int] = Field(default_factory=dict, alias="tokenUsage")


class AgentChatResponseV1(BaseModel):
    schema_version: Literal["agent-chat.v1"] = Field(default="agent-chat.v1", alias="schemaVersion")
    conversation_id: str | None = Field(default=None, alias="conversationId")
    message: AgentChatMessage
    sources: list[RagSource] = Field(default_factory=list)
    artifacts: list[ChatArtifact] = Field(default_factory=list)
    validation: list[CitationValidation | PedagogicalValidation] = Field(default_factory=list)
    metadata: AgentChatMetadata = Field(default_factory=AgentChatMetadata)


class AgentChatStreamEventV1(BaseModel):
    v: Literal[1] = 1
    seq: int = Field(ge=0)
    event: StreamEventName
    stage: StreamStage | None = None
    message: str | None = None
    id: str | None = None
    name: str | None = None
    input: Any = None
    output: Any = None
    duration_ms: float | None = Field(default=None, alias="durationMs")
    sources: list[RagSource] | None = None
    message_id: str | None = Field(default=None, alias="messageId")
    delta: str | None = None
    artifact: ChatArtifact | None = None
    result: CitationValidation | PedagogicalValidation | None = None
    response: AgentChatResponseV1 | None = None
    code: str | None = None
    retryable: bool | None = None


class StreamSequence:
    def __init__(self) -> None:
        self._seq = 0

    def next(self, event: StreamEventName, **payload: Any) -> AgentChatStreamEventV1:
        self._seq += 1
        return AgentChatStreamEventV1(seq=self._seq, event=event, **payload)

    def next_id(self, prefix: str) -> str:
        return f"{prefix}-{self._seq + 1}"


def rag_source_from_legacy_slide(slide: dict[str, Any]) -> RagSource:
    return RagSource(
        documentName=str(slide.get("document_name") or ""),
        slideNumber=slide.get("slide_number"),
        content=slide.get("content"),
        similarity=slide.get("similarity"),
        retrievalMethod="neighbor" if slide.get("is_neighbor") else "vector",
        isNeighbor=bool(slide.get("is_neighbor", False)),
        imageUrl=slide.get("image_url"),
    )


def citation_validation_from_legacy(value: dict[str, Any] | None) -> CitationValidation | None:
    if not value:
        return None
    legacy = LegacyCitationValidation.model_validate(value)
    return CitationValidation(
        isValid=legacy.is_valid,
        validCitations=legacy.valid_citations,
        invalidCitations=legacy.invalid_citations,
    )
