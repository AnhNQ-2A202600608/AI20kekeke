import { createClient as createSupabaseBrowserClient } from '@/utils/supabase/client';

export interface AuthenticatedAppUser {
  id: string;
  email: string;
  full_name: string;
  mssv?: string | null;
  role: string;
  token?: string;
  is_demo_account?: boolean;
  demo_profile_key?: string | null;
}

async function parseAuthError(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Keep the fallback message.
  }
  return fallback;
}

export async function fetchAuthenticatedAppUser(accessToken?: string): Promise<AuthenticatedAppUser> {
  const response = await fetch('/api/v1/auth/me', {
    method: 'GET',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await parseAuthError(response, 'Không thể tải hồ sơ người dùng sau đăng nhập.'));
  }

  return response.json();
}

export async function signInWithSupabaseBrowser(
  email: string,
  password: string,
  options?: { onProfileFetchStart?: () => void },
): Promise<AuthenticatedAppUser> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message || 'Email hoặc mật khẩu không chính xác.');
  }

  const accessToken = data.session?.access_token;
  if (!accessToken) {
    throw new Error('Không nhận được phiên đăng nhập từ Supabase.');
  }

  options?.onProfileFetchStart?.();
  const profile = await fetchAuthenticatedAppUser(accessToken);
  return { ...profile, token: accessToken };
}

export async function signUpWithAppBackend({
  email,
  password,
  fullName,
  mssv,
}: {
  email: string;
  password: string;
  fullName: string;
  mssv?: string | null;
}): Promise<AuthenticatedAppUser> {
  const response = await fetch('/api/v1/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'same-origin',
    body: JSON.stringify({
      email,
      password,
      full_name: fullName,
      mssv: mssv || null,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseAuthError(response, 'Không thể tạo tài khoản. Vui lòng thử lại.'));
  }

  return response.json();
}

export async function signOutSupabaseBrowser() {
  try {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
  } catch {
    // Local app logout must still clear Zustand even if Supabase is not configured.
  }
}
