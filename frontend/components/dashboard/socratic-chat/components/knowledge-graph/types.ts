import type { Skill } from '@/lib/quiz/types';

export type KnowledgeNodeStatus =
  | 'mastered'
  | 'learning'
  | 'weak'
  | 'not_started'
  | 'locked';

export interface KnowledgeGraphSourceSkill {
  id: string;
  code?: string;
  name: string;
  description?: string;
  dayId?: string;
  associatedSets?: string[];
  masteryScore?: number;
  status?: Skill['status'];
  elo?: number;
}

export interface KnowledgeGraphConcept {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  course_id?: string;
  parent_concept_id?: string | null;
}

export interface KnowledgeGraphRelationRow {
  id: string;
  source_concept_id: string;
  target_concept_id: string;
  relation_type?: string;
  weight?: number;
  status?: string;
}

export interface KnowledgeGraphMastery {
  elo: number;
  bkt: number;
  masteryState: string;
  weaknessFlag: boolean;
  attemptCount: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  shortLabel: string;
  description?: string;
  dayId?: string;
  associatedSets: string[];
  masteryPct: number;
  elo: number;
  status: KnowledgeNodeStatus;
  isActive: boolean;
  isDimmed: boolean;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface KnowledgeGraphSummary {
  total: number;
  mastered: number;
  learning: number;
  weak: number;
  notStarted: number;
  averageMastery: number;
}

export interface KnowledgeGraphDetail {
  node: KnowledgeGraphNode;
  prerequisites: KnowledgeGraphNode[];
  dependents: KnowledgeGraphNode[];
  relatedIds: Set<string>;
}

export interface BuildKnowledgeGraphOptions {
  activeConceptId?: string;
  activeConceptName?: string;
  storeSkills?: Skill[];
  conceptMasteries?: Record<string, KnowledgeGraphMastery>;
  graphConcepts?: KnowledgeGraphConcept[];
  relationRows?: KnowledgeGraphEdge[];
  allowFallbackRelations?: boolean;
}
