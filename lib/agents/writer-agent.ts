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
 * 4. Fetch a relevant image from Wikipedia and inject into the article
 */
export async function runWriterAgent(topic: Topic): Promise<DraftPost> {
  console.log(`[WriterAgent] Starting draft for: "${topic.title}"`);

  const searchQueries = [
    topic.searchQuery,
    `${topic.title} examples applications 2025`,
    `${topic.title} future impact`,
  ];

  const searchResults = await parallelSearch(searchQueries, {
    maxResults: 5,
    searchDepth: 'basic',
  });

  console.log(`[WriterAgent] Gathered ${searchResults.length} research sources`);

  const draft = await writePostWithClaude(topic, searchResults);

  console.log(`[WriterAgent] Draft complete: "${draft.title}" (/${draft.slug})`);
  return draft;
}

async function fetchWikipediaImage(query: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(query);
    const url =
      `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encoded}&gsrlimit=5&prop=pageimages&piprop=thumbnail` +
      `&pithumbsize=1200&format=json&origin=*`;

    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) return null;

    const data = (await res.json()) as {
      query?: { pages?: Record<string, { thumbnail?: { source: string } }> };
    };

    const pages = data.query?.pages ?? {};
    for (const page of Object.values(pages)) {
      if (page.thumbnail?.source) {
        // Use a wider size by bumping the width in the URL (Wikipedia thumbnail CDN supports it)
        return page.thumbnail.source.replace(/\/\d+px-/, '/1200px-');
      }
    }
    return null;
  } catch {
    return null;
  }
}

function injectImageAfterFirstParagraph(
  html: string,
  imageUrl: string,
  altText: string,
  caption: string
): string {
  const imageHtml = `<figure style="margin: 1.5rem 0; text-align: center;">
  <img src="${imageUrl}" alt="${altText}" style="max-width: 100%; border-radius: 8px;" loading="lazy" />
  <figcaption style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">${caption}</figcaption>
</figure>`;

  const firstClosingP = html.indexOf('</p>');
  if (firstClosingP === -1) return imageHtml + html;

  const insertAt = firstClosingP + '</p>'.length;
  return html.slice(0, insertAt) + '\n' + imageHtml + html.slice(insertAt);
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

Write a concise, punchy blog post based on this brief and research.

TOPIC BRIEF:
Title: ${topic.title}
Category: ${topic.category}
Description: ${topic.description}

RESEARCH MATERIAL:
${researchContext}

WRITING REQUIREMENTS:
- Length: 500-800 words (concise and focused — no padding)
- Tone: Authoritative but accessible, enthusiastic about technology
- Target audience: Tech enthusiasts, developers, and business professionals
- Structure: intro paragraph, 2-3 H2 sections, conclusion
- Cite sources naturally (e.g., "According to recent research...")
- Include concrete examples, statistics, and real-world applications
- End with a forward-looking conclusion

OUTPUT: Return ONLY valid JSON with exactly these fields (no markdown wrapper):

{
  "title": "The exact final blog post title",
  "slug": "url-safe-kebab-case-slug",
  "excerpt": "2-3 sentence summary for SEO and previews",
  "tags": ["tag1", "tag2", "tag3"],
  "imageSearchQuery": "2-4 word Wikipedia image search query relevant to the topic",
  "imageCaption": "Short descriptive caption for the article image (max 12 words)",
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
    max_tokens: 3000,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText =
    message.content[0].type === 'text' ? message.content[0].text : '';

  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('[WriterAgent] Claude did not return a valid JSON object');
  }

  const raw = JSON.parse(jsonMatch[0]) as DraftPost & {
    imageSearchQuery?: string;
    imageCaption?: string;
  };

  if (!raw.title || !raw.slug || !raw.content || !raw.excerpt || !raw.tags) {
    throw new Error('[WriterAgent] Draft is missing required fields');
  }

  raw.slug = slugify(raw.slug || raw.title);

  if (!Array.isArray(raw.tags) || raw.tags.length === 0) {
    raw.tags = [topic.category.toLowerCase().replace('/', '-')];
  }

  // Fetch a relevant Wikipedia image and inject it into the article
  const imageQuery = raw.imageSearchQuery ?? topic.title;
  const imageCaption = raw.imageCaption ?? topic.title;
  const imageUrl = await fetchWikipediaImage(imageQuery);

  if (imageUrl) {
    console.log(`[WriterAgent] Injecting image: ${imageUrl}`);
    raw.content = injectImageAfterFirstParagraph(
      raw.content,
      imageUrl,
      imageQuery,
      imageCaption
    );
  } else {
    console.warn('[WriterAgent] No Wikipedia image found, skipping image injection');
  }

  const draft: DraftPost = {
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt,
    tags: raw.tags,
    content: raw.content,
  };

  return draft;
}
