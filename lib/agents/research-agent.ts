import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch } from '@/lib/services/search';
import type { Topic, TopicCategory, ResearchResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const RESEARCH_QUERIES = [
  'site:techcrunch.com OR site:theverge.com Quantum AI agents enterprise GenAI governance latest 2025 2026',
  'site:zdnet.com OR site:wired.com Quantum cybersecurity zero trust autonomous security threat latest 2025 2026',
  'site:arstechnica.com OR site:reuters.com Quantum AI infrastructure cloud enterprise technology latest 2025 2026',
  'site:techradar.com OR site:zdnet.com Quantum banking financial services AI regulation compliance 2025 2026',
  'site:wired.com OR site:techcrunch.com Quantum enterprise architecture risk AI policy emerging technology 2025 2026',
  'site:theverge.com OR site:arstechnica.com Quantum generative AI enterprise deployment governance 2025 2026',
  'site:reuters.com OR site:techcrunch.com Quantum cybersecurity AI-powered attacks defense enterprise 2025 2026',
  'site:zdnet.com OR site:techradar.com Quantum cloud AI infrastructure semiconductor enterprise innovation 2025 2026',
];

/**
 * Research Agent: Searches for enterprise-focused tech news and curates 5 topic suggestions.
 *
 * Steps:
 * 1. Run 8 parallel Tavily searches targeting TechCrunch, The Verge, Ars Technica, ZDNet,
 *    Wired, Reuters Tech, and TechRadar — focused on enterprise IT, cybersecurity, AI governance
 * 2. Feed results to Claude as a senior technology research analyst
 * 3. Claude returns exactly 5 structured Topic objects prioritising enterprise relevance,
 *    banking/financial services impact, cybersecurity, and emerging tech strategy
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
  const prompt = `You are a senior technology research analyst specializing in AI, cybersecurity, cloud, and enterprise IT.

Your task is to analyze the latest articles (last 24 hours) from top technology news websites such as TechCrunch, The Verge, Ars Technica, ZDNet, Wired, Reuters Tech, and TechRadar.

From these sources, identify the most important, trending, and impactful developments. Focus on enterprise relevance, banking/financial services impact, cybersecurity implications, and emerging technologies. Avoid generic topics — prioritize strategic, research-worthy themes.

Guidelines:
- Each topic must be specific, actionable, and future-focused.
- Use strong keywords like "Quantum", "AI Agents", "Zero Trust", "GenAI Governance", "AI Infrastructure", "Autonomous Security", etc.
- Ensure topics reflect the latest industry shifts, not outdated trends.
- Prioritize topics relevant to enterprise architecture, risk, compliance, and innovation.

RESEARCH RESULTS:
${researchContext}

Return ONLY a valid JSON array of exactly 5 topic objects. No markdown, no explanation, just the JSON.

Each object must have exactly these fields:
- title: string (concise, insight-rich topic title with strong enterprise/security keywords, 50-80 chars)
- description: string (exactly 2 sentences on enterprise relevance, risk, or strategic impact)
- category: one of "Agentic AI" | "AI" | "Quantum" | "Robotics" | "AR/VR" | "IoT" | "Biotech" | "Space Tech" | "Cybersecurity" | "Green Tech" | "Web3" | "Semiconductors"
- searchQuery: string (targeted search query for deeper enterprise-focused research on this topic)
- citations: array of up to 3 objects with "title" and "url" fields — the actual source articles from the RESEARCH RESULTS above that most informed this topic

Example:
[
  {
    "title": "AI Agents Reshaping Enterprise IT: Risks, Governance, and the Road Ahead",
    "description": "Autonomous AI agents are being deployed across enterprise workflows, raising new questions around governance, access control, and auditability. This post examines how CIOs and security teams are responding to the agentic AI shift.",
    "category": "Agentic AI",
    "searchQuery": "AI agents enterprise governance risk compliance 2025 2026",
    "citations": [
      { "title": "How AI Agents Are Changing Enterprise Security", "url": "https://techcrunch.com/..." },
      { "title": "Governance Frameworks for Autonomous AI", "url": "https://zdnet.com/..." }
    ]
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
