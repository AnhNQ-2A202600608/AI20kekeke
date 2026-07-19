import { getRequestAuthToken, isDemoAuthToken } from "@/lib/auth-token";
import { isDemoMode } from "@/lib/demo-mode";

export const DEFAULT_ADAPTIVE_COURSE_ID = "cf76850d-0738-50c3-bf34-1c464fa3b4d3";

export interface AdaptiveRecommendation {
  decision_id: string;
  question_id: string;
  type: string;
  prompt: string;
  options?: Record<string, string>;
  answer?: string | null;
  explanation?: string | null;
  expected_answer?: string | null;
  evaluation_points?: string[];
  sfia_level?: string | null;
  competency?: string | null;
  hints?: Array<{ level: "light" | "medium" | "deep"; content: string }>;
  expected_success: number;
  expected_reward: number;
  question_difficulty_elo?: number | null;
  candidate_count?: number | null;
  concept_elo?: number | null;
  bkt_mastery_probability?: number | null;
}

export type AdaptiveStudentAnswer =
  | { selected_option: string }
  | { text: string }
  | { value: string | number }
  | Record<string, unknown>;

export interface AdaptiveSubmitResult {
  is_correct: boolean;
  actual_score: number;
  old_elo: number;
  new_elo: number;
  old_bkt: number;
  new_bkt: number;
  mastery_state: string;
  weakness_flag: boolean;
  bandit_reward: number;
  stability_days?: number;
  calculation_log?: {
    formula?: string;
    old_elo?: number;
    new_elo?: number;
    elo_delta?: number;
    question_difficulty_elo?: number;
    expected_success?: number;
    actual_score?: number;
    raw_score_delta?: number;
    hint_count?: number;
    hint_discount?: number;
    k_student?: number;
    used_ai_help?: boolean;
  } | null;
}

interface AdaptiveAuth {
  token?: string;
  studentId: string;
  setToken?: (token: string) => void;
}

interface RecommendParams extends AdaptiveAuth {
  courseId?: string;
  conceptId: string;
  excludedQuestionIds?: string[];
  setId?: string;
}

interface SubmitParams extends AdaptiveAuth {
  courseId?: string;
  conceptId: string;
  questionId: string | number;
  decisionId: string;
  studentAnswer: AdaptiveStudentAnswer;
  responseTimeMs: number;
  hintCount?: number;
  usedAiHelp?: boolean;
}

interface LogHintParams extends AdaptiveAuth {
  courseId?: string;
  questionId: string | number;
  decisionId: string;
  hintLevel: number;
}

export class AdaptiveApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdaptiveApiError";
    this.status = status;
  }
}

async function parseAdaptiveError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === "string") return payload.detail;
    if (payload?.detail) return JSON.stringify(payload.detail);
    if (typeof payload?.message === "string") return payload.message;
    if (typeof payload?.error === "string") return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Adaptive API failed with status ${response.status}`;
}

function getHeaders({ token, setToken }: AdaptiveAuth) {
  const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
  if (usedExpiredToken || rejectedDemoToken) {
    setToken?.("");
  }
  // Comment out to allow local development testing with fake token
  // if (isDemoMode() && isDemoAuthToken(authToken || token)) {
  //   throw new AdaptiveApiError("Demo mode đang dùng bộ câu cục bộ; không gọi adaptive backend bằng fake token.", 401);
  // }
  if (!authToken) {
    throw new AdaptiveApiError("Bạn cần đăng nhập lại để luyện tập thích ứng.", 401);
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
}

export async function recommendAdaptiveQuestion({
  token,
  studentId,
  setToken,
  courseId = DEFAULT_ADAPTIVE_COURSE_ID,
  conceptId,
  excludedQuestionIds = [],
  setId,
}: RecommendParams): Promise<AdaptiveRecommendation> {
  const response = await fetch("/api/v1/adaptive/recommend", {
    method: "POST",
    headers: getHeaders({ token, studentId, setToken }),
    credentials: "same-origin",
    body: JSON.stringify({
      student_id: studentId,
      course_id: courseId,
      concept_id: conceptId,
      excluded_question_ids: excludedQuestionIds,
      set_id: setId,
    }),
  });

  if (!response.ok) {
    throw new AdaptiveApiError(await parseAdaptiveError(response), response.status);
  }

  return response.json();
}

export async function submitAdaptiveAnswer({
  token,
  studentId,
  setToken,
  courseId = DEFAULT_ADAPTIVE_COURSE_ID,
  conceptId,
  questionId,
  decisionId,
  studentAnswer,
  responseTimeMs,
  hintCount = 0,
  usedAiHelp = false,
}: SubmitParams): Promise<AdaptiveSubmitResult> {
  const response = await fetch("/api/v1/adaptive/submit", {
    method: "POST",
    headers: getHeaders({ token, studentId, setToken }),
    credentials: "same-origin",
    body: JSON.stringify({
      student_id: studentId,
      course_id: courseId,
      concept_id: conceptId,
      question_id: String(questionId),
      decision_id: decisionId,
      student_answer: studentAnswer,
      response_time_ms: responseTimeMs,
      hint_count: hintCount,
      used_ai_help: usedAiHelp,
    }),
  });

  if (!response.ok) {
    throw new AdaptiveApiError(await parseAdaptiveError(response), response.status);
  }

  return response.json();
}

export async function logAdaptiveHintUsage({
  token,
  studentId,
  setToken,
  courseId = DEFAULT_ADAPTIVE_COURSE_ID,
  questionId,
  decisionId,
  hintLevel,
}: LogHintParams): Promise<{ id: string }> {
  const response = await fetch("/api/v1/adaptive/hints/log", {
    method: "POST",
    headers: getHeaders({ token, studentId, setToken }),
    credentials: "same-origin",
    body: JSON.stringify({
      student_id: studentId,
      course_id: courseId,
      question_id: String(questionId),
      decision_id: decisionId,
      hint_level: hintLevel,
    }),
  });

  if (!response.ok) {
    throw new AdaptiveApiError(await parseAdaptiveError(response), response.status);
  }

  return response.json();
}
