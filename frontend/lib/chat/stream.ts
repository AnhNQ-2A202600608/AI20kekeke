import { useBoundStore } from '../../hooks/useBoundStore';
import { getRequestAuthToken } from '../auth-token';
import type {
  AgentChatResponseV1,
  AgentChatStreamEventV1,
  ChatCitation,
  ChatMetadata,
  ChatResult,
  ChatSlide,
  RagSource,
  StreamChatOptions,
} from './contracts';

export type {
  AgentChatRequestV1,
  AgentChatResponseV1,
  AgentChatStreamEventV1,
  ChatArtifact,
  ChatCitation,
  ChatMetadata,
  ChatPart,
  ChatResult,
  ChatSlide,
  RagSource,
  StreamChatOptions,
} from './contracts';

const DEFAULT_COURSE_ID = '00000000-0000-0000-0000-000000000001';

export function buildChatArtifacts(data: ChatResult): {
  slides: ChatSlide[];
  citations: ChatCitation[];
  confidenceScore?: number;
} {
  const metadata = data.metadata || {};
  const slides = metadata.retrieved_slides || [];
  const confidenceScore =
    metadata.confidence_score !== undefined
      ? metadata.confidence_score
      : slides.length > 0
        ? metadata.citation_validation?.is_valid === false
          ? 0.7
          : 0.92
        : undefined;

  let citations: ChatCitation[] = [];
  if (slides.length > 0) {
    citations = slides.map((slide) => ({
      source: slide.document_name.replace(/\.(md|pdf)$/i, ''),
      page: slide.slide_number,
      context_snippet: `${slide.content.substring(0, 150)}${slide.content.length > 150 ? '...' : ''}`,
    }));
  } else {
    const validCitations = metadata.citation_validation?.valid_citations || [];
    if (validCitations.length > 0) {
      citations = validCitations.map((cit) => ({
        source: cit[0],
        page: cit[1],
        context_snippet: 'Xem chi tiết trong slide bài giảng.',
      }));
    }
  }

  return { slides, citations, confidenceScore };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isV1StreamEvent(payload: unknown): payload is AgentChatStreamEventV1 {
  return isRecord(payload) && payload.v === 1 && typeof payload.event === 'string';
}

function stringProp(payload: unknown, ...keys: string[]): string {
  if (typeof payload === 'string') return payload;
  if (!isRecord(payload)) return '';
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string') return value;
  }
  return '';
}

function unknownProp(payload: unknown, ...keys: string[]): unknown {
  if (!isRecord(payload)) return null;
  for (const key of keys) {
    if (key in payload) return payload[key];
  }
  return null;
}

function numberProp(payload: unknown, ...keys: string[]): number | undefined {
  if (!isRecord(payload)) return undefined;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'number') return value;
  }
  return undefined;
}

function sourceToSlide(source: RagSource): ChatSlide {
  return {
    document_name: source.documentName,
    slide_number: source.slideNumber ?? 0,
    content: source.content ?? '',
    similarity: source.similarity ?? 0,
    image_url: source.imageUrl,
  };
}

function responseTextFromV1(response: AgentChatResponseV1): string {
  return response.message.parts
    .filter((part) => part.type === 'text' && part.text)
    .map((part) => part.text)
    .join('');
}

function v1MetadataToLegacy(response: AgentChatResponseV1): ChatMetadata {
  const citationValidation = response.validation?.find((item) => item.type === 'citation');
  return {
    ...(response.metadata || {}),
    retrieved_slides: response.sources?.map(sourceToSlide) || [],
    artifacts: response.artifacts || [],
    validation: response.validation || [],
    citation_validation:
      citationValidation?.type === 'citation'
        ? {
            is_valid: citationValidation.isValid,
            valid_citations: citationValidation.validCitations || [],
            invalid_citations: citationValidation.invalidCitations || [],
          }
        : undefined,
  };
}

function v1ResponseToChatResult(response: AgentChatResponseV1): ChatResult {
  return {
    response: responseTextFromV1(response),
    conversationId: response.conversationId,
    metadata: v1MetadataToLegacy(response),
  };
}

async function readStreamEvents(
  response: Response,
  options: StreamChatOptions,
): Promise<ChatResult> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Response body is not readable');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let finalPayload: ChatResult | null = null;

  // --- Token batching: accumulate tokens and flush via rAF to avoid per-token re-renders ---
  let tokenBatch = '';
  let rafId: number | null = null;

  const flushTokenBatch = () => {
    rafId = null;
    if (tokenBatch && options.onDelta) {
      options.onDelta(tokenBatch);
      tokenBatch = '';
    }
  };

  const scheduleFlush = () => {
    if (typeof requestAnimationFrame !== 'undefined') {
      if (rafId === null) {
        rafId = requestAnimationFrame(flushTokenBatch);
      }
    } else {
      // SSR / Node fallback: flush synchronously
      flushTokenBatch();
    }
  };

  const flushEvent = (rawEvent: string) => {
    const lines = rawEvent.replace(/\r\n/g, '\n').split('\n');
    let eventType = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    const payloadText = dataLines.join('\n').trim();
    if (!payloadText) return;

    let payload: unknown = payloadText;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      // keep raw string
    }

    if (isV1StreamEvent(payload)) {
      if (payload.event === 'text_delta') {
        if (payload.delta) {
          tokenBatch += payload.delta;
          scheduleFlush();
        }
        return;
      }

      if (payload.event === 'status') {
        if (payload.message) {
          options.onThinking?.(payload.message);
        }
        return;
      }

      if (payload.event === 'source_delta') {
        const slides = payload.sources?.map(sourceToSlide) || [];
        options.onMeta?.({ response: '', metadata: { retrieved_slides: slides } });
        return;
      }

      if (payload.event === 'tool_call') {
        options.onToolCall?.({ toolName: payload.name || '', args: payload.input ?? null });
        return;
      }

      if (payload.event === 'tool_result') {
        options.onToolResult?.({
          toolName: payload.name || '',
          output: payload.output ?? null,
          durationMs: payload.durationMs,
        });
        return;
      }

      if (payload.event === 'artifact') {
        if (payload.artifact) {
          options.onMeta?.({ response: '', metadata: { artifacts: [payload.artifact] } });
        }
        return;
      }

      if (payload.event === 'validation') {
        if (payload.result) {
          options.onMeta?.({ response: '', metadata: { validation: [payload.result] } });
        }
        return;
      }

      if (payload.event === 'done') {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
          flushTokenBatch();
        }
        finalPayload = payload.response ? v1ResponseToChatResult(payload.response) : { response: '' };
        return;
      }

      if (payload.event === 'error') {
        if (rafId !== null) cancelAnimationFrame(rafId);
        throw new Error(payload.message || payload.code || 'Chat stream error');
      }
    }

    if (eventType === 'token') {
      const delta = stringProp(payload, 'delta', 'text');
      if (delta) {
        // Accumulate into batch instead of calling onDelta immediately
        tokenBatch += delta;
        scheduleFlush();
      }
      return;
    }

    if (eventType === 'thinking') {
      const text = stringProp(payload, 'text', 'thinking');
      if (text) {
        options.onThinking?.(text);
      }
      return;
    }

    if (eventType === 'tool_call') {
      const toolName = stringProp(payload, 'tool_name', 'toolName', 'name');
      const args = unknownProp(payload, 'arguments', 'args', 'input');
      options.onToolCall?.({ toolName, args });
      return;
    }

    if (eventType === 'tool_result') {
      const toolName = stringProp(payload, 'tool_name', 'toolName', 'name');
      const output = unknownProp(payload, 'output', 'result');
      const durationMs = numberProp(payload, 'execution_time_ms', 'duration_ms', 'durationMs');
      options.onToolResult?.({ toolName, output, durationMs });
      return;
    }

    if (eventType === 'analysis') {
      // Flush pending tokens before meta event so order is preserved
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        flushTokenBatch();
      }
      const normalized =
        typeof payload === 'string'
          ? { response: '', analysis: payload }
          : ({ response: '', ...(isRecord(payload) ? payload : {}) } as ChatResult);
      options.onMeta?.(normalized);
      return;
    }

    if (eventType === 'done') {
      // Flush any remaining tokens before done
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        flushTokenBatch();
      }
      finalPayload = typeof payload === 'string' ? { response: payload } : (payload as ChatResult);
      return;
    }

    if (eventType === 'error') {
      if (rafId !== null) cancelAnimationFrame(rafId);
      const message = stringProp(payload, 'error', 'message') || 'Chat stream error';
      throw new Error(message);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, '\n');

    let boundaryIndex = buffer.indexOf('\n\n');
    while (boundaryIndex !== -1) {
      const rawEvent = buffer.slice(0, boundaryIndex).trim();
      buffer = buffer.slice(boundaryIndex + 2);
      if (rawEvent) {
        flushEvent(rawEvent);
      }
      boundaryIndex = buffer.indexOf('\n\n');
    }
  }

  // Flush any remaining buffer and pending token batch
  buffer += decoder.decode();
  if (buffer.trim()) {
    flushEvent(buffer.trim());
  }
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    flushTokenBatch();
  }

  return finalPayload || { response: '' };
}

async function parseChatError(response: Response) {
  try {
    const payload = await response.clone().json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Fall through to the text/status fallback.
  }

  const errorText = await response.text().catch(() => '');
  return errorText || `Chat request failed with status ${response.status}`;
}

export async function streamChatRequest(
  payload: Record<string, unknown>,
  options: StreamChatOptions = {},
): Promise<ChatResult> {
  const token = useBoundStore.getState().token;
  const studentId = useBoundStore.getState().userId;
  const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
  if (usedExpiredToken || rejectedDemoToken) {
    useBoundStore.getState().setToken('');
  }
  if (!authToken || !studentId) {
    throw new Error('Bạn cần đăng nhập lại để dùng trợ lý AI.');
  }
  const requestBody = {
    course_id: DEFAULT_COURSE_ID,
    ...payload,
    student_id: studentId,
    ...(options.protocolVersion === 'v1' ? { schemaVersion: 'agent-chat.v1' } : {}),
    stream: true,
  };
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...(options.protocolVersion === 'v1' ? { 'X-Agent-Chat-Protocol': 'v1' } : {}),
  };
  const response = await fetch('/api/v1/chat', {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    body: JSON.stringify(requestBody),
  });
  if (response.status === 401 && token) {
    useBoundStore.getState().setToken('');
  }

  const contentType = response.headers.get('content-type') || '';

  if (!response.ok) {
    throw new Error(await parseChatError(response));
  }

  if (!response.body || !contentType.includes('text/event-stream')) {
    const data = (await response.json()) as ChatResult;
    if (data.response) {
      options.onDelta?.(data.response);
    }
    options.onDone?.(data);
    return data;
  }

  const result = await readStreamEvents(response, options);
  options.onDone?.(result);
  return result;
}
