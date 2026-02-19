import { createServerClient } from '@/lib/supabase/server';
import { runResearchAgent } from '@/lib/agents/research-agent';
import { runWriterAgent } from '@/lib/agents/writer-agent';
import { runPublisherAgent } from '@/lib/agents/publisher-agent';
import {
  sendTopicsEmail,
  sendDraftEmail,
  sendPublishedConfirmationEmail,
} from '@/lib/services/email';
import { generateToken } from '@/lib/utils/tokens';
import type { WorkflowRun, Topic, DraftPost } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSupabase() {
  return createServerClient();
}

// ─── State Transitions ────────────────────────────────────────────────────────

/**
 * Checks if a new weekly research cycle should start.
 * True when: no active workflow AND 7+ days since last published post (or never).
 */
export async function shouldStartNewCycle(): Promise<boolean> {
  const supabase = getSupabase();

  const { data: activeRun } = await supabase
    .from('workflow_runs')
    .select('id')
    .not('status', 'in', '("IDLE","PUBLISHED")')
    .maybeSingle();

  if (activeRun) return false;

  const { data: lastRun } = await supabase
    .from('workflow_runs')
    .select('published_at')
    .eq('status', 'PUBLISHED')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastRun?.published_at) return true;

  const daysSince =
    (Date.now() - new Date(lastRun.published_at).getTime()) / (1000 * 60 * 60 * 24);

  return daysSince >= 7;
}

/**
 * IDLE → TOPICS_SENT
 * Runs the research agent and sends the topic selection email.
 */
export async function transitionIdleToTopicsSent(): Promise<void> {
  console.log('[Workflow] IDLE → TOPICS_SENT');
  const supabase = getSupabase();
  const token = generateToken();

  // Create the workflow run record first
  const { data: run, error: createError } = await supabase
    .from('workflow_runs')
    .insert({
      status: 'TOPICS_SENT',
      approval_token: token,
      topics_sent_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !run) {
    throw new Error(`Failed to create workflow run: ${createError?.message}`);
  }

  try {
    const topics = await runResearchAgent();

    await supabase.from('workflow_runs').update({ topics }).eq('id', run.id);

    await sendTopicsEmail(topics, token);

    console.log(`[Workflow] Topics email sent. Run ID: ${run.id}`);
  } catch (error) {
    // Clean up on failure so the unique index doesn't block a retry
    await supabase.from('workflow_runs').delete().eq('id', run.id);
    throw error;
  }
}

/**
 * TOPICS_SENT → TOPIC_SELECTED
 * Called when the owner clicks a topic link in the email.
 */
export async function transitionTopicsSentToTopicSelected(
  token: string,
  topicIndex: number
): Promise<WorkflowRun> {
  console.log(`[Workflow] TOPICS_SENT → TOPIC_SELECTED (index ${topicIndex})`);
  const supabase = getSupabase();

  const { data: run, error: findError } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('approval_token', token)
    .eq('status', 'TOPICS_SENT')
    .single();

  if (findError || !run) {
    throw new Error('Invalid token or workflow is not in TOPICS_SENT state');
  }

  const topics = run.topics as Topic[];
  if (!topics || topicIndex < 0 || topicIndex >= topics.length) {
    throw new Error(`Invalid topic index: ${topicIndex}`);
  }

  const { data: updatedRun, error: updateError } = await supabase
    .from('workflow_runs')
    .update({
      status: 'TOPIC_SELECTED',
      selected_topic: topics[topicIndex],
      topic_selected_at: new Date().toISOString(),
    })
    .eq('id', run.id)
    .select()
    .single();

  if (updateError || !updatedRun) {
    throw new Error(`Failed to update workflow run: ${updateError?.message}`);
  }

  console.log(`[Workflow] Topic selected: "${topics[topicIndex].title}"`);
  return updatedRun as WorkflowRun;
}

/**
 * TOPIC_SELECTED → DRAFT_SENT
 * Runs the writer agent and sends the draft review email.
 * Called by the hourly cron when it detects TOPIC_SELECTED state.
 */
export async function transitionTopicSelectedToDraftSent(
  run: WorkflowRun
): Promise<void> {
  console.log('[Workflow] TOPIC_SELECTED → DRAFT_SENT');
  const supabase = getSupabase();

  if (!run.selected_topic) {
    throw new Error('Workflow run has no selected_topic');
  }

  const draft = await runWriterAgent(run.selected_topic as Topic);

  const { error } = await supabase
    .from('workflow_runs')
    .update({
      status: 'DRAFT_SENT',
      draft_post: draft,
      draft_sent_at: new Date().toISOString(),
    })
    .eq('id', run.id);

  if (error) {
    throw new Error(`Failed to update workflow run: ${error.message}`);
  }

  await sendDraftEmail(draft, run.approval_token!);
  console.log(`[Workflow] Draft email sent for: "${draft.title}"`);
}

/**
 * DRAFT_SENT → APPROVED
 * Called when the owner clicks "Approve & Publish" in the draft email.
 */
export async function transitionDraftSentToApproved(
  token: string
): Promise<WorkflowRun> {
  console.log('[Workflow] DRAFT_SENT → APPROVED');
  const supabase = getSupabase();

  const { data: run, error: findError } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('approval_token', token)
    .eq('status', 'DRAFT_SENT')
    .single();

  if (findError || !run) {
    throw new Error('Invalid token or workflow is not in DRAFT_SENT state');
  }

  const { data: updatedRun, error: updateError } = await supabase
    .from('workflow_runs')
    .update({
      status: 'APPROVED',
      approved_at: new Date().toISOString(),
    })
    .eq('id', run.id)
    .select()
    .single();

  if (updateError || !updatedRun) {
    throw new Error(`Failed to approve workflow run: ${updateError?.message}`);
  }

  console.log('[Workflow] Post approved — cron will publish on next tick');
  return updatedRun as WorkflowRun;
}

/**
 * APPROVED → PUBLISHED
 * Publishes the post and sends a confirmation email.
 * Called by the hourly cron when it detects APPROVED state.
 */
export async function transitionApprovedToPublished(
  run: WorkflowRun
): Promise<void> {
  console.log('[Workflow] APPROVED → PUBLISHED');
  const supabase = getSupabase();

  if (!run.draft_post) {
    throw new Error('Workflow run has no draft_post');
  }

  const publicUrl = await runPublisherAgent(run.draft_post as DraftPost);

  // Look up the post ID from slug to store the FK
  const { data: post } = await supabase
    .from('posts')
    .select('id')
    .eq('slug', (run.draft_post as DraftPost).slug)
    .maybeSingle();

  await supabase
    .from('workflow_runs')
    .update({
      status: 'PUBLISHED',
      post_id: post?.id ?? null,
      published_at: new Date().toISOString(),
    })
    .eq('id', run.id);

  await sendPublishedConfirmationEmail(
    (run.draft_post as DraftPost).title,
    publicUrl
  );

  console.log(`[Workflow] PUBLISHED: ${publicUrl}`);
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

/**
 * Hourly cron orchestrator — idempotent, called by /api/cron/workflow.
 * Checks current state and advances the workflow as needed.
 */
export async function runWorkflowCron(): Promise<{ action: string }> {
  console.log('[WorkflowCron] Starting hourly check...');
  const supabase = getSupabase();

  // Priority 1: Advance TOPIC_SELECTED → write draft
  const { data: topicSelectedRun } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('status', 'TOPIC_SELECTED')
    .maybeSingle();

  if (topicSelectedRun) {
    await transitionTopicSelectedToDraftSent(topicSelectedRun as WorkflowRun);
    return { action: 'draft_written' };
  }

  // Priority 2: Advance APPROVED → publish
  const { data: approvedRun } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('status', 'APPROVED')
    .maybeSingle();

  if (approvedRun) {
    await transitionApprovedToPublished(approvedRun as WorkflowRun);
    return { action: 'post_published' };
  }

  // Priority 3: Start new weekly research cycle (Monday 9am UTC)
  const now = new Date();
  const isMonday = now.getUTCDay() === 1;
  const isNineAm = now.getUTCHours() === 9;

  if (isMonday && isNineAm) {
    const shouldStart = await shouldStartNewCycle();
    if (shouldStart) {
      await transitionIdleToTopicsSent();
      return { action: 'research_started' };
    }
  }

  console.log('[WorkflowCron] No transitions needed this tick');
  return { action: 'idle' };
}
