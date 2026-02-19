import type { ResearchResult } from '@/types';

const TAVILY_API_URL = 'https://api.tavily.com/search';

interface TavilySearchOptions {
  query: string;
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
}

interface TavilyApiResponse {
  results: Array<{
    title: string;
    url: string;
    content: string;
    score: number;
  }>;
  answer?: string;
}

/**
 * Searches the web via Tavily API.
 * basic depth = 1 credit, advanced = 2 credits.
 */
export async function tavilySearch(
  options: TavilySearchOptions
): Promise<ResearchResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('TAVILY_API_KEY is not set');

  const response = await fetch(TAVILY_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      query: options.query,
      max_results: options.maxResults ?? 5,
      search_depth: options.searchDepth ?? 'basic',
      include_answer: options.includeAnswer ?? false,
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Tavily API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as TavilyApiResponse;

  return data.results.map((r) => ({
    title: r.title,
    url: r.url,
    content: r.content,
    score: r.score,
  }));
}

/**
 * Runs multiple Tavily searches in parallel and deduplicates by URL.
 */
export async function parallelSearch(
  queries: string[],
  options?: Omit<TavilySearchOptions, 'query'>
): Promise<ResearchResult[]> {
  const results = await Promise.allSettled(
    queries.map((query) => tavilySearch({ query, ...options }))
  );

  const allResults: ResearchResult[] = [];
  const seenUrls = new Set<string>();

  for (const result of results) {
    if (result.status === 'fulfilled') {
      for (const item of result.value) {
        if (!seenUrls.has(item.url)) {
          seenUrls.add(item.url);
          allResults.push(item);
        }
      }
    }
  }

  return allResults.sort((a, b) => b.score - a.score);
}
