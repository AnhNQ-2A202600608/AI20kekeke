import { NextResponse } from 'next/server';
import { NextjsAdaptiveDatabase } from '@/lib/adaptive/database';
import { createTraceId, diagnosticsLog, elapsedMs, nowMs } from '@/lib/diagnostics/logger';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const allowLocalQuestionFallback = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'test';

function getTopicMetadata(targetSlug: string) {
  let parentId = 'day1';
  let topicTitle = 'Day 1: AI & LLM Foundation';

  if (targetSlug.startsWith('day1') || targetSlug.startsWith('week1')) {
    parentId = 'day1';
    topicTitle = 'Day 1: AI & LLM Foundation';
  } else if (targetSlug.startsWith('day2')) {
    parentId = 'day2';
    topicTitle = 'Day 2: Xác định Bài toán cho AI';
  } else if (targetSlug.startsWith('react') || targetSlug.startsWith('day3')) {
    parentId = 'day3';
    topicTitle = 'Day 3: Design Pattern ReAct';
  } else if (targetSlug.startsWith('prompt') || targetSlug.startsWith('context') || targetSlug.startsWith('tool') || targetSlug.startsWith('day4')) {
    parentId = 'day4';
    topicTitle = 'Day 4: Prompt Engineering & Tool Calling';
  } else if (targetSlug.startsWith('ai-product') || targetSlug.startsWith('roi-') || targetSlug.startsWith('day5')) {
    parentId = 'day5';
    topicTitle = 'Day 5: Thiết kế sản phẩm AI cho sự không chắc chắn';
  } else if (targetSlug.startsWith('hackathon') || targetSlug.startsWith('day6')) {
    parentId = 'day6';
    topicTitle = 'Day 6: Hackathon Day';
  } else if (targetSlug.startsWith('day7')) {
    parentId = 'day7';
    topicTitle = 'Day 7: Data Foundations - Embedding & Vector Store';
  } else if (targetSlug.startsWith('day8')) {
    parentId = 'day8';
    topicTitle = 'Day 8: RAG Pipeline - Retrieval — Augmentation — Generation';
  } else if (targetSlug.startsWith('day9')) {
    parentId = 'day9';
    topicTitle = 'Day 9: Multi-Agent & Kết Nối Hệ Thống';
  } else if (targetSlug.startsWith('day10')) {
    parentId = 'day10';
    topicTitle = 'Day 10: Data Pipeline & Data Observability';
  } else if (targetSlug.startsWith('midterm-')) {
    parentId = 'midterm-review';
    topicTitle = 'Ôn tập giữa kỳ: Cấu trúc bài thi';
  }

  return { parentId, topicTitle };
}

export async function GET() {
  const totalStartMs = nowMs();
  const traceId = createTraceId();
  let supabaseUnavailable = false;
  try {
    // 1. Try fetching everything from Supabase first
    const dbStartMs = nowMs();
    const db = new NextjsAdaptiveDatabase();
    
    // Fetch all active concepts from Supabase
    const dbConcepts = await db.getActiveConcepts();

    if (dbConcepts && dbConcepts.length > 0) {
      const fullSets: any[] = [];
      let totalQuestions = 0;
      for (const concept of dbConcepts) {
        const questions = await db.getQuestionsByConcept(concept.id);
        totalQuestions += questions.length;
        const { parentId, topicTitle } = getTopicMetadata(concept.code);
        
        fullSets.push({
          id: concept.code,
          parent_id: parentId,
          topic_title: topicTitle,
          title: concept.name,
          description: concept.description || "",
          questions: questions
        });
      }
      diagnosticsLog('info', 'questions.index.loaded', {
        traceId,
        source: 'supabase',
        concepts: dbConcepts.length,
        sets: fullSets.length,
        questions: totalQuestions,
        dbMs: elapsedMs(dbStartMs),
        totalMs: elapsedMs(totalStartMs),
      });
      
      return NextResponse.json({ sets: fullSets, source: 'supabase', trace_id: traceId });
    }
  } catch (dbError) {
    supabaseUnavailable = true;
    diagnosticsLog('warn', 'questions.index.db_failed', {
      traceId,
      source: 'supabase',
      totalMs: elapsedMs(totalStartMs),
      error: dbError,
    });
  }

  if (!allowLocalQuestionFallback()) {
    return NextResponse.json(
      {
        error: supabaseUnavailable ? 'questions_unavailable' : 'questions_not_found',
        message: supabaseUnavailable
          ? 'Không thể tải câu hỏi từ Supabase.'
          : 'Không tìm thấy bộ câu hỏi đang hoạt động trong Supabase.',
        source: 'unavailable',
        trace_id: traceId,
      },
      { status: supabaseUnavailable ? 503 : 404 },
    );
  }

  // 2. Fallback: Read local JSON files (legacy)
  try {
    const fallbackStartMs = nowMs();
    const manifestPath = path.join(process.cwd(), 'public', 'quiz-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return NextResponse.json(
        { error: 'questions_manifest_unavailable', message: 'Hệ thống chưa được cấu hình manifest', trace_id: traceId },
        { status: 503 }
      );
    }
    const manifestData = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestData);

    let totalQuestions = 0;
    const fullSets = manifest.sets.map((setMetadata: any) => {
      const quizFilePath = path.join(
        process.cwd(), 
        'public', 
        'quizzes', 
        setMetadata.parent_id || '', 
        `${setMetadata.id}.json`
      );
      if (fs.existsSync(quizFilePath)) {
        try {
          const quizFileData = fs.readFileSync(quizFilePath, 'utf8');
          const quizSet = JSON.parse(quizFileData);
          totalQuestions += Array.isArray(quizSet.questions) ? quizSet.questions.length : 0;
          return quizSet;
        } catch (e) {
          diagnosticsLog('warn', 'questions.index.local_parse_failed', {
            traceId,
            setId: setMetadata.id,
            error: e,
          });
        }
      }
      return {
        ...setMetadata,
        questions: []
      };
    });

    diagnosticsLog('info', 'questions.index.loaded', {
      traceId,
      source: 'local_json',
      sets: fullSets.length,
      questions: totalQuestions,
      fallbackMs: elapsedMs(fallbackStartMs),
      totalMs: elapsedMs(totalStartMs),
    });

    return NextResponse.json({ sets: fullSets, source: 'local_json', trace_id: traceId });
  } catch (error) {
    diagnosticsLog('error', 'questions.index.failed', {
      traceId,
      totalMs: elapsedMs(totalStartMs),
      error,
    });
    return NextResponse.json(
      { error: 'questions_unavailable', message: 'Không thể tải bộ câu hỏi lúc này.', trace_id: traceId },
      { status: 503 }
    );
  }
}
