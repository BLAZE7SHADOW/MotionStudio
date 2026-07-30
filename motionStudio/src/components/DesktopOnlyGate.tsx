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

/**
 * True on a device that is only too narrow because it is being held upright —
 * an iPad in portrait is 820px and would pass at 1180px in landscape.
 *
 * Worth distinguishing because the advice differs: telling a tablet user to
 * "switch to a laptop" when a quarter-turn would do is advice that is simply
 * wrong, and the kind of thing that makes a product feel like it has not
 * thought about you.
 */
const ROTATABLE_QUERY = '(orientation: portrait) and (min-height: 1024px)';

export default function DesktopOnlyGate({ children, title, description }: DesktopOnlyGateProps) {
  const isDesktop = useMediaQuery(MIN_WIDTH_QUERY);
  const wouldFitRotated = useMediaQuery(ROTATABLE_QUERY);

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

      <h1 className="text-[20px] font-bold text-studio-text tracking-tight mb-2">
        {wouldFitRotated ? 'Rotate your device' : title}
      </h1>
      <p className="text-[13px] text-studio-text-muted leading-relaxed max-w-[320px]">
        {wouldFitRotated
          ? 'This screen is wide enough on its side. Turn it landscape and you can keep going here.'
          : description}
      </p>

      <p className="mt-6 text-[12px] text-studio-text-faint">
        {wouldFitRotated
          ? 'Or switch to a laptop or desktop.'
          : 'Switch to a laptop or desktop — or widen this window — to continue.'}
      </p>
    </div>
  );
}
