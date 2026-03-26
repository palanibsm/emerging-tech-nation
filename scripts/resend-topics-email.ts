import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';
import { sendTopicsEmail } from '../lib/services/email';
import type { Topic } from '../types';

async function main() {
  console.log('OWNER_EMAIL:', process.env.OWNER_EMAIL);
  console.log('RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  console.log('SITE_URL:', process.env.SITE_URL);

  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: run, error } = await supabase
    .from('workflow_runs')
    .select('*')
    .eq('status', 'TOPICS_SENT')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !run) {
    console.error('No TOPICS_SENT workflow found:', error?.message);
    return;
  }

  console.log('\nWorkflow run:', run.id);
  console.log('Topics:', JSON.stringify(run.topics, null, 2));
  console.log('\nResending topics email...');

  await sendTopicsEmail(run.topics as Topic[], run.approval_token);
  console.log('Email sent successfully!');
}

main().catch((err) => {
  console.error('Failed:', err.message ?? err);
  process.exit(1);
});
