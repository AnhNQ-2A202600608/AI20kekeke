import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient as createSupabaseServerClient } from '@/utils/supabase/server';
import { createTraceId, diagnosticsLog, elapsedMs, nowMs } from '@/lib/diagnostics/logger';

export const dynamic = 'force-dynamic';

async function getSupabaseAccessToken() {
  try {
    const supabase = createSupabaseServerClient(await cookies());
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) return null;

    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function isPublicAuthPath(pathStr: string) {
  return pathStr === 'auth/login' || pathStr === 'auth/signup';
}

async function handleProxy(request: NextRequest, pathSegments: string[]) {
  const totalStartMs = nowMs();
  const traceId = request.headers.get('x-request-id') || createTraceId();
  let backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';
  if (backendUrl.endsWith('/')) {
    backendUrl = backendUrl.slice(0, -1);
  }
  
  // Reconstruct path and query parameters
  const pathStr = pathSegments.join('/');
  const queryStr = request.nextUrl.search;
  const targetUrl = `${backendUrl}/api/v1/${pathStr}${queryStr}`;
  diagnosticsLog('info', 'bff.forward.start', {
    traceId,
    method: request.method,
    path: request.nextUrl.pathname,
    query: queryStr || undefined,
    targetPath: `/api/v1/${pathStr}`,
  });

  try {
    // Clone headers, omitting host and accept-encoding to avoid routing/compression issues on the backend
    const headers = new Headers();
    request.headers.forEach((value, key) => {
      const keyLower = key.toLowerCase();
      if (
        keyLower !== 'host' &&
        keyLower !== 'accept-encoding' &&
        keyLower !== 'connection' &&
        keyLower !== 'content-length' &&
        keyLower !== 'cookie'
      ) {
        headers.set(key, value);
      }
    });
    headers.set('x-request-id', traceId);
    const hasBearerAuth = headers.get('authorization')?.toLowerCase().startsWith('bearer ') ?? false;
    const skipCookieSessionLookup = hasBearerAuth || isPublicAuthPath(pathStr);
    const authStartMs = nowMs();
    const cookieAccessToken = skipCookieSessionLookup ? null : await getSupabaseAccessToken();
    const authMs = elapsedMs(authStartMs);
    if (cookieAccessToken) {
      headers.set('Authorization', `Bearer ${cookieAccessToken}`);
    }

    // Read request body for write methods
    let body: ArrayBuffer | undefined = undefined;
    let bodyReadMs = 0;
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      try {
        const bodyStartMs = nowMs();
        body = await request.arrayBuffer();
        bodyReadMs = elapsedMs(bodyStartMs);
      } catch (e) {
        // Body reading failed (e.g. empty body), proceed with undefined
      }
    }

    const backendStartMs = nowMs();
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });
    const backendMs = elapsedMs(backendStartMs);

    // Handle Server-Sent Events (SSE) streaming
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/event-stream')) {
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no', // Disable buffering for Nginx/Vercel proxies
        },
      });
    }

    // Read full response data
    const responseReadStartMs = nowMs();
    const responseData = await response.arrayBuffer();
    const responseReadMs = elapsedMs(responseReadStartMs);

    // Reconstruct headers to forward back, omitting encoding/length headers
    // that might conflict with the decompressed body or platform behavior.
    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      const keyLower = key.toLowerCase();
      if (
        keyLower !== 'content-encoding' &&
        keyLower !== 'content-length' &&
        keyLower !== 'transfer-encoding' &&
        keyLower !== 'connection'
      ) {
        responseHeaders.set(key, value);
      }
    });

    diagnosticsLog(response.ok ? 'info' : 'warn', 'bff.forward.complete', {
      traceId,
      method: request.method,
      path: request.nextUrl.pathname,
      status: response.status,
      authMs,
      bodyReadMs,
      backendMs,
      responseReadMs,
      totalMs: elapsedMs(totalStartMs),
      hasBearerAuth,
      skippedCookieSessionLookup: skipCookieSessionLookup,
      hasCookieAccessToken: Boolean(cookieAccessToken),
      responseBytes: responseData.byteLength,
    });

    return new Response(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    diagnosticsLog('error', 'bff.forward.error', {
      traceId,
      method: request.method,
      path: request.nextUrl.pathname,
      targetPath: `/api/v1/${pathStr}`,
      totalMs: elapsedMs(totalStartMs),
      error,
    });
    
    return NextResponse.json(
      {
        error: 'backend_unavailable',
        message: 'Không thể kết nối đến API backend.',
        trace_id: traceId,
        upstream: {
          base_url: backendUrl,
          path: `/api/v1/${pathStr}`,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  return handleProxy(request, path);
}
