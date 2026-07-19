'use client';

import React, { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useBoundStore } from '@/hooks/useBoundStore';
import { MascotLoadingBlock } from '@/components/mascot';
import { buildKnowledgeGraph } from './socratic-chat/components/knowledge-graph/knowledge-graph-adapter';
import { KnowledgeGraphTrigger } from './socratic-chat/components/knowledge-graph/knowledge-graph-trigger';
import type { TabType } from '@/lib/dashboard-tabs';
import type { Skill } from '@/lib/quiz/types';
import type {
  KnowledgeGraphConcept,
  KnowledgeGraphEdge,
  KnowledgeGraphNode,
  KnowledgeGraphRelationRow,
} from './socratic-chat/components/knowledge-graph/types';

const COURSE_UUID = 'cf76850d-0738-50c3-bf34-1c464fa3b4d3';
export const OPEN_KNOWLEDGE_GRAPH_EVENT = 'edugap:open-knowledge-graph';
const GRAPH_CACHE_KEY = `edugap_knowledge_graph_${COURSE_UUID}`;
const GRAPH_CACHE_VERSION = 3;
const GRAPH_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let graphRequest: Promise<{
  concepts: KnowledgeGraphConcept[];
  relations: KnowledgeGraphRelationRow[];
  source: 'supabase' | 'unavailable';
}> | null = null;

interface KnowledgeGraphCache {
  version: number;
  cachedAt: number;
  concepts: KnowledgeGraphConcept[];
  relations: KnowledgeGraphRelationRow[];
  source: 'supabase';
}

const KnowledgeGraphModal = dynamic(
  () =>
    import('./socratic-chat/components/knowledge-graph/knowledge-graph-modal').then(
      (mod) => mod.KnowledgeGraphModal,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-stone-950/35 backdrop-blur-sm">
        <MascotLoadingBlock
          title="Sofi đang mở bản đồ kiến thức..."
          description="Đang chuẩn bị modal skill graph"
          className="max-w-sm shadow-xl"
          mascotClassName="scale-[0.82]"
        />
      </div>
    ),
  },
);

interface KnowledgeGraphLauncherProps {
  setActiveTab: (tab: TabType) => void;
  onStartPractice?: (skill: Skill, targetSetId?: string) => void;
  variant?: 'floating' | 'inline';
  className?: string;
  hideTrigger?: boolean;
}

export const KnowledgeGraphLauncher: React.FC<KnowledgeGraphLauncherProps> = ({
  setActiveTab,
  onStartPractice,
  variant = 'floating',
  className,
  hideTrigger = false,
}) => {
  const { skills, conceptMasteries, activePracticeSession } = useBoundStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [graphConcepts, setGraphConcepts] = useState<KnowledgeGraphConcept[]>([]);
  const [graphRelations, setGraphRelations] = useState<KnowledgeGraphRelationRow[]>([]);
  const [graphSource, setGraphSource] = useState<'supabase' | 'unavailable'>('unavailable');

  const applyGraphData = (
    concepts: KnowledgeGraphConcept[],
    relations: KnowledgeGraphRelationRow[],
    source: 'supabase' | 'unavailable',
  ) => {
    setGraphConcepts(concepts);
    setGraphRelations(relations);
    setGraphSource(source);
    setHasLoaded(true);
  };

  const hydrateFromCache = () => {
    if (typeof window === 'undefined') return false;

    try {
      const raw = window.localStorage.getItem(GRAPH_CACHE_KEY);
      if (!raw) return false;

      const cached = JSON.parse(raw) as KnowledgeGraphCache;
      const isFresh =
        cached.version === GRAPH_CACHE_VERSION &&
        cached.source === 'supabase' &&
        Date.now() - cached.cachedAt < GRAPH_CACHE_TTL_MS &&
        Array.isArray(cached.concepts) &&
        Array.isArray(cached.relations);

      if (!isFresh) return false;

      applyGraphData(cached.concepts, cached.relations, cached.source);
      return true;
    } catch (error) {
      console.warn('[KnowledgeGraphLauncher] Failed to read graph cache:', error);
      return false;
    }
  };

  const writeGraphCache = (
    concepts: KnowledgeGraphConcept[],
    relations: KnowledgeGraphRelationRow[],
    source: 'supabase' | 'unavailable',
  ) => {
    if (typeof window === 'undefined' || source !== 'supabase' || concepts.length === 0) return;

    try {
      const payload: KnowledgeGraphCache = {
        version: GRAPH_CACHE_VERSION,
        cachedAt: Date.now(),
        concepts,
        relations,
        source: 'supabase',
      };
      window.localStorage.setItem(GRAPH_CACHE_KEY, JSON.stringify(payload));
    } catch (error) {
      console.warn('[KnowledgeGraphLauncher] Failed to write graph cache:', error);
    }
  };

  const relationEdges = useMemo<KnowledgeGraphEdge[]>(() => {
    return graphRelations.map((relation) => ({
      id: relation.id,
      source: relation.source_concept_id,
      target: relation.target_concept_id,
    }));
  }, [graphRelations]);

  const knowledgeGraph = useMemo(
    () =>
      buildKnowledgeGraph({
        storeSkills: skills,
        conceptMasteries,
        activeConceptId: activePracticeSession?.targetSetId || activePracticeSession?.skillId,
        graphConcepts,
        relationRows: relationEdges,
      }),
    [activePracticeSession?.skillId, activePracticeSession?.targetSetId, conceptMasteries, graphConcepts, relationEdges, skills],
  );

  const loadKnowledgeGraph = async (options: { refresh?: boolean } = {}) => {
    if ((hasLoaded && !options.refresh) || isLoading) return;

    setIsLoading(true);
    try {
      if (!graphRequest) {
        graphRequest = (async () => {
          const params = new URLSearchParams({
            course_id: COURSE_UUID,
            status: 'all',
          });
          const response = await fetch(`/api/knowledge-graph?${params.toString()}`, {
            cache: 'no-store',
          });
          if (!response.ok) {
            throw new Error(`Knowledge graph API failed with status ${response.status}`);
          }
          const data = await response.json();
          const concepts = Array.isArray(data.concepts) ? data.concepts : [];
          const relations = Array.isArray(data.relations) ? data.relations : [];
          const source = data.source === 'supabase' && concepts.length ? 'supabase' : 'unavailable';
          return { concepts, relations, source };
        })();
        const cleanupRequest = () => {
          graphRequest = null;
        };
        graphRequest.then(cleanupRequest, cleanupRequest);
      }

      const { concepts, relations, source } = await graphRequest;
      applyGraphData(concepts, relations, source);
      writeGraphCache(concepts, relations, source);
    } catch (error) {
      console.warn('[KnowledgeGraphLauncher] Failed to load Supabase knowledge graph:', error);
      if (!hasLoaded) {
        applyGraphData([], [], 'unavailable');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    const hydrated = hasLoaded || hydrateFromCache();
    if (!hydrated) {
      loadKnowledgeGraph();
    }
  };

  useEffect(() => {
    window.addEventListener(OPEN_KNOWLEDGE_GRAPH_EVENT, handleOpen);
    return () => {
      window.removeEventListener(OPEN_KNOWLEDGE_GRAPH_EVENT, handleOpen);
    };
  });

  const handleAskAboutGraphNode = () => {
    setIsOpen(false);
    setActiveTab('chat');
  };

  const handleNavigateToCurrent = () => {
    setIsOpen(false);
    setActiveTab('learn');
  };

  const handleStartPracticeFromNode = (node: KnowledgeGraphNode) => {
    const targetSetId = node.associatedSets[0];
    const skill =
      skills.find((candidate) => candidate.id === node.id) ||
      skills.find((candidate) =>
        targetSetId ? candidate.associatedSets?.includes(targetSetId) : false,
      );

    if (!skill || !targetSetId || !onStartPractice) return;

    setIsOpen(false);
    onStartPractice(skill, targetSetId);
  };

  return (
    <>
      {!hideTrigger && (
        <KnowledgeGraphTrigger
          summary={knowledgeGraph.summary}
          isLoading={isLoading}
          onOpen={handleOpen}
          variant={variant}
          className={className}
        />
      )}

      {isOpen && (
        <KnowledgeGraphModal
          isOpen={isOpen}
          nodes={knowledgeGraph.nodes}
          edges={knowledgeGraph.edges}
          summary={knowledgeGraph.summary}
          sourceLabel={graphSource === 'supabase' ? 'Supabase' : 'Không khả dụng'}
          isLoading={isLoading && !hasLoaded}
          onClose={() => setIsOpen(false)}
          onAskAboutConcept={handleAskAboutGraphNode}
          onNavigateToCurrent={handleNavigateToCurrent}
          onStartPractice={onStartPractice ? handleStartPracticeFromNode : undefined}
        />
      )}
    </>
  );
};
