export type LearningSeedStage =
  | 'locked'
  | 'empty'
  | 'early'
  | 'learning'
  | 'growing'
  | 'strong'
  | 'mastered'
  | 'review';

export interface LearningSeedAsset {
  stage: LearningSeedStage;
  label: string;
  minProgress: number;
  maxProgress: number;
  png: string;
  webp: string;
}

export const learningSeedAssets: Record<LearningSeedStage, LearningSeedAsset> = {
  locked: {
    stage: 'locked',
    label: 'Sắp mở khóa',
    minProgress: 0,
    maxProgress: 0,
    png: '/learning-seeds/seed-locked.png',
    webp: '/learning-seeds/seed-locked.webp',
  },
  empty: {
    stage: 'empty',
    label: 'Chưa học',
    minProgress: 0,
    maxProgress: 0,
    png: '/learning-seeds/seed-empty.png',
    webp: '/learning-seeds/seed-empty.webp',
  },
  early: {
    stage: 'early',
    label: 'Mới nảy mầm',
    minProgress: 1,
    maxProgress: 24,
    png: '/learning-seeds/seed-early.png',
    webp: '/learning-seeds/seed-early.webp',
  },
  learning: {
    stage: 'learning',
    label: 'Đang học',
    minProgress: 25,
    maxProgress: 49,
    png: '/learning-seeds/seed-learning.png',
    webp: '/learning-seeds/seed-learning.webp',
  },
  growing: {
    stage: 'growing',
    label: 'Đang lớn',
    minProgress: 50,
    maxProgress: 69,
    png: '/learning-seeds/seed-growing.png',
    webp: '/learning-seeds/seed-growing.webp',
  },
  strong: {
    stage: 'strong',
    label: 'Gần thành thạo',
    minProgress: 70,
    maxProgress: 89,
    png: '/learning-seeds/seed-strong.png',
    webp: '/learning-seeds/seed-strong.webp',
  },
  mastered: {
    stage: 'mastered',
    label: 'Thành thạo',
    minProgress: 90,
    maxProgress: 100,
    png: '/learning-seeds/seed-mastered.png',
    webp: '/learning-seeds/seed-mastered.webp',
  },
  review: {
    stage: 'review',
    label: 'Cần ôn',
    minProgress: 1,
    maxProgress: 100,
    png: '/learning-seeds/seed-review.png',
    webp: '/learning-seeds/seed-review.webp',
  },
};

export const getLearningSeedStage = (progress: number, state?: 'locked' | 'review') => {
  if (state === 'locked') return learningSeedAssets.locked;
  if (state === 'review') return learningSeedAssets.review;
  if (progress <= 0) return learningSeedAssets.empty;
  if (progress < 25) return learningSeedAssets.early;
  if (progress < 50) return learningSeedAssets.learning;
  if (progress < 70) return learningSeedAssets.growing;
  if (progress < 90) return learningSeedAssets.strong;
  return learningSeedAssets.mastered;
};
