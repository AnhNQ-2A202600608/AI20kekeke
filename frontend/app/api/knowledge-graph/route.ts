import { NextRequest, NextResponse } from 'next/server';
import { NextjsAdaptiveDatabase } from '@/lib/adaptive/database';
import { createTraceId, diagnosticsLog, elapsedMs, nowMs } from '@/lib/diagnostics/logger';

export const dynamic = 'force-dynamic';

const DEFAULT_COURSE_ID = 'cf76850d-0738-50c3-bf34-1c464fa3b4d3';

export async function GET(request: NextRequest) {
  const totalStartMs = nowMs();
  const traceId = createTraceId();
  const courseId = request.nextUrl.searchParams.get('course_id') || DEFAULT_COURSE_ID;
  const status = request.nextUrl.searchParams.get('status') || 'approved';

  try {
    const dbStartMs = nowMs();
    const db = new NextjsAdaptiveDatabase();
    const { concepts, relations } = await db.getKnowledgeGraph(courseId, status);

    diagnosticsLog('info', 'knowledge_graph.loaded', {
      traceId,
      courseId,
      status,
      concepts: concepts?.length ?? 0,
      relations: relations?.length ?? 0,
      dbMs: elapsedMs(dbStartMs),
      totalMs: elapsedMs(totalStartMs),
    });

    return NextResponse.json({
      concepts,
      relations,
      source: 'supabase',
      trace_id: traceId,
    });
  } catch (error) {
    diagnosticsLog('error', 'knowledge_graph.failed', {
      traceId,
      courseId,
      status,
      totalMs: elapsedMs(totalStartMs),
      error,
    });
    return NextResponse.json(
      {
        error: 'knowledge_graph_unavailable',
        message: 'Không thể tải đồ thị kiến thức từ Supabase.',
        source: 'unavailable',
        trace_id: traceId,
      },
      { status: 503 },
    );
  }
}
