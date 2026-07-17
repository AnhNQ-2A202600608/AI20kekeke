'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import { isDemoAuthToken } from '@/lib/auth-token';
import { isDemoMode } from '@/lib/demo-mode';
import { getOnboardingStatus, OnboardingApiError } from '@/lib/onboarding/onboarding-api';
import { markOnboardingComplete, readLocalOnboardingComplete } from '@/lib/onboarding/onboarding-storage';

type GateState = 'idle' | 'checking' | 'redirecting' | 'offline';

export function OnboardingGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const loggedIn = useBoundStore((state) => state.loggedIn);
  const userId = useBoundStore((state) => state.userId);
  const role = useBoundStore((state) => state.role);
  const token = useBoundStore((state) => state.token);
  const logOut = useBoundStore((state) => state.logOut);
  const forceDemoOnboarding = useBoundStore((state) => state.forceDemoOnboarding);
  const [hydrated, setHydrated] = useState(false);
  const [gateState, setGateState] = useState<GateState>('idle');
  const [remoteStatusPassKey, setRemoteStatusPassKey] = useState<string | null>(null);
  const [apiCompleted, setApiCompleted] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    const persistApi = useBoundStore.persist;
    if (!persistApi) return;
    if (persistApi.hasHydrated()) {
      const readyCheckId = window.setTimeout(() => setHydrated(true), 0);
      return () => window.clearTimeout(readyCheckId);
    }
    return persistApi.onFinishHydration(() => {
      window.setTimeout(() => setHydrated(true), 0);
    });
  }, [hydrated]);

  const shouldSkipGate = useMemo(() => pathname?.startsWith('/onboarding'), [pathname]);
  const shouldBypassForRole = useMemo(() => {
    const normalizedRole = role.trim().toLowerCase();
    return Boolean(normalizedRole && normalizedRole !== 'student');
  }, [role]);
  const localStatus = useMemo(() => readLocalOnboardingComplete(userId), [userId]);
  const isCompleted = localStatus.completed || apiCompleted;
  const usesLocalDemoAuth = isDemoMode() && isDemoAuthToken(token);
  const statusPassKey = `${userId || ''}:${token || ''}`;
  const remoteStatusPassed = remoteStatusPassKey === statusPassKey;
  const needsDemoOnboarding = hydrated && !shouldSkipGate && !shouldBypassForRole && loggedIn && Boolean(userId) && forceDemoOnboarding;
  const needsStatusCheck =
    hydrated &&
    !shouldSkipGate &&
    !shouldBypassForRole &&
    loggedIn &&
    Boolean(userId) &&
    !usesLocalDemoAuth &&
    !forceDemoOnboarding &&
    (!isCompleted || localStatus.syncPending);

  useEffect(() => {
    if (needsDemoOnboarding) {
      queueMicrotask(() => {
        setGateState('redirecting');
        router.replace('/onboarding');
      });
      return;
    }
    if (!needsStatusCheck || !userId) {
      return;
    }
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setGateState('checking');
    });
    getOnboardingStatus(token)
      .then((status) => {
        if (cancelled) return;
        if (status.completed) {
          markOnboardingComplete(userId, status.summary ?? undefined);
          setRemoteStatusPassKey(statusPassKey);
          setApiCompleted(true);
          setGateState('idle');
          return;
        }
        if (localStatus.syncPending) {
          setGateState('offline');
          return;
        }
        setGateState('redirecting');
        router.replace('/onboarding');
      })
      .catch((error) => {
        if (cancelled) return;
        const apiError = error instanceof OnboardingApiError ? error : null;
        if (apiError?.type === 'unauthorized') {
          if (usesLocalDemoAuth) {
            setGateState('offline');
            return;
          }
          setGateState('redirecting');
          logOut();
          router.replace('/login');
          return;
        }
        setGateState(apiError?.type === 'offline' || apiError?.type === 'server' ? 'offline' : 'idle');
      });

    return () => {
      cancelled = true;
    };
  }, [isCompleted, localStatus.syncPending, logOut, needsDemoOnboarding, needsStatusCheck, router, statusPassKey, token, userId, usesLocalDemoAuth]);

  if ((!needsStatusCheck && !needsDemoOnboarding) || remoteStatusPassed || gateState === 'offline' || usesLocalDemoAuth) {
    return (
      <>
        {gateState === 'offline' && loggedIn ? (
          <div className="fixed left-1/2 top-3 z-[70] -translate-x-1/2 rounded-full border border-primary-blue/25 bg-primary-blue-light/80 px-4 py-2 text-sm font-bold text-primary-blue-dark shadow-soft">
            Onboarding đang dùng trạng thái cục bộ
          </div>
        ) : null}
        {children}
      </>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-on-background">
      <MascotLoadingBlock
        title={gateState === 'redirecting' ? 'Sofi đang mở onboarding...' : hydrated ? 'Sofi đang kiểm tra hồ sơ học tập...' : 'Sofi đang đồng bộ hồ sơ...'}
        description="EduGap chuẩn bị lộ trình phù hợp cho bạn"
        className="max-w-md border-2 border-primary-green/15 border-b-[5px] shadow-soft"
        mascotClassName="scale-[0.82]"
      />
    </div>
  );
}
