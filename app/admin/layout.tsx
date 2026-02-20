'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

type AuthStatus = 'loading' | 'no-session' | 'unauthorized' | 'admin';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');

  useEffect(() => {
    async function check() {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus('no-session');
        return;
      }

      const res = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.ok) {
        const { isAdmin } = await res.json();
        setStatus(isAdmin ? 'admin' : 'unauthorized');
      } else {
        setStatus('unauthorized');
      }
    }
    check();
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-slate-400 text-sm">Checking access…</p>
      </div>
    );
  }

  if (status === 'no-session') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Admin Access</h1>
          <p className="text-slate-500 text-sm mb-6">
            Sign in with your owner Google account to manage blog posts.
          </p>
          <button
            onClick={() => {
              const supabase = createBrowserClient();
              supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                  redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
                },
              });
            }}
            className="bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-red-500 font-medium">Access denied — not an admin account.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6 text-sm font-medium">
          <span className="text-slate-400">Admin</span>
          <Link href="/admin" className="text-slate-700 hover:text-slate-900">
            All Posts
          </Link>
          <Link href="/admin/posts/new" className="text-indigo-600 hover:text-indigo-800">
            + New Post
          </Link>
          <Link href="/" className="text-slate-400 hover:text-slate-600 ml-auto">
            ← Back to site
          </Link>
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-8">{children}</div>
    </div>
  );
}
