export interface BraintrustOverview {
  events: number;
  traces: number;
  errors: number;
  error_rate: number;
  score_events: number;
  latest_event_at?: string | null;
}

export interface BraintrustCacheMeta {
  cached: boolean;
  cache_age_seconds: number;
  last_fetched_at?: string | null;
  next_refresh_at?: string | null;
  refresh_after_seconds: number;
  data_source: string;
}

export interface BraintrustScoreStatus {
  configured: boolean;
  message: string;
  score_names: string[];
}

export interface BraintrustScoreMetric {
  name: string;
  count: number;
  average: number;
  minimum: number;
  maximum: number;
}

export interface BraintrustSpanLatency {
  name: string;
  count: number;
  p50_ms: number;
  p95_ms: number;
  max_ms: number;
}

export interface BraintrustAgentMetric {
  name: string;
  traces: number;
  events: number;
  errors: number;
  error_rate: number;
  p95_ms: number;
  tool_calls: number;
  model_calls: number;
}

export interface BraintrustTraceIssue {
  root_span_id: string;
  span: string;
  reason: string;
  created?: string | null;
  detail_link?: string | null;
}

export interface BraintrustExecutiveDashboard {
  overview: BraintrustOverview;
  last_sync_at?: string | null;
  cache: BraintrustCacheMeta;
}

export interface BraintrustAgentsDashboard {
  agents: BraintrustAgentMetric[];
  top_tools: BraintrustAgentMetric[];
}

export interface BraintrustScoresDashboard {
  status: BraintrustScoreStatus;
  metrics: BraintrustScoreMetric[];
  missing_score_traces: number;
  score_coverage: number;
}

export interface BraintrustErrorsDashboard {
  errors: BraintrustTraceIssue[];
  error_count: number;
  error_rate: number;
  error_reasons: Record<string, number>;
}

export interface BraintrustUsageDashboard {
  available: boolean;
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  estimated_cost: number;
  latency_by_span: BraintrustSpanLatency[];
}

export interface BraintrustReviewQueueDashboard {
  items: BraintrustTraceIssue[];
  reasons: Record<string, number>;
}

export interface BraintrustSummary {
  window: {
    limit: number;
    range: string;
    generated_at: string;
  };
  meta: BraintrustCacheMeta;
  overview: BraintrustOverview;
  score_status: BraintrustScoreStatus;
  latency_by_span: BraintrustSpanLatency[];
  errors: BraintrustTraceIssue[];
  problem_traces: BraintrustTraceIssue[];
  executive: BraintrustExecutiveDashboard;
  agents: BraintrustAgentsDashboard;
  scores: BraintrustScoresDashboard;
  incidents: BraintrustErrorsDashboard;
  usage: BraintrustUsageDashboard;
  review_queue: BraintrustReviewQueueDashboard;
}
