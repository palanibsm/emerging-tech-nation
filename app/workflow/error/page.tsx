export default function WorkflowErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason ?? 'unknown error';

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Something went wrong</h1>
      <p className="text-slate-500 text-sm mb-4">
        This link may have already been used or may be invalid.
      </p>
      <p className="text-xs text-slate-400 font-mono bg-slate-100 rounded px-3 py-2 inline-block">
        {reason}
      </p>
    </div>
  );
}
