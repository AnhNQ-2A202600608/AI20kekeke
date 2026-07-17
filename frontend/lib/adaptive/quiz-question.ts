import type { Question } from "@/lib/quiz/types";
import type { AdaptiveRecommendation } from "./api-client";

export function buildAdaptiveQuestion(
  recommendation: AdaptiveRecommendation,
  setId: string,
  conceptId: string,
): Question {
  return {
    id: `${recommendation.question_id}:${recommendation.decision_id}`,
    type: recommendation.type,
    question: recommendation.prompt,
    options: recommendation.type === "mcq" ? recommendation.options : undefined,
    answer: recommendation.answer || undefined,
    explanation: recommendation.explanation || undefined,
    expected_answer: recommendation.expected_answer || undefined,
    evaluation_points: recommendation.evaluation_points || undefined,
    sfia_level: recommendation.sfia_level || undefined,
    competency: recommendation.competency || undefined,
    hints: recommendation.hints || [],
    setId,
    adaptive: {
      decisionId: recommendation.decision_id,
      questionId: recommendation.question_id,
      conceptId,
      expectedSuccess: recommendation.expected_success,
      expectedReward: recommendation.expected_reward,
      questionDifficultyElo: recommendation.question_difficulty_elo,
      candidateCount: recommendation.candidate_count,
      conceptElo: recommendation.concept_elo,
      bktMasteryProbability: recommendation.bkt_mastery_probability,
      startedAt: new Date().toISOString(),
    },
  };
}

export function buildMcqStudentAnswer(optionKey: string) {
  return { selected_option: optionKey };
}
