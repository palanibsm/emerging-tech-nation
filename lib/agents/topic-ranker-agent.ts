import { callClaude } from '@/lib/services/openrouter';
import type { Topic } from '@/types';
import { assertValidTopics } from '@/lib/agents/contracts';

export const TOPIC_RANKER_AGENT_PROMPT_VERSION = 'v1';
export const TOPIC_RANKER_AGENT_PROMPT_TEMPLATE_SIGNATURE =
  'topic-ranker-agent:v1:reorder-5-topics-by-enterprise-impact';

export async function runTopicRankerAgent(topics: Topic[]): Promise<Topic[]> {
  if (!Array.isArray(topics) || topics.length !== 5) {
    return assertValidTopics(topics);
  }

  const prompt = `You are a senior editorial strategist for an enterprise technology publication.

Re-rank these 5 candidate topics by likely reader impact and relevance for enterprise decision makers (CIO/CISO/CTO, architecture, risk, compliance, security, governance).

Return ONLY a JSON array of the same 5 topic objects in new ranked order (best first).
Do not add or remove fields. Do not invent new topics.

TOPICS:
${JSON.stringify(topics, null, 2)}`;

  const message = await callClaude({
    model: 'claude-sonnet-4',
    max_tokens: 1800,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].text;
  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('[TopicRankerAgent] Claude did not return a valid JSON array');
  }

  const ranked = JSON.parse(jsonMatch[0]) as Topic[];
  return assertValidTopics(ranked);
}
