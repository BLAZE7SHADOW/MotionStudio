import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clapperboard, Music, Cloud, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePageMeta } from '@/hooks/usePageMeta';
import { track } from '@/lib/analytics';
import { profile } from '@/content/profile';
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/icons/BrandIcons';
import AuthPanel from './components/AuthPanel';
import TimelineSignature from './components/TimelineSignature';
import ProductTour from './components/ProductTour';

const PORTFOLIO_DOMAIN = profile.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '');

const SOCIALS = [
  { href: profile.socials.github, label: 'GitHub', Icon: GithubIcon, bg: '#ffffff', fg: '#0d1117' },
  { href: profile.socials.linkedin, label: 'LinkedIn', Icon: LinkedinIcon, bg: '#0A66C2', fg: '#ffffff' },
  { href: profile.socials.twitter, label: 'X (Twitter)', Icon: XIcon, bg: '#1DA1F2', fg: '#ffffff' },
] as const;

// same dot-grid the real canvas editor renders behind the composition —
// an honest callback to the actual product, not a generic gradient blob
const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 6%) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

/**
 * Counts, not prose. The four-card feature grid that used to live here said
 * the same things as ProductTour immediately below it — one description was
 * character-identical — so the page made its pitch twice before the visitor
 * reached anything they could act on. The tour keeps the explaining (it has
 * real screenshots); this states what's actually in the box.
 *
 * Keep these in step with the source arrays: TEXT_EFFECTS, SHADER_PRESETS and
 * BLOCK_PRESETS in engines/project/types.ts, and TEMPLATES in
 * content/templates. The old copy claimed 22 effects long after there were 34.
 */
const SPECS = [
  { value: '21', label: 'templates' },
  { value: '34', label: 'text effects' },
  { value: '18', label: 'shader backgrounds' },
  { value: '4', label: 'UI blocks' },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  usePageMeta({
    title: 'MotionStudio — browser-based motion graphics editor',
    description:
      'A video compositor that runs in your browser. Compose text, media and shader backgrounds on a frame-accurate timeline, cut shots to the beat of your music, and export MP4 — no install.',
    path: '/',
  });

  // already logged in → skip landing
  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true });
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-studio-bg flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-studio-text-muted" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col">
      {/* Nav */}
      <nav className="h-14 border-b border-studio-border bg-studio-panel/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-studio-sm bg-studio-accent flex items-center justify-center">
            <Clapperboard className="w-4.5 h-4.5 text-white" />
          </div>
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[17px] font-semibold tracking-tight text-studio-text"
          >
            MotionStudio
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            to="/contact"
            className="text-[13px] font-medium text-studio-text-muted hover:text-studio-text transition-colors"
          >
            Contact
          </Link>
          <a
            href="#auth"
            className="text-[13px] font-medium text-studio-text-muted hover:text-studio-text transition-colors"
          >
            Sign in
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative flex flex-col items-center text-center px-6 py-20 sm:py-28 overflow-hidden border-b border-studio-border"
        style={DOT_GRID}
      >
        {/* soft violet glow, one accent, spent in one place */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, oklch(0.627 0.265 298.232 / 18%), transparent 70%)',
          }}
        />

        <div className="relative flex flex-col items-center max-w-2xl">
          <span className="mb-6 text-[11px] font-medium text-studio-accent bg-studio-accent-subtle border border-studio-accent-border px-2.5 py-1 rounded-full">
            Browser-based · No install needed
          </span>

          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[48px] sm:text-[68px] lg:text-[76px] leading-[0.98] font-semibold text-studio-text tracking-tight mb-4"
          >
            Motion<span className="text-studio-accent">Studio</span>
            {/* Inline style, not a Tailwind class: the h1's own inline
                `fontFamily: var(--font-display)` (Bricolage) has higher
                specificity than any class, so a class-based reset would be
                silently overridden. This resets to the body's own font —
                the same face the subhead paragraph below already uses,
                unstyled. */}
            <span
              style={{ fontFamily: 'var(--font-sans)' }}
              className="block text-xl md:text-2xl font-medium text-studio-text-muted mt-2"
            >
              Browser-based motion graphics editor
            </span>
          </h1>

          <p className="text-[17px] lg:text-[19px] text-studio-text-secondary leading-snug mb-3 max-w-[480px]">
            Motion graphics, frame by frame — built in your browser.
          </p>

          <p className="text-[14px] text-studio-text-muted leading-relaxed mb-9 max-w-[440px]">
            Canvas editor, spring animations, audio mixing, and cloud render.
            No plugins, no subscriptions.
          </p>

          {/* The loudest element on the page has to be the one that keeps
              people here. It used to be the portfolio button — gradient,
              glow, hover lift — while this was a flat rectangle, so the
              strongest visual pull sent visitors off the site. Inverted, and
              instrumented: the primary CTA fired no analytics at all, which
              made hero→signup conversion unmeasurable. */}
          <a
            href="#auth"
            onClick={() => track.landingCtaClicked({ location: 'hero' })}
            className="inline-flex items-center gap-2 h-12 px-7 rounded-full text-white text-[15px] font-semibold transition-transform hover:-translate-y-0.5 mb-16"
            style={{
              background: 'linear-gradient(135deg, oklch(0.627 0.265 298.232), oklch(0.577 0.245 295) )',
              boxShadow: '0 8px 30px oklch(0.627 0.265 298.232 / 35%)',
            }}
          >
            Get started — it's free
            <ArrowRight className="w-4 h-4" />
          </a>

          <TimelineSignature />
        </div>
      </section>

      {/* What's in the box — counts, then the two things the tour doesn't show */}
      <section className="px-6 py-14 sm:py-16 border-b border-studio-border">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[13px] font-semibold text-studio-text-faint uppercase tracking-widest mb-8 text-center">
            What you get
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {SPECS.map(({ value, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 py-5 rounded-studio-lg bg-studio-panel border border-studio-border"
              >
                <span
                  style={{ fontFamily: 'var(--font-display)' }}
                  className="text-[30px] leading-none font-semibold text-studio-accent tabular-nums"
                >
                  {value}
                </span>
                <span className="text-[11px] text-studio-text-muted">{label}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex gap-3 p-4 rounded-studio-lg bg-studio-panel border border-studio-border">
              <Music className="w-4 h-4 text-studio-accent shrink-0 mt-0.5" />
              <p className="text-[13px] text-studio-text-muted leading-relaxed">
                <span className="text-studio-text font-medium">Audio mixing</span> — stack
                tracks, rendered sample-perfectly offline.
              </p>
            </div>
            <div className="flex gap-3 p-4 rounded-studio-lg bg-studio-panel border border-studio-border">
              <Cloud className="w-4 h-4 text-studio-accent shrink-0 mt-0.5" />
              <p className="text-[13px] text-studio-text-muted leading-relaxed">
                <span className="text-studio-text font-medium">Two export paths</span> — free
                and unlimited in your browser, or 1080p on AWS Lambda.
              </p>
            </div>
          </div>
        </div>
      </section>

      <ProductTour />

      {/* Auth */}
      <section id="auth" className="flex-1 flex items-center justify-center px-6 py-20 sm:py-28">
        <div className="w-full max-w-95">
          <AuthPanel />
        </div>
      </section>

      {/* Built by — a credit band, not a second landing page.
          This was a full section carrying a heading, a gradient portfolio
          button, socials and a whole contact form, taking roughly 40% of the
          height below the fold to talk about the author rather than the
          product. The form lives on /contact, which is a real route that also
          works once you're signed in — unlike this anchor, which nobody
          logged in could ever reach, since / redirects to /dashboard. */}
      <footer id="contact" className="px-6 py-10 border-t border-studio-border">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex flex-col items-center sm:items-start gap-1">
            <p className="text-[13px] text-studio-text-muted">
              Built by{' '}
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noreferrer"
                className="text-studio-text font-medium hover:text-studio-accent transition-colors inline-flex items-center gap-1"
              >
                {profile.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
            <p className="text-[11px] text-studio-text-faint">
              {PORTFOLIO_DOMAIN} ·{' '}
              <Link to="/contact" className="hover:text-studio-text-muted transition-colors">
                Get in touch
              </Link>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-studio-border text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-studio-text-faint">
          Built on Remotion · WebCodecs · AWS Lambda · Supabase
        </p>
      </footer>
    </div>
  );
}
