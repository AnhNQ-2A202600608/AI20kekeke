import dayjs from 'dayjs';
import dagre from 'dagre';
import { Position } from '@xyflow/react';

// ==========================================
// 1. Data Interfaces
// ==========================================

export interface ConceptMastery {
  id: string;
  name: string;
  elo: number;           // 800–1600
  eloMin: number;        // lower bound BKT uncertainty
  eloMax: number;        // upper bound BKT uncertainty
  zpdThreshold: number;  // ngưỡng ZPD của concept này
  status: 'mastered' | 'zpd' | 'learning' | 'weak' | 'cold_start';
  decayRisk: boolean;    // BKT dự báo sẽ decay trong 3 ngày?
  lastPracticed: string; // ISO date
  retention: number;
  daysPassed: number;
  bktVal?: number;
  prereq?: string;
  skillId?: string;
  associatedSets?: string[];
}

export interface Session {
  id: string;
  conceptName: string;
  type: 'quiz' | 'tutor_chat';
  mode?: 'explain' | 'hint' | 'debug' | 'practice' | 'review';
  date: string;
  questionsCount: number;
  hintsUsed: number;
  hintPenaltyPct: number; // % giảm Elo do hint
  eloDelta: number;       // có thể âm
}

export interface DayActivity {
  date: string;
  eloGain: number;        // 0 = không học
  quizCount?: number;
  chatCount?: number;
  masteredConcept?: string;
}

export interface NextAction {
  rank: 1 | 2 | 3;
  type: 'quiz' | 'tutor_chat' | 'explore';
  conceptName: string;
  reason: string;
  expectedEloGain: number;
  successProbability?: number; // % ZPD target
  bktDecayWarning?: boolean;
  conceptId: string;
}

// ==========================================
// 2. Constants & Helpers for Visualizer
// ==========================================

export const CONCEPT_MAPPING: Record<
  string, 
  { skillId: string; zpd: number; prereq: string; nameFallback: string }
> = {
  llm: {
    skillId: 'transformer-foundations',
    zpd: 1150,
    prereq: 'Chủ đề nền tảng gốc. Tiên quyết của Prompt Engineering, RAG Pipeline và Design Pattern ReAct.',
    nameFallback: 'AI & LLM Foundation',
  },
  ai_problem: {
    skillId: 'ai-problem-formulation',
    zpd: 980,
    prereq: 'Chủ đề gốc. Tiên quyết của RAG Pipeline.',
    nameFallback: 'Định hình bài toán AI',
  },
  prompt: {
    skillId: 'context-engineering',
    zpd: 1200,
    prereq: 'Kế thừa từ LLM Foundation.',
    nameFallback: 'Prompt Engineering',
  },
  rag: {
    skillId: 'rag-pipelines',
    zpd: 1050,
    prereq: 'Kế thừa đồng thời từ LLM Foundation và Định hình bài toán AI. Tiên quyết của Embedding & Vector DB.',
    nameFallback: 'RAG Pipeline',
  },
  react_pattern: {
    skillId: 'react-loop-foundations',
    zpd: 920,
    prereq: 'Kế thừa từ LLM Foundation.',
    nameFallback: 'Design Pattern ReAct',
  },
  embedding: {
    skillId: 'embedding-vector-stores',
    zpd: 900,
    prereq: 'Kế thừa từ RAG Pipeline.',
    nameFallback: 'Embedding & Vector DB',
  },
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

export const getLayoutedElements = (nodes: any[], edges: any[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 140, height: 140 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 70,
        y: nodeWithPosition.y - 70,
      },
    };
  });

  return { nodes: newNodes, edges };
};

// ==========================================
// Pure Logic Calculations
// ==========================================

export const calculateComputedConcepts = (
  skills: any[],
  conceptMasteries: Record<string, any>,
  rechargedDates: Record<string, string>
): ConceptMastery[] => {
  return Object.entries(CONCEPT_MAPPING).map(([id, meta]) => {
    const skill = skills.find((s) => s.id === meta.skillId);
    const associatedSets = skill?.associatedSets || [];
    
    let sumBkt = 0;
    let countBkt = 0;
    let attempts = 0;
    
    associatedSets.forEach((code: string) => {
      const mast = conceptMasteries[code];
      if (mast) {
        sumBkt += mast.bkt;
        countBkt++;
        attempts += mast.attemptCount || 0;
      }
    });

    const eloValue = skill ? skill.elo : 1000;
    const bktVal = countBkt > 0 ? sumBkt / countBkt : (skill ? skill.masteryScore / 100 : 0.25);
    
    const uncertaintyFactor = 1 / Math.sqrt(1 + attempts);
    const delta = 120 * (1 - bktVal * 0.5) * uncertaintyFactor;
    const eloMin = Math.max(800, Math.round(eloValue - delta));
    const eloMax = Math.min(1600, Math.round(eloValue + delta));
    
    const today = dayjs().format('YYYY-MM-DD');
    const isRecharged = rechargedDates[id] === today;
    const hasBackendMastery = associatedSets.some((code: string) => Boolean(conceptMasteries[code]));
    const lastPracticed = isRecharged ? today : '';

    let retention = 1.0;
    let decayRisk = false;
    let daysPassed = 0;

    if (lastPracticed) {
      const practicedDate = dayjs(lastPracticed);
      const currentDate = dayjs();
      daysPassed = Math.max(0, currentDate.diff(practicedDate, 'day'));
      retention = Math.exp(-0.1386 * daysPassed);
      if (retention < 0.60) {
        decayRisk = true;
      }
    } else {
      retention = 0;
    }

    let status: ConceptMastery['status'] = 'cold_start';
    if (skill) {
      if (skill.status === 'MASTERED') status = 'mastered';
      else if (skill.status === 'LEARNING') {
        if (eloValue >= meta.zpd - 100 && eloValue < meta.zpd) {
          status = 'zpd';
        } else {
          status = 'learning';
        }
      } else if (skill.status === 'WEAK' || decayRisk) {
        status = 'weak';
      } else {
        status = 'cold_start';
      }
    } else {
      status = 'cold_start';
    }

    if (isRecharged && status === 'weak') {
      status = 'learning';
    }

    return {
      id,
      name: meta.nameFallback,
      elo: hasBackendMastery || skill ? eloValue : 1000,
      eloMin: hasBackendMastery || skill ? eloMin : 1000,
      eloMax: hasBackendMastery || skill ? eloMax : 1000,
      zpdThreshold: meta.zpd,
      status,
      decayRisk: skill ? decayRisk : false,
      lastPracticed,
      retention: Math.round(retention * 1000) / 10,
      daysPassed,
      bktVal: Math.round(bktVal * 100),
      prereq: meta.prereq,
      skillId: meta.skillId,
      associatedSets,
    } as ConceptMastery;
  });
};

export const calculateNextActions = (computedConcepts: ConceptMastery[]): NextAction[] => {
  const seededRand = (seed: number) => {
    const x = Math.sin(seed + 1) * 10000;
    return x - Math.floor(x);
  };

  const sortedForBandit = [...computedConcepts].sort((a, b) => {
    if (a.decayRisk && !b.decayRisk) return -1;
    if (!a.decayRisk && b.decayRisk) return 1;

    const aIsZpdOrLearning = a.status === 'zpd' || a.status === 'learning';
    const bIsZpdOrLearning = b.status === 'zpd' || b.status === 'learning';
    if (aIsZpdOrLearning && !bIsZpdOrLearning) return -1;
    if (!aIsZpdOrLearning && bIsZpdOrLearning) return 1;

    const aIsCold = a.status === 'cold_start';
    const bIsCold = b.status === 'cold_start';
    if (aIsCold && !bIsCold) return -1;
    if (!aIsCold && bIsCold) return 1;

    return 0;
  });

  return sortedForBandit.slice(0, 3).map((c, index) => {
    const rank = (index + 1) as 1 | 2 | 3;
    const r1 = seededRand(index * 3 + 1);
    const r2 = seededRand(index * 3 + 2);
    const r3 = seededRand(index * 3 + 3);

    let type: NextAction['type'] = 'quiz';
    let reason = '';
    let expectedEloGain = 0;
    let successProbability: number | undefined = 75;

    if (c.decayRisk) {
      type = 'quiz';
      reason = `BKT dự báo decay (trí nhớ giảm xuống ${c.retention}%) — cần ôn luyện ngay.`;
      expectedEloGain = 25 + Math.round(r1 * 5);
      successProbability = 70 + Math.round(r2 * 10);
    } else if (c.status === 'zpd' || c.status === 'learning') {
      type = r1 > 0.5 ? 'tutor_chat' : 'quiz';
      reason = `Concept trong ZPD (Elo hiện tại ${c.elo} vs Target ${c.zpdThreshold}) — phù hợp để bứt phá.`;
      expectedEloGain = 15 + Math.round(r2 * 10);
      successProbability = 65 + Math.round(r3 * 15);
    } else if (c.status === 'cold_start') {
      type = 'explore';
      reason = 'Cold start — Bandit ưu tiên khám phá để thu thập thêm dữ liệu năng lực.';
      expectedEloGain = 0;
      successProbability = undefined;
    } else {
      type = 'quiz';
      reason = 'Đã thành thạo — ôn luyện lại để duy trì trí nhớ đỉnh cao.';
      expectedEloGain = 5;
      successProbability = 95;
    }

    return {
      rank,
      type,
      conceptName: c.name,
      reason,
      expectedEloGain,
      successProbability,
      bktDecayWarning: c.decayRisk,
      conceptId: c.id,
    } as NextAction;
  });
};

// ==========================================
// Static Data Generators
// ==========================================

export const generateHeatmapActivities = (): DayActivity[] => {
  const activities: DayActivity[] = [];
  const startDay = dayjs().subtract(29, 'day');

  for (let i = 0; i < 30; i++) {
    const currentDate = startDay.add(i, 'day').format('YYYY-MM-DD');
    activities.push({
      date: currentDate,
      eloGain: 0,
    });
  }
  return activities;
};

export const generateLineChartData = (activities: DayActivity[] = []) => {
  const dataPoints = [];
  const source = activities.length > 0 ? activities : generateHeatmapActivities();
  let cumulativeElo = 1000;

  for (let i = 0; i < source.length; i++) {
    const label = i === 0 ? '30 ngày trước' : i === 29 ? 'Hôm nay' : '';
    cumulativeElo += source[i].eloGain;
    dataPoints.push({
      day: dayjs(source[i].date).format('DD/MM'),
      label,
      'Elo thực tế': cumulativeElo,
    });
  }
  return dataPoints;
};

export const generateForgettingChartData = () => {
  const points: any[] = [];
  for (let t = 0; t <= 15; t += 0.5) {
    points.push({
      t,
      curve: Math.round(100 * Math.exp(-0.1386 * t) * 10) / 10,
    });
  }
  return points;
};
