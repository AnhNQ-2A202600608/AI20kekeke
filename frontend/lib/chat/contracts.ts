export type ChatRole = 'user' | 'assistant' | 'system' | 'tool';
export type AccuracyMode = 'fast' | 'balanced' | 'strict';
export type ProviderHint = 'openai' | 'gemini' | 'openrouter' | 'auto';
export type StreamStage = 'route' | 'retrieve' | 'generate' | 'validate';

export interface ChatPart {
  type: 'text' | 'image' | 'file';
  text?: string;
  url?: string;
  fileId?: string;
  name?: string;
  mimeType?: string;
}

export interface AgentChatMessage {
  id?: string;
  role: ChatRole;
  parts: ChatPart[];
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AgentChatContext {
  studentId: string;
  courseId: string;
  conceptId?: string;
  mode: string;
  locale?: string;
}

export interface AgentChatOptions {
  stream?: boolean;
  providerHint?: ProviderHint;
  latencyBudgetMs?: number;
  accuracyMode?: AccuracyMode;
}

export interface AgentChatRequestV1 {
  schemaVersion: 'agent-chat.v1';
  conversationId?: string;
  clientMessageId: string;
  userMessage: AgentChatMessage;
  context: AgentChatContext;
  options?: AgentChatOptions;
}

export interface ChatSlide {
  document_name: string;
  slide_number: number;
  content: string;
  similarity: number;
  image_url?: string;
}

export interface RagSource {
  sourceId?: string;
  documentName: string;
  slideNumber?: number;
  chunkId?: string;
  content?: string;
  similarity?: number;
  retrievalMethod?: string;
  isNeighbor?: boolean;
  imageUrl?: string;
  confidence?: 'low' | 'medium' | 'high';
}

export interface CitationValidation {
  type: 'citation';
  isValid: boolean;
  validCitations?: Array<[string, number]>;
  invalidCitations?: Array<[string, number]>;
}

export interface PedagogicalValidation {
  type: 'pedagogical';
  isValid: boolean;
  feedback?: string;
}

export interface ChatArtifact {
  id: string;
  type: string;
  title?: string;
  data?: Record<string, unknown>;
}

export interface AgentChatMetadata {
  provider?: string;
  model?: string;
  mode?: string;
  intent?: string;
  timingsMs?: Record<string, number>;
  tokenUsage?: Record<string, number>;
}

export interface AgentChatResponseV1 {
  schemaVersion: 'agent-chat.v1';
  conversationId?: string;
  message: AgentChatMessage;
  sources?: RagSource[];
  artifacts?: ChatArtifact[];
  validation?: Array<CitationValidation | PedagogicalValidation>;
  metadata?: AgentChatMetadata;
}

export type AgentChatStreamEventV1 =
  | { v: 1; seq: number; event: 'status'; stage?: StreamStage; message?: string }
  | { v: 1; seq: number; event: 'tool_call'; id?: string; name?: string; input?: unknown }
  | { v: 1; seq: number; event: 'tool_result'; id?: string; name?: string; output?: unknown; durationMs?: number }
  | { v: 1; seq: number; event: 'source_delta'; sources?: RagSource[] }
  | { v: 1; seq: number; event: 'text_delta'; messageId?: string; delta?: string }
  | { v: 1; seq: number; event: 'artifact'; artifact?: ChatArtifact }
  | { v: 1; seq: number; event: 'validation'; result?: CitationValidation | PedagogicalValidation }
  | { v: 1; seq: number; event: 'done'; response?: AgentChatResponseV1 }
  | { v: 1; seq: number; event: 'error'; code?: string; message?: string; retryable?: boolean };

export interface ChatCitation {
  source: string;
  page?: number | string;
  context_snippet: string;
}

export interface ChatMetadata {
  retrieved_slides?: ChatSlide[];
  confidence_score?: number;
  citation_validation?: {
    is_valid?: boolean;
    valid_citations?: Array<[string, number]>;
    invalid_citations?: Array<[string, number]>;
  };
  artifacts?: ChatArtifact[];
  validation?: Array<CitationValidation | PedagogicalValidation>;
  [key: string]: unknown;
}

export interface ChatResult {
  response: string;
  analysis?: string;
  metadata?: ChatMetadata;
  session_id?: string | null;
  conversationId?: string;
}

export interface StreamChatOptions {
  protocolVersion?: 'legacy' | 'v1';
  onDelta?: (delta: string) => void;
  onMeta?: (payload: ChatResult) => void;
  onDone?: (payload: ChatResult) => void;
  onThinking?: (text: string) => void;
  onToolCall?: (toolCall: { toolName: string; args: unknown }) => void;
  onToolResult?: (toolResult: { toolName: string; output: unknown; durationMs?: number }) => void;
}
