import { NextResponse } from 'next/server';
import { NextjsAdaptiveDatabase } from '@/lib/adaptive/database';
import { createTraceId, diagnosticsLog, elapsedMs, nowMs } from '@/lib/diagnostics/logger';
import { ADAPTIVE_CONCEPT_ID_BY_SET_ID } from '@/lib/adaptive/concept-map';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const allowLocalQuestionFallback = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.NODE_ENV === 'test';

function getTopicMetadata(targetSlug: string) {
  try {
    const manifestPath = path.join(process.cwd(), 'public', 'quiz-manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      const matched = manifest.sets.find((s: any) => s.id.toLowerCase() === targetSlug.toLowerCase());
      if (matched) {
        return {
          parentId: matched.parent_id || 'day1',
          topicTitle: matched.topic_title || `Day ${targetSlug}`
        };
      }
    }
  } catch (e) {
    console.error('Error reading manifest in getTopicMetadata:', e);
  }

  // Fallback to extraction logic if manifest read fails or slug not found
  const match = targetSlug.match(/^day(\d+)/i);
  const dayNum = match ? match[1] : '1';
  let track = '';
  if (targetSlug.includes('-t1-') || targetSlug.includes('-ai-product')) track = '-ai-product';
  else if (targetSlug.includes('-t2-') || targetSlug.includes('-rag-data')) track = '-rag-data';
  else if (targetSlug.includes('-t3-') || targetSlug.includes('-agent-builder')) track = '-agent-builder';
  
  return {
    parentId: `day${dayNum}${track}`,
    topicTitle: `Day ${dayNum}`
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const totalStartMs = nowMs();
  const traceId = createTraceId();
  const { slug } = await params;
  const targetSlug = slug.toLowerCase();
  let supabaseUnavailable = false;

  try {
    // 1. Try querying Supabase Database first
    const dbStartMs = nowMs();
    const db = new NextjsAdaptiveDatabase();
    let concept = await db.getConceptByCode(targetSlug);
    let dbQuestions = concept ? await db.getQuestionsByConcept(concept.id) : [];

    // Fallback: Check if targetSlug is a set ID mapped to a concept ID (e.g. Day 16-28)
    if (!concept || dbQuestions.length <= 1) {
      const mappedConceptId = ADAPTIVE_CONCEPT_ID_BY_SET_ID[targetSlug];
      if (mappedConceptId) {
        const fetchedConcept = await db.getConceptById(mappedConceptId);
        if (fetchedConcept) {
          const allConceptQuestions = await db.getQuestionsByConcept(mappedConceptId);
          // Filter to only questions belonging to this specific set
          const filteredQuestions = allConceptQuestions.filter(
            (q: any) => q.setId === targetSlug
          );
          if (filteredQuestions.length > 1) {
            concept = fetchedConcept;
            dbQuestions = filteredQuestions;
          }
        }
      }
    }

    if (concept && dbQuestions && dbQuestions.length > 1) {
      const { parentId, topicTitle } = getTopicMetadata(targetSlug);
      diagnosticsLog('info', 'questions.slug.loaded', {
        traceId,
        slug: targetSlug,
        source: 'supabase',
        questions: dbQuestions.length,
        dbMs: elapsedMs(dbStartMs),
        totalMs: elapsedMs(totalStartMs),
      });

      return NextResponse.json({
        id: targetSlug,
        parent_id: parentId,
        topic_title: topicTitle,
        title: concept.name,
        description: concept.description || "",
        questions: dbQuestions,
        source: 'supabase',
        trace_id: traceId,
      });
    }
  } catch (dbError) {
    supabaseUnavailable = true;
    diagnosticsLog('warn', 'questions.slug.db_failed', {
      traceId,
      slug: targetSlug,
      source: 'supabase',
      totalMs: elapsedMs(totalStartMs),
      error: dbError,
    });
  }

  // 2. Fallback: Read local JSON files by manifest set id. This remains necessary
  // because several Supabase curriculum concepts use canonical codes that differ
  // from the public quiz set ids, e.g. day1-basics.
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

    const matchedMetadata = manifest.sets.find((s: any) => {
      const normalizedTitle = s.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

       return (
        s.id.toLowerCase() === targetSlug ||
        normalizedTitle === targetSlug ||
        (targetSlug === 'design-pattern-react' && s.id === 'react-loop-basics') ||
        (targetSlug === 'react-agent-day3' && s.id === 'react-loop-basics')
      );
    });

    if (!matchedMetadata) {
      return NextResponse.json(
        {
          error: 'question_set_not_found',
          message: 'Bộ đề không tồn tại trong hệ thống',
          source: 'local_json',
          trace_id: traceId,
        },
        { status: 404 }
      );
    }

    const quizFilePath = path.join(
      process.cwd(), 
      'public', 
      'quizzes', 
      matchedMetadata.parent_id || '', 
      `${matchedMetadata.id}.json`
    );
    if (!fs.existsSync(quizFilePath)) {
      return NextResponse.json(
        {
          error: 'question_file_not_found',
          message: 'Tập tin câu hỏi không tồn tại',
          source: 'local_json',
          trace_id: traceId,
        },
        { status: 404 }
      );
    }

    const quizFileData = fs.readFileSync(quizFilePath, 'utf8');
    const quizSet = JSON.parse(quizFileData);

    diagnosticsLog('info', 'questions.slug.loaded', {
      traceId,
      slug: targetSlug,
      source: 'local_json',
      questions: Array.isArray(quizSet.questions) ? quizSet.questions.length : undefined,
      fallbackMs: elapsedMs(fallbackStartMs),
      totalMs: elapsedMs(totalStartMs),
    });

    return NextResponse.json({ ...quizSet, source: 'local_json', trace_id: traceId });
  } catch (fallbackError) {
    diagnosticsLog('error', 'questions.slug.fallback_failed', {
      traceId,
      slug: targetSlug,
      totalMs: elapsedMs(totalStartMs),
      error: fallbackError,
    });
    return NextResponse.json(
      { error: 'questions_unavailable', message: 'Không thể tải bộ câu hỏi lúc này.', trace_id: traceId },
      { status: 503 }
    );
  }
}
