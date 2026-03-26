import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local'), override: true });

async function main() {
  const { transitionIdleToTopicsSent } = await import('../lib/workflow/state-machine');
  console.log('[force-research] Starting IDLE → TOPICS_SENT...');
  await transitionIdleToTopicsSent();
  console.log('[force-research] Done. Topics email sent.');
}

main().catch((err) => {
  console.error('[force-research] Error:', err.message ?? err);
  process.exit(1);
});
