import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Layers, Zap, Music, Cloud, Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { profile } from '@/content/profile';
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/icons/BrandIcons';
import CopyEmail from '@/components/CopyEmail';
import ContactForm from '@/components/ContactForm';
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

const FEATURES = [
  {
    icon: Layers,
    title: 'Visual canvas editor',
    desc: 'Drag, resize, and layer text, images, and video on a frame-perfect canvas.',
    tag: 'drag · resize · layer',
  },
  {
    icon: Zap,
    title: 'Spring animations',
    desc: 'Keyframe timeline with spring physics, easing curves, and real-time preview.',
    tag: 'spring() · easing',
  },
  {
    icon: Music,
    title: 'Audio mixing',
    desc: 'Stack multiple audio tracks. Rendered sample-perfectly via OfflineAudioContext.',
    tag: 'OfflineAudioContext',
  },
  {
    icon: Cloud,
    title: 'Cloud render',
    desc: 'Export on AWS Lambda — full 1080p, no CPU usage, works on any device.',
    tag: 'AWS Lambda · 1080p',
  },
] as const;

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
          <a
            href="#contact"
            className="text-[13px] font-medium text-studio-text-muted hover:text-studio-text transition-colors"
          >
            Contact
          </a>
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
          </h1>

          <p className="text-[17px] lg:text-[19px] text-studio-text-secondary leading-snug mb-3 max-w-[480px]">
            Motion graphics, frame by frame — built in your browser.
          </p>

          <p className="text-[14px] text-studio-text-muted leading-relaxed mb-9 max-w-[440px]">
            Canvas editor, spring animations, audio mixing, and cloud render.
            No plugins, no subscriptions.
          </p>

          <a
            href="#auth"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover text-white text-[14px] font-medium transition-colors mb-16"
          >
            Get started — it's free
            <ArrowRight className="w-4 h-4" />
          </a>

          <TimelineSignature />
        </div>
      </section>

      {/* Features — styled like the app's own layer rows, not generic icon cards */}
      <section className="px-6 py-16 sm:py-20 border-b border-studio-border">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[13px] font-semibold text-studio-text-faint uppercase tracking-widest mb-8">
            What's on the timeline
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FEATURES.map(({ icon: Icon, title, desc, tag }) => (
              <div
                key={title}
                className="flex gap-4 p-5 rounded-studio-lg bg-studio-panel border border-studio-border border-l-2 border-l-studio-accent"
              >
                <div className="w-9 h-9 rounded-studio-sm bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-studio-accent" />
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[14px] font-semibold text-studio-text">{title}</span>
                    <span className="font-mono text-[10px] text-studio-text-faint tracking-wide">{tag}</span>
                  </div>
                  <span className="text-[13px] text-studio-text-muted leading-relaxed">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ProductTour />

      {/* Stats — real substance, not decoration */}
      <section className="px-6 py-10 border-b border-studio-border">
        <p className="text-center font-mono text-[12px] text-studio-text-faint tracking-wide">
          5K+ lines of strict TypeScript · 7 engines · 22 text effects · 18 shaders
        </p>
      </section>

      {/* Auth */}
      <section id="auth" className="flex-1 flex items-center justify-center px-6 py-20 sm:py-28">
        <div className="w-full max-w-95">
          <AuthPanel />
        </div>
      </section>

      {/* Connect — who built this, and how to reach them */}
      <section id="contact" className="px-6 py-16 sm:py-20 border-t border-studio-border">
        <div className="max-w-2xl mx-auto text-center">
          <span className="mb-5 inline-block text-[11px] font-medium text-studio-accent bg-studio-accent-subtle border border-studio-accent-border px-2.5 py-1 rounded-full">
            Made by a solo engineer
          </span>

          <h2
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[26px] sm:text-[32px] font-semibold text-studio-text tracking-tight mb-1.5"
          >
            {profile.name}
          </h2>
          <p className="text-[13px] text-studio-text-muted mb-7">{profile.role}</p>

          {/* Portfolio — the headline highlight, real domain visible so it reads as a real link */}
          <a
            href={profile.portfolio}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-semibold text-white mb-6 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, oklch(0.627 0.265 298.232), oklch(0.627 0.265 298.232 / 70%))',
              boxShadow: '0 8px 30px oklch(0.627 0.265 298.232 / 30%)',
            }}
          >
            {PORTFOLIO_DOMAIN}
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Email + socials */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            <CopyEmail email={profile.email} />
            {SOCIALS.map(({ href, label, Icon, bg, fg }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                title={label}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:-translate-y-0.5 hover:scale-105"
                style={{ backgroundColor: bg, color: fg }}
              >
                <Icon className="w-4.5 h-4.5" />
              </a>
            ))}
          </div>

          {/* Message form */}
          <div className="rounded-studio-lg bg-studio-panel border border-studio-border p-6 text-left">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-studio-border text-center">
        <p className="text-[11px] text-studio-text-faint">
          Built on Remotion · WebCodecs · AWS Lambda · Supabase
        </p>
      </footer>
    </div>
  );
}
