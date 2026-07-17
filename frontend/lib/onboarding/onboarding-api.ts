import {
  DiagnosticAnswerResponse,
  DiagnosticSessionState,
  OnboardingContextPayload,
  OnboardingCompleteResponse,
  OnboardingStatusResponse,
  OnboardingSubmitPayload,
} from './onboarding-contract';
import { getRequestAuthToken } from '../auth-token';

export type OnboardingApiErrorType = 'unauthorized' | 'offline' | 'invalid' | 'server';
const statusRequests = new Map<string, Promise<OnboardingStatusResponse>>();
const diagnosticStartRequests = new Map<string, Promise<DiagnosticSessionState>>();

export class OnboardingApiError extends Error {
  type: OnboardingApiErrorType;
  status?: number;

  constructor(type: OnboardingApiErrorType, message: string, status?: number) {
    super(message);
    this.name = 'OnboardingApiError';
    this.type = type;
    this.status = status;
  }
}

function authHeader(token?: string): Record<string, string> {
  const { authToken } = getRequestAuthToken(token);
  if (!authToken) {
    throw new OnboardingApiError('unauthorized', 'Bạn cần đăng nhập lại để tiếp tục onboarding.', 401);
  }
  return { Authorization: `Bearer ${authToken}` };
}

async function withTimeout<T>(request: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    return await request(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseError(response: Response): Promise<OnboardingApiError> {
  let message = 'Không thể kết nối onboarding.';
  try {
    const body = await response.json();
    message = body?.detail?.message || body?.detail || body?.message || body?.error || message;
  } catch {
    message = response.statusText || message;
  }

  if (response.status === 401 || response.status === 403) {
    return new OnboardingApiError('unauthorized', String(message), response.status);
  }
  if (response.status === 422 || response.status === 400) {
    return new OnboardingApiError('invalid', String(message), response.status);
  }
  if (response.status === 503) {
    return new OnboardingApiError('offline', String(message), response.status);
  }
  return new OnboardingApiError('server', String(message), response.status);
}

export async function getOnboardingStatus(token?: string): Promise<OnboardingStatusResponse> {
  try {
    const headers = authHeader(token);
    const requestKey = headers.Authorization as string;
    const existingRequest = statusRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await withTimeout((signal) => fetch('/api/v1/onboarding/status', {
        signal,
        headers,
        credentials: 'same-origin',
        cache: 'no-store',
      }));
      if (!response.ok) throw await parseError(response);
      return response.json() as Promise<OnboardingStatusResponse>;
    })();

    statusRequests.set(requestKey, requestPromise);
    const cleanupRequest = () => {
      if (statusRequests.get(requestKey) === requestPromise) {
        statusRequests.delete(requestKey);
      }
    };
    requestPromise.then(cleanupRequest, cleanupRequest);
    return requestPromise;
  } catch (error) {
    if (error instanceof OnboardingApiError) throw error;
    throw new OnboardingApiError('offline', 'Backend onboarding hiện không sẵn sàng.');
  }
}

export async function startOnboardingDiagnostic(
  payload: OnboardingContextPayload,
  token?: string,
): Promise<DiagnosticSessionState> {
  try {
    const headers = authHeader(token);
    const requestKey = `${headers.Authorization}:${JSON.stringify(payload)}`;
    const existingRequest = diagnosticStartRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest;
    }

    const requestPromise = (async () => {
      const response = await withTimeout((signal) => fetch('/api/v1/onboarding/diagnostic/start', {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      }));
      if (!response.ok) throw await parseError(response);
      return response.json() as Promise<DiagnosticSessionState>;
    })();

    diagnosticStartRequests.set(requestKey, requestPromise);
    const cleanupRequest = () => {
      if (diagnosticStartRequests.get(requestKey) === requestPromise) {
        diagnosticStartRequests.delete(requestKey);
      }
    };
    requestPromise.then(cleanupRequest, cleanupRequest);
    return requestPromise;
  } catch (error) {
    if (error instanceof OnboardingApiError) throw error;
    throw new OnboardingApiError('offline', 'Backend onboarding hiện không sẵn sàng.');
  }
}

export async function answerOnboardingDiagnostic(
  payload: {
    session_id: string;
    question_id: string;
    selected_option_id: string;
    response_time_ms?: number;
  },
  token?: string,
): Promise<DiagnosticAnswerResponse> {
  try {
    const headers = authHeader(token);
    const response = await withTimeout((signal) => fetch('/api/v1/onboarding/diagnostic/answer', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    }));
    if (!response.ok) throw await parseError(response);
    return response.json();
  } catch (error) {
    if (error instanceof OnboardingApiError) throw error;
    throw new OnboardingApiError('offline', 'Backend onboarding hiện không sẵn sàng.');
  }
}

export async function completeOnboarding(
  payload: OnboardingSubmitPayload,
  token?: string,
): Promise<OnboardingCompleteResponse> {
  try {
    const headers = authHeader(token);
    const response = await withTimeout((signal) => fetch('/api/v1/onboarding/complete', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    }));
    if (!response.ok) throw await parseError(response);
    return response.json();
  } catch (error) {
    if (error instanceof OnboardingApiError) throw error;
    throw new OnboardingApiError('offline', 'Backend onboarding hiện không sẵn sàng.');
  }
}
