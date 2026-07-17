import type { ActivePracticeSession, Skill } from '@/lib/quiz/types';

export type PracticeGardenState = 'new' | 'in_progress' | 'review' | 'mastered' | 'locked';

export interface PracticeDayOption {
  id: string | null;
  label: string;
  description: string;
  weakCount: number;
  skillCount: number;
}

export interface PracticeGardenSkill {
  id: string;
  name: string;
  description: string;
  dayId: string;
  dayLabel: string;
  elo: number;
  mastery: number;
  status: Skill['status'];
  state: PracticeGardenState;
  stateLabel: string;
  stateHint: string;
  ctaLabel: string;
  isRecommended: boolean;
  associatedSets: string[];
  activeSetId?: string;
  sourceSkill: Skill;
}

interface CourseDay {
  id: string;
  label: string;
  desc: string;
}

interface CreatePracticeGardenModelParams {
  skills: Skill[];
  days: CourseDay[];
  selectedDayId: string | null;
  activePracticeSession: ActivePracticeSession | null;
}

const stateWeight: Record<PracticeGardenState, number> = {
  review: 0,
  in_progress: 1,
  new: 2,
  mastered: 3,
  locked: 4,
};

function getSkillState(skill: Skill, activePracticeSession: ActivePracticeSession | null): PracticeGardenState {
  if (!skill.associatedSets?.length) {
    return 'locked';
  }

  if (activePracticeSession?.skillId === skill.id) {
    return 'in_progress';
  }

  if (skill.status === 'WEAK') {
    return 'review';
  }

  if (skill.status === 'LEARNING') {
    return 'in_progress';
  }

  if (skill.status === 'MASTERED') {
    return 'mastered';
  }

  return 'new';
}

export function getPracticeGardenStateCopy(state: PracticeGardenState): {
  label: string;
  hint: string;
  cta: string;
} {
  switch (state) {
    case 'review':
      return {
        label: 'Cần tưới lại',
        hint: 'Có dấu hiệu yếu, nên ôn ngay để giữ nhịp.',
        cta: 'Ôn lại',
      };
    case 'in_progress':
      return {
        label: 'Đang nảy mầm',
        hint: 'Đang có tiến triển hoặc phiên luyện còn dang dở.',
        cta: 'Luyện tiếp',
      };
    case 'mastered':
      return {
        label: 'Đã nở hoa',
        hint: 'Kỹ năng ổn định, luyện nhẹ để duy trì.',
        cta: 'Duy trì',
      };
    case 'locked':
      return {
        label: 'Sắp mở',
        hint: 'Chưa có bộ câu luyện tập cho kỹ năng này.',
        cta: 'Sắp mở',
      };
    case 'new':
    default:
      return {
        label: 'Hạt giống mới',
        hint: 'Sẵn sàng bắt đầu gieo nền tảng.',
        cta: 'Bắt đầu luyện',
      };
  }
}

export function createPracticeGardenModel({
  skills,
  days,
  selectedDayId,
  activePracticeSession,
}: CreatePracticeGardenModelParams) {
  const dayOptions: PracticeDayOption[] = [
    {
      id: null,
      label: 'Tất cả',
      description: 'Toàn bộ vườn',
      weakCount: skills.filter((skill) => skill.status === 'WEAK').length,
      skillCount: skills.length,
    },
    ...days.map((day) => {
      const daySkills = skills.filter((skill) => skill.dayId === day.id);
      return {
        id: day.id,
        label: day.label,
        description: day.desc,
        weakCount: daySkills.filter((skill) => skill.status === 'WEAK').length,
        skillCount: daySkills.length,
      };
    }),
  ];

  const visibleSkills = selectedDayId
    ? skills.filter((skill) => skill.dayId === selectedDayId)
    : skills;

  const mappedSkills = visibleSkills
    .map<PracticeGardenSkill>((skill) => {
      const state = getSkillState(skill, activePracticeSession);
      const copy = getPracticeGardenStateCopy(state);
      const day = days.find((item) => item.id === skill.dayId);
      const activeSetId = activePracticeSession?.skillId === skill.id
        ? activePracticeSession.targetSetId || skill.associatedSets?.[0]
        : skill.associatedSets?.[0];

      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        dayId: skill.dayId,
        dayLabel: day?.label || skill.dayId,
        elo: skill.elo,
        mastery: Math.max(0, Math.min(100, skill.masteryScore)),
        status: skill.status,
        state,
        stateLabel: copy.label,
        stateHint: copy.hint,
        ctaLabel: copy.cta,
        isRecommended: false,
        associatedSets: skill.associatedSets || [],
        activeSetId,
        sourceSkill: skill,
      };
    })
    .sort((a, b) => {
      const stateDiff = stateWeight[a.state] - stateWeight[b.state];
      if (stateDiff !== 0) return stateDiff;
      return a.mastery - b.mastery;
    });

  const recommendedSkill = mappedSkills[0] || null;
  const gardenSkills = mappedSkills.map((skill) => ({
    ...skill,
    isRecommended: recommendedSkill?.id === skill.id,
  }));

  return {
    dayOptions,
    gardenSkills,
    recommendedSkill: gardenSkills.find((skill) => skill.id === recommendedSkill?.id) || null,
  };
}
