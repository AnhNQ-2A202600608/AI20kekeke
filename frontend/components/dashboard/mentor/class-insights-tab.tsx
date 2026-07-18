'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Mail,
  MessageSquarePlus,
  NotebookPen,
  PlusCircle,
  Search,
  Target,
  TrendingDown,
  Trophy,
  UserCheck,
  Users,
} from 'lucide-react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { MascotLoadingBlock } from '@/components/mascot';
import { MasteryStatus, Skill } from '@/lib/quiz/types';
import dayjs from 'dayjs';
import dynamic from 'next/dynamic';
import { MarkerType } from '@xyflow/react';
import { CONCEPT_MAPPING, getLayoutedElements } from '../profile/utils/profile-utils';
import { AttemptLog, InterventionItem, StudentData, getFallbackMockStudents } from './mock-insights-data';
import {
  LineChart,
  Line,
  XAxis as RechartsXAxis,
  YAxis as RechartsYAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  ReferenceLine,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
} from 'recharts';

type InsightsSubview = 'overview' | 'directory';
type StudentProfileSection =
  | 'mastery-map'
  | 'dag-graph'
  | 'progress-visuals'
  | 'memory-decay'
  | 'attempt-logs'
  | 'mentor-notes';
type StudentSortKey = 'name' | 'elo' | 'weakSkills' | 'completionRate';
type StudentStatus = 'needs-support' | 'stable';

interface ApiSkillData {
  concept_id: string;
  code: string;
  name: string;
  elo: number;
  bkt_mastery_probability: number;
  bkt_mastery_probability_stored?: number;
  mastery_state: 'not_started' | 'weak' | 'learning' | 'mastered';
  weakness_flag: boolean;
  attempt_count: number;
  correct_count: number;
  last_practiced_at: string | null;
  stability_days: number | null;
}

interface ApiAttemptLog {
  id: string;
  question_prompt: string;
  concept_name: string;
  is_correct: boolean;
  actual_score: number;
  hint_count: number;
  submitted_at: string;
  response_time_ms: number | null;
}

interface ApiStudentData {
  id: string;
  full_name: string;
  email: string;
  mssv: string | null;
  accuracy_rate: number;
  total_attempts: number;
  total_correct: number;
  active_days_count: number;
  ai_chat_count: number;
  last_active_at: string | null;
  streak: number;
  skills: ApiSkillData[];
  recent_attempts: ApiAttemptLog[];
}

function apiToStudentData(api: ApiStudentData): StudentData {
  const mapStatus = (state: string): MasteryStatus => {
    switch (state) {
      case 'mastered': return 'MASTERED';
      case 'learning': return 'LEARNING';
      case 'weak': return 'WEAK';
      default: return 'NOT_STARTED';
    }
  };

  const skills: Skill[] = api.skills.map((s) => ({
    id: s.code,
    name: s.name,
    description: '',
    dayId: '',
    elo: s.elo,
    masteryScore: Math.round(s.bkt_mastery_probability * 100),
    status: s.weakness_flag ? 'WEAK' : mapStatus(s.mastery_state),
    lastPracticedAt: s.last_practiced_at ?? undefined,
    stabilityDays: s.stability_days ?? undefined,
    attemptCount: s.attempt_count,
  } as any));

  return {
    id: api.id,
    name: api.full_name,
    avatar: '🧑‍🎓',
    email: api.email,
    xp: api.total_attempts * 50 + api.total_correct * 100,
    streak: api.streak ?? 0,
    accuracyRate: Math.round(api.accuracy_rate),
    activeDaysCount: api.active_days_count,
    aiChatCount: api.ai_chat_count,
    skills,
    attemptLogs: api.recent_attempts.map((a) => ({
      id: a.id,
      quizTitle: a.question_prompt.substring(0, 60) + (a.question_prompt.length > 60 ? '...' : ''),
      completedAt: dayjs(a.submitted_at).format('DD/MM/YYYY HH:mm'),
      durationMinutes: a.response_time_ms ? Math.round(a.response_time_ms / 60000) : 0,
      score: Math.round(a.actual_score * 10),
      accuracyRate: Math.round(a.actual_score * 100),
    })),
    mentorNotes: [],
    interventions: [],
    eloHistory: [],
    activityHistory: [],
  };
}

const NOTES_STORAGE_KEY = 'mentor_portal_student_notes_v1';

const generateEloHistory = (studentId: string, baseElo: number) => {
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

const generateActivityHistory = (studentId: string) => {
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

const PROFILE_SECTION_OPTIONS: Array<{ id: StudentProfileSection; label: string }> = [
  { id: 'mastery-map', label: 'Bản đồ Năng lực' },
  { id: 'dag-graph', label: 'Sơ đồ liên kết (DAG)' },
  { id: 'progress-visuals', label: 'Tiến độ & Chuyên cần' },
  { id: 'memory-decay', label: 'Đồ thị lãng quên' },
  { id: 'attempt-logs', label: 'Nhật ký làm bài' },
  { id: 'mentor-notes', label: 'Hỗ trợ & ghi chú' },
];

const DIRECTORY_STATUS_OPTIONS: Array<{ id: 'all' | StudentStatus; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'needs-support', label: 'Cần hỗ trợ' },
  { id: 'stable', label: 'Ổn định' },
];

const SORT_OPTIONS: Array<{ id: StudentSortKey; label: string }> = [
  { id: 'name', label: 'Tên A-Z' },
  { id: 'elo', label: 'Elo TB' },
  { id: 'weakSkills', label: 'Số kỹ năng yếu' },
  { id: 'completionRate', label: 'Tỷ lệ hoàn thành' },
];

const getStatusBadgeColor = (status: MasteryStatus) => {
  switch (status) {
    case 'MASTERED':
      return 'bg-primary-green-light/20 text-primary-green-dark border-primary-green/30';
    case 'LEARNING':
      return 'bg-tertiary-yellow/15 text-tertiary-yellow-dark border-tertiary-yellow/30';
    case 'WEAK':
      return 'bg-error-red-light/20 text-error-red-dark border-error-red/30';
    default:
      return 'bg-stone-100 text-stone-400 border-stone-200';
  }
};

const getStatusLabel = (status: MasteryStatus) => {
  switch (status) {
    case 'MASTERED':
      return 'Thành thạo';
    case 'LEARNING':
      return 'Đang học';
    case 'WEAK':
      return 'Cần ôn tập';
    default:
      return 'Chưa bắt đầu';
  }
};

const getProgressBarColor = (status: MasteryStatus) => {
  switch (status) {
    case 'MASTERED':
      return 'bg-primary-green';
    case 'WEAK':
      return 'bg-error-red';
    default:
      return 'bg-tertiary-yellow';
  }
};

const getStatusColorHex = (status: MasteryStatus) => {
  switch (status) {
    case 'MASTERED':
      return '#58cc02'; // Green for Mastered to match primary-green
    case 'LEARNING':
      return '#f59e0b'; // Amber yellow for Learning to match tertiary-yellow
    case 'WEAK':
      return '#ea580c'; // Red/Orange for Weak to match error-red
    default:
      return '#a8a29e'; // Grey for Not Started
  }
};

const averageSkillElo = (skills: Skill[]) => {
  const practiced = skills.filter((s: any) => (s.attemptCount || 0) > 0);
  const target = practiced.length > 0 ? practiced : skills;
  return Math.round(target.reduce((sum, skill) => sum + skill.elo, 0) / Math.max(1, target.length));
};

const masteryCompletionRate = (skills: Skill[]) => {
  const masteredCount = skills.filter((skill) => skill.status === 'MASTERED').length;
  return Math.round((masteredCount / Math.max(1, skills.length)) * 100);
};

const weakSkillCount = (skills: Skill[]) => skills.filter((skill) => skill.status === 'WEAK').length;

const studentSupportStatus = (skills: Skill[]): StudentStatus =>
  weakSkillCount(skills) > 0 ? 'needs-support' : 'stable';

const getShortName = (name: string) => {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  const firstName = parts[parts.length - 1];
  const middleAndFamily = parts.slice(0, -1);
  const initials = middleAndFamily.map((p) => p[0]).join('');
  return `${initials}. ${firstName}`;
};
const getShortConceptName = (name: string) => {
  const coreMap: Record<string, string> = {
    'transformer foundations': 'Transf',
    'context engineering': 'Context',
    'react loop foundations': 'React L.',
    'tool calling execution': 'Tool Call',
    'rag pipelines': 'RAG',
    'embedding & vector stores': 'Embed',
    'citation & validation': 'Citation',
    'agent security & debug': 'Security',
  };

  const key = name.toLowerCase().trim();
  if (coreMap[key]) return coreMap[key];

  const words = name.trim().split(/\s+/);
  if (words.length <= 1) return name;
  return `${words[0]} ${words[1][0]}.`;
};

const SectionHeader = ({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
    <div>
      <p className="text-[10px] font-black uppercase tracking-widest text-stone-400 font-mono">
        {eyebrow}
      </p>
      <h3 className="text-lg font-black text-on-background font-fraunces">{title}</h3>
      {description ? <p className="text-xs text-stone-500 font-medium mt-1">{description}</p> : null}
    </div>
    {action}
  </div>
);

const SKILL_NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  'transformer-foundations': { x: 80, y: 150 },
  'context-engineering': { x: 260, y: 80 },
  'react-loop-foundations': { x: 260, y: 220 },
  'tool-calling-execution': { x: 440, y: 80 },
  'rag-pipelines': { x: 440, y: 220 },
  'embedding-vector-stores': { x: 620, y: 150 },
  'citation-validation': { x: 800, y: 80 },
  'agent-security-debug': { x: 800, y: 220 },
};

const PREREQUISITE_EDGES = [
  { source: 'transformer-foundations', target: 'context-engineering' },
  { source: 'transformer-foundations', target: 'react-loop-foundations' },
  { source: 'context-engineering', target: 'tool-calling-execution' },
  { source: 'react-loop-foundations', target: 'rag-pipelines' },
  { source: 'tool-calling-execution', target: 'embedding-vector-stores' },
  { source: 'rag-pipelines', target: 'embedding-vector-stores' },
  { source: 'embedding-vector-stores', target: 'citation-validation' },
  { source: 'embedding-vector-stores', target: 'agent-security-debug' },
];

const MentorSkillTreeGraph = dynamic(
  () => import('./components/mentor-skill-tree-graph').then((m) => m.MentorSkillTreeGraph),
  {
    ssr: false,
    loading: () => (
      <MascotLoadingBlock
        title="Sofi đang dựng bản đồ lớp..."
        description="Đang chuẩn bị skill tree cho mentor"
        className="h-[400px]"
      />
    ),
  }
);

export const ClassInsightsTab: React.FC = () => {
  const { skills: studentBaseSkills, token } = useBoundStore();
  const tooltipHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeSubview, setActiveSubview] = useState<InsightsSubview>('overview');
  const [isCompactMode, setIsCompactMode] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<{
    key: string;
    x: number;
    y: number;
    targetHeight: number;
    content: React.ReactNode;
  } | null>(null);

  const handleMouseEnter = (e: React.MouseEvent, key: string, content: React.ReactNode) => {
    if (tooltipHideTimeoutRef.current) {
      clearTimeout(tooltipHideTimeoutRef.current);
      tooltipHideTimeoutRef.current = null;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    setHoveredTooltip((current) => {
      if (
        current?.key === key &&
        Math.abs(current.x - (rect.left + rect.width / 2)) < 1 &&
        Math.abs(current.y - rect.top) < 1
      ) {
        return current;
      }

      return {
        key,
        x: rect.left + rect.width / 2,
        y: rect.top,
        targetHeight: rect.height,
        content,
      };
    });
  };

  const handleMouseLeave = () => {
    tooltipHideTimeoutRef.current = setTimeout(() => {
      setHoveredTooltip(null);
      tooltipHideTimeoutRef.current = null;
    }, 80);
  };

  useEffect(() => {
    return () => {
      if (tooltipHideTimeoutRef.current) {
        clearTimeout(tooltipHideTimeoutRef.current);
      }
    };
  }, []);

  const tooltipStyle = useMemo(() => {
    if (!hoveredTooltip) return null;

    const tooltipWidth = 224; // w-56 = 14rem = 224px
    const tooltipHeight = 140; // estimated maximum tooltip height
    const padding = 12; // spacing from screen edges
    const gap = 8;
    
    let left = hoveredTooltip.x - tooltipWidth / 2;
    let top = hoveredTooltip.y;
    let showBelow = false;

    if (typeof window !== 'undefined') {
      // Prevent horizontal overflow
      if (left < padding) {
        left = padding;
      } else if (left + tooltipWidth > window.innerWidth - padding) {
        left = window.innerWidth - padding - tooltipWidth;
      }

      // If rendering above would overflow the top of the viewport, render below instead
      if (top - tooltipHeight < padding) {
        showBelow = true;
      }
    }

    return {
      left: `${left}px`,
      top: showBelow
        ? `${top + hoveredTooltip.targetHeight + gap}px`
        : `${Math.max(padding, top - gap)}px`,
      showBelow,
    };
  }, [hoveredTooltip]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [studentProfileSection, setStudentProfileSection] =
    useState<StudentProfileSection>('mastery-map');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | StudentStatus>('all');
  const [sortKey, setSortKey] = useState<StudentSortKey>('elo');
  const [notification, setNotification] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [alertSearchQuery, setAlertSearchQuery] = useState('');
  const [selectedAlertStudents, setSelectedAlertStudents] = useState<string[]>([]);
  const [alertPage, setAlertPage] = useState(1);
  const ALERTS_PER_PAGE = 4;
  const [enableClustering, setEnableClustering] = useState(false);
  const [mapViewMode, setMapViewMode] = useState<'graph' | 'list'>('graph');
  const [heatmapViewMode, setHeatmapViewMode] = useState<'matrix' | 'cards'>('matrix');
  const [notesByStudent, setNotesByStudent] = useState<Record<string, string[]>>(() => {
    if (typeof window === 'undefined') return {};
    const storedValue = window.localStorage.getItem(NOTES_STORAGE_KEY);
    if (!storedValue) return {};

    try {
      return JSON.parse(storedValue) as Record<string, string[]>;
    } catch {
      return {};
    }
  });

  const [liveStats, setLiveStats] = useState<{
    totalStudents: number;
    classAvgElo: number;
    weakestSkillName: string;
    weakestSkillAvgElo: number | string;
    completionRate: number;
  } | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    let active = true;
    async function fetchStats() {
      setIsLoadingStats(true);
      try {
        const response = await fetch(
          '/api/v1/adaptive/class-stats?course_id=00000000-0000-0000-0000-000000000001',
          { headers: { Authorization: `Bearer ${token || 'service_role'}` } }
        );
        if (response.ok && active) {
          const data = await response.json();
          setLiveStats({
            totalStudents: data.total_students,
            classAvgElo: Math.round(data.class_average_elo),
            weakestSkillName: data.weakest_skill?.name ?? '—',
            weakestSkillAvgElo:
              data.weakest_skill?.avg_elo != null ? Math.round(data.weakest_skill.avg_elo) : '—',
            completionRate: Math.round(data.completion_rate),
          });
        }
      } catch (err) {
        console.error('Failed to fetch class stats:', err);
      } finally {
        if (active) setIsLoadingStats(false);
      }
    }
    fetchStats();
    return () => { active = false; };
  }, [token]);

  const [students, setStudents] = useState<StudentData[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Stale-While-Revalidate: load cached data from sessionStorage on mount
  useEffect(() => {
    let timerId: any;
    if (typeof window !== 'undefined') {
      const cached = window.sessionStorage.getItem('mentor_portal_class_insights_v1');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          timerId = setTimeout(() => {
            setStudents(parsed);
            setIsLoadingStudents(false);
          }, 0);
        } catch (e) {
          console.warn('Failed to parse cached class insights:', e);
        }
      }
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, []);

  useEffect(() => {
    let active = true;
    async function fetchStudents() {
      if (students.length === 0) setIsLoadingStudents(true);
      try {
        const response = await fetch(
          '/api/v1/adaptive/class-insights?course_id=00000000-0000-0000-0000-000000000001&limit=100',
          { headers: { Authorization: `Bearer ${token || 'service_role'}` } }
        );
        if (!response.ok) throw new Error(`API returned ${response.status}`);
        const data = await response.json();
        if (active) {
          const mapped = data.students.map(apiToStudentData);
          setStudents(mapped);
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('mentor_portal_class_insights_v1', JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn('API error, using mock fallback:', err);
        if (active) {
          setStudents(getFallbackMockStudents(studentBaseSkills));
        }
      } finally {
        if (active) setIsLoadingStudents(false);
      }
    }
    fetchStudents();
    return () => { active = false; };
  }, [token, studentBaseSkills]);

  const _students_dummy = useMemo<StudentData[]>(() => {  // kept to avoid restructuring; data comes from useState above
    if (!token) return [];

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);  // _students_dummy: unused — real data fetched in useEffect above

  const defaultNotesByStudent = useMemo(
    () =>
      students.reduce<Record<string, string[]>>((acc, student) => {
        acc[student.id] = student.mentorNotes;
        return acc;
      }, {}),
    [students]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || Object.keys(notesByStudent).length === 0) return;
    window.localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notesByStudent));
  }, [notesByStudent]);

  const studentMetrics = useMemo(() => {
    return students.reduce<
      Record<
        string,
        {
          avgElo: number;
          weakSkills: number;
          completionRate: number;
          status: StudentStatus;
        }
      >
    >((acc, student) => {
      acc[student.id] = {
        avgElo: averageSkillElo(student.skills),
        weakSkills: weakSkillCount(student.skills),
        completionRate: masteryCompletionRate(student.skills),
        status: studentSupportStatus(student.skills),
      };
      return acc;
    }, {});
  }, [students]);

  const totalStudents = students.length;
  const classAvgElo = Math.round(
    students.reduce((sum, student) => sum + studentMetrics[student.id].avgElo, 0) /
      Math.max(1, students.length)
  );

  const weakestSkill = useMemo(() => {
    const skillMap = new Map<string, { name: string; sum: number; count: number }>();

    students.forEach((student) => {
      student.skills.forEach((skill) => {
        const current = skillMap.get(skill.id) ?? { name: skill.name, sum: 0, count: 0 };
        current.sum += skill.elo;
        current.count += 1;
        skillMap.set(skill.id, current);
      });
    });

    let result: { id: string; name: string; avg: number } | null = null;
    for (const [key, value] of skillMap.entries()) {
      const avg = Math.round(value.sum / value.count);
      if (!result || avg < result.avg) {
        result = { id: key, name: value.name, avg };
      }
    }

    return result;
  }, [students]);

  const completionRate = Math.round(
    students.reduce((sum, student) => sum + studentMetrics[student.id].completionRate, 0) /
      Math.max(1, students.length)
  );

  // Prefer API-sourced stats; fallback to client-computed values from student list
  const displayTotalStudents = liveStats !== null ? liveStats.totalStudents : totalStudents;
  const displayClassAvgElo = liveStats !== null ? liveStats.classAvgElo : classAvgElo;
  const displayWeakestSkillName = liveStats !== null ? liveStats.weakestSkillName : (weakestSkill?.name ?? '—');
  const displayWeakestSkillAvg = liveStats !== null ? liveStats.weakestSkillAvgElo : (weakestSkill?.avg ?? '—');
  const displayCompletionRate = liveStats !== null ? liveStats.completionRate : completionRate;

  const filteredAlertStudents = useMemo(() => {
    return [...students]
      .filter((student) => studentMetrics[student.id].weakSkills > 0)
      .filter((student) => {
        const query = alertSearchQuery.trim().toLowerCase();
        return (
          query === '' ||
          student.name.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query)
        );
      })
      .sort((left, right) => studentMetrics[right.id].weakSkills - studentMetrics[left.id].weakSkills);
  }, [students, alertSearchQuery, studentMetrics]);

  const totalAlertPages = Math.max(1, Math.ceil(filteredAlertStudents.length / ALERTS_PER_PAGE));
  const paginatedAlertStudents = useMemo(() => {
    const start = (alertPage - 1) * ALERTS_PER_PAGE;
    return filteredAlertStudents.slice(start, start + ALERTS_PER_PAGE);
  }, [filteredAlertStudents, alertPage]);

  const masteryRows = useMemo(() => {
    const skillMap = new Map<
      string,
      {
        id: string;
        name: string;
        avgElo: number;
        weakCount: number;
        masteredCount: number;
        learningCount: number;
        notStartedCount: number;
      }
    >();

    students.forEach((student) => {
      student.skills.forEach((skill) => {
        const current = skillMap.get(skill.id) ?? {
          id: skill.id,
          name: skill.name,
          avgElo: 0,
          weakCount: 0,
          masteredCount: 0,
          learningCount: 0,
          notStartedCount: 0,
        };
        current.avgElo += skill.elo;
        if (skill.status === 'WEAK') current.weakCount += 1;
        if (skill.status === 'MASTERED') current.masteredCount += 1;
        if (skill.status === 'LEARNING') current.learningCount += 1;
        if (skill.status === 'NOT_STARTED') current.notStartedCount += 1;
        skillMap.set(skill.id, current);
      });
    });

    return Array.from(skillMap.values())
      .map((row) => ({
        ...row,
        avgElo: Math.round(row.avgElo / Math.max(1, students.length)),
      }))
      .sort((left, right) => left.avgElo - right.avgElo);
  }, [students]);

  const heatmapStudents = useMemo(() => {
    const list = [...students];
    if (enableClustering) {
      return list.sort((left, right) => studentMetrics[right.id].weakSkills - studentMetrics[left.id].weakSkills);
    }
    return list;
  }, [students, enableClustering, studentMetrics]);

  const heatmapSkills = useMemo(() => {
    const list = [...masteryRows];
    if (enableClustering) {
      return list.sort((left, right) => left.avgElo - right.avgElo);
    }
    return list;
  }, [masteryRows, enableClustering]);

  const directoryStudents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = students.filter((student) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        student.name.toLowerCase().includes(normalizedQuery) ||
        student.email.toLowerCase().includes(normalizedQuery);
      const matchesStatus =
        statusFilter === 'all' || studentMetrics[student.id].status === statusFilter;

      return matchesQuery && matchesStatus;
    });

    return filtered.sort((left, right) => {
      if (sortKey === 'name') return left.name.localeCompare(right.name, 'vi');
      if (sortKey === 'weakSkills') {
        return studentMetrics[right.id].weakSkills - studentMetrics[left.id].weakSkills;
      }
      if (sortKey === 'completionRate') {
        return studentMetrics[right.id].completionRate - studentMetrics[left.id].completionRate;
      }
      return studentMetrics[right.id].avgElo - studentMetrics[left.id].avgElo;
    });
  }, [searchQuery, sortKey, statusFilter, studentMetrics, students]);

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? directoryStudents[0] ?? null;

  const selectedStudentNotes = selectedStudent
    ? notesByStudent[selectedStudent.id] ?? defaultNotesByStudent[selectedStudent.id] ?? []
    : [];

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    if (!selectedStudent) return { nodes: [], edges: [] };
    const nodes = selectedStudent.skills.map((skill) => ({
      id: skill.id,
      type: 'customNode',
      data: {
        id: skill.id,
        name: skill.name,
        elo: skill.elo,
        status: skill.status,
        decayRisk: skill.status === 'WEAK',
        onClick: () => {}
      },
      position: { x: 0, y: 0 },
    }));

    const edges = PREREQUISITE_EDGES.map((edge) => {
      const srcSkill = selectedStudent.skills.find((s) => s.id === edge.source);
      const isMastered = srcSkill?.status === 'MASTERED';
      const isCold = srcSkill?.status === 'NOT_STARTED';
      const color = isMastered ? '#58cc02' : '#b7b7b7';
      return {
        id: `e-${edge.source}-${edge.target}`,
        source: edge.source,
        target: edge.target,
        animated: !isMastered && !isCold,
        style: { stroke: color, strokeWidth: 2.5, strokeDasharray: isMastered ? undefined : '4' },
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 15, height: 15 },
      };
    });

    return getLayoutedElements(nodes, edges, 'TB');
  }, [selectedStudent]);

  const forgettingChartData = useMemo(() => {
    const points = [];
    for (let t = 0; t <= 15; t += 0.5) {
      points.push({
        t,
        curve: Math.round(100 * Math.exp(-0.1386 * t) * 10) / 10,
      });
    }
    return points;
  }, []);

  const selectedStudentDecayData = useMemo(() => {
    if (!selectedStudent) return [];
    return selectedStudent.skills
      .map((skill, index) => {
        if (skill.status === 'NOT_STARTED') return null;
        let daysPassed = 1;
        if (skill.status === 'MASTERED') {
          daysPassed = (index % 3) + 1;
        } else if (skill.status === 'LEARNING') {
          daysPassed = (index % 3) + 4;
        } else if (skill.status === 'WEAK') {
          daysPassed = (index % 3) + 8;
        }
        const retention = Math.round(100 * Math.exp(-0.1386 * daysPassed));
        return {
          t: daysPassed,
          retention,
          name: skill.name,
          status: skill.status,
        };
      })
      .filter(Boolean) as Array<{ t: number; retention: number; name: string; status: string }>;
  }, [selectedStudent]);

  const masteredScatter = useMemo(() => selectedStudentDecayData.filter((d) => d.retention >= 80), [selectedStudentDecayData]);
  const learningScatter = useMemo(() => selectedStudentDecayData.filter((d) => d.retention >= 50 && d.retention < 80), [selectedStudentDecayData]);
  const weakScatter = useMemo(() => selectedStudentDecayData.filter((d) => d.retention < 50), [selectedStudentDecayData]);

  const triggerNotification = (message: string) => {
    setNotification(message);
    window.setTimeout(() => setNotification(null), 3000);
  };

  const openStudentProfile = (studentId: string) => {
    setHoveredTooltip(null);
    setSelectedStudentId(studentId);
    setActiveSubview('directory');
    setStudentProfileSection('mastery-map');
  };

  const addMentorNote = () => {
    if (!selectedStudent || !draftNote.trim()) return;
    setNotesByStudent((current) => ({
      ...current,
      [selectedStudent.id]: [
        draftNote.trim(),
        ...(current[selectedStudent.id] ?? defaultNotesByStudent[selectedStudent.id] ?? []),
      ],
    }));
    setDraftNote('');
    triggerNotification(`Đã lưu ghi chú cho ${selectedStudent.name}`);
  };

  const removeMentorNote = (index: number) => {
    if (!selectedStudent) return;
    setNotesByStudent((current) => ({
      ...current,
      [selectedStudent.id]: (
        current[selectedStudent.id] ?? defaultNotesByStudent[selectedStudent.id] ?? []
      ).filter((_, noteIndex) => noteIndex !== index),
    }));
  };

  return (
    <div className="space-y-6 font-be-vietnam-pro">
      {notification ? (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl border border-gray-border/20 bg-on-background px-5 py-3 text-xs font-black text-white shadow-2xl"
        >
          <UserCheck className="h-4 w-4 text-primary-green" />
          <span>{notification}</span>
        </motion.div>
      ) : null}

      <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
        <SectionHeader
          eyebrow="Mentor command center"
          title="Thống Kê Lớp & Theo Dõi Học Viên"
          description="Chuyển giữa tổng quan lớp và danh sách học viên toàn màn hình để mentor ra quyết định nhanh hơn."
        />

        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { id: 'overview' as const, label: 'Tổng quan lớp' },
            { id: 'directory' as const, label: 'Danh sách học viên' },
          ].map((tab) => {
            const isActive = activeSubview === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubview(tab.id)}
                className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all ${
                  isActive
                    ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                    : 'border-gray-border bg-white text-stone-500'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeSubview === 'overview' ? (
        <>
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                icon: Users,
                label: 'Tổng HV',
                value: isLoadingStats ? '…' : displayTotalStudents,
                note: 'Học viên trong nhóm',
                classes: 'bg-primary-green/10 border-primary-green/20 text-primary-green-dark',
              },
              {
                icon: BarChart3,
                label: 'Elo TB Lớp',
                value: isLoadingStats ? '…' : displayClassAvgElo,
                note: 'Trung bình cộng',
                classes:
                  'bg-secondary-green/10 border-secondary-green/20 text-secondary-green-dark',
              },
              {
                icon: Target,
                label: 'Kỹ năng yếu',
                value: isLoadingStats ? '…' : displayWeakestSkillName,
                note: `Elo TB: ${isLoadingStats ? '…' : displayWeakestSkillAvg}`,
                classes: 'bg-error-red/10 border-error-red/20 text-error-red-dark',
              },
              {
                icon: Trophy,
                label: 'Hoàn thành',
                value: isLoadingStats ? '…' : `${displayCompletionRate}%`,
                note: 'Mastered trên toàn lớp',
                classes:
                  'bg-tertiary-yellow/15 border-tertiary-yellow/30 text-tertiary-yellow-dark',
              },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border-2 border-gray-border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.classes}`}
                  >
                    <card.icon className="h-4 w-4" />
                  </div>
                  <span className="font-mono text-[9px] font-black uppercase tracking-wider text-stone-500">
                    {card.label}
                  </span>
                </div>
                <p className="font-fraunces text-2xl font-black leading-tight text-on-background">
                  {card.value}
                </p>
                <p className="mt-1 text-[10px] font-bold text-stone-400">{card.note}</p>
                {card.label === 'Hoàn thành' ? (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                    <div className="h-full bg-tertiary-yellow" style={{ width: `${displayCompletionRate}%` }} />
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-3xl border-2 border-error-red/20 bg-red-50/50 p-5 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-error-red-dark">
                <AlertTriangle className="h-4 w-4 animate-pulse text-error-red-dark" />
                Cảnh Báo Đỏ Học Tập ({filteredAlertStudents.length})
              </h3>

              {/* Search Alert Students */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={alertSearchQuery}
                  onChange={(e) => {
                    setAlertSearchQuery(e.target.value);
                    setAlertPage(1);
                  }}
                  placeholder="Tìm học viên cảnh báo..."
                  className="w-full rounded-full border border-error-red/25 bg-white/80 py-1.5 pl-9 pr-4 text-[10px] font-semibold text-stone-700 focus:border-error-red focus:outline-none"
                />
              </div>
            </div>

            {paginatedAlertStudents.length > 0 ? (
              <div className="space-y-3">
                <div className="overflow-x-auto rounded-2xl border border-error-red/10 bg-white">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-error-red/10 bg-red-50/20 text-[9px] font-black uppercase tracking-wider text-error-red-dark opacity-85">
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedAlertStudents.length > 0 &&
                              paginatedAlertStudents.every((s) => selectedAlertStudents.includes(s.id))
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                const newSelection = [...selectedAlertStudents];
                                paginatedAlertStudents.forEach((s) => {
                                  if (!newSelection.includes(s.id)) newSelection.push(s.id);
                                });
                                setSelectedAlertStudents(newSelection);
                              } else {
                                const currentIds = paginatedAlertStudents.map((s) => s.id);
                                setSelectedAlertStudents(
                                  selectedAlertStudents.filter((id) => !currentIds.includes(id))
                                );
                              }
                            }}
                            className="rounded accent-red-600 cursor-pointer"
                          />
                        </th>
                        <th className="p-3">Học viên</th>
                        <th className="p-3">Email</th>
                        <th className="p-3 text-center">Lỗ hổng (Weak)</th>
                        <th className="p-3 text-center">Độ chính xác</th>
                        <th className="p-3 text-center">Chuỗi Streak</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAlertStudents.map((student) => {
                        const metrics = studentMetrics[student.id];
                        const isSelected = selectedAlertStudents.includes(student.id);
                        return (
                          <tr
                            key={student.id}
                            className={`border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors ${
                              isSelected ? 'bg-red-50/10' : ''
                            }`}
                          >
                            <td className="p-3 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAlertStudents([...selectedAlertStudents, student.id]);
                                  } else {
                                    setSelectedAlertStudents(
                                      selectedAlertStudents.filter((id) => id !== student.id)
                                    );
                                  }
                                }}
                                className="rounded accent-red-600 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 font-extrabold text-stone-800">
                              <div className="flex items-center gap-2">
                                <span className="text-base">{student.avatar}</span>
                                <span>{student.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-stone-500 font-mono text-[10px]">{student.email}</td>
                            <td className="p-3 text-center font-bold text-error-red-dark">
                              <span className="inline-flex items-center gap-1 rounded bg-error-red-light/20 px-2 py-0.5 text-[10px] uppercase font-black">
                                <TrendingDown className="h-3 w-3" />
                                {metrics.weakSkills} kỹ năng
                              </span>
                            </td>
                            <td className="p-3 text-center font-semibold text-stone-600">{student.accuracyRate}%</td>
                            <td className="p-3 text-center font-semibold">
                              <span className={student.streak === 0 ? 'text-stone-400' : 'text-orange-500'}>
                                🔥 {student.streak} ngày
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => openStudentProfile(student.id)}
                                className="rounded-lg border border-error-red/20 bg-white hover:bg-error-red-light/10 px-2.5 py-1 text-[10px] font-black uppercase text-error-red-dark transition-all"
                              >
                                Xem hồ sơ
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                {totalAlertPages > 1 && (
                  <div className="flex items-center justify-between text-[10px] font-bold text-stone-500 mt-2 px-1">
                    <span>
                      Trang {alertPage} / {totalAlertPages} ({filteredAlertStudents.length} học viên cảnh báo)
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={alertPage === 1}
                        onClick={() => setAlertPage((p) => Math.max(1, p - 1))}
                        className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1 disabled:opacity-50 transition-all"
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        disabled={alertPage === totalAlertPages}
                        onClick={() => setAlertPage((p) => Math.min(totalAlertPages, p + 1))}
                        className="rounded-lg border border-stone-200 bg-white hover:bg-stone-50 px-2.5 py-1 disabled:opacity-50 transition-all"
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-dashed border-primary-green/20 bg-white p-6 text-center text-xs font-bold text-primary-green-dark justify-center">
                <CheckCircle2 className="h-4 w-4 text-primary-green" />
                <span>Tuyệt vời! Không có học viên nào bị cảnh báo học tập phù hợp.</span>
              </div>
            )}

            {/* Floating Batch Action Bar */}
            {selectedAlertStudents.length > 0 && (
              <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full border border-error-red/30 bg-stone-900 px-6 py-3.5 shadow-2xl text-white">
                <span className="text-xs font-extrabold">
                  Đã chọn <span className="text-error-red font-black text-sm">{selectedAlertStudents.length}</span> học viên cảnh báo
                </span>
                <div className="h-4 w-px bg-stone-700"></div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification(`Đã gửi email nhắc nhở động tới ${selectedAlertStudents.length} học viên`);
                      setSelectedAlertStudents([]);
                    }}
                    className="rounded-full bg-error-red hover:bg-error-red-dark px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition-all shadow-md"
                  >
                    Nhắc nhở hàng loạt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      triggerNotification(`Đã giao thêm bài tập phụ đạo cho ${selectedAlertStudents.length} học viên`);
                      setSelectedAlertStudents([]);
                    }}
                    className="rounded-full bg-stone-800 hover:bg-stone-700 border border-stone-700 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider text-white transition-all"
                  >
                    Giao bài tập nhóm
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedAlertStudents([])}
                    className="text-[10px] font-black uppercase tracking-wider text-stone-400 hover:text-white px-2 py-1.5 transition-all"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
            <SectionHeader
              eyebrow="Concept mastery heatmap"
              title="Bảng Thống Kê Mức Độ Thành Thạo"
              description="Tổng hợp ELO và trạng thái mastery theo từng concept để mentor nhìn ra điểm nghẽn của cả lớp."
            />

            {/* Header controls for Heatmap */}
            <div className="mt-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-stone-400 font-mono">Bảng mật độ:</span>
                  <button
                    type="button"
                    onClick={() => setEnableClustering((prev) => !prev)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all ${
                      enableClustering
                        ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                        : 'border-gray-border bg-white text-stone-500'
                    }`}
                  >
                    ⚡ Gom cụm (Yếu lên đầu)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompactMode((prev) => !prev)}
                    className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-wide transition-all ${
                      isCompactMode
                        ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                        : 'border-gray-border bg-white text-stone-500'
                    }`}
                  >
                    {isCompactMode ? '🔎 Xem đầy đủ' : '📱 Xem thu gọn'}
                  </button>
                </div>

                <div className="flex rounded-xl border border-gray-border bg-stone-200/60 p-0.5 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setHeatmapViewMode('matrix')}
                    className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wide transition-all ${
                      heatmapViewMode === 'matrix'
                        ? 'bg-white border border-stone-200 text-stone-700 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Bản Ma Trận
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeatmapViewMode('cards')}
                    className={`rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wide transition-all ${
                      heatmapViewMode === 'cards'
                        ? 'bg-white border border-stone-200 text-stone-700 shadow-sm'
                        : 'text-stone-500 hover:text-stone-700'
                    }`}
                  >
                    Thẻ Concept
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-stone-400">
                  <span className="h-2 w-2 rounded-full bg-primary-green"></span> Thành thạo
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-stone-400">
                  <span className="h-2 w-2 rounded-full bg-tertiary-yellow"></span> Đang học
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-stone-400">
                  <span className="h-2 w-2 rounded-full bg-error-red"></span> Cần ôn tập
                </span>
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-stone-400">
                  <span className="h-2 w-2 rounded-full bg-stone-200"></span> Chưa học
                </span>
              </div>
            </div>

            {heatmapViewMode === 'matrix' ? (
              <div className="mt-4 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className={`min-w-full border-collapse ${isCompactMode ? 'table-fixed' : ''}`}>
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50">
                      <th className={`sticky left-0 z-10 bg-stone-50 text-left text-xs font-black uppercase tracking-wider text-stone-500 border-r border-stone-200 transition-colors duration-150 ${
                        isCompactMode ? 'min-w-[75px] max-w-[75px] p-1.5 text-[9px]' : 'min-w-[180px] p-4'
                      }`}>
                        Học viên
                      </th>
                      {heatmapSkills.map((skill) => (
                        <th
                          key={skill.id}
                          className={`p-3 text-center text-[10px] font-black uppercase tracking-wider text-stone-500 border-r border-stone-200 last:border-r-0 transition-colors duration-150 ${
                            isCompactMode ? 'w-[62px] min-w-[62px] max-w-[62px] p-1 text-[9px]' : 'w-[130px] min-w-[130px] max-w-[130px]'
                          }`}
                          onMouseEnter={(e) => handleMouseEnter(e, `skill-${skill.id}`, (
                            <div className="normal-case">
                              <p className="font-extrabold border-b border-stone-700 pb-1 mb-1 text-emerald-400">
                                {skill.name}
                              </p>
                              <p className="mt-1 text-stone-300">Avg Elo lớp: <span className="font-extrabold text-white">{skill.avgElo}</span></p>
                              <p className="text-stone-300">Thành thạo: <span className="font-extrabold text-primary-green">{skill.masteredCount} hs</span></p>
                              <p className="text-stone-300">Đang học: <span className="font-extrabold text-tertiary-yellow-dark">{skill.learningCount} hs</span></p>
                              <p className="text-stone-300">Yếu: <span className="font-extrabold text-error-red-dark">{skill.weakCount} hs</span></p>
                            </div>
                          ))}
                          onMouseLeave={handleMouseLeave}
                        >
                          <div
                            className="mx-auto text-center font-bold text-[10px] select-none truncate cursor-help"
                            style={{ maxWidth: isCompactMode ? '58px' : '125px' }}
                          >
                            {isCompactMode ? getShortConceptName(skill.name) : skill.name}
                          </div>
                          <div className="mt-0.5 font-mono text-[9px] text-stone-400 font-normal">
                            {isCompactMode ? skill.avgElo : `Avg Elo: ${skill.avgElo}`}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {heatmapStudents.map((student) => {
                      const metrics = studentMetrics[student.id];
                      return (
                        <tr key={student.id} className="border-b border-stone-100 hover:bg-stone-50/50 last:border-b-0">
                          {/* Student Name */}
                          <td
                            className={`sticky left-0 z-10 bg-white hover:bg-stone-50 font-extrabold text-stone-800 border-r border-stone-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors duration-150 ${
                              isCompactMode ? 'min-w-[75px] max-w-[75px] p-1' : 'min-w-[180px] p-4'
                            }`}
                            onMouseEnter={(e) => {
                              handleMouseEnter(e, `student-${student.id}`, (
                                <div className="normal-case">
                                  <p className="font-extrabold border-b border-stone-700 pb-1 mb-1 text-emerald-400 flex items-center gap-1.5">
                                    <span>{student.avatar}</span>
                                    <span>{student.name}</span>
                                  </p>
                                  <p className="text-stone-300 font-mono text-[9px]">{student.email}</p>
                                  <p className="mt-1 text-stone-300">Elo trung bình: <span className="font-extrabold text-white">{metrics.avgElo}</span></p>
                                  <p className="text-stone-300">XP tích lũy: <span className="font-extrabold text-white">{student.xp}</span></p>
                                  <p className="text-stone-300 font-mono text-[9px]">Streak: 🔥 {student.streak} ngày</p>
                                </div>
                              ));
                            }}
                            onMouseLeave={handleMouseLeave}
                          >
                            <div className="flex items-center gap-1 w-full overflow-hidden">
                              <span className={`${isCompactMode ? 'text-xs' : 'text-sm'} select-none shrink-0`}>
                                {student.avatar}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-extrabold truncate leading-tight">
                                  {isCompactMode ? getShortName(student.name) : student.name}
                                </p>
                                {!isCompactMode && (
                                  <p className="font-mono text-[9px] text-stone-400 font-normal mt-0.5">
                                    Elo TB: {metrics.avgElo}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* Concept Cells */}
                          {heatmapSkills.map((skillRow) => {
                            const studentSkill = student.skills.find((s) => s.id === skillRow.id);
                            const status = studentSkill?.status ?? 'NOT_STARTED';
                            const score = studentSkill?.masteryScore ?? 0;
                            const elo = studentSkill?.elo ?? 0;

                            let cellBgClass = 'bg-stone-50 border-stone-200 text-stone-400 hover:bg-stone-100/80';
                            if (status === 'MASTERED') {
                              cellBgClass = 'bg-primary-green-light/20 text-primary-green-dark border-primary-green/30 hover:bg-primary-green/30';
                            } else if (status === 'LEARNING') {
                              cellBgClass = 'bg-tertiary-yellow/20 text-tertiary-yellow-dark border-tertiary-yellow/30 hover:bg-tertiary-yellow/35';
                            } else if (status === 'WEAK') {
                              cellBgClass = 'bg-error-red-light/20 text-error-red-dark border-error-red/30 hover:bg-error-red/35';
                            }

                            return (
                              <td
                                key={`${student.id}-${skillRow.id}`}
                                className={`text-center border-r border-stone-150 last:border-r-0 transition-colors duration-150 ${
                                  isCompactMode ? 'min-w-[62px] max-w-[62px] p-1' : 'p-3'
                                } ${cellBgClass}`}
                                onMouseEnter={(e) => handleMouseEnter(e, `cell-${student.id}-${skillRow.id}`, (
                                  <div>
                                    <p className="font-extrabold border-b border-stone-700 pb-1 mb-1 text-emerald-400">
                                      {student.name}
                                    </p>
                                    <p className="font-bold text-white">{skillRow.name}</p>
                                    <p className="mt-1 text-stone-300">Trạng thái: <span className="font-extrabold text-white">{getStatusLabel(status)}</span></p>
                                    <p className="text-stone-300">BKT Mastery: <span className="font-extrabold text-white">{score}%</span></p>
                                    <p className="text-stone-300">Elo kỹ năng: <span className="font-extrabold text-white">{elo}</span></p>
                                  </div>
                                ))}
                                onMouseLeave={handleMouseLeave}
                              >
                                <span className="font-mono text-[10px] font-black block">
                                  {status === 'NOT_STARTED' ? '—' : `${score}%`}
                                </span>
                                {status !== 'NOT_STARTED' && !isCompactMode && (
                                  <span className="block text-[8px] opacity-75 font-medium">
                                    {elo}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heatmapSkills.map((skill) => {
                  const masteredStudents = heatmapStudents.filter((s) => {
                    const ss = s.skills.find((sk) => sk.id === skill.id);
                    return ss?.status === 'MASTERED';
                  });
                  const learningStudents = heatmapStudents.filter((s) => {
                    const ss = s.skills.find((sk) => sk.id === skill.id);
                    return ss?.status === 'LEARNING';
                  });
                  const weakStudents = heatmapStudents.filter((s) => {
                    const ss = s.skills.find((sk) => sk.id === skill.id);
                    return ss?.status === 'WEAK';
                  });

                  return (
                    <div key={skill.id} className="rounded-3xl border-2 border-stone-200 bg-white p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        {/* Card Header */}
                        <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                          <div>
                            <h4 className="text-xs font-black uppercase text-stone-400 tracking-wider font-mono">
                              Avg Elo: {skill.avgElo}
                            </h4>
                            <h3 className="text-sm font-extrabold text-stone-800 mt-0.5 line-clamp-1">
                              {skill.name}
                            </h3>
                          </div>
                          <span className="rounded-full bg-stone-100 border border-stone-200 px-2 py-0.5 text-[9px] font-bold text-stone-600 font-mono">
                            {skill.id.replace('day-', 'D')}
                          </span>
                        </div>

                        {/* Status Columns */}
                        <div className="mt-3 space-y-3 text-[11px]">
                          {/* Mastered */}
                          <div>
                            <p className="font-bold text-primary-green-dark flex items-center gap-1">
                              <span>Thành thạo</span>
                              <span className="rounded-full bg-primary-green/10 text-primary-green-dark px-1.5 py-0.2 font-mono text-[9px]">
                                {masteredStudents.length}
                              </span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {masteredStudents.length > 0 ? (
                                masteredStudents.map((s) => {
                                  const ss = s.skills.find((sk) => sk.id === skill.id);
                                  return (
                                    <span
                                      key={s.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-primary-green/20 bg-primary-green-light/20 px-2 py-0.5 text-[10px] font-semibold text-primary-green-dark"
                                    >
                                      <span>{s.avatar}</span>
                                      <span>{s.name.split(' ').slice(-2).join(' ')}</span>
                                      <span className="opacity-60">({ss?.masteryScore}%)</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-stone-400 italic text-[10px]">Trống</span>
                              )}
                            </div>
                          </div>

                          {/* Learning */}
                          <div>
                            <p className="font-bold text-tertiary-yellow-dark flex items-center gap-1">
                              <span>Đang học</span>
                              <span className="rounded-full bg-tertiary-yellow/15 text-tertiary-yellow-dark px-1.5 py-0.2 font-mono text-[9px]">
                                {learningStudents.length}
                              </span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {learningStudents.length > 0 ? (
                                learningStudents.map((s) => {
                                  const ss = s.skills.find((sk) => sk.id === skill.id);
                                  return (
                                    <span
                                      key={s.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-tertiary-yellow/30 bg-tertiary-yellow/10 px-2 py-0.5 text-[10px] font-semibold text-tertiary-yellow-dark"
                                    >
                                      <span>{s.avatar}</span>
                                      <span>{s.name.split(' ').slice(-2).join(' ')}</span>
                                      <span className="opacity-60">({ss?.masteryScore}%)</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-stone-400 italic text-[10px]">Trống</span>
                              )}
                            </div>
                          </div>

                          {/* Weak */}
                          <div>
                            <p className="font-bold text-error-red-dark flex items-center gap-1">
                              <span>Cần củng cố</span>
                              <span className="rounded-full bg-error-red-light/20 text-error-red-dark px-1.5 py-0.2 font-mono text-[9px]">
                                {weakStudents.length}
                              </span>
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-1.5">
                              {weakStudents.length > 0 ? (
                                weakStudents.map((s) => {
                                  const ss = s.skills.find((sk) => sk.id === skill.id);
                                  return (
                                    <span
                                      key={s.id}
                                      className="inline-flex items-center gap-1 rounded-full border border-error-red/20 bg-error-red-light/20 px-2 py-0.5 text-[10px] font-semibold text-error-red-dark"
                                    >
                                      <span>{s.avatar}</span>
                                      <span>{s.name.split(' ').slice(-2).join(' ')}</span>
                                      <span className="opacity-60">({ss?.masteryScore}%)</span>
                                    </span>
                                  );
                                })
                              ) : (
                                <span className="text-stone-400 italic text-[10px]">Trống</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Intervention action button */}
                      {weakStudents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => triggerNotification(`Đã gửi tài liệu củng cố concept "${skill.name}" tới ${weakStudents.length} học viên yếu`)}
                          className="mt-4 w-full rounded-2xl border-2 border-error-red/20 bg-error-red-light/10 text-error-red-dark hover:bg-error-red-light/20 font-black uppercase text-[9px] py-2 text-center transition-all"
                        >
                          📢 Hỗ trợ nhóm {weakStudents.length} học viên yếu
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm md:p-6">
          {!selectedStudentId || !selectedStudent ? (
            <>
              <SectionHeader
                eyebrow="Student directory"
                title="Danh Sách Học Viên Toàn Màn Hình"
                description="Tìm kiếm, lọc trạng thái và sắp xếp để chọn đúng học viên cần can thiệp."
                action={
                  <div className="rounded-2xl border border-primary-blue-border bg-primary-blue-light px-3 py-2 text-[10px] font-black uppercase tracking-wide text-primary-blue-dark">
                    {directoryStudents.length} học viên hiển thị
                  </div>
                }
              />

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Tìm theo tên hoặc email..."
                    className="w-full rounded-2xl border-2 border-gray-border bg-white py-3 pl-10 pr-4 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  />
                </div>

                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | StudentStatus)}
                    className="w-full appearance-none rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  >
                    {DIRECTORY_STATUS_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>

                <div className="relative">
                  <select
                    value={sortKey}
                    onChange={(event) => setSortKey(event.target.value as StudentSortKey)}
                    className="w-full appearance-none rounded-2xl border-2 border-gray-border bg-white px-4 py-3 text-xs font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        Sắp xếp: {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                </div>
              </div>

              <div className="mt-5">
                {isLoadingStudents ? (
                  <div className="flex flex-col items-center justify-center p-12 gap-3 border border-stone-200 border-dashed rounded-2xl bg-stone-50/50">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-primary-green" />
                    <span className="text-xs font-semibold text-stone-400 font-mono">Đang tải danh sách học viên...</span>
                  </div>
                ) : directoryStudents.length === 0 ? (
                  <div className="text-center p-12 border border-stone-200 border-dashed rounded-2xl bg-stone-50/50 text-stone-400 font-bold text-xs">
                    Không tìm thấy học viên nào phù hợp bộ lọc.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-border text-[10px] font-black uppercase tracking-widest text-stone-400">
                          <th className="pb-3 pr-4">Học viên</th>
                          <th className="pb-3 pr-4">Email</th>
                          <th className="pb-3 pr-4">Elo TB</th>
                          <th className="pb-3 pr-4">Kỹ năng yếu</th>
                          <th className="pb-3 pr-4">Hoàn thành</th>
                          <th className="pb-3 pr-4">Trạng thái</th>
                          <th className="pb-3">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directoryStudents.map((student) => {
                          const metrics = studentMetrics[student.id];
                          return (
                            <tr key={student.id} className="border-b border-stone-100 last:border-b-0">
                              <td className="py-4 pr-4">
                                <button
                                  type="button"
                                  onClick={() => openStudentProfile(student.id)}
                                  className="flex items-center gap-3 text-left"
                                >
                                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-200 bg-surface-container text-lg shadow-sm">
                                    {student.avatar}
                                  </span>
                                  <div>
                                    <p className="text-sm font-black text-on-background hover:text-primary-green-dark">
                                      {student.name}
                                    </p>
                                    <p className="font-mono text-[10px] uppercase tracking-wide text-stone-400">
                                      XP {student.xp}
                                    </p>
                                  </div>
                                </button>
                              </td>
                              <td className="py-4 pr-4 text-sm font-semibold text-stone-600">{student.email}</td>
                              <td className="py-4 pr-4 text-sm font-bold text-on-background">{metrics.avgElo}</td>
                              <td className="py-4 pr-4 text-sm font-semibold text-stone-600">{metrics.weakSkills}</td>
                              <td className="py-4 pr-4">
                                <div className="min-w-28">
                                  <div className="mb-1 flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-stone-400">
                                    <span>{metrics.completionRate}%</span>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-stone-100">
                                    <div
                                      className="h-full bg-tertiary-yellow transition-all"
                                      style={{ width: `${metrics.completionRate}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 pr-4">
                                <span
                                  className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${
                                    metrics.status === 'needs-support'
                                      ? 'border-error-red/20 bg-error-red-light/30 text-error-red-dark'
                                      : 'border-primary-green/20 bg-primary-green-light/30 text-primary-green-dark'
                                  }`}
                                >
                                  {metrics.status === 'needs-support' ? 'Cần hỗ trợ' : 'Ổn định'}
                                </span>
                              </td>
                              <td className="py-4">
                                <button
                                  type="button"
                                  onClick={() => openStudentProfile(student.id)}
                                  className="btn-3d btn-white text-[11px]"
                                >
                                  Xem hồ sơ
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedStudentId(null)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-border bg-white px-4 py-2 text-[11px] font-black uppercase tracking-wide text-stone-600 transition-all hover:bg-stone-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách
                </button>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => triggerNotification(`Đã gửi mail nhắc nhở tự ôn tập tới ${selectedStudent.name}`)}
                    className="btn-3d btn-white text-[11px]"
                  >
                    <Mail className="mr-1 h-4 w-4" />
                    Nhắc qua mail
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      triggerNotification(`Đã giao thêm 3 bài tập bổ trợ đặc thù cho ${selectedStudent.name}`)
                    }
                    className="btn-3d btn-green text-[11px]"
                  >
                    <PlusCircle className="mr-1 h-4 w-4" />
                    Giao bài riêng
                  </button>
                </div>
              </div>

              <section className="rounded-3xl border-2 border-gray-border bg-surface-container-low p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="rounded-3xl border border-stone-200 bg-white p-3 text-4xl shadow-sm">
                      {selectedStudent.avatar}
                    </span>
                    <div>
                      <h3 className="font-fraunces text-2xl font-black text-on-background">
                        {selectedStudent.name}
                      </h3>
                      <p className="mt-1 text-xs font-mono text-stone-400">{selectedStudent.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                    {[
                      { label: 'Elo TB', value: studentMetrics[selectedStudent.id].avgElo },
                      { label: 'XP', value: selectedStudent.xp },
                      { label: 'Streak', value: `${selectedStudent.streak} ngày` },
                      { label: 'Accuracy', value: `${selectedStudent.accuracyRate}%` },
                      { label: 'Ngày hoạt động', value: selectedStudent.activeDaysCount },
                      { label: 'Lượt chat AI', value: selectedStudent.aiChatCount },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-gray-border bg-white p-3 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-wide text-stone-400">
                          {item.label}
                        </p>
                        <p className="mt-1 font-fraunces text-xl font-black text-on-background">
                          {item.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <div className="flex flex-wrap gap-2">
                {PROFILE_SECTION_OPTIONS.map((option) => {
                  const isActive = studentProfileSection === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setStudentProfileSection(option.id)}
                      className={`rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide transition-all ${
                        isActive
                          ? 'border-primary-green bg-primary-green/10 text-primary-green-dark'
                          : 'border-gray-border bg-white text-stone-500'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {studentProfileSection === 'mastery-map' ? (
                <section className="bg-white border-2 border-gray-border rounded-3xl p-5 shadow-sm space-y-4">
                  <SectionHeader
                    eyebrow="Bayesian Knowledge Tracing & Elo Ranges"
                    title="Bản Đồ Năng Lực Chi Tiết (BKT & Elo)"
                    description="Theo dõi phân phối Elo ước lượng và xác suất làm chủ (BKT Mastery) kèm các mốc phát triển ZPD."
                  />
                  <div className="space-y-4.5 pt-1">
                    {selectedStudent.skills.map((skill) => {
                      const minScale = 600;
                      const range = 1000;

                      const eloMin = skill.elo - 60;
                      const eloMax = skill.elo + 60;

                      const eloFillWidth = Math.max(0, Math.min(100, ((skill.elo - minScale) / range) * 100));
                      const eloMinPos = Math.max(0, Math.min(100, ((eloMin - minScale) / range) * 100));
                      const eloMaxPos = Math.max(0, Math.min(100, ((eloMax - minScale) / range) * 100));
                      const uncertaintyWidth = eloMaxPos - eloMinPos;

                      // Display ZPD threshold: let's fetch ZPD or calculate it
                      const zpdThreshold = skill.status === 'MASTERED' ? 1150 : 1000;
                      const zpdPos = Math.max(0, Math.min(100, ((zpdThreshold - minScale) / range) * 100));

                      const statusLower = skill.status === 'NOT_STARTED' ? 'cold_start' : skill.status.toLowerCase();

                      // Status styles matching student profile MasteryMap
                      const getStatusColorClass = (status: string) => {
                        switch (status) {
                          case 'mastered': return 'bg-primary-green';
                          case 'zpd':
                          case 'learning': return 'bg-tertiary-yellow';
                          case 'weak': return 'bg-error-red';
                          default: return 'bg-stone-300';
                        }
                      };

                      const getUncertaintyColorClass = (status: string) => {
                        switch (status) {
                          case 'mastered': return 'bg-primary-green-light';
                          case 'zpd':
                          case 'learning': return 'bg-tertiary-yellow/50';
                          case 'weak': return 'bg-error-red-light';
                          default: return 'bg-stone-200';
                        }
                      };

                      const getStatusBadgeStyle = (status: string) => {
                        switch (status) {
                          case 'mastered': return 'bg-primary-green-light/20 text-primary-green-dark border-primary-green/20';
                          case 'zpd':
                          case 'learning': return 'bg-warm-cream text-tertiary-yellow-dark border-tertiary-yellow/30';
                          case 'weak': return 'bg-error-red-light/20 text-error-red-dark border-error-red/20';
                          default: return 'bg-stone-100 text-stone-500 border-stone-200';
                        }
                      };

                      return (
                        <div key={skill.id} className="flex flex-col sm:flex-row sm:items-center gap-3 py-1.5">
                          {/* Concept Name */}
                          <div className="w-full sm:w-44 text-xs font-bold text-stone-850 truncate text-left" title={skill.name}>
                            <span className="font-mono text-[9px] font-black uppercase text-stone-400 mr-1.5">{skill.dayId}</span>
                            {skill.name}
                          </div>

                          {/* Horizontal Bar Chart Container */}
                          <div className="flex-1 relative h-3 bg-stone-100 rounded-full overflow-visible border border-stone-200/20">
                            {/* Elo Estimate Fill */}
                            <div
                              className={`absolute top-0 bottom-0 left-0 rounded-full transition-all duration-500 ${getStatusColorClass(statusLower)}`}
                              style={{ width: `${eloFillWidth}%` }}
                            />

                            {/* BKT Uncertainty Overlay */}
                            {uncertaintyWidth > 0 && statusLower !== 'cold_start' && (
                              <div
                                className="absolute top-0 bottom-0 opacity-30 rounded"
                                style={{
                                  left: `${eloMinPos}%`,
                                  width: `${uncertaintyWidth}%`,
                                  backgroundImage: 'repeating-linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0px, rgba(255, 255, 255, 0.2) 2px, transparent 2px, transparent 8px)',
                                  backgroundColor: getUncertaintyColorClass(statusLower).includes('/') ? undefined : getUncertaintyColorClass(statusLower),
                                }}
                              />
                            )}

                            {/* ZPD Target Marker */}
                            <div
                              className="absolute w-0.5 h-5 -top-1 bg-violet-500 rounded-sm shadow-sm z-10"
                              style={{ left: `${zpdPos}%` }}
                              title={`Ngưỡng ZPD: ${zpdThreshold}`}
                            />
                          </div>

                          {/* Right Side Info */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            {/* Elo Value */}
                            <span className="text-xs font-mono font-bold text-stone-700 w-10 text-right">
                              {Math.round(skill.elo)}
                            </span>

                            {/* Status Badge */}
                            <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-bold shrink-0 uppercase tracking-wider ${getStatusBadgeStyle(statusLower)}`}>
                              {getStatusLabel(skill.status)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2.5 pt-3 border-t border-stone-150 text-[10px] text-stone-505 font-medium text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-2.5 bg-tertiary-yellow rounded-sm inline-block"></span>
                      <span>Elo ước lượng</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-2.5 bg-tertiary-yellow/20 border border-dashed border-tertiary-yellow/40 rounded-sm inline-block"></span>
                      <span>Khoảng bất định BKT (Uncertainty)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-0.5 h-3.5 bg-violet-500 rounded-sm inline-block"></span>
                      <span>Ngưỡng ZPD (70–75% thành công)</span>
                    </div>
                    <div className="font-mono text-stone-400 ml-auto">* Thang Elo từ 600 (Khởi điểm) đến 1600 (Max)</div>
                  </div>
                </section>
              ) : null}

              {studentProfileSection === 'dag-graph' && selectedStudent ? (
                <section className="bg-white border-2 border-gray-border rounded-3xl p-5 shadow-sm">
                  <MentorSkillTreeGraph
                    layoutedNodes={layoutedNodes}
                    layoutedEdges={layoutedEdges}
                  />

                  {/* Small instructions card */}
                  <div className="mt-4 rounded-2xl border border-stone-250 bg-stone-50 p-4 text-[11px] font-semibold text-stone-500 text-left">
                    💡 <span className="font-extrabold text-stone-700">Hướng dẫn đọc đồ thị:</span> Đường mũi tên thể hiện liên kết điều kiện tiên quyết (Prerequisite). Viền ngoài vòng tròn thể hiện phần trăm làm chủ ($P(L)$ BKT). Bạn có thể bấm vào các nút hình tròn để kéo thả và quan sát rõ hơn.
                  </div>
                </section>
              ) : null}

              {studentProfileSection === 'progress-visuals' ? (
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {/* Elo progress chart */}
                  <div className="rounded-3xl border border-tertiary-yellow/30 bg-warm-cream p-5 shadow-sm">
                    <SectionHeader
                      eyebrow="Elo progress chart"
                      title="Biểu Đồ Tăng Trưởng Elo (30 ngày)"
                      description="Biểu diễn quá trình tích lũy năng lực số thông qua các lượt trả lời câu hỏi và kiểm tra."
                    />
                    <div className="mt-5 w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={selectedStudent.eloHistory}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#58cc02" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#58cc02" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <RechartsXAxis dataKey="day" tick={{ fontSize: 9 }} stroke="#a8a29e" />
                          <RechartsYAxis
                            domain={['dataMin - 50', 'dataMax + 50']}
                            tick={{ fontSize: 9 }}
                            stroke="#a8a29e"
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#ffffff',
                              borderRadius: '12px',
                              border: '1px solid #fef3c7',
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                              fontSize: '11px',
                              color: '#1c1917',
                            }}
                            labelStyle={{ fontWeight: 'bold', color: '#1c1917', marginBottom: '4px' }}
                          />
                          <ReferenceLine
                            y={1200}
                            stroke="#3b82f6"
                            strokeDasharray="3 3"
                            label={{
                              value: 'Mục tiêu Elo lớp',
                              fill: '#3b82f6',
                              fontSize: 9,
                              position: 'insideBottomRight',
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="elo"
                            stroke="#58cc02"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorElo)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Calendar activity heatmap */}
                  <div className="bg-white border border-tertiary-yellow/30 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <SectionHeader
                        eyebrow="Activity Consistency"
                        title="Tần Suất Học Tập & Chuyên Cần"
                        description="Nhật ký biến động Elo trong 30 ngày qua (Thiết kế đồng bộ theo chỉ số Elo học tập)."
                      />
                      {/* Grid Heatmap */}
                      <div className="mt-5 flex flex-wrap gap-1.5 p-3 rounded-2xl bg-stone-50/50 border border-stone-200/50 justify-center max-w-[420px] mx-auto">
                        {selectedStudent.activityHistory.map((day, idx) => {
                          let colorClass = 'bg-stone-200'; // Default inactive (0 change)
                          const eloChange = day.eloChange || 0;
                          const isMastered = !!day.masteredConcept;

                          if (eloChange > 0) {
                            if (eloChange < 15) {
                              colorClass = 'bg-primary-green-light hover:bg-primary-green-light/80';
                            } else if (eloChange < 40) {
                              colorClass = 'bg-primary-green hover:bg-primary-green/80';
                            } else {
                              colorClass = 'bg-primary-green-dark hover:bg-primary-green-dark/85';
                            }
                          } else if (eloChange < 0) {
                            // Red / Orange shades for Elo loss
                            if (eloChange > -15) {
                              colorClass = 'bg-accent-orange/40 text-accent-orange-dark hover:bg-accent-orange/50';
                            } else {
                              colorClass = 'bg-error-red/40 text-error-red-dark hover:bg-error-red/50';
                            }
                          }

                          const eloLabel = eloChange > 0 ? `+${eloChange} Elo` : eloChange < 0 ? `${eloChange} Elo` : '0 Elo';

                          return (
                            <div key={day.date} className="relative group/day">
                              <div
                                className={`h-6 w-6 rounded-md border border-stone-200/25 transition-all flex items-center justify-center shrink-0 cursor-pointer hover:scale-110 shadow-sm relative ${colorClass} ${
                                  isMastered ? 'ring-2 ring-yellow-400 ring-offset-1' : ''
                                }`}
                              >
                                {eloChange > 0 && !isMastered && (
                                  <span className="text-[8px] font-mono font-bold text-primary-green-dark opacity-60">
                                    +{eloChange}
                                  </span>
                                )}
                                {eloChange < 0 && (
                                  <span className="text-[8px] font-mono font-bold text-error-red-dark opacity-80">
                                    {eloChange}
                                  </span>
                                )}
                                {isMastered && (
                                  <span className="text-[9px]">
                                    🌟
                                  </span>
                                )}
                              </div>
                              {/* Tooltip */}
                              <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-36 -translate-x-1/2 scale-0 rounded-xl border border-stone-200 bg-stone-900 p-2 text-center text-[9px] font-semibold text-white shadow-xl transition-all group-hover/day:scale-100">
                                <p className="font-extrabold">{dayjs(day.date).format('DD/MM/YYYY')}</p>
                                <p className={`mt-1 font-mono font-black ${eloChange > 0 ? 'text-emerald-400' : eloChange < 0 ? 'text-rose-400' : 'text-stone-400'}`}>
                                  {eloLabel}
                                </p>
                                {day.masteredConcept && (
                                  <p className="text-[8px] text-yellow-400 mt-0.5">🌟 {day.masteredConcept}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Heatmap Legend */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[9px] text-stone-500 font-medium justify-center pt-3 mt-4 border-t border-stone-250/30">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-stone-200 rounded border border-stone-200/40 inline-block"></span>
                        <span>0 Elo (Không học)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-primary-green-light rounded inline-block"></span>
                        <span>Tăng ít (1-14)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-primary-green rounded inline-block"></span>
                        <span>Tăng vừa (15-39)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-primary-green-dark rounded inline-block"></span>
                        <span>Tăng nhiều (40+)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-accent-orange/40 rounded inline-block"></span>
                        <span>Giảm ít (1-14)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-error-red/40 rounded inline-block"></span>
                        <span>Giảm nhiều (15+)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded border border-yellow-400 ring-1 ring-yellow-400 bg-emerald-600 flex items-center justify-center text-[7px] font-bold">
                          🌟
                        </span>
                        <span>Mastered</span>
                      </div>
                    </div>

                    {/* Stats overview footer */}
                    <div className="mt-5 border-t border-stone-250/30 pt-4 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[9px] font-black uppercase text-stone-400">Tỷ lệ tích cực</p>
                        <p className="font-fraunces text-base font-black text-stone-700 mt-0.5">
                          {Math.round(
                            (selectedStudent.activityHistory.filter((h) => h.eloChange !== 0).length / 30) * 100
                          )}
                          %
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-stone-400">Tổng biến động Elo</p>
                        <p className="font-fraunces text-base font-black text-stone-700 mt-0.5">
                          {selectedStudent.activityHistory.reduce((sum, h) => sum + (h.eloChange || 0), 0) >= 0 ? '+' : ''}
                          {selectedStudent.activityHistory.reduce((sum, h) => sum + (h.eloChange || 0), 0)} Elo
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-stone-400">Độ đều đặn</p>
                        <p className="font-fraunces text-base font-black mt-0.5 text-primary-green-dark">
                          {selectedStudent.streak >= 8
                            ? 'Rất cao 🔥'
                            : selectedStudent.streak >= 4
                            ? 'Khá ⚡'
                            : 'Cần đẩy mạnh ⏳'}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              ) : null}

              {studentProfileSection === 'memory-decay' ? (
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {/* Forgetting Curve Chart */}
                  <div className="rounded-3xl border border-tertiary-yellow/30 bg-warm-cream p-5 shadow-sm">
                    <SectionHeader
                      eyebrow="Forgetting Curve"
                      title="Đồ thị lãng quên"
                      description="Biểu diễn mô hình suy giảm trí nhớ thực tế. Hãy ôn tập kịp thời trước khi độ bền giảm mạnh!"
                    />
                    <div className="mt-5 w-full h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                          <RechartsXAxis
                            type="number"
                            dataKey="t"
                            domain={[0, 15]}
                            tickLine={false}
                            axisLine={{ stroke: '#f5f5f4' }}
                            tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold' }}
                          />
                          <RechartsYAxis
                            type="number"
                            dataKey="retention"
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={{ stroke: '#f5f5f4' }}
                            tick={{ fill: '#78716c', fontSize: 10, fontWeight: 'bold' }}
                          />
                          <RechartsTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                if (data.name) {
                                  return (
                                    <div className="bg-white p-2 border border-tertiary-yellow/30 rounded-xl shadow-sm text-[10px]">
                                      <p className="font-bold text-stone-900 text-left">{data.name}</p>
                                      <p className="text-stone-500 text-left">
                                        Đo độ bền:{' '}
                                        <span className="font-bold text-primary-green-dark">
                                          {data.retention}%
                                        </span>
                                      </p>
                                      <p className="text-stone-400 text-left">Lần ôn tập cuối: {data.t} ngày trước</p>
                                    </div>
                                  );
                                }
                                return (
                                  <div className="bg-white p-2 border border-stone-200 rounded-xl shadow-sm text-[10px]">
                                    <p className="text-stone-500 text-left">
                                      Độ bền chuẩn R(t): <span className="font-bold">{data.curve}%</span>
                                    </p>
                                    <p className="text-stone-400 text-left">Ngày thứ: {data.t}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line
                            type="monotone"
                            data={forgettingChartData}
                            dataKey="curve"
                            stroke="#b7b7b7"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            activeDot={false}
                          />
                          <Scatter name="Trí nhớ tốt" data={masteredScatter} fill="#58cc02" line={false} shape="circle" r={6} />
                          <Scatter name="Bình thường" data={learningScatter} fill="#ffc800" line={false} shape="circle" r={6} />
                          <Scatter name="Sắp quên" data={weakScatter} fill="#ff4b4b" line={false} shape="circle" r={6} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Concept decay details & action cards */}
                  <div className="rounded-3xl border border-tertiary-yellow/30 bg-warm-cream p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <SectionHeader
                        eyebrow="Decay status"
                        title="Mức Độ Lưu Trữ Kiến Thức Theo Concept"
                        description="Danh sách các kỹ năng sắp đến hạn lặp lại ngắt quãng để kích hoạt lại trí nhớ."
                      />
                      <div className="mt-4 space-y-3 max-h-[190px] overflow-y-auto pr-1">
                        {selectedStudentDecayData
                          .sort((a, b) => a.retention - b.retention) // Weakest first
                          .map((concept) => {
                            const isWeak = concept.retention < 50;
                            const isGood = concept.retention >= 80;

                            let badgeBg = 'bg-primary-green-light/20 border-primary-green/20 text-primary-green-dark';
                            let badgeText = 'Trí nhớ Tốt';
                            let barBg = 'bg-primary-green';
                            let textCol = 'text-primary-green-dark';

                            if (isWeak) {
                              badgeBg = 'bg-error-red-light/20 border-error-red/20 text-error-red-dark';
                              badgeText = '⚠️ Sắp quên (Decay)';
                              barBg = 'bg-error-red';
                              textCol = 'text-error-red-dark';
                            } else if (!isGood) {
                              badgeBg = 'bg-tertiary-yellow/15 border-tertiary-yellow/30 text-tertiary-yellow-dark';
                              badgeText = 'Bình thường';
                              barBg = 'bg-tertiary-yellow';
                              textCol = 'text-tertiary-yellow-dark';
                            }

                            return (
                              <div
                                key={concept.name}
                                className={`p-3 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left ${
                                  isWeak ? 'border-error-red-light/35 bg-rose-50/40' : 'border-stone-250/70 bg-stone-50/50'
                                }`}
                              >
                                <div className="space-y-1 flex-1 w-full text-left">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-black text-stone-900">{concept.name}</h4>
                                    <span className={`text-[8px] border px-2 py-0.2 rounded font-black font-mono ${badgeBg}`}>
                                      {badgeText}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-stone-500 font-medium">
                                    Lần ôn tập cuối: {concept.t} ngày trước · Độ bền ước tính:{' '}
                                    <span className="font-bold">{concept.retention}%</span>
                                  </p>
                                  <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden relative">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${barBg}`}
                                      style={{ width: `${concept.retention}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
                                  <span className={`text-xs font-mono font-black ${textCol}`}>{concept.retention}%</span>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        triggerNotification(`Đã lên lịch ôn tập ngắt quãng các concept yếu cho học viên ${selectedStudent.name}`)
                      }
                      className="mt-4 w-full rounded-2xl bg-stone-900 text-white font-black uppercase text-[10px] tracking-widest py-3 text-center transition-all hover:bg-stone-800 btn-3d"
                    >
                      🚀 Kích hoạt quy trình ôn tập ngắt quãng
                    </button>
                  </div>
                </section>
              ) : null}

              {studentProfileSection === 'attempt-logs' ? (
                <section className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                  <SectionHeader
                    eyebrow="Attempt logs"
                    title="Nhật Ký Làm Quiz"
                    description="Theo dõi score, thời gian làm và độ chính xác để tìm pattern học tập."
                  />

                  <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-border text-[10px] font-black uppercase tracking-widest text-stone-400">
                          <th className="pb-3 pr-4">Bài quiz</th>
                          <th className="pb-3 pr-4">Hoàn thành lúc</th>
                          <th className="pb-3 pr-4">Điểm</th>
                          <th className="pb-3 pr-4">Độ chính xác</th>
                          <th className="pb-3">Thời gian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.attemptLogs.map((attempt) => (
                          <tr key={attempt.id} className="border-b border-stone-100 last:border-b-0">
                            <td className="py-3 pr-4">
                              <p className="text-sm font-black text-on-background">{attempt.quizTitle}</p>
                            </td>
                            <td className="py-3 pr-4 text-sm font-semibold text-stone-600">
                              {attempt.completedAt}
                            </td>
                            <td className="py-3 pr-4 text-sm font-semibold text-stone-600">
                              {attempt.score}/10
                            </td>
                            <td className="py-3 pr-4 text-sm font-semibold text-stone-600">
                              {attempt.accuracyRate}%
                            </td>
                            <td className="py-3 text-sm font-semibold text-stone-600">
                              {attempt.durationMinutes} phút
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {studentProfileSection === 'mentor-notes' ? (
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                    <SectionHeader
                      eyebrow="Mentor notes"
                      title="Ghi Chú & Quan Sát"
                      description="Ghi chú nhanh cho từng học viên và lưu tạm ngay trong trình duyệt."
                    />

                    <div className="mt-5 space-y-3">
                      <textarea
                        value={draftNote}
                        onChange={(event) => setDraftNote(event.target.value)}
                        placeholder="Ví dụ: cần follow-up lại phần metadata filtering trước buổi mentoring tới..."
                        className="min-h-28 w-full rounded-3xl border-2 border-gray-border bg-white px-4 py-3 text-sm font-semibold text-stone-700 focus:border-primary-green focus:outline-none"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={addMentorNote} className="btn-3d btn-green text-[11px]">
                          <MessageSquarePlus className="mr-1 h-4 w-4" />
                          Lưu ghi chú
                        </button>
                      </div>
                    </div>

                    <div className="mt-5 space-y-3">
                      {selectedStudentNotes.length > 0 ? (
                        selectedStudentNotes.map((note, index) => (
                          <div
                            key={`${selectedStudent.id}-${index}`}
                            className="rounded-2xl border border-gray-border bg-surface-container-low p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <NotebookPen className="mt-0.5 h-4 w-4 shrink-0 text-primary-blue-dark" />
                                <p className="text-sm font-semibold leading-6 text-stone-700">{note}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeMentorNote(index)}
                                className="text-[10px] font-black uppercase tracking-wide text-stone-400 hover:text-error-red-dark"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-border bg-surface-container-low p-6 text-center">
                          <p className="text-sm font-semibold text-stone-500">Chưa có ghi chú nào cho học viên này.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-3xl border-2 border-gray-border bg-white p-5 shadow-sm">
                    <SectionHeader
                      eyebrow="Interventions"
                      title="Lịch Sử Hỗ Trợ"
                      description="Theo dõi các lần mentor đã can thiệp để tránh trùng lặp và có ngữ cảnh."
                    />

                    <div className="mt-5 space-y-3">
                      {selectedStudent.interventions.length > 0 ? (
                        selectedStudent.interventions.map((item) => (
                          <div key={item.id} className="rounded-2xl border border-gray-border bg-surface-container-low p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-primary-blue-border bg-primary-blue-light px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-primary-blue-dark">
                                {item.type}
                              </span>
                              <span className="font-mono text-[10px] uppercase tracking-wide text-stone-400">
                                {item.createdAt}
                              </span>
                            </div>
                            <p className="mt-2 text-sm font-black text-on-background">{item.title}</p>
                            <p className="mt-1 text-[11px] font-semibold leading-6 text-stone-600">{item.detail}</p>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-border bg-surface-container-low p-6 text-center">
                          <BookOpenCheck className="mx-auto h-8 w-8 text-stone-300" />
                          <p className="mt-2 text-sm font-semibold text-stone-500">
                            Chưa có lịch sử can thiệp nào được ghi nhận.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </section>
      )}

      {hoveredTooltip && tooltipStyle && (
        <div
          className={`fixed z-[9999] pointer-events-none w-56 rounded-xl border border-stone-200 bg-stone-900 p-3 text-left text-[10px] font-semibold text-white shadow-xl transition-opacity duration-150 ${
            tooltipStyle.showBelow ? '' : '-translate-y-full'
          }`}
          style={{
            left: tooltipStyle.left,
            top: tooltipStyle.top,
          }}
        >
          {hoveredTooltip.content}
        </div>
      )}
    </div>
  );
};
