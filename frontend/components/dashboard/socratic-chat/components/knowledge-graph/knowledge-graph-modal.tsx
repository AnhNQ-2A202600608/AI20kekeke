import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { ArrowRight, LocateFixed, Maximize2, Minus, Mouse, Network, Plus, RefreshCw, X } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { MetricPill } from '@/components/ui/learning';
import { MascotLoadingBlock } from '@/components/mascot';
import {
  getKnowledgeGraphDetail,
  getRelatedNodeIds,
} from './knowledge-graph-adapter';
import { KnowledgeGraphDetailPanel } from './knowledge-graph-detail-panel';
import { KnowledgeGraphNode } from './knowledge-graph-node';
import type {
  KnowledgeGraphEdge,
  KnowledgeGraphNode as KnowledgeGraphNodeData,
  KnowledgeGraphSummary,
} from './types';

interface KnowledgeGraphModalProps {
  isOpen: boolean;
  nodes: KnowledgeGraphNodeData[];
  edges: KnowledgeGraphEdge[];
  summary: KnowledgeGraphSummary;
  sourceLabel: string;
  isLoading?: boolean;
  onClose: () => void;
  onAskAboutConcept?: (node: KnowledgeGraphNodeData) => void;
  onNavigateToCurrent?: () => void;
  onStartPractice?: (node: KnowledgeGraphNodeData) => void;
}

const nodeTypes = {
  knowledgeNode: KnowledgeGraphNode,
};

const MAX_VISIBLE_TREE_NODES = 96;

const statusRank: Record<KnowledgeGraphNodeData['status'], number> = {
  weak: 0,
  learning: 1,
  mastered: 2,
  not_started: 3,
  locked: 4,
};

const compareGraphNodes = (a: KnowledgeGraphNodeData, b: KnowledgeGraphNodeData) => {
  const dayCompare = (a.dayId || 'zz').localeCompare(b.dayId || 'zz');
  if (dayCompare !== 0) return dayCompare;
  const statusCompare = statusRank[a.status] - statusRank[b.status];
  if (statusCompare !== 0) return statusCompare;
  return a.label.localeCompare(b.label);
};

const getPriorityNode = (nodes: KnowledgeGraphNodeData[]) =>
  nodes.find((node) => node.isActive) ||
  nodes.find((node) => node.status === 'weak') ||
  nodes.find((node) => node.status === 'learning') ||
  nodes.find((node) => node.status === 'mastered') ||
  nodes[0] ||
  null;

export const getTreeWindow = (
  nodes: KnowledgeGraphNodeData[],
  edges: KnowledgeGraphEdge[],
) => {
  if (nodes.length === 0) return { nodes: [] as KnowledgeGraphNodeData[], edgeIds: new Set<string>() };

  if (edges.length === 0) {
    return {
      nodes: [...nodes].sort(compareGraphNodes),
      edgeIds: new Set<string>(),
    };
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outgoing = new Map<string, KnowledgeGraphEdge[]>();
  const incoming = new Map<string, KnowledgeGraphEdge[]>();

  edges.forEach((edge) => {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return;
    outgoing.set(edge.source, [...(outgoing.get(edge.source) || []), edge]);
    incoming.set(edge.target, [...(incoming.get(edge.target) || []), edge]);
  });

  const priorityNode = getPriorityNode(nodes);
  const ancestorIds = new Set<string>();
  const reverseQueue = priorityNode ? [priorityNode.id] : [];

  while (reverseQueue.length > 0) {
    const currentId = reverseQueue.shift();
    if (!currentId || ancestorIds.has(currentId)) continue;
    ancestorIds.add(currentId);
    (incoming.get(currentId) || []).forEach((edge) => reverseQueue.push(edge.source));
  }

  const ancestorNodes = [...ancestorIds]
    .map((id) => nodeById.get(id))
    .filter(Boolean) as KnowledgeGraphNodeData[];

  const root =
    ancestorNodes
      .filter((node) => !(incoming.get(node.id) || []).some((edge) => ancestorIds.has(edge.source)))
      .sort(compareGraphNodes)[0] ||
    [...nodes]
      .filter((node) => (outgoing.get(node.id) || []).length > 0)
      .filter((node) => (incoming.get(node.id) || []).length === 0)
      .sort(compareGraphNodes)[0] ||
    priorityNode;

  if (!root) return { nodes: [] as KnowledgeGraphNodeData[], edgeIds: new Set<string>() };

  const visibleIds = new Set<string>();
  const treeEdgeIds = new Set<string>();
  const queue = [root.id];

  while (queue.length > 0 && visibleIds.size < MAX_VISIBLE_TREE_NODES) {
    const currentId = queue.shift();
    if (!currentId || visibleIds.has(currentId)) continue;
    visibleIds.add(currentId);

    const childEdges = [...(outgoing.get(currentId) || [])].sort((a, b) => {
      const nodeA = nodeById.get(a.target);
      const nodeB = nodeById.get(b.target);
      if (!nodeA || !nodeB) return 0;
      return compareGraphNodes(nodeA, nodeB);
    });

    childEdges.forEach((edge) => {
      if (!visibleIds.has(edge.target) && visibleIds.size + queue.length < MAX_VISIBLE_TREE_NODES) {
        treeEdgeIds.add(edge.id);
        queue.push(edge.target);
      }
    });
  }

  ancestorIds.forEach((id) => {
    if (nodeById.has(id)) visibleIds.add(id);
  });

  if (visibleIds.size < Math.min(MAX_VISIBLE_TREE_NODES, nodes.length)) {
    [...nodes].sort(compareGraphNodes).forEach((node) => {
      if (visibleIds.size < MAX_VISIBLE_TREE_NODES) {
        visibleIds.add(node.id);
      }
    });
  }

  const visibleNodes = [...visibleIds]
    .map((id) => nodeById.get(id))
    .filter(Boolean)
    .sort((a, b) => {
      if (a?.id === root.id) return -1;
      if (b?.id === root.id) return 1;
      return a && b ? compareGraphNodes(a, b) : 0;
    }) as KnowledgeGraphNodeData[];

  edges.forEach((edge) => {
    if (visibleIds.has(edge.source) && visibleIds.has(edge.target)) {
      treeEdgeIds.add(edge.id);
    }
  });

  return { nodes: visibleNodes, edgeIds: treeEdgeIds };
};

export const layoutGraph = (
  graphNodes: Node[],
  graphEdges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
) => {
  const nodeById = new Map(graphNodes.map((node) => [node.id, node]));
  const adjacency = new Map<string, Set<string>>();

  graphNodes.forEach((node) => adjacency.set(node.id, new Set()));
  graphEdges.forEach((edge) => {
    if (!nodeById.has(edge.source) || !nodeById.has(edge.target)) return;
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
  });

  const visited = new Set<string>();
  const components: string[][] = [];

  graphNodes.forEach((node) => {
    if (visited.has(node.id)) return;
    const component: string[] = [];
    const queue = [node.id];
    visited.add(node.id);

    while (queue.length > 0) {
      const currentId = queue.shift();
      if (!currentId) continue;
      component.push(currentId);
      adjacency.get(currentId)?.forEach((nextId) => {
        if (visited.has(nextId)) return;
        visited.add(nextId);
        queue.push(nextId);
      });
    }

    components.push(component);
  });

  components.sort((a, b) => b.length - a.length);

  const positioned = new Map<string, { x: number; y: number }>();
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;
  const maxRowWidth = direction === 'LR' ? 3600 : 980;
  const componentGapX = direction === 'LR' ? 96 : 120;
  const componentGapY = direction === 'LR' ? 96 : 130;

  components.forEach((component) => {
    const componentNodes = component
      .map((id) => nodeById.get(id))
      .filter(Boolean) as Node[];
    const componentEdges = graphEdges.filter((edge) => component.includes(edge.source) && component.includes(edge.target));
    const localPositions = new Map<string, { x: number; y: number }>();

    if (componentEdges.length > 0) {
      const graph = new dagre.graphlib.Graph();
      graph.setDefaultEdgeLabel(() => ({}));
      graph.setGraph({
        rankdir: direction,
        nodesep: direction === 'LR' ? 58 : 38,
        ranksep: direction === 'LR' ? 128 : 92,
      });

      componentNodes.forEach((node) => {
        graph.setNode(node.id, { width: 130, height: 130 });
      });
      componentEdges.forEach((edge) => {
        graph.setEdge(edge.source, edge.target);
      });

      dagre.layout(graph);
      componentNodes.forEach((node) => {
        const position = graph.node(node.id);
        localPositions.set(node.id, { x: position.x - 65, y: position.y - 65 });
      });
    } else {
      const columns = Math.max(1, Math.ceil(Math.sqrt(componentNodes.length)));
      componentNodes.forEach((node, index) => {
        localPositions.set(node.id, {
          x: (index % columns) * 154,
          y: Math.floor(index / columns) * 146,
        });
      });
    }

    const bounds = [...localPositions.values()].reduce(
      (acc, position) => ({
        minX: Math.min(acc.minX, position.x),
        minY: Math.min(acc.minY, position.y),
        maxX: Math.max(acc.maxX, position.x + 130),
        maxY: Math.max(acc.maxY, position.y + 130),
      }),
      { minX: Number.POSITIVE_INFINITY, minY: Number.POSITIVE_INFINITY, maxX: 0, maxY: 0 },
    );
    const width = Math.max(154, bounds.maxX - bounds.minX);
    const height = Math.max(146, bounds.maxY - bounds.minY);

    if (cursorX > 0 && cursorX + width > maxRowWidth) {
      cursorX = 0;
      cursorY += rowHeight + componentGapY;
      rowHeight = 0;
    }

    localPositions.forEach((position, id) => {
      positioned.set(id, {
        x: cursorX + position.x - bounds.minX,
        y: cursorY + position.y - bounds.minY,
      });
    });

    cursorX += width + componentGapX;
    rowHeight = Math.max(rowHeight, height);
  });

  return graphNodes.map((node) => {
    const position = positioned.get(node.id) || { x: 0, y: 0 };
    return {
      ...node,
      position,
    };
  });
};

export const KnowledgeGraphModal: React.FC<KnowledgeGraphModalProps> = ({
  isOpen,
  nodes,
  edges,
  summary,
  sourceLabel,
  isLoading = false,
  onClose,
  onAskAboutConcept,
  onNavigateToCurrent,
  onStartPractice,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flowInstance, setFlowInstance] = useState<ReactFlowInstance | null>(null);

  const treeWindow = useMemo(
    () => (isOpen ? getTreeWindow(nodes, edges) : { nodes: [], edgeIds: new Set<string>() }),
    [edges, isOpen, nodes],
  );

  const visibleNodes = treeWindow.nodes;

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter(
        (edge) =>
          treeWindow.edgeIds.has(edge.id) &&
          visibleNodeIds.has(edge.source) &&
          visibleNodeIds.has(edge.target),
      ),
    [edges, treeWindow.edgeIds, visibleNodeIds],
  );

  const defaultSelectedId = useMemo(() => {
    if (!isOpen) return null;
    const activeNode = visibleNodes.find((node) => node.isActive);
    const priorityNode =
      activeNode ||
      visibleNodes.find((node) => node.status === 'weak') ||
      visibleNodes.find((node) => node.status === 'learning') ||
      visibleNodes[0];
    return priorityNode?.id || null;
  }, [isOpen, visibleNodes]);

  const focusCurrentNode = () => {
    if (!defaultSelectedId) return;
    setSelectedId(defaultSelectedId);
    window.requestAnimationFrame(() => {
      flowInstance?.fitView({ nodes: [{ id: defaultSelectedId }], padding: 0.45, duration: 450 });
    });
  };

  const fitVisibleTree = () => {
    flowInstance?.fitView({ padding: 0.18, duration: 350 });
  };

  const effectiveSelectedId = useMemo(() => {
    if (!selectedId) return defaultSelectedId;
    return visibleNodes.some((node) => node.id === selectedId) ? selectedId : defaultSelectedId;
  }, [defaultSelectedId, visibleNodes, selectedId]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const relatedIds = useMemo(
    () => (effectiveSelectedId ? getRelatedNodeIds(effectiveSelectedId, visibleEdges) : new Set<string>()),
    [effectiveSelectedId, visibleEdges],
  );

  const detail = useMemo(
    () => (effectiveSelectedId ? getKnowledgeGraphDetail(effectiveSelectedId, visibleNodes, visibleEdges) : null),
    [effectiveSelectedId, visibleNodes, visibleEdges],
  );

  const flowEdges = useMemo<Edge[]>(() => {
    if (!isOpen) return [];
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
  }, [isOpen, visibleEdges, effectiveSelectedId]);

  const flowNodes = useMemo<Node[]>(() => {
    if (!isOpen) return [];
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

    return layoutGraph(baseNodes, flowEdges, 'TB');
  }, [isOpen, visibleNodes, relatedIds, effectiveSelectedId, flowEdges]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden bg-stone-950/60 p-2 backdrop-blur-sm md:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Bản đồ kiến thức tiên quyết"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[calc(100dvh-16px)] min-h-0 w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-gray-border bg-white shadow-xl md:h-[calc(100dvh-32px)]">
        <header className="flex shrink-0 flex-col gap-3 border-b-2 border-gray-border bg-[#F7FDEB] px-4 py-3 text-on-background md:flex-row md:items-center md:justify-between md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary-green/70 bg-primary-green text-white">
              <Network className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-primary-green-dark">Skill Tree</p>
              <h2 className="truncate font-fraunces text-xl font-black text-on-background">
                Skill Tree Map
              </h2>
              <p className="mt-0.5 text-[13px] font-bold text-stone-500">
                {isLoading
                  ? 'Đang đồng bộ graph cá nhân...'
                  : `${visibleNodes.length}/${summary.total} nodes đang mở · ${summary.mastered} mastered · nguồn ${sourceLabel}`}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton
              type="button"
              onClick={focusCurrentNode}
              disabled={isLoading || !defaultSelectedId}
              variant="white"
              size="sm"
            >
              <LocateFixed className="h-4 w-4" />
              Về hiện tại
            </ActionButton>
            {onNavigateToCurrent && (
              <ActionButton
                type="button"
                onClick={onNavigateToCurrent}
                variant="white"
                size="sm"
              >
                Lộ trình
                <ArrowRight className="h-4 w-4" />
              </ActionButton>
            )}
            <MetricPill
              label="Mastery TB"
              value={`${summary.averageMastery}%`}
              tone="green"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              className="hidden md:inline-flex"
            />
            <ActionButton
              type="button"
              onClick={onClose}
              variant="white"
              size="icon"
              aria-label="Đóng bản đồ kiến thức"
            >
              <X className="h-5 w-5" />
            </ActionButton>
          </div>
        </header>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center bg-surface-container-low p-6">
            <MascotLoadingBlock
              title="Sofi đang dựng graph cá nhân..."
              description="Đợi Supabase trả về concepts và mastery trước khi vẽ bản đồ"
              className="max-w-sm"
            />
          </div>
        ) : (
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden bg-surface-container-low p-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="relative min-h-[360px] overflow-hidden rounded-2xl border-2 border-primary-green/15 bg-[#f8fff0] shadow-inner">
            <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2">
              <div className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary-green/20 bg-white/92 px-3 text-[12px] font-black text-stone-600 shadow-sm backdrop-blur">
                <Mouse className="h-4 w-4 text-primary-green-dark" />
                Cuộn để zoom
              </div>
              <div className="pointer-events-auto inline-flex overflow-hidden rounded-xl border border-gray-border bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => flowInstance?.zoomIn({ duration: 180 })}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center border-r border-gray-border text-stone-600 transition hover:bg-primary-green/10 hover:text-primary-green-dark active:translate-y-[1px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green"
                  aria-label="Phóng to bản đồ"
                  title="Phóng to"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => flowInstance?.zoomOut({ duration: 180 })}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center border-r border-gray-border text-stone-600 transition hover:bg-primary-green/10 hover:text-primary-green-dark active:translate-y-[1px]"
                  aria-label="Thu nhỏ bản đồ"
                  title="Thu nhỏ"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={fitVisibleTree}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center text-stone-600 transition hover:bg-primary-green/10 hover:text-primary-green-dark active:translate-y-[1px]"
                  aria-label="Canh vừa bản đồ"
                  title="Canh vừa"
                >
                  <Maximize2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={nodeTypes}
              onInit={setFlowInstance}
              fitView
              fitViewOptions={{ padding: 0.18 }}
              minZoom={0.22}
              maxZoom={1.4}
              nodesConnectable={false}
              zoomOnScroll
              zoomOnPinch
              panOnDrag
              preventScrolling
              className="cursor-grab active:cursor-grabbing"
            >
              <Background color="#bfd7ad" gap={20} size={1.15} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </section>

          <div className="min-h-0">
            <KnowledgeGraphDetailPanel
              detail={detail}
              onAskAboutConcept={onAskAboutConcept}
              onNavigateToCurrent={onNavigateToCurrent}
              onStartPractice={onStartPractice}
            />
          </div>
        </div>
        )}
      </div>
    </div>
  );
};
