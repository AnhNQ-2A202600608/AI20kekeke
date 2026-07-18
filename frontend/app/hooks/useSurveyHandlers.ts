'use client';

import { useState, useEffect, useCallback } from 'react';
import { trackQuizEvent } from '@/lib/analytics';
import { getRequestAuthToken } from '@/lib/auth-token';
import { useBoundStore } from '@/hooks/useBoundStore';

interface SurveyRatings {
  [setId: string]: {
    understanding: number;
    utility: number;
    personalized: number;
  };
}

async function parseSurveyApiError(response: Response) {
  try {
    const payload = await response.clone().json();
    if (typeof payload?.detail === 'string') return payload.detail;
    if (typeof payload?.message === 'string') return payload.message;
    if (typeof payload?.error === 'string') return payload.error;
  } catch {
    // Fall through to response text/status.
  }
  return await response.text().catch(() => '') || `Survey API failed with status ${response.status}`;
}

async function surveyApiRequest<T>(
  path: string,
  token: string,
  clearToken: () => void,
  init: RequestInit,
): Promise<T> {
  const { authToken, usedExpiredToken, rejectedDemoToken } = getRequestAuthToken(token);
  if (usedExpiredToken || rejectedDemoToken) {
    clearToken();
  }
  if (!authToken) {
    throw new Error('Bạn cần đăng nhập lại để gửi khảo sát.');
  }

  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
      ...init.headers,
    },
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(await parseSurveyApiError(response));
  }
  return response.json() as Promise<T>;
}

export function useSurveyHandlers(
  activeSetId: string,
  activeSet: any,
  totalQuestions: number
) {
  const token = useBoundStore(state => state.token);
  const setToken = useBoundStore(state => state.setToken);
  // Survey states linked by activeSetId
  const [preQuizRatings, setPreQuizRatings] = useState<{ [setId: string]: number }>({});
  const [preQuizSubmitted, setPreQuizSubmitted] = useState<{ [setId: string]: boolean }>({});
  
  // Post-quiz survey states linked by activeSetId
  const [postRatings, setPostRatings] = useState<SurveyRatings>({});
  const [postQuizSubmitted, setPostQuizSubmitted] = useState<{ [setId: string]: boolean }>({});
  const [preQuizComments, setPreQuizComments] = useState<{ [setId: string]: string }>({});
  const [postQuizComments, setPostQuizComments] = useState<{ [setId: string]: string }>({});
  
  const [waitlistEmail, setWaitlistEmail] = useState<string>('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState<boolean>(false);
  const [showPreComment, setShowPreComment] = useState<boolean>(false);
  
  // Session survey mapping ID
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);

  // Load pre-quiz submission states from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedPreSubmitted = localStorage.getItem('edugap_pre_submitted');
      if (savedPreSubmitted) {
        try {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPreQuizSubmitted(JSON.parse(savedPreSubmitted));
        } catch (e) {
          console.error('Failed to parse pre-quiz submission states:', e);
        }
      }
    }
  }, []);

  const getCompactQuizAnalyticsProperties = useCallback(() => ({
    set_id: activeSetId,
    difficulty: activeSet?.difficulty || null,
    question_count: totalQuestions
  }), [activeSet, activeSetId, totalQuestions]);

  const getShareUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    const slug = activeSetId === 'react-loop-basics' ? 'design-pattern-react' : activeSetId;
    return `${window.location.origin}${window.location.pathname}?set=${slug}`;
  }, [activeSetId]);

  const handleCopyShareLink = useCallback((source: string) => {
    if (typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(getShareUrl());
    trackQuizEvent('share_link_copied', {
      set_id: activeSetId,
      source
    });
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 2000);
  }, [activeSetId, getShareUrl]);

  // Supabase submission handlers
  const handlePreQuizSubmit = useCallback(async () => {
    const rating = preQuizRatings[activeSetId];
    const comment = preQuizComments[activeSetId] || '';
    if (!rating) return;
    
    trackQuizEvent('pre_quiz_submitted', {
      ...getCompactQuizAnalyticsProperties(),
      rating_pre: rating,
      has_comment: comment.trim().length > 0
    });
    
    const updatedPre = { ...preQuizSubmitted, [activeSetId]: true };
    setPreQuizSubmitted(updatedPre);
    localStorage.setItem('edugap_pre_submitted', JSON.stringify(updatedPre));
    
    try {
      const data = await surveyApiRequest<{ id: string }>('/api/v1/surveys', token, () => setToken(''), {
        method: 'POST',
        body: JSON.stringify({
          set_id: activeSetId,
          rating_pre: rating,
          comment_pre: comment
        }),
      });
      setSubmissionId(data.id);
    } catch (err) {
      console.error('Failed to submit pre-quiz survey:', err);
    }
  }, [activeSetId, preQuizRatings, preQuizComments, preQuizSubmitted, getCompactQuizAnalyticsProperties, token, setToken]);

  const handleWaitlistSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistEmail || !waitlistEmail.includes('@')) return;
    
    trackQuizEvent('waitlist_submitted', {
      set_id: activeSetId,
      has_email: true
    });
    setWaitlistSubmitted(true);
    
    try {
      if (submissionId) {
        await surveyApiRequest(`/api/v1/surveys/${encodeURIComponent(submissionId)}`, token, () => setToken(''), {
          method: 'PATCH',
          body: JSON.stringify({
            email: waitlistEmail
          }),
        });
      } else {
        const data = await surveyApiRequest<{ id: string }>('/api/v1/surveys', token, () => setToken(''), {
          method: 'POST',
          body: JSON.stringify({
            set_id: activeSetId,
            email: waitlistEmail
          }),
        });
        setSubmissionId(data.id);
      }
    } catch (err) {
      console.error('Failed to submit waitlist email:', err);
    }
  }, [activeSetId, waitlistEmail, submissionId, token, setToken]);

  const handlePostQuizSubmit = useCallback(async () => {
    const ratings = postRatings[activeSetId];
    const comment = postQuizComments[activeSetId] || '';
    if (!ratings || !ratings.understanding || !ratings.utility || !ratings.personalized) return;
    
    trackQuizEvent('post_quiz_submitted', {
      set_id: activeSetId,
      understanding: ratings.understanding,
      utility: ratings.utility,
      personalized: ratings.personalized,
      has_comment: comment.trim().length > 0
    });
    setPostQuizSubmitted(prev => ({ ...prev, [activeSetId]: true }));
    
    try {
      if (submissionId) {
        await surveyApiRequest(`/api/v1/surveys/${encodeURIComponent(submissionId)}`, token, () => setToken(''), {
          method: 'PATCH',
          body: JSON.stringify({
            rating_understanding: ratings.understanding,
            rating_utility: ratings.utility,
            rating_personalized: ratings.personalized,
            comment_post: comment
          }),
        });
      } else {
        const data = await surveyApiRequest<{ id: string }>('/api/v1/surveys', token, () => setToken(''), {
          method: 'POST',
          body: JSON.stringify({
            set_id: activeSetId,
            rating_understanding: ratings.understanding,
            rating_utility: ratings.utility,
            rating_personalized: ratings.personalized,
            comment_post: comment
          }),
        });
        setSubmissionId(data.id);
      }
    } catch (err) {
      console.error('Failed to submit post-quiz survey:', err);
    }
  }, [activeSetId, postRatings, postQuizComments, submissionId, token, setToken]);

  const resetSurveys = useCallback((setId: string) => {
    setSubmissionId(null);
    setWaitlistSubmitted(false);
    setWaitlistEmail('');
    setShowPreComment(false);

    setPostQuizSubmitted(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPreQuizSubmitted(prev => {
      const copy = { ...prev };
      delete copy[setId];
      // Sync to local storage
      localStorage.setItem('edugap_pre_submitted', JSON.stringify(copy));
      return copy;
    });
    setPreQuizRatings(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPreQuizComments(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPostRatings(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
    setPostQuizComments(prev => {
      const copy = { ...prev };
      delete copy[setId];
      return copy;
    });
  }, []);

  return {
    preQuizRatings,
    setPreQuizRatings,
    preQuizSubmitted,
    setPreQuizSubmitted,
    postRatings,
    setPostRatings,
    postQuizSubmitted,
    setPostQuizSubmitted,
    preQuizComments,
    setPreQuizComments,
    postQuizComments,
    setPostQuizComments,
    waitlistEmail,
    setWaitlistEmail,
    waitlistSubmitted,
    setWaitlistSubmitted,
    showPreComment,
    setShowPreComment,
    submissionId,
    setSubmissionId,
    copiedShareLink,
    handleCopyShareLink,
    handlePreQuizSubmit,
    handleWaitlistSubmit,
    handlePostQuizSubmit,
    resetSurveys,
    getShareUrl
  };
}
