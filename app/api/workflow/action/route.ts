import { NextRequest, NextResponse } from 'next/server';
import {
  transitionTopicsSentToTopicSelected,
  transitionDraftSentToApproved,
} from '@/lib/workflow/state-machine';

/**
 * Handles user action clicks from email links.
 *
 * GET /api/workflow/action?token=xxx&action=select&topic=2
 *   → Records topic selection, redirects to confirmation page
 *
 * GET /api/workflow/action?token=xxx&action=approve
 *   → Records approval, redirects to success page
 *
 * Security: 256-bit random token in the URL — unforgeable without the email.
 * GET is used because email clients render action links as anchor tags.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token = searchParams.get('token');
  const action = searchParams.get('action');
  const topicParam = searchParams.get('topic');

  const errorRedirect = (reason: string) =>
    NextResponse.redirect(
      new URL(`/workflow/error?reason=${encodeURIComponent(reason)}`, request.url)
    );

  if (!token || !action) {
    return errorRedirect('missing-params');
  }

  try {
    switch (action) {
      case 'select': {
        if (topicParam === null) return errorRedirect('missing-topic');

        const topicIndex = parseInt(topicParam, 10);
        if (isNaN(topicIndex) || topicIndex < 0 || topicIndex > 4) {
          return errorRedirect('invalid-topic');
        }

        const run = await transitionTopicsSentToTopicSelected(token, topicIndex);
        const selectedTitle = (run.selected_topic as { title: string } | null)?.title ?? 'your topic';

        return NextResponse.redirect(
          new URL(
            `/workflow/topic-selected?topic=${encodeURIComponent(selectedTitle)}`,
            request.url
          )
        );
      }

      case 'approve': {
        await transitionDraftSentToApproved(token);
        return NextResponse.redirect(
          new URL('/workflow/approved', request.url)
        );
      }

      default:
        return errorRedirect('unknown-action');
    }
  } catch (error) {
    console.error('[ActionRoute] Error processing action:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorRedirect(message);
  }
}
