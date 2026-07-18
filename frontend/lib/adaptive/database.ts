import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_URL_DEV ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_PROD ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_DEV ||
  '';

export class NextjsAdaptiveDatabase {
  private appClient: any;

  constructor() {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('[NextjsAdaptiveDatabase] Warning: Supabase credentials are empty.');
    }
    this.appClient = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'app' },
    });
  }

  public async getActiveConcepts() {
    const { data, error } = await this.appClient
      .from('concepts')
      .select('id, code, name, description')
      .eq('status', 'active');

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting active concepts:', error);
      throw error;
    }

    return data || [];
  }

  public async getConceptByCode(code: string) {
    const { data, error } = await this.appClient
      .from('concepts')
      .select('id, code, name, description, course_id')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting concept by code:', error);
      throw error;
    }

    return data;
  }

  public async getConceptById(id: string) {
    const { data, error } = await this.appClient
      .from('concepts')
      .select('id, code, name, description, course_id')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting concept by id:', error);
      throw error;
    }

    return data;
  }

  public async getKnowledgeGraph(courseId: string, status: string) {
    const { data: concepts, error: conceptsError } = await this.appClient
      .from('concepts')
      .select('id, code, name, description, course_id, parent_concept_id')
      .eq('course_id', courseId)
      .eq('status', 'active')
      .order('code', { ascending: true });

    if (conceptsError) {
      console.error('[NextjsAdaptiveDatabase] Error getting graph concepts:', conceptsError);
      throw conceptsError;
    }

    let relationQuery = this.appClient
      .from('concept_relations')
      .select('id, source_concept_id, target_concept_id, relation_type, weight, status')
      .eq('course_id', courseId);

    if (status !== 'all') {
      relationQuery = relationQuery.eq('status', status);
    }

    const { data: relations, error: relationsError } = await relationQuery.order('created_at', {
      ascending: true,
    });

    if (relationsError) {
      console.error('[NextjsAdaptiveDatabase] Error getting graph relations:', relationsError);
      throw relationsError;
    }

    return {
      concepts: concepts || [],
      relations: relations || [],
    };
  }

  public async getQuestionsByConcept(conceptId: string) {
    const { data, error } = await this.appClient
      .from('questions')
      .select('id, type, prompt, answer_key, difficulty_elo')
      .eq('concept_id', conceptId)
      .eq('calibration_status', 'published');

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting questions by concept:', error);
      throw error;
    }

    const questionRows = data || [];
    const hintsByQuestionId = await this.getQuestionHintsByQuestionIds(questionRows.map((row: any) => row.id));

    return questionRows.map((row: any) => {
      const isMcq = row.type === 'mcq';
      return {
        id: row.id,
        question: row.prompt,
        options: isMcq ? row.answer_key.options : undefined,
        answer: isMcq ? row.answer_key.correct : undefined,
        explanation: isMcq ? row.answer_key.explanation : undefined,
        expected_answer: !isMcq ? row.answer_key.expected_answer : undefined,
        evaluation_points: !isMcq ? row.answer_key.evaluation_points : undefined,
        sfia_level: !isMcq ? row.answer_key.sfia_level : undefined,
        competency: !isMcq ? row.answer_key.competency : undefined,
        difficulty_elo: Number(row.difficulty_elo),
        setId: row.answer_key?.set_id,
        hints: hintsByQuestionId[row.id] || [],
      };
    });
  }

  public async getQuestionHintsByQuestionIds(questionIds: string[]) {
    if (questionIds.length === 0) {
      return {};
    }

    const { data, error } = await this.appClient
      .from('question_hints')
      .select('question_id, level, hint_text')
      .in('question_id', questionIds)
      .order('level', { ascending: true });

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting question hints:', error);
      throw error;
    }

    const levelMap: Record<number, 'light' | 'medium' | 'deep'> = {
      1: 'light',
      2: 'medium',
      3: 'deep',
    };

    type QuestionHint = { level: 'light' | 'medium' | 'deep'; content: string };
    type QuestionHintRow = { question_id: string; level: number | string; hint_text: string };

    return ((data || []) as QuestionHintRow[]).reduce(
      (acc: Record<string, QuestionHint[]>, row) => {
        const questionId = row.question_id as string;
        if (!acc[questionId]) {
          acc[questionId] = [];
        }
        acc[questionId].push({
          level: levelMap[Number(row.level)] || 'light',
          content: row.hint_text,
        });
        return acc;
      },
      {} as Record<string, QuestionHint[]>
    );
  }

  public async getPublishedExamSets(courseId: string) {
    const { data, error } = await this.appClient
      .from('exam_sets')
      .select('id, code, title, description, exam_type, difficulty, duration_minutes, max_score')
      .eq('course_id', courseId)
      .eq('status', 'published');

    if (error) {
      console.error('[NextjsAdaptiveDatabase] Error getting published exam sets:', error);
      throw error;
    }

    // Lấy số lượng câu hỏi trong mỗi bộ đề từ bảng junction exam_questions
    const { data: qData, error: qError } = await this.appClient
      .from('exam_questions')
      .select('exam_set_id');

    if (qError) {
      console.error('[NextjsAdaptiveDatabase] Error getting exam questions counts:', qError);
      throw qError;
    }

    const counts: Record<string, number> = {};
    for (const row of (qData || [])) {
      const sid = row.exam_set_id;
      counts[sid] = (counts[sid] || 0) + 1;
    }

    return (data || []).map((row: any) => ({
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      exam_type: row.exam_type,
      difficulty: row.difficulty,
      duration_minutes: row.duration_minutes,
      max_score: Number(row.max_score),
      question_count: counts[row.id] || 0,
    }));
  }

  public async getExamDetails(examSetId: string) {
    const { data: examData, error: examError } = await this.appClient
      .from('exam_sets')
      .select('id, code, title, description, exam_type, difficulty, duration_minutes, max_score')
      .eq('id', examSetId)
      .maybeSingle();

    if (examError) {
      console.error('[NextjsAdaptiveDatabase] Error getting exam set details:', examError);
      throw examError;
    }

    if (!examData) {
      throw new Error(`Exam set with id ${examSetId} not found.`);
    }

    // Lấy danh sách câu hỏi trong bộ đề và thông tin tương ứng
    const { data: eqData, error: eqError } = await this.appClient
      .from('exam_questions')
      .select('sort_order, weight, questions(id, prompt, answer_key)')
      .eq('exam_set_id', examSetId);

    if (eqError) {
      console.error('[NextjsAdaptiveDatabase] Error getting exam questions:', eqError);
      throw eqError;
    }

    const questionsList = (eqData || [])
      .map((item: any) => {
        const q = item.questions;
        if (!q) return null;
        return {
          id: q.id,
          sort_order: item.sort_order,
          weight: Number(item.weight),
          prompt: q.prompt,
          options: q.answer_key?.options || {},
        };
      })
      .filter(Boolean) as any[];

    questionsList.sort((a, b) => a.sort_order - b.sort_order);

    return {
      exam: {
        id: examData.id,
        code: examData.code,
        title: examData.title,
        description: examData.description,
        exam_type: examData.exam_type,
        difficulty: examData.difficulty,
        duration_minutes: examData.duration_minutes,
        max_score: Number(examData.max_score),
        question_count: questionsList.length,
      },
      questions: questionsList,
    };
  }

  public async startExamAttempt(examSetId: string, token: string) {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/exams/${examSetId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to start exam attempt: ${response.statusText}`);
    }
    return response.json();
  }

  public async submitExamAttempt(attemptId: string, answers: any[], token: string) {
    const backendUrl = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000';
    const response = await fetch(`${backendUrl}/api/v1/exams/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ answers })
    });
    if (!response.ok) {
      throw new Error(`Failed to submit exam attempt: ${response.statusText}`);
    }
    return response.json();
  }
}
