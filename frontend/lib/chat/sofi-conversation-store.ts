export type SofiConversationSurface =
  | 'global_chat'
  | 'quiz'
  | 'skill_graph'
  | 'learning_path'
  | 'mentor';

export interface SofiConversationRecord<TMessage = unknown, TSlide = unknown> {
  id: string;
  title: string;
  surface: SofiConversationSurface;
  studentId?: string | null;
  courseId?: string;
  conceptId?: string;
  sourceRef?: {
    type: 'node' | 'quiz_question' | 'day' | 'general';
    id: string;
    label: string;
  };
  messages: TMessage[];
  slides: TSlide[];
  lastMessagePreview: string;
  createdAt: number;
  updatedAt: number;
}

const STORE_KEY_PREFIX = 'edugap_sofi_conversations_v1';

const getStoreKey = (studentId?: string | null): string | null =>
  studentId ? `${STORE_KEY_PREFIX}_${studentId}` : null;

const isBrowser = () => typeof window !== 'undefined';

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readRecords = (studentId?: string | null): SofiConversationRecord[] => {
  if (!isBrowser()) return [];
  const key = getStoreKey(studentId);
  if (!key) return [];
  return safeParse<SofiConversationRecord[]>(window.localStorage.getItem(key), []);
};

const writeRecords = (records: SofiConversationRecord[], studentId?: string | null) => {
  if (!isBrowser()) return;
  const key = getStoreKey(studentId);
  if (!key) return;
  window.localStorage.setItem(key, JSON.stringify(records));
};

const getMessageText = (message: unknown) => {
  if (!message || typeof message !== 'object') return '';
  const text = (message as { text?: unknown }).text;
  return typeof text === 'string' ? text : '';
};

export const getSofiConversation = <TMessage = unknown, TSlide = unknown>(
  id: string,
  studentId?: string | null,
): SofiConversationRecord<TMessage, TSlide> | null => {
  const record = readRecords(studentId).find((item) => item.id === id);
  return (record as SofiConversationRecord<TMessage, TSlide> | undefined) || null;
};

export const listSofiConversations = <TMessage = unknown, TSlide = unknown>(options?: {
  surface?: SofiConversationSurface;
  studentId?: string | null;
}) => {
  const records = readRecords(options?.studentId)
    .filter((record) => (options?.surface ? record.surface === options.surface : true))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return records as SofiConversationRecord<TMessage, TSlide>[];
};

export const upsertSofiConversation = <TMessage = unknown, TSlide = unknown>(
  input: Omit<SofiConversationRecord<TMessage, TSlide>, 'createdAt' | 'updatedAt' | 'lastMessagePreview'> & {
    createdAt?: number;
    updatedAt?: number;
    lastMessagePreview?: string;
  },
) => {
  const now = Date.now();
  const records = readRecords(input.studentId);
  const existingIndex = records.findIndex((record) => record.id === input.id);
  const lastMessagePreview =
    input.lastMessagePreview ||
    [...input.messages].reverse().map(getMessageText).find(Boolean) ||
    input.title;
  const nextRecord: SofiConversationRecord = {
    ...input,
    messages: input.messages,
    slides: input.slides,
    lastMessagePreview,
    createdAt: input.createdAt || records[existingIndex]?.createdAt || now,
    updatedAt: input.updatedAt || now,
  };

  if (existingIndex >= 0) {
    records[existingIndex] = nextRecord;
  } else {
    records.unshift(nextRecord);
  }

  writeRecords(records.sort((a, b) => b.updatedAt - a.updatedAt), input.studentId);
  return nextRecord as SofiConversationRecord<TMessage, TSlide>;
};

export const deleteSofiConversation = (id: string, studentId?: string | null) => {
  writeRecords(readRecords(studentId).filter((record) => record.id !== id), studentId);
};
