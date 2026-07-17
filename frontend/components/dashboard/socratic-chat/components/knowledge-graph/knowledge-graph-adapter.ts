import manifest from '@/public/skills-manifest.json';
import type { Skill } from '@/lib/quiz/types';
import { masteryStatusFromBkt } from '@/lib/adaptive/practice-scoring';
import type {
  BuildKnowledgeGraphOptions,
  KnowledgeGraphDetail,
  KnowledgeGraphEdge,
  KnowledgeGraphConcept,
  KnowledgeGraphMastery,
  KnowledgeGraphNode,
  KnowledgeGraphSourceSkill,
  KnowledgeGraphSummary,
  KnowledgeNodeStatus,
} from './types';

const FALLBACK_RELATIONS: KnowledgeGraphEdge[] = [
  { id: 'e-transformer-ai-problem', source: 'transformer-foundations', target: 'ai-problem-formulation' },
  { id: 'e-transformer-react', source: 'transformer-foundations', target: 'react-loop-foundations' },
  { id: 'e-transformer-context', source: 'transformer-foundations', target: 'context-engineering' },
  { id: 'e-ai-problem-data-eval', source: 'ai-problem-formulation', target: 'data-eval-strategy' },
  { id: 'e-data-eval-ai-uncertainty', source: 'data-eval-strategy', target: 'ai-uncertainty-design' },
  { id: 'e-react-agent-security', source: 'react-loop-foundations', target: 'agent-security-debug' },
  { id: 'e-context-tool-calling', source: 'context-engineering', target: 'tool-calling-execution' },
  { id: 'e-context-rag', source: 'context-engineering', target: 'rag-pipelines' },
  { id: 'e-tool-rag', source: 'tool-calling-execution', target: 'rag-pipelines' },
  { id: 'e-rag-embedding', source: 'rag-pipelines', target: 'embedding-vector-stores' },
  { id: 'e-rag-multi-agent', source: 'rag-pipelines', target: 'multi-agent-systems' },
  { id: 'e-embedding-observability', source: 'embedding-vector-stores', target: 'data-pipeline-observability' },
  { id: 'e-ai-uncertainty-roi', source: 'ai-uncertainty-design', target: 'roi-risk-management' },
  { id: 'e-roi-hackathon', source: 'roi-risk-management', target: 'hackathon-prototyping' },
  { id: 'e-week1-review', source: 'hackathon-prototyping', target: 'week1-review' },
];

const statusFromSkill = (skill?: Pick<Skill, 'status' | 'masteryScore'>): KnowledgeNodeStatus => {
  if (!skill) return 'not_started';

  if (skill.status === 'MASTERED') return 'mastered';
  if (skill.status === 'WEAK') return 'weak';
  if (skill.status === 'LEARNING') return 'learning';
  if ((skill.masteryScore || 0) > 0) return 'learning';
  return 'not_started';
};

const shortLabel = (name: string) => {
  const aliases: Record<string, string> = {
    'Transformer & LLM Foundations': 'LLM Foundations',
    'Định hình bài toán AI': 'AI Problem',
    'Đo lường & Chiến lược dữ liệu': 'Data Eval',
    'Vòng lặp ReAct Agent': 'ReAct Loop',
    'Bảo mật & Debug Agent': 'Agent Debug',
    'Context Engineering & JIT': 'Context JIT',
    'Tool Calling & Secure Execution': 'Tool Calling',
    'Thiết kế UX/UI cho sự bất định': 'Uncertainty UX',
    'Đánh giá rủi ro & Tối ưu ROI': 'ROI & Risk',
    'Embedding & Vector Stores': 'Vector Stores',
    'RAG Pipelines & Hybrid Search': 'RAG Pipeline',
    'Hackathon Prototyping & Pitching': 'Prototype',
    'Hệ thống Multi-Agent & MCP': 'Multi-Agent',
    'Data Pipeline & Observability': 'Observability',
    'Ôn tập tổng hợp Tuần 1': 'Week 1 Review',
  };

  if (aliases[name]) return aliases[name];
  const words = name.split(/\s+/).filter(Boolean);
  return words.length > 3 ? `${words[0]} ${words[1]}` : name;
};

const normalizeMastery = (skill?: Pick<Skill, 'masteryScore' | 'status'>) => {
  if (!skill) return 0;
  const raw = skill.masteryScore || 0;
  if (raw > 0) return Math.max(0, Math.min(100, Math.round(raw)));
  if (skill.status === 'MASTERED') return 92;
  if (skill.status === 'LEARNING') return 48;
  if (skill.status === 'WEAK') return 18;
  return 0;
};

const statusFromMastery = (mastery?: KnowledgeGraphMastery): KnowledgeNodeStatus => {
  if (!mastery) return 'not_started';
  const status = masteryStatusFromBkt(mastery.bkt || 0);
  if (mastery.masteryState === 'mastered' || status === 'MASTERED') return 'mastered';
  if (mastery.weaknessFlag || (mastery.attemptCount > 0 && status === 'WEAK')) return 'weak';
  if (mastery.attemptCount > 0 || mastery.bkt > 0) return 'learning';
  return 'not_started';
};

const normalizeMasteryRecord = (mastery?: KnowledgeGraphMastery) => {
  if (!mastery) return 0;
  return Math.max(0, Math.min(100, Math.round((mastery.bkt || 0) * 100)));
};

const mergeSkill = (
  manifestSkill: KnowledgeGraphSourceSkill,
  storeSkill?: Skill,
): KnowledgeGraphSourceSkill => ({
  ...manifestSkill,
  ...storeSkill,
  description: storeSkill?.description || manifestSkill.description,
  associatedSets: storeSkill?.associatedSets || manifestSkill.associatedSets || [],
});

const getDayFromCode = (code: string) => {
  const match = code.match(/(?:^|-)d(?:ay)?(\d{1,2})(?:-|$)/i) || code.match(/^day(\d{1,2})/i);
  return match ? `day${match[1]}` : undefined;
};

const isActiveNode = (
  source: KnowledgeGraphSourceSkill,
  activeConceptId?: string,
  activeConceptName?: string,
) => {
  if (!activeConceptId && !activeConceptName) return false;
  if (activeConceptId && source.id === activeConceptId) return true;
  if (activeConceptId && source.code === activeConceptId) return true;
  if (!activeConceptName) return false;

  const normalizedLabel = source.name.toLowerCase();
  return normalizedLabel.includes(activeConceptName.toLowerCase());
};

const getSkillSources = (storeSkills: Skill[]) =>
  (manifest.skills as KnowledgeGraphSourceSkill[]).map((skill) =>
    mergeSkill(skill, storeSkills.find((storeSkill) => storeSkill.id === skill.id)),
  );

const getSkillMastery = (
  source: KnowledgeGraphSourceSkill,
  conceptMasteries: Record<string, KnowledgeGraphMastery>,
) => {
  const matchingMasteries = (source.associatedSets || [])
    .map((setId) => conceptMasteries[setId])
    .filter(Boolean) as KnowledgeGraphMastery[];

  if (matchingMasteries.length === 0) {
    return undefined;
  }

  const averageBkt =
    matchingMasteries.reduce((sum, mastery) => sum + (mastery.bkt || 0), 0) / matchingMasteries.length;
  const averageElo = Math.round(
    matchingMasteries.reduce((sum, mastery) => sum + (mastery.elo || 1200), 0) / matchingMasteries.length,
  );
  const weakest = matchingMasteries.some((mastery) => mastery.weaknessFlag);
  const attempts = matchingMasteries.reduce((sum, mastery) => sum + (mastery.attemptCount || 0), 0);

  return {
    elo: averageElo,
    bkt: averageBkt,
    masteryState: masteryStatusFromBkt(averageBkt) === 'MASTERED' ? 'mastered' : averageBkt > 0 ? 'learning' : 'not_started',
    weaknessFlag: weakest,
    attemptCount: attempts,
  } satisfies KnowledgeGraphMastery;
};

const collapseConceptRelationsToSkillEdges = (
  graphConcepts: KnowledgeGraphConcept[] = [],
  relationRows: KnowledgeGraphEdge[] = [],
  skillSources: KnowledgeGraphSourceSkill[],
) => {
  const conceptIdToCode = new Map(graphConcepts.map((concept) => [concept.id, concept.code]));
  const conceptToSkillId = new Map<string, string>();

  skillSources.forEach((skill) => {
    conceptToSkillId.set(skill.id, skill.id);
    (skill.associatedSets || []).forEach((setId) => {
      conceptToSkillId.set(setId, skill.id);
    });
  });

  graphConcepts.forEach((concept) => {
    const skillId = conceptToSkillId.get(concept.code);
    if (skillId) {
      conceptToSkillId.set(concept.id, skillId);
    }
  });

  const parentEdges = graphConcepts
    .filter((concept) => concept.parent_concept_id)
    .map((concept) => ({
      id: `parent-${concept.parent_concept_id}-${concept.id}`,
      source: concept.parent_concept_id as string,
      target: concept.id,
    }));
  const rawEdges = [...parentEdges, ...relationRows];
  const edgeMap = new Map<string, KnowledgeGraphEdge>();

  rawEdges.forEach((edge) => {
    const sourceCode = conceptIdToCode.get(edge.source) || edge.source;
    const targetCode = conceptIdToCode.get(edge.target) || edge.target;
    const sourceSkill = conceptToSkillId.get(edge.source) || conceptToSkillId.get(sourceCode);
    const targetSkill = conceptToSkillId.get(edge.target) || conceptToSkillId.get(targetCode);

    if (!sourceSkill || !targetSkill || sourceSkill === targetSkill) return;
    const id = `skill-${sourceSkill}-${targetSkill}`;
    edgeMap.set(id, { id, source: sourceSkill, target: targetSkill });
  });

  return [...edgeMap.values()];
};

export const buildKnowledgeGraph = ({
  activeConceptId,
  activeConceptName,
  storeSkills = [],
  conceptMasteries = {},
  graphConcepts,
  relationRows,
  allowFallbackRelations = false,
}: BuildKnowledgeGraphOptions) => {
  const skillsById = new Map(storeSkills.map((skill) => [skill.id, skill]));
  const skillSources = getSkillSources(storeSkills);
  const hasSupabaseConcepts = Boolean(graphConcepts?.length);
  const sources = skillSources;

  const nodes: KnowledgeGraphNode[] = sources.map((skill) => {
    const storeSkill = skillsById.get(skill.id);
    const mastery = getSkillMastery(skill, conceptMasteries);
    const status = mastery ? statusFromMastery(mastery) : statusFromSkill(storeSkill || (skill as Skill));
    const masteryPct = mastery ? normalizeMasteryRecord(mastery) : normalizeMastery(storeSkill || (skill as Skill));

    return {
      id: skill.id,
      label: skill.name,
      shortLabel: shortLabel(skill.name),
      description: skill.description,
      dayId: skill.dayId,
      associatedSets: skill.associatedSets || [],
      masteryPct,
      elo: mastery?.elo || skill.elo || storeSkill?.elo || 1000,
      status,
      isActive: isActiveNode(skill, activeConceptId, activeConceptName),
      isDimmed: status === 'not_started' || status === 'locked',
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));
  const collapsedSupabaseEdges = hasSupabaseConcepts
    ? collapseConceptRelationsToSkillEdges(graphConcepts, relationRows, skillSources)
    : [];
  const sourceEdges = (() => {
    if (!allowFallbackRelations) {
      return collapsedSupabaseEdges.length > 0 ? collapsedSupabaseEdges : [];
    }

    const edgeMap = new Map<string, KnowledgeGraphEdge>();
    [...FALLBACK_RELATIONS, ...collapsedSupabaseEdges].forEach((edge) => {
      edgeMap.set(`${edge.source}->${edge.target}`, edge);
    });
    return [...edgeMap.values()];
  })();
  const edges = sourceEdges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );

  return {
    nodes,
    edges,
    summary: getGraphSummary(nodes),
  };
};

export const getGraphSummary = (nodes: KnowledgeGraphNode[]): KnowledgeGraphSummary => {
  const total = nodes.length;
  const mastered = nodes.filter((node) => node.status === 'mastered').length;
  const learning = nodes.filter((node) => node.status === 'learning').length;
  const weak = nodes.filter((node) => node.status === 'weak').length;
  const notStarted = nodes.filter((node) => node.status === 'not_started' || node.status === 'locked').length;
  const averageMastery = total
    ? Math.round(nodes.reduce((sum, node) => sum + node.masteryPct, 0) / total)
    : 0;

  return { total, mastered, learning, weak, notStarted, averageMastery };
};

export const getPrerequisiteNodes = (
  selectedId: string,
  nodes: KnowledgeGraphNode[],
  edges: KnowledgeGraphEdge[],
) => {
  const prereqIds = new Set(edges.filter((edge) => edge.target === selectedId).map((edge) => edge.source));
  return nodes.filter((node) => prereqIds.has(node.id));
};

export const getDependentNodes = (
  selectedId: string,
  nodes: KnowledgeGraphNode[],
  edges: KnowledgeGraphEdge[],
) => {
  const dependentIds = new Set(edges.filter((edge) => edge.source === selectedId).map((edge) => edge.target));
  return nodes.filter((node) => dependentIds.has(node.id));
};

export const getRelatedNodeIds = (selectedId: string, edges: KnowledgeGraphEdge[]) => {
  const relatedIds = new Set<string>([selectedId]);
  edges.forEach((edge) => {
    if (edge.source === selectedId) relatedIds.add(edge.target);
    if (edge.target === selectedId) relatedIds.add(edge.source);
  });
  return relatedIds;
};

export const getKnowledgeGraphDetail = (
  selectedId: string,
  nodes: KnowledgeGraphNode[],
  edges: KnowledgeGraphEdge[],
): KnowledgeGraphDetail | null => {
  const node = nodes.find((item) => item.id === selectedId);
  if (!node) return null;

  return {
    node,
    prerequisites: getPrerequisiteNodes(selectedId, nodes, edges),
    dependents: getDependentNodes(selectedId, nodes, edges),
    relatedIds: getRelatedNodeIds(selectedId, edges),
  };
};
