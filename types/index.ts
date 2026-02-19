// ─── Database Row Types ────────────────────────────────────────────────────────

export type PostStatus = 'draft' | 'published';

export type WorkflowStatus =
  | 'IDLE'
  | 'TOPICS_SENT'
  | 'TOPIC_SELECTED'
  | 'DRAFT_SENT'
  | 'APPROVED'
  | 'PUBLISHED';

export type TopicCategory = 'AI' | 'IoT' | 'AR/VR';

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

export interface Topic {
  title: string;
  description: string;
  category: TopicCategory;
  searchQuery: string;
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
