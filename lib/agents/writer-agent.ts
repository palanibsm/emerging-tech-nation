import Anthropic from '@anthropic-ai/sdk';
import { parallelSearch } from '@/lib/services/search';
import { slugify } from '@/lib/utils/slugify';
import type { Topic, DraftPost, ResearchResult } from '@/types';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Writer Agent: Takes a selected topic and produces a full blog post draft.
 *
 * Steps:
 * 1. Run 3 targeted Tavily searches on the topic
 * 2. Feed all research to Claude claude-sonnet-4-6
 * 3. Claude returns metadata as JSON + HTML content between delimiters (avoids JSON escaping issues)
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

OUTPUT FORMAT — return exactly two blocks:

BLOCK 1 — metadata JSON (no content field):
===META_START===
{
  "title": "The exact final blog post title",
  "slug": "url-safe-kebab-case-slug",
  "excerpt": "2-3 sentence summary for SEO and previews",
  "tags": ["tag1", "tag2", "tag3"],
  "imageSearchQuery": "2-4 word Wikipedia image search query",
  "imageCaption": "Short descriptive caption max 12 words"
}
===META_END===

BLOCK 2 — HTML content only (no JSON wrapping):
===CONTENT_START===
<HTML content here>
===CONTENT_END===

HTML REQUIREMENTS:
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

  // Extract metadata JSON
  const metaMatch = responseText.match(/===META_START===\s*([\s\S]*?)\s*===META_END===/);
  if (!metaMatch) {
    throw new Error('[WriterAgent] Claude did not return a META block');
  }

  // Extract HTML content
  const contentMatch = responseText.match(/===CONTENT_START===\s*([\s\S]*?)\s*===CONTENT_END===/);
  if (!contentMatch) {
    throw new Error('[WriterAgent] Claude did not return a CONTENT block');
  }

  const meta = JSON.parse(metaMatch[1]) as {
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    imageSearchQuery?: string;
    imageCaption?: string;
  };

  if (!meta.title || !meta.slug || !meta.excerpt || !meta.tags) {
    throw new Error('[WriterAgent] Metadata is missing required fields');
  }

  const htmlContent = contentMatch[1].trim();
  if (!htmlContent) {
    throw new Error('[WriterAgent] HTML content block is empty');
  }

  const slug = slugify(meta.slug || meta.title);
  const tags = Array.isArray(meta.tags) && meta.tags.length > 0
    ? meta.tags
    : [topic.category.toLowerCase().replace('/', '-')];

  // Fetch a relevant Wikipedia image and inject it into the article
  const imageQuery = meta.imageSearchQuery ?? topic.title;
  const imageCaption = meta.imageCaption ?? topic.title;
  const imageUrl = await fetchWikipediaImage(imageQuery);

  let content = htmlContent;
  if (imageUrl) {
    console.log(`[WriterAgent] Injecting image: ${imageUrl}`);
    content = injectImageAfterFirstParagraph(content, imageUrl, imageQuery, imageCaption);
  } else {
    console.warn('[WriterAgent] No Wikipedia image found, skipping image injection');
  }

  return { title: meta.title, slug, excerpt: meta.excerpt, tags, content };
}
