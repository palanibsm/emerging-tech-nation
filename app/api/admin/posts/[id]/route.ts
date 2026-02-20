import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const supabase = createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser(authHeader.slice(7));
  if (error || !user || user.email !== process.env.OWNER_EMAIL) return null;
  return user;
}

/**
 * PUT /api/admin/posts/[id]
 * Updates an existing post.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string;
    tags?: string[];
    status?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Fetch current status so we know whether to set published_at
  const { data: existing } = await supabase
    .from('posts')
    .select('status, published_at')
    .eq('id', params.id)
    .single();

  const { title, slug, content, excerpt, tags, status } = body;
  const isPublishing = status === 'published' && existing?.status !== 'published';
  const isUnpublishing = status === 'draft';

  const { data, error } = await supabase
    .from('posts')
    .update({
      ...(title !== undefined && { title: title.trim() }),
      ...(slug !== undefined && { slug: slug.trim() }),
      ...(content !== undefined && { content: content.trim() }),
      ...(excerpt !== undefined && { excerpt: excerpt.trim() }),
      ...(tags !== undefined && { tags }),
      ...(status !== undefined && { status }),
      ...(isPublishing && { published_at: new Date().toISOString() }),
      ...(isUnpublishing && { published_at: null }),
    })
    .eq('id', params.id)
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

/**
 * DELETE /api/admin/posts/[id]
 * Permanently deletes a post (and cascades to comments).
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { error } = await supabase.from('posts').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
