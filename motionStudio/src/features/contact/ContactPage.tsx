import { Link } from 'react-router-dom';
import { Clapperboard, ArrowLeft, Mail, MapPin, FileDown, ExternalLink } from 'lucide-react';
import { profile } from '@/content/profile';
import { GithubIcon, LinkedinIcon, XIcon } from '@/components/icons/BrandIcons';
import ContactForm from '@/components/ContactForm';

const DOT_GRID: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, oklch(1 0 0 / 6%) 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

const SOCIALS = [
  { href: profile.socials.github, label: 'GitHub', Icon: GithubIcon },
  { href: profile.socials.linkedin, label: 'LinkedIn', Icon: LinkedinIcon },
  { href: profile.socials.twitter, label: 'X (Twitter)', Icon: XIcon },
] as const;

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-studio-bg flex flex-col">
      {/* Nav */}
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

        <div className="relative w-full max-w-2xl">
          <div className="text-center mb-10">
            <span className="mb-4 inline-block text-[11px] font-medium text-studio-accent bg-studio-accent-subtle border border-studio-accent-border px-2.5 py-1 rounded-full">
              Get in touch
            </span>
            <h1
              style={{ fontFamily: 'var(--font-display)' }}
              className="text-[32px] sm:text-[40px] leading-[1.05] font-semibold text-studio-text tracking-tight"
            >
              Contact
            </h1>
          </div>

          {/* Builder card */}
          <div className="rounded-studio-lg bg-studio-panel border border-studio-border p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-14 h-14 rounded-full object-cover border border-studio-border-strong shrink-0"
                onError={(e) => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }}
              />
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-studio-text truncate">{profile.name}</p>
                <p className="text-[12px] text-studio-text-muted truncate">{profile.role}</p>
                <p className="text-[11px] text-studio-text-faint flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {profile.location}
                </p>
              </div>
            </div>

            <p className="text-[13px] text-studio-text-secondary leading-relaxed mb-4">
              I {profile.tagline} MotionStudio is something I designed and built myself —
              a browser-based motion graphics editor from canvas to cloud render.
            </p>

            <p className="text-[11px] text-studio-accent bg-studio-accent-subtle border border-studio-accent-border rounded-full px-2.5 py-1 inline-block mb-5">
              {profile.status}
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={profile.portfolio}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-studio-md bg-studio-accent hover:bg-studio-accent-hover text-white text-[12.5px] font-medium transition-colors"
              >
                View my portfolio
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <a
                href={profile.resume}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-studio-md bg-studio-surface hover:bg-studio-border border border-studio-border text-studio-text text-[12.5px] font-medium transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                Resume
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-studio-md bg-studio-surface hover:bg-studio-border border border-studio-border text-studio-text text-[12.5px] font-medium transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                Email
              </a>

              <div className="flex items-center gap-1 ml-auto">
                {SOCIALS.map(({ href, label, Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={label}
                    className="w-9 h-9 rounded-studio-md border border-studio-border flex items-center justify-center text-studio-text-muted hover:text-studio-text hover:border-studio-border-strong transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-studio-lg bg-studio-panel border border-studio-border p-6">
            <h2 className="text-[14px] font-semibold text-studio-text mb-1">Send a message</h2>
            <p className="text-[12px] text-studio-text-muted mb-5">
              Questions, feedback, or just want to say hi — I read everything.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
