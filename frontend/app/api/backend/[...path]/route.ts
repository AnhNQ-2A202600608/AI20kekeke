import { NextResponse } from "next/server";

const ALLOWED_PATHS = new Set(["auth/login", "auth/signup", "auth/me", "chat"]);

function backendBaseUrl() {
  return (process.env.BACKEND_API_URL || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
}

async function proxyRequest(request: Request, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const pathName = path.join("/");

  if (!ALLOWED_PATHS.has(pathName)) {
    return NextResponse.json({ detail: "Endpoint backend chưa được hỗ trợ." }, { status: 404 });
  }

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");
  if (contentType) headers.set("content-type", contentType);
  if (authorization) headers.set("authorization", authorization);

  try {
    const upstream = await fetch(`${backendBaseUrl()}/${pathName}`, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.text(),
      cache: "no-store",
    });
    const responseHeaders = new Headers();
    responseHeaders.set("content-type", upstream.headers.get("content-type") || "application/json");
    responseHeaders.set("cache-control", "no-store");
    return new Response(upstream.body, { status: upstream.status, headers: responseHeaders });
  } catch {
    return NextResponse.json(
      { detail: "Không thể kết nối tới backend. Hãy khởi động API hoặc cấu hình BACKEND_API_URL." },
      { status: 503 },
    );
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params);
}

export async function POST(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, params);
}