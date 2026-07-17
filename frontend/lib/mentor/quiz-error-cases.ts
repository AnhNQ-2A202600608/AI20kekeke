import { getRequestAuthToken } from "@/lib/auth-token";

const QUIZ_ERROR_CASES_PATH = "/api/v1/quiz/error-cases";

export type QuizErrorCaseStatus = "new" | "in_progress" | "resolved" | "rejected";

export interface QuizErrorAnswerKey {
  correct?: string | null;
  correct_answer?: string | null;
  answer?: string | null;
  options?: Record<string, string> | string[] | null;
  choices?: Record<string, string> | string[] | null;
  explanation?: string | null;
  [key: string]: unknown;
}

export interface QuizErrorQuestion {
  id: string;
  prompt?: string | null;
  question_text?: string | null;
  question?: string | null;
  answer_key?: QuizErrorAnswerKey | null;
  options?: Record<string, string> | string[] | null;
  correct_answer?: string | null;
  answer?: string | null;
  explanation?: string | null;
  difficulty?: string | number | null;
  difficulty_elo?: number | null;
  [key: string]: unknown;
}

export interface QuizErrorReport {
  id: string;
  case_id: string;
  student_id?: string | null;
  selected_option?: string | null;
  error_type: string;
  detail: string;
  question_snapshot?: QuizErrorQuestion | Record<string, unknown> | null;
  created_at?: string | null;
}

export interface QuizErrorCaseListItem {
  id: string;
  course_id: string;
  question_id: string;
  status: QuizErrorCaseStatus;
  report_count: number;
  last_reported_at?: string | null;
  resolution_note?: string | null;
  question?: QuizErrorQuestion | null;
  reports?: QuizErrorReport[];
  most_common_error_type?: string | null;
}

export interface QuizErrorCaseDetailRaw {
  case: QuizErrorCaseListItem;
  question: QuizErrorQuestion | null;
  reports: QuizErrorReport[];
}

export interface QuizErrorCaseStatusResponse {
  case: QuizErrorCaseListItem;
}

export interface QuizErrorCaseQuestionResponse {
  case: QuizErrorCaseListItem;
  question: QuizErrorQuestion;
}

export interface QuizErrorCaseDetailNormalized extends QuizErrorCaseListItem {
  question: QuizErrorQuestion | null;
  reports: QuizErrorReport[];
}

export type QuizErrorCaseDetail = QuizErrorCaseDetailRaw | QuizErrorCaseDetailNormalized;

export interface QuizErrorCaseListResponse {
  items: QuizErrorCaseListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface QuizErrorCaseListParams {
  course_id?: string;
  status?: QuizErrorCaseStatus;
  search?: string;
  error_type?: string;
  limit?: number;
  offset?: number;
}

export interface QuizErrorCaseStatusPayload {
  status: QuizErrorCaseStatus;
  resolution_note?: string;
}

export interface QuizErrorQuestionPayload {
  question_text: string;
  options: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correct_answer: "A" | "B" | "C" | "D";
  explanation?: string;
  difficulty?: string | number;
}

export class QuizErrorCaseApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "QuizErrorCaseApiError";
    this.status = status;
  }
}

function authHeader(token?: string | null): HeadersInit {
  const { authToken } = getRequestAuthToken(token);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

function buildQueryString(params?: QuizErrorCaseListParams): string {
  if (!params) return "";

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
}

async function parseQuizErrorCaseError(response: Response): Promise<QuizErrorCaseApiError> {
  let message = `Quiz error cases API failed with status ${response.status}`;

  try {
    const body = await response.json();
    const detailMessage = typeof body?.detail === "object"
      ? body.detail?.message || JSON.stringify(body.detail)
      : body?.detail;
    message = String(detailMessage || body?.message || body?.error || message);
  } catch {
    message = response.statusText || message;
  }

  return new QuizErrorCaseApiError(message, response.status);
}

async function fetchJson<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  if (!response.ok) throw await parseQuizErrorCaseError(response);
  return response.json();
}

export function normalizeQuizErrorCaseDetail(
  detail: QuizErrorCaseDetail | QuizErrorCaseStatusResponse | QuizErrorCaseQuestionResponse,
): QuizErrorCaseDetailNormalized {
  if ("case" in detail) {
    return {
      ...detail.case,
      question: "question" in detail ? detail.question : detail.case.question ?? null,
      reports: "reports" in detail ? detail.reports : detail.case.reports ?? [],
    };
  }

  return {
    ...detail,
    question: detail.question ?? null,
    reports: detail.reports ?? [],
  };
}

export async function fetchQuizErrorCases(
  params?: QuizErrorCaseListParams,
  token?: string | null,
): Promise<QuizErrorCaseListResponse> {
  return fetchJson<QuizErrorCaseListResponse>(
    `${QUIZ_ERROR_CASES_PATH}${buildQueryString(params)}`,
    {
      headers: authHeader(token),
      cache: "no-store",
    },
  );
}

export async function fetchQuizErrorCaseDetail(
  caseId: string,
  token?: string | null,
): Promise<QuizErrorCaseDetail> {
  return fetchJson<QuizErrorCaseDetail>(`${QUIZ_ERROR_CASES_PATH}/${caseId}`, {
    headers: authHeader(token),
    cache: "no-store",
  });
}

export async function updateQuizErrorCaseStatus(
  caseId: string,
  payload: QuizErrorCaseStatusPayload,
  token?: string | null,
): Promise<QuizErrorCaseStatusResponse> {
  return fetchJson<QuizErrorCaseStatusResponse>(`${QUIZ_ERROR_CASES_PATH}/${caseId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });
}

export async function updateQuizErrorCaseQuestion(
  caseId: string,
  payload: QuizErrorQuestionPayload,
  token?: string | null,
): Promise<QuizErrorCaseQuestionResponse> {
  return fetchJson<QuizErrorCaseQuestionResponse>(`${QUIZ_ERROR_CASES_PATH}/${caseId}/question`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });
}
