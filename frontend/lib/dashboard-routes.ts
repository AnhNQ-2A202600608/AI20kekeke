import type { TabType } from '@/lib/dashboard-tabs';
import { getDefaultTabForRole, type AppRole } from './dashboard-tabs';

export const TAB_ROUTE: Record<TabType, string> = {
  learn: '/app/learn',
  skills: '/app/skills',
  'skill-graph': '/app/skill-graph',
  chat: '/app/chat',
  leaderboard: '/app/learn',
  profile: '/app/profile',
  insights: '/app/insights',
  ingestion: '/app/ingestion',
  'quiz-editor': '/app/quiz-editor',
  'rag-audit': '/app/rag-audit',
  'btc-heatmap': '/app/btc-heatmap',
  'braintrust-observability': '/app/observability',
};

export function getRouteForTab(tab: TabType) {
  return TAB_ROUTE[tab] || TAB_ROUTE.learn;
}

export function getTabForRoute(pathname: string): TabType | null {
  const normalizedPath = pathname.replace(/\/$/, '') || '/';

  for (const [tab, route] of Object.entries(TAB_ROUTE) as Array<[TabType, string]>) {
    if (normalizedPath === route) {
      return tab;
    }
  }

  if (normalizedPath === '/app') {
    return 'learn';
  }

  if (normalizedPath === '/app/chat') {
    return 'chat';
  }

  return null;
}

export function getRedirectPathForRole(role?: AppRole | null): string {
  const defaultTab = getDefaultTabForRole(role);
  return defaultTab === 'learn' ? '/app' : getRouteForTab(defaultTab);
}

