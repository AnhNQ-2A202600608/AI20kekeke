import dayjs from 'dayjs';
import { MasteryStatus, Skill } from '@/lib/quiz/types';

export interface AttemptLog {
  id: string;
  quizTitle: string;
  completedAt: string;
  durationMinutes: number;
  score: number;
  accuracyRate: number;
}

export interface InterventionItem {
  id: string;
  title: string;
  createdAt: string;
  type: 'Email' | 'Bài tập' | 'Mentoring';
  detail: string;
}

export interface StudentData {
  id: string;
  name: string;
  avatar: string;
  email: string;
  xp: number;
  streak: number;
  accuracyRate: number;
  activeDaysCount: number;
  aiChatCount: number;
  skills: Skill[];
  attemptLogs: AttemptLog[];
  mentorNotes: string[];
  interventions: InterventionItem[];
  eloHistory: Array<{ day: string; elo: number }>;
  activityHistory: Array<{ date: string; eloChange: number; masteredConcept?: string; xp?: number }>;
}

export const generateEloHistory = (studentId: string, baseElo: number) => {
  const history = [];
  const seed = studentId === 'std1' ? 1 : studentId === 'std2' ? 2 : studentId === 'std3' ? 3 : studentId === 'std4' ? 4 : 5;
  for (let i = 29; i >= 0; i--) {
    const date = dayjs('2026-06-23').subtract(i, 'day').format('DD/MM');
    const variation = Math.sin(i * 0.5 + seed) * 45 + (30 - i) * 2.5 - 40;
    history.push({
      day: date,
      elo: Math.round(baseElo + variation),
    });
  }
  return history;
};

export const generateActivityHistory = (studentId: string) => {
  const history = [];
  const seed = studentId === 'std1' ? 1 : studentId === 'std2' ? 2 : studentId === 'std3' ? 3 : studentId === 'std4' ? 4 : 5;
  const masteriesPool = ['Prompt Engineering', 'AI & LLM Foundation', 'RAG Pipeline', 'Design Pattern ReAct'];
  for (let i = 29; i >= 0; i--) {
    const date = dayjs('2026-06-23').subtract(i, 'day').format('YYYY-MM-DD');
    const isActive = (i + seed) % 5 !== 0; // 80% active
    
    let eloChange = 0;
    let masteredConcept: string | undefined = undefined;
    
    if (isActive) {
      const isStruggling = (i + seed) % 7 === 0;
      const isMasteryDay = (i + seed) % 11 === 0;
      
      if (isMasteryDay) {
        eloChange = Math.round(35 + (i % 3) * 12);
        masteredConcept = masteriesPool[(i + seed) % masteriesPool.length];
      } else if (isStruggling) {
        eloChange = -Math.round(8 + (i % 4) * 5); // negative change
      } else {
        eloChange = Math.round(5 + (i % 5) * 8); // positive change
      }
    }
    history.push({
      date,
      eloChange,
      masteredConcept,
      xp: isActive ? Math.round(35 + Math.sin(i * seed) * 25 + (i % 2 === 0 ? 15 : 0)) : 0,
    });
  }
  return history;
};

export const getFallbackMockStudents = (studentBaseSkills: Skill[]): StudentData[] => {
  const rawStudents: Omit<StudentData, 'eloHistory' | 'activityHistory'>[] = [
    {
      id: 'std1',
      name: 'Nguyễn Văn Anh',
      avatar: '👨‍💻',
      email: 'vananh.nguyen@example.com',
      xp: 3450,
      streak: 12,
      accuracyRate: 92,
      activeDaysCount: 25,
      aiChatCount: 21,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'M7.SDS.05') {
          return { ...skill, elo: 1420, masteryScore: 95, status: 'MASTERED' as const };
        }
        if (skill.id === 'M6.SDS.03') {
          return { ...skill, elo: 1480, masteryScore: 98, status: 'MASTERED' as const };
        }
        if (skill.id === 'M5.SDS.02') {
          return { ...skill, elo: 1510, masteryScore: 99, status: 'MASTERED' as const };
        }
        return { ...skill, elo: 1300, masteryScore: 90, status: 'MASTERED' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-1',
          quizTitle: 'Tìm x trong tỉ lệ thức x/4 = 9/12',
          completedAt: '23/06/2026 09:10',
          durationMinutes: 12,
          score: 10,
          accuracyRate: 100,
        },
      ],
      mentorNotes: ['Thành tích xuất sắc, nắm vững toàn bộ kiến thức nền tảng và đại lượng tỉ lệ.'],
      interventions: [],
    },
    {
      id: 'std2',
      name: 'Trần Thị Bình',
      avatar: '👩‍💻',
      email: 'binh.tran@example.com',
      xp: 2400,
      streak: 5,
      accuracyRate: 81,
      activeDaysCount: 25,
      aiChatCount: 21,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'M7.SDS.05') {
          return { ...skill, elo: 1120, masteryScore: 72, status: 'LEARNING' as const };
        }
        if (skill.id === 'M6.SDS.03') {
          return { ...skill, elo: 1250, masteryScore: 89, status: 'MASTERED' as const };
        }
        if (skill.id === 'M5.SDS.02') {
          return { ...skill, elo: 1300, masteryScore: 92, status: 'MASTERED' as const };
        }
        return { ...skill, elo: 1150, masteryScore: 70, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-2',
          quizTitle: 'Tìm x trong tỉ lệ thức x/4 = 9/12',
          completedAt: '23/06/2026 08:25',
          durationMinutes: 15,
          score: 8,
          accuracyRate: 80,
        },
      ],
      mentorNotes: ['Học lực khá tốt, nắm chắc khái niệm tỉ lệ thức, đang hoàn thiện kỹ năng thực hành.'],
      interventions: [],
    },
    {
      id: 'std3',
      name: 'Lê Hoàng Minh',
      avatar: '👨‍🎓',
      email: 'hoangminh.le@example.com',
      xp: 1350,
      streak: 2,
      accuracyRate: 49,
      activeDaysCount: 11,
      aiChatCount: 27,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'M7.SDS.05') {
          return { ...skill, elo: 720, masteryScore: 2, status: 'WEAK' as const };
        }
        if (skill.id === 'M6.SDS.03') {
          return { ...skill, elo: 780, masteryScore: 5, status: 'WEAK' as const };
        }
        if (skill.id === 'M5.SDS.02') {
          return { ...skill, elo: 810, masteryScore: 12, status: 'WEAK' as const };
        }
        return { ...skill, elo: 850, masteryScore: 20, status: 'WEAK' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-3',
          quizTitle: 'Tỉ lệ thức là đẳng thức của hai tỉ số. Đúng hay sai?',
          completedAt: '23/06/2026 07:54',
          durationMinutes: 21,
          score: 0,
          accuracyRate: 0,
        },
      ],
      mentorNotes: ['Mất gốc nặng phân số lớp 5 và tỉ số lớp 6, dẫn tới không giải quyết được tỉ lệ thức lớp 7.'],
      interventions: [
        {
          id: 'itv-1',
          title: 'Giao lại chuyên đề Phân số lớp 5',
          createdAt: '23/06/2026',
          type: 'Bài tập',
          detail: 'Bổ sung 5 bài tập nhận biết phân số bằng nhau để củng cố lại gốc rễ.',
        },
      ],
    },
    {
      id: 'std4',
      name: 'Phạm Thanh Thảo',
      avatar: '👩‍🎓',
      email: 'thao.pham@example.com',
      xp: 2100,
      streak: 0,
      accuracyRate: 68,
      activeDaysCount: 20,
      aiChatCount: 18,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'M7.SDS.05') {
          return { ...skill, elo: 830, masteryScore: 4, status: 'WEAK' as const };
        }
        if (skill.id === 'M6.SDS.03') {
          return { ...skill, elo: 1140, masteryScore: 82, status: 'LEARNING' as const };
        }
        if (skill.id === 'M5.SDS.02') {
          return { ...skill, elo: 1210, masteryScore: 90, status: 'MASTERED' as const };
        }
        return { ...skill, elo: 1100, masteryScore: 75, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-4',
          quizTitle: 'Biết x và y tỉ lệ thuận với nhau và khi x = 2 thì y = 6. Tìm hệ số tỉ lệ k',
          completedAt: '22/06/2026 15:42',
          durationMinutes: 14,
          score: 0,
          accuracyRate: 0,
        },
      ],
      mentorNotes: ['Yếu phần đại lượng tỉ lệ thuận/nghịch lớp 7, cần hướng dẫn thêm tính chất dãy tỉ số bằng nhau.'],
      interventions: [
        {
          id: 'itv-2',
          title: 'Kèm cặp 1:1 về Đại lượng tỉ lệ',
          createdAt: '22/06/2026',
          type: 'Mentoring',
          detail: 'Hướng dẫn lại cách lập tỉ số từ đại lượng tỉ lệ thuận.',
        },
      ],
    },
    {
      id: 'std5',
      name: 'Vũ Quốc Khánh',
      avatar: '🧑‍💻',
      email: 'khanh.vu@example.com',
      xp: 1950,
      streak: 4,
      accuracyRate: 74,
      activeDaysCount: 17,
      aiChatCount: 29,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'M7.SDS.05') {
          return { ...skill, elo: 1050, masteryScore: 52, status: 'LEARNING' as const };
        }
        if (skill.id === 'M6.SDS.03') {
          return { ...skill, elo: 1110, masteryScore: 74, status: 'LEARNING' as const };
        }
        if (skill.id === 'M5.SDS.02') {
          return { ...skill, elo: 1180, masteryScore: 81, status: 'LEARNING' as const };
        }
        return { ...skill, elo: 1120, masteryScore: 75, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-5',
          quizTitle: 'Tìm x trong tỉ lệ thức x/4 = 9/12',
          completedAt: '22/06/2026 11:31',
          durationMinutes: 17,
          score: 10,
          accuracyRate: 100,
        },
      ],
      mentorNotes: ['Đang có tiến bộ đều ở các chủ đề đại số lớp 5-7.'],
      interventions: [],
    },
  ];

  return rawStudents.map((std) => {
    const avgElo = Math.round(
      std.skills.reduce((sum, s) => sum + s.elo, 0) / Math.max(1, std.skills.length)
    );
    return {
      ...std,
      eloHistory: generateEloHistory(std.id, avgElo),
      activityHistory: generateActivityHistory(std.id),
    };
  });
};
