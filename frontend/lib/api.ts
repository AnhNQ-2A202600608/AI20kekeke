export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

// Các kiểu dữ liệu này mô tả contract trả về từ backend
// để frontend đọc API rõ ràng và có type-check khi refactor.
export interface ApiErrorDetail {
  code: string;
  message: string;
  retryable: boolean;
  details: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: ApiErrorDetail | null;
  meta: {
    request_id: string;
    duration_ms: number;
  };
}

export interface SchemaProperty {
  type?: string;
  title?: string;
  description?: string;
  default?: unknown;
}

export interface Capability {
  id: string;
  name: string;
  description: string;
  input_schema?: {
    properties?: Record<string, SchemaProperty>;
  };
}

export interface UploadMeta {
  file_id: string;
  original_name: string;
  size_bytes: number;
}

export interface FileMeta extends UploadMeta {
  stored_name?: string;
  content_type?: string;
  checksum_sha256?: string;
  uploaded_at?: string;
}

export interface RunMeta {
  run_id: string;
  capability: string;
  status: string;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  artifact_ids?: string[];
  error?: string | null;
}

export interface ArtifactMeta {
  artifact_id: string;
  run_id: string;
  filename: string;
  content: string;
}

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function fetchApi<T = unknown>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  // Luôn đi qua API_URL chung để mọi page dùng cùng một cơ chế proxy/cấu hình.
  const response = await fetch(`${API_URL}${endpoint}`, options);

  if (!response.ok) {
    let errorBody: ApiResponse<unknown> | null = null;
    try {
      errorBody = (await response.json()) as ApiResponse<unknown>;
    } catch {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    throw new Error(errorBody.error?.message || `HTTP error! status: ${response.status}`);
  }

  const responseBody = (await response.json()) as ApiResponse<T>;
  // Backend có thể trả HTTP 200 nhưng success=false, nên vẫn cần chặn tại đây.
  if (!responseBody.success) {
    throw new Error(responseBody.error?.message || "Request failed");
  }
  return responseBody.data as T;
}
