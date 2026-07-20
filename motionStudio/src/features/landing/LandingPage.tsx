import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clapperboard, Layers, Zap, Music, Cloud, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import AuthPanel from './components/AuthPanel';

const FEATURES = [
  {
    icon: Layers,
    title: 'Visual canvas editor',
    desc: 'Drag, resize, and layer text, images, and video on a frame-perfect canvas.',
  },
  {
    icon: Zap,
    title: 'Spring animations',
    desc: 'Keyframe timeline with spring physics, easing curves, and real-time preview.',
  },
  {
    icon: Music,
    title: 'Audio mixing',
    desc: 'Stack multiple audio tracks. Rendered sample-perfectly via OfflineAudioContext.',
  },
  {
    icon: Cloud,
    title: 'Cloud render',
    desc: 'Export on AWS Lambda — full 1080p, no CPU usage, works on any device.',
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
      <nav className="h-14 border-b border-studio-border bg-studio-panel flex items-center px-6 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-studio-sm bg-studio-accent flex items-center justify-center">
            <Clapperboard className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-studio-text">MotionStudio</span>
        </div>
      </nav>

      {/* Two-column body — stacks on small screens, side-by-side from lg up */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">

        {/* Left — product */}
        <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-16 xl:px-20">

          <div className="mb-5 lg:mb-6 inline-flex items-center gap-2 self-start">
            <span className="text-[11px] font-medium text-studio-accent bg-studio-accent-subtle border border-studio-accent-border px-2.5 py-1 rounded-full">
              Browser-based · No install needed
            </span>
          </div>

          <h1 className="text-[30px] sm:text-[36px] lg:text-[42px] leading-[1.1] font-bold text-studio-text tracking-tight mb-4">
            Build motion graphics<br />
            <span className="text-studio-accent">in your browser.</span>
          </h1>

          <p className="text-[15px] lg:text-[16px] text-studio-text-muted leading-relaxed mb-8 lg:mb-12 max-w-[480px]">
            Canvas editor, spring animations, audio mixing and cloud render —
            frame-perfect output in minutes. No plugins, no subscriptions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-[560px]">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="flex flex-col gap-2 p-4 rounded-studio-lg bg-studio-panel border border-studio-border"
              >
                <div className="w-8 h-8 rounded-studio-sm bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center">
                  <Icon className="w-4 h-4 text-studio-accent" />
                </div>
                <span className="text-[13px] font-semibold text-studio-text">{title}</span>
                <span className="text-[12px] text-studio-text-muted leading-relaxed">{desc}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[11px] text-studio-text-faint">
            Built on Remotion · WebCodecs · AWS Lambda · Supabase
          </p>
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-studio-border self-stretch" />
        <div className="lg:hidden h-px bg-studio-border" />

        {/* Right — auth */}
        <div className="w-full lg:w-[400px] shrink-0 flex items-center justify-center px-6 py-10 sm:px-10 lg:py-12 lg:overflow-y-auto">
          <AuthPanel />
        </div>
      </div>
    </div>
  );
}
