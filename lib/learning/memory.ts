import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Topic } from '@/types';

interface PromptVersionInput {
  agentName: string;
  versionLabel: string;
  promptText: string;
  notes?: string;
}

export async function recordPromptVersion(
  supabase: SupabaseClient,
  input: PromptVersionInput
): Promise<void> {
  const promptHash = createHash('sha256').update(input.promptText).digest('hex');

  const { error } = await supabase.from('prompt_versions').upsert(
    {
      agent_name: input.agentName,
      version_label: input.versionLabel,
      prompt_hash: promptHash,
      prompt_text: input.promptText,
      notes: input.notes ?? null,
      is_active: true,
    },
    {
      onConflict: 'agent_name,version_label',
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw new Error(`Failed to record prompt version: ${error.message}`);
  }
}

export async function recordTopicSlate(
  supabase: SupabaseClient,
  workflowRunId: string,
  topics: Topic[]
): Promise<void> {
  const rows = topics.map((topic, index) => ({
    workflow_run_id: workflowRunId,
    topic_title: topic.title,
    topic_category: topic.category,
    topic_index: index,
    was_selected: false,
    was_custom: false,
  }));

  const { error } = await supabase.from('topic_performance').insert(rows);
  if (error) {
    throw new Error(`Failed to record topic slate: ${error.message}`);
  }
}

export async function markTopicSelected(
  supabase: SupabaseClient,
  workflowRunId: string,
  topic: Topic,
  topicIndex: number,
  wasCustom: boolean
): Promise<void> {
  const selectedAt = new Date().toISOString();

  if (wasCustom) {
    const { error } = await supabase.from('topic_performance').insert({
      workflow_run_id: workflowRunId,
      topic_title: topic.title,
      topic_category: topic.category,
      topic_index: topicIndex,
      was_selected: true,
      was_custom: true,
      selected_at: selectedAt,
    });

    if (error) {
      throw new Error(`Failed to record custom topic selection: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase
    .from('topic_performance')
    .update({
      was_selected: true,
      selected_at: selectedAt,
    })
    .eq('workflow_run_id', workflowRunId)
    .eq('topic_index', topicIndex);

  if (error) {
    throw new Error(`Failed to record topic selection: ${error.message}`);
  }
}

export async function markTopicPublished(
  supabase: SupabaseClient,
  workflowRunId: string,
  postId: string | null,
  publishedAt: string
): Promise<void> {
  const { error } = await supabase
    .from('topic_performance')
    .update({
      published_post_id: postId,
      published_at: publishedAt,
    })
    .eq('workflow_run_id', workflowRunId)
    .eq('was_selected', true);

  if (error) {
    throw new Error(`Failed to record topic publish outcome: ${error.message}`);
  }
}
