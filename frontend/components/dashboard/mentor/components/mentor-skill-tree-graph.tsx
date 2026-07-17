'use client';

import React from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

// Custom React Flow Node component
const CustomNode = ({ data }: any) => {
  const status = data.status;
  
  let borderClass = 'border-stone-300';
  let bgClass = 'bg-stone-100';
  let textClass = 'text-stone-500 font-bold';
  
  if (status === 'MASTERED') {
    borderClass = 'border-primary-green';
    bgClass = 'bg-primary-green-light/40';
    textClass = 'text-primary-green-dark font-extrabold';
  } else if (status === 'WEAK') {
    borderClass = 'border-error-red';
    bgClass = 'bg-error-red-light/60';
    textClass = 'text-error-red-dark font-extrabold';
  } else if (status === 'LEARNING') {
    borderClass = 'border-tertiary-yellow';
    bgClass = 'bg-accent-orange-light/20';
    textClass = 'text-tertiary-yellow-dark font-extrabold';
  }

  return (
    <div 
      className={`w-28 h-28 rounded-full border-4 ${borderClass} ${bgClass} hover:scale-105 active:scale-95 transition-all text-center flex flex-col items-center justify-center p-2 shadow-md relative cursor-pointer`}
      onClick={() => data.onClick?.(data.id)}
    >
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <span className={`text-[9px] uppercase leading-tight ${textClass} break-words line-clamp-2`}>
        {data.name}
      </span>
      <span className="text-[9px] font-bold font-mono text-stone-600 mt-1">
        {data.elo} Elo
      </span>
      {data.decayRisk && (
        <span className="absolute -top-1 -right-1 text-xs animate-bounce" title="Trí nhớ suy giảm!">⚠️</span>
      )}
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const nodeTypes = {
  customNode: CustomNode,
};

interface MentorSkillTreeGraphProps {
  layoutedNodes: any[];
  layoutedEdges: any[];
}

export const MentorSkillTreeGraph: React.FC<MentorSkillTreeGraphProps> = ({
  layoutedNodes,
  layoutedEdges,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="text-left flex justify-between items-start flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-accent-orange-dark uppercase tracking-wider font-serif">Sơ Đồ Tiền Đề Khái Niệm (DAG Map)</h3>
          <p className="text-xs text-stone-400 mt-0.5">Sơ đồ ràng buộc tiên quyết giữa các kỹ năng của học viên.</p>
        </div>
        <span className="text-[9px] bg-primary-green/10 text-primary-green-dark border border-primary-green/20 px-2 py-0.5 rounded font-black uppercase font-mono">Graphusion Engine active</span>
      </div>
      
      {/* React Flow Container */}
      <div style={{ width: '100%', height: '400px' }} className="border border-stone-200 rounded-2xl overflow-hidden bg-stone-50/50">
        <ReactFlow
          nodes={layoutedNodes}
          edges={layoutedEdges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={1.5}
          nodesConnectable={false}
          nodesDraggable={true}
          zoomOnScroll={false}
          preventScrolling={true}
        >
          <Background color="#ccc" gap={16} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MentorSkillTreeGraph;
