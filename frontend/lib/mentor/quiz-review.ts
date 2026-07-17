import { getRequestAuthToken } from "@/lib/auth-token";
import { QuestionPublishedStatus } from "@/lib/quiz/types";

const QUIZ_REVIEW_PATH = "/api/v1/quiz/review";

export interface QuizReviewHint {
  level: "light" | "medium" | "deep";
  content: string;
}

export interface QuizReviewQuestion {
  id: string | number;
  setId: string;
  sourceTitle: string;
  sourcePage: string;
  sourceExcerpt: string;
  question: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  answer: string;
  explanation: string;
  difficulty: "dễ" | "bình thường" | "khó";
  published_status: QuestionPublishedStatus;
  rejection_reason?: string | null;
  hints: QuizReviewHint[];
  concepts: string[];
}

export interface QuizReviewListResponse {
  items: QuizReviewQuestion[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuizReviewListParams {
  status?: string;
  source_document?: string;
  concept_code?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface QuizReviewContentPayload {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  explanation?: string;
  difficulty?: "dễ" | "bình thường" | "khó";
  hints: QuizReviewHint[];
  concept_codes: string[];
}

export interface QuizReviewStatusPayload {
  status: "draft" | "published" | "rejected";
  rejection_reason?: string;
}

export class QuizReviewApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "QuizReviewApiError";
    this.status = status;
  }
}

function authHeader(token?: string | null): HeadersInit {
  const { authToken } = getRequestAuthToken(token);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function buildQueryString(params?: QuizReviewListParams): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseQuizReviewError(response: Response): Promise<QuizReviewApiError> {
  let message = `Quiz review API failed with status ${response.status}`;

  try {
    const body = await response.json();
    const detailMessage = typeof body?.detail === "object"
      ? body.detail?.message || JSON.stringify(body.detail)
      : body?.detail;
    message = String(detailMessage || body?.message || body?.error || message);
  } catch {
    message = response.statusText || message;
  }

  return new QuizReviewApiError(message, response.status);
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await parseQuizReviewError(response);
  return response.json();
}

export async function fetchReviewQuestions(
  params?: QuizReviewListParams,
  token?: string | null,
): Promise<QuizReviewListResponse> {
  return fetchJson<QuizReviewListResponse>(
    `${QUIZ_REVIEW_PATH}${buildQueryString(params)}`,
    {
      headers: authHeader(token),
      cache: "no-store",
    },
  );
}

export async function fetchReviewQuestionDetail(
  questionId: string,
  token?: string | null,
): Promise<QuizReviewQuestion> {
  return fetchJson<QuizReviewQuestion>(`${QUIZ_REVIEW_PATH}/${questionId}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
}

export async function updateReviewQuestionContent(
  questionId: string,
  payload: QuizReviewContentPayload,
  token?: string | null,
): Promise<QuizReviewQuestion> {
  return fetchJson<QuizReviewQuestion>(`${QUIZ_REVIEW_PATH}/${questionId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });
}

export async function updateReviewQuestionStatus(
  questionId: string,
  payload: QuizReviewStatusPayload,
  token?: string | null,
): Promise<QuizReviewQuestion> {
  return fetchJson<QuizReviewQuestion>(`${QUIZ_REVIEW_PATH}/${questionId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });
}
