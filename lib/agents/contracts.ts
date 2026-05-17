import type { DraftPost, Topic, TopicCategory } from '@/types';

const VALID_CATEGORIES: TopicCategory[] = [
  'Agentic AI',
  'AI',
  'Quantum',
  'Robotics',
  'AR/VR',
  'IoT',
  'Biotech',
  'Space Tech',
  'Cybersecurity',
  'Green Tech',
  'Web3',
  'Semiconductors',
];

export function assertValidTopics(topics: Topic[]): Topic[] {
  if (!Array.isArray(topics) || topics.length !== 5) {
    throw new Error(
      `[AgentContract] Expected exactly 5 topics, got ${Array.isArray(topics) ? topics.length : 'non-array'}`
    );
  }

  for (const topic of topics) {
    if (!topic?.title || !topic?.description || !topic?.searchQuery) {
      throw new Error('[AgentContract] Topic missing title/description/searchQuery');
    }

    if (!VALID_CATEGORIES.includes(topic.category as TopicCategory)) {
      topic.category = 'AI';
    }

    if (topic.citations && !Array.isArray(topic.citations)) {
      throw new Error('[AgentContract] citations must be an array when provided');
    }
  }

  return topics;
}

export function assertValidDraftPost(draft: DraftPost): DraftPost {
  if (!draft?.title || !draft?.slug || !draft?.excerpt || !draft?.content) {
    throw new Error('[AgentContract] DraftPost missing required fields');
  }

  if (!Array.isArray(draft.tags) || draft.tags.length === 0) {
    throw new Error('[AgentContract] DraftPost requires at least one tag');
  }

  if (draft.content.length < 500) {
    throw new Error('[AgentContract] DraftPost content looks too short');
  }

  return draft;
}
