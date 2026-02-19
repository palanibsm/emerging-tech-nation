/**
 * Resends the draft review email for the current workflow run.
 * Used when the email step failed but the draft is already saved in DB.
 */
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  const { createServerClient } = await import('../lib/supabase/server');
  const { sendDraftEmail } = await import('../lib/services/email');

  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('workflow_runs')
    .select('draft_post, approval_token')
    .eq('status', 'DRAFT_SENT')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.error('No DRAFT_SENT workflow run found:', error);
    process.exit(1);
  }

  const { draft_post, approval_token } = data as {
    draft_post: import('../types').DraftPost;
    approval_token: string;
  };

  console.log('Sending draft email for:', draft_post.title);
  await sendDraftEmail(draft_post, approval_token);
  console.log('Draft email sent successfully!');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
