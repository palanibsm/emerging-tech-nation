import { Resend } from 'resend';
import { render } from '@react-email/render';
import TopicsEmail from '@/emails/TopicsEmail';
import DraftEmail from '@/emails/DraftEmail';
import type { Topic, DraftPost } from '@/types';

// Lazy initialization — avoids throwing at module load time during build
function getResend() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set');
  }
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = 'noreply@emergingtechnation.com';

/**
 * Sends the weekly topic selection email to the site owner.
 */
export async function sendTopicsEmail(
  topics: Topic[],
  workflowToken: string
): Promise<void> {
  const html = await render(TopicsEmail({ topics, token: workflowToken }));

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: process.env.OWNER_EMAIL!,
    subject: '🔬 5 cutting-edge tech topics ready for your approval',
    html,
  });

  if (error) {
    throw new Error(`Failed to send topics email: ${error.message}`);
  }
}

/**
 * Sends the draft review email with preview and approve buttons.
 */
export async function sendDraftEmail(
  draft: DraftPost,
  workflowToken: string
): Promise<void> {
  const html = await render(DraftEmail({ draft, token: workflowToken }));

  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: process.env.OWNER_EMAIL!,
    subject: `📝 Draft ready: ${draft.title}`,
    html,
  });

  if (error) {
    throw new Error(`Failed to send draft email: ${error.message}`);
  }
}

/**
 * Sends a confirmation email after a post is published.
 */
export async function sendPublishedConfirmationEmail(
  postTitle: string,
  postUrl: string
): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to: process.env.OWNER_EMAIL!,
    subject: `✅ Published: ${postTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h2 style="color: #0f172a;">Your post has been published!</h2>
        <p style="color: #374151;">
          <strong><a href="${postUrl}" style="color: #6366f1;">${postTitle}</a></strong>
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          The next research cycle will begin next Monday at 9am UTC.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send confirmation email: ${error.message}`);
  }
}
