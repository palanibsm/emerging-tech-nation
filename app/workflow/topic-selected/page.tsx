export default function TopicSelectedPage({
  searchParams,
}: {
  searchParams: { topic?: string };
}) {
  const topic = decodeURIComponent(searchParams.topic ?? 'your topic');

  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Topic Selected!</h1>
      <p className="text-slate-600 mb-2">
        You selected: <strong>{topic}</strong>
      </p>
      <p className="text-slate-500 text-sm">
        The writing agent will research and draft your post within the next hour.
        You will receive an email with a preview link when it is ready.
      </p>
    </div>
  );
}
