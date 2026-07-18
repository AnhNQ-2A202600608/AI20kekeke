import { useState, useMemo, useEffect } from 'react';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningElo } from '@/lib/adaptive/elo';
import { getRequestAuthToken } from '@/lib/auth-token';
import dayjs from 'dayjs';
import {
  DayActivity,
  Session,
  calculateComputedConcepts,
} from '../utils/profile-utils';

interface UseProfileDataProps {
  onStartPractice?: (skillId: string, targetSetId?: string) => void;
}

async function parseProfileApiError(response: Response) {
  try {
    const payload = await response.json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Fall through to the generic status message.
  }

  return `Profile API failed with status ${response.status}`;
}

async function fetchStudentProfileResource<T>(path: string, studentId: string, authToken: string): Promise<T> {
  const params = new URLSearchParams({ student_id: studentId });
  const response = await fetch(`${path}?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
    credentials: 'same-origin',
  });

  if (!response.ok) {
    throw new Error(await parseProfileApiError(response));
  }

  return response.json();
}

export function useProfileData({ onStartPractice }: UseProfileDataProps = {}) {
  const rechargedDates = useMemo<Record<string, string>>(() => ({}), []);
  const [activeDrawerConceptId, setActiveDrawerConceptId] = useState<string | null>(null);

  const { skills, conceptMasteries, userId, token, setToken } = useBoundStore();

  const computedConcepts = useMemo(() => {
    return calculateComputedConcepts(skills, conceptMasteries, rechargedDates);
  }, [skills, conceptMasteries, rechargedDates]);

  const averageElo = useMemo(() => {
    return getAggregateLearningElo(conceptMasteries);
  }, [conceptMasteries]);

  const zpdConceptsCount = useMemo(() => {
    return computedConcepts.filter((c) => c.status === 'zpd' || c.status === 'learning').length;
  }, [computedConcepts]);

  const sortedConcepts = useMemo(() => {
    const statusOrder = { weak: 1, zpd: 2, learning: 3, cold_start: 4, mastered: 5 };
    return [...computedConcepts].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  }, [computedConcepts]);

  const [heatmapActivities, setHeatmapActivities] = useState<DayActivity[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!userId) return;
    let active = true;

    async function fetchActivities() {
      try {
        const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
        if (usedExpiredToken || rejectedDemoToken) setToken('');
        if (!authToken) return;

        const realData = await fetchStudentProfileResource<Array<{ date: string; eloGain: number; quizCount: number; chatCount?: number }>>(
          '/api/v1/student/activity',
          userId,
          authToken
        );
        const realMap = new Map<string, { date: string; eloGain: number; quizCount: number; chatCount?: number }>();
        realData.forEach((d) => {
          realMap.set(d.date, d);
        });

        // Generate a 30 day grid ending today; only backend rows add progress.
        const activities: DayActivity[] = [];
        const startDay = dayjs().subtract(29, 'day');

        for (let i = 0; i < 30; i++) {
          const currentDate = startDay.add(i, 'day').format('YYYY-MM-DD');
          const realDay = realMap.get(currentDate);

          if (realDay) {
            activities.push({
              date: currentDate,
              eloGain: realDay.eloGain,
              quizCount: realDay.quizCount,
              chatCount: realDay.chatCount || 0,
              masteredConcept: realDay.quizCount >= 2 ? 'Mastered Concept' : undefined,
            });
          } else {
            activities.push({
              date: currentDate,
              eloGain: 0,
              quizCount: 0,
              chatCount: 0,
            });
          }
        }
        if (active) {
          setHeatmapActivities(activities);
        }
      } catch (err) {
        console.error('Failed to fetch student activities:', err);
      }
    }

    async function fetchRecentSessions() {
      try {
        const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
        if (usedExpiredToken || rejectedDemoToken) setToken('');
        if (!authToken) return;
        const data = await fetchStudentProfileResource<Session[]>(
          '/api/v1/student/recent_sessions',
          userId,
          authToken
        );
        if (active) {
          setSessions(data);
        }
      } catch (err) {
        console.error('Failed to fetch recent sessions:', err);
      }
    }

    fetchActivities();
    fetchRecentSessions();

    return () => {
      active = false;
    };
  }, [userId, token, setToken]);

  const activeDrawerConcept = useMemo(() => {
    return computedConcepts.find((c) => c.id === activeDrawerConceptId);
  }, [computedConcepts, activeDrawerConceptId]);

  const handleStartConceptPractice = (conceptId: string) => {
    const conceptObj = computedConcepts.find((c) => c.id === conceptId);
    if (!conceptObj) return;

    const skill = skills.find((s) => s.id === conceptObj.skillId);
    const targetSetId = conceptObj.associatedSets?.[0] || 'day1-basics';

    if (skill && onStartPractice) {
      onStartPractice(skill.id, targetSetId);
    }
  };

  return {
    activeDrawerConceptId,
    setActiveDrawerConceptId,
    computedConcepts,
    averageElo,
    zpdConceptsCount,
    sortedConcepts,
    heatmapActivities,
    activeDrawerConcept,
    handleStartConceptPractice,
    sessions,
  };
}
