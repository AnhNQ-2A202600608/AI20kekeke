import React from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { AlertTriangle, CheckCircle2, LockKeyhole, Zap } from 'lucide-react';
import type { KnowledgeGraphNode as KnowledgeGraphNodeData } from './types';

type KnowledgeGraphNodeProps = NodeProps & {
  data: KnowledgeGraphNodeData & {
    isSelected?: boolean;
    isRelated?: boolean;
    hasSelection?: boolean;
    onSelect?: (id: string) => void;
  };
};

const statusMeta = {
  mastered: {
    icon: CheckCircle2,
    border: 'border-primary-green',
    text: 'text-primary-green-dark',
    bg: 'bg-[#e6ffd6]',
    label: 'Mastered',
    ring: '#58cc02',
  },
  learning: {
    icon: Zap,
    border: 'border-tertiary-yellow-dark/70',
    text: 'text-stone-800',
    bg: 'bg-[#fff4b8]',
    label: 'Learning',
    ring: '#facc15',
  },
  weak: {
    icon: AlertTriangle,
    border: 'border-error-red/70',
    text: 'text-error-red-dark',
    bg: 'bg-[#ffe0d6]',
    label: 'Weak',
    ring: '#f97316',
  },
  not_started: {
    icon: LockKeyhole,
    border: 'border-stone-400',
    text: 'text-stone-600',
    bg: 'bg-white',
    label: 'Not started',
    ring: '#78716c',
  },
  locked: {
    icon: LockKeyhole,
    border: 'border-dashed border-stone-300',
    text: 'text-stone-500',
    bg: 'bg-stone-100',
    label: 'Locked',
    ring: '#a8a29e',
  },
};

export const KnowledgeGraphNode: React.FC<KnowledgeGraphNodeProps> = ({ data }) => {
  const meta = statusMeta[data.status];
  const Icon = meta.icon;
  const progress = Math.max(0, Math.min(100, data.masteryPct));
  const isMuted = data.hasSelection && !data.isSelected && !data.isRelated;
  const opacity = isMuted ? 'opacity-60' : data.isDimmed ? 'opacity-85' : 'opacity-100';

  return (
    <button
      type="button"
      onClick={() => data.onSelect?.(data.id)}
      className={`relative flex h-[112px] w-[112px] cursor-pointer items-center justify-center rounded-full text-center transition-all hover:scale-[1.04] hover:opacity-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-green ${opacity}`}
      aria-label={`Chọn concept ${data.label}`}
      title={data.label}
    >
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <span
        className={`absolute inset-0 rounded-full p-[4px] shadow-md ${
          data.isSelected ? 'shadow-[0_0_0_6px_rgba(88,204,2,0.22),0_12px_24px_rgba(23,30,18,0.16)]' : ''
        }`}
        style={{
          background: `conic-gradient(${meta.ring} ${Math.max(progress, data.status === 'not_started' ? 10 : 0) * 3.6}deg, #d6d3d1 0deg)`,
        }}
      />
      <span
        className={`relative flex h-[100px] w-[100px] flex-col items-center justify-center rounded-full border-2 px-3 shadow-[0_8px_18px_rgba(23,30,18,0.11)] ${meta.border} ${meta.bg}`}
      >
        <Icon className={`mb-1 h-4 w-4 ${meta.text}`} />
        <span className={`line-clamp-2 text-[12px] font-black leading-[1.2] ${meta.text}`}>
          {data.shortLabel}
        </span>
        <span className="mt-1 text-[11px] font-extrabold text-stone-500">
          {progress}% · {data.elo}
        </span>
      </span>
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </button>
  );
};
