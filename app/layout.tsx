import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | Emerging Tech Nation',
    default: 'Emerging Tech Nation — AI, IoT & AR/VR Insights',
  },
  description:
    'Emerging Tech Nation covers the latest breakthroughs in artificial intelligence, IoT, and augmented/virtual reality.',
  metadataBase: new URL(
    process.env.SITE_URL ?? 'https://emergingtechnation.com'
  ),
  openGraph: {
    type: 'website',
    siteName: 'Emerging Tech Nation',
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
            <a href="/" className="text-xl font-bold text-slate-900">
              Emerging Tech Nation
            </a>
            <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <a href="/blog" className="hover:text-slate-900 transition-colors">
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
