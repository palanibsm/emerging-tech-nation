'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Post } from '@/types';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  const fetchPosts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const res = await fetch('/api/admin/posts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPosts(data.posts);
    } else {
      setError('Failed to load posts');
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function toggleStatus(post: Post) {
    const token = await getToken();
    if (!token) return;
    setTogglingId(post.id);
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setPosts(prev =>
        prev.map(p => p.id === post.id ? { ...p, status: newStatus } : p)
      );
    }
    setTogglingId(null);
  }

  async function deletePost(post: Post) {
    if (!confirm(`Delete "${post.title}"? This cannot be undone.`)) return;
    const token = await getToken();
    if (!token) return;
    setDeletingId(post.id);
    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setPosts(prev => prev.filter(p => p.id !== post.id));
    } else {
      setError('Failed to delete post');
    }
    setDeletingId(null);
  }

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading posts…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">All Posts ({posts.length})</h1>
        <Link
          href="/admin/posts/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
        >
          + New Post
        </Link>
      </div>

      {error && (
        <p className="text-red-500 text-sm mb-4">{error}</p>
      )}

      {posts.length === 0 ? (
        <p className="text-slate-400 text-sm">No posts yet.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Tags</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {posts.map(post => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800 max-w-xs truncate">
                      {post.title}
                    </div>
                    <div className="text-slate-400 text-xs mt-0.5">/blog/{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleStatus(post)}
                      disabled={togglingId === post.id}
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold transition-colors disabled:opacity-50 ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {post.status === 'published' ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {post.tags.length > 3 && (
                        <span className="text-slate-400 text-xs">+{post.tags.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                    {new Date(post.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {post.status === 'published' && (
                        <a
                          href={`/blog/${post.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-400 hover:text-slate-600 text-xs underline"
                        >
                          View
                        </a>
                      )}
                      <Link
                        href={`/admin/posts/${post.id}`}
                        className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => deletePost(post)}
                        disabled={deletingId === post.id}
                        className="text-red-500 hover:text-red-700 text-xs font-medium disabled:opacity-50"
                      >
                        {deletingId === post.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
