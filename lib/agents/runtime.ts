import type { SupabaseClient } from '@supabase/supabase-js';
import type { AgentName } from '@/types';

interface TrackAgentOptions<TInput> {
  supabase: SupabaseClient;
  workflowRunId: string | null;
  agentName: AgentName;
  inputPayload?: TInput;
}

export async function runTrackedAgent<TInput, TOutput>(
  options: TrackAgentOptions<TInput>,
  runner: () => Promise<TOutput>
): Promise<TOutput> {
  const startedAt = Date.now();

  const { data: started } = await options.supabase
    .from('agent_runs')
    .insert({
      workflow_run_id: options.workflowRunId,
      agent_name: options.agentName,
      status: 'started',
      input_payload: (options.inputPayload ?? null) as Record<string, unknown> | null,
    })
    .select('id')
    .single();

  try {
    const output = await runner();
    const latencyMs = Date.now() - startedAt;

    if (started?.id) {
      await options.supabase
        .from('agent_runs')
        .update({
          status: 'success',
          output_payload: (output ?? null) as Record<string, unknown> | null,
          latency_ms: latencyMs,
        })
        .eq('id', started.id);
    }

    return output;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;
    const errorMessage = error instanceof Error ? error.message : 'Unknown agent error';

    if (started?.id) {
      await options.supabase
        .from('agent_runs')
        .update({
          status: 'failure',
          error_message: errorMessage,
          latency_ms: latencyMs,
        })
        .eq('id', started.id);
    }

    throw error;
  }
}
