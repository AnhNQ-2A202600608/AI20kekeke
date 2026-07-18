'use client';

import { useCallback, useEffect, useState } from 'react';
import { getRequestAuthToken } from '@/lib/auth-token';
import type { BraintrustSummary } from './braintrust-observability-types';

const FRONTEND_CACHE_TTL_MS = 120_000;
const SUMMARY_LIMIT = 200;
const SUMMARY_RANGE = '24h';

let cachedBraintrustSummary: {
  token: string;
  summary: BraintrustSummary;
  fetchedAt: number;
} | null = null;
const braintrustRequests = new Map<string, Promise<BraintrustSummary>>();

function getCachedSummary(token: string) {
  if (!cachedBraintrustSummary || cachedBraintrustSummary.token !== token) {
    return null;
  }
  return cachedBraintrustSummary;
}

function isCacheFresh(token: string) {
  const cached = getCachedSummary(token);
  return Boolean(cached && Date.now() - cached.fetchedAt < FRONTEND_CACHE_TTL_MS);
}

async function parseBraintrustError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Braintrust API failed with status ${response.status}`;
}

async function requestBraintrustSummary(token: string, force: boolean) {
  const { authToken } = getRequestAuthToken(token);
  if (!authToken) {
    throw new Error('Bạn cần đăng nhập lại để xem Braintrust.');
  }

  const params = new URLSearchParams({
    limit: String(SUMMARY_LIMIT),
    range: SUMMARY_RANGE,
  });
  const endpoint = force ? 'refresh' : 'summary';
  const requestKey = `${authToken}:${endpoint}:${params.toString()}`;
  const existingRequest = braintrustRequests.get(requestKey);
  if (existingRequest) {
    return existingRequest;
  }

  const requestPromise = (async () => {
    const response = await fetch(`/api/v1/admin/braintrust/${endpoint}?${params.toString()}`, {
      method: force ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${authToken}` },
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) {
      throw new Error(await parseBraintrustError(response));
    }
    return response.json() as Promise<BraintrustSummary>;
  })();

  braintrustRequests.set(requestKey, requestPromise);
  const cleanupRequest = () => {
    if (braintrustRequests.get(requestKey) === requestPromise) {
      braintrustRequests.delete(requestKey);
    }
  };
  requestPromise.then(cleanupRequest, cleanupRequest);

  return requestPromise;
}

export function useBraintrustSummary(token: string) {
  const [summary, setSummary] = useState<BraintrustSummary | null>(() => getCachedSummary(token)?.summary ?? null);
  const [isLoading, setIsLoading] = useState(() => !isCacheFresh(token));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
    if (!force && isCacheFresh(token)) {
      const cached = getCachedSummary(token);
      setSummary(cached?.summary ?? null);
      setIsLoading(false);
      return;
    }

    if (force) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const nextSummary = await requestBraintrustSummary(token, force);
      cachedBraintrustSummary = {
        token,
        summary: nextSummary,
        fetchedAt: Date.now(),
      };
      setSummary(nextSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu Braintrust.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const cached = getCachedSummary(token);
      if (cached) {
        setSummary(cached.summary);
        setIsLoading(false);
        if (isCacheFresh(token)) {
          return;
        }
      } else {
        setSummary(null);
        setIsLoading(true);
      }
      void fetchSummary();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchSummary, token]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchSummary();
      }
    }, 120_000);
    return () => window.clearInterval(interval);
  }, [fetchSummary]);

  const refreshSummary = useCallback(() => fetchSummary({ force: true }), [fetchSummary]);

  return { summary, isLoading, isRefreshing, error, fetchSummary, refreshSummary };
}
