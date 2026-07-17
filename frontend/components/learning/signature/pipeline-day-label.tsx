import { Box, BrainCircuit, FileText, Gauge, GitBranch, Hash, Layers3, MessagesSquare, Radar, SearchCheck, ShieldCheck, Sparkles, Waypoints, Zap } from 'lucide-react';
import type { ProgramDay } from '@/lib/quiz/types';
import { cn } from '@/lib/utils';

type PipelineStep = {
  label: string;
  Icon: typeof FileText;
};

const foundationSteps: Record<number, PipelineStep> = {
  1: { label: 'Text -> Tokens', Icon: FileText },
  2: { label: 'Problem Fit', Icon: SearchCheck },
  3: { label: 'ReAct Loop', Icon: Waypoints },
  4: { label: 'Tools', Icon: Box },
  5: { label: 'Uncertainty', Icon: Radar },
  6: { label: 'Prototype', Icon: Sparkles },
  7: { label: 'Evaluation', Icon: Gauge },
  8: { label: 'Retrieval', Icon: SearchCheck },
  9: { label: 'Memory', Icon: BrainCircuit },
  10: { label: 'Pipeline', Icon: GitBranch },
  11: { label: 'Agents', Icon: MessagesSquare },
  12: { label: 'Vectors', Icon: Hash },
  13: { label: 'Eval Harness', Icon: Gauge },
  14: { label: 'Guardrails', Icon: ShieldCheck },
  15: { label: 'Observability', Icon: Radar },
  16: { label: 'Architecture', Icon: Layers3 },
};

export function inferPipelineStep(day: ProgramDay): PipelineStep {
  if (day.phaseId === 'midterm') return { label: 'Review', Icon: Gauge };

  const fixed = foundationSteps[day.dayNumber];
  if (fixed) return fixed;

  if (day.trackId === 'agent-builder') return { label: 'Agent Flow', Icon: Waypoints };
  if (day.trackId === 'rag-data') return { label: 'RAG/Data', Icon: SearchCheck };
  if (day.trackId === 'ai-product') return { label: 'Product Loop', Icon: Radar };
  return { label: 'Build Step', Icon: Zap };
}

interface PipelineDayLabelProps {
  day: ProgramDay;
  selected?: boolean;
  compact?: boolean;
  className?: string;
}

export function PipelineDayLabel({ day, selected = false, compact = false, className }: PipelineDayLabelProps) {
  const { label, Icon } = inferPipelineStep(day);

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black uppercase leading-none',
        selected
          ? 'border-primary-green/30 bg-white text-primary-green-dark'
          : 'border-gray-border bg-surface-container-low text-stone-500',
        compact && 'max-w-full px-1.5 text-[8px]',
        className,
      )}
      title={label}
    >
      <Icon className="h-3 w-3 shrink-0 stroke-[3]" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </span>
  );
}
