import { revalidatePath } from 'next/cache';
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
 * GET /api/admin/posts
 * Returns all posts (draft + published), newest first.
 */
export async function GET(req: NextRequest) {
  const user = await requireAdmin(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data ?? [] });
}

/**
 * POST /api/admin/posts
 * Creates a new post.
 * Body: { title, slug, content, excerpt, tags, status }
 */
export async function POST(req: NextRequest) {
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

  const { title, slug, content, excerpt = '', tags = [], status = 'draft' } = body;

  if (!title?.trim() || !slug?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: 'title, slug, and content are required' },
      { status: 400 }
    );
  }

  const isPublished = status === 'published';

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .insert({
      title: title.trim(),
      slug: slug.trim(),
      content: content.trim(),
      excerpt: excerpt.trim(),
      tags,
      status: isPublished ? 'published' : 'draft',
      published_at: isPublished ? new Date().toISOString() : null,
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bust ISR cache immediately so the new post appears without waiting up to 1 hour
  if (isPublished && data) {
    revalidatePath('/');
    revalidatePath('/blog');
    revalidatePath(`/blog/${data.slug}`);
  }

  return NextResponse.json({ post: data }, { status: 201 });
}
