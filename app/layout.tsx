import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const siteUrl = process.env.SITE_URL ?? 'https://emergingtechnation.com';

export const metadata: Metadata = {
  title: {
    template: '%s | Emerging Tech Nation',
    default: 'Emerging Tech Nation — AI, Quantum, Robotics & Emerging Tech Insights',
  },
  description:
    'Emerging Tech Nation delivers daily insights on AI agents, quantum computing, robotics, cybersecurity, space tech, and cutting-edge emerging technologies.',
  keywords: [
    'emerging technology', 'agentic AI', 'quantum computing', 'robotics',
    'cybersecurity', 'space technology', 'IoT', 'AR VR', 'tech news', 'AI blog',
  ],
  metadataBase: new URL(siteUrl),
  alternates: { canonical: siteUrl },
  openGraph: {
    type: 'website',
    siteName: 'Emerging Tech Nation',
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    site: '@emergingtechnation',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <header className="border-b border-slate-200 bg-white sticky top-0 z-50">
          <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 text-xl font-extrabold text-slate-900 tracking-tight">
              <span className="text-indigo-600">ETN</span>
              <span className="hidden sm:inline">Emerging Tech Nation</span>
            </a>
            <div className="flex items-center gap-1 text-sm font-medium">
              <a href="/" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Home
              </a>
              <a href="/blog" className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                Blog
              </a>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="border-t border-slate-200 bg-slate-50 mt-24">
          <div className="max-w-6xl mx-auto px-4 py-8 text-center text-sm text-slate-400">
            <p>
              © {new Date().getFullYear()} Emerging Tech Nation. Powered by AI.
            </p>
            <p className="mt-2">
              <a href="/admin" className="hover:text-slate-500 transition-colors">
                Admin
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
