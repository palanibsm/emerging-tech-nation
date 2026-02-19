'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createBrowserClient } from '@/lib/supabase/client';

interface Comment {
  id: string;
  user_name: string;
  user_avatar: string | null;
  provider: string;
  content: string;
  created_at: string;
}

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

export default function Comments({ postId }: { postId: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const scriptLoaded = useRef(false);

  // Load reCAPTCHA v3 script once
  useEffect(() => {
    if (scriptLoaded.current || !RECAPTCHA_SITE_KEY) return;
    scriptLoaded.current = true;
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  // Track auth state
  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch comments
  useEffect(() => {
    fetch(`/api/comments/${postId}`)
      .then(r => r.json())
      .then(d => setComments(d.comments ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [postId]);

  const signIn = async (provider: 'google' | 'github') => {
    const supabase = createBrowserClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(window.location.href)}`,
      },
    });
  };

  const signOut = () => createBrowserClient().auth.signOut();

  const getRecaptchaToken = (): Promise<string> =>
    new Promise((resolve, reject) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const gr = (window as any).grecaptcha;
      if (!gr) return reject(new Error('reCAPTCHA not loaded yet'));
      gr.execute(RECAPTCHA_SITE_KEY, { action: 'submit_comment' })
        .then(resolve)
        .catch(reject);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !content.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      const recaptchaToken = await getRecaptchaToken();
      const res = await fetch(`/api/comments/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ content, recaptchaToken }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? 'Failed to post comment');
      }

      const { comment } = await res.json();
      setComments(prev => [...prev, comment]);
      setContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-slate-200 pt-10">
      <h2 className="text-2xl font-bold text-slate-900 mb-8">
        Comments {!loading && `(${comments.length})`}
      </h2>

      {/* Comment list */}
      {loading ? (
        <p className="text-slate-400 text-sm mb-8">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-slate-400 text-sm mb-8">No comments yet. Be the first!</p>
      ) : (
        <ul className="space-y-6 mb-10">
          {comments.map(c => (
            <li key={c.id} className="flex gap-4">
              {c.user_avatar ? (
                <img
                  src={c.user_avatar}
                  alt={c.user_name}
                  className="w-9 h-9 rounded-full flex-shrink-0 ring-1 ring-slate-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600 flex-shrink-0">
                  {c.user_name[0]?.toUpperCase() ?? '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-slate-800 text-sm">{c.user_name}</span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    {c.provider === 'google' ? <GoogleIcon size={12} /> : <GitHubIcon size={12} />}
                    {c.provider}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {c.content}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Comment form or sign-in prompt */}
      {session ? (
        <div>
          <div className="flex items-center gap-3 mb-4">
            {session.user.user_metadata?.avatar_url && (
              <img
                src={session.user.user_metadata.avatar_url as string}
                alt=""
                className="w-8 h-8 rounded-full ring-1 ring-slate-200"
              />
            )}
            <span className="text-sm text-slate-600">
              Signed in as{' '}
              <strong>
                {(session.user.user_metadata?.full_name as string) ??
                  (session.user.user_metadata?.name as string) ??
                  session.user.email}
              </strong>
            </span>
            <button
              onClick={signOut}
              className="text-xs text-slate-400 hover:text-slate-600 underline ml-auto"
            >
              Sign out
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write a comment…"
              maxLength={1000}
              rows={4}
              className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            <div className="flex items-center justify-between mt-2 gap-4">
              <span className="text-xs text-slate-400 shrink-0">{content.length} / 1000</span>
              {error && <p className="text-xs text-red-500 flex-1">{error}</p>}
              <button
                type="submit"
                disabled={submitting || !content.trim()}
                className="shrink-0 bg-slate-900 text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Posting…' : 'Post Comment'}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Protected by reCAPTCHA.{' '}
              <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noreferrer">
                Privacy
              </a>{' '}
              &amp;{' '}
              <a href="https://policies.google.com/terms" className="underline" target="_blank" rel="noreferrer">
                Terms
              </a>
              .
            </p>
          </form>
        </div>
      ) : (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-600 text-sm mb-5 font-medium">Sign in to leave a comment</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={() => signIn('google')}
              className="flex items-center justify-center gap-2 border border-slate-300 bg-white px-5 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <GoogleIcon size={16} />
              Sign in with Google
            </button>
            <button
              onClick={() => signIn('github')}
              className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <GitHubIcon size={16} />
              Sign in with GitHub
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
