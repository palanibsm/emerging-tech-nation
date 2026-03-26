import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

import { createClient } from '@supabase/supabase-js';

async function main() {
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const { data: runs } = await supabase
    .from('workflow_runs')
    .select('id,status,created_at,published_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log('Recent workflow runs:');
  console.log(JSON.stringify(runs, null, 2));

  const { data: lastPost } = await supabase
    .from('posts')
    .select('id,title,status,published_at')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  console.log('\nLast published post:');
  console.log(JSON.stringify(lastPost, null, 2));
}

main().catch(console.error);
