export type AuthApiResponse = {
  id: string;
  email: string;
  full_name: string;
  mssv?: string | null;
  role: string;
  token: string;
};

export type TutorReply = {
  response: string;
  analysis?: string;
  metadata?: Record<string, unknown> | null;
  session_id?: string | null;
};

export class ApiClientError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function requestApi<T>(path: string, init: RequestInit) {
  let response: Response;

  try {
    response = await fetch(`/api/backend${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
    });
  } catch {
    throw new ApiClientError("Không thể kết nối tới máy chủ học tập. Hãy kiểm tra backend và thử lại.", 0);
  }

  const payload = await response.json().catch(() => ({})) as { detail?: string } & T;
  if (!response.ok) {
    throw new ApiClientError(payload.detail || "Yêu cầu chưa thể hoàn tất. Vui lòng thử lại.", response.status);
  }

  return payload as T;
}

export function loginWithPassword(email: string, password: string) {
  return requestApi<AuthApiResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerAccount(input: { email: string; password: string; fullName: string }) {
  return requestApi<AuthApiResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      password: input.password,
      full_name: input.fullName,
    }),
  });
}

export function askTutor(input: {
  token: string;
  studentId: string;
  message: string;
  sessionId?: string;
  courseId?: string;
  conceptId?: string;
  mode?: string;
}) {
  return requestApi<TutorReply>("/chat", {
    method: "POST",
    headers: { Authorization: `Bearer ${input.token}` },
    body: JSON.stringify({
      schemaVersion: "chat.v1",
      message: input.message,
      student_id: input.studentId,
      course_id: input.courseId,
      concept_id: input.conceptId,
      mode: input.mode || "Explain",
      stream: false,
      session_id: input.sessionId,
    }),
  });
}