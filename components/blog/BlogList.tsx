import BlogCard from './BlogCard';
import type { Post } from '@/types';

interface BlogListProps {
  posts: Post[];
  title?: string;
}

export default function BlogList({ posts, title }: BlogListProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-400 text-lg">No posts published yet.</p>
        <p className="text-slate-300 text-sm mt-2">Check back soon!</p>
      </div>
    );
  }

  return (
    <section>
      {title && (
        <h2 className="text-2xl font-bold text-slate-900 mb-8">{title}</h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
