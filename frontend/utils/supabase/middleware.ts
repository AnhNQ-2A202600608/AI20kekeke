import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { createTraceId, diagnosticsLog, elapsedMs, nowMs } from "@/lib/diagnostics/logger";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_DEV;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV;

export const createClient = async (request: NextRequest) => {
  const totalStartMs = nowMs();
  const traceId = request.headers.get('x-request-id') || createTraceId();
  const path = request.nextUrl.pathname;
  const hasBearerAuth = request.headers.get('authorization')?.toLowerCase().startsWith('bearer ') ?? false;
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    diagnosticsLog('info', 'proxy.auth.skipped', {
      traceId,
      path,
      reason: 'missing_supabase_env',
      totalMs: elapsedMs(totalStartMs),
    });
    return supabaseResponse;
  }

  if (path.startsWith('/api/v1/') && hasBearerAuth) {
    diagnosticsLog('info', 'proxy.auth.skipped', {
      traceId,
      path,
      reason: 'api_bearer_authorization',
      totalMs: elapsedMs(totalStartMs),
    });
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  const getUserStartMs = nowMs();
  const { error } = await supabase.auth.getUser();
  const getUserMs = elapsedMs(getUserStartMs);

  diagnosticsLog(error ? 'warn' : 'info', 'proxy.auth.get_user', {
    traceId,
    path,
    method: request.method,
    getUserMs,
    totalMs: elapsedMs(totalStartMs),
    hasAuthError: Boolean(error),
    authError: error?.message,
  });

  return supabaseResponse
};
