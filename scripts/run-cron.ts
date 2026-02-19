/**
 * Local runner — executes the workflow cron directly (bypasses Vercel's 10s timeout).
 * Usage: npx tsx scripts/run-cron.ts [--force]
 *
 * Loads .env.local automatically.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Must load env vars BEFORE importing any agent/service modules
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const force = process.argv.includes('--force');

async function main() {
  console.log(`[runner] Starting workflow cron (force=${force})...`);
  console.log('[runner] ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);

  // Dynamic import so env vars are definitely loaded first
  const { runWorkflowCron } = await import('../lib/workflow/state-machine');

  const result = await runWorkflowCron(force);
  console.log('[runner] Done. Action:', result.action);
}

main().catch((err) => {
  console.error('[runner] Error:', err);
  process.exit(1);
});
