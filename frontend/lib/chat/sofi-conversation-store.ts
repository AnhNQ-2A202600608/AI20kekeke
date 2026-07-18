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

const STORE_KEY = 'mentora_sofi_conversations_v1';

const isBrowser = () => typeof window !== 'undefined';

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const readRecords = (): SofiConversationRecord[] => {
  if (!isBrowser()) return [];
  return safeParse<SofiConversationRecord[]>(window.localStorage.getItem(STORE_KEY), []);
};

const writeRecords = (records: SofiConversationRecord[]) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORE_KEY, JSON.stringify(records));
};

const getMessageText = (message: unknown) => {
  if (!message || typeof message !== 'object') return '';
  const text = (message as { text?: unknown }).text;
  return typeof text === 'string' ? text : '';
};

export const getSofiConversation = <TMessage = unknown, TSlide = unknown>(
  id: string,
): SofiConversationRecord<TMessage, TSlide> | null => {
  const record = readRecords().find((item) => item.id === id);
  return (record as SofiConversationRecord<TMessage, TSlide> | undefined) || null;
};

export const listSofiConversations = <TMessage = unknown, TSlide = unknown>(options?: {
  surface?: SofiConversationSurface;
  studentId?: string | null;
}) => {
  const records = readRecords()
    .filter((record) => (options?.surface ? record.surface === options.surface : true))
    .filter((record) => (options?.studentId ? record.studentId === options.studentId : true))
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
  const records = readRecords();
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

  writeRecords(records.sort((a, b) => b.updatedAt - a.updatedAt));
  return nextRecord as SofiConversationRecord<TMessage, TSlide>;
};

export const deleteSofiConversation = (id: string) => {
  writeRecords(readRecords().filter((record) => record.id !== id));
};
