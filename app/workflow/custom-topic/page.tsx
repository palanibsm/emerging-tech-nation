'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CustomTopicForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setStatus('submitting');
    setError('');

    try {
      const res = await fetch('/api/workflow/custom-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, title: title.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      router.push(`/workflow/topic-selected?topic=${encodeURIComponent(data.title)}`);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setStatus('error');
    }
  }

  if (!token) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <p className="text-red-500">Invalid link. Please use the link from your email.</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-24">
      <div className="text-center mb-10">
        <div className="text-4xl mb-4">✏️</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Enter Your Own Topic</h1>
        <p className="text-slate-500 text-sm">
          The writing agent will research and draft a full post based on your topic.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-700 mb-2">
            Topic
          </label>
          <textarea
            id="topic"
            rows={4}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. How Zero Trust Architecture is Redefining Enterprise Security in 2026"
            className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            maxLength={200}
            disabled={status === 'submitting'}
          />
          <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/200</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting' || title.trim().length < 5}
          className="w-full rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {status === 'submitting' ? 'Submitting…' : 'Submit Topic →'}
        </button>
      </form>
    </div>
  );
}

export default function CustomTopicPage() {
  return (
    <Suspense fallback={<div className="max-w-xl mx-auto px-4 py-24 text-center text-slate-400">Loading…</div>}>
      <CustomTopicForm />
    </Suspense>
  );
}
