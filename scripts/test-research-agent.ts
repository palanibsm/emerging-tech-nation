/**
 * Test runner for the research agent only — no DB or email side effects.
 * Usage: npx tsx scripts/test-research-agent.ts
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  console.log('[test] ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);
  console.log('[test] TAVILY_API_KEY set:', !!process.env.TAVILY_API_KEY);
  console.log('[test] Running research agent...\n');

  const { runResearchAgent } = await import('../lib/agents/research-agent');
  const topics = await runResearchAgent();

  console.log('\n[test] ✅ Topics returned:\n');
  topics.forEach((t, i) => {
    console.log(`Topic ${i + 1}: ${t.title}`);
    console.log(`  Category   : ${t.category}`);
    console.log(`  Description: ${t.description}`);
    console.log(`  SearchQuery: ${t.searchQuery}`);
    console.log();
  });
}

main().catch(err => { console.error('[test] ❌ Error:', err); process.exit(1); });
