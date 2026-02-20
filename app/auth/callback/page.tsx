'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';

function CallbackInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const supabase = createBrowserClient();
    const next = searchParams.get('next') ?? '/';

    // Register the listener FIRST to avoid a race condition where the SIGNED_IN
    // event fires before the .then() callback runs.
    // Use window.location.href (full reload) so the destination page re-initialises
    // Supabase from localStorage and correctly picks up the new session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        subscription.unsubscribe();
        window.location.href = next;
      }
    });

    // If the PKCE exchange already completed before the listener was registered,
    // getSession() will catch it here.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        window.location.href = next;
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-slate-500 text-sm">Completing sign in…</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
