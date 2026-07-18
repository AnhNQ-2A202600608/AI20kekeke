'use client';

import React, { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useBoundStore } from '@/hooks/useBoundStore';
import { isDemoAuthToken, isJwtExpired, isJwtToken } from '@/lib/auth-token';
import { isDemoMode } from '@/lib/demo-mode';
import { getRedirectPathForRole } from '@/lib/dashboard-routes';
import { AlertCircle, ArrowRight, GraduationCap, Lock, Mail, Sparkles, UserRound } from 'lucide-react';
import { LearningBrandMark } from '@/components/learning/learning-brand-mark';
import { signInWithSupabaseBrowser, signUpWithAppBackend, type AuthenticatedAppUser } from '@/lib/auth/supabase-session';

type AuthMode = 'login' | 'signup';
type AuthSubmitPhase = 'idle' | 'authenticating' | 'loading-profile' | 'creating-account';

const getInitialMode = (mode: string | null): AuthMode => (mode === 'signup' ? 'signup' : 'login');

function LoginFallback() {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-background px-4 text-on-background font-be-vietnam-pro">
      <div className="rounded-2xl border-2 border-gray-border border-b-[5px] bg-white px-5 py-4 text-center shadow-sm">
        <p className="text-sm font-black uppercase text-primary-green-dark">Mentora</p>
        <p className="mt-1 text-xs font-bold text-stone-500">Đang mở cổng đăng nhập...</p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { logIn, logOut, loggedIn, token, role } = useBoundStore();
  const demoMode = isDemoMode();

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(searchParams.get('mode')));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [mssv, setMssv] = useState('');
  const [showStudentCode, setShowStudentCode] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<AuthSubmitPhase>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isSignup = mode === 'signup';
  const isSubmitting = submitPhase !== 'idle';
  const submitLabel = submitPhase === 'creating-account'
    ? 'Đang tạo tài khoản...'
    : submitPhase === 'loading-profile'
      ? 'Đang tải hồ sơ học tập...'
      : submitPhase === 'authenticating'
        ? 'Đang xác thực...'
        : isSignup
          ? 'Tạo tài khoản'
          : 'Vào học';

  // Redirect if already logged in
  useEffect(() => {
    const hasRealAuthSession = isJwtToken(token) && !isJwtExpired(token) && !isDemoAuthToken(token);
    const hasDemoSession = demoMode && isDemoAuthToken(token);
    if (loggedIn && (hasRealAuthSession || hasDemoSession)) {
      router.push(getRedirectPathForRole(role));
      return;
    }
    if (loggedIn) {
      logOut();
    }
  }, [demoMode, logOut, loggedIn, router, token, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailClean = email.trim();
    const passwordClean = password;
    const fullNameClean = fullName.trim();
    const mssvClean = mssv.trim().toUpperCase();

    if (!emailClean || !passwordClean) {
      setErrorMessage('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }

    if (emailClean.indexOf('@') === -1) {
      setErrorMessage('Email không đúng định dạng.');
      return;
    }

    if (isSignup) {
      if (!fullNameClean) {
        setErrorMessage('Vui lòng nhập họ và tên để tạo hồ sơ học viên.');
        return;
      }
      if (passwordClean.length < 6) {
        setErrorMessage('Mật khẩu phải có tối thiểu 6 ký tự.');
        return;
      }
      if (mssvClean && !/^2A2026\d{5}$/i.test(mssvClean)) {
        setErrorMessage('Mã số sinh viên cần đúng định dạng 2A2026 + 5 chữ số.');
        return;
      }
    }

    setSubmitPhase(isSignup ? 'creating-account' : 'authenticating');

    try {
      let userData: AuthenticatedAppUser;
      if (isSignup) {
        userData = await signUpWithAppBackend({
          email: emailClean.toLowerCase(),
          password: passwordClean,
          fullName: fullNameClean,
          mssv: mssvClean || null,
        });

        if (!userData.token) {
          setSuccessMessage('Tài khoản đã được tạo. Nếu Supabase yêu cầu xác thực email, hãy mở email xác nhận rồi quay lại đăng nhập.');
          setMode('login');
          setPassword('');
          setSubmitPhase('idle');
          return;
        }
      } else {
        userData = await signInWithSupabaseBrowser(emailClean, passwordClean, {
          onProfileFetchStart: () => setSubmitPhase('loading-profile'),
        });
      }
      
      // Update state in Zustand bound store
      logIn({
        name: userData.full_name || fullNameClean || userData.email.split('@')[0],
        username: userData.email.split('@')[0],
        mssv: userData.mssv || mssvClean || '',
        role: userData.role,
        userId: userData.id,
        token: userData.token || '',
        isDemoAccount: Boolean(userData.is_demo_account),
        demoProfileKey: userData.demo_profile_key || null,
      });

      // Redirect user
      router.replace(getRedirectPathForRole(userData.role));
    } catch (err) {
      console.error('[Login Error] Failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Không thể đăng nhập. Vui lòng thử lại sau.');
      setSubmitPhase('idle');
    }
  };

  const handleBypass = () => {
    if (!demoMode) {
      setErrorMessage('Lớp demo chỉ khả dụng khi bật chế độ demo.');
      return;
    }
    // Standard bypass as a demo student
    logIn({
      name: 'Học Viên Offline',
      username: 'student',
      mssv: '2A202611111',
      role: 'student',
      userId: 'd3b07384-d113-4ec5-a58e-0f2d87e07661', // Use exact seeded student UUID
      token: `fake-jwt-token-d3b07384-d113-4ec5-a58e-0f2d87e07661`,
      isDemoAccount: false,
      demoProfileKey: null,
    });

    router.push('/app');
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setErrorMessage(null);
    setSuccessMessage(null);
    router.replace(nextMode === 'signup' ? '/login?mode=signup' : '/login', { scroll: false });
  };

  return (
    <main
      className="min-h-[100dvh] bg-[#fbfdf7] bg-[url('/app-backgrounds/bg-login-mobile.webp')] bg-[length:100%_auto] bg-bottom bg-no-repeat text-on-background font-be-vietnam-pro selection:bg-primary-green/20 selection:text-primary-green-dark lg:bg-[url('/app-backgrounds/bg-login.webp')] lg:bg-cover lg:bg-center"
      style={{ fontSize: 16 }}
    >
      <header className="mx-auto flex h-11 w-full max-w-[920px] items-center px-4 sm:px-6">
        <Link
          href="/"
          aria-label="Về Mentora"
          className="inline-flex items-center rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/25 [&_img]:!h-6"
        >
          <LearningBrandMark compact />
        </Link>
      </header>

      <section className="mx-auto flex min-h-[calc(100dvh-2.75rem)] w-full max-w-[920px] items-center px-4 pb-6 pt-2 sm:px-6">
        <div className="w-full max-w-[360px] lg:ml-2">
          <div>
            <h1 className="font-fraunces text-question-title-sm font-black leading-tight text-on-background sm:text-question-title-lg">
              {isSignup ? 'Tạo tài khoản Mentora' : 'Chào mừng trở lại'}
            </h1>
            {!isSignup ? (
              <p className="mt-2 max-w-[320px] text-body-dense font-semibold leading-[20px] text-stone-600">
                Đăng nhập để tiếp tục học với Mentora.
              </p>
            ) : null}
          </div>

          {errorMessage && (
            <div
              className="mt-4 flex items-start gap-2 rounded-xl border-2 border-error-red/25 bg-error-red-light/60 p-3 text-body-dense font-bold leading-[19px] text-error-red-dark"
              role="alert"
              aria-live="polite"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div
              className="mt-4 rounded-xl border-2 border-primary-green/25 bg-primary-green-light/50 p-3 text-body-dense font-bold leading-[19px] text-primary-green-dark"
              role="status"
              aria-live="polite"
            >
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-3">
            {isSignup ? (
              <div className="space-y-2">
                <label htmlFor="fullName" className="block text-node-label font-black text-stone-700">
                  Họ và tên
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nguyễn Minh An"
                    className="min-h-[44px] w-full rounded-xl border-2 border-gray-border bg-white py-2 pl-10 pr-3 !text-form-base font-bold text-on-background placeholder:text-stone-400 focus-visible:border-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 disabled:bg-surface-container-low disabled:text-stone-400"
                    disabled={isSubmitting}
                    autoComplete="name"
                  />
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-node-label font-black text-stone-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="min-h-[44px] w-full rounded-xl border-2 border-gray-border bg-white py-2 pl-10 pr-3 !text-form-base font-bold text-on-background placeholder:text-stone-400 focus-visible:border-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 disabled:bg-surface-container-low disabled:text-stone-400"
                  disabled={isSubmitting}
                  autoComplete="email"
                  spellCheck={false}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-node-label font-black text-stone-700">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" aria-hidden="true" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="min-h-[44px] w-full rounded-xl border-2 border-gray-border bg-white py-2 pl-10 pr-3 !text-form-base font-bold text-on-background placeholder:text-stone-400 focus-visible:border-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 disabled:bg-surface-container-low disabled:text-stone-400"
                  disabled={isSubmitting}
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            {isSignup && !showStudentCode ? (
              <button
                type="button"
                onClick={() => setShowStudentCode(true)}
                className="min-h-[36px] text-body-dense font-black text-primary-green-dark underline decoration-primary-green/30 underline-offset-4 hover:text-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              >
                Thêm MSSV nếu đã được cấp
              </button>
            ) : null}

            {isSignup && showStudentCode ? (
              <div className="space-y-2">
                <label htmlFor="mssv" className="block text-node-label font-black text-stone-700">
                  MSSV tùy chọn
                </label>
                <div className="relative">
                  <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" aria-hidden="true" />
                  <input
                    id="mssv"
                    name="mssv"
                    type="text"
                    value={mssv}
                    onChange={(e) => setMssv(e.target.value)}
                    placeholder="2A202612345"
                    className="min-h-[44px] w-full rounded-xl border-2 border-gray-border bg-white py-2 pl-10 pr-3 !text-form-base font-bold uppercase text-on-background placeholder:normal-case placeholder:text-stone-400 focus-visible:border-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 disabled:bg-surface-container-low disabled:text-stone-400"
                    disabled={isSubmitting}
                    autoComplete="off"
                  />
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border-2 border-b-[4px] border-primary-green bg-transparent px-3 text-form-base font-black text-primary-green-dark transition-colors hover:bg-primary-green hover:text-white focus-visible:bg-primary-green focus-visible:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20 active:translate-y-1 active:border-b-2 disabled:pointer-events-none disabled:border-gray-border disabled:bg-transparent disabled:text-stone-400"
            >
              <span>{submitLabel}</span>
              {!isSubmitting ? <ArrowRight className="h-4 w-4" aria-hidden="true" /> : null}
            </button>
          </form>

          <div className="mt-4 space-y-3 text-body-dense font-semibold leading-[20px] text-stone-600">
            <p>
              <span className="font-black text-on-background">{isSignup ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}</span>{' '}
              <button
                type="button"
                onClick={() => switchMode(isSignup ? 'login' : 'signup')}
                className="font-black text-primary-green-dark underline decoration-primary-green/30 underline-offset-4 hover:text-primary-green focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              >
                {isSignup ? 'Đăng nhập' : 'Đăng ký'}
              </button>
            </p>

            {demoMode ? (
              <button
                type="button"
                onClick={handleBypass}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg text-body-dense font-black text-on-background underline decoration-stone-300 underline-offset-4 transition-colors hover:text-primary-green-dark focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-green/20"
              >
                <Sparkles className="h-4 w-4 text-primary-green-dark" aria-hidden="true" />
                Vào lớp demo
              </button>
            ) : null}
          </div>

        </div>

      </section>
    </main>
  );
}
