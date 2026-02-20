'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/utils/slugify';
import type { Post } from '@/types';

interface PostEditorProps {
  post?: Post;
}

type ContentTab = 'paste' | 'html' | 'preview';

/**
 * Strip Wix/Word cruft (script, style blocks, class/id/data attrs) but keep
 * inline styles so that bold/italic via style="font-weight:bold" is preserved.
 */
function cleanPastedHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<meta[^>]*\/?>/gi, '')
    .replace(/<link[^>]*\/?>/gi, '')
    .replace(/\s+class="[^"]*"/gi, '')
    .replace(/\s+id="[^"]*"/gi, '')
    .replace(/\s+data-[a-z-]+=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .trim();
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
  const [contentTab, setContentTab] = useState<ContentTab>(isNew ? 'paste' : 'html');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const pasteZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isNew) setSlug(slugify(title));
  }, [title, isNew]);

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const html = e.clipboardData.getData('text/html');
    if (html) {
      setContent(cleanPastedHtml(html));
    } else {
      // Fallback for plain-text paste
      const text = e.clipboardData.getData('text/plain');
      const paragraphs = text
        .split(/\n\n+/)
        .filter(Boolean)
        .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
        .join('\n');
      setContent(paragraphs);
    }
  }

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

    setSaving(false);
    router.push('/admin');
  }

  const wordCount = content.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const readTime = Math.ceil(wordCount / 200);

  return (
    <div>
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {isNew ? 'New Post' : 'Edit Post'}
        </h1>
        <div className="flex items-center gap-3">
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
            Excerpt <span className="text-slate-400 font-normal">(2–3 sentences, shown as lead paragraph)</span>
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

        {/* Content — tabbed: Paste | HTML | Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
              {(['paste', 'html', 'preview'] as ContentTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setContentTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                    contentTab === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab === 'paste' ? 'Paste from Wix' : tab === 'html' ? 'Edit HTML' : 'Preview'}
                </button>
              ))}
            </div>
            {wordCount > 0 && (
              <span className="text-xs text-slate-400">
                {wordCount} words · {readTime} min read
              </span>
            )}
          </div>

          {/* ── Paste tab ── */}
          {contentTab === 'paste' && (
            <div className="border border-slate-300 rounded-lg overflow-hidden">
              {content ? (
                <>
                  <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between">
                    <span className="text-xs text-green-700 font-medium">
                      Content pasted — {wordCount} words. Switch to Preview to review, or Edit HTML to clean up.
                    </span>
                    <button
                      onClick={() => { setContent(''); if (pasteZoneRef.current) pasteZoneRef.current.innerHTML = ''; }}
                      className="text-xs text-green-600 hover:text-green-800 underline ml-4 shrink-0"
                    >
                      Clear &amp; re-paste
                    </button>
                  </div>
                  <div
                    className="p-6 prose prose-slate prose-sm max-w-none max-h-96 overflow-y-auto
                      prose-headings:font-bold prose-headings:text-slate-900
                      prose-p:text-slate-700 prose-p:leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </>
              ) : (
                <div
                  ref={pasteZoneRef}
                  contentEditable
                  suppressContentEditableWarning
                  onPaste={handlePaste}
                  className="min-h-64 p-6 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 text-slate-300 text-sm cursor-text"
                >
                  Click here, then paste your Wix content (Ctrl+V / Cmd+V).
                  Headings, bold, italic, lists and links will all be preserved.
                </div>
              )}
            </div>
          )}

          {/* ── HTML tab ── */}
          {contentTab === 'html' && (
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={28}
              placeholder="<h2>Introduction</h2><p>Your post content here…</p>"
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500"
              spellCheck={false}
            />
          )}

          {/* ── Preview tab ── */}
          {contentTab === 'preview' && (
            <div className="bg-white rounded-xl border border-slate-200 p-8">
              {content ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {tagsInput.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                      <span key={tag} className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-3">{title || 'Untitled'}</h2>
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
                </>
              ) : (
                <p className="text-slate-400 text-sm">No content yet. Paste from Wix or write HTML first.</p>
              )}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Current status:</span>
          <span className={`font-semibold ${status === 'published' ? 'text-green-600' : 'text-slate-500'}`}>
            {status === 'published' ? 'Published' : 'Draft'}
          </span>
        </div>
      </div>
    </div>
  );
}
