'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
  type Viewport,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LocateFixed, Maximize2, Minus, Mouse, Plus, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AppTopNav } from '@/components/app/app-top-nav';
import { MascotLoadingBlock } from '@/components/mascot';
import { SofiExpressionAvatar } from '@/components/mascot';
import { SocraticChatBody } from '@/components/quiz/socratic-sidebar-view';
import { ActionButton } from '@/components/ui/action-button';
import { useBoundStore } from '@/hooks/useBoundStore';
import { getAggregateLearningElo } from '@/lib/adaptive/elo';
import { buildChatArtifacts, streamChatRequest } from '@/lib/chat/stream';
import {
  listSofiConversations,
  upsertSofiConversation,
} from '@/lib/chat/sofi-conversation-store';
import type { TabType } from '@/lib/dashboard-tabs';
import type { Skill } from '@/lib/quiz/types';
import {
  buildKnowledgeGraph,
  getKnowledgeGraphDetail,
  getRelatedNodeIds,
} from './socratic-chat/components/knowledge-graph/knowledge-graph-adapter';
import { KnowledgeGraphDetailPanel } from './socratic-chat/components/knowledge-graph/knowledge-graph-detail-panel';
import {
  getTreeWindow,
  layoutGraph,
} from './socratic-chat/components/knowledge-graph/knowledge-graph-modal';
import { KnowledgeGraphNode } from './socratic-chat/components/knowledge-graph/knowledge-graph-node';
import type {
  KnowledgeGraphConcept,
  KnowledgeGraphEdge,
  KnowledgeGraphNode as KnowledgeGraphNodeData,
  KnowledgeGraphRelationRow,
} from './socratic-chat/components/knowledge-graph/types';

const COURSE_UUID = 'cf76850d-0738-50c3-bf34-1c464fa3b4d3';
const GRAPH_VIEWPORT_STORAGE_KEY = 'edugap.skillGraph.viewport.v1';
const DETAIL_PANEL_STORAGE_KEY = 'edugap.skillGraph.detailPanelCollapsed.v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type GraphSofiMessage = {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  citations?: unknown[];
  slides?: unknown[];
  confidence_score?: number;
};

const nodeTypes = {
  knowledgeNode: KnowledgeGraphNode,
};

interface KnowledgeGraphPageProps {
  setActiveTab: (tab: TabType) => void;
  onStartPractice?: (skill: Skill, targetSetId?: string) => void;
  onOpenLogin?: () => void;
  onOpenProfile?: () => void;
}

export function KnowledgeGraphPage({
  setActiveTab,
  onStartPractice,
  onOpenLogin,
  onOpenProfile,
}: KnowledgeGraphPageProps) {
  const {
    activeDays,
    activePracticeSession,
    conceptMasteries,
    eloHistoryEvents,
    loggedIn,
    logOut,
    mssv,
    name,
    role,
    selectedPersona,
    setPersona,
    skills,
    streak,
    userId,
    username,
    xp,
  } = useBoundStore();
  const [isLoading, setIsLoading] = useState(true);
  const [graphConcepts, setGraphConcepts] = useState<KnowledgeGraphConcept[]>([]);
  const [graphRelations, setGraphRelations] = useState<KnowledgeGraphRelationRow[]>([]);
  const [graphSource, setGraphSource] = useState<'supabase' | 'unavailable'>('unavailable');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [sofiNode, setSofiNode] = useState<KnowledgeGraphNodeData | null>(null);
  const [sofiSessionId, setSofiSessionId] = useState<string | null>(null);
  const [sofiMessages, setSofiMessages] = useState<GraphSofiMessage[]>([]);
  const [sofiInputValue, setSofiInputValue] = useState('');
  const [isSofiTyping, setIsSofiTyping] = useState(false);
  const [zoomedSofiSlideUrl, setZoomedSofiSlideUrl] = useState<string | null>(null);
  const [isDetailCollapsed, setIsDetailCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(DETAIL_PANEL_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const restoredViewportRef = useRef(false);
  const userMovedViewportRef = useRef(false);
  const sofiScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadGraph = async () => {
      setIsLoading(true);
      try {
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
        if (cancelled) return;

        const concepts = Array.isArray(data.concepts) ? data.concepts : [];
        const relations = Array.isArray(data.relations) ? data.relations : [];
        setGraphConcepts(concepts);
        setGraphRelations(relations);
        setGraphSource(data.source === 'supabase' && concepts.length ? 'supabase' : 'unavailable');
      } catch (error) {
        if (!cancelled) {
          console.warn('[KnowledgeGraphPage] Failed to load Supabase knowledge graph:', error);
          setGraphConcepts([]);
          setGraphRelations([]);
          setGraphSource('unavailable');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadGraph();
    return () => {
      cancelled = true;
    };
  }, []);

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
        allowFallbackRelations: true,
      }),
    [activePracticeSession?.skillId, activePracticeSession?.targetSetId, conceptMasteries, graphConcepts, relationEdges, skills],
  );

  const treeWindow = useMemo(
    () => getTreeWindow(knowledgeGraph.nodes, knowledgeGraph.edges),
    [knowledgeGraph.edges, knowledgeGraph.nodes],
  );

  const visibleNodes = treeWindow.nodes;
  const visibleNodeIds = useMemo(() => new Set(visibleNodes.map((node) => node.id)), [visibleNodes]);
  const visibleEdges = useMemo(
    () =>
      knowledgeGraph.edges.filter(
        (edge) =>
          treeWindow.edgeIds.has(edge.id) &&
          visibleNodeIds.has(edge.source) &&
          visibleNodeIds.has(edge.target),
      ),
    [knowledgeGraph.edges, treeWindow.edgeIds, visibleNodeIds],
  );

  const defaultSelectedId = useMemo(() => {
    const activeNode = visibleNodes.find((node) => node.isActive);
    const priorityNode =
      activeNode ||
      visibleNodes.find((node) => node.status === 'weak') ||
      visibleNodes.find((node) => node.status === 'learning') ||
      visibleNodes[0];
    return priorityNode?.id || null;
  }, [visibleNodes]);

  const effectiveSelectedId = useMemo(() => {
    if (!selectedId) return defaultSelectedId;
    return visibleNodes.some((node) => node.id === selectedId) ? selectedId : defaultSelectedId;
  }, [defaultSelectedId, selectedId, visibleNodes]);

  const relatedIds = useMemo(
    () => (effectiveSelectedId ? getRelatedNodeIds(effectiveSelectedId, visibleEdges) : new Set<string>()),
    [effectiveSelectedId, visibleEdges],
  );

  const defaultFocusNodes = useMemo(() => {
    if (!defaultSelectedId) return [];
    const ids = new Set<string>([defaultSelectedId]);
    getRelatedNodeIds(defaultSelectedId, visibleEdges).forEach((id) => ids.add(id));
    return [...ids].map((id) => ({ id }));
  }, [defaultSelectedId, visibleEdges]);

  const detail = useMemo(
    () => (effectiveSelectedId ? getKnowledgeGraphDetail(effectiveSelectedId, visibleNodes, visibleEdges) : null),
    [effectiveSelectedId, visibleEdges, visibleNodes],
  );

  const flowEdges = useMemo<Edge[]>(() => {
    return visibleEdges.map((edge) => {
      const isSelectedPath =
        effectiveSelectedId && (edge.source === effectiveSelectedId || edge.target === effectiveSelectedId);
      const isMuted = effectiveSelectedId && !isSelectedPath;
      const stroke = isSelectedPath ? '#58cc02' : '#b7b7b7';

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        animated: Boolean(isSelectedPath),
        style: {
          stroke,
          strokeWidth: isSelectedPath ? 3 : 1.8,
          opacity: isMuted ? 0.18 : 0.72,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: stroke,
          width: 16,
          height: 16,
        },
      };
    });
  }, [effectiveSelectedId, visibleEdges]);

  const flowNodes = useMemo<Node[]>(() => {
    const baseNodes: Node[] = visibleNodes.map((node) => ({
      id: node.id,
      type: 'knowledgeNode',
      data: {
        ...node,
        isSelected: effectiveSelectedId === node.id,
        isRelated: relatedIds.has(node.id),
        hasSelection: Boolean(effectiveSelectedId),
        onSelect: setSelectedId,
      },
      position: { x: 0, y: 0 },
      draggable: true,
    }));

    return layoutGraph(baseNodes, flowEdges, 'LR');
  }, [effectiveSelectedId, flowEdges, relatedIds, visibleNodes]);

  const averageElo = useMemo(() => getAggregateLearningElo(conceptMasteries), [conceptMasteries]);
  const graphSourceLabel = graphSource === 'supabase' ? 'Supabase + manifest' : 'manifest fallback';

  const toggleDetailPanel = useCallback(() => {
    setIsDetailCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(DETAIL_PANEL_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage failures; collapsing is still useful for the current session.
      }
      return next;
    });
  }, []);

  const restoreStoredViewport = useCallback((instance: ReactFlowInstance) => {
    try {
      const rawViewport = window.localStorage.getItem(GRAPH_VIEWPORT_STORAGE_KEY);
      if (!rawViewport) return false;
      const viewport = JSON.parse(rawViewport) as Partial<Viewport>;
      if (
        typeof viewport.x !== 'number' ||
        typeof viewport.y !== 'number' ||
        typeof viewport.zoom !== 'number'
      ) {
        return false;
      }
      const { x, y, zoom } = viewport as Viewport;

      restoredViewportRef.current = true;
      window.requestAnimationFrame(() => {
        instance.setViewport(
          {
            x,
            y,
            zoom: Math.min(1.6, Math.max(0.16, zoom)),
          },
          { duration: 0 },
        );
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const handleFlowInit = useCallback((instance: ReactFlowInstance) => {
    setFlowInstance(instance);
    restoreStoredViewport(instance);
  }, [restoreStoredViewport]);

  const handleMoveEnd = useCallback((_event: MouseEvent | TouchEvent | null, viewport: Viewport) => {
    userMovedViewportRef.current = true;
    try {
      window.localStorage.setItem(GRAPH_VIEWPORT_STORAGE_KEY, JSON.stringify(viewport));
    } catch {
      // Viewport persistence is a convenience; graph interaction should never fail because of storage.
    }
  }, []);

  useEffect(() => {
    if (!flowInstance || isLoading || !defaultSelectedId) return;
    if (restoredViewportRef.current || userMovedViewportRef.current) return;

    const focusTimer = window.setTimeout(() => {
      flowInstance.fitView({ nodes: defaultFocusNodes, padding: 0.7, duration: 350, maxZoom: 0.92 });
    }, 120);

    return () => window.clearTimeout(focusTimer);
  }, [defaultFocusNodes, defaultSelectedId, flowInstance, isLoading]);

  const focusCurrentNode = () => {
    if (!defaultSelectedId) return;
    setSelectedId(defaultSelectedId);
    window.requestAnimationFrame(() => {
      flowInstance?.fitView({ nodes: defaultFocusNodes, padding: 0.7, duration: 450, maxZoom: 0.92 });
    });
  };

  const openSofiForNode = (node: KnowledgeGraphNodeData) => {
    const existingConversation = listSofiConversations<GraphSofiMessage>({
      surface: 'skill_graph',
      studentId: userId,
    }).find((conversation) => conversation.sourceRef?.id === node.id);

    setSofiNode(node);
    setSofiSessionId(existingConversation?.id || null);
    setSofiMessages(
      existingConversation?.messages?.length
        ? existingConversation.messages
        : [
            {
              id: `ai-node-${node.id}`,
              sender: 'ai',
              text: `Mình đang xem node **${node.label}**. Bạn có thể hỏi Sofi về tiền đề cần nắm, vì sao mastery đang là ${node.masteryPct}%, hoặc nên luyện gì tiếp theo.`,
            },
          ],
    );
    setSofiInputValue(
      existingConversation?.messages?.length
        ? ''
        : `Giải thích ngắn gọn node ${node.label} và cho tôi bước học tiếp theo.`,
    );
  };

  const closeSofiNode = () => {
    setSofiNode(null);
    setSofiSessionId(null);
    setSofiInputValue('');
    setIsSofiTyping(false);
    setZoomedSofiSlideUrl(null);
  };

  const persistSkillGraphSofiConversation = (
    sessionId: string,
    node: KnowledgeGraphNodeData,
    messages: GraphSofiMessage[],
    slides: unknown[] = [],
  ) => {
    if (!sessionId) return;
    upsertSofiConversation<GraphSofiMessage, unknown>({
      id: sessionId,
      title: `Skill Graph · ${node.shortLabel || node.label}`,
      surface: 'skill_graph',
      studentId: userId,
      courseId: COURSE_UUID,
      conceptId: node.id,
      sourceRef: {
        type: 'node',
        id: node.id,
        label: node.label,
      },
      messages,
      slides,
    });
  };

  const handleSubmitSofiMessage = async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || !sofiNode || isSofiTyping) return;

    const userMessage: GraphSofiMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmedText,
    };
    setSofiMessages((current) => [...current, userMessage]);
    setIsSofiTyping(true);

    try {
      const data = await streamChatRequest({
        message: `[Bối cảnh Skill Graph: học viên đang xem node "${sofiNode.label}" (${sofiNode.dayId || 'concept'}), mastery ${sofiNode.masteryPct}%, Elo ${sofiNode.elo}. Mô tả node: "${sofiNode.description || 'không có mô tả'}". Học viên hỏi:] ${trimmedText}`,
        mode: 'Explain',
        session_id: sofiSessionId || undefined,
        concept_id: UUID_PATTERN.test(sofiNode.id) ? sofiNode.id : undefined,
      });
      const nextSessionId = data.session_id || data.conversationId || sofiSessionId;
      if (nextSessionId && nextSessionId !== sofiSessionId) {
        setSofiSessionId(nextSessionId);
      }
      const { slides, citations, confidenceScore } = buildChatArtifacts(data);
      const enrichedCitations = citations.map((citation) => {
        const matched = slides.find((slide) =>
          slide.slide_number === citation.page &&
          citation.source &&
          slide.document_name.toLowerCase().includes(citation.source.toLowerCase()),
        );
        return {
          ...citation,
          image_url: matched?.image_url || null,
        };
      });

      setSofiMessages((current) => {
        const nextMessages = [
          ...current,
          {
          id: `ai-${Date.now()}`,
          sender: 'ai' as const,
          text: data.response || 'Sofi chưa tìm thấy câu trả lời đủ chắc. Bạn thử hỏi cụ thể hơn về tiền đề hoặc bài luyện nhé.',
          citations: enrichedCitations,
          slides,
          confidence_score: confidenceScore,
        },
        ];
        if (nextSessionId) {
          persistSkillGraphSofiConversation(nextSessionId, sofiNode, nextMessages, slides);
        }
        return nextMessages;
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi khi kết nối tới trợ lý AI.';
      setSofiMessages((current) => [
        ...current,
        {
          id: `ai-error-${Date.now()}`,
          sender: 'ai',
          text: `${errorMessage} Bạn thử hỏi lại hoặc quay về lộ trình học để luyện node này.`,
        },
      ]);
    } finally {
      setIsSofiTyping(false);
    }
  };

  const handleStartPracticeFromNode = (node: KnowledgeGraphNodeData) => {
    const targetSetId = node.associatedSets[0];
    const skill =
      skills.find((candidate) => candidate.id === node.id) ||
      skills.find((candidate) => (targetSetId ? candidate.associatedSets?.includes(targetSetId) : false));

    if (!skill || !targetSetId || !onStartPractice) return;
    onStartPractice(skill, targetSetId);
  };

  return (
    <div className="mx-auto flex h-full w-full max-w-[82rem] flex-col overflow-hidden px-3 pb-2 pt-0 font-be-vietnam-pro text-on-background">
      <AppTopNav
        activeDays={activeDays}
        title="Skill Graph"
        subtitle={`${knowledgeGraph.summary.total} nodes • ${knowledgeGraph.edges.length} liên kết • nguồn ${graphSourceLabel}`}
        averageElo={averageElo}
        displayName={name || username || 'Học viên EduGap'}
        eloHistoryEvents={eloHistoryEvents}
        initial={(name || username || 'N').trim().charAt(0).toUpperCase() || 'N'}
        loggedIn={loggedIn}
        mssv={mssv}
        onLogOut={logOut}
        onOpenLogin={onOpenLogin}
        onOpenProfile={onOpenProfile}
        role={role}
        selectedPersona={selectedPersona}
        setPersona={setPersona}
        streak={streak}
        xp={xp}
      />

      <main className={`grid min-h-0 flex-1 gap-3 ${isDetailCollapsed ? 'lg:grid-cols-[4.25rem_minmax(0,1fr)]' : 'lg:grid-cols-[17rem_minmax(0,1fr)]'}`}>
        <aside className="min-h-0">
          <KnowledgeGraphDetailPanel
            detail={detail}
            isCollapsed={isDetailCollapsed}
            onAskAboutConcept={openSofiForNode}
            onNavigateToCurrent={() => setActiveTab('learn')}
            onStartPractice={onStartPractice ? handleStartPracticeFromNode : undefined}
            onToggleCollapsed={toggleDetailPanel}
          />
        </aside>

        <section className="flex min-h-0 min-w-0 flex-col rounded-2xl border border-gray-border bg-white p-2 shadow-sm xl:p-3">
          <div className="mb-2 flex shrink-0 items-end justify-between gap-2 px-1">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-primary-green-dark">
                Knowledge graph
              </p>
              <h2 className="truncate font-fraunces text-lg font-black leading-tight text-on-background">
                {visibleNodes.length}/{knowledgeGraph.summary.total} nodes đang mở
              </h2>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-primary-green/20 bg-[#f8fff0] shadow-inner">
            {isLoading ? (
              <div className="flex h-full min-h-[24rem] items-center justify-center bg-surface-container-low p-6">
                <MascotLoadingBlock
                  title="Sofi đang dựng skill graph..."
                  description="Đang đồng bộ concepts, mastery và relation từ Supabase"
                  className="max-w-sm"
                  mascotClassName="scale-[0.82]"
                />
              </div>
            ) : (
              <>
                <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary-green/20 bg-white/92 px-3 text-[12px] font-black text-stone-600 shadow-sm backdrop-blur">
                  <Mouse className="h-4 w-4 text-primary-green-dark" />
                  Cuộn để zoom
                </div>
                <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
                  <ActionButton type="button" variant="white" size="sm" disabled={!defaultSelectedId || isLoading} onClick={focusCurrentNode}>
                    <LocateFixed className="h-4 w-4" />
                    Về hiện tại
                  </ActionButton>
                  <ActionButton type="button" variant="white" size="icon" disabled={isLoading} onClick={() => flowInstance?.zoomIn({ duration: 180 })} aria-label="Phóng to bản đồ">
                    <Plus className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton type="button" variant="white" size="icon" disabled={isLoading} onClick={() => flowInstance?.zoomOut({ duration: 180 })} aria-label="Thu nhỏ bản đồ">
                    <Minus className="h-4 w-4" />
                  </ActionButton>
                  <ActionButton type="button" variant="white" size="icon" disabled={isLoading} onClick={() => flowInstance?.fitView({ padding: 0.18, duration: 350 })} aria-label="Canh vừa bản đồ">
                    <Maximize2 className="h-4 w-4" />
                  </ActionButton>
                </div>
                <ReactFlow
                  nodes={flowNodes}
                  edges={flowEdges}
                  nodeTypes={nodeTypes}
                  onInit={handleFlowInit}
                  onMoveEnd={handleMoveEnd}
                  proOptions={{ hideAttribution: true }}
                  minZoom={0.16}
                  maxZoom={1.6}
                  nodesConnectable={false}
                  zoomOnScroll
                  zoomOnPinch
                  panOnDrag
                  preventScrolling
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Background color="#bfd7ad" gap={20} size={1.15} />
                </ReactFlow>
              </>
            )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {sofiNode ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeSofiNode}
              className="fixed inset-0 z-[9990] bg-stone-950"
            />
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="fixed inset-3 z-[9991] flex flex-col overflow-hidden rounded-2xl border border-primary-green/20 bg-[#fbfff4] shadow-2xl md:inset-x-auto md:left-1/2 md:top-12 md:h-[min(43rem,calc(100dvh-6rem))] md:w-[min(46rem,calc(100vw-3rem))] md:-translate-x-1/2"
              role="dialog"
              aria-modal="true"
              aria-label={`Hỏi Sofi về ${sofiNode.label}`}
            >
              <div className="flex min-h-14 shrink-0 items-center justify-between border-b border-primary-green/10 bg-white px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <SofiExpressionAvatar expression="happy" size={34} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-on-background">Sofi về {sofiNode.shortLabel || sofiNode.label}</p>
                    <p className="text-caption-tight font-bold uppercase tracking-wide text-stone-400">
                      Context từ Skill Graph
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeSofiNode}
                  className="grid h-9 w-9 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-stone-650 transition hover:bg-stone-100"
                  aria-label="Đóng pop-up Sofi"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SocraticChatBody
                messages={sofiMessages}
                isTyping={isSofiTyping}
                scrollRef={sofiScrollRef}
                inputValue={sofiInputValue}
                setInputValue={setSofiInputValue}
                onSubmit={handleSubmitSofiMessage}
                isMobile={false}
                onZoom={setZoomedSofiSlideUrl}
              />
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedSofiSlideUrl ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.82 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedSofiSlideUrl(null)}
              className="fixed inset-0 z-[10000] bg-stone-950/85"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="pointer-events-none fixed inset-4 z-[10001] flex items-center justify-center md:inset-10"
            >
              <div className="pointer-events-auto relative flex max-h-[85vh] max-w-full items-center justify-center overflow-hidden rounded-2xl border-2 border-stone-100 bg-white p-2 shadow-2xl">
                <button
                  type="button"
                  onClick={() => setZoomedSofiSlideUrl(null)}
                  className="absolute right-3 top-3 z-10 rounded-full bg-stone-900/80 p-2 text-white shadow-md transition-colors hover:bg-stone-900"
                  aria-label="Đóng slide trích dẫn"
                  title="Đóng xem lớn"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={zoomedSofiSlideUrl}
                  alt="Slide bài học được Sofi trích dẫn"
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default KnowledgeGraphPage;
