import quizManifest from '@/public/quiz-manifest.json';
import { TOPICS } from './constants';
import type { ProgramConcept, ProgramDay, ProgramPhase, ProgramPhaseId, ProgramTrack, QuestionSet } from './types';

type ManifestSet = Omit<QuestionSet, 'questions'>;

const manifestSets = (quizManifest.sets as ManifestSet[]) || [];

export const PROGRAM_PHASES: ProgramPhase[] = [
  {
    id: 'foundation',
    title: 'Giai đoạn 1: Nền tảng AI',
    shortTitle: 'Nền tảng',
    dayRange: 'Ngày 1-7',
    description: 'Xây nền LLM, prompt, ReAct, sản phẩm AI và dữ liệu vector.',
  },
  {
    id: 'systems',
    title: 'Giai đoạn 2: Xây hệ thống AI',
    shortTitle: 'Hệ thống',
    dayRange: 'Ngày 8-15',
    description: 'Thiết kế RAG, multi-agent, data pipeline, eval và production.',
  },
  {
    id: 'midterm',
    title: 'Ôn tập giữa kỳ',
    shortTitle: 'Giữa kỳ',
    dayRange: 'Sau ngày 15',
    description: 'Tổng ôn kiến thức chung và ba track trước bài đánh giá giữa kỳ.',
  },
  {
    id: 'specialization',
    title: 'Giai đoạn 3: Chuyên sâu theo track',
    shortTitle: 'Track',
    dayRange: 'Ngày 16-28',
    description: 'Chọn một nhánh chuyên sâu sau nền tảng chung.',
  },
];

export const PROGRAM_TRACKS: ProgramTrack[] = [
  {
    id: 'agent-builder',
    title: 'AI Agent Builder',
    shortTitle: 'Agent',
    description: 'Tập trung xây workflow, tool use, memory, eval và vận hành agent.',
  },
  {
    id: 'ai-product',
    title: 'AI Product Builder',
    shortTitle: 'Product',
    description: 'Tập trung discovery, UX bất định, đo lường giá trị và rollout sản phẩm AI.',
  },
  {
    id: 'rag-data',
    title: 'RAG & Data Engineer',
    shortTitle: 'RAG/Data',
    description: 'Tập trung retrieval, ingestion, dữ liệu, observability và chất lượng tri thức.',
  },
];

const dayTitles: Record<number, { title: string; outcome: string }> = {
  13: {
    title: 'Monitoring, Logging & Observability',
    outcome: 'Biết cách thiết lập logging có cấu trúc, tracing cuộc gọi LLM và cảnh báo dựa trên SLO.',
  },
  14: {
    title: 'AI Evaluation & Benchmarking',
    outcome: 'Biết dựng bộ kiểm thử tự động, chuẩn bị Golden Dataset và đo lường chất lượng AI một cách khoa học.',
  },
  15: {
    title: 'Real-World Deployment & Operating Cost',
    outcome: 'Tối ước hóa chi phí API, quản lý tài nguyên tính toán đám mây và đưa Agent lên production.',
  },
};

const trackDayTitles: Record<string, string[]> = {
  'agent-builder': [
    'Advanced Agent Architectures',
    'Agent Memory Systems',
    'Production RAG',
    'GraphRAG & Knowledge Graphs',
    'Multi-Agent Systems (Advanced)',
    'Fine-tuning LLMs (LoRA/QLoRA)',
    'DPO, ORPO & Alignment',
    'Agent Evaluation',
    'LangGraph & Agentic Orchestration',
    'Circuit Breakers, Caching & Agent Reliability',
    'Model Context Protocol (MCP)',
    'Human-in-the-Loop UX',
    'Real-World System Architecture',
  ],
  'ai-product': [
    'AI Product Strategy & Market Analysis',
    'PRD & Product-Market Fit',
    'AI Financial Modeling & ROI',
    'Investor Buy-in & Pitch',
    'Product Roadmap & Execution',
    'AI Governance & Risk',
    'AI Compliance',
    'Change Management & AI Adoption',
    'Responsible AI',
    'Launch Readiness',
    'Fundraising',
    'AI Team & Performance',
    'AI Pricing & GTM',
  ],
  'rag-data': [
    'Cloud Infrastructure for AI',
    'AI Data Engineering Foundations',
    'Data Lakehouse Architecture',
    'Vector Store & Feature Store',
    'Model Serving & Inference Optimization',
    'CI/CD for AI Systems',
    'LLMOps & Prompt Versioning',
    'Monitoring & Observability Stack',
    'Data Governance & Security',
    'GPU FinOps & Cost Optimization',
    'MCP & A2A Infrastructure',
    'Data Observability & Lineage',
    'Platform Engineering & Documentation',
  ],
};

const setsByParentId = manifestSets.reduce<Record<string, ManifestSet[]>>((acc, set) => {
  const parentId = set.parent_id || 'day1';
  acc[parentId] = [...(acc[parentId] || []), set];
  return acc;
}, {});

const normalizeConceptTitle = (title: string) => {
  const [, detail] = title.split(':');
  return (detail || title).trim();
};

const makeConceptsFromSets = (dayId: string, fallbackTitle: string): ProgramConcept[] => {
  const daySets = setsByParentId[dayId] || [];
  if (daySets.length === 0) {
    return [
      {
        id: `${dayId}-preview`,
        title: fallbackTitle,
        description: 'Nội dung luyện tập cho ngày này đang được chuẩn bị.',
        setIds: [],
      },
    ];
  }

  return daySets.map((set) => ({
    id: set.id,
    title: normalizeConceptTitle(set.title),
    description: set.description,
    setIds: [set.id],
  }));
};

const getPhaseId = (dayNumber: number): ProgramPhaseId => {
  if (dayNumber <= 7) return 'foundation';
  if (dayNumber <= 15) return 'systems';
  return 'specialization';
};

const commonDays: ProgramDay[] = Array.from({ length: 15 }, (_, index) => {
  const dayNumber = index + 1;
  const dayId = `day${dayNumber}`;
  const topic = TOPICS.find((item) => item.id === dayId);
  const provisional = dayTitles[dayNumber];
  const rawTitle = topic?.title.split(':')[1]?.trim() || provisional?.title || `AI Thực Chiến Day ${dayNumber}`;

  return {
    id: dayId,
    dayNumber,
    phaseId: getPhaseId(dayNumber),
    title: rawTitle,
    outcome: topic?.desc || provisional?.outcome || 'Nội dung ngày học đang được hoàn thiện.',
    guidebookDayId: dayId,
    concepts: makeConceptsFromSets(dayId, rawTitle),
  };
});

const midtermReviewDay: ProgramDay = {
  id: 'midterm-review',
  dayNumber: 15.5,
  displayLabel: 'GK',
  phaseId: 'midterm',
  title: 'Ôn tập giữa kỳ',
  outcome: 'Ôn cấu trúc đề 100 điểm: phần chung bắt buộc và ba phần chuyên sâu Business, Infrastructure, App Build.',
  concepts: makeConceptsFromSets('midterm-review', 'Ôn tập giữa kỳ'),
};

const trackDays: ProgramDay[] = PROGRAM_TRACKS.flatMap((track) =>
  Array.from({ length: 13 }, (_, index) => {
    const dayNumber = index + 16;
    const title = trackDayTitles[track.id]?.[index] || `${track.title} Day ${dayNumber}`;

    return {
      id: `day${dayNumber}-${track.id}`,
      dayNumber,
      phaseId: 'specialization',
      trackId: track.id,
      title,
      outcome: `${track.shortTitle}: ${title}. Nội dung bài luyện sẽ được gắn khi học liệu chính thức sẵn sàng.`,
      guidebookDayId: `day${dayNumber}-${track.id}`,
      concepts: makeConceptsFromSets(`day${dayNumber}-${track.id}`, title),
    };
  }),
);

export const PROGRAM_DAYS: ProgramDay[] = [...commonDays, midtermReviewDay, ...trackDays];

export const PROGRAM_DAY_COUNT = 28;
export const DEFAULT_TRACK_ID = PROGRAM_TRACKS[0].id;

export function getProgramDay(dayId: string) {
  return PROGRAM_DAYS.find((day) => day.id === dayId);
}

export function getDaysForPhase(phaseId: ProgramPhaseId, selectedTrackId = DEFAULT_TRACK_ID) {
  return PROGRAM_DAYS.filter((day) => {
    if (day.phaseId !== phaseId) return false;
    if (phaseId !== 'specialization') return true;
    return day.trackId === selectedTrackId;
  });
}

export function getConceptPracticeSets(dayId: string, conceptId: string) {
  const day = getProgramDay(dayId);
  return day?.concepts.find((concept) => concept.id === conceptId)?.setIds || [];
}

export function getPhaseForDay(day: ProgramDay) {
  return PROGRAM_PHASES.find((phase) => phase.id === day.phaseId) || PROGRAM_PHASES[0];
}
