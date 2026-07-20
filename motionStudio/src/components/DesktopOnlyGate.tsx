import type { ReactNode } from 'react';
import { MonitorSmartphone, Clapperboard } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// The editor and dashboard rely on fixed multi-panel layouts (timeline, canvas,
// properties) that don't fit — or make sense — below a laptop-sized viewport.
const MIN_WIDTH_QUERY = '(min-width: 1024px)';

interface DesktopOnlyGateProps {
  children: ReactNode;
  title: string;
  description: string;
}

export default function DesktopOnlyGate({ children, title, description }: DesktopOnlyGateProps) {
  const isDesktop = useMediaQuery(MIN_WIDTH_QUERY);

  if (isDesktop) return <>{children}</>;

  return (
    <div className="min-h-screen bg-studio-bg flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-7 h-7 rounded-studio-sm bg-studio-accent flex items-center justify-center">
          <Clapperboard className="w-4 h-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-studio-text">MotionStudio</span>
      </div>

      <div className="w-14 h-14 rounded-studio-lg bg-studio-accent-subtle border border-studio-accent-border flex items-center justify-center mb-5">
        <MonitorSmartphone className="w-6 h-6 text-studio-accent" />
      </div>

      <h1 className="text-[20px] font-bold text-studio-text tracking-tight mb-2">{title}</h1>
      <p className="text-[13px] text-studio-text-muted leading-relaxed max-w-[320px]">{description}</p>

      <p className="mt-6 text-[12px] text-studio-text-faint">
        Switch to a laptop or desktop — or widen this window — to continue.
      </p>
    </div>
  );
}
