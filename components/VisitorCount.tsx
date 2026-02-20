'use client';

import { useEffect, useState } from 'react';

export default function VisitorCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    // Only increment once per browser session
    const key = 'etn_visited';
    const already = sessionStorage.getItem(key);

    if (already) {
      // Just fetch the current count without incrementing
      fetch('/api/stats')
        .then(r => r.json())
        .then(d => setCount(d.count))
        .catch(() => {});
    } else {
      sessionStorage.setItem(key, '1');
      fetch('/api/stats', { method: 'POST' })
        .then(r => r.json())
        .then(d => setCount(d.count))
        .catch(() => {});
    }
  }, []);

  if (count === null) return null;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
      {count.toLocaleString()} visitors
    </span>
  );
}
