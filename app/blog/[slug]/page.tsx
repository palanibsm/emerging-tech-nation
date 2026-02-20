import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import BlogPost from '@/components/blog/BlogPost';
import Comments from '@/components/blog/Comments';
import type { Post } from '@/types';

export const revalidate = 3600;

const SITE_URL = process.env.SITE_URL ?? 'https://emergingtechnation.com';

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

  const url = `${SITE_URL}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: 'article',
      siteName: 'Emerging Tech Nation',
      publishedTime: post.published_at ?? undefined,
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}

export async function generateStaticParams() {
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

  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    keywords: post.tags.join(', '),
    url,
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.published_at ?? post.created_at,
    author: {
      '@type': 'Organization',
      name: 'Emerging Tech Nation',
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Emerging Tech Nation',
      url: SITE_URL,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BlogPost post={post} />
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <Comments postId={post.id} />
      </div>
    </>
  );
}
