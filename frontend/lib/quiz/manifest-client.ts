import type { Skill } from './types';

interface SkillsManifest {
  skills: Skill[];
}

interface QuizManifestSet {
  id: string;
  title: string;
  questions?: unknown[];
  [key: string]: unknown;
}

interface QuizManifest {
  sets: QuizManifestSet[];
}

let skillsManifestRequest: Promise<SkillsManifest | null> | null = null;
let quizManifestRequest: Promise<QuizManifest | null> | null = null;

async function fetchJson<T>(path: string): Promise<T | null> {
  const cacheMode = process.env.NODE_ENV === 'development' ? 'no-cache' : 'default';
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: cacheMode });
  if (!response.ok) {
    throw new Error(`${path} failed with status ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function loadSkillsManifest() {
  if (!skillsManifestRequest) {
    skillsManifestRequest = fetchJson<SkillsManifest>('/skills-manifest.json').catch((error) => {
      skillsManifestRequest = null;
      throw error;
    });
  }
  return skillsManifestRequest;
}

export function loadQuizManifest() {
  if (!quizManifestRequest) {
    quizManifestRequest = fetch('/quiz-manifest.json', { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`/quiz-manifest.json failed with status ${response.status}`);
        }
        return response.json() as Promise<QuizManifest>;
      })
      .catch((error) => {
      quizManifestRequest = null;
      throw error;
    });
  }
  return quizManifestRequest;
}
