/**
 * Local runner — executes the workflow cron directly (bypasses Vercel's 10s timeout).
 * Usage: npx tsx scripts/run-cron.ts [--force]
 *
 * Loads .env.local automatically.
 * Includes retry logic for transient network errors.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Must load env vars BEFORE importing any agent/service modules
config({ path: resolve(process.cwd(), '.env.local'), override: true });

const force = process.argv.includes('--force');

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runWithRetry(
  fn: () => Promise<any>,
  maxAttempts = 3,
  delayMs = 2000
): Promise<any> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[runner] Attempt ${attempt}/${maxAttempts}`);
      return await fn();
    } catch (err) {
      lastError = err as Error;
      const isFetchError = lastError.message.includes('fetch failed');

      if (isFetchError && attempt < maxAttempts) {
        const waitMs = delayMs * attempt;
        console.warn(
          `[runner] Network error (attempt ${attempt}): ${lastError.message}`
        );
        console.log(`[runner] Retrying in ${waitMs}ms...`);
        await sleep(waitMs);
      } else if (!isFetchError) {
        throw err; // Non-transient error, fail immediately
      }
    }
  }

  throw lastError;
}

async function main() {
  console.log(`[runner] Starting workflow cron (force=${force})...`);
  console.log('[runner] ANTHROPIC_API_KEY set:', !!process.env.ANTHROPIC_API_KEY);
  console.log('[runner] SUPABASE_URL set:', !!process.env.SUPABASE_URL);
  console.log('[runner] TAVILY_API_KEY set:', !!process.env.TAVILY_API_KEY);

  // Dynamic import so env vars are definitely loaded first
  const { runWorkflowCron } = await import('../lib/workflow/state-machine');

  const result = await runWithRetry(() => runWorkflowCron(force));
  console.log('[runner] Done. Action:', result.action);
}

main().catch((err) => {
  console.error('[runner] Error:', err);
  process.exit(1);
});
