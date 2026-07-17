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
}
