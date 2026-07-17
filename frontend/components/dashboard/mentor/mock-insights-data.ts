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
      xp: 2380,
      streak: 8,
      accuracyRate: 74,
      activeDaysCount: 19,
      aiChatCount: 32,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'agent-security-debug' || skill.id === 'tool-calling-execution') {
          return { ...skill, elo: 820, masteryScore: 5, status: 'WEAK' as const };
        }
        if (skill.id === 'transformer-foundations') {
          return { ...skill, elo: 1420, masteryScore: 88, status: 'MASTERED' as const };
        }
        return { ...skill, elo: 1120, masteryScore: 45, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-1',
          quizTitle: 'Day 08 - Metadata Filtering',
          completedAt: '23/06/2026 09:10',
          durationMinutes: 16,
          score: 7,
          accuracyRate: 70,
        },
        {
          id: 'attempt-2',
          quizTitle: 'Tool Calling Debug Lab',
          completedAt: '22/06/2026 19:45',
          durationMinutes: 24,
          score: 6,
          accuracyRate: 60,
        },
      ],
      mentorNotes: [
        'Có xu hướng hiểu nhanh phần nền tảng nhưng hụt khi câu hỏi chuyển sang execution detail.',
      ],
      interventions: [
        {
          id: 'itv-1',
          title: 'Giao thêm quiz về tool calling',
          createdAt: '22/06/2026',
          type: 'Bài tập',
          detail: 'Bổ dung 3 câu hỏi nâng dần độ khó để củng cố reasoning theo schema.',
        },
      ],
    },
    {
      id: 'std2',
      name: 'Trần Thị Bình',
      avatar: '👩‍💻',
      email: 'binh.tran@example.com',
      xp: 3210,
      streak: 14,
      accuracyRate: 92,
      activeDaysCount: 25,
      aiChatCount: 21,
      skills: studentBaseSkills.map((skill) => {
        if (
          skill.id === 'transformer-foundations' ||
          skill.id === 'ai-problem-formulation' ||
          skill.id === 'data-eval-strategy'
        ) {
          return { ...skill, elo: 1480, masteryScore: 97, status: 'MASTERED' as const };
        }
        return { ...skill, elo: 1210, masteryScore: 58, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-3',
          quizTitle: 'GraphRAG Concept Review',
          completedAt: '23/06/2026 08:25',
          durationMinutes: 12,
          score: 9,
          accuracyRate: 90,
        },
        {
          id: 'attempt-4',
          quizTitle: 'Context Engineering Sprint',
          completedAt: '21/06/2026 20:02',
          durationMinutes: 15,
          score: 10,
          accuracyRate: 100,
        },
      ],
      mentorNotes: ['Có thể giao vai trò peer-review cho các bộ câu hỏi draft khó hơn.'],
      interventions: [
        {
          id: 'itv-2',
          title: 'Mời review câu hỏi GraphRAG',
          createdAt: '21/06/2026',
          type: 'Mentoring',
          detail: 'Cho tham gia review distractor để tăng chiều sâu phản biện.',
        },
      ],
    },
    {
      id: 'std3',
      name: 'Lê Hoàng Minh',
      avatar: '👨‍🎓',
      email: 'hoangminh.le@example.com',
      xp: 1460,
      streak: 3,
      accuracyRate: 49,
      activeDaysCount: 11,
      aiChatCount: 27,
      skills: studentBaseSkills.map((skill) => {
        if (
          skill.id === 'embedding-vector-stores' ||
          skill.id === 'rag-pipelines' ||
          skill.id === 'roi-risk-management'
        ) {
          return { ...skill, elo: 780, masteryScore: 0, status: 'WEAK' as const };
        }
        if (skill.id === 'context-engineering' || skill.id === 'react-loop-foundations') {
          return { ...skill, elo: 810, masteryScore: 2, status: 'WEAK' as const };
        }
        return { ...skill, elo: 950, masteryScore: 21, status: 'NOT_STARTED' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-5',
          quizTitle: 'RAG Pipeline Stability Check',
          completedAt: '23/06/2026 07:54',
          durationMinutes: 21,
          score: 4,
          accuracyRate: 40,
        },
        {
          id: 'attempt-6',
          quizTitle: 'Embedding Fundamentals',
          completedAt: '22/06/2026 17:18',
          durationMinutes: 18,
          score: 5,
          accuracyRate: 50,
        },
      ],
      mentorNotes: ['Cần lộ trình bù kiến thức nền trước khi giao thêm bài multi-hop reasoning.'],
      interventions: [
        {
          id: 'itv-3',
          title: 'Gửi email nhắc lịch ôn tập',
          createdAt: '23/06/2026',
          type: 'Email',
          detail: 'Nhắc học viên ôn lại chunking, vector store và retrieval flow.',
        },
      ],
    },
    {
      id: 'std4',
      name: 'Phạm Thanh Thảo',
      avatar: '👩‍🎓',
      email: 'thao.pham@example.com',
      xp: 2140,
      streak: 10,
      accuracyRate: 81,
      activeDaysCount: 20,
      aiChatCount: 18,
      skills: studentBaseSkills.map((skill) => ({
        ...skill,
        elo: 1080,
        masteryScore: 40,
        status: 'LEARNING' as const,
      })),
      attemptLogs: [
        {
          id: 'attempt-7',
          quizTitle: 'Mentor HITL Practice',
          completedAt: '22/06/2026 15:42',
          durationMinutes: 14,
          score: 8,
          accuracyRate: 80,
        },
      ],
      mentorNotes: ['Ổn định, chỉ cần thêm bài tập tốc độ cho các vòng review.'],
      interventions: [],
    },
    {
      id: 'std5',
      name: 'Vũ Quốc Khánh',
      avatar: '🧑‍💻',
      email: 'khanh.vu@example.com',
      xp: 2010,
      streak: 6,
      accuracyRate: 68,
      activeDaysCount: 17,
      aiChatCount: 29,
      skills: studentBaseSkills.map((skill) => {
        if (skill.id === 'rag-pipelines') {
          return { ...skill, elo: 830, masteryScore: 4, status: 'WEAK' as const };
        }
        return { ...skill, elo: 1150, masteryScore: 50, status: 'LEARNING' as const };
      }),
      attemptLogs: [
        {
          id: 'attempt-8',
          quizTitle: 'Citation Validation Audit',
          completedAt: '22/06/2026 11:31',
          durationMinutes: 17,
          score: 6,
          accuracyRate: 60,
        },
      ],
      mentorNotes: ['Đã có cải thiện sau lần review trước, nhưng vẫn cần củng cố citation coverage.'],
      interventions: [
        {
          id: 'itv-4',
          title: 'Mentoring 1:1 về citation validation',
          createdAt: '20/06/2026',
          type: 'Mentoring',
          detail: 'Đi qua từng lỗi thiếu nguồn và cách tự kiểm tra trước khi nộp.',
        },
      ],
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
