import { Link } from 'react-router-dom';
import { Clapperboard, ArrowLeft, ExternalLink } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { profile } from '@/content/profile';
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/icons/BrandIcons';
import CopyEmail from '@/components/CopyEmail';
import ContactForm from '@/components/ContactForm';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 6%) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const PORTFOLIO_DOMAIN = profile.portfolio.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* Brand colours, as the landing page's version had — the point of these is to
   be recognisable at a glance, which a monochrome outline isn't. */
const SOCIALS = [
  { href: profile.socials.github, label: 'GitHub', Icon: GithubIcon, bg: '#ffffff', fg: '#0d1117' },
  { href: profile.socials.linkedin, label: 'LinkedIn', Icon: LinkedinIcon, bg: '#0A66C2', fg: '#ffffff' },
  { href: profile.socials.twitter, label: 'X (Twitter)', Icon: XIcon, bg: '#1DA1F2', fg: '#ffffff' },
] as const;

/**
 * The contact surface, now that the landing page carries only a credit band.
 *
 * Deliberately no bio, avatar, location, availability or résumé: this is the
 * "how to reach the person who made this" page for someone using a product,
 * not a CV. Anyone who wants the full story has the portfolio link.
 */
export default function ContactPage() {
  usePageMeta({
    title: `Contact — ${profile.name} — MotionStudio`,
    description: `Reach ${profile.name}, the person behind MotionStudio — a browser-based motion graphics editor.`,
    path: '/contact',
  });

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col">
      <nav className="h-14 border-b border-studio-border bg-studio-panel/80 backdrop-blur-sm flex items-center justify-between px-6 shrink-0 sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-studio-sm bg-studio-accent flex items-center justify-center">
            <Clapperboard className="w-4.5 h-4.5 text-white" />
          </div>
          <span
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[17px] font-semibold tracking-tight text-studio-text"
          >
            MotionStudio
          </span>
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-studio-text-muted hover:text-studio-text transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
      </nav>

      <section
        className="relative flex-1 flex flex-col items-center px-6 py-16 sm:py-20"
        style={DOT_GRID}
      >
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, oklch(0.627 0.265 298.232 / 14%), transparent 70%)',
          }}
        />

        <div className="relative w-full max-w-2xl text-center">
          <span className="mb-5 inline-block text-[11px] font-medium text-studio-accent bg-studio-accent-subtle border border-studio-accent-border px-2.5 py-1 rounded-full">
            Made by a solo engineer
          </span>

          <h1
            style={{ fontFamily: 'var(--font-display)' }}
            className="text-[26px] sm:text-[32px] font-semibold text-studio-text tracking-tight mb-1.5"
          >
            {profile.name}
          </h1>
          <p className="text-[13px] text-studio-text-muted mb-7">{profile.role}</p>

          {/* Portfolio — the domain is visible so it reads as a real place you
              can go, rather than a generic "view my work" button. */}
          <a
            href={profile.portfolio}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-11 px-6 rounded-full text-[15px] font-semibold text-white mb-6 transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, oklch(0.627 0.265 298.232), oklch(0.577 0.245 295))',
              boxShadow: '0 8px 30px oklch(0.627 0.265 298.232 / 30%)',
            }}
          >
            {PORTFOLIO_DOMAIN}
            <ExternalLink className="w-4 h-4" />
          </a>

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

          <div className="rounded-studio-lg bg-studio-panel border border-studio-border p-6 text-left">
            <ContactForm />
          </div>
        </div>
      </section>

      <footer className="px-6 py-6 border-t border-studio-border text-center">
        <p className="text-[11px] text-studio-text-faint">
          Built on Remotion · WebCodecs · AWS Lambda · Supabase
        </p>
      </footer>
    </div>
  );
}
