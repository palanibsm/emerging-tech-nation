// ─── Database Row Types ────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'published';

export type WorkflowStatus =
  | 'IDLE'
  | 'TOPICS_SENT'
  | 'TOPIC_SELECTED'
  | 'DRAFT_SENT'
  | 'APPROVED'
  | 'PUBLISHED';

export type TopicCategory =
  | 'Agentic AI'
  | 'AI'
  | 'Quantum'
  | 'Robotics'
  | 'AR/VR'
  | 'IoT'
  | 'Biotech'
  | 'Space Tech'
  | 'Cybersecurity'
  | 'Green Tech'
  | 'Web3'
  | 'Semiconductors';

export interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
  status: PostStatus;
  created_at: string;
  published_at: string | null;
}

export interface TopicCitation {
  title: string;
  url: string;
}

export interface Topic {
  title: string;
  description: string;
  category: TopicCategory;
  searchQuery: string;
  citations?: TopicCitation[];
}

export interface WorkflowRun {
  id: string;
  status: WorkflowStatus;
  topics: Topic[] | null;
  selected_topic: Topic | null;
  draft_post: DraftPost | null;
  approval_token: string | null;
  post_id: string | null;
  created_at: string;
  updated_at: string;
  topics_sent_at: string | null;
  topic_selected_at: string | null;
  draft_sent_at: string | null;
  approved_at: string | null;
  published_at: string | null;
}

// ─── Agent Output Types ────────────────────────────────────────────────────────

export interface DraftPost {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string[];
}

export interface ResearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ─── Agent Observability Types ────────────────────────────────────────────────

export type AgentName =
  | 'research-agent'
  | 'writer-agent'
  | 'publisher-agent'
  | 'topic-ranker-agent'
  | 'fact-check-agent'
  | 'editor-agent';

export type AgentRunStatus = 'started' | 'success' | 'failure';

export interface AgentRun {
  id: string;
  workflow_run_id: string | null;
  agent_name: AgentName;
  status: AgentRunStatus;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  latency_ms: number | null;
  token_cost_usd: number | null;
  created_at: string;
}

// ─── Learning Loop Types ───────────────────────────────────────────────────────

export interface TopicPerformance {
  id: string;
  workflow_run_id: string;
  topic_title: string;
  topic_category: TopicCategory;
  topic_index: number;
  was_selected: boolean;
  was_custom: boolean;
  selected_at: string | null;
  published_post_id: string | null;
  published_at: string | null;
  created_at: string;
}

export interface PromptVersion {
  id: string;
  agent_name: AgentName;
  version_label: string;
  prompt_hash: string;
  prompt_text: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}
