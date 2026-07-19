import React, { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Node,
  Edge,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { Milestone } from "@/lib/learning-path-api";
import { MilestoneNode } from "./milestone-node";

interface AdaptivePathGraphProps {
  milestones: Milestone[];
  selectedMilestoneId: string | null;
  onSelectMilestone: (milestone: Milestone) => void;
}

const nodeTypes: NodeTypes = {
  milestoneNode: MilestoneNode,
};

export function AdaptivePathGraph({
  milestones,
  selectedMilestoneId,
  onSelectMilestone,
}: AdaptivePathGraphProps) {
  const { nodes, edges } = useMemo(() => {
    if (milestones.length === 0) return { nodes: [], edges: [] };

    // 1. Tạo dagre graph để tự động layout
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 100, ranksep: 100 });
    g.setDefaultEdgeLabel(() => ({}));

    milestones.forEach((m) => {
      // Kích thước của custom milestone node (khoảng 220px rộng, 75px cao)
      g.setNode(m.id, { width: 220, height: 75 });
    });

    milestones.forEach((m) => {
      m.prerequisites.forEach((parentConceptId) => {
        if (milestones.some((item) => item.concept_id === parentConceptId)) {
          g.setEdge(parentConceptId, m.concept_id);
        } else {
          const parentNode = milestones.find(
            (item) => item.id === parentConceptId || item.concept_id === parentConceptId
          );
          if (parentNode) {
            g.setEdge(parentNode.id, m.id);
          }
        }
      });
    });

    dagre.layout(g);

    // 2. Chuyển đổi sang ReactFlow nodes & edges
    const flowNodes: Node[] = milestones.map((m) => {
      const nodeLayout = g.node(m.id);
      return {
        id: m.id,
        type: "milestoneNode",
        position: {
          x: nodeLayout ? nodeLayout.x - 110 : 0, // Căn giữa theo width
          y: nodeLayout ? nodeLayout.y - 37 : 0,  // Căn giữa theo height
        },
        data: {
          milestone: m,
          selected: m.id === selectedMilestoneId,
        },
      };
    });

    const flowEdges: Edge[] = [];
    milestones.forEach((m) => {
      m.prerequisites.forEach((parentConceptId) => {
        const parentNode = milestones.find(
          (item) => item.id === parentConceptId || item.concept_id === parentConceptId
        );
        if (parentNode) {
          flowEdges.push({
            id: `${parentNode.id}-${m.id}`,
            source: parentNode.id,
            target: m.id,
            animated: m.status === "unlocked",
            style: {
              stroke: m.status === "locked" ? "#8e9196" : "var(--accent)",
              strokeWidth: 2,
            },
          });
        }
      });
    });

    return { nodes: flowNodes, edges: flowEdges };
  }, [milestones, selectedMilestoneId]);

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    const milestone = node.data?.milestone as Milestone;
    if (milestone) {
      onSelectMilestone(milestone);
    }
  };

  return (
    <div className="adaptive-graph-canvas-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesConnectable={false}
        nodesDraggable={true}
      >
        <Controls showInteractive={false} />
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
