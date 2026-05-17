import { NextRequest, NextResponse } from 'next/server';
import { runWorkflowOrchestrator } from '@/lib/orchestrator/workflow-orchestrator';

export const maxDuration = 300;

/**
 * Workflow cron handler — triggered hourly by GitHub Actions.
 * Security: Requires Authorization: Bearer <CRON_SECRET>
 * ?force=true — bypasses Monday/9am schedule check for manual testing
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const force = request.nextUrl.searchParams.get('force') === 'true';

  try {
    const result = await runWorkflowOrchestrator(force);

    return NextResponse.json({
      success: true,
      action: result.action,
      attempts: result.attempts,
      duration_ms: result.duration_ms,
      forced: result.forced,
      started_at: result.started_at,
      finished_at: result.finished_at,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CronRoute] Workflow cron failed:', error);

    return NextResponse.json(
      {
        error: 'Workflow cron failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
