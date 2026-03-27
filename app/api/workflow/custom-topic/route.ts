import { NextRequest, NextResponse } from 'next/server';
import { waitUntil } from '@vercel/functions';
import { transitionTopicsSentToCustomTopic } from '@/lib/workflow/state-machine';

export async function POST(request: NextRequest) {
  try {
    const { token, title } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    if (!trimmedTitle || trimmedTitle.length < 5) {
      return NextResponse.json({ error: 'Topic must be at least 5 characters' }, { status: 400 });
    }
    if (trimmedTitle.length > 200) {
      return NextResponse.json({ error: 'Topic must be under 200 characters' }, { status: 400 });
    }

    await transitionTopicsSentToCustomTopic(token, trimmedTitle);

    // Immediately trigger the writer agent in the background
    const advanceUrl = new URL('/api/workflow/advance', request.url).toString();
    waitUntil(
      fetch(advanceUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
      })
    );

    return NextResponse.json({ success: true, title: trimmedTitle });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
