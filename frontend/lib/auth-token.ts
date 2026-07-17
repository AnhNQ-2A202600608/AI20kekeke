import { isDemoMode } from './demo-mode';

const decodeBase64UrlJson = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return JSON.parse(atob(padded));
};

export const isJwtToken = (token?: string | null) => Boolean(token && token.split('.').length === 3);

export const isDemoAuthToken = (token?: string | null) => Boolean(token?.startsWith('fake-jwt-token-'));

export const isJwtExpired = (token?: string | null) => {
  if (!isJwtToken(token)) return false;

  try {
    const payload = decodeBase64UrlJson(token!.split('.')[1]);
    if (typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

export const getRequestAuthToken = (
  token?: string | null,
) => {
  if (isDemoAuthToken(token) && !isDemoMode()) {
    return {
      authToken: undefined,
      usedExpiredToken: false,
      isAuthenticated: false,
      rejectedDemoToken: true,
    };
  }

  if (token && !isJwtExpired(token)) {
    return { authToken: token, usedExpiredToken: false, isAuthenticated: true, rejectedDemoToken: false };
  }

  return {
    authToken: undefined,
    usedExpiredToken: Boolean(token && isJwtExpired(token)),
    isAuthenticated: false,
    rejectedDemoToken: false,
  };
};
