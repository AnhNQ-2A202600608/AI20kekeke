import type { ConceptMastery } from './profile-utils';

export function getProfileLevel(xp: number) {
  const safeXp = Math.max(0, xp || 0);
  const level = Math.max(1, Math.floor(safeXp / 1000) + 1);
  const currentLevelXp = (level - 1) * 1000;
  const nextLevelXp = level * 1000;
  const progress = Math.round(((safeXp - currentLevelXp) / 1000) * 100);

  return { level, currentLevelXp, nextLevelXp, progress };
}

export function getEloRank(elo: number) {
  if (elo >= 1400) return 'Bậc thầy khu vườn';
  if (elo >= 1200) return 'Nhà thu hoạch khái niệm';
  if (elo >= 1050) return 'Người chăm vườn kiến thức';
  if (elo >= 900) return 'Mầm đang lớn';
  return 'Hạt mới gieo';
}

export function getConceptProgress(concept: ConceptMastery) {
  const mastery = concept.bktVal ?? Math.round(((concept.elo - 800) / 800) * 100);
  return Math.max(0, Math.min(100, mastery));
}

export function getPlantState(concept: ConceptMastery) {
  const progress = getConceptProgress(concept);
  if (concept.decayRisk || concept.status === 'weak') {
    return {
      assetState: 'review' as const,
      label: 'Cần tưới lại',
      tone: 'orange' as const,
      description: `Retention ${concept.retention}%`,
    };
  }
  if (concept.status === 'mastered') {
    return {
      assetState: undefined,
      label: 'Đã nở hoa',
      tone: 'green' as const,
      description: `Elo ${Math.round(concept.elo)}`,
    };
  }
  if (concept.status === 'zpd') {
    return {
      assetState: undefined,
      label: 'Vùng phát triển',
      tone: 'blue' as const,
      description: `Target ${concept.zpdThreshold}`,
    };
  }
  if (concept.status === 'learning') {
    return {
      assetState: undefined,
      label: 'Đang lớn',
      tone: 'yellow' as const,
      description: `Mastery ${progress}%`,
    };
  }
  return {
    assetState: undefined,
    label: 'Hạt mới',
    tone: 'neutral' as const,
    description: 'Cần gieo dữ liệu',
  };
}

export function getLearningHealth(concepts: ConceptMastery[], streak: number) {
  if (concepts.length === 0) {
    return { score: 0, label: 'Chưa có dữ liệu', detail: 'Gieo hạt đầu tiên để mở hồ sơ.' };
  }

  const healthy = concepts.filter((c) => c.status === 'mastered' || c.status === 'zpd' || c.status === 'learning').length;
  const recovery = concepts.filter((c) => c.status === 'weak' || c.decayRisk).length;
  const retentionAverage = concepts.reduce((sum, c) => sum + c.retention, 0) / concepts.length;
  const base = (healthy / concepts.length) * 55 + Math.min(streak, 14) * 2 + retentionAverage * 0.17 - recovery * 6;
  const score = Math.max(12, Math.min(98, Math.round(base)));

  if (score >= 80) return { score, label: 'Rất tốt', detail: 'Vườn kỹ năng đang phát triển đều.' };
  if (score >= 65) return { score, label: 'Ổn định', detail: 'Giữ nhịp chăm vườn hiện tại.' };
  if (score >= 45) return { score, label: 'Cần chăm nhẹ', detail: 'Một vài vùng đất cần phục hồi.' };
  return { score, label: 'Cần khởi động lại', detail: 'Bắt đầu bằng một nhiệm vụ ngắn.' };
}
