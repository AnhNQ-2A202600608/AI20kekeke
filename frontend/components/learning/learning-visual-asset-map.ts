import type { DetailConceptState } from '@/components/learning/day-detail-card';
import type { SofiExpressionName, SofiMascotState } from '@/components/mascot';

export type LearningSceneryAsset = {
  id: string;
  src320: string;
  src640: string;
  src960: string;
  alt: string;
};

const scenery = (id: string, alt: string): LearningSceneryAsset => ({
  id,
  src320: `/learning-scenery/${id}-320.webp`,
  src640: `/learning-scenery/${id}-640.webp`,
  src960: `/learning-scenery/${id}-960.webp`,
  alt,
});

const SCENERY_ASSETS = {
  landing: scenery('landing-learning-hills', 'EduGap learning path hills'),
  onboarding: scenery('onboarding-first-trail', 'Beginner learning trail'),
  tokenization: scenery('tokenization-blocks', 'Tokenization learning blocks'),
  rag: scenery('rag-knowledge-forest', 'RAG knowledge forest'),
  agent: scenery('agent-tool-route', 'Agent tool route'),
  evaluation: scenery('evaluation-checkpoint', 'Evaluation checkpoint'),
  safety: scenery('safety-guard-bridge', 'Safety guard bridge'),
  product: scenery('product-loop-lab', 'Product loop lab'),
  mastery: scenery('mastery-celebration', 'Mastery celebration'),
  profile: scenery('profile-progress-garden', 'Progress garden'),
} as const;

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export function getLearningSceneryAsset(title?: string, description?: string): LearningSceneryAsset {
  const text = normalizeText(`${title ?? ''} ${description ?? ''}`);

  if (/token|embedding|vector|chunk|word piece/.test(text)) return SCENERY_ASSETS.tokenization;
  if (/rag|retrieval|document|search|knowledge|citation/.test(text)) return SCENERY_ASSETS.rag;
  if (/agent|tool|workflow|automation|react loop|loop/.test(text)) return SCENERY_ASSETS.agent;
  if (/eval|metric|test|validation|assessment|quiz/.test(text)) return SCENERY_ASSETS.evaluation;
  if (/safety|guardrail|security|policy|integrity/.test(text)) return SCENERY_ASSETS.safety;
  if (/product|prototype|uncertainty|feedback|launch/.test(text)) return SCENERY_ASSETS.product;
  if (/mastery|complete|level|achievement/.test(text)) return SCENERY_ASSETS.mastery;
  if (/onboarding|first|foundation|nen tang|nền tảng/.test(text)) return SCENERY_ASSETS.onboarding;

  return SCENERY_ASSETS.landing;
}

export function getSofiExpressionForConceptState(state?: DetailConceptState): SofiExpressionName {
  if (state === 'weak') return 'worried';
  if (state === 'mastered') return 'thumbs-up';
  if (state === 'learning') return 'thinking';
  if (state === 'empty') return 'calm';
  return 'happy';
}

export function getSofiMascotStateForConceptState(state?: DetailConceptState): SofiMascotState {
  if (state === 'weak') return 'wrong';
  if (state === 'mastered') return 'correct';
  if (state === 'empty') return 'idle';
  return 'coach';
}
