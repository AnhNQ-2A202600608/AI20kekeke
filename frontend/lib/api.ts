export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
    retryable: boolean;
    details: any;
  } | null;
  meta: {
    request_id: string;
    duration_ms: number;
  };
}

export async function fetchApi<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, options);
  
  if (!response.ok) {
    let errBody;
    try {
      errBody = await response.json();
    } catch {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (errBody && errBody.error) {
      throw new Error(errBody.error.message || errBody.error.code);
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const resJson: ApiResponse<T> = await response.json();
  if (!resJson.success) {
    throw new Error(resJson.error?.message || "Request failed");
  }
  return resJson.data as T;
}
