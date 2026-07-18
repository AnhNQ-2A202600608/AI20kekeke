import type { ComponentType } from 'react';
import {
  BarChart3,
  BookOpen,
  Dumbbell,
  FileEdit,
  Gauge,
  GitBranch,
  MessageSquare,
  Search,
  Upload,
  User,
  Users,
} from 'lucide-react';

export type PersonaType = 'student' | 'mentor' | 'btc';
export type AppRole = 'student' | 'mentor' | 'teacher' | 'admin' | 'btc' | 'dev' | string;

export type TabType =
  | 'learn'
  | 'skills'
  | 'skill-graph'
  | 'chat'
  | 'leaderboard'
  | 'profile'
  | 'insights'
  | 'ingestion'
  | 'quiz-editor'
  | 'rag-audit'
  | 'btc-heatmap'
  | 'braintrust-observability';

type NavigationItem = {
  id: TabType;
  name: string;
  shortName?: string;
  icon: ComponentType<{ className?: string }>;
};

const STUDENT_ITEMS: NavigationItem[] = [
  { id: 'learn', name: 'Học tập', icon: BookOpen },
  { id: 'skills', name: 'Luyện tập', shortName: 'Luyện', icon: Dumbbell },
  { id: 'skill-graph', name: 'Skill Graph', shortName: 'Graph', icon: GitBranch },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Hồ sơ', shortName: 'Hồ sơ', icon: User },
];

const MENTOR_ITEMS: NavigationItem[] = [
  { id: 'insights', name: 'Thống kê lớp', shortName: 'Lớp', icon: Users },
  { id: 'ingestion', name: 'Tài liệu & Graph', shortName: 'Graph', icon: Upload },
  { id: 'quiz-editor', name: 'Quản lý quiz', shortName: 'Quiz', icon: FileEdit },
  { id: 'rag-audit', name: 'Mentor Review', shortName: 'Review', icon: Search },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Cá nhân', shortName: 'Tôi', icon: User },
];

const BTC_ITEMS: NavigationItem[] = [
  { id: 'braintrust-observability', name: 'AI Observability', shortName: 'AI Ops', icon: Gauge },
  { id: 'btc-heatmap', name: 'Cổng BTC', shortName: 'BTC', icon: BarChart3 },
  { id: 'chat', name: 'Trợ lý AI', shortName: 'AI', icon: MessageSquare },
  { id: 'profile', name: 'Cá nhân', shortName: 'Tôi', icon: User },
];

export function normalizeRole(role?: AppRole | null) {
  return (role || '').trim().toLowerCase();
}

export function getAllowedPersonas(role?: AppRole | null): PersonaType[] {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'admin' || normalizedRole === 'dev') {
    return ['btc', 'mentor', 'student'];
  }
  if (normalizedRole === 'mentor' || normalizedRole === 'teacher') {
    return ['mentor'];
  }
  if (normalizedRole === 'btc') {
    return ['btc'];
  }
  return ['student'];
}

export function resolvePersonaForRole(persona: PersonaType, role?: AppRole | null): PersonaType {
  const allowedPersonas = getAllowedPersonas(role);
  return allowedPersonas.includes(persona) ? persona : allowedPersonas[0];
}

export function getNavigationItems(persona: PersonaType, role?: AppRole | null): NavigationItem[] {
  const resolvedPersona = resolvePersonaForRole(persona, role);
  switch (resolvedPersona) {
    case 'mentor':
      return MENTOR_ITEMS;
    case 'btc':
      return BTC_ITEMS;
    case 'student':
    default:
      return STUDENT_ITEMS;
  }
}

export function getDefaultTabForRole(role?: AppRole | null): TabType {
  const persona = getAllowedPersonas(role)[0];
  return getDefaultTabForPersona(persona);
}

export function getDefaultTabForPersona(persona: PersonaType): TabType {
  if (persona === 'mentor') return 'insights';
  if (persona === 'btc') return 'braintrust-observability';
  return 'learn';
}

export function getAllowedTabsForRole(role?: AppRole | null): Set<TabType> {
  const tabs = getAllowedPersonas(role).flatMap((persona) =>
    getNavigationItems(persona, role).map((item) => item.id),
  );
  return new Set(tabs);
}

export function getAllowedTabsForPersona(persona: PersonaType, role?: AppRole | null): Set<TabType> {
  return new Set(getNavigationItems(persona, role).map((item) => item.id));
}