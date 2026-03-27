import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  transitionTopicSelectedToDraftSent,
  transitionApprovedToPublished,
} from '@/lib/workflow/state-machine';
import type { WorkflowRun } from '@/types';

// Allow up to 5 minutes — writer and publisher agents are long-running
export const maxDuration = 300;

/**
 * Internal endpoint — advances the workflow one step immediately.
 * Called in the background right after the owner selects a topic or approves a draft.
 * Only advances mid-cycle states (TOPIC_SELECTED, APPROVED). Never starts a new cycle.
 * Secured with CRON_SECRET so it cannot be triggered externally.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();

  try {
    // Advance TOPIC_SELECTED → DRAFT_SENT
    const { data: topicSelectedRun } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('status', 'TOPIC_SELECTED')
      .maybeSingle();

    if (topicSelectedRun) {
      await transitionTopicSelectedToDraftSent(topicSelectedRun as WorkflowRun);
      return NextResponse.json({ action: 'draft_written' });
    }

    // Advance APPROVED → PUBLISHED
    const { data: approvedRun } = await supabase
      .from('workflow_runs')
      .select('*')
      .eq('status', 'APPROVED')
      .maybeSingle();

    if (approvedRun) {
      await transitionApprovedToPublished(approvedRun as WorkflowRun);
      return NextResponse.json({ action: 'post_published' });
    }

    return NextResponse.json({ action: 'nothing_to_advance' });
  } catch (error) {
    console.error('[AdvanceRoute] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
