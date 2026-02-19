import Link from 'next/link';
import type { Post } from '@/types';

interface BlogCardProps {
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

export default function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <div className="p-6 flex-1">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-3">
          {post.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-slate-900 mb-3 leading-tight">
          <Link
            href={`/blog/${post.slug}`}
            className="hover:text-indigo-600 transition-colors"
          >
            {post.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
          {post.excerpt}
        </p>

        {/* Meta */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <time dateTime={post.published_at ?? ''}>{formatDate(post.published_at)}</time>
          <span>{readTime(post.content)} min read</span>
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-3">
        <Link
          href={`/blog/${post.slug}`}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
        >
          Read article →
        </Link>
      </div>
    </article>
  );
}
