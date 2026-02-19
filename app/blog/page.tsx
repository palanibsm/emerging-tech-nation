import type { Metadata } from 'next';
import { createServerClient } from '@/lib/supabase/server';
import BlogList from '@/components/blog/BlogList';
import type { Post } from '@/types';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog',
  description: 'All articles from Emerging Tech Nation covering AI, IoT, and AR/VR.',
};

async function getAllPublishedPosts(): Promise<Post[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch posts:', error);
    return [];
  }

  return (data ?? []) as Post[];
}

export default async function BlogPage() {
  const posts = await getAllPublishedPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-3">All Articles</h1>
        <p className="text-slate-500">
          {posts.length} article{posts.length !== 1 ? 's' : ''} published
        </p>
      </div>
      <BlogList posts={posts} />
    </div>
  );
}
