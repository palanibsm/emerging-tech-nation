import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch } from '@/lib/services/search';
import { slugify } from '@/lib/utils/slugify';
import type { Topic, DraftPost, ResearchResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Writer Agent: Takes a selected topic and produces a full blog post draft.
 *
 * Steps:
 * 1. Run 4 targeted Tavily searches on the topic
 * 2. Feed all research to Claude claude-sonnet-4-6
 * 3. Claude returns structured JSON with full HTML content
 */
export async function runWriterAgent(topic: Topic): Promise<DraftPost> {
  console.log(`[WriterAgent] Starting draft for: "${topic.title}"`);

  const searchQueries = [
    topic.searchQuery,
    `${topic.title} technical deep dive explained`,
    `${topic.title} real world examples case studies 2025`,
    `${topic.title} future implications industry impact`,
  ];

  const searchResults = await parallelSearch(searchQueries, {
    maxResults: 7,
    searchDepth: 'advanced',
  });

  console.log(`[WriterAgent] Gathered ${searchResults.length} research sources`);

  const draft = await writePostWithClaude(topic, searchResults);

  console.log(`[WriterAgent] Draft complete: "${draft.title}" (/${draft.slug})`);
  return draft;
}

async function writePostWithClaude(
  topic: Topic,
  research: ResearchResult[]
): Promise<DraftPost> {
  const researchContext = research
    .slice(0, 15)
    .map(
      (r, i) => `[Source ${i + 1}: ${r.title}]
URL: ${r.url}
${r.content.slice(0, 1200)}`
    )
    .join('\n\n---\n\n');

  const prompt = `You are a senior technology writer for "Emerging Tech Nation", a respected tech blog covering AI, IoT, and AR/VR.

Write a comprehensive, engaging blog post based on this brief and research.

TOPIC BRIEF:
Title: ${topic.title}
Category: ${topic.category}
Description: ${topic.description}

RESEARCH MATERIAL:
${researchContext}

WRITING REQUIREMENTS:
- Length: 1500-2500 words
- Tone: Authoritative but accessible, enthusiastic about technology
- Target audience: Tech enthusiasts, developers, and business professionals
- Structure: intro paragraph, 4-6 H2 sections, conclusion
- Cite sources naturally (e.g., "According to recent research...")
- Include concrete examples, statistics, and real-world applications
- End with a forward-looking conclusion

OUTPUT: Return ONLY valid JSON with exactly these fields (no markdown wrapper):

{
  "title": "The exact final blog post title",
  "slug": "url-safe-kebab-case-slug",
  "excerpt": "2-3 sentence summary for SEO and previews",
  "tags": ["tag1", "tag2", "tag3"],
  "content": "<HTML content here>"
}

CONTENT FIELD REQUIREMENTS:
- Valid HTML only (not markdown)
- Use <h2> for main sections, <h3> for subsections
- Use <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis
- Wrap each H2 section in <section> tags
- Do NOT include <html>, <head>, <body>, or <article> tags
- Start directly with the intro <p> tag

TAGS: 3-5 lowercase tags with hyphens (e.g. "artificial-intelligence", "machine-learning")
SLUG: lowercase, hyphens only, 3-8 words max`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('[WriterAgent] Claude did not return a valid JSON object');
  }

  const draft = JSON.parse(jsonMatch[0]) as DraftPost;

  if (!draft.title || !draft.slug || !draft.content || !draft.excerpt || !draft.tags) {
    throw new Error('[WriterAgent] Draft is missing required fields');
  }

  draft.slug = slugify(draft.slug || draft.title);

  if (!Array.isArray(draft.tags) || draft.tags.length === 0) {
    draft.tags = [topic.category.toLowerCase().replace('/', '-')];
  }

  return draft;
}
