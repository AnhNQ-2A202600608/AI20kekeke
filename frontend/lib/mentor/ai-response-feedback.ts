import { getRequestAuthToken } from "@/lib/auth-token";

const FEEDBACK_PATH = "/api/v1/feedback";
const REVIEW_ITEMS_PATH = "/api/v1/feedback/review-items";

export type AiResponseFeedbackType = "helpful" | "unhelpful" | "incorrect" | "bad_citation" | "unsafe";
export type AiResponseReviewStatus = "pending" | "resolved" | "rejected" | "flagged";
export type AiResponseSentiment = "like" | "dislike";

export interface AiResponseCitation {
  source?: string;
  page?: number | string;
  context_snippet?: string;
}

export interface AiResponseFeedbackReport {
  id: string;
  feedback_type: AiResponseFeedbackType | string;
  sentiment?: AiResponseSentiment;
  issue_type?: string | null;
  issue_label?: string | null;
  comment: string;
  student_id?: string | null;
  student_name?: string | null;
  created_at?: string | null;
  session_id?: string | null;
}

export interface AiResponseReviewItem {
  id: string;
  target_id: string;
  course_id: string;
  status: AiResponseReviewStatus;
  sentiment: AiResponseSentiment;
  feedback_counts: Record<string, number>;
  report_count: number;
  latest_feedback_type: string;
  latest_issue_type?: string | null;
  latest_issue_label?: string | null;
  last_reported_at?: string | null;
  student_id?: string | null;
  student_name?: string | null;
  prompt_text?: string | null;
  response_text?: string | null;
  citations: AiResponseCitation[];
  confidence_score?: number | null;
  session_id?: string | null;
  mode?: string | null;
  review_note?: string | null;
  reports: AiResponseFeedbackReport[];
}

export interface AiResponseReviewListResponse {
  items: AiResponseReviewItem[];
  counts: Record<AiResponseReviewStatus | "all" | "like" | "dislike" | "total_feedback" | "like_rate" | "dislike_rate", number>;
}

export interface SubmitAiResponseFeedbackPayload {
  target_type: "message";
  target_id: string;
  feedback_type: AiResponseFeedbackType;
  course_id: string;
  comment?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateAiResponseReviewPayload {
  course_id: string;
  review_status: AiResponseReviewStatus;
  note?: string;
}

function authHeader(token?: string | null): HeadersInit {
  const { authToken } = getRequestAuthToken(token);
  return authToken ? { Authorization: `Bearer ${authToken}` } : {};
}

async function parseError(response: Response): Promise<Error> {
  try {
    const body = await response.json();
    return new Error(String(body?.detail || body?.message || response.statusText || "Request failed"));
  } catch {
    return new Error(response.statusText || "Request failed");
  }
}

export async function submitAiResponseFeedback(
  payload: SubmitAiResponseFeedbackPayload,
  token?: string | null,
): Promise<void> {
  const response = await fetch(FEEDBACK_PATH, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }
}

export async function fetchAiResponseReviewItems(
  courseId: string,
  token?: string | null,
): Promise<AiResponseReviewListResponse> {
  const searchParams = new URLSearchParams({ course_id: courseId });
  const response = await fetch(`${REVIEW_ITEMS_PATH}?${searchParams.toString()}`, {
    headers: authHeader(token),
    credentials: "same-origin",
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return response.json();
}

export async function updateAiResponseReviewItem(
  targetId: string,
  payload: UpdateAiResponseReviewPayload,
  token?: string | null,
): Promise<void> {
  const response = await fetch(`${REVIEW_ITEMS_PATH}/${targetId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseError(response);
  }
}
