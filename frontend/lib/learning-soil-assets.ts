import type { LearningSeedStage } from './learning-seed-assets';

export type LearningSoilStage = LearningSeedStage;

export interface LearningSoilAsset {
  stage: LearningSoilStage;
  label: string;
  minProgress: number;
  maxProgress: number;
  png: string;
  webp: string;
}

export const learningSoilAssets: Record<LearningSoilStage, LearningSoilAsset> = {
  locked: {
    stage: 'locked',
    label: 'Sắp mở khóa',
    minProgress: 0,
    maxProgress: 0,
    png: '/learning-soils/soil-empty.png',
    webp: '/learning-soils/soil-empty.webp',
  },
  empty: {
    stage: 'empty',
    label: 'Chưa học',
    minProgress: 0,
    maxProgress: 0,
    png: '/learning-soils/soil-empty.png',
    webp: '/learning-soils/soil-empty.webp',
  },
  early: {
    stage: 'early',
    label: 'Mới nảy mầm',
    minProgress: 1,
    maxProgress: 24,
    png: '/learning-soils/soil-early.png',
    webp: '/learning-soils/soil-early.webp',
  },
  learning: {
    stage: 'learning',
    label: 'Đang học',
    minProgress: 25,
    maxProgress: 49,
    png: '/learning-soils/soil-learning.png',
    webp: '/learning-soils/soil-learning.webp',
  },
  growing: {
    stage: 'growing',
    label: 'Đang lớn',
    minProgress: 50,
    maxProgress: 69,
    png: '/learning-soils/soil-growing.png',
    webp: '/learning-soils/soil-growing.webp',
  },
  strong: {
    stage: 'strong',
    label: 'Gần thành thạo',
    minProgress: 70,
    maxProgress: 89,
    png: '/learning-soils/soil-strong.png',
    webp: '/learning-soils/soil-strong.webp',
  },
  mastered: {
    stage: 'mastered',
    label: 'Thành thạo',
    minProgress: 90,
    maxProgress: 100,
    png: '/learning-soils/soil-mastered.png',
    webp: '/learning-soils/soil-mastered.webp',
  },
  review: {
    stage: 'review',
    label: 'Cần ôn',
    minProgress: 1,
    maxProgress: 100,
    png: '/learning-soils/soil-strong.png',
    webp: '/learning-soils/soil-strong.webp',
  },
};

export const getLearningSoilStage = (progress: number, state?: 'locked' | 'review') => {
  if (state === 'locked') return learningSoilAssets.locked;
  if (progress <= 0) return learningSoilAssets.empty;
  if (progress < 25) return learningSoilAssets.early;
  if (progress < 50) return learningSoilAssets.learning;
  if (progress < 70) return learningSoilAssets.growing;
  if (progress < 90) return learningSoilAssets.strong;
  return learningSoilAssets.mastered;
};
