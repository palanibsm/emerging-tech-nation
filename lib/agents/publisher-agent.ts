import { createServerClient } from '@/lib/supabase/server';
import { makeUniqueSlug } from '@/lib/utils/slugify';
import type { DraftPost } from '@/types';

/**
 * Publisher Agent: Saves an approved draft to Supabase as a published post
 * and triggers ISR revalidation so the new post appears immediately.
 */
export async function runPublisherAgent(draft: DraftPost): Promise<string> {
  console.log(`[PublisherAgent] Publishing: "${draft.title}"`);

  const supabase = createServerClient();
  const now = new Date().toISOString();

  // Ensure slug uniqueness
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('slug');

  const existingSlugs = (existingPosts ?? []).map((p: { slug: string }) => p.slug);
  const uniqueSlug = makeUniqueSlug(draft.slug, existingSlugs);

  if (uniqueSlug !== draft.slug) {
    console.log(
      `[PublisherAgent] Slug collision: "${draft.slug}" → "${uniqueSlug}"`
    );
  }

  // Insert published post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      title: draft.title,
      slug: uniqueSlug,
      content: draft.content,
      excerpt: draft.excerpt,
      tags: draft.tags,
      status: 'published',
      created_at: now,
      published_at: now,
    })
    .select()
    .single();

  if (error || !post) {
    throw new Error(
      `[PublisherAgent] Failed to insert post: ${error?.message ?? 'No data returned'}`
    );
  }

  console.log(`[PublisherAgent] Post saved to Supabase: ${post.id}`);

  // Trigger ISR revalidation
  await revalidateBlogRoutes(uniqueSlug);

  const publicUrl = `${process.env.SITE_URL}/blog/${uniqueSlug}`;
  console.log(`[PublisherAgent] Published at: ${publicUrl}`);

  return publicUrl;
}

async function revalidateBlogRoutes(slug: string): Promise<void> {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) return;

  const pathsToRevalidate = ['/', '/blog', `/blog/${slug}`];

  await Promise.allSettled(
    pathsToRevalidate.map((path) =>
      fetch(`${siteUrl}/api/revalidate?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
      })
    )
  );

  console.log(`[PublisherAgent] ISR revalidation triggered`);
}
