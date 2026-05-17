import { runWorkflowCron } from '@/lib/workflow/state-machine';

export interface WorkflowOrchestratorResult {
  action: string;
  attempts: number;
  duration_ms: number;
  started_at: string;
  finished_at: string;
  forced: boolean;
}

interface OrchestratorOptions {
  maxAttempts?: number;
  timeoutMs?: number;
  baseRetryDelayMs?: number;
}

const DEFAULT_OPTIONS: Required<OrchestratorOptions> = {
  maxAttempts: 2,
  timeoutMs: 120_000,
  baseRetryDelayMs: 1_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : '';

  // Retry transient infra/provider errors only.
  return (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('fetch failed') ||
    message.includes('network') ||
    message.includes('rate limit') ||
    message.includes('429') ||
    message.includes('5xx')
  );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutHandle: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`[Orchestrator] Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

/**
 * Phase 5 orchestrator entrypoint.
 * Adds timeout + bounded retry around workflow cron transitions and returns
 * structured run metadata for observability.
 */
export async function runWorkflowOrchestrator(
  force = false,
  options: OrchestratorOptions = {}
): Promise<WorkflowOrchestratorResult> {
  const cfg = { ...DEFAULT_OPTIONS, ...options };

  const startedAt = new Date();
  let attempts = 0;
  let lastError: unknown;

  while (attempts < cfg.maxAttempts) {
    attempts += 1;

    try {
      console.log(`[Orchestrator] Attempt ${attempts}/${cfg.maxAttempts} (force=${force})`);

      const result = (await withTimeout(
        runWorkflowCron(force),
        cfg.timeoutMs
      )) as { action: string };

      const finishedAt = new Date();
      return {
        action: result.action,
        attempts,
        duration_ms: finishedAt.getTime() - startedAt.getTime(),
        started_at: startedAt.toISOString(),
        finished_at: finishedAt.toISOString(),
        forced: force,
      };
    } catch (error) {
      lastError = error;

      const canRetry = attempts < cfg.maxAttempts && isRetryableError(error);
      const message = error instanceof Error ? error.message : String(error);

      console.error(`[Orchestrator] Attempt ${attempts} failed: ${message}`);

      if (!canRetry) break;

      const backoffMs = cfg.baseRetryDelayMs * attempts;
      console.log(`[Orchestrator] Retrying in ${backoffMs}ms...`);
      await sleep(backoffMs);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('[Orchestrator] Workflow run failed after retries');
}
