import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch } from '@/lib/services/search';
import type { Topic, TopicCategory, ResearchResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RESEARCH_QUERIES = [
  'agentic AI autonomous agents breakthrough news latest 2025 2026',
  'quantum computing breakthrough research applications latest 2025 2026',
  'robotics humanoid robot AI news latest 2025 2026',
  'spatial computing AR VR mixed reality new developments 2025 2026',
  'biotech genomics synthetic biology breakthrough 2025 2026',
  'space technology satellite launch commercial space news 2025 2026',
  'cybersecurity threat AI-powered attacks defense 2025 2026',
  'semiconductor chip AI hardware breakthrough 2025 2026',
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
  const prompt = `You are a tech blog editor for "Emerging Tech Nation", covering all cutting-edge and emerging technologies.

Based on these research results from today's tech news, generate exactly 5 compelling blog topic suggestions.
Pick the 5 most newsworthy, exciting stories across ANY emerging technology — do not restrict to specific domains.
Each topic should be timely, interesting to tech enthusiasts, and suitable for a 1500-2500 word blog post.

RESEARCH RESULTS:
${researchContext}

Return ONLY a valid JSON array of exactly 5 topic objects. No markdown, no explanation, just the JSON.

Each object must have exactly these fields:
- title: string (compelling blog post title, 50-80 chars)
- description: string (exactly 2 sentences describing what the post will cover)
- category: one of "Agentic AI" | "AI" | "Quantum" | "Robotics" | "AR/VR" | "IoT" | "Biotech" | "Space Tech" | "Cybersecurity" | "Green Tech" | "Web3" | "Semiconductors"
- searchQuery: string (targeted search query for deeper research on this topic)

Example:
[
  {
    "title": "How Agentic AI Is Replacing Entire Software Teams in 2025",
    "description": "Autonomous AI agents are now writing, testing, and deploying code with minimal human oversight. We explore which companies are leading this shift and what it means for developers.",
    "category": "Agentic AI",
    "searchQuery": "agentic AI software development autonomous coding agents 2025"
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
    const validCategories: TopicCategory[] = [
      'Agentic AI', 'AI', 'Quantum', 'Robotics', 'AR/VR', 'IoT',
      'Biotech', 'Space Tech', 'Cybersecurity', 'Green Tech', 'Web3', 'Semiconductors',
    ];
    if (!validCategories.includes(topic.category as TopicCategory)) {
      topic.category = 'AI'; // Fallback if Claude returns an unrecognised category
    }
  }

  return topics;
}
