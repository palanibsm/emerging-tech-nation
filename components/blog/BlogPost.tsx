import type { Post } from '@/types';

interface BlogPostProps {
  post: Post;
}

function formatDate(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function readTime(html: string): number {
  return Math.ceil(html.replace(/<[^>]+>/g, ' ').split(/\s+/).length / 200);
}

export default function BlogPost({ post }: BlogPostProps) {
  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold text-slate-900 leading-tight mb-6">
        {post.title}
      </h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mb-8 pb-8 border-b border-slate-200">
        <time dateTime={post.published_at ?? ''}>{formatDate(post.published_at)}</time>
        <span>·</span>
        <span>{readTime(post.content)} min read</span>
        <span>·</span>
        <span>Emerging Tech Nation</span>
      </div>

      {/* Excerpt lead */}
      <p className="text-xl text-slate-600 leading-relaxed mb-8 font-medium">
        {post.excerpt}
      </p>

      {/* HTML Content */}
      <div
        className="prose prose-slate prose-lg max-w-none
          prose-headings:font-bold prose-headings:text-slate-900
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-p:text-slate-700 prose-p:leading-relaxed
          prose-strong:text-slate-900
          prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
          prose-ul:text-slate-700 prose-li:my-1"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    </article>
  );
}
