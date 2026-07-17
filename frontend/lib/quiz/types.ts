export type QuizDifficulty = 'dễ' | 'bình thường' | 'khó';

export type QuestionPublishedStatus = 'draft' | 'published' | 'rejected';

export interface QuestionHint {
  level: 'light' | 'medium' | 'deep';
  content: string;
}

export interface Question {
  id: string | number;
  type?: string;
  question: string;
  options?: {
    A?: string;
    B?: string;
    C?: string;
    D?: string;
    [key: string]: string | undefined;
  };
  answer?: string;
  explanation?: string;
  expected_answer?: string;
  evaluation_points?: string[];
  sfia_level?: string;
  competency?: string;
  difficulty?: string;
  setDifficulty?: string;
  setId?: string;
  published_status?: QuestionPublishedStatus;
  hints?: QuestionHint[];
  rejection_reason?: string;
  adaptive?: {
    decisionId: string;
    questionId: string;
    conceptId: string;
    expectedSuccess: number;
    expectedReward: number;
    questionDifficultyElo?: number | null;
    candidateCount?: number | null;
    conceptElo?: number | null;
    bktMasteryProbability?: number | null;
    startedAt: string;
  };
}

export interface QuestionSet {
  id: string;
  parent_id?: string;
  topic_title?: string;
  title: string;
  description: string;
  difficulty?: QuizDifficulty;
  questions: Question[];
}

export interface QuestionsData {
  sets: QuestionSet[];
}

export interface TopicMetadata {
  id: string;
  title: string;
  desc: string;
}

export type MasteryStatus = 'MASTERED' | 'LEARNING' | 'WEAK' | 'NOT_STARTED';

export interface Skill {
  id: string;
  name: string;
  description: string;
  dayId: string;
  masteryScore: number;
  status: MasteryStatus;
  elo: number;
  associatedSets?: string[];
}

export type ProgramPhaseId = 'foundation' | 'systems' | 'midterm' | 'specialization';

export interface ProgramPhase {
  id: ProgramPhaseId;
  title: string;
  shortTitle: string;
  dayRange: string;
  description: string;
}

export interface ProgramTrack {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
}

export interface ProgramConcept {
  id: string;
  title: string;
  description: string;
  setIds: string[];
}

export interface ProgramDay {
  id: string;
  dayNumber: number;
  displayLabel?: string;
  phaseId: ProgramPhaseId;
  trackId?: string;
  title: string;
  outcome: string;
  guidebookDayId?: string;
  concepts: ProgramConcept[];
}

export interface ActivePracticeSession {
  skillId: string;
  currentQuestionIndex: number;
  questionIdsPool: Array<string | number>;
  responses: {
    [questionId: string]: {
      selected?: string;
      essayAnswer?: string;
      isCorrect: boolean;
      hintCount?: number;
      adaptiveDecisionId?: string;
      submitResult?: {
        is_correct: boolean;
        actual_score: number;
        old_elo: number;
        new_elo: number;
        old_bkt: number;
        new_bkt: number;
        mastery_state: string;
        weakness_flag: boolean;
        bandit_reward: number;
        stability_days?: number;
        calculation_log?: {
          formula?: string;
          old_elo?: number;
          new_elo?: number;
          elo_delta?: number;
          question_difficulty_elo?: number;
          expected_success?: number;
          actual_score?: number;
          raw_score_delta?: number;
          hint_count?: number;
          hint_discount?: number;
          k_student?: number;
          used_ai_help?: boolean;
        } | null;
      };
    };
  };
  targetSetId?: string;
  startElo?: number;
  startAggregateElo?: number;
  mode?: 'adaptive' | 'static-demo';
  conceptId?: string;
  startedAt?: string;
  maxQuestions?: number;
}
