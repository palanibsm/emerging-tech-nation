import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import PostEditor from '@/components/admin/PostEditor';
import type { Post } from '@/types';

interface PageProps {
  params: { id: string };
}

async function getPost(id: string): Promise<Post | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) return null;
  return data as Post;
}

export default async function EditPostPage({ params }: PageProps) {
  const post = await getPost(params.id);
  if (!post) notFound();

  return <PostEditor post={post} />;
}
