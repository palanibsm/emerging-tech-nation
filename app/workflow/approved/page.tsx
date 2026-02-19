export default function ApprovedPage() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="text-5xl mb-6">🚀</div>
      <h1 className="text-2xl font-bold text-slate-900 mb-3">Post Approved!</h1>
      <p className="text-slate-600 mb-2">Your post is being published now.</p>
      <p className="text-slate-500 text-sm">
        You will receive a confirmation email with the live URL within a minute.
        The blog will update automatically.
      </p>
      <a
        href="/blog"
        className="mt-8 inline-block text-indigo-600 font-semibold hover:underline"
      >
        View Blog →
      </a>
    </div>
  );
}
