'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MascotLoadingBlock } from '@/components/mascot';
import { useBoundStore } from '@/hooks/useBoundStore';
import { LandingPage } from '@/components/landing/landing-page';
import { getRedirectPathForRole } from '@/lib/dashboard-routes';

function LandingGateFallback() {
  return (
    <main className="min-h-screen bg-background text-on-background flex items-center justify-center px-6 font-be-vietnam-pro">
      <MascotLoadingBlock
        title="Sofi đang chuẩn bị lớp học..."
        description="Đang kiểm tra phiên đăng nhập của bạn"
        className="max-w-sm border-2 border-gray-border border-b-[5px]"
        mascotClassName="scale-[0.82]"
      />
    </main>
  );
}

export default function HomePage() {
  const router = useRouter();
  const loggedIn = useBoundStore((state) => state.loggedIn);
  const role = useBoundStore((state) => state.role);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const hydrationCheckId = window.setTimeout(() => {
      if (useBoundStore.persist.hasHydrated()) {
        setHasHydrated(true);
      }
    }, 0);

    const unsubscribe = useBoundStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    return () => {
      window.clearTimeout(hydrationCheckId);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hasHydrated && loggedIn) {
      router.replace(getRedirectPathForRole(role));
    }
  }, [hasHydrated, loggedIn, router, role]);

  if (!hasHydrated || loggedIn) {
    return <LandingGateFallback />;
  }

  return <LandingPage />;
}
