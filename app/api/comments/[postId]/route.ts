import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) throw new Error('RECAPTCHA_SECRET_KEY not set');

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${secret}&response=${token}`,
  });

  const data = await res.json();
  // Score >= 0.5 → likely human (1.0 = definitely human, 0.0 = bot)
  return data.success === true && (data.score ?? 0) >= 0.5;
}

/**
 * GET /api/comments/[postId]
 * Returns all comments for a post — public, no auth required.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from('comments')
    .select('id, user_name, user_avatar, provider, content, created_at')
    .eq('post_id', params.postId)
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ comments: data ?? [] });
}

/**
 * POST /api/comments/[postId]
 * Creates a new comment. Requires:
 *   - Authorization: Bearer <supabase_access_token>
 *   - Body: { content: string, recaptchaToken: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const accessToken = authHeader.slice(7);

  let body: { content?: string; recaptchaToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content, recaptchaToken } = body;

  if (!content?.trim() || content.trim().length > 1000) {
    return NextResponse.json(
      { error: 'Comment must be between 1 and 1000 characters' },
      { status: 400 }
    );
  }

  if (!recaptchaToken) {
    return NextResponse.json({ error: 'reCAPTCHA token missing' }, { status: 400 });
  }

  // Verify reCAPTCHA score
  const isHuman = await verifyRecaptcha(recaptchaToken);
  if (!isHuman) {
    return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
  }

  // Verify user JWT and extract identity
  const supabase = createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
  }

  const provider = (user.app_metadata?.provider as string) ?? 'unknown';
  const user_name =
    (user.user_metadata?.full_name as string) ??
    (user.user_metadata?.name as string) ??
    (user.email as string) ??
    'Anonymous';
  const user_avatar =
    (user.user_metadata?.avatar_url as string) ??
    (user.user_metadata?.picture as string) ??
    null;

  const { data: comment, error: insertError } = await supabase
    .from('comments')
    .insert({
      post_id: params.postId,
      user_id: user.id,
      user_name,
      user_avatar,
      provider,
      content: content.trim(),
    })
    .select('id, user_name, user_avatar, provider, content, created_at')
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ comment }, { status: 201 });
}
