import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data, error } = await supabase
    .from('workflow_runs')
    .delete()
    .not('status', 'in', '("PUBLISHED")')
    .select('id,status');

  if (error) {
    console.error('Error:', error.message);
  } else {
    console.log('Deleted stuck workflow runs:', data);
  }
}

main().catch(console.error);
