import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import BlogPost from '@/components/blog/BlogPost';
import type { DraftPost, Post } from '@/types';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

interface PageProps {
  params: { token: string };
}

async function getDraftByToken(token: string): Promise<DraftPost | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('workflow_runs')
    .select('draft_post, status')
    .eq('approval_token', token)
    .in('status', ['DRAFT_SENT', 'APPROVED'])
    .single();

  if (error || !data?.draft_post) return null;
  return data.draft_post as DraftPost;
}

export default async function DraftPreviewPage({ params }: PageProps) {
  const draft = await getDraftByToken(params.token);
  if (!draft) notFound();

  // Shape into a Post for the BlogPost component
  const previewPost: Post = {
    id: 'preview',
    title: draft.title,
    slug: draft.slug,
    content: draft.content,
    excerpt: draft.excerpt,
    tags: draft.tags,
    status: 'draft',
    created_at: new Date().toISOString(),
    published_at: null,
  };

  return (
    <div>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
        <p className="text-amber-800 text-sm font-medium">
          Draft Preview — This post has not been published yet. Return to your
          email to approve and publish.
        </p>
      </div>
      <BlogPost post={previewPost} />
    </div>
  );
}
