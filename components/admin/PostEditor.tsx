'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/slugify';
import type { Post } from '@/types';

interface PostEditorProps {
  post?: Post; // undefined = creating a new post
}

export default function PostEditor({ post }: PostEditorProps) {
  const router = useRouter();
  const isNew = !post;

  const [title, setTitle] = useState(post?.title ?? '');
  const [slug, setSlug] = useState(post?.slug ?? '');
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '');
  const [tagsInput, setTagsInput] = useState(post?.tags.join(', ') ?? '');
  const [content, setContent] = useState(post?.content ?? '');
  const [status, setStatus] = useState<'draft' | 'published'>(post?.status ?? 'draft');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-generate slug from title only when creating a new post
  useEffect(() => {
    if (isNew) {
      setSlug(slugify(title));
    }
  }, [title, isNew]);

  async function getToken() {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }

  async function handleSave(saveStatus: 'draft' | 'published') {
    setError('');
    if (!title.trim() || !slug.trim() || !content.trim()) {
      setError('Title, slug, and content are required.');
      return;
    }
    const token = await getToken();
    if (!token) { setError('Not authenticated.'); return; }

    setSaving(true);
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);

    const body = { title, slug, excerpt, tags, content, status: saveStatus };

    const res = isNew
      ? await fetch('/api/admin/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        })
      : await fetch(`/api/admin/posts/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(body),
        });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? 'Save failed');
      setSaving(false);
      return;
    }

    setStatus(saveStatus);
    setSaving(false);
    router.push('/admin');
  }

  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'New Post' : 'Edit Post'}
        </h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setPreview(p => !p)}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 px-4 py-1.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50 transition-colors"
          >
            {saving ? 'Publishing…' : status === 'published' ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {preview ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
              <span key={tag} className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{title || 'Untitled'}</h2>
          <p className="text-slate-500 text-sm mb-6">/blog/{slug} · {readTime} min read · {wordCount} words</p>
          {excerpt && (
            <p className="text-xl text-slate-600 leading-relaxed mb-6 font-medium border-l-4 border-indigo-200 pl-4">
              {excerpt}
            </p>
          )}
          <div
            className="prose prose-slate prose-lg max-w-none
              prose-headings:font-bold prose-headings:text-slate-900
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-strong:text-slate-900
              prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline
              prose-ul:text-slate-700 prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Your post title"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Slug <span className="text-slate-400 font-normal">(URL path)</span>
            </label>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
              <span className="bg-slate-50 text-slate-400 text-xs px-3 py-2.5 border-r border-slate-300 whitespace-nowrap">
                /blog/
              </span>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                placeholder="my-post-slug"
                className="flex-1 px-3 py-2.5 text-slate-800 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Excerpt <span className="text-slate-400 font-normal">(2–3 sentences shown as lead)</span>
            </label>
            <textarea
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              rows={2}
              placeholder="A short summary of the post…"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="agentic-ai, robotics, quantum"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-slate-700">
                Content <span className="text-slate-400 font-normal">(HTML)</span>
              </label>
              <span className="text-xs text-slate-400">{wordCount} words · {readTime} min read</span>
            </div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={28}
              placeholder="<h2>Introduction</h2><p>Your post content here…</p>"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
              spellCheck={false}
            />
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Current status:</span>
            <span
              className={`font-semibold ${
                status === 'published' ? 'text-green-600' : 'text-slate-500'
              }`}
            >
              {status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
