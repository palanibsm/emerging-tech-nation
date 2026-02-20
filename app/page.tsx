import { createServerClient } from '@/lib/supabase/server';
import BlogList from '@/components/blog/BlogList';
import type { Post } from '@/types';

export const revalidate = 3600;

async function getRecentPosts(): Promise<Post[]> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  if (error) {
    console.error('Failed to fetch recent posts:', error);
    return [];
  }

  return (data ?? []) as Post[];
}

function TechIllustration() {
  return (
    <svg
      viewBox="0 0 480 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full max-w-lg mx-auto"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nodeGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background grid */}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`h${i}`} x1="0" y1={i * 53} x2="480" y2={i * 53} stroke="#e2e8f0" strokeWidth="1" />
      ))}
      {Array.from({ length: 10 }).map((_, i) => (
        <line key={`v${i}`} x1={i * 53} y1="0" x2={i * 53} y2="480" stroke="#e2e8f0" strokeWidth="1" />
      ))}

      {/* Outer glow ring */}
      <circle cx="240" cy="240" r="180" fill="url(#coreGlow)" />

      {/* Orbital rings */}
      <circle cx="240" cy="240" r="170" stroke="#c7d2fe" strokeWidth="1" strokeDasharray="6 4" />
      <circle cx="240" cy="240" r="120" stroke="#a5b4fc" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="240" cy="240" r="70" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" />

      {/* Connection lines — outer nodes to center */}
      {[
        [240, 70], [393, 157], [393, 323], [240, 410], [87, 323], [87, 157],
      ].map(([x, y], i) => (
        <line key={`ol${i}`} x1="240" y1="240" x2={x} y2={y}
          stroke="#a5b4fc" strokeWidth="1" strokeOpacity="0.5" />
      ))}

      {/* Connection lines — mid nodes to center */}
      {[
        [240, 120], [344, 180], [344, 300], [240, 360], [136, 300], [136, 180],
      ].map(([x, y], i) => (
        <line key={`ml${i}`} x1="240" y1="240" x2={x} y2={y}
          stroke="#818cf8" strokeWidth="1" strokeOpacity="0.6" />
      ))}

      {/* Outer orbit nodes */}
      {[
        [240, 70], [393, 157], [393, 323], [240, 410], [87, 323], [87, 157],
      ].map(([cx, cy], i) => (
        <g key={`on${i}`} filter="url(#glow)">
          <circle cx={cx} cy={cy} r="10" fill="url(#nodeGrad)" />
          <circle cx={cx} cy={cy} r="14" stroke="#6366f1" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
        </g>
      ))}

      {/* Mid orbit nodes */}
      {[
        [240, 120], [344, 180], [344, 300], [240, 360], [136, 300], [136, 180],
      ].map(([cx, cy], i) => (
        <circle key={`mn${i}`} cx={cx} cy={cy} r="7" fill="#6366f1" fillOpacity="0.7" />
      ))}

      {/* Center core */}
      <circle cx="240" cy="240" r="38" fill="url(#nodeGrad)" filter="url(#glow)" />
      <circle cx="240" cy="240" r="48" stroke="#6366f1" strokeWidth="2" strokeOpacity="0.5" fill="none" />
      <circle cx="240" cy="240" r="58" stroke="#a5b4fc" strokeWidth="1" strokeOpacity="0.3" fill="none" />

      {/* Center AI text */}
      <text x="240" y="236" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="sans-serif">
        AI
      </text>
      <text x="240" y="252" textAnchor="middle" fill="white" fontSize="8" fontWeight="500" fontFamily="sans-serif" opacity="0.85">
        ENGINE
      </text>

      {/* Floating tech labels */}
      <rect x="198" y="48" width="84" height="18" rx="9" fill="#eef2ff" />
      <text x="240" y="61" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">Agentic AI</text>

      <rect x="398" y="148" width="70" height="18" rx="9" fill="#eef2ff" />
      <text x="433" y="161" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">Quantum</text>

      <rect x="398" y="314" width="70" height="18" rx="9" fill="#eef2ff" />
      <text x="433" y="327" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">Robotics</text>

      <rect x="194" y="414" width="92" height="18" rx="9" fill="#eef2ff" />
      <text x="240" y="427" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">Cybersecurity</text>

      <rect x="10" y="314" width="72" height="18" rx="9" fill="#eef2ff" />
      <text x="46" y="327" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">Space Tech</text>

      <rect x="12" y="148" width="68" height="18" rx="9" fill="#eef2ff" />
      <text x="46" y="161" textAnchor="middle" fill="#4f46e5" fontSize="9" fontWeight="600" fontFamily="sans-serif">AR / VR</text>
    </svg>
  );
}

const TOPICS = [
  { icon: '🤖', label: 'Agentic AI' },
  { icon: '⚛️', label: 'Quantum' },
  { icon: '🦾', label: 'Robotics' },
  { icon: '🛡️', label: 'Cybersecurity' },
  { icon: '🚀', label: 'Space Tech' },
  { icon: '🥽', label: 'AR / VR' },
  { icon: '🧬', label: 'Biotech' },
  { icon: '💡', label: 'Semiconductors' },
];

export default async function HomePage() {
  const posts = await getRecentPosts();

  return (
    <div>
      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-50 via-indigo-50 to-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-16 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left — text */}
            <div>
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                AI-Researched · Published Daily
              </span>

              <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 leading-tight mb-6">
                Where Emerging Technology
                <br />
                <span className="text-indigo-600">Meets Deep Insight</span>
              </h1>

              <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg">
                Daily AI-researched articles on Agentic AI, Quantum Computing, Robotics,
                Cybersecurity and more — written for the curious mind, delivered every morning.
              </p>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/blog"
                  className="inline-flex items-center px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Browse All Articles →
                </a>
                <a
                  href="/blog"
                  className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
                >
                  Latest Posts
                </a>
              </div>
            </div>

            {/* Right — illustration */}
            <div className="flex justify-center lg:justify-end">
              <TechIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* ── Topic pills ── */}
      <section className="border-b border-slate-100 bg-white py-5">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {TOPICS.map(({ icon, label }) => (
              <a
                key={label}
                href={`/blog?q=${encodeURIComponent(label.toLowerCase())}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
              >
                <span>{icon}</span>
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Latest articles ── */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <BlogList posts={posts} title="Latest Articles" />
        {posts.length > 0 && (
          <div className="text-center mt-12">
            <a
              href="/blog"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              View All Articles →
            </a>
          </div>
        )}
      </section>

      {/* ── Footer tagline ── */}
      <section className="bg-indigo-600 py-14 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold text-white mb-3">
            Stay Ahead of the Curve
          </h2>
          <p className="text-indigo-200 mb-8">
            New in-depth articles every day. No fluff, just the technologies that matter.
          </p>
          <a
            href="/blog"
            className="inline-flex items-center px-7 py-3 rounded-lg bg-white text-indigo-700 font-bold hover:bg-indigo-50 transition-colors shadow"
          >
            Start Reading →
          </a>
        </div>
      </section>
    </div>
  );
}
