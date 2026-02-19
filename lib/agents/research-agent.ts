import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch } from '@/lib/services/search';
import type { Topic, ResearchResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RESEARCH_QUERIES = [
  'trending AI artificial intelligence news breakthroughs 2025',
  'IoT Internet of Things innovations smart devices 2025',
  'AR VR augmented reality virtual reality technology 2025',
  'large language model generative AI applications 2025',
  'edge computing robotics emerging technology 2025',
];

/**
 * Research Agent: Searches for trending tech news and curates 5 topic suggestions.
 *
 * Steps:
 * 1. Run 5 parallel Tavily searches (AI, IoT, AR/VR space)
 * 2. Feed results to Claude claude-sonnet-4-6
 * 3. Claude returns exactly 5 structured Topic objects
 */
export async function runResearchAgent(): Promise<Topic[]> {
  console.log('[ResearchAgent] Starting research phase...');

  const searchResults = await parallelSearch(RESEARCH_QUERIES, {
    maxResults: 5,
    searchDepth: 'basic',
  });

  if (searchResults.length === 0) {
    throw new Error('[ResearchAgent] No search results returned from Tavily');
  }

  console.log(`[ResearchAgent] Gathered ${searchResults.length} search results`);

  const researchContext = formatResearchContext(searchResults);
  const topics = await curateTopicsWithClaude(researchContext);

  console.log(`[ResearchAgent] Curated ${topics.length} topics successfully`);
  return topics;
}

function formatResearchContext(results: ResearchResult[]): string {
  return results
    .slice(0, 20)
    .map(
      (r, i) => `[Source ${i + 1}]
Title: ${r.title}
URL: ${r.url}
Content: ${r.content.slice(0, 800)}`
    )
    .join('\n\n---\n\n');
}

async function curateTopicsWithClaude(researchContext: string): Promise<Topic[]> {
  const prompt = `You are a tech blog editor for "Emerging Tech Nation", covering AI, IoT, and AR/VR.

Based on these research results from today's tech news, generate exactly 5 compelling blog topic suggestions.
Each topic should be timely, interesting to tech enthusiasts, and suitable for a 1500-2500 word blog post.

RESEARCH RESULTS:
${researchContext}

Return ONLY a valid JSON array of exactly 5 topic objects. No markdown, no explanation, just the JSON.

Each object must have exactly these fields:
- title: string (compelling blog post title, 50-80 chars)
- description: string (exactly 2 sentences describing what the post will cover)
- category: "AI" | "IoT" | "AR/VR"
- searchQuery: string (targeted search query for deeper research on this topic)

Example:
[
  {
    "title": "How Claude's Latest Update Is Changing Enterprise AI",
    "description": "Anthropic's newest model brings unprecedented reasoning to business workflows. We explore five real-world applications already transforming industries from healthcare to finance.",
    "category": "AI",
    "searchQuery": "Claude AI enterprise applications 2025 business use cases"
  }
]`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = responseText.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('[ResearchAgent] Claude did not return a valid JSON array');
  }

  const topics = JSON.parse(jsonMatch[0]) as Topic[];

  if (!Array.isArray(topics) || topics.length !== 5) {
    throw new Error(
      `[ResearchAgent] Expected 5 topics, got ${Array.isArray(topics) ? topics.length : 'non-array'}`
    );
  }

  for (const topic of topics) {
    if (!topic.title || !topic.description || !topic.category || !topic.searchQuery) {
      throw new Error('[ResearchAgent] Topic missing required fields');
    }
    if (!['AI', 'IoT', 'AR/VR'].includes(topic.category)) {
      topic.category = 'AI'; // Fallback to AI if invalid category
    }
  }

  return topics;
}
