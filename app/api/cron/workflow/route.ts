import { NextRequest, NextResponse } from 'next/server';
import { runWorkflowCron } from '@/lib/workflow/state-machine';

// Requires Vercel Pro for 60s timeout. On Hobby tier, set to 10 and split
// long-running agent calls across multiple cron ticks if needed.
export const maxDuration = 60;

/**
 * Vercel Cron Job Handler — runs every hour at :00
 * Schedule defined in vercel.json: "0 * * * *"
 *
 * Security: Vercel sends CRON_SECRET as Authorization: Bearer <secret>
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runWorkflowCron();

    return NextResponse.json({
      success: true,
      action: result.action,
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
