import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import BlogPost from '@/components/blog/BlogPost';
import Comments from '@/components/blog/Comments';
import type { Post } from '@/types';

export const revalidate = 3600;

interface PageProps {
  params: { slug: string };
}

async function getPostBySlug(slug: string): Promise<Post | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();

  if (error || !data) return null;
  return data as Post;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Post Not Found' };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      tags: post.tags,
    },
  };
}

export async function generateStaticParams() {
  // Skip at build time if Supabase isn't configured yet.
  // Posts are generated on-demand via ISR after deployment.
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return [];
  }

  const supabase = createServerClient();
  const { data } = await supabase
    .from('posts')
    .select('slug')
    .eq('status', 'published');

  return (data ?? []).map(({ slug }: { slug: string }) => ({ slug }));
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      <BlogPost post={post} />
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Comments postId={post.id} />
      </div>
    </>
  );
}
