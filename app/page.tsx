import { createServerClient } from '@/lib/supabase/server';
import BlogList from '@/components/blog/BlogList';
import type { Post } from '@/types';

export const revalidate = 3600;

async function getRecentPosts(): Promise<Post[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Failed to fetch recent posts:', error);
    return [];
  }

  return (data ?? []) as Post[];
}

export default async function HomePage() {
  const posts = await getRecentPosts();

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Hero */}
      <section className="text-center mb-20">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
          The Future of Tech,
          <br />
          <span className="text-indigo-600">Explained Today</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          AI-powered insights on artificial intelligence, IoT, and augmented reality.
          Fresh perspectives on the technologies shaping tomorrow.
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <a
            href="/blog"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse All Articles →
          </a>
        </div>
      </section>

      {/* Recent Posts */}
      <BlogList posts={posts} title="Latest Articles" />
    </div>
  );
}
