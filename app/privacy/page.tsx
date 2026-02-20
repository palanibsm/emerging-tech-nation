import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Emerging Tech Nation.',
};

export default function PrivacyPage() {
  const siteUrl = process.env.SITE_URL ?? 'https://emergingtechnation.com';
  const email = process.env.OWNER_EMAIL ?? 'contact@emergingtechnation.com';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-extrabold text-slate-900 mb-3">Privacy Policy</h1>
      <p className="text-slate-400 text-sm mb-10">Last updated: February 2026</p>

      <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">1. Overview</h2>
          <p>
            Emerging Tech Nation (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates{' '}
            <a href={siteUrl} className="text-indigo-600 hover:underline">{siteUrl}</a>.
            This page informs you of our policies regarding the collection, use, and disclosure
            of personal information when you use our site.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">2. Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Usage data:</strong> IP address, browser type, pages visited, time spent on pages, referring URLs — collected automatically via server logs and analytics tools.</li>
            <li><strong>Cookies:</strong> Small files stored on your device to improve your experience. You can instruct your browser to refuse cookies.</li>
            <li><strong>Account data:</strong> If you sign in (Google OAuth), we receive your email address and name from Google.</li>
            <li><strong>Comments:</strong> If you leave a comment, your display name and comment text are stored.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">3. Google AdSense & Advertising</h2>
          <p>
            We use Google AdSense to display advertisements. Google uses cookies to serve ads
            based on your prior visits to this or other websites. You may opt out of
            personalised advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>.
          </p>
          <p className="mt-2">
            Third-party vendors, including Google, use cookies to serve ads based on a user&apos;s
            prior visits to our website or other websites. Google&apos;s use of advertising cookies
            enables it and its partners to serve ads based on your visit to our site and/or
            other sites on the Internet.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">4. Google Analytics</h2>
          <p>
            We may use Google Analytics to understand how visitors interact with our site.
            Google Analytics collects information anonymously and reports website trends.
            To opt out, visit the{' '}
            <a href="https://tools.google.com/dlpage/gaoptout" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">
              Google Analytics Opt-out page
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">5. How We Use Your Information</h2>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>To operate and improve the website</li>
            <li>To display relevant advertisements</li>
            <li>To analyse traffic and usage patterns</li>
            <li>To respond to comments or enquiries</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">6. Third-Party Services</h2>
          <p>Our site uses the following third-party services, each with their own privacy policies:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Google AdSense</strong> — advertising</li>
            <li><strong>Google OAuth</strong> — authentication</li>
            <li><strong>Supabase</strong> — database hosting</li>
            <li><strong>Vercel</strong> — site hosting and analytics</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">7. Data Retention</h2>
          <p>
            We retain personal data only as long as necessary to provide the service.
            Account data is deleted upon request. Anonymous usage data may be retained
            for up to 26 months for analytics purposes.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">8. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data
            by contacting us at{' '}
            <a href={`mailto:${email}`} className="text-indigo-600 hover:underline">{email}</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">9. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be posted on
            this page with an updated date. Continued use of the site constitutes acceptance
            of the updated policy.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-2">10. Contact</h2>
          <p>
            If you have questions about this Privacy Policy, contact us at{' '}
            <a href={`mailto:${email}`} className="text-indigo-600 hover:underline">{email}</a>.
          </p>
        </section>

      </div>
    </div>
  );
}
