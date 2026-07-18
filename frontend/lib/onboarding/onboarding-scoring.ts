import {
  CONCEPT_LABELS,
  OnboardingConceptId,
  OnboardingDraft,
  OnboardingSummary,
} from './onboarding-contract';

export function conceptLabel(conceptId?: string | null): string {
  if (!conceptId || !(conceptId in CONCEPT_LABELS)) {
    return 'RAG Retrieval';
  }
  return CONCEPT_LABELS[conceptId as OnboardingConceptId];
}

export function buildLocalSummary(draft: OnboardingDraft): OnboardingSummary {
  if (draft.diagnosticSummary) {
    return draft.diagnosticSummary;
  }

  const scoreMap = new Map<string, { total: number; correct: number }>();
  draft.diagnosticAnswers.forEach((answer) => {
    if (!answer.conceptId) return;
    const current = scoreMap.get(answer.conceptId) ?? { total: 0, correct: 0 };
    scoreMap.set(answer.conceptId, {
      total: current.total + 1,
      correct: current.correct + (answer.correct ? 1 : 0),
    });
  });

  const conceptScores = Array.from(scoreMap.entries()).map(([conceptId, score]) => ({
    conceptId: conceptId as OnboardingConceptId,
    ratio: score.total > 0 ? score.correct / score.total : 0,
  }));

  const strongest = conceptScores
    .slice()
    .sort((a, b) => b.ratio - a.ratio || a.conceptId.localeCompare(b.conceptId))
    .map((item) => item.conceptId);

  const weakest = conceptScores
    .slice()
    .sort((a, b) => a.ratio - b.ratio || a.conceptId.localeCompare(b.conceptId))
    .map((item) => item.conceptId);

  draft.strengthConceptIds.forEach((conceptId) => {
    if (!strongest.includes(conceptId)) strongest.push(conceptId);
  });
  draft.weaknessConceptIds.forEach((conceptId) => {
    if (!weakest.includes(conceptId)) weakest.push(conceptId);
  });

  const total = draft.diagnosticAnswers.length;
  const correct = draft.diagnosticAnswers.filter((answer) => answer.correct).length;

  return {
    weekly_practice_minutes: draft.weeklyPracticeMinutes ?? 120,
    learning_goal: draft.learningGoal,
    target_question_count: draft.targetQuestionCount ?? 15,
    support_style: draft.supportStyle,
    learning_cadence: draft.learningCadence,
    strongest_concepts: strongest.slice(0, 3),
    weakest_concepts: weakest.slice(0, 3),
    recommended_concept_id: weakest[0] ?? 'rag_retrieval',
    confidence: total >= 8 ? 'high' : total < 5 ? 'low' : 'medium',
    diagnostic_correct: correct,
    diagnostic_total: total,
    diagnostic_required_total: 5,
    optional_diagnostic_available: total < 8,
  };
}
