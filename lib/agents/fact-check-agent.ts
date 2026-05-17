import Anthropic from '@anthropic-ai/sdk';
import type { DraftPost, Topic } from '@/types';
import { assertValidDraftPost } from '@/lib/agents/contracts';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const FACT_CHECK_AGENT_PROMPT_VERSION = 'v1';
export const FACT_CHECK_AGENT_PROMPT_TEMPLATE_SIGNATURE =
  'fact-check-agent:v1:lightweight-safety-and-accuracy-pass';

export async function runFactCheckAgent(
  draft: DraftPost,
  topic: Topic
): Promise<DraftPost> {
  const prompt = `You are a strict fact-check and editorial QA reviewer.

Given a topic brief and a draft HTML blog post, produce a corrected version of the draft that:
- removes speculative claims presented as facts
- softens certainty where sources are unclear
- avoids unsafe legal/financial certainty claims
- preserves overall structure and intent

Return ONLY JSON with fields: title, slug, excerpt, tags, content.

TOPIC:
${JSON.stringify(topic, null, 2)}

DRAFT:
${JSON.stringify(draft, null, 2)}`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3200,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('[FactCheckAgent] Claude did not return valid JSON');
  }

  const reviewed = JSON.parse(jsonMatch[0]) as DraftPost;
  return assertValidDraftPost(reviewed);
}
